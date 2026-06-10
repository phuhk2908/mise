/**
 * Orchestrator: extract a recipe draft from raw text via Ollama.
 */

import { AIError } from "./types";
import type { AIConfig, AIParsedRecipeDraft } from "./types";
import { generate } from "./ollama";
import { buildRecipeExtractionPrompt } from "./prompts";
import { parseRecipeResponse } from "./parser";
import { loadAIConfig } from "./storage";

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
