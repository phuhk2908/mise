import * as SecureStore from "expo-secure-store";
import type { AIConfig } from "./types";

const KEYS = {
  provider: "mise_ai_provider",
  model: "mise_ai_model",
  baseUrl: "mise_ai_base_url",
  apiKey: "mise_ai_api_key",
} as const;

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await SecureStore.setItemAsync(KEYS.provider, config.provider);
  await SecureStore.setItemAsync(KEYS.model, config.model);
  await SecureStore.setItemAsync(KEYS.baseUrl, config.baseUrl);
  await SecureStore.setItemAsync(KEYS.apiKey, config.apiKey);
}

export async function loadAIConfig(): Promise<AIConfig | null> {
  const provider = await SecureStore.getItemAsync(KEYS.provider);
  const model = await SecureStore.getItemAsync(KEYS.model);
  const baseUrl = await SecureStore.getItemAsync(KEYS.baseUrl);
  const apiKey = await SecureStore.getItemAsync(KEYS.apiKey);

  if (!provider || !model || !baseUrl || !apiKey) {
    return null;
  }

  return {
    provider: provider as AIConfig["provider"],
    model,
    baseUrl,
    apiKey,
  };
}

export async function clearAIConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.provider);
  await SecureStore.deleteItemAsync(KEYS.model);
  await SecureStore.deleteItemAsync(KEYS.baseUrl);
  await SecureStore.deleteItemAsync(KEYS.apiKey);
}

export async function hasAIConfig(): Promise<boolean> {
  const provider = await SecureStore.getItemAsync(KEYS.provider);
  const model = await SecureStore.getItemAsync(KEYS.model);
  const baseUrl = await SecureStore.getItemAsync(KEYS.baseUrl);
  const apiKey = await SecureStore.getItemAsync(KEYS.apiKey);
  return !!(provider && model && baseUrl && apiKey);
}
