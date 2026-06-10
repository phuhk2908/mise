# Mise — AI Provider Setup Spec

## 1. Goal

Mise will allow users to connect their own AI provider so they can use AI-powered features without Mise storing their API key on the server.

For the first version, Mise will start with:

```text
Ollama
```

The app should still be designed in a way that allows more providers to be added later, such as:

```text
Gemini
OpenAI
Anthropic
Local Ollama
```

The first AI features to support are:

```text
1. Extracting a recipe from text
2. Turning voice input into a structured recipe
```

Future AI features may include:

```text
1. Extracting recipes from images
2. Suggesting recipes based on available ingredients
3. Suggesting recipe categories
4. Using vision models directly on images
```

---

## 2. Product Direction

Mise remains a local-first recipe app.

AI is only used as an optional helper to make recipe creation faster and easier. The core experience should still work without AI.

The user should be able to:

```text
Save recipes manually
Adjust servings
View ingredients
Edit recipes
Organize recipes
Use saved recipes offline
```

AI should support the workflow, not replace it.

---

## 3. AI Provider Strategy

Mise will begin with Ollama as the first supported AI provider.

The app should still show the provider selection as a setting, even if Ollama is the only option for now.

This keeps the product ready for future expansion.

Current provider option:

```text
Ollama
```

Future provider options:

```text
Gemini
OpenAI
Anthropic
Local Ollama
```

---

## 4. AI Settings Screen

Mise should include an AI Settings screen where users can configure their AI provider.

Suggested location:

```text
More → AI Settings
```

Or:

```text
Settings → AI Provider
```

### Fields

```text
Provider
Model
API Key
```

### Default values

```text
Provider: Ollama
Model: gemma4
```

The model field should allow manual input, because available models may vary depending on the user's Ollama setup.

### Actions

```text
Test Connection
Save
Clear Key
```

---

## 5. AI Settings Behavior

### When the user opens AI Settings

The user sees:

```text
Connect AI Provider

Mise uses AI to help extract recipes from text or voice.
Your API key is stored on this device and is not stored on Mise servers.
```

### When the user saves settings

Mise stores the provider, model, and API key locally on the user’s device.

Success message:

```text
AI settings saved.
```

### When the user clears settings

Mise removes the provider, model, and API key from the device.

Success message:

```text
AI settings removed from this device.
```

### When the user tests the connection

If successful:

```text
Connection successful.
```

If unsuccessful:

```text
Could not connect. Please check your API key or model.
```

---

## 6. Missing AI Settings State

If the user tries to use an AI feature without setting up AI first, Mise should show:

```text
AI Provider is not configured.

To use AI features, choose a provider and enter your API key.

[Open AI Settings]
```

The user should not be blocked from using the rest of the app.

---

## 7. API Key Handling

The API key should be treated as private user data.

Mise should follow these rules:

```text
Do not store the API key on Mise servers.
Do not show the full API key after it has been saved.
Do not include the API key in logs.
Do not include the API key in analytics.
Do not include the API key in crash reports.
Allow the user to delete the API key at any time.
```

In the UI, the API key should be hidden by default:

```text
••••••••••••••••••••
```

The user may have a show/hide option while editing.

---

## 8. AI Feature 1 — Extract Recipe From Text

### Purpose

This feature turns raw recipe text into a clean, structured recipe.

It can be used for:

```text
Text copied from a website
Text typed by the user
Text extracted from an image using OCR
Messy recipe notes
```

### User flow

```text
User provides recipe text
→ Mise sends the text to the AI provider
→ AI returns a structured recipe
→ Mise shows a review screen
→ User edits if needed
→ User saves the recipe
```

### Expected output

The AI should return:

```text
Recipe title
Description
Prep time
Cook time
Servings
Ingredients
Steps
Suggested categories
Notes
Confidence level
Warnings if something is unclear
```

### Review screen

Before saving, Mise should always show a review screen.

The user should be able to edit:

```text
Title
Description
Servings
Times
Ingredients
Units
Steps
Categories
Notes
```

The AI result should never be saved silently without user review.

---

## 9. AI Feature 2 — Voice Input to Recipe

### Purpose

This feature turns spoken cooking notes into a structured recipe.

The user may speak naturally, for example:

```text
This is pork belly with eggs for four people.
Use half a kilo of pork belly, five eggs, two tablespoons of fish sauce, one tablespoon of sugar, minced shallots, and simmer for about forty minutes.
```

Mise should turn this into a structured recipe.

### User flow

```text
User records or speaks a recipe
→ Mise gets a text transcript
→ Mise sends the transcript to the AI provider
→ AI cleans and structures the transcript
→ Mise shows a review screen
→ User edits if needed
→ User saves the recipe
```

### Expected output

The AI should return:

```text
Recipe title
Description
Prep time
Cook time
Servings
Ingredients
Steps
Suggested categories
Notes
Confidence level
Warnings if something is unclear
```

### Important behavior

Voice input may be messy.

The AI should handle:

```text
Missing punctuation
Repeated words
Filler words
Unclear order
Ingredients and steps mixed together
Casual language
Vietnamese cooking measurements
```

If the user only says ingredients, Mise should still create a draft recipe with ingredients and leave the steps empty.

If the recipe is unclear, Mise should mark it as low confidence and ask the user to review carefully.

---

## 10. AI Output Quality Rules

AI output should follow these rules:

```text
Do not invent ingredients that were not provided.
Do not invent cooking steps that were not provided.
Clean up obvious typos.
Keep the original meaning.
Preserve uncertain quantities instead of forcing them into exact numbers.
Use simple recipe categories.
Return warnings when information is missing or unclear.
```

Examples of uncertain quantities:

```text
a little
to taste
a few slices
some
enough to cover
vừa đủ
một ít
vài lát
```

These should be preserved instead of converted into fake exact values.

---

## 11. Ingredient Handling Rules

Mise should keep ingredient parsing flexible.

The AI should identify:

```text
Ingredient name
Quantity
Unit
Note
Original text if available
```

Example:

```text
half a kilo of pork belly
```

Should become:

```text
Name: pork belly
Quantity: 500
Unit: g
Original text: half a kilo of pork belly
```

Example:

```text
a little pepper
```

Should become:

```text
Name: pepper
Quantity: a little
Unit:
Original text: a little pepper
```

The AI should not force unclear measurements into exact values.

---

## 12. Category Suggestions

AI may suggest categories when creating a recipe.

Suggested categories should come from common Mise categories such as:

```text
Breakfast
Lunch
Dinner
Snack
Dessert
Vietnamese
Home Cooking
Main Dish
Soup
Stir-fry
Fried
Grilled
Steamed
Boiled
Drink
Sweet
Healthy
Quick
Easy
Meal Prep
```

The user can keep, remove, or edit suggested categories before saving.

---

## 13. Confidence and Warnings

AI results should include a confidence level:

```text
High
Medium
Low
```

### High confidence

Use when the recipe is clear and complete.

### Medium confidence

Use when the recipe is mostly clear but missing some information.

### Low confidence

Use when the input is incomplete, messy, or uncertain.

When confidence is low, Mise should show:

```text
Mise is not fully confident about this recipe. Please review it before saving.
```

Warnings may include:

```text
No servings found.
No clear cooking steps found.
Some ingredient quantities are unclear.
The recipe title was not found.
The input appears to contain only ingredients.
```

---

## 14. Image Extraction Scope

For now, direct image understanding is not part of this phase.

The preferred image flow is:

```text
Image
→ OCR text
→ Extract Recipe From Text
```

This means Mise first gets text from the image, then sends that text to the AI provider for recipe extraction.

Direct vision-based recipe extraction can be considered later.

---

## 15. Voice Scope

For now, the AI provider receives text transcript only.

Mise should not assume that Ollama will handle audio transcription in this phase.

The voice flow is:

```text
Voice
→ Transcript
→ AI parses transcript into recipe
```

The speech-to-text solution should be researched separately before implementation.

---

## 16. Error States

### AI not configured

```text
AI Provider is not configured.
```

Action:

```text
Open AI Settings
```

### Invalid API key

```text
Could not connect to AI Provider. Please check your API key.
```

### Invalid model

```text
The selected model is not available. Please check the model name.
```

### AI returned invalid data

```text
AI returned an invalid result. Please try again.
```

### Low confidence result

```text
Mise is not fully confident about this recipe. Please review it before saving.
```

---

## 17. MVP Scope

### Include

```text
AI Settings screen
Provider selection with Ollama as the only option
Model input
API key input
Test connection
Save AI settings locally
Clear AI settings
Extract Recipe From Text
Parse Voice Transcript Into Recipe
Review screen before saving
Confidence and warnings
```

### Exclude for now

```text
Gemini support
OpenAI support
Server-side API key storage
User accounts for AI settings
Syncing API keys across devices
Direct image vision model support
Direct audio transcription through Ollama
Full AI chat interface
Complex unit conversion
```

---

## 18. Implementation Priority

### Priority 1 — AI Settings

```text
Create AI Settings screen
Add Provider field with Ollama as the only option
Add Model field
Add API Key field
Add Test Connection
Add Save
Add Clear Key
```

### Priority 2 — Extract Recipe From Text

```text
Allow user or OCR flow to provide raw recipe text
Send text to Ollama
Receive structured recipe
Show review screen
Allow user edits
Save recipe
```

### Priority 3 — Voice Transcript Parsing

```text
Get transcript from voice input
Send transcript to Ollama
Receive structured recipe
Show review screen
Allow user edits
Save recipe
```

### Priority 4 — Future AI Features

```text
Image OCR integration
AI recipe recommendations
Category suggestions as a separate action
Additional AI providers
```

---

## 19. Final Product Flow

```text
User opens AI Settings
→ Provider is Ollama
→ User enters model, for example gemma4
→ User enters Ollama API key
→ User tests connection
→ User saves settings

User uses AI Extract or Voice Input
→ Mise sends content to Ollama
→ Ollama returns structured recipe data
→ Mise shows review screen
→ User edits if needed
→ User saves recipe locally
```

---

## 20. Future Provider Readiness

Even though the first version only supports Ollama, the UI and product flow should be provider-ready.

The AI Settings screen should be designed around:

```text
Provider
Model
API Key
```

For now:

```text
Provider: Ollama
```

Later:

```text
Provider: Ollama / Gemini / OpenAI / Anthropic
```

This keeps the product flexible without complicating the first implementation.
