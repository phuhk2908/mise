/**
 * Ollama HTTP client.
 */

import { AIError } from "./types";
import type { AIConfig } from "./types";

export const OLLAMA_DEFAULT_BASE_URL = "http://localhost:11434";

const REQUEST_TIMEOUT_MS = 30000;

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(id);
  }
}

export interface GenerateResponse {
  response: string;
  done: boolean;
}

export async function generate(
  config: AIConfig,
  prompt: string,
  images?: string[],
  audio?: string[]
): Promise<GenerateResponse> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/api/generate`;

  if (audio && audio.length > 0) {
    throw new AIError(
      "AUDIO_NOT_SUPPORTED",
      "This AI provider does not support audio input. Please use the Photo tab to paste recipe text instead."
    );
  }

  const body: Record<string, unknown> = {
    model: config.model,
    prompt,
    stream: false,
    format: "json",
  };
  if (images && images.length > 0) {
    body.images = images;
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AIError("INVALID_KEY", `HTTP ${response.status}`);
      }
      if (response.status === 404) {
        throw new AIError("INVALID_MODEL", `HTTP ${response.status} — model may not be available`);
      }
      throw new AIError("NETWORK_ERROR", `HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!data.response || typeof data.response !== "string") {
      throw new AIError("INVALID_RESPONSE", "Missing response field from Ollama");
    }

    return data as GenerateResponse;
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Request timed out. Check your Ollama server URL.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}

export async function listModels(config: AIConfig): Promise<void> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/api/tags`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
      },
      10000
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new AIError("INVALID_KEY", `HTTP ${response.status}`);
      }
      throw new AIError("NETWORK_ERROR", `HTTP ${response.status}`);
    }

    const data = await response.json();
    const models: Array<{ name: string }> = data.models ?? [];
    const found = models.some((m) => m.name === config.model || m.name.startsWith(config.model + ":"));

    if (!found) {
      throw new AIError("INVALID_MODEL", `Model "${config.model}" was not found on this Ollama server.`);
    }
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Could not connect to Ollama. Please check your server URL.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}

/**
 * Fetch the list of publicly available models from ollama.com.
 * This does not require authentication and is used for model discovery.
 */
export async function fetchPublicModels(): Promise<string[]> {
  try {
    const response = await fetchWithTimeout(
      "https://ollama.com/api/tags",
      { method: "GET" },
      15000
    );
    if (!response.ok) return [];
    const data = await response.json();
    const models: Array<{ name: string }> = data.models ?? [];
    return models.map((m) => m.name).sort();
  } catch {
    return [];
  }
}
