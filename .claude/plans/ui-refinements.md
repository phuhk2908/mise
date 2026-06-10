# UI Refinement Plan

## 1. Tab Bar (4 items — remove + button)
- Home, Recipes, Plan, More
- No center + button since home screen has 3 quick actions
- Use `Bookmark01Icon` for Recipes, `Calendar03Icon` for Plan

## 2. Recipe Screen
- Remove the two home/back icons (it's a main tab, not a detail screen)
- Add a floating action button (FAB) or header right icon for "Add Recipe"
- Use `Add01Icon` in a small circle button in the header area

## 3. Add Recipe Screen — 3 Tabs
- **Manual**: Existing form (title, servings, ingredients, steps, save)
- **Photo**: Placeholder area with dashed border, camera icon, "Take Photo" and "Choose from Gallery" buttons, tips card
- **Voice**: Microphone icon in center, "Tap to start speaking", example text, offline badge
- Tab selector: 3 pressable segments at top (Manual, Photo, Voice)
- Home quick actions route to this screen with correct tab pre-selected

## 4. Search Input Consistency
- Use explicit `min-h-11` (44px) on both iOS and Android
- Consistent padding, border radius, font size
- Use `TextInput` directly with explicit styling to avoid platform differences

## 5. More Rounded UI
- Cards: `rounded-2xl` instead of `rounded-lg`
- Inputs: `rounded-xl` instead of `rounded-md`
- Buttons: `rounded-xl` or `rounded-full` for action buttons
- Chips: keep `rounded-full`
- Tab selector: `rounded-full` pill container
- Increase shadow/elevation subtly on floating elements
- Better spacing (gap-4, gap-5 instead of gap-2, gap-3)
- Section dividers: h-px with outline color

## 6. Home Screen Quick Actions → Deep Link to Add Recipe Tab
- Add Recipe card → `/add-recipe?tab=manual`
- Scan Recipe card → `/add-recipe?tab=photo`
- Voice Input card → `/add-recipe?tab=voice`
- Add Recipe screen reads `tab` param and sets active tab

## Files to Edit
- `app/(tabs)/_layout.tsx` — 4-tab layout
- `app/(tabs)/recipes.tsx` — remove back icons, add Add button
- `app/(tabs)/index.tsx` — update quick action routes
- `app/add-recipe.tsx` — complete rewrite with 3 tabs
- `app/recipe/[id].tsx` — optional rounded styling updates
- `app/(tabs)/shopping.tsx` — optional rounded styling
- `app/(tabs)/more.tsx` — optional rounded styling
