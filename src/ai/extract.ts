/**
 * Orchestrator: extract a recipe draft from raw text, audio, or image via the configured AI provider.
 */

import { File } from 'expo-file-system';
import { generate } from "./client";
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
  // Only Gemini and OpenAI (Whisper via separate API) support audio.
  // For now, we read the file and error if the provider doesn't support it.
  if (config.provider === "ollama" || config.provider === "anthropic") {
    throw new AIError(
      "AUDIO_NOT_SUPPORTED",
      `${config.provider} does not support audio input. Please paste recipe text instead.`
    );
  }

  // Read audio file as base64
  let audioBase64: string;
  try {
    const audioFile = new File(audioUri);
    audioBase64 = await audioFile.base64();
  } catch {
    throw new AIError("READ_ERROR", "Failed to read audio file.");
  }

  // TODO: Implement for providers that support audio (Gemini, GPT-4o, etc.)
  // For now, only text-based extraction is supported.
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
  } catch {
    throw new AIError("READ_ERROR", "Failed to read image file.");
  }

  const prompt = buildRecipeVisionPrompt();
  const result = await generate(config, prompt, [imageBase64]);
  const draft = parseRecipeResponse(result.response);
  return draft;
}
