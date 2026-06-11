import { useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
  Alert01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  ThemedButton,
  ServingScaler,
  UnitSelect,
  useAppTheme,
  ConfirmDialog,
  Chip,
} from "../src/design-system";
import { api } from "../convex/_generated/api";
import type { AIParsedRecipeDraft } from "../src/ai/types";

const KNOWN_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
  "Dessert",
  "Vietnamese",
  "Home Cooking",
  "Main Dish",
  "Soup",
  "Stir-fry",
  "Fried",
  "Grilled",
  "Steamed",
  "Boiled",
  "Drink",
  "Sweet",
  "Healthy",
  "Quick",
  "Easy",
  "Meal Prep",
];

let nextId = 1;
function genId() {
  return `ai-${Date.now()}-${++nextId}`;
}

export default function AIReviewScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { draft: draftParam } = useLocalSearchParams<{ draft: string }>();

  const [parsedDraft] = useState<AIParsedRecipeDraft>(() => {
    try {
      return JSON.parse(draftParam) as AIParsedRecipeDraft;
    } catch {
      return {
        title: "",
        description: "",
        prepTime: "",
        cookTime: "",
        servings: 4,
        ingredients: [],
        steps: [],
        categories: [],
        notes: "",
        confidence: "low",
        warnings: ["Failed to parse draft."],
      };
    }
  });

  const [title, setTitle] = useState(parsedDraft.title);
  const [description, setDescription] = useState(parsedDraft.description);
  const [prepTime, setPrepTime] = useState(parsedDraft.prepTime);
  const [cookTime, setCookTime] = useState(parsedDraft.cookTime);
  const [servings, setServings] = useState(parsedDraft.servings || 4);
  const [ingredients, setIngredients] = useState(
    parsedDraft.ingredients.map((i) => ({
      id: genId(),
      name: i.name,
      amount: i.amount ?? 0,
      unit: i.unit,
      originalText: i.originalText,
      notes: i.notes,
      optional: false,
    }))
  );
  const [steps, setSteps] = useState(
    parsedDraft.steps.map((s) => ({
      id: genId(),
      stepNumber: s.stepNumber,
      text: s.text,
    }))
  );
  const [categories, setCategories] = useState<string[]>(
    parsedDraft.categories || []
  );
  const [notes, setNotes] = useState(parsedDraft.notes);
  const [saving, setSaving] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [newCategory, setNewCategory] = useState("");

  const createRecipe = useMutation(api.recipes.create);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        id: genId(),
        name: "",
        amount: 0,
        unit: "",
        originalText: "",
        notes: undefined,
        optional: false,
      },
    ]);
  };

  const removeIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  };

  const updateIngredient = (id: string, field: string, value: string | number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  };

  const addStep = () => {
    setSteps((prev) => [
      ...prev,
      { id: genId(), stepNumber: prev.length + 1, text: "" },
    ]);
  };

  const removeStep = (index: number) => {
    setSteps((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.map((s, i) => ({ ...s, stepNumber: i + 1 }));
    });
  };

  const updateStep = (index: number, value: string) => {
    setSteps((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], text: value };
      return next;
    });
  };

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addNewCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories((prev) => [...prev, trimmed]);
      setNewCategory("");
    }
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;

    setSaving(true);
    try {
      await createRecipe({
        title: title.trim(),
        description: description.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        servings,
        tags: categories,
        source: "ai",
        ingredients: ingredients
          .filter((i) => i.name.trim())
          .map((i) => ({
            name: i.name,
            amount: i.amount,
            unit: i.unit,
            originalUnit: i.originalText,
            category: undefined,
            optional: i.optional,
            notes: i.notes,
          })),
        instructions: steps
          .filter((s) => s.text.trim())
          .map((s) => ({
            stepNumber: s.stepNumber,
            text: s.text,
          })),
      });
      router.back();
    } catch (err) {
      console.error("Failed to save AI recipe:", err);
    } finally {
      setSaving(false);
    }
  }, [
    title,
    description,
    prepTime,
    cookTime,
    servings,
    categories,
    ingredients,
    steps,
    createRecipe,
    router,
  ]);

  const showLowConfidence = parsedDraft.confidence === "low";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView className="flex-1" contentContainerClassName="px-4 pt-4 pb-8 gap-5">
          {/* Header */}
          <View className="flex-row items-center gap-3">
            <Pressable
              onPress={() => setShowDiscardDialog(true)}
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
            <ThemedText variant="h3">{t("aiReview.title")}</ThemedText>
          </View>

          {/* Confidence banner */}
          {showLowConfidence ? (
            <View
              className="rounded-2xl border px-4 py-4 gap-2"
              style={{
                backgroundColor: colors.error + "10",
                borderColor: colors.error,
              }}
            >
              <View className="flex-row items-center gap-2">
                <HugeiconsIcon
                  icon={Alert01Icon}
                  size={20}
                  color={colors.error}
                  strokeWidth={2}
                />
                <ThemedText
                  variant="bodySmall"
                  style={{ fontFamily: "Baloo2-SemiBold", color: colors.error }}
                >
                  {t("aiReview.lowConfidenceTitle")}
                </ThemedText>
              </View>
              <ThemedText variant="caption" color="secondary">
                {t("aiReview.lowConfidenceDesc")}
              </ThemedText>
            </View>
          ) : parsedDraft.confidence === "medium" ? (
            <View
              className="flex-row items-center gap-2 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: (colors.warning ?? "#F59E0B") + "10",
                borderColor: colors.warning ?? "#F59E0B",
              }}
            >
              <HugeiconsIcon
                icon={Alert01Icon}
                size={18}
                color={colors.warning ?? "#F59E0B"}
                strokeWidth={2}
              />
              <ThemedText
                variant="bodySmall"
                style={{
                  fontFamily: "Baloo2-SemiBold",
                  color: colors.warning ?? "#F59E0B",
                }}
              >
                {t("aiReview.lowConfidenceDesc")}
              </ThemedText>
            </View>
          ) : (
            <View
              className="flex-row items-center gap-2 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: colors.success + "10",
                borderColor: colors.success,
              }}
            >
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={18}
                color={colors.success}
                strokeWidth={2}
              />
              <ThemedText
                variant="bodySmall"
                style={{
                  fontFamily: "Baloo2-SemiBold",
                  color: colors.success,
                }}
              >
                {t("aiReview.extractedFrom")}
              </ThemedText>
            </View>
          )}

          {/* Warnings */}
          {parsedDraft.warnings.length > 0 && (
            <View className="gap-2">
              <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                {t("aiReview.warningsTitle")}
              </ThemedText>
              <View className="gap-1">
                {parsedDraft.warnings.map((w, i) => (
                  <View key={i} className="flex-row items-start gap-2">
                    <ThemedText variant="caption" color="error">
                      {"• "}
                    </ThemedText>
                    <ThemedText variant="caption" color="secondary">
                      {w}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </View>
          )}

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
            <ServingScaler value={servings} min={1} max={24} onChange={setServings} />
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
                  className="rounded-xl border px-3 py-3 gap-2"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                >
                  <View className="flex-row items-center gap-2">
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
                  {ing.originalText || ing.notes ? (
                    <ThemedText variant="caption" color="muted">
                      {ing.originalText}
                      {ing.notes ? ` — ${ing.notes}` : ""}
                    </ThemedText>
                  ) : null}
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
              {steps.map((step, index) => (
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
                    {steps.length > 1 && (
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
                    placeholder={t("addRecipe.manual.stepPlaceholder", {
                      number: index + 1,
                    })}
                    placeholderTextColor={colors.textMuted}
                    value={step.text}
                    onChangeText={(text) => updateStep(index, text)}
                  />
                </View>
              ))}
            </View>
          </View>

          {/* Categories */}
          <View className="gap-2">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
              {t("recipes.tags.all")}
            </ThemedText>
            <View className="flex-row flex-wrap gap-2">
              {KNOWN_CATEGORIES.map((cat) => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={categories.includes(cat)}
                  onPress={() => toggleCategory(cat)}
                />
              ))}
            </View>
            <View className="flex-row items-center gap-2">
              <TextInput
                className="flex-1 min-h-10 rounded-xl border px-3 py-2"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                }}
                placeholder={t("aiReview.categoryPlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={newCategory}
                onChangeText={setNewCategory}
                onSubmitEditing={addNewCategory}
              />
              <Pressable
                onPress={addNewCategory}
                className="h-10 w-10 items-center justify-center rounded-xl"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.8 : 1,
                  backgroundColor: colors.primary,
                })}
              >
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={18}
                  color={colors.white}
                  strokeWidth={2}
                />
              </Pressable>
            </View>
          </View>

          {/* Notes */}
          <View className="gap-3">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
              {t("addRecipe.manual.description")}
            </ThemedText>
            <TextInput
              className="min-h-20 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline,
                color: colors.textPrimary,
                fontFamily: "Baloo2-Regular",
                fontSize: 14,
                textAlignVertical: "top",
              }}
              placeholder="Notes..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <View className="mt-2">
            <ThemedButton
              onPress={handleSave}
              disabled={!title.trim() || saving}
              loading={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                t("aiReview.saveRecipe")
              )}
            </ThemedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={showDiscardDialog}
        title={t("aiReview.discardConfirmTitle")}
        description={t("aiReview.discardConfirmDesc")}
        confirmLabel={t("aiReview.discard")}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        onConfirm={() => {
          setShowDiscardDialog(false);
          router.back();
        }}
        onCancel={() => setShowDiscardDialog(false)}
      />
    </SafeAreaView>
  );
}
