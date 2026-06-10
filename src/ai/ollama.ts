/**
 * Ollama HTTP client.
 */

import { AIError } from "./types";
import type { AIConfig } from "./types";

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
  prompt: string
): Promise<GenerateResponse> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/api/generate`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model: config.model,
          prompt,
          stream: false,
          format: "json",
        }),
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
