# Home Screen + Add Recipe Screen Implementation Plan

## Goal
Redesign the app to match the provided UI mockups:
- Home screen with greeting, search, Quick Actions, Recent Recipes
- Recipes screen with filters and list rows
- 5-tab bottom nav: Home, Recipes, + (FAB), Plan, More
- Add Recipe screen from the + FAB
- No images for recipes — text/colored placeholders only
- Strictly follow existing design system

---

## Phase 1 — Restructure Tab Navigation

### Current → New tab mapping
| Current | New | File |
|---|---|---|
| `index` (Recipes list) | `recipes` (Recipes list) | `app/(tabs)/recipes.tsx` |
| `shopping` | stays as `shopping` | `app/(tabs)/shopping.tsx` |
| `settings` | `more` (Settings moved here) | `app/(tabs)/more.tsx` |
| — | `index` (Home) | `app/(tabs)/index.tsx` |
| — | `plan` (placeholder) | `app/(tabs)/plan.tsx` |

### `app/(tabs)/_layout.tsx`
5-tab layout with custom center + button:
- Home: `Home01Icon` → `index`
- Recipes: `Bookmark01Icon` → `recipes`
- +: Center FAB pressable → opens `/(add-recipe)` modal
- Plan: `Task01Icon` or `Calendar03Icon` → `plan`
- More: `Menu01Icon` → `more`

Use Expo Router's `tabBarButton` to hide the default middle tab, then render a custom floating button via `tabBar` prop or by conditionally rendering inside `screenOptions.tabBar`.

**Decision:** Use a custom `tabBar` component for full control. Render 5 slots manually with the center one as a styled `Pressable` that opens the add-recipe modal.

---

## Phase 2 — Home Screen (`app/(tabs)/index.tsx`)

### Layout (top to bottom)
1. **Header**
   - `ThemedText` variant `h1`: "Home"
   - `ThemedText` variant `h3` (Playfair Display): Time-based greeting — "Good morning!" / "Good afternoon!" / "Good evening!"
   - `ThemedText` variant `body` color `secondary`: "Let's cook something delicious."

2. **Search Bar**
   - Rounded container with border, `SearchIcon` on left
   - `Input` component or custom `TextInput` styled to match
   - Placeholder: "Search recipes..."
   - Filters recipes as you type (client-side on mock data)

3. **Quick Actions**
   - Section title: `ThemedText` variant `body` style `fontFamily: "Inter-SemiBold"`
   - 3 cards in a horizontal row (gap-3):
     - **Add Recipe**: `Upload01Icon` + "Add Recipe" + "Manually"
     - **Scan Recipe**: `Scan01Icon` or `AiScanIcon` + "Scan Recipe" + "Photo / image"
     - **Voice Input**: `MicrophoneOffIcon` or `VoiceIcon` + "Voice Input" + "Hands-free"
   - Each card: `Pressable` with rounded border, surface background, centered content, icon on top
   - Pressed opacity: `0.8`
   - Add Recipe card navigates to `/(add-recipe)`

4. **Recent Recipes**
   - Header row: "Recent Recipes" (Inter-SemiBold body) + "See all" link (primary color, caption)
   - "See all" navigates to `/recipes` tab
   - Show last 3 recipes as horizontal rows:
     - Row layout: colored placeholder circle (24×24, rounded-full, primaryLight bg) + title + servings + `ArrowRight01Icon`
     - `Pressable` row, opacity on press
   - Divider between rows

5. **Footer padding**
   - Extra bottom padding for tab bar clearance

---

## Phase 3 — Recipes Screen (`app/(tabs)/recipes.tsx`)

Redesign from current grid to list rows matching the mockup.

### Layout
1. **Header**: "Recipes" (h2)
2. **Filter chips** (horizontal scroll):
   - All, Favorites, Dinner, Quick (and more)
   - Selected chip: filled primary background, white text
   - Unselected: outlined, surface background
   - Use `Chip` component
3. **Recipe list**:
   - Each row: colored circle (primaryLight, 48×48) + title + servings/time info + divider
   - NO images
   - Row press navigates to `/recipe/[id]`

---

## Phase 4 — Add Recipe Screen (`app/add-recipe.tsx`)

Modal/presentation screen for adding recipes.

### Layout
1. **Header**: back arrow + "Add Recipe" title + cancel
2. **Input fields**:
   - Recipe title `Input`
   - Description `Input`
   - Prep time / Cook time row
   - Servings `ServingScaler`
3. **Ingredients section**:
   - "Ingredients" header + count
   - Dynamic `IngredientItem` rows with add/delete
   - "Add ingredient" `ThemedButton` (ghost)
4. **Instructions**:
   - Text area or multi-line inputs for steps
5. **Save button**:
   - `ThemedButton` (primary) "Save Recipe"

---

## Phase 5 — Plan & More Screens

### `app/(tabs)/plan.tsx`
Placeholder with "Plan" title and coming-soon message.

### `app/(tabs)/more.tsx`
Move Settings content here. Reuse existing settings.tsx content.
Delete or keep `settings.tsx` as a redirect.

---

## Phase 6 — Remove Images

### From `app/recipe/[id].tsx`
- Replace the image placeholder section with a colored header bar (primary background, white title text) or remove entirely.
- Keep the back button and title below.

### From `app/(tabs)/recipes.tsx`
- Remove all image references. Use colored placeholder circles.

### From mock data
- Remove `image` property if any (already removed in current data).

---

## HugeIcons Needed

| Usage | Icon Name |
|---|---|
| Home tab | `Home01Icon` |
| Recipes tab | `Bookmark01Icon` |
| Plan tab | `Task01Icon` or `Calendar03Icon` |
| More tab | `Menu01Icon` |
| Search | `SearchIcon` |
| Add Recipe action | `Upload01Icon` |
| Scan Recipe action | `Scan01Icon` |
| Voice Input action | `Microphone01Icon` |
| Recipe row arrow | `ArrowRight01Icon` |
| Add Recipe screen back | `ArrowLeft01Icon` |
| Center FAB + | `Add01Icon` |

---

## File Change Summary

| File | Action |
|---|---|
| `app/(tabs)/_layout.tsx` | **Edit** — 5-tab custom layout with center FAB |
| `app/(tabs)/index.tsx` | **Edit** — Home screen (greeting, search, quick actions, recent recipes) |
| `app/(tabs)/recipes.tsx` | **Create** — Recipes list with filters (moved from index.tsx) |
| `app/(tabs)/plan.tsx` | **Create** — Placeholder |
| `app/(tabs)/more.tsx` | **Create** — Settings content moved here |
| `app/(tabs)/shopping.tsx` | **Keep** — No change needed |
| `app/(tabs)/settings.tsx` | **Delete** — Merged into more.tsx |
| `app/add-recipe.tsx` | **Create** — Add recipe modal screen |
| `app/_layout.tsx` | **Edit** — Add `add-recipe` to Stack |
| `app/recipe/[id].tsx` | **Edit** — Remove image placeholder, keep text-only |
| `src/data/mockRecipes.ts` | **Keep** — Already no images |
