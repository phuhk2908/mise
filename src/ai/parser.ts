/**
 * Parse Ollama JSON responses into structured recipe drafts.
 */

import { AIError, type AIParsedRecipeDraft, type AIParsedIngredient } from "./types";

interface RawComponent {
  amount?: number;
  unit?: string;
  text?: string;
}

interface RawIngredient {
  name?: string;
  amount?: number | null;
  unit?: string;
  originalText?: string;
  quantityText?: string | null;
  displayQuantity?: string | null;
  unitCategory?: string;
  scalingPolicy?: string;
  components?: RawComponent[];
  isRange?: boolean;
  rangeMin?: number | null;
  rangeMax?: number | null;
  rangeUnit?: string | null;
  notes?: string | null;
  confidence?: string;
  warnings?: string[];
}

interface RawStep {
  stepNumber?: number;
  text?: string;
}

interface RawResponse {
  title?: string | null;
  description?: string;
  prepTime?: string;
  cookTime?: string;
  servings?: number;
  servingsSource?: string;
  servingsNote?: string | null;
  ingredients?: RawIngredient[];
  steps?: RawStep[];
  categories?: string[];
  notes?: string;
  confidence?: string;
  warnings?: string[];
}

const VALID_UNIT_CATEGORIES = new Set([
  "metric_mass",
  "metric_volume",
  "preserve_unit",
  "to_taste",
  "unknown",
]);

const VALID_SCALING_POLICIES = new Set([
  "metric_linear",
  "preserve_unit_linear",
  "no_scale",
  "review",
]);

function normalizeConfidence(raw: unknown): "high" | "medium" | "low" {
  const str = String(raw ?? "").toLowerCase();
  if (str === "high" || str === "medium" || str === "low") return str;
  return "low";
}

function sanitizeComponent(raw: RawComponent): { amount: number; unit: string; text: string } {
  return {
    amount: typeof raw.amount === "number" ? raw.amount : 0,
    unit: String(raw.unit ?? "").trim(),
    text: String(raw.text ?? "").trim(),
  };
}

function sanitizeIngredient(raw: RawIngredient): AIParsedIngredient {
  const name = String(raw.name ?? "").trim() || "Unknown ingredient";
  const amount = typeof raw.amount === "number" ? raw.amount : null;
  const unit = String(raw.unit ?? "").trim();
  const originalText = String(raw.originalText ?? "").trim() || name;
  const quantityText = raw.quantityText !== undefined ? String(raw.quantityText).trim() || null : null;
  const displayQuantity = raw.displayQuantity !== undefined ? String(raw.displayQuantity).trim() || null : null;

  const unitCategory = VALID_UNIT_CATEGORIES.has(String(raw.unitCategory ?? "").toLowerCase())
    ? (String(raw.unitCategory ?? "").toLowerCase() as AIParsedIngredient["unitCategory"])
    : "unknown";

  const scalingPolicy = VALID_SCALING_POLICIES.has(String(raw.scalingPolicy ?? "").toLowerCase())
    ? (String(raw.scalingPolicy ?? "").toLowerCase() as AIParsedIngredient["scalingPolicy"])
    : amount === null && !raw.isRange
      ? "no_scale"
      : raw.isRange
        ? "review"
        : unitCategory === "metric_mass" || unitCategory === "metric_volume"
          ? "metric_linear"
          : unitCategory === "preserve_unit"
            ? "preserve_unit_linear"
            : "review";

  const components = Array.isArray(raw.components)
    ? raw.components.filter((c): c is RawComponent => typeof c === "object" && c !== null).map(sanitizeComponent)
    : [];

  const isRange = Boolean(raw.isRange);
  const rangeMin = typeof raw.rangeMin === "number" ? raw.rangeMin : null;
  const rangeMax = typeof raw.rangeMax === "number" ? raw.rangeMax : null;
  const rangeUnit = raw.rangeUnit !== undefined ? String(raw.rangeUnit ?? "").trim() || null : null;

  const notes = raw.notes !== undefined ? String(raw.notes ?? "").trim() || null : null;
  const confidence = normalizeConfidence(raw.confidence);
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings.filter((w): w is string => typeof w === "string")
    : [];

  return {
    name,
    amount,
    unit,
    originalText,
    quantityText,
    displayQuantity,
    unitCategory,
    scalingPolicy,
    components,
    isRange,
    rangeMin,
    rangeMax,
    rangeUnit,
    notes,
    confidence,
    warnings,
  };
}

export function parseRecipeResponse(jsonText: string): AIParsedRecipeDraft {
  let parsed: RawResponse;

  try {
    parsed = JSON.parse(jsonText) as RawResponse;
  } catch {
    throw new AIError("INVALID_RESPONSE", "AI returned invalid JSON. Please try again.");
  }

  const confidence = normalizeConfidence(parsed.confidence);

  const warnings = Array.isArray(parsed.warnings)
    ? parsed.warnings.filter((w): w is string => typeof w === "string")
    : [];

  const ingredients = Array.isArray(parsed.ingredients)
    ? parsed.ingredients
        .filter((i): i is RawIngredient => typeof i === "object" && i !== null)
        .map(sanitizeIngredient)
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

  const servingsSource = parsed.servingsSource === "explicit" ? "explicit" : "default";
  const servings = typeof parsed.servings === "number" ? parsed.servings : 1;

  // If servings defaulted to 1 and source is default, ensure a warning exists
  if (servingsSource === "default" && !warnings.some((w) => w.toLowerCase().includes("servings"))) {
    warnings.push("Servings were not provided; defaulted to 1 original recipe unit.");
  }

  return {
    title: parsed.title !== undefined && parsed.title !== null ? String(parsed.title).trim() || null : null,
    description: String(parsed.description ?? "").trim(),
    prepTime: String(parsed.prepTime ?? "").trim(),
    cookTime: String(parsed.cookTime ?? "").trim(),
    servings,
    servingsSource,
    servingsNote: parsed.servingsNote !== undefined ? String(parsed.servingsNote ?? "").trim() || null : null,
    ingredients,
    steps,
    categories,
    notes: String(parsed.notes ?? "").trim(),
    confidence,
    warnings,
  };
}
