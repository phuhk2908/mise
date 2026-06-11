/**
 * Central types for AI provider integration.
 */

export type AIProvider = "ollama";

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
  notes?: string;
}

export interface AIParsedStep {
  stepNumber: number;
  text: string;
}

export interface AIParsedRecipeDraft {
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  servings: number;
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
