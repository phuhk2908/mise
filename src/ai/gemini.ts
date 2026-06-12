/**
 * Google Gemini HTTP client for generateContent.
 */

import { AIError } from "./types";
import type { AIConfig } from "./types";

export const GEMINI_DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

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

function buildParts(prompt: string, images?: string[]): unknown[] {
  const parts: unknown[] = [{ text: prompt }];
  if (images) {
    for (const img of images) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: img,
        },
      });
    }
  }
  return parts;
}

export async function generate(
  config: AIConfig,
  prompt: string,
  images?: string[]
): Promise<GenerateResponse> {
  const base = config.baseUrl.replace(/\/$/, "");
  const url = `${base}/models/${config.model}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

  const generationConfig: { temperature: number; responseMimeType?: string } = {
    temperature: 0.2,
  };

  if (!images || images.length === 0) {
    generationConfig.responseMimeType = "application/json";
  }

  const body = {
    contents: [{ parts: buildParts(prompt, images) }],
    generationConfig,
  };

  try {
    const response = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
      REQUEST_TIMEOUT_MS
    );

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 400 && errorBody.toLowerCase().includes("api key not valid")) {
        throw new AIError("INVALID_KEY", "Invalid Gemini API key.");
      }
      if (response.status === 404 || errorBody.toLowerCase().includes("not found")) {
        throw new AIError("INVALID_MODEL", `Model "${config.model}" was not found.`);
      }
      throw new AIError("NETWORK_ERROR", `HTTP ${response.status}: ${errorBody.slice(0, 200)}`);
    }

    const data = await response.json();
    const text: string | undefined = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || typeof text !== "string") {
      throw new AIError("INVALID_RESPONSE", "Missing text from Gemini response");
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
  const base = config.baseUrl.replace(/\/$/, "");
  const url = `${base}/models?key=${encodeURIComponent(config.apiKey)}`;

  try {
    const response = await fetchWithTimeout(
      url,
      { method: "GET", headers: { "Content-Type": "application/json" } },
      10000
    );

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 400 && errorBody.toLowerCase().includes("api key not valid")) {
        throw new AIError("INVALID_KEY", "Invalid Gemini API key.");
      }
      throw new AIError("NETWORK_ERROR", `HTTP ${response.status}`);
    }

    const data = await response.json();
    const models: { name: string }[] = data.models ?? [];
    const found = models.some((m) => {
      const shortName = m.name.replace(/^models\//, "");
      return shortName === config.model || m.name === config.model;
    });

    if (!found) {
      throw new AIError("INVALID_MODEL", `Model "${config.model}" was not found in your Gemini account.`);
    }
  } catch (err) {
    if (err instanceof AIError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new AIError("TIMEOUT", "Could not connect to Gemini. Please check your network.");
    }
    throw new AIError("NETWORK_ERROR", err instanceof Error ? err.message : String(err));
  }
}
