# Mise Design System Setup Plan

## Goal
Integrate the `mise-design-system` into the Expo SDK 54 project, set up Uniwind (Tailwind 4) for layout utilities, wire up the token-based theme system with `useColorScheme`, load custom fonts via Expo Font, and rename core components to `ThemedText` and `ThemedButton` as requested.

---

## Phase 1 — Install Dependencies

**What:** Add the packages Uniwind needs, plus the icon library the design system depends on.

**Commands:**
```bash
npm install uniwind tailwindcss lucide-react-native react-native-svg
```

- `uniwind` — Tailwind utility classes for React Native (requires Tailwind 4).
- `tailwindcss` — Peer dependency for Uniwind.
- `lucide-react-native` — Icons used by `Stepper`, `IconButton`, etc.
- `react-native-svg` — Required peer of `lucide-react-native`.

**Verify existing:**
- `react-native-safe-area-context` is already in `package.json`.
- `expo-font` is already in `package.json`.

---

## Phase 2 — Uniwind Configuration

### 2a. `metro.config.js` (new file)
Create a Metro config wrapped with `withUniwindConfig` from `uniwind/metro`. The CSS entry must be a **relative path** and this wrapper must be the **outermost** config wrapper.

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withUniwindConfig(config, {
  cssEntryFile: './global.css',
  dtsFile: './uniwind.d.ts',
});
```

### 2b. `global.css` (new file at project root)
Tailwind v4 CSS-native entry. Uniwind docs recommend keeping this at the project root so Tailwind can scan source files correctly.

```css
@import 'tailwindcss';
@import 'uniwind';
```

### 2c. `global.d.ts` (new file at project root)
Ensure Uniwind JSX augmentation and the generated class-name types are picked up by TypeScript.

```ts
/// <reference types="uniwind/types" />
/// <reference path="./uniwind.d.ts" />
```

No `tailwind.config.js` is required for Tailwind v4.

---

## Phase 3 — Integrate Design System Files

Copy `mise-design-system/src/design-system/` into the project as `src/design-system/`.

### 3a. Files to create / copy
```
src/design-system/
  tokens/
    colors.ts
    typography.ts
    spacing.ts
    radius.ts
    elevation.ts
    iconography.ts
  theme/
    useAppTheme.ts
  hooks/
    useBreakpoint.ts
  components/
    ThemedText.tsx      ← renamed from AppText.tsx
    ThemedButton.tsx    ← renamed from Button.tsx
    Input.tsx
    Chip.tsx
    RecipeCard.tsx
    Feedback.tsx
    EmptyState.tsx
    BottomNavigation.tsx
    IconButton.tsx
    Stepper.tsx
    Slider.tsx
  index.ts
```

### 3b. TypeScript fix — unified `Colors` type
The existing `colors.ts` exports `LightColors` and `DarkColors` with **different** neutral keys (`neutral50/100/200` vs `neutral700/800/900`). The union `ThemeColors = LightColors | DarkColors` causes TS errors when components access `colors.neutral800` or `colors.neutral100`.

**Fix in `colors.ts`:**
Define a single `Colors` interface with all shared keys required and neutral keys optional. Update `useAppTheme.ts` to return `colors: Colors`.

**Components that access neutrals:**
- `ThemedButton` line 41: `isDark ? colors.neutral800 : colors.neutral100`
- `Input` line 43: `isDark ? colors.neutral800 : colors.neutral100`

Use non-null assertions (`!`) in those two locations, or provide safe fallbacks, since the runtime branch (`isDark`) guarantees the key exists.

---

## Phase 4 — Rename Components & Update Imports

### 4a. Rename files
- `AppText.tsx` → `ThemedText.tsx`
- `Button.tsx` → `ThemedButton.tsx`

### 4b. Update internal references
Inside each renamed file, change the exported function name:
- `AppText` → `ThemedText`
- `Button` → `ThemedButton`

### 4c. Update all imports across the design system
| File | Old import | New import |
|---|---|---|
| `ThemedButton.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `Chip.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `Input.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `BottomNavigation.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `EmptyState.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `EmptyState.tsx` | `import { Button } from './Button'` | `import { ThemedButton } from './ThemedButton'` |
| `Feedback.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `Stepper.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `Slider.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |
| `RecipeCard.tsx` | `import { AppText } from './AppText'` | `import { ThemedText } from './ThemedText'` |

### 4d. Update barrel export (`src/design-system/index.ts`)
Replace:
```ts
export * from './components/AppText';
export * from './components/Button';
```
With:
```ts
export * from './components/ThemedText';
export * from './components/ThemedButton';
```

### 4e. Update `SCREEN_EXAMPLE.tsx` (optional example)
Change imports from `AppText` / `Button` to `ThemedText` / `ThemedButton` if we keep the file.

---

## Phase 5 — Font Loading & App Entry

### 5a. Font assets
Copy the 8 `.ttf` files into `assets/fonts/`:
- `PlayfairDisplay-Regular.ttf`
- `PlayfairDisplay-Medium.ttf`
- `PlayfairDisplay-SemiBold.ttf`
- `PlayfairDisplay-Bold.ttf`
- `Inter-Regular.ttf`
- `Inter-Medium.ttf`
- `Inter-SemiBold.ttf`
- `Inter-Bold.ttf`

> **Note:** The design system docs list these fonts but they are not in the repo yet. If the user does not have the files, we can temporarily use Expo's `expo-font` system fonts or Google Fonts loading, but the plan assumes the `.ttf` files will be placed in `assets/fonts/`.

### 5b. `src/design-system/theme/AppFontLoader.tsx` (new)
Adapted from `EXPO_FONT_SETUP.example.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFonts } from 'expo-font';

export function AppFontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-Regular': require('../../../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Medium': require('../../../assets/fonts/PlayfairDisplay-Medium.ttf'),
    'PlayfairDisplay-SemiBold': require('../../../assets/fonts/PlayfairDisplay-SemiBold.ttf'),
    'PlayfairDisplay-Bold': require('../../../assets/fonts/PlayfairDisplay-Bold.ttf'),
    'Inter-Regular': require('../../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../../assets/fonts/Inter-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
```

**Export from `src/design-system/index.ts`:**
```ts
export * from './theme/AppFontLoader';
```

### 5c. Update `app/_layout.tsx`
```tsx
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppFontLoader } from '../src/design-system';
import '../global.css';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppFontLoader>
        <Stack />
      </AppFontLoader>
    </SafeAreaProvider>
  );
}
```

> Uniwind docs warn against importing CSS in the **component-registration entry point** because it breaks hot reload. In Expo Router, `app/_layout.tsx` is the correct layout component (not the raw entry point), so importing `global.css` here is the right pattern.

---

## Phase 6 — Demo Screen (`app/index.tsx`)

Rewrite the empty `app/index.tsx` to use the design system and demonstrate light/dark awareness, Uniwind layout classes, and component usage.

```tsx
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText, ThemedButton, Chip, Input, useAppTheme } from '../src/design-system';

export default function Index() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-4 pt-6 gap-4">
        <ThemedText variant="h2">Recipes</ThemedText>
        <ThemedText variant="body" color="secondary">
          Organized. Scaled. Made Simple.
        </ThemedText>

        <View className="mt-2">
          <Input placeholder="Search recipes..." />
        </View>

        <View className="flex-row gap-2 mt-2">
          <Chip label="Dinner" selected />
          <Chip label="Quick" />
          <Chip label="Vegetarian" />
        </View>

        <View className="mt-4">
          <ThemedButton>Add Recipe</ThemedButton>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

---

## Phase 7 — VS Code IntelliSense (optional)

Add to `.vscode/settings.json` so `className` and React Native-specific class props get Tailwind autocomplete:

```json
{
  "tailwindCSS.classAttributes": [
    "class",
    "className",
    "headerClassName",
    "contentContainerClassName",
    "columnClassName",
    "overlayClassName",
    "indicatorClassName",
    "thumbClassName",
    "trackClassName",
    "titleClassName",
    "subTitleClassName",
    "closeClassName",
    "bodyClassName",
    "arrowClassName",
    "triggerClassName",
    "containerClassName",
    "wrapperClassName",
    "iconClassName",
    "itemClassName",
    "sheetScrollViewClassName",
    "sheetScrollViewContainerClassName",
    "sheetDragIndicatorClassName",
    "sheetContentClassName",
    "swipeItemClassName",
    "swipeFrontItemClassName",
    "swipeBackItemClassName",
    "textClassName",
    "labelClassName",
    "floatingClassName",
    "placeholderClassName",
    "selectedItemClassName",
    "selectedLabelClassName",
    "unselectedItemClassName",
    "unselectedLabelClassName",
    "errorClassName",
    "successClassName",
    "warningClassName",
    "helperTextClassName",
    "prefixClassName",
    "suffixClassName",
    "accessoryClassName",
    "editButtonClassName",
    "avatarClassName",
    "badgeClassName",
    "checkIconClassName",
    "inputClassName",
    "toggleOnClassName",
    "toggleOffClassName",
    "toggleContainerClassName",
    "thumbColorClassName",
    "activeThumbColorClassName",
    "trackColorForFalseClassName",
    "trackColorForTrueClassName",
    "activeTrackColorClassName",
    "ios_backgroundClassName",
    "pressableClassName",
    "textInputClassName",
    "pressableTextClassName",
    "roundedClassName",
    "headerContainerClassName",
    "containerWrapperClassName",
    "innerContainerClassName"
  ],
  "tailwindCSS.experimental.classRegex": [
    ["useResolveClassNames\\(([^)]*)\\)", "'([^']*)'"]
  ]
}
```

---

## Phase 8 — Verification

1. `npm install` completes without peer-dependency conflicts.
2. `expo start` boots successfully.
3. Metro picks up `global.css` through `withUniwindConfig`.
4. `uniwind.d.ts` is auto-generated at project root (contains typed class names).
5. The demo screen renders `ThemedText`, `ThemedButton`, `Chip`, and `Input`.
6. Toggling system dark mode updates colors correctly (background, surface, text, etc.).
7. Fonts load and Playfair Display / Inter are visible.
8. No TypeScript errors from `src/design-system`.

---

## File Change Summary

| File | Action |
|---|---|
| `package.json` | Add `uniwind`, `tailwindcss`, `lucide-react-native`, `react-native-svg` |
| `metro.config.js` | **Create** — Uniwind Metro wrapper |
| `global.css` | **Create** — Tailwind v4 + Uniwind imports |
| `global.d.ts` | **Create** — TypeScript references |
| `uniwind.d.ts` | **Auto-generated** by Metro config |
| `src/design-system/` | **Create** — copy & adapt all token/component files |
| `src/design-system/components/ThemedText.tsx` | **Create** (renamed from AppText) |
| `src/design-system/components/ThemedButton.tsx` | **Create** (renamed from Button) |
| `src/design-system/theme/AppFontLoader.tsx` | **Create** — Expo Font loader |
| `src/design-system/index.ts` | **Create** — barrel exports |
| `app/_layout.tsx` | **Edit** — add `global.css` import, `SafeAreaProvider`, `AppFontLoader` |
| `app/index.tsx` | **Edit** — demo screen using design system |
| `assets/fonts/*.ttf` | **Add** — 8 font files (user may need to provide) |

---

## Open Questions for the User

1. **Do you have the 8 `.ttf` font files** (Playfair Display + Inter variants)? If not, should we temporarily fall back to system fonts or load them from `@expo-google-fonts`?
2. Should we keep the remaining components (`RecipeCard`, `Stepper`, `Slider`, `Feedback`, `EmptyState`, `BottomNavigation`, `IconButton`) exactly as provided, or do you want any modifications before integration?
3. Do you want the old deleted files (`components/themed-text.tsx`, `hooks/use-theme-color.ts`, etc.) permanently removed from git history, or just left deleted in the working tree?
