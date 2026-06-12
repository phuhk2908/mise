/**
 * Central types for AI provider integration.
 */

export type AIProvider = "ollama" | "openai" | "anthropic" | "gemini";

export interface AIConfig {
  provider: AIProvider;
  model: string;
  baseUrl: string;
  apiKey: string;
}

export interface AIParsedIngredient {
  name: string;
  amount: number | null;
  unit: string;
  originalText: string;
  quantityText: string | null;
  displayQuantity: string | null;
  unitCategory: "metric_mass" | "metric_volume" | "preserve_unit" | "to_taste" | "unknown";
  scalingPolicy: "metric_linear" | "preserve_unit_linear" | "no_scale" | "review";
  components: { amount: number; unit: string; text: string }[];
  isRange: boolean;
  rangeMin: number | null;
  rangeMax: number | null;
  rangeUnit: string | null;
  notes: string | null;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export interface AIParsedStep {
  stepNumber: number;
  text: string;
}

export interface AIParsedRecipeDraft {
  title: string | null;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
  servingsSource: "explicit" | "default";
  servingsNote: string | null;
  ingredients: AIParsedIngredient[];
  steps: AIParsedStep[];
  categories: string[];
  notes: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

export type AIErrorCode =
  | "NOT_CONFIGURED"
  | "INVALID_KEY"
  | "INVALID_MODEL"
  | "INVALID_RESPONSE"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "AUDIO_NOT_SUPPORTED"
  | "VISION_NOT_SUPPORTED"
  | "READ_ERROR"
  | "UNKNOWN";

export class AIError extends Error {
  constructor(
    public code: AIErrorCode,
    message: string
  ) {
    super(message);
    this.name = "AIError";
  }
}

/** Cloud providers that require an API key. */
export const CLOUD_PROVIDERS: AIProvider[] = ["openai", "anthropic", "gemini"];

/** Check if a provider requires an API key (cloud providers). */
export function isCloudProvider(provider: AIProvider): boolean {
  return CLOUD_PROVIDERS.includes(provider);
}
