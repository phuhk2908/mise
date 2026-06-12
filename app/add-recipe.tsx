import { useTranslation } from "react-i18next";
import { useState, useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
  Camera01Icon,
  ImageAdd01Icon,
  Mic01Icon,
  Cancel01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  ThemedButton,
  ServingScaler,
  UnitSelect,
  useAppTheme,
  Feedback,
} from "../src/design-system";
import { api } from "../convex/_generated/api";
import type { Ingredient, Instruction } from "../src/types";
import { useAISettings } from "../src/hooks/useAISettings";
import { extractRecipeFromText, extractRecipeFromAudio, extractRecipeFromImage } from "../src/ai/extract";
import { AIError } from "../src/ai/types";
import { useVoiceRecording } from "../src/hooks/useVoiceRecording";

type TabKey = "manual" | "photo" | "voice";

const TABS: { key: TabKey; labelKey: string }[] = [
  { key: "manual", labelKey: "addRecipe.tabs.manual" },
  { key: "photo", labelKey: "addRecipe.tabs.photo" },
  { key: "voice", labelKey: "addRecipe.tabs.voice" },
];

let nextId = 100;

function getLocalizedAIError(err: unknown, t: (key: string) => string): string {
  if (err instanceof AIError) {
    const map: Record<string, string> = {
      NOT_CONFIGURED: "aiErrors.notConfigured",
      INVALID_KEY: "aiErrors.invalidKey",
      INVALID_MODEL: "aiErrors.invalidModel",
      INVALID_RESPONSE: "aiErrors.invalidResponse",
      NETWORK_ERROR: "aiErrors.networkError",
      TIMEOUT: "aiErrors.timeout",
      AUDIO_NOT_SUPPORTED: "aiErrors.audioNotSupported",
      VISION_NOT_SUPPORTED: "aiErrors.visionNotSupported",
      READ_ERROR: "aiErrors.readError",
      UNKNOWN: "aiErrors.unknown",
    };
    return t(map[err.code] ?? "aiErrors.unknown");
  }
  if (err instanceof Error) return err.message;
  return t("aiErrors.unknown");
}

export default function AddRecipeScreen() {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const initialTab = (params.tab as TabKey) ?? "manual";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  // Tab indicator animation
  const tabLayouts = useRef<Record<TabKey, { x: number; width: number }>>({} as any);
  const indicatorX = useSharedValue(0);
  const indicatorW = useSharedValue(0);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorW.value,
  }));

  const animateToTab = (tab: TabKey) => {
    const layout = tabLayouts.current[tab];
    if (!layout) return;
    indicatorX.value = withTiming(layout.x, { duration: 200, easing: Easing.inOut(Easing.ease) });
    indicatorW.value = withTiming(layout.width, { duration: 200, easing: Easing.inOut(Easing.ease) });
  };

  useEffect(() => {
    animateToTab(activeTab);
  }, [activeTab]);

  // Convex mutation
  const createRecipe = useMutation(api.recipes.create);

  // Manual form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { id: `new-${++nextId}`, recipeId: "", name: "", amount: 1, unit: "", optional: false },
  ]);
  const [instructions, setInstructions] = useState<Instruction[]>([
    { id: `new-${++nextId}`, recipeId: "", stepNumber: 1, text: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // ── AI state ──
  const { config: aiConfig, isLoaded: aiLoaded } = useAISettings();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [voiceText, setVoiceText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Voice recording state ──
  const {
    state: voiceState,
    uri: voiceUri,
    duration: voiceDuration,
    error: voiceError,
    isSupported: voiceSupported,
    startRecording,
    stopRecording,
    reset: resetVoice,
  } = useVoiceRecording();

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: `new-${++nextId}`, recipeId: "", name: "", amount: 1, unit: "", optional: false },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const updateIngredient = (id: string, field: keyof Ingredient, value: string | number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addStep = () => {
    setInstructions((prev) => [
      ...prev,
      { id: `new-${++nextId}`, recipeId: "", stepNumber: prev.length + 1, text: "" },
    ]);
  };

  const updateStep = (index: number, value: string) => {
    setInstructions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: value };
      return next;
    });
  };

  const removeStep = (index: number) => {
    setInstructions((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  };

  const handleAIExtract = async (sourceText: string) => {
    if (!sourceText.trim()) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const draft = await extractRecipeFromText(sourceText);
      router.push({
        pathname: "/ai-review",
        params: { draft: JSON.stringify(draft) },
      } as any);
    } catch (err) {
      setAiError(getLocalizedAIError(err, t));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExtractAudio = async (audioUri: string) => {
    if (!audioUri) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const draft = await extractRecipeFromAudio(audioUri);
      router.push({
        pathname: "/ai-review",
        params: { draft: JSON.stringify(draft) },
      } as any);
    } catch (err) {
      setAiError(getLocalizedAIError(err, t));
    } finally {
      setAiLoading(false);
    }
  };

  const handleAIExtractImage = async (imageUri: string) => {
    if (!imageUri) return;

    setAiLoading(true);
    setAiError(null);
    try {
      const draft = await extractRecipeFromImage(imageUri);
      router.push({
        pathname: "/ai-review",
        params: { draft: JSON.stringify(draft) },
      } as any);
    } catch (err) {
      setAiError(getLocalizedAIError(err, t));
    } finally {
      setAiLoading(false);
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setAiError(t("addRecipe.photo.cameraPermissionRequired"));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleGalleryPick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAiError(t("addRecipe.photo.galleryPermissionRequired"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;

    setSaving(true);
    setSaveError(null);
    try {
      await createRecipe({
        title: title.trim(),
        description: description.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        servings,
        tags: [],
        source: "manual",
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
            originalUnit: i.originalUnit,
            category: i.category,
            optional: i.optional,
            notes: i.notes,
          })),
        instructions: instructions
          .filter((s) => s.text.trim())
          .map((s) => ({
            stepNumber: s.stepNumber,
            text: s.text,
            duration: s.duration,
            imageUri: s.imageUri,
          })),
      });

      router.back();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t("common.saveError"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="px-4 pt-4 gap-4">
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
          <ThemedText variant="h3">{t("addRecipe.title")}</ThemedText>
        </View>

        {/* Tab Selector */}
        <View
          className="flex-row rounded-full border p-1"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
        >
          <Animated.View
            className="absolute top-1 bottom-1 rounded-full"
            style={[
              animatedIndicatorStyle,
              { backgroundColor: colors.primary },
            ]}
          />
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                onLayout={(e) => {
                  const layout = e.nativeEvent.layout;
                  tabLayouts.current[tab.key] = { x: layout.x, width: layout.width };
                  if (activeTab === tab.key) {
                    animateToTab(tab.key);
                  }
                }}
                className="flex-1 items-center justify-center py-2.5 rounded-full z-10"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <ThemedText
                  variant="bodySmall"
                  style={{
                    fontFamily: isActive ? "Baloo2-SemiBold" : "Baloo2-Regular",
                    color: isActive ? colors.white : colors.textSecondary,
                  }}
                >
                  {t(tab.labelKey)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-4 pb-8 gap-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Save error feedback */}
          {saveError ? (
            <Feedback message={saveError} variant="error" />
          ) : null}

          {activeTab === "manual" && (
            <>
              {/* Basic Info */}
              <View className="gap-3">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {t("addRecipe.manual.recipeTitle")}
                </ThemedText>
                <TextInput
                  className="min-h-11 rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.textPrimary,
                    fontFamily: "Baloo2-Regular",
                    fontSize: 14,
                  }}
                  placeholder={t("addRecipe.manual.recipeTitlePlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View className="gap-3">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {t("addRecipe.manual.description")}
                </ThemedText>
                <TextInput
                  className="min-h-11 rounded-xl border px-4 py-3"
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.outline,
                    color: colors.textPrimary,
                    fontFamily: "Baloo2-Regular",
                    fontSize: 14,
                  }}
                  placeholder={t("addRecipe.manual.descriptionPlaceholder")}
                  placeholderTextColor={colors.textMuted}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1 gap-3">
                  <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                    {t("addRecipe.manual.prepTime")}
                  </ThemedText>
                  <TextInput
                    className="min-h-11 rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.textPrimary,
                      fontFamily: "Baloo2-Regular",
                      fontSize: 14,
                    }}
                    placeholder={t("addRecipe.manual.prepTimePlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    value={prepTime}
                    onChangeText={setPrepTime}
                  />
                </View>
                <View className="flex-1 gap-3">
                  <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                    {t("addRecipe.manual.cookTime")}
                  </ThemedText>
                  <TextInput
                    className="min-h-11 rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      color: colors.textPrimary,
                      fontFamily: "Baloo2-Regular",
                      fontSize: 14,
                    }}
                    placeholder={t("addRecipe.manual.cookTimePlaceholder")}
                    placeholderTextColor={colors.textMuted}
                    value={cookTime}
                    onChangeText={setCookTime}
                  />
                </View>
              </View>

              <View className="gap-3">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {t("addRecipe.manual.servings")}
                </ThemedText>
                <ServingScaler
                  value={servings}
                  min={1}
                  max={24}
                  onChange={setServings}
                />
              </View>

              {/* Ingredients */}
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                    {t("addRecipe.manual.ingredients")}
                  </ThemedText>
                  <Pressable
                    onPress={addIngredient}
                    className="flex-row items-center gap-1 rounded-full border px-3 py-1.5"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    })}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} color={colors.primary} strokeWidth={2} />
                    <ThemedText
                      variant="caption"
                      style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                    >
                      {t("addRecipe.manual.add")}
                    </ThemedText>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {ingredients.map((ing) => (
                    <View
                      key={ing.id}
                      className="flex-row items-center gap-2 rounded-xl border px-3 py-3"
                      style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                    >
                      <TextInput
                        className="flex-1 rounded-lg border px-2 py-1"
                        style={{
                          borderColor: colors.outline,
                          color: colors.textPrimary,
                          fontFamily: "Baloo2-Regular",
                          fontSize: 14,
                          backgroundColor: colors.background,
                        }}
                        placeholder={t("addRecipe.manual.ingredientPlaceholder")}
                        placeholderTextColor={colors.textMuted}
                        value={ing.name}
                        onChangeText={(text) => updateIngredient(ing.id, "name", text)}
                      />
                      <TextInput
                        className="w-16 rounded-lg border px-2 py-1 text-center"
                        style={{
                          borderColor: colors.outline,
                          color: colors.textPrimary,
                          fontFamily: "Baloo2-Regular",
                          fontSize: 14,
                          backgroundColor: colors.background,
                        }}
                        keyboardType="decimal-pad"
                        value={String(ing.amount)}
                        onChangeText={(text) =>
                          updateIngredient(ing.id, "amount", parseFloat(text) || 0)
                        }
                      />
                      <UnitSelect
                        value={ing.unit}
                        onChange={(unit) => updateIngredient(ing.id, "unit", unit)}
                        style={{ width: 88 }}
                      />
                      <Pressable
                        onPress={() => removeIngredient(ing.id)}
                        className="h-8 w-8 items-center justify-center"
                        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                      >
                        <HugeiconsIcon
                          icon={Delete02Icon}
                          size={16}
                          color={colors.error}
                          strokeWidth={1.75}
                        />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              {/* Steps */}
              <View className="gap-2">
                <View className="flex-row items-center justify-between">
                  <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                    {t("addRecipe.manual.steps")}
                  </ThemedText>
                  <Pressable
                    onPress={addStep}
                    className="flex-row items-center gap-1 rounded-full border px-3 py-1.5"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    })}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={14} color={colors.primary} strokeWidth={2} />
                    <ThemedText
                      variant="caption"
                      style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                    >
                      {t("addRecipe.manual.addStep")}
                    </ThemedText>
                  </Pressable>
                </View>

                <View className="gap-2">
                  {instructions.map((step, index) => (
                    <View key={step.id} className="flex-row gap-2">
                      <View className="gap-1 items-center">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: colors.primary, marginTop: 6 }}
                        >
                          <ThemedText
                            variant="caption"
                            style={{
                              color: colors.white,
                              fontFamily: "Baloo2-SemiBold",
                              fontSize: 12,
                            }}
                          >
                            {step.stepNumber}
                          </ThemedText>
                        </View>
                        {instructions.length > 1 && (
                          <Pressable
                            onPress={() => removeStep(index)}
                            className="h-6 w-6 items-center justify-center"
                            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                          >
                            <HugeiconsIcon
                              icon={Delete02Icon}
                              size={14}
                              color={colors.error}
                              strokeWidth={1.75}
                            />
                          </Pressable>
                        )}
                      </View>
                      <TextInput
                        className="flex-1 min-h-11 rounded-xl border px-3 py-2"
                        style={{
                          backgroundColor: colors.surface,
                          borderColor: colors.outline,
                          color: colors.textPrimary,
                          fontFamily: "Baloo2-Regular",
                          fontSize: 14,
                          textAlignVertical: "top",
                        }}
                        multiline
                        placeholder={t("addRecipe.manual.stepPlaceholder", { number: index + 1 })}
                        placeholderTextColor={colors.textMuted}
                        value={step.text}
                        onChangeText={(text) => updateStep(index, text)}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View className="mt-2">
                <ThemedButton onPress={handleSave} disabled={!title.trim() || saving}>
                  {saving ? t("addRecipe.manual.saving") : t("addRecipe.manual.save")}
                </ThemedButton>
              </View>
            </>
          )}

          {activeTab === "photo" && (
            <>
              {!photoUri ? (
                <View
                  className="items-center justify-center rounded-2xl border-2 border-dashed py-12 gap-4"
                  style={{
                    borderColor: colors.outlineStrong,
                    backgroundColor: colors.surface,
                  }}
                >
                  <View
                    className="h-20 w-20 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: colors.neutral100 ?? colors.outline }}
                  >
                    <HugeiconsIcon
                      icon={Camera01Icon}
                      size={32}
                      color={colors.primary}
                      strokeWidth={1.75}
                    />
                  </View>

                  <View className="items-center gap-1 px-8">
                    <ThemedText variant="h4">{t("addRecipe.photo.heading")}</ThemedText>
                    <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
                      {t("addRecipe.photo.subheading")}
                    </ThemedText>
                  </View>
                </View>
              ) : (
                <View className="rounded-2xl border overflow-hidden" style={{ borderColor: colors.outline }}>
                  <Image
                    source={{ uri: photoUri }}
                    style={{ width: "100%", height: 200, resizeMode: "cover" }}
                  />
                  <Pressable
                    onPress={() => setPhotoUri(null)}
                    className="absolute top-2 right-2 rounded-full px-2 py-1"
                    style={{ backgroundColor: colors.error + "CC" }}
                  >
                    <ThemedText variant="caption" style={{ color: colors.white, fontFamily: "Baloo2-SemiBold" }}>
                      {t("addRecipe.photo.removeImage")}
                    </ThemedText>
                  </Pressable>
                </View>
              )}

              {/* AI / permission errors */}
              {aiError ? (
                <ThemedText variant="caption" color="error">
                  {aiError}
                </ThemedText>
              ) : null}

              <View className="gap-3">
                <ThemedButton onPress={handleCamera}>
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon
                      icon={Camera01Icon}
                      size={18}
                      color={isDark ? colors.neutral900! : colors.white}
                      strokeWidth={1.75}
                    />
                    <ThemedText variant="bodySmall" style={{
                      color: isDark ? colors.neutral900! : colors.white,
                      fontFamily: "Baloo2-SemiBold",
                    }}>
                      {t("addRecipe.photo.takePhoto")}
                    </ThemedText>
                  </View>
                </ThemedButton>

                <ThemedButton variant="secondary" onPress={handleGalleryPick}>
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon
                      icon={ImageAdd01Icon}
                      size={18}
                      color={colors.primary}
                      strokeWidth={1.75}
                    />
                    <ThemedText variant="bodySmall" style={{
                      color: colors.primary,
                      fontFamily: "Baloo2-SemiBold",
                    }}>
                      {t("addRecipe.photo.chooseGallery")}
                    </ThemedText>
                  </View>
                </ThemedButton>
              </View>

              {/* Extract from image button */}
              {photoUri && (
                <View className="gap-2">
                  {!aiConfig && aiLoaded ? (
                    <View className="rounded-2xl border px-4 py-4 gap-3" style={{ backgroundColor: colors.surface, borderColor: colors.outline }}>
                      <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                        {t("addRecipe.ai.notConfiguredTitle")}
                      </ThemedText>
                      <ThemedText variant="caption" color="secondary">
                        {t("addRecipe.ai.notConfiguredDesc")}
                      </ThemedText>
                      <ThemedButton variant="secondary" onPress={() => router.push("/ai-settings" as any)}>
                        {t("addRecipe.ai.openSettings")}
                      </ThemedButton>
                    </View>
                  ) : (
                    <ThemedButton
                      onPress={() => handleAIExtractImage(photoUri)}
                      disabled={aiLoading}
                      loading={aiLoading}
                    >
                      <View className="flex-row items-center gap-2">
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          size={18}
                          color={isDark ? colors.neutral900! : colors.white}
                          strokeWidth={1.75}
                        />
                        <ThemedText
                          variant="bodySmall"
                          style={{
                            color: isDark ? colors.neutral900! : colors.white,
                            fontFamily: "Baloo2-SemiBold",
                          }}
                        >
                          {aiLoading ? t("addRecipe.ai.extracting") : t("addRecipe.photo.extractFromImage")}
                        </ThemedText>
                      </View>
                    </ThemedButton>
                  )}
                </View>
              )}

              <View
                className="rounded-2xl border px-4 py-4 gap-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
              >
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: colors.neutral100 ?? colors.outline }}
                  >
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      size={20}
                      color={colors.primary}
                      strokeWidth={1.75}
                    />
                  </View>
                  <View className="flex-1">
                    <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                      {t("addRecipe.photo.tipsTitle")}
                    </ThemedText>
                    <ThemedText variant="caption" color="secondary">
                      {t("addRecipe.photo.tipsDesc")}
                    </ThemedText>
                  </View>
                </View>
              </View>

            </>
          )}

          {activeTab === "voice" && (
            <>
              {/* Mic / Recording UI */}
              <View className="items-center gap-4 py-6">
                {/* Mic button */}
                <Pressable
                  onPress={async () => {
                    if (voiceState === "recording") {
                      await stopRecording();
                    } else if (voiceState === "done") {
                      resetVoice();
                    } else {
                      startRecording();
                    }
                  }}
                  disabled={!voiceSupported || voiceState === "processing" || voiceState === "requesting"}
                  className="h-24 w-24 items-center justify-center rounded-full"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    backgroundColor:
                      voiceState === "recording" || voiceState === "processing"
                        ? colors.error
                        : colors.primary,
                    shadowColor:
                      voiceState === "recording" || voiceState === "processing"
                        ? colors.error
                        : colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                  })}
                >
                  <HugeiconsIcon
                    icon={
                      voiceState === "recording" || voiceState === "processing"
                        ? Cancel01Icon
                        : Mic01Icon
                    }
                    size={36}
                    color={colors.white}
                    strokeWidth={1.75}
                  />
                </Pressable>

                {/* Timer */}
                {(voiceState === "recording" || voiceState === "processing") && (
                  <ThemedText
                    variant="body"
                    style={{
                      fontFamily: "Baloo2-SemiBold",
                      color: colors.error,
                    }}
                  >
                    {t("addRecipe.voice.listening")} {" "}
                    {`${Math.floor(voiceDuration / 60)
                      .toString()
                      .padStart(2, "0")}:${(voiceDuration % 60)
                      .toString()
                      .padStart(2, "0")}`}
                  </ThemedText>
                )}

                {/* Status text */}
                <View className="items-center gap-1">
                  <ThemedText variant="h4">
                    {voiceState === "recording"
                      ? t("addRecipe.voice.recording")
                      : voiceState === "processing"
                      ? t("addRecipe.voice.processing")
                      : voiceState === "done"
                      ? t("addRecipe.voice.done")
                      : voiceState === "error"
                      ? t("addRecipe.voice.error")
                      : t("addRecipe.voice.heading")}
                  </ThemedText>
                  <ThemedText
                    variant="bodySmall"
                    color="secondary"
                    style={{ textAlign: "center" }}
                  >
                    {voiceState === "idle" || voiceState === "error"
                      ? t("addRecipe.voice.subheading")
                      : voiceState === "recording"
                      ? t("addRecipe.voice.keepSpeaking")
                      : voiceState === "done"
                      ? t("addRecipe.voice.recordingSaved")
                      : null}
                  </ThemedText>
                </View>

                {/* Sample quote (only when idle) */}
                {voiceState === "idle" && (
                  <View
                    className="rounded-2xl border px-5 py-4"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    }}
                  >
                    <ThemedText
                      variant="bodySmall"
                      color="secondary"
                      style={{ textAlign: "center", fontStyle: "italic" }}
                    >
                      {`“${t("addRecipe.voice.sampleQuote")}”`}
                    </ThemedText>
                  </View>
                )}
              </View>

              {/* Audio info */}
              {voiceState === "done" && voiceUri && (
                <View className="gap-2">
                  <View
                    className="rounded-xl border px-4 py-3"
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                    }}
                  >
                    <ThemedText variant="bodySmall" color="secondary">
                      {t("addRecipe.voice.recordingSaved")} · {`${Math.floor(voiceDuration / 60)
                        .toString()
                        .padStart(2, "0")}:${(voiceDuration % 60)
                        .toString()
                        .padStart(2, "0")}`}
                    </ThemedText>
                  </View>
                </View>
              )}

              {/* Voice error */}
              {voiceError ? (
                <ThemedText variant="caption" color="error">
                  {voiceError}
                </ThemedText>
              ) : null}
              {aiError ? (
                <ThemedText variant="caption" color="error">
                  {aiError}
                </ThemedText>
              ) : null}

              {/* Parse button (when audio is ready) */}
              {voiceState === "done" && voiceUri && (
                <ThemedButton
                  onPress={() => handleAIExtractAudio(voiceUri)}
                  disabled={aiLoading}
                  loading={aiLoading}
                >
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon
                      icon={SparklesIcon}
                      size={18}
                      color={isDark ? colors.neutral900! : colors.white}
                      strokeWidth={1.75}
                    />
                    <ThemedText
                      variant="bodySmall"
                      style={{
                        color: isDark ? colors.neutral900! : colors.white,
                        fontFamily: "Baloo2-SemiBold",
                      }}
                    >
                      {aiLoading ? t("addRecipe.ai.extracting") : t("addRecipe.ai.sendToAI")}
                    </ThemedText>
                  </View>
                </ThemedButton>
              )}

              {/* ── Text fallback ── */}
              <View className="gap-3">
                <View className="flex-row items-center gap-2">
                  <View className="h-px flex-1" style={{ backgroundColor: colors.outline }} />
                  <ThemedText variant="caption" color="muted">
                    {t("addRecipe.photo.or")}
                  </ThemedText>
                  <View className="h-px flex-1" style={{ backgroundColor: colors.outline }} />
                </View>

                {!aiConfig && aiLoaded ? (
                  <View
                    className="rounded-2xl border px-4 py-4 gap-3"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                      {t("addRecipe.ai.notConfiguredTitle")}
                    </ThemedText>
                    <ThemedText variant="caption" color="secondary">
                      {t("addRecipe.ai.notConfiguredDesc")}
                    </ThemedText>
                    <ThemedButton
                      variant="secondary"
                      onPress={() => router.push("/ai-settings" as any)}
                    >
                      {t("addRecipe.ai.openSettings")}
                    </ThemedButton>
                  </View>
                ) : (
                  <>
                    <TextInput
                      className="min-h-32 rounded-xl border px-4 py-3"
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.outline,
                        color: colors.textPrimary,
                        fontFamily: "Baloo2-Regular",
                        fontSize: 14,
                        textAlignVertical: "top",
                      }}
                      placeholder={t("addRecipe.ai.pasteTranscript")}
                      placeholderTextColor={colors.textMuted}
                      value={voiceText}
                      onChangeText={(text) => {
                        setVoiceText(text);
                        if (voiceState !== "idle") resetVoice();
                      }}
                      multiline
                    />

                    <ThemedButton
                      onPress={() => handleAIExtract(voiceText)}
                      disabled={!voiceText.trim() || aiLoading}
                      loading={aiLoading}
                    >
                      <View className="flex-row items-center gap-2">
                        <HugeiconsIcon
                          icon={SparklesIcon}
                          size={18}
                          color={isDark ? colors.neutral900! : colors.white}
                          strokeWidth={1.75}
                        />
                        <ThemedText
                          variant="bodySmall"
                          style={{
                            color: isDark ? colors.neutral900! : colors.white,
                            fontFamily: "Baloo2-SemiBold",
                          }}
                        >
                          {aiLoading ? t("addRecipe.ai.extracting") : t("addRecipe.ai.parseTranscript")}
                        </ThemedText>
                      </View>
                    </ThemedButton>
                  </>
                )}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
