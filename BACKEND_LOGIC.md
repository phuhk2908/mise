# Mise — Backend & Logic Specification

> This document defines the server-side and client-side logic Mise needs beyond the UI layer. It covers data models, algorithms, AI integrations, storage, and the decision tree for on-device vs. cloud processing.

---

## 1. Architecture Philosophy

Mise is **offline-first by default**. All core data (recipes, meal plans, shopping lists) is stored locally in SQLite. The app works fully without a network connection.

### Current Phase: Local-Only (SQLite)
This project uses **SQLite via `expo-sqlite`** as the primary data store. See [Section 4](#4-storage-layer) for the full schema. There is no backend server in this phase.

### Future Phase: NestJS + PostgreSQL (Planned)
When a backend is introduced, the architecture will migrate to a **NestJS API with PostgreSQL**. The client will keep SQLite as a local cache and sync with the server when online. This preserves the offline-first behavior while enabling cross-device sync, cloud backups, and AI services (OCR, voice parsing).

### Capability Matrix (Current)

| Capability | Status | On-Device | Cloud Service | Fallback |
|---|---|---|---|---|
| Recipe storage | ✅ | SQLite | ❌ None | Works offline |
| Recipe search | ✅ | FTS5 / LIKE fallback | ❌ None | Works offline |
| Meal plan storage | ✅ | SQLite | ❌ None | Works offline |
| Shopping list storage | ✅ | SQLite | ❌ None | Works offline |
| Photo → Recipe (OCR) | 🏗️ UI only | 🚧 Limited | ✅ OCR API | User types manually |
| Voice → Recipe (STT) | 🏗️ UI only | ✅ Device STT | ✅ Whisper API | User types manually |
| Text → Recipe (NLP) | 🏗️ UI only | 🚧 Small model | ✅ LLM API | User types manually |
| Ingredient categorization | ✅ | Heuristic | ✅ ML classifier | Default to "Other" |
| Unit conversion | ✅ | Lookup tables | ❌ None | Works offline |
| Shopping list merge | ✅ | Pure function | ❌ None | Works offline |

**Rule:** Every feature must have a graceful offline fallback. Cloud calls are optimizations, not requirements.

---

## 2. Data Models

### 2.1 Recipe

```typescript
interface Recipe {
  id: string;                    // UUID v4
  title: string;                 // Required, 1–200 chars
  description: string;           // Optional, 0–500 chars
  prepTime: string;              // e.g. "15 min", free text for now
  cookTime: string;              // e.g. "20 min"
  totalTime?: string;            // Computed or user-entered
  servings: number;              // Base recipe yield, ≥ 1
  tags: string[];                // User-defined or auto-extracted
  source?: string;               // "Manual", "Photo", "Voice", URL, etc.
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  imageUri?: string;             // Local file path or base64 thumbnail

  ingredients: Ingredient[];
  instructions: Instruction[];
  notes?: string;                // User-added notes
}
```

### 2.2 Ingredient

```typescript
interface Ingredient {
  id: string;                    // UUID within recipe
  name: string;                  // e.g. "all-purpose flour"
  amount: number;                // Scalar value, ≥ 0
  unit: string;                  // Normalized unit code
  originalUnit?: string;         // As-entered (for reference)
  category?: string;             // "produce", "dairy", "pantry", etc.
  optional: boolean;             // Default false
  notes?: string;                // e.g. "sifted", "room temperature"
}
```

### 2.3 Instruction

```typescript
interface Instruction {
  id: string;                    // UUID or index
  stepNumber: number;            // 1-based
  text: string;                  // Plain text instruction
  duration?: number;             // Optional timer in seconds
  imageUri?: string;             // Optional step image
}
```

### 2.4 Meal Plan

```typescript
interface MealPlan {
  id: string;                    // UUID
  weekStart: string;             // ISO date (Monday)
  days: PlanDay[];
}

interface PlanDay {
  date: string;                  // ISO date
  meals: {
    breakfast?: PlannedMeal;
    lunch?: PlannedMeal;
    dinner?: PlannedMeal;
    snack?: PlannedMeal;
  };
}

interface PlannedMeal {
  recipeId: string;
  servings: number;              // Override default recipe servings
  notes?: string;
}
```

### 2.5 Shopping List

```typescript
interface ShoppingList {
  id: string;
  name: string;                  // e.g. "Week of June 9"
  createdAt: string;
  items: ShoppingItem[];
}

interface ShoppingItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;               // "Produce", "Dairy & Eggs", etc.
  checked: boolean;
  sourceRecipeIds: string[];      // Track which recipes contributed
  isCustom: boolean;             // User-added, not from recipe
}
```

---

## 3. Core Algorithms

### 3.1 Ingredient Normalization

**Problem:** "2 cups flour", "2 c. flour", "two cups flour", and "2 C flour" must all be understood as the same thing.

**Pipeline:**
```
Raw text
  → Tokenize (split on whitespace, preserve numbers)
  → Number parsing: convert word numbers ("two") → 2, fraction parsing ("1½") → 1.5
  → Unit matching: fuzzy match against unit alias table
  → Name extraction: everything after number+unit is the ingredient name
  → Name cleaning: lowercase, trim descriptors (", diced", "- minced")
  → Output: { amount, unit, name, originalText }
```

**Unit Alias Table:**
| Canonical | Aliases |
|---|---|
| `tsp` | teaspoon, teaspoons, tsp., tspn |
| `tbsp` | tablespoon, tablespoons, tbsp., tbs |
| `cup` | cups, c. |
| `oz` | ounce, ounces |
| `lb` | pound, pounds, lbs |
| `g` | gram, grams, gramme |
| `kg` | kilogram, kilograms |
| `ml` | milliliter, milliliters, millilitre |
| `l` | liter, liters, litre, litres |
| `pc` | piece, pieces |
| `clove` | cloves |

### 3.2 Unit Conversion & Scaling

**Categories:** Volume, Weight, Count, Length  
**Rule:** Only merge ingredients within the same category. Do not convert volume to weight (flour density varies) unless explicitly configured.

**Scaling Formula:**
```
scaledAmount = baseAmount × (targetServings / baseServings)
roundedAmount = roundToNearestEighth(scaledAmount)
```

**Simplification:** After scaling, attempt to up-convert to a more convenient unit:
- 3 tsp → 1 tbsp
- 16 tbsp → 1 cup
- 1000 g → 1 kg
- 16 oz → 1 lb

**Fraction Display:**
- 1.5 → "1½"
- 0.75 → "¾"
- 2.333 → "2⅓"
- 0.125 → "⅛"
- 3.0 → "3"

### 3.3 Shopping List Merge Algorithm

```typescript
function mergeIngredients(ingredients: Ingredient[]): ShoppingItem[] {
  const buckets = new Map<string, ShoppingItem>();

  for (const ing of ingredients) {
    const normalizedName = normalizeName(ing.name);      // "flour" ← "all-purpose flour"
    const normalizedUnit = normalizeUnit(ing.unit);       // "cup"
    const category = ing.category || categorize(ing.name);
    const key = `${normalizedName}::${normalizedUnit}`;

    if (buckets.has(key)) {
      const existing = buckets.get(key)!;
      existing.amount += ing.amount;
      existing.sourceRecipeIds.push(ing.recipeId);
    } else {
      buckets.set(key, {
        id: generateId(),
        name: ing.name,          // Keep first-seen display name
        amount: ing.amount,
        unit: normalizedUnit,
        category,
        checked: false,
        sourceRecipeIds: [ing.recipeId],
        isCustom: false,
      });
    }
  }

  return Array.from(buckets.values());
}
```

**Important:** If two ingredients have the same name but **different unit categories** (e.g., "1 cup flour" vs "200g flour"), they are **NOT merged**. They appear as separate items. A future enhancement could allow user-configured density conversions.

### 3.4 Ingredient Categorization

**Heuristic Approach (On-Device):**

A keyword-based classifier with category priority. First match wins.

```typescript
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: [
    "lettuce", "tomato", "onion", "garlic", "mushroom", "blueberry",
    "lemon", "shallot", "potato", "carrot", "spinach", "apple",
    "banana", "herb", "parsley", "cilantro", "basil"
  ],
  dairy: [
    "cheese", "cream", "milk", "buttermilk", "butter", "yogurt",
    "egg", "eggs", "mozzarella", "parmesan", "cheddar"
  ],
  meat: [
    "beef", "chicken", "pork", "meat", "fish", "salmon", "shrimp",
    "bacon", "sausage", "turkey", "lamb"
  ],
  pantry: [
    "flour", "oil", "seasoning", "broth", "rice", "wine", "tortilla",
    "pasta", "sugar", "salt", "pepper", "vinegar", "soy sauce",
    "honey", "maple syrup", "baking powder", "baking soda", "vanilla"
  ],
  frozen: [
    "frozen", "peas", "ice cream", "pizza"
  ],
  bakery: [
    "bread", "bun", "roll", "baguette", "croissant", "tortilla"
  ],
};
```

**Future: ML Classifier**  
Train a lightweight text classifier (e.g., TensorFlow Lite or ONNX) on a labeled ingredient dataset for higher accuracy, especially for ambiguous items like "tortillas" (pantry vs. bakery).

---

## 4. Storage Layer

### 4.1 Local Database: SQLite (Recommended)

AsyncStorage is simple but becomes slow and unreliable at >1000 keys. SQLite with [`expo-sqlite`](https://docs.expo.dev/versions/v54.0.0/sdk/sqlite/) is the production choice.

**Schema:**

```sql
-- Recipes
CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prep_time TEXT,
  cook_time TEXT,
  total_time TEXT,
  servings INTEGER NOT NULL,
  tags TEXT,                    -- JSON array
  source TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  image_uri TEXT,
  notes TEXT
);

-- Ingredients (one-to-many with recipes)
CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  original_unit TEXT,
  category TEXT,
  optional INTEGER DEFAULT 0,
  notes TEXT
);

-- Instructions
CREATE TABLE instructions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  duration INTEGER,
  image_uri TEXT
);

-- Meal Plans
CREATE TABLE meal_plans (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE planned_meals (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES meal_plans(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id TEXT NOT NULL REFERENCES recipes(id),
  servings INTEGER NOT NULL,
  notes TEXT
);

-- Shopping Lists
CREATE TABLE shopping_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE shopping_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  category TEXT NOT NULL,
  checked INTEGER DEFAULT 0,
  source_recipe_ids TEXT,       -- JSON array
  is_custom INTEGER DEFAULT 0
);
```

### 4.2 Full-Text Search

Enable FTS5 on recipes for instant title/description search:

```sql
CREATE VIRTUAL TABLE recipes_fts USING fts5(
  title, description,
  content='recipes',
  content_rowid='rowid'
);

-- Trigger to keep FTS index in sync
CREATE TRIGGER recipes_fts_insert AFTER INSERT ON recipes BEGIN
  INSERT INTO recipes_fts(rowid, title, description)
  VALUES (new.rowid, new.title, new.description);
END;
```

### 4.3 Migration Strategy

Current mock data will migrate to SQLite on first launch:

```typescript
async function migrateMockData(db: SQLiteDatabase) {
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM recipes'
  );
  if (count && count.count > 0) return; // Already migrated

  for (const recipe of mockRecipes) {
    await insertRecipe(db, recipe);
  }
}
```

---

## 5. AI / Cloud Services

### 5.1 Photo → Recipe Pipeline

```
User takes photo
  → [Device] Resize / compress image (max 1920px wide)
  → [Cloud] OCR API (e.g. Google Vision, Azure Vision, or Tesseract)
     → Returns raw text block
  → [Cloud] Recipe Parser (LLM or fine-tuned model)
     → Prompt: "Extract title, ingredients list, and steps from this recipe text."
     → Returns JSON: { title, ingredients[], instructions[] }
  → [Device] Render review screen with inline editing
  → [Device] User corrects errors, taps Save
  → [Device] Store in SQLite
```

**On-Device Alternative (Privacy-First):**
- Use ML Kit Text Recognition (on-device OCR)
- Use a small on-device T5/BERT model for entity extraction
- Trade-off: lower accuracy, especially for handwritten text

### 5.2 Voice → Recipe Pipeline

```
User taps mic button
  → [Device] Start recording audio
  → [Device] Stream to device STT (iOS Speech / Android SpeechRecognizer)
     OR [Cloud] Stream to Whisper API
  → [Device] Display live transcription
  → [Device] User taps Done
  → [Cloud] Recipe Parser (same as photo pipeline)
  → [Device] Review + edit + save
```

**Offline Voice:**
- iOS/Android native speech recognition works offline in some languages
- Whisper requires network (or a large on-device model ~500MB)

### 5.3 Ingredient Categorization (Cloud Enhancement)

If categorization confidence is low (< 0.7), send to a cloud classifier:

```typescript
async function categorizeIngredient(name: string): Promise<string> {
  const heuristic = heuristicCategorize(name);
  if (heuristic.confidence > 0.7) return heuristic.category;

  // Fallback to cloud
  const result = await api.classifyIngredient(name);
  return result.category;
}
```

### 5.4 API Specification (Proposed)

```yaml
openapi: 3.0.0
info:
  title: Mise AI API
  version: 1.0.0
paths:
  /parse-recipe:
    post:
      summary: Extract structured recipe from text
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                text: { type: string }
                source: { type: string, enum: [photo, voice, text] }
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  title: { type: string }
                  description: { type: string }
                  prepTime: { type: string }
                  cookTime: { type: string }
                  servings: { type: number }
                  ingredients:
                    type: array
                    items:
                      type: object
                      properties:
                        name: { type: string }
                        amount: { type: number }
                        unit: { type: string }
                  instructions:
                    type: array
                    items: { type: string }

  /classify-ingredient:
    post:
      summary: Categorize a single ingredient
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  category: { type: string }
                  confidence: { type: number }
```

---

## 6. Security & Privacy

| Concern | Approach |
|---|---|
| **Recipe data** | Never leaves device unless user explicitly exports |
| **Photos** | Processed in-memory; original discarded after parsing unless user saves |
| **Voice audio** | Streamed to STT; not stored server-side |
| **Cloud API keys** | Stored in environment / build config, never in source |
| **Backups** | Optional iCloud/Google Drive export; user-initiated only |

---

## 7. Error Handling

| Scenario | Behavior |
|---|---|
| OCR returns gibberish | Show raw text + highlight low-confidence fields; force user review |
| STT fails (no network) | Show "No connection — try again or type manually" |
| Parser returns invalid JSON | Show raw text in manual entry form pre-filled |
| SQLite corrupts | Detect on launch, offer to reset or restore from backup |
| Unit conversion impossible | Show original units side-by-side; do not guess |

---

## 8. Testing Strategy

| Layer | Approach |
|---|---|
| Unit conversion | Property-based tests: `scaleAmount(original, ratio) / ratio ≈ original` |
| Ingredient merge | Fuzz tests with randomized ingredient lists |
| NLP parser | Gold-standard dataset: 100 hand-labeled recipes; compare F1 score |
| SQLite schema | Migration tests: apply v1 → v2 → v3, verify data integrity |
| E2E | Maestro or Detox: add recipe → plan meal → generate list → check off item |

---

## 9. Future Backend Considerations

### Optional: Recipe Discovery API
If we add a "discover" tab for public recipes:
- Curated recipe JSON feed (static CDN, no server needed)
- Community submissions moderated
- No user-generated content platform (legal/liability issues)

### Optional: Nutritional Data
- Integration with USDA FoodData Central or Edamam API
- Store nutritional cache locally per ingredient
- Compute per-recipe nutrition summary

### Optional: Grocery Price API
- Third-party integration (e.g. Kroger, Instacart) for price estimates
- Requires OAuth + partnership; future consideration only
