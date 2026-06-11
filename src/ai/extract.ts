/**
 * Orchestrator: extract a recipe draft from raw text or audio via the configured AI provider.
 */

import { File } from 'expo-file-system';
import { generate } from "./ollama";
import { parseRecipeResponse } from "./parser";
import { buildRecipeExtractionPrompt, buildRecipeVisionPrompt } from "./prompts";
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
  if (config.provider === "ollama") {
    throw new AIError(
      "AUDIO_NOT_SUPPORTED",
      "Ollama does not support audio input. Please paste recipe text in the Photo tab instead."
    );
  }

  // Read audio file as base64
  let audioBase64: string;
  try {
    const audioFile = new File(audioUri);
    audioBase64 = await audioFile.base64();
  } catch (e) {
    throw new AIError("READ_ERROR", "Failed to read audio file.");
  }

  // TODO: Implement for providers that support audio (Gemini, GPT-4o, etc.)
  // For now, only Ollama is supported and it does not accept audio input.
  void audioBase64;
  throw new AIError(
    "AUDIO_NOT_SUPPORTED",
    "Audio extraction is only available with providers that support audio input."
  );
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
