/**
 * Anthropic HTTP client for Messages API.
 */

import { AIError } from "./types";
import type { AIConfig } from "./types";

export const ANTHROPIC_DEFAULT_BASE_URL = "https://api.anthropic.com";

const REQUEST_TIMEOUT_MS = 30000;
const ANTHROPIC_API_VERSION = "2023-06-01";

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
}

function buildContent(prompt: string, images?: string[]): unknown {
  if (!images || images.length === 0) {
    return prompt;
  }

  const content: unknown[] = [{ type: "text", text: prompt }];
  for (const img of images) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: "image/jpeg",
        data: img,
      },
    });
  }
  return content;
}

export async function generate(
  config: AIConfig,
  prompt: string,
  images?: string[]
): Promise<GenerateResponse> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/v1/messages`;

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: buildContent(prompt, images),
      },
    ],
  };

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new AIError("INVALID_KEY", `HTTP ${response.status}`);
      }
      if (response.status === 404) {
        throw new AIError("INVALID_MODEL", `HTTP ${response.status} — model may not be available`);
      }
      throw new AIError("NETWORK_ERROR", `HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const text: string | undefined = data.content?.[0]?.text;

    if (!text || typeof text !== "string") {
      throw new AIError("INVALID_RESPONSE", "Missing content from Anthropic response");
    }

    return { response: text };
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Request timed out. Check your connection.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}

export async function validateConnection(config: AIConfig): Promise<void> {
  // Anthropic does not expose a simple model list endpoint for validation.
  // We do a lightweight messages request with max_tokens=1 to verify the key + model.
  const url = `${config.baseUrl.replace(/\/$/, "")}/v1/messages`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.apiKey,
          "anthropic-version": ANTHROPIC_API_VERSION,
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      },
      10000
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
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Could not connect to Anthropic. Please check your network.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}
