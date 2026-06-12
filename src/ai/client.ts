/**
 * Unified AI client router.
 * Dispatches generate and validateConnection calls to the correct provider.
 */

import * as ollama from "./ollama";
import * as openai from "./openai";
import * as anthropic from "./anthropic";
import * as gemini from "./gemini";
import { AIError } from "./types";
import type { AIConfig } from "./types";

export { OLLAMA_DEFAULT_BASE_URL } from "./ollama";
export { OPENAI_DEFAULT_BASE_URL } from "./openai";
export { ANTHROPIC_DEFAULT_BASE_URL } from "./anthropic";
export { GEMINI_DEFAULT_BASE_URL } from "./gemini";

export interface GenerateResponse {
  response: string;
}

export async function generate(
  config: AIConfig,
  prompt: string,
  images?: string[]
): Promise<GenerateResponse> {
  switch (config.provider) {
    case "ollama":
      return ollama.generate(config, prompt, images);
    case "openai":
      return openai.generate(config, prompt, images);
    case "anthropic":
      return anthropic.generate(config, prompt, images);
    case "gemini":
      return gemini.generate(config, prompt, images);
    default:
      throw new AIError("NOT_CONFIGURED", `Unknown provider: ${(config as AIConfig).provider}`);
  }
}

export async function validateConnection(config: AIConfig): Promise<void> {
  switch (config.provider) {
    case "ollama":
      return ollama.listModels(config);
    case "openai":
      return openai.validateConnection(config);
    case "anthropic":
      return anthropic.validateConnection(config);
    case "gemini":
      return gemini.validateConnection(config);
    default:
      throw new AIError("NOT_CONFIGURED", `Unknown provider: ${(config as AIConfig).provider}`);
  }
}

export async function fetchPublicModels(_provider: AIConfig["provider"]): Promise<string[]> {
  switch (_provider) {
    case "ollama":
      return ollama.fetchPublicModels();
    case "openai":
      // OpenAI models are well-known; return common defaults
      return [
        "gpt-4o",
        "gpt-4o-mini",
        "gpt-4-turbo",
        "gpt-3.5-turbo",
      ];
    case "anthropic":
      return [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229",
      ];
    case "gemini":
      return [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash-8b",
      ];
    default:
      return [];
  }
}

export function getDefaultBaseUrl(provider: AIConfig["provider"]): string {
  switch (provider) {
    case "ollama":
      return ollama.OLLAMA_DEFAULT_BASE_URL;
    case "openai":
      return openai.OPENAI_DEFAULT_BASE_URL;
    case "anthropic":
      return anthropic.ANTHROPIC_DEFAULT_BASE_URL;
    case "gemini":
      return gemini.GEMINI_DEFAULT_BASE_URL;
    default:
      return "";
  }
}

export function getDefaultModel(provider: AIConfig["provider"]): string {
  switch (provider) {
    case "ollama":
      return "gemma3";
    case "openai":
      return "gpt-4o";
    case "anthropic":
      return "claude-3-5-sonnet-20241022";
    case "gemini":
      return "gemini-1.5-flash";
    default:
      return "";
  }
}
