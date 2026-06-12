/**
 * OpenAI HTTP client for chat completions.
 */

import { AIError } from "./types";
import type { AIConfig } from "./types";

export const OPENAI_DEFAULT_BASE_URL = "https://api.openai.com/v1";

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
}

function buildMessages(prompt: string, images?: string[]): unknown[] {
  if (!images || images.length === 0) {
    return [{ role: "user", content: prompt }];
  }

  const content: unknown[] = [{ type: "text", text: prompt }];
  for (const img of images) {
    content.push({
      type: "image_url",
      image_url: { url: `data:image/jpeg;base64,${img}` },
    });
  }
  return [{ role: "user", content }];
}

export async function generate(
  config: AIConfig,
  prompt: string,
  images?: string[]
): Promise<GenerateResponse> {
  const url = `${config.baseUrl.replace(/\/$/, "")}/chat/completions`;

  const body: Record<string, unknown> = {
    model: config.model,
    messages: buildMessages(prompt, images),
    temperature: 0.2,
  };

  if (!images || images.length === 0) {
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
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
    const text: string | undefined = data.choices?.[0]?.message?.content;

    if (!text || typeof text !== "string") {
      throw new AIError("INVALID_RESPONSE", "Missing content from OpenAI response");
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
  const url = `${config.baseUrl.replace(/\/$/, "")}/models`;

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
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
    const models: { id: string }[] = data.data ?? [];
    const found = models.some(
      (m) => m.id === config.model || m.id.startsWith(config.model)
    );

    if (!found) {
      throw new AIError("INVALID_MODEL", `Model "${config.model}" was not found in your OpenAI account.`);
    }
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Could not connect to OpenAI. Please check your network.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}
