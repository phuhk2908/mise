/**
 * Parse Ollama JSON responses into structured recipe drafts.
 */

import { AIError, type AIParsedRecipeDraft, type AIParsedIngredient } from "./types";

interface RawIngredient {
  name?: string;
  amount?: number | null;
  unit?: string;
  originalText?: string;
  notes?: string | null;
}

interface RawStep {
  stepNumber?: number;
  text?: string;
}

interface RawResponse {
  title?: string;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  ingredients?: RawIngredient[];
  steps?: RawStep[];
  categories?: string[];
  notes?: string;
  confidence?: string;
  warnings?: string[];
}

function sanitizeIngredient(raw: RawIngredient): AIParsedIngredient {
  const name = raw.name?.trim() || "Unknown ingredient";
  const amount = typeof raw.amount === "number" ? raw.amount : null;
  const unit = raw.unit?.trim() || "";
  const originalText = raw.originalText?.trim() || name;
  const notes = raw.notes?.trim() || undefined;

  return { name, amount, unit, originalText, notes };
}

export function parseRecipeResponse(jsonText: string): AIParsedRecipeDraft {
  let parsed: RawResponse;

  try {
    parsed = JSON.parse(jsonText) as RawResponse;
  } catch {
    throw new AIError("INVALID_RESPONSE", "AI returned invalid JSON. Please try again.");
  }

  if (!parsed.title || typeof parsed.title !== "string") {
    throw new AIError("INVALID_RESPONSE", "AI response missing recipe title.");
  }

  const confidence = (parsed.confidence ?? "").toLowerCase();
  const normalizedConfidence: "high" | "medium" | "low" =
    confidence === "high" || confidence === "medium" || confidence === "low"
      ? confidence
      : "low";

  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.filter((w): w is string => typeof w === "string")
    : [];

  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients.map(sanitizeIngredient)
    : [];

  const steps = Array.isArray(parsed.steps)
    ? parsed.steps
        .filter((s): s is RawStep => typeof s?.text === "string")
        .map((s, index) => ({
          stepNumber: typeof s.stepNumber === "number" ? s.stepNumber : index + 1,
          text: s.text!.trim(),
        }))
    : [];

  const categories = Array.isArray(parsed.categories)
    ? parsed.categories.filter((c): c is string => typeof c === "string")
    : [];

  return {
    title: parsed.title.trim(),
    description: (parsed.description ?? "").trim(),
    prepTime: (parsed.prepTime ?? "").trim(),
    cookTime: (parsed.cookTime ?? "").trim(),
    servings: typeof parsed.servings === "number" ? parsed.servings : 4,
    ingredients,
    steps,
    categories,
    notes: (parsed.notes ?? "").trim(),
    confidence: normalizedConfidence,
    warnings,
  };
}
