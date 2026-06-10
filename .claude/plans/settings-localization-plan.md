# Plan: Settings Reorder + Localization + Legal Screens

## Goal
1. Reorder the **More → Settings** screen for better UX
2. Add **Privacy Policy**, **Terms & Conditions**, **Data Safety** screens with generated bilingual content
3. Integrate **expo-localization** + **react-i18next** (Vietnamese default, English fallback)

---

## Phase 1: Dependencies
Install:
- `react-i18next`
- `i18next`
- `expo-localization`

## Phase 2: i18n Infrastructure
- Create `src/i18n/index.ts` — i18next instance with `expo-localization`, default `lng: 'vi'`
- Create `src/i18n/locales/vi.json` — Vietnamese translations
- Create `src/i18n/locales/en.json` — English translations
- Wrap `_layout.tsx` with `<I18nextProvider>`

## Phase 3: New Legal Screens
Create as full-screen `slide_from_right` pages:
- `app/privacy-policy.tsx`
- `app/terms-conditions.tsx`
- `app/data-safety.tsx`
Each renders bilingual content inside a styled scroll view.

## Phase 4: Redesign More Screen
Reorder sections top-to-bottom by typical user priority:
1. **Preferences** — Language switcher + Theme picker (moved up)
2. **Data** — Reset All Data
3. **Legal** — Privacy Policy, Terms & Conditions, Data Safety (navigate to new screens)
4. **About** — Version, Build, Expo SDK
5. Remove standalone **STATUS** section (theme already shown in Preferences)

## Phase 5: Stack Registration
Register the three new screens in `app/_layout.tsx` inside `<Stack>`.

## Translation Coverage
All UI strings on More screen, navigation labels (where feasible), and legal screen headings + body copy.

---

Shall I proceed?
