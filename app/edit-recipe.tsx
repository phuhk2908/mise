import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  ThemedButton,
  ServingScaler,
  UnitSelect,
  useAppTheme,
  Feedback,
  EmptyState,
} from "../src/design-system";
import { api } from "../convex/_generated/api";
import type { Ingredient, Instruction } from "../src/types";

let nextId = 1000;

function generateId(): string {
  return `${Date.now()}-${++nextId}`;
}

export default function EditRecipeScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();

  // Fetch recipe with Convex
  const recipe = useQuery(api.recipes.getById, id ? { id: id as any } : "skip");
  const updateRecipe = useMutation(api.recipes.update);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title);
      setDescription(recipe.description);
      setPrepTime(recipe.prepTime);
      setCookTime(recipe.cookTime);
      setServings(recipe.servings);
      setIngredients(recipe.ingredients);
      setInstructions(recipe.instructions);
      setLoading(false);
    } else if (recipe === null) {
      setError(t("editRecipe.notFoundTitle"));
      setLoading(false);
    }
  }, [recipe]);

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      { id: generateId(), recipeId: id ?? "", name: "", amount: 1, unit: "", optional: false },
    ]);
  };

  const removeIngredient = (ingredientId: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== ingredientId));
  };

  const updateIngredient = (ingredientId: string, field: keyof Ingredient, value: string | number) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === ingredientId ? { ...i, [field]: value } : i))
    );
  };

  const addStep = () => {
    setInstructions((prev) => [
      ...prev,
      { id: generateId(), recipeId: id ?? "", stepNumber: prev.length + 1, text: "" },
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

  const handleSave = async () => {
    if (!id || !title.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateRecipe({
        id: id as any,
        title: title.trim(),
        description: description.trim(),
        prepTime: prepTime.trim(),
        cookTime: cookTime.trim(),
        servings,
        ingredients: ingredients.filter((i) => i.name.trim()).map((i) => ({
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
      setSaveError(err instanceof Error ? err.message : "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        className="items-center justify-center gap-3"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <ThemedText variant="body" color="muted">{t("editRecipe.loading")}</ThemedText>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        className="items-center justify-center px-6"
      >
        <EmptyState
          title={error ? t("editRecipe.loadErrorTitle") : t("editRecipe.notFoundTitle")}
          description={error ?? t("editRecipe.notFoundDesc")}
          actionLabel={t("common.back")}
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pt-6 pb-8 gap-5"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
            <ThemedText variant="h3">{t("editRecipe.title")}</ThemedText>
          </View>

          {saveError ? <Feedback message={saveError} variant="error" /> : null}

          {/* Basic Info */}
          <View className="gap-3">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.recipeTitle")}</ThemedText>
            <TextInput
              className="min-h-11 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline,
                color: colors.textPrimary,
                fontFamily: "Baloo2-Regular",
                fontSize: 14,
              }}
              placeholder={t("editRecipe.recipeTitlePlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View className="gap-3">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.description")}</ThemedText>
            <TextInput
              className="min-h-11 rounded-xl border px-4 py-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline,
                color: colors.textPrimary,
                fontFamily: "Baloo2-Regular",
                fontSize: 14,
              }}
              placeholder={t("editRecipe.descriptionPlaceholder")}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1 gap-3">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.prepTime")}</ThemedText>
              <TextInput
                className="min-h-11 rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                }}
                placeholder={t("editRecipe.prepTimePlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={prepTime}
                onChangeText={setPrepTime}
              />
            </View>
            <View className="flex-1 gap-3">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.cookTime")}</ThemedText>
              <TextInput
                className="min-h-11 rounded-xl border px-4 py-3"
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.outline,
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                }}
                placeholder={t("editRecipe.cookTimePlaceholder")}
                placeholderTextColor={colors.textMuted}
                value={cookTime}
                onChangeText={setCookTime}
              />
            </View>
          </View>

          <View className="gap-3">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.servings")}</ThemedText>
            <ServingScaler value={servings} min={1} max={24} onChange={setServings} />
          </View>

          {/* Ingredients */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.ingredients")}</ThemedText>
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
                <ThemedText variant="caption" style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.add")}</ThemedText>
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
                    placeholder={t("editRecipe.ingredientPlaceholder")}
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
                    onChangeText={(text) => updateIngredient(ing.id, "amount", parseFloat(text) || 0)}
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
                    <HugeiconsIcon icon={Delete02Icon} size={16} color={colors.error} strokeWidth={1.75} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* Steps */}
          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.steps")}</ThemedText>
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
                <ThemedText variant="caption" style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}>{t("editRecipe.addStep")}</ThemedText>
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
                        style={{ color: colors.white, fontFamily: "Baloo2-SemiBold", fontSize: 12 }}
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
                        <HugeiconsIcon icon={Delete02Icon} size={14} color={colors.error} strokeWidth={1.75} />
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
                    placeholder={t("editRecipe.stepPlaceholder", { number: index + 1 })}
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
              {saving ? t("editRecipe.saving") : t("editRecipe.save")}
            </ThemedButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
