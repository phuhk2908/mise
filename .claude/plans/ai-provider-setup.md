# AI Provider Implementation Plan

## Overview

Implement the AI Provider Setup Spec for Mise, following the spec's MVP priorities: **AI Settings → Extract Recipe From Text → Voice Transcript Parsing**. All AI calls happen client-side; the API key never touches Convex servers.

---

## Phase 1: AI Settings Screen & Secure Storage

**Goal:** Let users configure Ollama (provider, model, base URL, API key), test the connection, and persist settings locally.

### New files

- **`src/ai/types.ts`**
  - `AIProvider = 'ollama'` (extensible)
  - `AIConfig` interface: `{ provider, model, baseUrl, apiKey }`
  - `AISettingsState` for UI: `{ isConfigured, isLoading, error }`

- **`src/ai/storage.ts`**
  - Uses `expo-secure-store` (install: `npx expo install expo-secure-store`)
  - Keys: `mise_ai_provider`, `mise_ai_model`, `mise_ai_base_url`, `mise_ai_api_key`
  - `saveAIConfig(config)`, `loadAIConfig()`, `clearAIConfig()`
  - API key is masked on retrieval (never returned in full after save)

- **`src/hooks/useAISettings.ts`**
  - React hook that loads config on mount
  - Returns `{ config, isLoaded, save, clear, testConnection }`
  - `testConnection()` hits Ollama `/api/tags` (or lightweight generate)

- **`app/ai-settings.tsx`**
  - Screen layout matching `more.tsx` card style
  - Header with back arrow
  - Provider selector (Ollama only for now, dropdown-ready for future)
  - Model text input (default: `gemma3` — note: spec says `gemma4` which doesn't exist; we'll use a real default)
  - Base URL text input (default: `http://localhost:11434`)
  - API Key input with show/hide toggle (password field)
  - Info banner: "Your API key is stored on this device and is not sent to Mise servers."
  - Actions: **Test Connection**, **Save Settings**, **Clear Key**
  - Feedback states: loading spinner, success toast, error inline

### Modified files

- **`app/(tabs)/more.tsx`**
  - Add an **AI Settings** row under Preferences (above Appearance)
  - Icon: `AiBrainIcon` or `Settings02Icon` from Hugeicons
  - Route: `/ai-settings`

- **`app/_layout.tsx`**
  - Register `<Stack.Screen name="ai-settings" options={{ presentation: 'card' }} />`

- **`src/i18n/locales/en.json` & `vi.json`**
  - New namespace `aiSettings` with keys:
    - `title`, `provider`, `model`, `baseUrl`, `apiKey`, `apiKeyHint`, `testConnection`, `testSuccess`, `testError`, `save`, `clear`, `clearSuccess`, `notConfiguredTitle`, `notConfiguredDesc`, `openSettings`
  - New namespace `aiErrors` with keys:
    - `notConfigured`, `invalidKey`, `invalidModel`, `invalidResponse`, `lowConfidence`

---

## Phase 2: Ollama Client & Recipe Extraction Engine

**Goal:** Build the client-side pipeline that sends raw text to Ollama and receives a structured recipe draft.

### New files

- **`src/ai/ollama.ts`**
  - `generate(config, prompt)` — POST to `{baseUrl}/api/generate`
    - Request: `{ model, prompt, stream: false, format: 'json' }`
    - Returns parsed JSON or throws with user-friendly error
  - `listModels(config)` — GET `{baseUrl}/api/tags`
    - Used by Test Connection in settings
  - Timeout handling (10s), network error handling

- **`src/ai/prompts.ts`**
  - `buildRecipeExtractionPrompt(rawText: string): string`
  - Detailed system prompt instructing the model to return **strict JSON** with:
    - `title`, `description`, `prepTime`, `cookTime`, `servings`
    - `ingredients[]`: `{ name, amount (number or null), unit, originalText, notes }`
    - `steps[]`: `{ stepNumber, text }`
    - `categories[]`: suggested tags from Mise category list
    - `notes`: general notes
    - `confidence`: `"high" | "medium" | "low"`
    - `warnings[]`: array of strings (e.g., "No servings found", "Some quantities unclear")
  - Prompt rules from spec §10–13:
    - Do not invent ingredients/steps
    - Preserve uncertain quantities in `originalText`
    - Clean typos but keep meaning
    - Use simple categories

- **`src/ai/parser.ts`**
  - `parseRecipeResponse(jsonText: string): AIParsedRecipe`
  - Validates shape using a lightweight runtime check
  - Maps `confidence` to enum
  - Coerces ingredient amounts:
    - If `amount` is clearly numeric → use it
    - If `amount` is uncertain/null → set `amount: 0` and preserve `originalText` in ingredient `notes`
  - Returns `{ draftRecipe, confidence, warnings }`

- **`src/ai/extract.ts`**
  - `extractRecipeFromText(rawText: string, config: AIConfig)`
  - Orchestrator: validate config → build prompt → call ollama.generate → parse response → return draft
  - Throws `AIError` with code for UI mapping

### Modified files

- **`src/types/index.ts`** (optional, add types here or keep in `src/ai/types.ts`)
  - `AIParsedRecipeDraft` — what the parser returns
  - `AIErrorCode` union

---

## Phase 3: AI Recipe Review Screen

**Goal:** Present the AI draft to the user for editing before saving. Matches spec §8 review requirements.

### New file

- **`app/ai-review.tsx`**
  - Receives navigation params: `{ draft: AIParsedRecipeDraft, rawSource?: string }`
  - Header: back button, title "Review Recipe"
  - **Confidence banner** (top):
    - High: green chip
    - Medium: yellow chip + "Please review before saving"
    - Low: red warning card: "Mise is not fully confident about this recipe. Please review it before saving."
  - **Warnings list** (if any): bullet list of warnings
  - **Editable form** (same UX as `add-recipe.tsx` manual tab):
    - Title (required)
    - Description
    - Prep Time / Cook Time row
    - Servings (ServingScaler)
    - Ingredients: editable rows (name, amount, unit, notes). For uncertain quantities, show original text in a secondary line.
    - Steps: editable rows with step numbers
    - Categories: Chip toggles from suggested list + custom add
    - Notes: multiline text
  - **Actions**:
    - "Save Recipe" → calls `api.recipes.create` with `source: 'ai'` → navigates to recipe detail
    - "Discard" → back to previous screen with confirmation

### Design decisions

- Reuses existing `TextInput` patterns from `add-recipe.tsx` for consistency
- Ingredient editing uses same row layout as manual tab
- State is local; no Convex mutation until user hits Save

---

## Phase 4: Text & Voice Entry Points

**Goal:** Wire the existing `add-recipe.tsx` Photo and Voice tabs into the AI extraction pipeline.

### Modified files

- **`app/add-recipe.tsx`**
  - **Photo tab** (`activeTab === 'photo'`):
    - Keep existing photo buttons (still no-ops / placeholder for OCR)
    - Add a divider "— OR —"
    - Add a large `TextInput` (multiline, min-h-32) for pasting raw recipe text
    - Placeholder: "Paste recipe text here..."
    - Button: **Extract Recipe** (icon: `SparklesIcon`)
    - On press:
      - If AI not configured → show inline CTA: "AI Provider is not configured. [Open AI Settings]"
      - If configured → show loading spinner → call `extractRecipeFromText` → navigate to `/ai-review?draft=...`
  - **Voice tab** (`activeTab === 'voice'`):
    - Keep existing mic button (still no-op / placeholder for STT)
    - Add a divider "— OR —"
    - Add a large `TextInput` for pasting a voice transcript
    - Placeholder: "Paste your transcript here..."
    - Button: **Parse Transcript** (icon: `SparklesIcon`)
    - Same config-check and flow as photo tab
    - Uses the same `extractRecipeFromText` pipeline (voice is just text input for now)
  - **Manual tab**: unchanged

- **`app/(tabs)/index.tsx`** (home quick actions)
  - `scan` and `voice` quick actions already route to `/add-recipe?tab=photo` and `/add-recipe?tab=voice`
  - No changes needed — they land in the right tabs

---

## Phase 5: Voice STT Integration (Follow-up)

**Goal:** Replace the transcript text area with actual speech-to-text recording.

**Research needed:**
- Expo SDK 54 compatible STT library (`expo-speech-recognition`, `@react-native-voice/voice`, or platform APIs)
- Permissions: `RECORD_AUDIO` on Android, `NSMicrophoneUsageDescription` on iOS
- Offline capability vs cloud transcription

**Implementation:**
- In `voice` tab: replace text input with recording UI (tap-to-record, waveform, stop button)
- Transcript appears in a read-only preview
- "Parse Transcript" button sends transcript through same Phase 2 pipeline

---

## Data Flow Summary

```
User pastes text in Photo/Voice tab
         ↓
app/add-recipe.tsx validates AI config
         ↓
src/ai/extract.ts → ollama.ts (POST /api/generate)
         ↓
Ollama returns JSON
         ↓
src/ai/parser.ts validates & coerces
         ↓
Navigate to app/ai-review.tsx with draft params
         ↓
User edits fields
         ↓
Save → api.recipes.create (source: 'ai')
         ↓
Navigate to recipe/[id]
```

---

## Key Implementation Details

### API Key Security
- Only `expo-secure-store` touches the key
- Key is loaded into memory only when needed (during extraction)
- Never logged, never in analytics, never in crash reports
- UI shows masked dots after save

### Ollama JSON Mode
- Use `format: 'json'` in `/api/generate` to force valid JSON output
- Set `stream: false` for simple request/response
- Wrap prompt with `<|json_schema|>` style instructions for Gemma models

### Ingredient Amount Coercion
- The parser converts uncertain quantities (`"a little"`, `"vừa đủ"`) to `amount: 0`
- Original text is stored in `notes` field so the user sees it in review
- User can edit the amount before saving
- This avoids a Convex schema migration for the MVP

### Error State Mapping
| Error | UI Message |
|-------|-----------|
| AI not configured | `aiErrors.notConfigured` + CTA button |
| Network timeout | `Could not connect to AI Provider. Please check your server URL.` |
| 404 / model not found | `The selected model is not available. Please check the model name.` |
| Invalid JSON response | `AI returned an invalid result. Please try again.` |
| Low confidence | Warning banner on review screen (non-blocking) |

### i18n Strategy
- All new UI strings go into `en.json` and `vi.json` simultaneously
- Follow existing key naming: `aiSettings.*`, `aiReview.*`, `aiErrors.*`

---

## Estimated File Count

| Action | Count |
|--------|-------|
| New files | ~9 |
| Modified files | ~5 |
| Total | ~14 files |

---

## Order of Work

1. Install `expo-secure-store`
2. Create `src/ai/types.ts`, `src/ai/storage.ts`, `src/hooks/useAISettings.ts`
3. Create `app/ai-settings.tsx` + register in `_layout.tsx` + add to `more.tsx`
4. Add i18n keys
5. Create `src/ai/ollama.ts`, `src/ai/prompts.ts`, `src/ai/parser.ts`, `src/ai/extract.ts`
6. Create `app/ai-review.tsx`
7. Wire `app/add-recipe.tsx` Photo & Voice tabs to the pipeline
8. Test end-to-end with a local Ollama instance
9. (Follow-up) Research and integrate STT for Voice tab
