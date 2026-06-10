# Mise Design System

React Native + Uniwind design system for the Mise recipe app.

## Strict stack

- Expo SDK 54
- React Native 0.81
- React 19.1
- TypeScript
- Expo Font
- Uniwind for layout utilities
- React Native `useColorScheme()` for native system theme detection
- `react-native-safe-area-context` for safe areas
- `lucide-react-native` for icons

## Design decision

Use Uniwind for layout, spacing, sizing, alignment, flex, radius, and responsive class composition.

Use tokens plus `useColorScheme()` for colors and theme-aware values.

Do not use Uniwind `dark:` classes as the main theme source.

## Included files

```txt
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
    AppText.tsx
    Button.tsx
    Input.tsx
    Chip.tsx
    RecipeCard.tsx
    Feedback.tsx
    EmptyState.tsx
    BottomNavigation.tsx
    IconButton.tsx
    Stepper.tsx
    Slider.tsx

docs/
  DESIGN_SYSTEM.md
  IMPLEMENTATION_PROMPT.md
```

## Core rule

```txt
Uniwind handles layout.
Tokens handle visual identity.
useColorScheme handles theme mode.
Expo Font handles typography.
Pressed states use opacity only.
Input focus uses primary border color.
```
