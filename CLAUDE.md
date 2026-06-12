# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mise is an offline-first recipe organizer, meal planner, and shopping list generator built with Expo SDK 54 and React Native. Data lives locally in SQLite; there is no backend server or required accounts. AI features (recipe extraction from text/voice via Ollama) are entirely optional.

## Commands

Always use **Bun** as the package manager.

| Task | Command |
|---|---|
| Start dev server | `bun start` |
| Run on Android | `bun android` |
| Run on iOS | `bun ios` |
| Run on web | `bun web` |
| Lint | `bun lint` |
| Install deps | `bun install` |

There is no test runner configured yet.

## Architecture

### App Shell (Expo Router)
- `app/_layout.tsx` — Root layout: `ConvexProvider` → `ThemeProvider` → `I18nextProvider` → `SafeAreaProvider` → `AppFontLoader` → `Stack`. Also mounts a `SeedOnMount` component that triggers a Convex seed mutation once.
- `app/(tabs)/` — Bottom-tab screens: Home (`index`), Recipes, Plan, Shopping, More. Custom tab bar in `src/design-system/components/BottomNavigation.tsx`.
- `app/recipe/[id].tsx` — Recipe detail (stack push). `app/add-recipe.tsx`, `app/edit-recipe.tsx` — recipe creation/editing. `app/ai-settings.tsx`, `app/ai-review.tsx` — AI flows.

### Local Data Layer (SQLite + expo-sqlite)
- **Schema & migrations:** `src/db/schema.ts` defines tables, indexes, and FTS5 setup. `src/db/migrations.ts` tracks migration versions and seeds mock recipes on first launch.
- **Connection:** `src/db/connection.ts` opens the DB, enables foreign keys, and drops/recreates all tables when `SCHEMA_VERSION` in `schema.ts` changes.
- **CRUD modules:** `src/db/recipes.ts`, `src/db/mealPlans.ts`, `src/db/shoppingLists.ts` expose raw-SQL helpers. Import from `src/db/index.ts`.
- **Tables:** `recipes`, `ingredients`, `instructions`, `meal_plans`, `planned_meals`, `shopping_lists`, `shopping_items`.
- **FTS5:** Full-text search on recipes is best-effort; unsupported SQLite builds silently fall back to `LIKE`.

### Design System
- **Tokens:** `src/design-system/tokens/` — colors (light/dark palettes), spacing (4pt grid), radius, elevation, typography (Playfair Display / Inter / Baloo 2), iconography.
- **Theme:** `src/design-system/theme/ThemeProvider.tsx` provides `themePreference`, `isDark`, and `colors`. Use `useAppTheme()` in components. Supports system/light/dark.
- **Components:** `src/design-system/components/` — `ThemedText`, `ThemedButton`, `RecipeCard`, `IngredientItem`, `ServingScaler`, `ShoppingItem`, `Chip`, `Input`, `BottomNavigation`, etc.
- **Styling rules:**
  - Use **Uniwind** utility classes for layout (Tailwind for RN). Global styles in `global.css`.
  - Never hardcode colors in components — always source from `useAppTheme().colors`.
  - Pressed states must use **opacity only** (`opacity-70`, `opacity-50`) — never change background or border on press.
  - Minimum touch target is **44 × 44 dp**.

### AI Provider Layer
- **Goal:** Optional, provider-agnostic recipe extraction from text and voice transcripts.
- **Types:** `src/ai/types.ts` defines `AIProvider` (`ollama` | `openai` | `anthropic` | `gemini`), `AIConfig`, `AIParsedRecipeDraft`, and `AIError`.
- **Ollama client:** `src/ai/ollama.ts` — `/api/generate` for JSON recipe extraction, `/api/tags` for model validation.
- **Storage:** `src/ai/storage.ts` persists config in `expo-secure-store` (`provider`, `model`, `baseUrl`, `apiKey`). Cloud providers require an API key; local providers allow blank keys.
- **Hook:** `src/hooks/useAISettings.ts` loads/saves/clears config and tests connection via `listModels()`.
- **Parser:** `src/ai/parser.ts` and `src/ai/extract.ts` handle raw text → structured draft.
- **Prompts:** `src/ai/prompts.ts` contains LLM prompt templates.
- **Important:** AI results are **always shown in a review screen** (`app/ai-review.tsx`) before saving. Never persist AI output silently.

### Convex Integration
- Convex is set up but used minimally: only the `seed.seedRecipes` mutation is called on mount to populate demo data.
- When writing Convex code, **always read `convex/_generated/ai/guidelines.md` first** for API rules (validators, `internalQuery` vs `query`, pagination, actions with `"use node"`, etc.).
- Convex agent skills can be installed with `npx convex ai-files install`.

### Navigation & Routing
- File-based routing via Expo Router. Screens in `app/`.
- Stack screens use `presentation: "card"` and `animation: "slide_from_right"`.
- `expo-router` typed routes are enabled (`experiments.typedRoutes: true` in `app.json`).

### Key Utilities
- `src/utils/shopping.ts` — merge ingredients, categorize, group by grocery category.
- `src/utils/unitConverter.ts` — normalize units, scale by servings, simplify (e.g. 3 tsp → 1 tbsp).
- `src/utils/fraction.ts` — decimal → unicode fraction display (e.g. 1.5 → "1½").

## TypeScript Conventions
- Strict mode enabled. No `any` types.
- Path alias `@/*` maps to `./*`.
- Import generated Convex types (`Doc<"tableName">`, `Id<"tableName">`) from `convex/_generated/dataModel`.

## Environment
- `EXPO_PUBLIC_CONVEX_URL` is required in `.env.local` (referenced in `app/_layout.tsx`).
- `newArchEnabled: true` in `app.json` (Fabric/TurboModules enabled).
- `reactCompiler: true` experiment is on.

## Reference Documents
- `README.md` — tech stack, project structure, design direction.
- `PRD.md` — product requirements, feature spec, release milestones.
- `BACKEND_LOGIC.md` — data models, algorithms (unit conversion, ingredient merge, categorization), storage layer decisions.
- `docs/AI-spec.md` — AI provider setup spec, error states, MVP scope.
- `mise-design-system/docs/DESIGN_SYSTEM.md` — complete token + component specification.
