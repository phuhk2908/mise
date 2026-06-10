# Comprehensive Implementation Prompt

You are building a comprehensive design system for a React Native app called “Mise”, a warm culinary recipe app.

## Strict technical requirements

- Use Expo SDK 54 only.
- Keep compatibility with React Native 0.81 and React 19.1.
- Use TypeScript.
- Use Expo Font for custom fonts.
- Use Uniwind for layout, spacing, flex, sizing, radius, alignment, and responsive class composition.
- Do not use Uniwind dark mode as the main theme system.
- Use React Native native `useColorScheme()` to detect light/dark mode.
- Use token objects for `lightColors` and `darkColors`.
- Apply colors through inline styles from tokens, not through `dark:` class names.
- Use `react-native-safe-area-context` for safe area handling.
- Avoid React Native core `SafeAreaView`.
- Use `lucide-react-native` for icons.
- Do not implement manual theme override yet. App follows system theme only.

## Design direction

- Brand name: Mise
- Product type: recipe / culinary organization app
- Style: warm, calm, editorial, organized, minimal, premium, soft, culinary
- Primary visual language: natural greens, warm neutrals, subtle borders, rounded cards, editorial serif headings, clean sans-serif body text

## Theme decision

- Uniwind = layout system
- Tokens = visual system
- useColorScheme = theme source
- Expo Font = typography loading

## Interaction rules

- Pressed states use opacity only.
- Pressed button/chip/icon/nav opacity: 0.8.
- Pressed card opacity: 0.9.
- Do not change background, border, or text color on press.
- Input focus changes border color to primary.
- Input focus does not change background or opacity.
- Input error border has higher priority than focused border.
- Disabled button opacity: 0.5.
- Disabled input opacity: 0.6.

Input priority:

```txt
Error > Focused > Default
```

## Build these files

```txt
src/design-system/tokens/colors.ts
src/design-system/tokens/typography.ts
src/design-system/tokens/spacing.ts
src/design-system/tokens/radius.ts
src/design-system/tokens/elevation.ts
src/design-system/tokens/iconography.ts
src/design-system/theme/useAppTheme.ts
src/design-system/hooks/useBreakpoint.ts
src/design-system/components/AppText.tsx
src/design-system/components/Button.tsx
src/design-system/components/Input.tsx
src/design-system/components/Chip.tsx
src/design-system/components/RecipeCard.tsx
src/design-system/components/Feedback.tsx
src/design-system/components/EmptyState.tsx
src/design-system/components/BottomNavigation.tsx
src/design-system/components/IconButton.tsx
src/design-system/components/Stepper.tsx
src/design-system/components/Slider.tsx
```

## Output rules

- Provide production-ready TypeScript code.
- Keep files modular.
- Avoid unnecessary dependencies.
- Use Uniwind `className` for layout only.
- Use inline token styles for colors.
- Keep Expo SDK 54 compatibility strict.
