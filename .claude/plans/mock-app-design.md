# Mock App Design Plan — Mise Recipe App

## Goal
Build out mock screens for the Mise recipe app that demonstrate the PRD features from M3 (Scaling & Shopping) and M4 (Polish & Settings). Strictly follow the existing token-based design system (Uniwind layout, token colors, `ThemedText`/`ThemedButton`, pressed-opacity-only, etc.). Add a manual theme override setting.

---

## Phase 1 — Manual Theme Override System

The existing design system uses `useColorScheme()` directly with no override. The user now wants a Settings toggle for light / dark / system.

### 1a. Update `src/design-system/theme/useAppTheme.ts`
Instead of reading directly from `useColorScheme()`, read from a `ThemeContext` that stores a user preference (`'system' | 'light' | 'dark'`). The resolved theme is computed as:
- `'system'` → use `useColorScheme()` value
- `'light'` / `'dark'` → use that value directly

Return `themePreference` and `setThemePreference` from the context so the Settings screen can toggle it.

### 1b. Create `src/design-system/theme/ThemeProvider.tsx`
A lightweight React context provider storing the preference in React state (no persistence needed for the mock; can be wired to AsyncStorage later). Wraps children and provides the resolved theme.

### 1c. Update `src/design-system/index.ts`
Export `ThemeProvider` and the updated `useAppTheme`.

### 1d. Update `app/_layout.tsx`
Wrap `<Stack />` with `<ThemeProvider>`.

---

## Phase 2 — Utility Modules

### 2a. `src/utils/fraction.ts`
Convert decimal numbers to Unicode fractions for display:
- `0.25` → `¼`
- `0.5` → `½`
- `0.75` → `¾`
- `0.33` → `⅓`
- `0.67` → `⅔`
- `1.5` → `1½`
- Whole numbers stay as integers

### 2b. `src/utils/unitConverter.ts`
Ingredient unit conversion and simplification:
- `3 tsp → 1 tbsp`
- `16 tbsp → 1 cup`
- `4 cups → 1 qt`
- Base tables for volume and weight conversions

### 2c. `src/utils/shopping.ts`
Ingredient merging logic for shopping list generation:
- Normalize unit names (e.g., "tsp", "teaspoon", "tsp." → standard)
- Group by category (Produce, Dairy, Pantry, Meat, etc.)
- Merge identical ingredients (same name + compatible unit)

---

## Phase 3 — New Design System Components

### 3a. `ServingScaler.tsx`
A compact stepper for recipe serving count. Shows current count and `+` / `-` buttons. Used in recipe detail.

Design:
- Rounded container with border
- Left/right pressable buttons with `HugeiconsIcon` (`Add01Icon` / `MinusSignIcon`)
- Center text showing serving count
- Uses token colors for borders, background, text
- Pressed opacity: `0.8`

### 3b. `IngredientItem.tsx`
A row component for parsed ingredients with inline editing capability.

Props:
- `amount: number` (displayed via fraction util)
- `unit: string`
- `name: string`
- `editing?: boolean`
- `onEdit?: (field, value) => void`
- `onDelete?: () => void`

Design:
- Flex row with amount (left, fixed width), unit, name
- When `editing=true`, fields become small `Input` components
- Swipe or long-press to delete (mock: tap a small `IconButton`)
- Uses `ThemedText` for display mode
- Divider between items (`border-b` style)

### 3c. `ShoppingItem.tsx`
Check-off row for the shopping list.

Props:
- `label: string`
- `checked: boolean`
- `onToggle: () => void`

Design:
- Pressable row with checkbox (custom circle with checkmark)
- `ThemedText` label, strikethrough when checked
- Uses `textMuted` color when checked
- Pressed opacity: `0.8`

### 3d. `SectionHeader.tsx`
A grouped list section header.

Props:
- `title: string`
- `count?: number`

Design:
- `ThemedText` variant `overline` in `primary` color
- Uppercase, letter-spaced
- Optional count badge

---

## Phase 4 — Tab Navigation & Screens

### 4a. `app/(tabs)/_layout.tsx`
Bottom tab navigator using Expo Router tabs.

Tabs:
1. **Recipes** (`index`) — Home icon
2. **Shopping** (`shopping`) — Cart icon
3. **Settings** (`settings`) — Gear icon

Uses `BottomNavigation` design system component or Expo Router's built-in tabs styled with tokens.

**Decision:** Use Expo Router's `<Tabs>` from `expo-router/tabs` for simplicity, but style the tab bar using token colors from `useAppTheme`.

### 4b. `app/(tabs)/index.tsx` — Recipes List
A scrollable list of recipe cards.

Content:
- Header: "Recipes" (`ThemedText` h2)
- Subtitle tagline
- Search `Input`
- Category `Chip` row (Dinner, Quick, Vegetarian, Breakfast, Dessert)
- Grid/list of `RecipeCard`s with mock recipe images and data
- Uses `useBreakpoint` for responsive grid (1 col mobile, 2 col tablet)

### 4c. `app/recipe/[id].tsx` — Recipe Detail
Stack screen for a single recipe. Demonstrates AI-parsed ingredient flow and scaling.

Content:
- Recipe image header
- Title (`ThemedText` h3)
- Meta row (prep time, cook time, source)
- `ServingScaler` section: "Scale recipe" with current servings
- Ingredient list section with `IngredientItem` rows
  - Mock AI-parsed data with slight errors to demonstrate inline editing
  - Each row shows amount (fraction), unit, name
  - Small edit icon toggles inline editing mode
- Instructions section (`ThemedText` body)
- "Add to Shopping List" `ThemedButton`

### 4d. `app/(tabs)/shopping.tsx` — Shopping List
Grouped shopping list with check-off items.

Content:
- Header: "Shopping List" with item count
- Grouped sections: Produce, Dairy, Pantry, Meat, Other
- Each group has `SectionHeader` + `ShoppingItem` rows
- "Clear Checked" `ThemedButton` (ghost variant)
- Empty state when no items

### 4e. `app/(tabs)/settings.tsx` — Settings
Settings screen with theme toggle and app info.

Content:
- Header: "Settings"
- Theme section:
  - Label: "Appearance"
  - Three options: Light, Dark, System (as `Chip`-like selectable row)
  - Uses `themePreference` from context
- About section:
  - App version, build info
- Edge case demo section (for mock):
  - "Simulate offline mode" toggle
  - "Simulate AI parse error" button

---

## Phase 5 — Mock Data

### 5a. `src/data/mockRecipes.ts`
3–4 realistic recipes with parsed ingredients that have slight AI errors for demo purposes:

```ts
export interface ParsedIngredient {
  id: string;
  amount: number;
  unit: string;
  name: string;
  category: 'produce' | 'dairy' | 'pantry' | 'meat' | 'other';
}

export interface Recipe {
  id: string;
  title: string;
  meta: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  image: any; // require(...)
  ingredients: ParsedIngredient[];
  instructions: string[];
}
```

Example recipe: "Classic Beef Tacos" with ingredients like:
- `1` `lb` `ground beef` (meat)
- `1` `packet` `taco seasoning` (pantry) — AI error: parsed as `1` `unknown` `taco seasoning packet`
- `8` `small` `flour tortillas` (pantry) — AI error: parsed as `8` `flour tortillas` (missing unit)
- `2` `cups` `shredded lettuce` (produce)
- `1` `cup` `shredded cheddar` (dairy)
- `1` `medium` `tomato, diced` (produce)

---

## Phase 6 — App Layout Update

### 6a. `app/_layout.tsx`
Add `<ThemeProvider>` around existing providers.

```tsx
<ThemeProvider>
  <SafeAreaProvider>
    <AppFontLoader>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="recipe/[id]" options={{ headerShown: false }} />
      </Stack>
    </AppFontLoader>
  </SafeAreaProvider>
</ThemeProvider>
```

---

## Design System Rule Checklist

| Rule | Implementation |
|---|---|
| Uniwind for layout | `className` on all structural elements |
| Tokens for colors | All backgrounds, borders, text via `useAppTheme().colors` |
| `useColorScheme` for system detection | Used as fallback in `ThemeProvider` when preference = 'system' |
| Expo Font for typography | `ThemedText` uses Playfair Display / Inter families |
| Pressed opacity only | All pressables use `opacity: pressed ? 0.8 : 1` (or `0.9` for cards) |
| Input focus = primary border | `Input` component already handles this |
| Min touch target 44×44 | `min-h-11` (44px) on all interactive elements |
| SafeAreaProvider | Used at root, not RN `SafeAreaView` directly |
| `lucide-react-native` | **Replaced** with HugeIcons per user request |
| No manual theme override | **OVERRIDDEN** per user request — now supported |

---

## Files to Create / Edit Summary

| File | Action |
|---|---|
| `src/design-system/theme/ThemeProvider.tsx` | **Create** — context for theme preference |
| `src/design-system/theme/useAppTheme.ts` | **Edit** — read from context |
| `src/design-system/index.ts` | **Edit** — export ThemeProvider |
| `src/utils/fraction.ts` | **Create** — decimal → Unicode fraction |
| `src/utils/unitConverter.ts` | **Create** — unit simplification |
| `src/utils/shopping.ts` | **Create** — ingredient merge/group logic |
| `src/data/mockRecipes.ts` | **Create** — demo recipe data |
| `src/design-system/components/ServingScaler.tsx` | **Create** |
| `src/design-system/components/IngredientItem.tsx` | **Create** |
| `src/design-system/components/ShoppingItem.tsx` | **Create** |
| `src/design-system/components/SectionHeader.tsx` | **Create** |
| `app/_layout.tsx` | **Edit** — add ThemeProvider, Stack screens |
| `app/(tabs)/_layout.tsx` | **Create** — tab navigator |
| `app/(tabs)/index.tsx` | **Edit** — recipes list screen |
| `app/(tabs)/shopping.tsx` | **Create** — shopping list screen |
| `app/(tabs)/settings.tsx` | **Create** — settings with theme toggle |
| `app/recipe/[id].tsx` | **Create** — recipe detail with scaling + inline editing |
| `tsconfig.json` | No change needed |

---

## Open Questions

1. Should the Settings screen use `Chip` components for the Light/Dark/System selector, or custom styled pressable rows? **Recommendation:** Custom pressable rows with a checkmark indicator — clearer than chips for a single-choice setting.
2. Should the shopping list persist across sessions (AsyncStorage) or is in-memory mock sufficient? **Recommendation:** In-memory for the mock; persistence is a follow-up.
3. Should the recipe detail use a modal slide-up or full stack push? **Recommendation:** Full stack push (`app/recipe/[id].tsx`) for better navigation depth.
