# Mise — Product Requirements Document

**Version:** 1.0.0  
**Date:** 2026-06-09  
**Status:** In Development  

---

## 1. Product Vision

Mise is a **recipe organizer + meal planner + shopping list generator** for home cooks who want to stay organized without friction. It bridges the gap between "I found a great recipe" and "I have everything I need to cook it." The app is intentionally offline-first: no account, no cloud dependency, no subscription wall.

### One-Sentence Pitch
> Collect recipes, plan your week, and walk into the grocery store with one clean, deduplicated shopping list — all from your pocket, even without a signal.

### Design Pillars
1. **Calm** — No notifications, no badges, no urgency. Cooking is already stressful.
2. **Tactile** — The UI feels like a well-organized kitchen: warm, clean, grounded.
3. **Offline** — Your data is yours. The app works in airplane mode.
4. **Fast** — Every action is immediate. No loading spinners for local data.

---

## 2. Target Audience

| Segment | Needs | How Mise Serves |
|---|---|---|
| **Weekly meal preppers** | Plan 5–7 dinners, shop once | Weekly planner + merged shopping list |
| **Recipe collectors** | Save recipes from everywhere | Photo scan, voice input, manual entry |
| **Home cooks on a budget** | Reduce waste, buy only what's needed | Smart deduplication + exact amounts |
| **Cooks in rural/limited-connectivity areas** | No reliable internet | Full offline functionality |
| **People who hate subscriptions** | One-time purchase or free | No account required, no paywall |

### User Persona: "Sarah"
- 34, works from home, cooks dinner for a family of 4
- Collects recipes from Instagram, cookbooks, and her mom's texts
- Plans Sunday grocery runs for the week
- Frustrated by recipe apps that force accounts, show ads, or lose her data when offline

---

## 3. Feature Specification

### 3.1 Recipe Library

**User Stories**
- As a user, I can view all my saved recipes in a scrollable list.
- As a user, I can filter recipes by tags (Dinner, Quick, Vegetarian, etc.).
- As a user, I can search recipes by title or description with instant results.
- As a user, I can tap a recipe to see full details: ingredients, instructions, timing.

**Requirements**
- List view with title, tag chips, prep time, and serving count
- Filter bar with horizontal scroll chips
- Search bar at top of Home tab; filters in real-time
- Empty states for no results, no recipes yet

**Acceptance Criteria**
- [ ] Search returns results within 100ms (local data)
- [ ] Filter chips show active state with primary color fill
- [ ] Recipe list scrolls at 60fps with 50+ recipes
- [ ] Empty state includes a CTA to add a recipe

---

### 3.2 Recipe Detail

**User Stories**
- As a user, I can read a recipe's ingredients and step-by-step instructions.
- As a user, I can scale servings up or down and see ingredient amounts recalculate.
- As a user, I can edit any ingredient inline if the parser got it wrong.
- As a user, I can delete an ingredient I don't need.
- As a user, I can add a recipe's ingredients to my shopping list.

**Requirements**
- Serving scaler: 1–24 servings with +/- stepper
- Ingredient rows show amount, unit, and name
- Inline editing: tap ingredient to edit any field
- Amount scaling uses ratio math with fraction display (e.g., 1⅓ instead of 1.333)
- Sticky header on scroll with recipe title

**Acceptance Criteria**
- [ ] Scaling 4-serving recipe to 6 servings updates all amounts correctly
- [ ] Fractions display as mixed numbers (1½, ¾, 2⅓)
- [ ] Inline edit saves immediately to local state
- [ ] "Add to Shopping List" button routes to Shopping tab with items merged

---

### 3.3 Add Recipe (Three Input Methods)

#### 3.3.1 Manual Entry
**User Stories**
- As a user, I can type a recipe title, description, prep/cook time, and base servings.
- As a user, I can add ingredients one by one with amount, unit, and name.
- As a user, I can add numbered cooking steps.

**Requirements**
- Form with validation (title required)
- Dynamic ingredient rows with add/remove
- Dynamic step rows with add/remove
- Unit picker dropdown with common cooking units
- Save stores recipe to local database

#### 3.3.2 Photo Scan
**User Stories**
- As a user, I can take a photo of a cookbook page or handwritten recipe.
- As a user, I can pick an existing image from my gallery.
- As a user, I can review and edit the auto-extracted recipe before saving.

**Requirements**
- Camera capture with Expo Camera
- Gallery picker with Expo Image Picker
- OCR extracts text from image
- NLP parses text into structured recipe (title, ingredients, steps)
- Review screen with inline editing for corrections

**Backend Dependency:** OCR + recipe-parsing model (see [BACKEND_LOGIC.md](BACKEND_LOGIC.md))

#### 3.3.3 Voice Input
**User Stories**
- As a user, I can dictate a recipe hands-free while cooking.
- As a user, I can speak ingredients and steps naturally.
- As a user, I can review and edit the transcribed recipe before saving.

**Requirements**
- Tap-to-record button with visual feedback (pulsing mic)
- Speech-to-text with local or cloud transcription
- NLP segments speech into ingredients vs. instructions
- Review screen with inline editing

**Backend Dependency:** Speech-to-text + recipe-parsing model (see [BACKEND_LOGIC.md](BACKEND_LOGIC.md))

---

### 3.4 Meal Planner

**User Stories**
- As a user, I can plan meals for a specific day.
- As a user, I can view a week at a glance and assign recipes to days.
- As a user, I can drag recipes from my library into plan slots.
- As a user, I can remove a planned meal.
- As a user, I can duplicate a meal plan to the next week.

**Requirements**
- Day view: Breakfast / Lunch / Dinner / Snack slots
- Week view: 7-day horizontal or vertical grid
- Recipe picker modal from library
- Drag-and-drop or tap-to-assign
- Clear week button with confirmation
- Duplicate week button

**Acceptance Criteria**
- [ ] Plan persists across app restarts (local storage)
- [ ] Changing serving count in a planned meal updates the shopping list
- [ ] Empty slots show placeholder "+ Add meal"

---

### 3.5 Shopping List Generator

**User Stories**
- As a user, I can generate a shopping list from my meal plan.
- As a user, I can generate a shopping list from a single recipe.
- As a user, I see ingredients grouped by grocery category (Produce, Dairy, Meat, Pantry, etc.).
- As a user, I see duplicate ingredients merged (e.g., 2 cups flour + 1 cup flour → 3 cups flour).
- As a user, I can check off items as I shop.
- As a user, I can clear checked items.
- As a user, I can add one-off items not tied to a recipe.

**Requirements**
- Merge logic: same name + compatible unit category
- Category grouping: Produce, Dairy & Eggs, Meat & Seafood, Pantry, Frozen, Bakery, Other
- Category order fixed for store walk efficiency
- Checkboxes with strikethrough on checked items
- "Clear checked" button appears when ≥1 item checked
- Add custom item button with manual category selection

**Acceptance Criteria**
- [ ] "2 cups milk" + "1 cup milk" → "3 cups milk" (same unit)
- [ ] "500g chicken" + "1 lb chicken" → converts to common unit or lists separately if no conversion
- [ ] Categories sort: Produce → Dairy → Meat → Pantry → Frozen → Bakery → Other
- [ ] Checked items can be cleared in one tap
- [ ] List persists offline

---

### 3.6 Settings & Preferences

**User Stories**
- As a user, I can choose Light, Dark, or System theme.
- As a user, I can see app version and build info.
- As a user, I can export my recipe collection.
- As a user, I can import recipes from a file.
- As a user, I can reset all data with confirmation.

**Requirements**
- Theme picker with immediate preview
- About section: version, build date, Expo SDK version
- Export: JSON file with all recipes + plans
- Import: JSON file validation + merge or replace
- Reset: destructive action with typed confirmation

---

## 4. User Flows

### Flow A: Save a New Recipe (Manual)
```
Home → Quick Actions: "Add Recipe" → Manual tab
→ Fill title, description, time, servings
→ Add ingredients (+ button, fill rows)
→ Add steps (+ button, fill rows)
→ Save Recipe → Toast confirmation → Back to Home
```

### Flow B: Plan a Week & Shop
```
Home → Plan tab
→ Tap Monday Dinner slot → Recipe picker → Select "Beef Tacos"
→ Tap Tuesday Dinner slot → Select "Mushroom Risotto"
→ Tap Wednesday Dinner slot → Select "Grilled Chicken"
→ Tap "Generate Shopping List" button
→ Shopping tab opens with merged list
→ Check items while shopping → Tap "Clear checked"
```

### Flow C: Scan a Cookbook Page
```
Home → Quick Actions: "Scan Recipe" → Photo tab
→ Take photo of cookbook page
→ Review auto-parsed recipe (ingredients may have errors)
→ Tap ingredient to edit / fix units
→ Save Recipe
```

---

## 5. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Performance** | All local operations < 100ms; list scroll 60fps |
| **Offline** | 100% functionality without network after first install |
| **Storage** | Handle 500+ recipes without degradation |
| **Accessibility** | WCAG 2.1 AA: 44dp touch targets, color contrast ≥ 4.5:1 |
| **Battery** | Background tasks minimal; no polling |
| **App Size** | < 50MB download (Expo bare or prebuilt) |
| **Localization** | Phase 1: English + US units; Phase 2: Metric + multi-language |

---

## 6. Release Milestones

### MVP (v1.0)
- [x] Recipe library with search/filter (SQLite-backed)
- [x] Recipe detail with serving scaler + editable ingredients (persisted)
- [x] Manual recipe entry (saves to SQLite)
- [x] Shopping list generation from recipes (SQLite-backed)
- [x] Checkable shopping list with category grouping (persisted)
- [x] Offline SQLite storage with migrations + seeding
- [x] Dark mode + theme preferences

### v1.1 — Smart Input
- [ ] Photo scan with OCR + recipe parsing
- [ ] Voice input with transcription + parsing
- [x] Ingredient auto-categorization (heuristic, on-device)

### v1.2 — Planner
- [ ] Weekly meal planner UI with drag-and-drop
- [x] Meal plan SQLite schema + CRUD (backend ready)
- [x] Plan-to-list generation (backend ready)
- [x] Duplicate week plans (backend ready)

### v1.3 — Polish
- [ ] Import / export JSON
- [ ] Metric unit support
- [ ] Recipe tags: custom tags, favorites
- [ ] Recipe notes / variations

### v2.0 — Sharing
- [ ] Share recipe as JSON / text
- [ ] Share shopping list as text
- [ ] Print-friendly recipe format

---

## 7. Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Recipe creation (manual) | < 60 seconds | Time from tap "Add" to "Save" |
| Shopping list accuracy | 95% merge correctness | Unit test coverage |
| App launch time | < 2 seconds | Cold start on mid-tier Android |
| User retention (D7) | > 40% | Analytics (opt-in) |
| Crash-free rate | > 99.5% | Error tracking |

---

## 8. Open Questions

1. Should photo/voice parsing happen on-device or server? (On-device = privacy + offline; server = accuracy)
2. Do we want recipe sharing between users (P2P / QR / link)?
3. Should we support nutritional info / calorie counting?
4. Grocery store integration (prices, aisle locations) — future or never?
5. iPad / tablet layout priority?
