import * as SecureStore from "expo-secure-store";
import type { AIConfig, AIProvider } from "./types";
import { isCloudProvider } from "./types";

const KEYS = {
  provider: "mise_ai_provider",
  model: "mise_ai_model",
  baseUrl: "mise_ai_base_url",
  apiKey: "mise_ai_api_key",
  // Flag to indicate that the key was intentionally left blank
  apiKeySet: "mise_ai_api_key_set",
} as const;

export async function saveAIConfig(config: AIConfig): Promise<void> {
  await SecureStore.setItemAsync(KEYS.provider, config.provider);
  await SecureStore.setItemAsync(KEYS.model, config.model);
  await SecureStore.setItemAsync(KEYS.baseUrl, config.baseUrl);
  if (isCloudProvider(config.provider)) {
    // Cloud providers require a key; store it
    await SecureStore.setItemAsync(KEYS.apiKey, config.apiKey);
    await SecureStore.deleteItemAsync(KEYS.apiKeySet);
  } else {
    await SecureStore.setItemAsync(KEYS.apiKey, config.apiKey);
    // Use flag to intentionally note blank local key
    await SecureStore.setItemAsync(KEYS.apiKeySet, String(true));
  }
}

export async function loadAIConfig(): Promise<AIConfig | null> {
  const provider = await SecureStore.getItemAsync(KEYS.provider);
  const model = await SecureStore.getItemAsync(KEYS.model);
  const baseUrl = await SecureStore.getItemAsync(KEYS.baseUrl);
  const apiKey = await SecureStore.getItemAsync(KEYS.apiKey);

  if (!provider || !model || !baseUrl) {
    return null;
  }

  // For local providers, apiKey can be empty/undefined; if apiKey is absent but
  // apiKeySet flag is present, allow a blank key.
  const providerTyped = provider as AIProvider;
  if (isCloudProvider(providerTyped)) {
    if (!apiKey) {
      return null;
    }
  }

  return {
    provider: providerTyped,
    model,
    baseUrl,
    apiKey: apiKey ?? "",
  };
}

export async function clearAIConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(KEYS.provider);
  await SecureStore.deleteItemAsync(KEYS.model);
  await SecureStore.deleteItemAsync(KEYS.baseUrl);
  await SecureStore.deleteItemAsync(KEYS.apiKey);
  await SecureStore.deleteItemAsync(KEYS.apiKeySet);
}

export async function hasAIConfig(): Promise<boolean> {
  const provider = await SecureStore.getItemAsync(KEYS.provider);
  const model = await SecureStore.getItemAsync(KEYS.model);
  const baseUrl = await SecureStore.getItemAsync(KEYS.baseUrl);
  if (!provider || !model || !baseUrl) {
    return false;
  }
  const providerTyped = provider as AIProvider;
  if (isCloudProvider(providerTyped)) {
    const apiKey = await SecureStore.getItemAsync(KEYS.apiKey);
    return !!apiKey;
  }
  return true;
}
