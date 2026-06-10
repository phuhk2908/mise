import { useState, useCallback, useEffect } from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput as RNTextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  SparklesIcon,
  ViewIcon,
  ViewOffIcon,
  Delete02Icon,
  CheckmarkCircle01Icon,
  Alert01Icon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  ThemedButton,
  Input,
  SelectField,
  useAppTheme,
} from "../src/design-system";
import { useAISettings } from "../src/hooks/useAISettings";
import {
  fetchPublicModels,
  OLLAMA_DEFAULT_BASE_URL,
} from "../src/ai/ollama";

const PROVIDER_OPTIONS: Array<{ value: "ollama"; label: string }> = [
  { value: "ollama", label: "Ollama" },
];

const OLLAMA_CLOUD_URL = "https://ollama.com/";

export default function AISettingsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const {
    config,
    isLoaded,
    isSaving,
    isTesting,
    testResult,
    save,
    clear,
    testConnection,
  } = useAISettings();

  const [provider, setProvider] = useState<"ollama">("ollama");
  const [model, setModel] = useState("");
  const [urlMode, setUrlMode] = useState<"local" | "cloud">("local");
  const [baseUrl, setBaseUrl] = useState(OLLAMA_DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  const urlModeOptions = [
    { value: "local", label: t("aiSettings.local") },
    { value: "cloud", label: t("aiSettings.cloud") },
  ];

  // Sync local state when config loads
  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setModel(config.model);
      if (config.baseUrl === OLLAMA_CLOUD_URL) {
        setUrlMode("cloud");
      } else {
        setUrlMode("local");
      }
      setBaseUrl(config.baseUrl || OLLAMA_DEFAULT_BASE_URL);
      setApiKey(config.apiKey);
      setHasSavedKey(true);
    } else {
      setUrlMode("local");
      setBaseUrl(OLLAMA_DEFAULT_BASE_URL);
      setHasSavedKey(false);
    }
  }, [config]);

  // Fetch public model list from ollama.com on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetchingModels(true);
      try {
        const models = await fetchPublicModels();
        if (!cancelled) setAvailableModels(models);
      } catch {
        // silently fail — manual input remains available
      } finally {
        if (!cancelled) setFetchingModels(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(async () => {
    await save({
      provider,
      model: model.trim(),
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
    });
    setHasSavedKey(true);
  }, [provider, model, baseUrl, apiKey, save]);

  const handleUrlModeChange = useCallback((mode: "local" | "cloud") => {
    setUrlMode(mode);
    setBaseUrl(mode === "local" ? OLLAMA_DEFAULT_BASE_URL : OLLAMA_CLOUD_URL);
  }, []);

  const handleClear = useCallback(async () => {
    await clear();
    setModel("");
    setUrlMode("local");
    setBaseUrl(OLLAMA_DEFAULT_BASE_URL);
    setApiKey("");
    setHasSavedKey(false);
    setShowKey(false);
  }, [clear]);

  const isFormValid = model.trim() && baseUrl.trim() && apiKey.trim();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-20 gap-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
        {/* Header */}
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={24}
              color={colors.textPrimary}
              strokeWidth={1.75}
            />
          </Pressable>
          <ThemedText variant="h3">{t("aiSettings.title")}</ThemedText>
        </View>

        {/* Intro */}
        <View
          className="rounded-2xl border px-4 py-4 gap-2"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
        >
          <View className="flex-row items-center gap-2">
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.primary + "15" }}
            >
              <HugeiconsIcon
                icon={SparklesIcon}
                size={20}
                color={colors.primary}
                strokeWidth={1.75}
              />
            </View>
            <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold", flex: 1 }}>
              {t("aiSettings.connectTitle")}
            </ThemedText>
          </View>
          <ThemedText variant="caption" color="secondary">
            {t("aiSettings.connectDesc")}
          </ThemedText>
        </View>

        {/* Form */}
        <View className="gap-4">
          {/* Provider */}
          <SelectField
            label={t("aiSettings.provider")}
            value={provider}
            options={PROVIDER_OPTIONS}
            onChange={(value) => setProvider(value as "ollama")}
          />

          {/* Server Type */}
          <SelectField
            label={t("aiSettings.serverType")}
            value={urlMode}
            options={urlModeOptions}
            onChange={(value) => handleUrlModeChange(value as "local" | "cloud")}
          />

          {/* Model */}
          {fetchingModels ? (
            <View className="flex-row items-center gap-2 py-1">
              <ActivityIndicator size="small" color={colors.primary} />
              <ThemedText variant="caption" color="muted">
                {t("aiSettings.fetchingModels")}
              </ThemedText>
            </View>
          ) : availableModels.length > 0 ? (
            <SelectField
              label={t("aiSettings.model")}
              value={model}
              options={(() => {
                const opts = availableModels.map((m) => ({ value: m, label: m }));
                if (model && !availableModels.some((m) => m === model)) {
                  opts.unshift({ value: model, label: model });
                }
                return opts;
              })()}
              onChange={setModel}
              placeholder={t("aiSettings.modelPlaceholder")}
            />
          ) : (
            <Input
              label={t("aiSettings.model")}
              placeholder={t("aiSettings.modelPlaceholder")}
              value={model}
              onChangeText={setModel}
              autoCapitalize="none"
            />
          )}

          {/* Base URL */}
          <Input
            label={t("aiSettings.baseUrl")}
            placeholder={t("aiSettings.baseUrlPlaceholder")}
            value={baseUrl}
            onChangeText={setBaseUrl}
            autoCapitalize="none"
            keyboardType="url"
          />

          {/* API Key */}
          <View className="gap-2">
            <ThemedText variant="caption" color="secondary">
              {t("aiSettings.apiKey")}
            </ThemedText>
            <View
              className="min-h-11 flex-row items-center rounded-xl border px-3"
              style={{ borderColor: colors.outline, backgroundColor: colors.surface }}
            >
              <RNTextInput
                className="flex-1"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                  lineHeight: 20,
                  height: 44,
                  padding: 0,
                  margin: 0,
                }}
                placeholder={t("aiSettings.apiKeyPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry={!showKey}
                autoCapitalize="none"
              />
              <Pressable onPress={() => setShowKey((s) => !s)} hitSlop={8}>
                <HugeiconsIcon
                  icon={showKey ? ViewOffIcon : ViewIcon}
                  size={18}
                  color={colors.textMuted}
                  strokeWidth={1.75}
                />
              </Pressable>
            </View>
            <ThemedText variant="caption" color="muted">
              {t("aiSettings.apiKeyHint")}
            </ThemedText>
          </View>
        </View>

        {/* Test Result */}
        {testResult && (
          <View
            className="flex-row items-center gap-2 rounded-xl border px-4 py-3"
            style={{
              backgroundColor: testResult.success
                ? colors.success + "10"
                : colors.error + "10",
              borderColor: testResult.success
                ? colors.success
                : colors.error,
            }}
          >
            <HugeiconsIcon
              icon={testResult.success ? CheckmarkCircle01Icon : Alert01Icon}
              size={18}
              color={testResult.success ? colors.success : colors.error}
              strokeWidth={2}
            />
            <ThemedText
              variant="bodySmall"
              style={{
                color: testResult.success ? colors.success : colors.error,
                fontFamily: "Baloo2-SemiBold",
              }}
            >
              {testResult.message === "TEST_SUCCESS"
                ? t("aiSettings.testSuccess")
                : testResult.message === "AI_NOT_CONFIGURED"
                ? t("aiSettings.testNotConfigured")
                : testResult.message === "INVALID_KEY"
                ? t("aiErrors.invalidKey")
                : testResult.message === "INVALID_MODEL"
                ? t("aiErrors.invalidModel")
                : testResult.message === "NETWORK_ERROR"
                ? t("aiErrors.networkError")
                : testResult.message === "TIMEOUT"
                ? t("aiErrors.timeout")
                : t("aiErrors.unknown")}
            </ThemedText>
          </View>
        )}

        {/* Actions */}
        <View className="gap-3">
          <ThemedButton
            variant="secondary"
            onPress={() =>
              testConnection({
                provider,
                model: model.trim(),
                baseUrl: baseUrl.trim(),
                apiKey: apiKey.trim(),
              })
            }
            disabled={isTesting || !isFormValid}
            loading={isTesting}
          >
            {t("aiSettings.testConnection")}
          </ThemedButton>

          <ThemedButton
            onPress={handleSave}
            disabled={!isFormValid || isSaving}
            loading={isSaving}
          >
            {t("aiSettings.save")}
          </ThemedButton>

          {hasSavedKey && (
            <ThemedButton
              variant="destructive"
              onPress={handleClear}
              disabled={isSaving}
            >
              <View className="flex-row items-center gap-2">
                <HugeiconsIcon
                  icon={Delete02Icon}
                  size={16}
                  color={colors.error}
                  strokeWidth={2}
                />
                <ThemedText
                  variant="bodySmall"
                  style={{ color: colors.error, fontFamily: "Baloo2-SemiBold" }}
                >
                  {t("aiSettings.clear")}
                </ThemedText>
              </View>
            </ThemedButton>
          )}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
