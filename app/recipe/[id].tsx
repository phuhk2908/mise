/**
 * Recipe Detail Screen
 * NOTE: All hooks must be called before any conditional returns.
 * This fixes the "Rendered more hooks than previous render" error.
 */
import { AddToListIcon, ArrowLeft01Icon, PencilEdit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
  type LayoutChangeEvent,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  IngredientItem,
  ServingScaler,
  ThemedButton,
  ThemedText,
  useAppTheme,
  EmptyState,
  ConfirmDialog,
} from "../../src/design-system";
import type { IngredientData } from "../../src/design-system/components/IngredientItem";
import type { Ingredient } from "../../src/types";
import { scaleAmount } from "../../src/utils/unitConverter";

export default function RecipeDetailScreen() {
  // ── Hooks first (never after a conditional return) ──
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [headerVisible, setHeaderVisible] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Sticky header animation hooks — MUST be before any return
  const titleY = useSharedValue(9999);
  const headerOpacity = useSharedValue(0);

  const stickyHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const threshold = titleY.value;
      const show = y > threshold;
      headerOpacity.value = withTiming(show ? 1 : 0, { duration: 300 });
      runOnJS(setHeaderVisible)(show);
    },
  });

  const handleTitleLayout = (e: LayoutChangeEvent) => {
    titleY.value = e.nativeEvent.layout.y;
  };

  // ── Data fetching with Convex ──
  const recipe = useQuery(api.recipes.getById, id ? { id: id as any } : "skip");

  const updateRecipe = useMutation(api.recipes.update);
  const deleteRecipe = useMutation(api.recipes.deleteRecipe);
  const generateFromRecipes = useMutation(api.shoppingLists.generateFromRecipes);

  // Sync local state when recipe loads
  useEffect(() => {
    if (recipe) {
      setServings(recipe.servings);
      setIngredients(recipe.ingredients);
    }
  }, [recipe?.id]);

  // ── Local handlers ──
  const handleUpdateIngredient = useCallback(async (updated: IngredientData) => {
    const next = ingredients.map((ing) =>
      ing.id === updated.id
        ? { ...ing, name: updated.name, amount: updated.amount, unit: updated.unit }
        : ing
    );
    setIngredients(next);
    await updateRecipe({
      id: id as any,
      ingredients: next.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        originalUnit: ing.originalUnit,
        category: ing.category,
        optional: ing.optional,
        notes: ing.notes,
      })),
    });
  }, [ingredients, updateRecipe, id]);

  const handleDeleteIngredient = useCallback(async (ingredientId: string) => {
    const next = ingredients.filter((ing) => ing.id !== ingredientId);
    setIngredients(next);
    await updateRecipe({
      id: id as any,
      ingredients: next.map((ing) => ({
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        originalUnit: ing.originalUnit,
        category: ing.category,
        optional: ing.optional,
        notes: ing.notes,
      })),
    });
  }, [ingredients, updateRecipe, id]);

  const handleDeleteRecipe = useCallback(async () => {
    await deleteRecipe({ id: id as any });
    router.back();
  }, [deleteRecipe, id, router]);

  const handleAddToList = useCallback(async () => {
    if (!recipe) return;
    await generateFromRecipes({
      recipeServings: [{ recipeId: id as any, servings }],
      name: recipe.title,
    });
    router.push("/shopping" as any);
  }, [generateFromRecipes, recipe, id, servings, router]);

  // ── Conditional returns AFTER all hooks ──

  if (recipe === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">{t("recipe.loading")}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center px-6">
          <EmptyState
            title={t("recipe.notFoundTitle")}
            description={t("recipe.notFoundDesc")}
            actionLabel={t("recipe.goBack")}
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const ratio = servings / recipe.servings;
  const scaledIngredients = ingredients.map((ing) => ({
    ...ing,
    amount: scaleAmount(ing.amount, ratio),
  }));

  return (
    <>
      {/* Delete confirmation modal */}
      <ConfirmDialog
        visible={showDeleteDialog}
        title={t("recipe.deleteTitle")}
        description={t("recipe.deleteDesc", { title: recipe.title })}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        onConfirm={() => {
          setShowDeleteDialog(false);
          handleDeleteRecipe();
        }}
        onCancel={() => setShowDeleteDialog(false)}
      />

      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Sticky header */}
        <Animated.View
          style={[
            stickyHeaderStyle,
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 20,
              paddingHorizontal: 16,
              paddingTop: insets.top + 8,
              paddingBottom: 8,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              backgroundColor: colors.background + "F2",
              borderBottomWidth: 1,
              borderBottomColor: colors.outline + "40",
            },
          ]}
          pointerEvents={headerVisible ? "box-none" : "none"}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.textPrimary} strokeWidth={1.75} />
          </Pressable>
          <ThemedText
            variant="body"
            numberOfLines={1}
            style={{ fontFamily: "Baloo2-SemiBold", flex: 1 }}
          >
            {recipe.title}
          </ThemedText>
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <Animated.ScrollView
            className="flex-1"
            contentContainerClassName="pb-8"
            onScroll={scrollHandler}
            scrollEventThrottle={16}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={() => {}}
                tintColor={colors.primary}
              />
            }
          >
            <View className="px-4 pt-4 gap-5">
              {/* Header row */}
              <View className="flex-row items-center justify-between">
                <Pressable
                  onPress={() => router.back()}
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={24} color={colors.textPrimary} strokeWidth={1.75} />
                </Pressable>

                <View className="flex-row gap-2">
                  <Pressable
                    onPress={() => router.push(`/edit-recipe?id=${recipe.id}` as any)}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: colors.surface,
                    })}
                  >
                    <HugeiconsIcon icon={PencilEdit02Icon} size={20} color={colors.primary} strokeWidth={1.75} />
                  </Pressable>
                  <Pressable
                    onPress={() => setShowDeleteDialog(true)}
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.8 : 1,
                      backgroundColor: colors.surface,
                    })}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={20} color={colors.error} strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>

              <View onLayout={handleTitleLayout}>
                <ThemedText variant="h3">{recipe.title}</ThemedText>
              </View>
              <ThemedText variant="body" color="secondary">{recipe.description}</ThemedText>

              {/* Meta row */}
              <View className="flex-row gap-3">
                {recipe.prepTime ? (
                  <View className="rounded-xl border px-4 py-3 gap-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="caption" color="muted">{t("common.prep")}</ThemedText>
                    <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                      {recipe.prepTime}
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.cookTime ? (
                  <View className="rounded-xl border px-4 py-3 gap-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="caption" color="muted">{t("common.cook")}</ThemedText>
                    <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                      {recipe.cookTime}
                    </ThemedText>
                  </View>
                ) : null}
                {recipe.servings ? (
                  <View className="rounded-xl border px-4 py-3 gap-1"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="caption" color="muted">{t("common.serves")}</ThemedText>
                    <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                      {servings}
                    </ThemedText>
                  </View>
                ) : null}
              </View>

              {/* Serving scaler */}
              <View
                className="flex-row items-center justify-between rounded-2xl border px-4 py-4"
                style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
              >
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("recipe.scaleRecipe")}</ThemedText>
                <ServingScaler value={servings} min={1} max={24} onChange={setServings} />
              </View>

              {/* Ingredients section */}
              <View className="gap-3">
                <View className="flex-row items-center justify-between">
                  <ThemedText variant="h4">{t("recipe.ingredientsTitle")}</ThemedText>
                  <ThemedText variant="caption" color="muted">{t("recipe.ingredientsCount", { count: ingredients.length })}</ThemedText>
                </View>

                <ThemedText variant="caption" color="secondary">
                  {t("recipe.ingredientsHint")}
                </ThemedText>

                {ingredients.length === 0 ? (
                  <View
                    className="rounded-2xl border px-4 py-6"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
                      {t("recipe.noIngredients")}
                    </ThemedText>
                  </View>
                ) : (
                  <View
                    className="rounded-2xl border overflow-hidden"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <View className="px-4 py-3">
                      {scaledIngredients.map((ing, index) => (
                        <View key={ing.id}>
                          <IngredientItem
                            ingredient={{ id: ing.id, name: ing.name, amount: ing.amount, unit: ing.unit }}
                            onUpdate={handleUpdateIngredient}
                            onDelete={handleDeleteIngredient}
                          />
                          {index < scaledIngredients.length - 1 ? (
                            <View className="h-px" style={{ backgroundColor: colors.outline }} />
                          ) : null}
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>

              {/* Instructions section */}
              <View className="gap-3">
                <ThemedText variant="h4">{t("recipe.instructionsTitle")}</ThemedText>

                {recipe.instructions.length === 0 ? (
                  <View
                    className="rounded-2xl border px-4 py-6"
                    style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                  >
                    <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
                      {t("recipe.noInstructions")}
                    </ThemedText>
                  </View>
                ) : (
                  <View className="gap-3">
                    {recipe.instructions.map((step) => (
                      <View key={step.id} className="flex-row gap-3">
                        <View
                          className="h-7 w-7 items-center justify-center rounded-full"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <ThemedText
                            variant="caption"
                            style={{ color: colors.white, fontFamily: "Baloo2-SemiBold" }}
                          >
                            {step.stepNumber}
                          </ThemedText>
                        </View>
                        <ThemedText variant="bodySmall" style={{ flex: 1, lineHeight: 22 }}>
                          {step.text}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Add to shopping list CTA */}
              <View className="mt-2">
                <ThemedButton
                  variant="secondary"
                  onPress={handleAddToList}
                >
                  <View className="flex-row items-center gap-2">
                    <HugeiconsIcon icon={AddToListIcon} size={18} color={colors.primary} strokeWidth={1.75} />
                    <ThemedText
                      variant="bodySmall"
                      style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                    >
                      {t("recipe.addToShopping")}
                    </ThemedText>
                  </View>
                </ThemedButton>
              </View>
            </View>
          </Animated.ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
