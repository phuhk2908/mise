/**
 * Orchestrator: extract a recipe draft from raw text via Ollama.
 */

import { generate } from "./ollama";
import { parseRecipeResponse } from "./parser";
import { buildRecipeExtractionPrompt } from "./prompts";
import { loadAIConfig } from "./storage";
import type { AIConfig, AIParsedRecipeDraft } from "./types";
import { AIError } from "./types";

export async function extractRecipeFromText(rawText: string): Promise<AIParsedRecipeDraft> {
  const config = await loadAIConfig();
  if (!config) {
    throw new AIError("NOT_CONFIGURED", "AI Provider is not configured.");
  }

  return extractRecipeFromTextWithConfig(rawText, config);
}

export async function extractRecipeFromTextWithConfig(
  rawText: string,
  config: AIConfig
): Promise<AIParsedRecipeDraft> {
  const prompt = buildRecipeExtractionPrompt(rawText);
  const result = await generate(config, prompt);
  const draft = parseRecipeResponse(result.response);
  return draft;
}
