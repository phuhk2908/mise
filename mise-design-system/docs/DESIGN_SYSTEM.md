# Mise Design System — React Native + Uniwind

## 1. Project Scope

Build a comprehensive design system for the **Mise** recipe app using:

- React Native
- Expo SDK 54 strictly
- React Native `useColorScheme` for light/dark theme detection
- Uniwind for layout, spacing, sizing, flex, alignment, and radius utilities
- Expo Font for custom typography
- Token-based colors, typography, spacing, radius, elevation, and iconography
- Responsive support for mobile, tablet, and larger screens

## 2. Core Design Direction

The visual language should feel warm, calm, editorial, organized, culinary, minimal, soft, and premium without being heavy.

The UI should use natural green as the primary brand color, warm neutral backgrounds, subtle borders, rounded components, and soft contrast between surfaces.

## 3. Technical Styling Decision

Use **Uniwind for structure**.

Use **native React Native color scheme for theme**.

Do not depend on Uniwind `dark:` theme classes as the main theme source.

### Use Uniwind for

- flex
- gap
- padding
- margin
- width
- height
- alignment
- radius
- layout density
- responsive class composition

### Use token values and `useColorScheme` for

- background color
- text color
- border color
- semantic status color
- button variant color
- input focus color
- card and surface color

Example:

```tsx
const { colors } = useAppTheme();

<View
  className="flex-1 px-4 pt-6"
  style={{ backgroundColor: colors.background }}
>
  <AppText variant="h2">Recipes</AppText>
</View>
```

## 4. Theme Behavior

Default behavior:

- Follow native system appearance
- Light mode when system is light
- Dark mode when system is dark
- Do not add manual Light / Dark / System override yet

## 5. Color Tokens

### Light Theme

```ts
export const lightColors = {
  primary: "#4C5A3B",
  primaryLight: "#7BAA63",
  neutral50: "#FAF6F0",
  neutral100: "#F4EDE2",
  neutral200: "#E6DDC6",
  accent: "#C9723B",
  tan: "#DDB68A",
  brown: "#5B4636",
  success: "#4CAF6A",
  warning: "#E0A93E",
  error: "#E15558",
  info: "#4A90E2",
  successContainer: "#EBF3EA",
  background: "#FAF6F0",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  outline: "#E6E0D6",
  outlineStrong: "#D0C6B7",
  textPrimary: "#1A1C18",
  textSecondary: "#5B5F54",
  textMuted: "#8A8D84",
  white: "#FFFFFF",
  black: "#000000",
};
```

### Dark Theme

```ts
export const darkColors = {
  primary: "#7BAA63",
  primaryLight: "#94A37A",
  neutral900: "#0F0F0F",
  neutral800: "#1A1C18",
  neutral700: "#2A2D28",
  accent: "#E0804A",
  tan: "#DAA67A",
  brown: "#7A5A3E",
  success: "#4CAF6A",
  warning: "#F2B84B",
  error: "#FF6B6B",
  info: "#6CA8FF",
  successContainer: "#1E2A1F",
  background: "#0F0F0F",
  surface: "#1A1C18",
  card: "#1A1C18",
  outline: "#343830",
  outlineStrong: "#4A4F49",
  textPrimary: "#FAF6F0",
  textSecondary: "#D6D0C4",
  textMuted: "#9B9F94",
  white: "#FFFFFF",
  black: "#000000",
};
```

## 6. Typography

Heading font: **Playfair Display**

Body font: **Inter**

Use Expo Font to load:

- PlayfairDisplay-Regular
- PlayfairDisplay-Medium
- PlayfairDisplay-SemiBold
- PlayfairDisplay-Bold
- Inter-Regular
- Inter-Medium
- Inter-SemiBold
- Inter-Bold

### Type scale

| Variant | Font | Size / Line Height | Letter Spacing |
|---|---|---:|---:|
| h1 | PlayfairDisplay-Bold | 40 / 48 | -0.5 |
| h2 | PlayfairDisplay-SemiBold | 32 / 40 | -0.25 |
| h3 | PlayfairDisplay-SemiBold | 24 / 32 | 0 |
| h4 | PlayfairDisplay-SemiBold | 20 / 28 | 0 |
| bodyLarge | Inter-Regular | 16 / 24 | 0 |
| body | Inter-Regular | 14 / 20 | 0 |
| bodySmall | Inter-Regular | 12 / 16 | 0 |
| caption | Inter-Regular | 11 / 16 | 0 |
| overline | Inter-SemiBold | 10 / 14 | 1.2 |

## 7. Spacing

Use a 4pt scale.

- Screen padding mobile: 16
- Screen padding tablet: 24
- Screen padding large: 32
- Card padding: 16 or 20
- Section spacing: 24 or 32
- Component internal gap: 8 or 12
- Inline icon/text gap: 4 or 8

## 8. Radius

- Input: rounded-md
- Button: rounded-md
- Chip: rounded-full
- Card: rounded-lg
- Bottom navigation: rounded-xl
- Floating action button: rounded-full
- Feedback: rounded-md

## 9. Interaction State Rules

### Pressed state

Pressed state uses subtle opacity only.

Applies to:

- Button
- Chip
- Card
- Bottom navigation item
- Icon button
- Stepper button

Rules:

- Button, chip, icon, nav pressed opacity: `0.8`
- Card pressed opacity: `0.9`
- Disabled button opacity: `0.5`
- Disabled input opacity: `0.6`

Do not change background color, border color, or text color on press.

### Input focus state

Input focus activates the border color.

Priority:

```txt
Error > Focused > Default
```

Input borders:

- Default: outline
- Focused: primary
- Error: error
- Disabled: outline

Focused input should not change background color or opacity.

## 10. Responsive Layout

Breakpoints:

- Mobile: width < 768
- Tablet: width >= 768 and width < 1024
- Large: width >= 1024

Layout rules:

- Mobile: 1 column, px-4
- Tablet: 2–3 columns, px-6
- Large: 3–4 columns, px-8, optional max width

## 11. Iconography

Use `lucide-react-native`.

Style:

- Line icons
- Rounded stroke
- Simple outline
- 1.5px to 2px stroke
- No filled icons unless selected state requires it

Sizes:

- xs: 14
- sm: 16
- md: 20
- lg: 24
- xl: 32

## 12. Accessibility Rules

- Minimum touch target: 44 x 44
- Button min height: 44
- Input min height: 44
- Error state must include error text, not color only
- Maintain readable contrast in both themes
- Use accessible labels where needed

## 13. Expo SDK 54 Notes

Implementation must stay compatible with Expo SDK 54, React Native 0.81, and React 19.1.

Use `react-native-safe-area-context` for safe areas and avoid React Native core `SafeAreaView`.

Android edge-to-edge and safe area behavior should be handled carefully around screen containers, bottom navigation, and floating actions.

## 14. Final Rule

```txt
Uniwind handles layout.
Tokens handle visual identity.
useColorScheme handles theme mode.
Expo Font handles typography.
Pressed states use opacity only.
Input focus uses primary border color.
The design system must support mobile, tablet, and large screens.
Expo SDK 54 compatibility is mandatory.
```
