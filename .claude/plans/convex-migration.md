# Migrate Mise App from SQLite + TanStack Query to Convex

## Goal
Replace the entire local SQLite + TanStack Query data layer with Convex as the backend, keeping all existing UI and functionality intact.

## Current Architecture
- **Database**: `expo-sqlite` with tables: `recipes`, `ingredients`, `instructions`, `meal_plans`, `planned_meals`, `shopping_lists`, `shopping_items`
- **State/Caching**: `@tanstack/react-query` with manual `queryClient.invalidateQueries()` calls
- **Providers**: `DatabaseProvider` (SQLite init) → `ReactQueryProvider` (TanStack) → `ThemeProvider`
- **Data Access**: Every screen calls `useDatabase()` to get the SQLite instance, then passes it to helper functions in `src/db/`

## New Architecture
- **Backend**: Convex with schema + queries + mutations in `convex/`
- **State/Caching**: Built-in Convex reactivity (no manual invalidation needed)
- **Providers**: `ConvexProvider` (from `convex/react`) wrapping the app root
- **Data Access**: `useQuery(api.module.function)` and `useMutation(api.module.function)` directly in components

## Schema Design

Following Convex guidelines (separate tables for child items, no unbounded arrays):

```
recipes
  title, description, prepTime, cookTime, totalTime?, servings,
  tags[], source, imageUri?, notes?, updatedAt

ingredients (FK: recipeId → recipes._id)
  recipeId, name, amount, unit, originalUnit?, category?, optional, notes?

instructions (FK: recipeId → recipes._id)
  recipeId, stepNumber, text, duration?, imageUri?

mealPlans
  weekStart, createdAt

plannedMeals (FK: planId → mealPlans._id)
  planId, date, mealType, recipeId, servings, notes?

shoppingLists
  name, createdAt, isActive

shoppingItems (FK: listId → shoppingLists._id)
  listId, name, amount?, unit?, category, checked, sourceRecipeIds[], isCustom
```

Indexes:
- `ingredients`: by_recipeId
- `instructions`: by_recipeId
- `plannedMeals`: by_planId_and_date, by_date_range
- `shoppingItems`: by_listId, by_listId_and_checked
- `recipes`: by_updated_at

## Backend Functions

### `convex/recipes.ts`
- `getAll` — query: returns all recipes ordered by `updatedAt desc`, joined with ingredients + instructions
- `getById` — query: returns single recipe with joined ingredients + instructions
- `search` — query: full-text-ish search by title/description (using `withSearchIndex` if we add one, or `.filter` fallback for now — but guidelines say no filter; we'll use a simple approach with `.take(50)` and manual text matching or add a search index)
- `getTags` — query: extracts all unique tags
- `create` — mutation: inserts recipe + ingredients + instructions in one tx
- `update` — mutation: patches recipe fields, optionally replaces ingredients/instructions
- `delete` — mutation: deletes recipe (cascades via no referential integrity, so we manually delete children)
- `deleteAll` — mutation: clears all recipes + children

### `convex/mealPlans.ts`
- `getOrCreate` — mutation: returns plan for weekStart, creates if missing, returns with meals
- `getById` — query: returns plan with meals
- `getMealsForDateRange` — query: returns planned meals for a date range
- `addMeal` — mutation: adds a planned meal
- `removeMeal` — mutation: deletes a planned meal by id
- `updateMeal` — mutation: patches meal fields
- `clearPlan` — mutation: deletes all meals for a plan
- `duplicatePlan` — mutation: copies meals from one plan to another week

### `convex/shoppingLists.ts`
- `getActive` — query: returns active list with items
- `getById` — query: returns list with items
- `getAll` — query: returns all lists
- `create` — mutation: creates list, deactivates others
- `toggleItem` — mutation: flips checked state
- `clearChecked` — mutation: deletes checked items
- `delete` — mutation: deletes list + items
- `generateFromRecipes` — mutation: builds ingredients from recipes, merges, creates list + items
- `generateFromPlan` — mutation: calls generateFromRecipes after resolving plan meals

### `convex/seed.ts`
- `seedRecipes` — mutation: inserts mock recipes if recipes table is empty (one-time setup)

## Frontend Changes

### Provider Layer (`app/_layout.tsx`)
Remove `DatabaseProvider` and `ReactQueryProvider`. Add `ConvexProvider` with `ConvexReactClient` created at module scope using `process.env.EXPO_PUBLIC_CONVEX_URL`.

### Screens — replace all data access patterns

| Screen | Current | New |
|--------|---------|-----|
| `index.tsx` | `useQuery({ queryKey: ["recipes"], queryFn: () => getAllRecipes(db) })` | `const recipes = useQuery(api.recipes.getAll) ?? []` |
| `recipes.tsx` | Same as above + `getAllTags(db)` | `useQuery(api.recipes.getAll)`, `useQuery(api.recipes.getTags)` |
| `plan.tsx` | Complex `useQuery` joining plan + recipes + meals | `useQuery(api.mealPlans.getOrCreate, { weekStart })`, `useQuery(api.recipes.getAll)` |
| `shopping.tsx` | `useQuery` for active list + recipes fallback | `useQuery(api.shoppingLists.getActive)` |
| `recipe/[id].tsx` | `useQuery({ queryKey: ["recipe", id] })` | `useQuery(api.recipes.getById, { id })` |
| `add-recipe.tsx` | `insertRecipe(db, recipe)` then `queryClient.invalidateQueries()` | `useMutation(api.recipes.create)` — mutation call, no manual invalidation |
| `edit-recipe.tsx` | `updateRecipe(db, id, changes)` then invalidate | `useMutation(api.recipes.update)` |

### Loading & Error States
Convex `useQuery` returns `undefined` while loading. Existing conditional blocks (`if (!ready \|\| isLoading)`) change to `if (data === undefined)`. For errors, Convex auto-retries; we keep minimal error UI by checking if data stays undefined after a reasonable time, or simply rely on Convex's built-in retry.

### TanStack → Convex Hook Mapping
- `useQuery({ queryKey, queryFn, enabled })` → `useQuery(api.x.y, args?)`
- `useMutation({ mutationFn, onSuccess })` → `useMutation(api.x.y)` then call the returned function
- `queryClient.invalidateQueries({ queryKey: [...] })` → **Delete entirely** (Convex handles reactivity)
- `useDatabase()` / `db` parameter passing → **Delete entirely**

## Files to Create / Modify / Delete

### Create (new Convex backend)
1. `convex/schema.ts`
2. `convex/recipes.ts`
3. `convex/mealPlans.ts`
4. `convex/shoppingLists.ts`
5. `convex/seed.ts`

### Modify (frontend)
6. `app/_layout.tsx` — swap providers
7. `app/(tabs)/index.tsx` — Convex queries
8. `app/(tabs)/recipes.tsx` — Convex queries
9. `app/(tabs)/plan.tsx` — Convex queries + mutations
10. `app/(tabs)/shopping.tsx` — Convex queries + mutations
11. `app/recipe/[id].tsx` — Convex queries + mutations
12. `app/add-recipe.tsx` — Convex mutation
13. `app/edit-recipe.tsx` — Convex mutation

### Deprecate / Remove (old data layer)
14. `src/context/DatabaseContext.tsx` — remove from tree (file can stay)
15. `src/context/QueryClient.tsx` — remove from tree (file can stay)
16. `src/db/*` — no longer imported (files can stay)

### Dependencies
17. `package.json` — remove `expo-sqlite`, `@tanstack/react-query`, `@tanstack/eslint-plugin-query` (optional — can keep if user wants fallback)

## Verification Steps
1. Run `npx convex dev --once` to push schema + functions and typecheck
2. Seed data with the `seedRecipes` mutation if table is empty
3. Launch Expo and verify all screens load data
4. Test CRUD: add recipe, edit recipe, delete recipe, plan meals, generate shopping list, toggle items, clear checked

## Approach
I will implement this in a single comprehensive pass, writing all Convex backend files first, then updating all frontend screens. This minimizes intermediate broken states.
