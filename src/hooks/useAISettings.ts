import { useState, useEffect, useCallback } from "react";
import { loadAIConfig, saveAIConfig, clearAIConfig } from "../ai/storage";
import { AIError, type AIConfig, type AIErrorCode } from "../ai/types";
import { listModels } from "../ai/ollama";

export interface UseAISettingsReturn {
  config: AIConfig | null;
  isLoaded: boolean;
  isSaving: boolean;
  isTesting: boolean;
  testResult: { success: boolean; message: string } | null;
  save: (config: AIConfig) => Promise<void>;
  clear: () => Promise<void>;
  testConnection: () => Promise<void>;
  reload: () => Promise<void>;
}

export function useAISettings(): UseAISettingsReturn {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const reload = useCallback(async () => {
    try {
      const loaded = await loadAIConfig();
      setConfig(loaded);
    } catch {
      setConfig(null);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const save = useCallback(async (newConfig: AIConfig) => {
    setIsSaving(true);
    try {
      await saveAIConfig(newConfig);
      setConfig(newConfig);
      setTestResult(null);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const clear = useCallback(async () => {
    setIsSaving(true);
    try {
      await clearAIConfig();
      setConfig(null);
      setTestResult(null);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const testConnection = useCallback(async () => {
    if (!config) {
      setTestResult({ success: false, message: "AI_NOT_CONFIGURED" });
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    try {
      await listModels(config);
      setTestResult({ success: true, message: "TEST_SUCCESS" });
    } catch (err) {
      const code: AIErrorCode =
        err instanceof AIError ? err.code : "UNKNOWN";
      setTestResult({
        success: false,
        message: code,
      });
    } finally {
      setIsTesting(false);
    }
  }, [config]);

  return {
    config,
    isLoaded,
    isSaving,
    isTesting,
    testResult,
    save,
    clear,
    testConnection,
    reload,
  };
}
