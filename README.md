# Mise

> *Mise en place — everything in its place.*

Mise is a recipe organizer and meal planner for home cooks who want to stay organized without the clutter. Collect recipes, plan dinners or a whole week, and generate a single clean shopping list that combines and deduplicates ingredients across every meal. No accounts, no subscriptions, no internet required — your recipes live on your device.

---

## What Mise Does

- **Collect Recipes** — Add recipes manually, scan from a photo, or dictate by voice. Ingredients and steps are parsed and organized automatically.
- **Plan Meals** — Pick recipes for tonight or plan an entire week. Mise keeps your schedule tidy and editable.
- **Smart Shopping Lists** — Mise merges all ingredients across planned recipes, combines duplicates, and groups everything by grocery category (Produce, Dairy, Pantry, etc.).
- **Scale on the Fly** — Change serving sizes and ingredient amounts recalculate instantly.
- **Always Offline** — Recipes, plans, and lists are stored locally. Works anywhere, even in the back of a grocery store with no signal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) SDK 54 |
| Platform | React Native 0.81 + React 19 |
| Navigation | Expo Router (file-based) |
| Styling | [Uniwind](https://github.com/expo/uniwind) (Tailwind utility classes for RN) |
| Theme | Token-based light/dark with `useColorScheme` |
| Typography | Playfair Display (headings) + Inter (body) + Baloo 2 (UI accents) |
| Icons | Hugeicons React Native |
| Animation | React Native Reanimated |
| Storage | AsyncStorage / SQLite (local only) |

---

## Project Structure

```
mise/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Bottom-tab navigation
│   │   ├── index.tsx             # Home (search, quick actions, recent)
│   │   ├── recipes.tsx           # Recipe library with tag filters
│   │   ├── plan.tsx              # Meal planner (weekly/daily)
│   │   ├── shopping.tsx          # Generated shopping list
│   │   └── more.tsx              # Settings, theme, about
│   ├── recipe/[id].tsx           # Recipe detail + serving scaler
│   └── add-recipe.tsx            # Add recipe (manual / photo / voice)
├── src/
│   ├── data/
│   │   └── mockRecipes.ts        # Demo recipes + types
│   ├── utils/
│   │   ├── shopping.ts           # List generation, merging, categorization
│   │   ├── unitConverter.ts      # Normalize, scale, simplify units
│   │   └── fraction.ts           # Decimal → fraction formatting
│   └── design-system/            # Theme, tokens, reusable components
│       ├── tokens/
│       │   ├── colors.ts         # Light & dark palettes
│       │   ├── spacing.ts        # 4pt grid scale
│       │   ├── radius.ts         # Corner radius tokens
│       │   ├── elevation.ts      # Shadows / elevation
│       │   ├── typography.ts     # Type scale + font families
│       │   └── iconography.ts    # Icon sizes + stroke rules
│       ├── components/
│       │   ├── ThemedText.tsx    # Text with variant + color prop
│       │   ├── ThemedButton.tsx  # Primary / secondary / ghost buttons
│       │   ├── RecipeCard.tsx    # Recipe list item
│       │   ├── IngredientItem.tsx# Editable inline ingredient row
│       │   ├── ShoppingItem.tsx  # Checkbox list item
│       │   ├── ServingScaler.tsx # Stepper for servings
│       │   ├── UnitSelect.tsx    # Unit dropdown
│       │   ├── Chip.tsx          # Filter chip
│       │   ├── Input.tsx         # Styled TextInput
│       │   ├── SectionHeader.tsx # Shopping category header
│       │   ├── BottomNavigation.tsx# Custom tab bar
│       │   └── ...               # Slider, Stepper, Feedback, etc.
│       ├── theme/
│       │   ├── ThemeProvider.tsx # Context + appearance logic
│       │   ├── useAppTheme.ts    # Hook: colors, dark flag, preference
│       │   └── AppFontLoader.tsx # Expo Font loader
│       └── hooks/
│           └── useBreakpoint.ts  # Responsive layout hook
├── mise-design-system/           # Standalone design system reference
│   └── docs/
│       └── DESIGN_SYSTEM.md      # Full token + component spec
├── global.css                    # Uniwind global styles
├── metro.config.js               # Metro bundler config
└── package.json
```

---

## Design Direction

Clean, warm, and tactile — inspired by a well-organized kitchen. The UI avoids tech-product coldness in favor of:

- **Earthy palette**: olive greens (`#4C5A3B`), warm creams (`#FAF6F0`), terracotta accents (`#C9723B`)
- **Generous whitespace**: calm density, breathable screens
- **Editorial typography**: Playfair Display for headings, Inter for body copy
- **Soft surfaces**: rounded cards, subtle outlines, no harsh borders
- **Opacity-only interactions**: pressed states dim, never flash

See [`mise-design-system/docs/DESIGN_SYSTEM.md`](mise-design-system/docs/DESIGN_SYSTEM.md) for the complete token specification.

---

## Running Locally

```bash
# Install dependencies
bun install

# Start the development server
bun start

# Run on specific platforms
bun android
bun ios
bun web
```

> Requires Expo CLI and a valid Expo SDK 54 environment. See [Expo docs](https://docs.expo.dev/versions/v54.0.0/) for platform setup.

---

## Key Features & Status

| Feature | Status | Notes |
|---|---|---|
| Recipe list + search | ✅ Implemented | SQLite-backed, tag filtering, search |
| Recipe detail view | ✅ Implemented | Serving scaler, editable ingredients, persist to DB |
| Add recipe (manual) | ✅ Implemented | Full form with validation, saves to SQLite |
| Add recipe (photo) | 🏗️ UI scaffold | Needs OCR / image-to-recipe backend |
| Add recipe (voice) | 🏗️ UI scaffold | Needs speech-to-text + NLP backend |
| Meal planner | 🏗️ DB ready | Schema + CRUD ready; UI scaffold pending |
| Shopping list generation | ✅ Implemented | DB-backed, merge, dedupe, categorize |
| Offline storage | ✅ Implemented | `expo-sqlite` with FTS5 + migrations |
| Dark mode | ✅ Implemented | System + manual override |
| i18n / units | 🏗️ Partial | US volume + weight units; metric planned |

---

## Contributing

Mise is currently in active development. The codebase follows these conventions:

- **File-based routing** via Expo Router — screens live in `app/`
- **Uniwind for layout**, token values for color — never hardcode colors in components
- **Pressed states use opacity only** — no background or border changes on press
- **Minimum touch target** 44 × 44 dp
- **No `any` types** — strict TypeScript throughout

---

## License

MIT
# mise
