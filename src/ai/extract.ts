/**
 * Orchestrator: extract a recipe draft from raw text, image, or audio via the configured AI provider.
 */

import { File } from "expo-file-system";
import { AIError } from "./types";
import type { AIConfig, AIParsedRecipeDraft } from "./types";
import { generate } from "./ollama";
import { buildRecipeExtractionPrompt, buildRecipeVisionPrompt } from "./prompts";
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

export async function extractRecipeFromAudio(audioUri: string): Promise<AIParsedRecipeDraft> {
  const config = await loadAIConfig();
  if (!config) {
    throw new AIError("NOT_CONFIGURED", "AI Provider is not configured.");
  }

  return extractRecipeFromAudioWithConfig(audioUri, config);
}

export async function extractRecipeFromAudioWithConfig(
  audioUri: string,
  config: AIConfig
): Promise<AIParsedRecipeDraft> {
  // Read audio file as base64
  let audioBase64: string;
  try {
    const audioFile = new File(audioUri);
    audioBase64 = await audioFile.base64();
  } catch (e) {
    throw new AIError("READ_ERROR", "Failed to read audio file.");
  }

  const prompt = buildRecipeExtractionPrompt(
    "[User recorded audio describing a recipe. Extract the recipe details from the audio.]"
  );
  const result = await generate(config, prompt, undefined, [audioBase64]);
  const draft = parseRecipeResponse(result.response);
  return draft;
}

export async function extractRecipeFromImage(imageUri: string): Promise<AIParsedRecipeDraft> {
  const config = await loadAIConfig();
  if (!config) {
    throw new AIError("NOT_CONFIGURED", "AI Provider is not configured.");
  }

  return extractRecipeFromImageWithConfig(imageUri, config);
}

export async function extractRecipeFromImageWithConfig(
  imageUri: string,
  config: AIConfig
): Promise<AIParsedRecipeDraft> {
  // Read image file as base64
  let imageBase64: string;
  try {
    const imageFile = new File(imageUri);
    imageBase64 = await imageFile.base64();
  } catch (e) {
    throw new AIError("READ_ERROR", "Failed to read image file.");
  }

  const prompt = buildRecipeVisionPrompt();
  const result = await generate(config, prompt, [imageBase64]);
  const draft = parseRecipeResponse(result.response);
  return draft;
}
