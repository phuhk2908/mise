import { useState, useEffect, useRef, useCallback } from "react";
import {
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Delete02Icon,
  SearchIcon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  useAppTheme,
  EmptyState,
  ThemedButton,
  Chip,
  ServingScaler,
  ConfirmDialog,
} from "../../src/design-system";
import { api } from "../../convex/_generated/api";
import type { Recipe, PlannedMeal, MealType } from "../../src/types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return formatDate(d);
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
}

function getDayIndex(dateStr: string): number {
  return (new Date(dateStr).getDay() + 6) % 7;
}

function getDayNumber(dateStr: string): string {
  return new Date(dateStr).getDate().toString();
}

export default function PlanScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const router = useRouter();

  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  // ── Data ──
  const planData = useQuery(api.mealPlans.getByWeekStart, { weekStart });
  const recipesData = useQuery(api.recipes.getAll);

  const createPlan = useMutation(api.mealPlans.getOrCreate);
  const addMeal = useMutation(api.mealPlans.addMeal);
  const removeMeal = useMutation(api.mealPlans.removeMeal);
  const generateList = useMutation(api.shoppingLists.generateFromPlan);

  const createdRef = useRef(false);

  useEffect(() => {
    if (planData === null && !createdRef.current) {
      createdRef.current = true;
      createPlan({ weekStart });
    }
  }, [planData, weekStart, createPlan]);

  useEffect(() => {
    createdRef.current = false;
  }, [weekStart]);

  // ── Add Meal Modal state ──
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string;
    mealType: MealType;
  } | null>(null);
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [addServings, setAddServings] = useState(4);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Meal type visibility ──
  const [visibleTypes, setVisibleTypes] = useState<MealType[]>([...MEAL_TYPES]);

  // ── Delete confirmation ──
  const [mealToDelete, setMealToDelete] = useState<string | null>(null);

  const handleOpenAddModal = (date: string, mealType: MealType) => {
    setSelectedSlot({ date, mealType });
    setSelectedRecipeId(null);
    setAddServings(4);
    setSearchQuery("");
    setAddModalVisible(true);
  };

  const handleAddMeal = useCallback(async () => {
    if (!selectedSlot || !selectedRecipeId || !planData) return;
    try {
      await addMeal({
        planId: planData.id as any,
        date: selectedSlot.date,
        mealType: selectedSlot.mealType,
        recipeId: selectedRecipeId as any,
        servings: addServings,
      });
      setAddModalVisible(false);
      setSelectedSlot(null);
      setSelectedRecipeId(null);
    } catch (err) {
      // Convex will auto-retry on network issues; mutation errors surface via toast in real apps
      console.error("Failed to add meal", err);
    }
  }, [selectedSlot, selectedRecipeId, planData, addMeal, addServings]);

  const handleRemoveMeal = useCallback(
    (mealId: string) => {
      removeMeal({ id: mealId as any });
      setMealToDelete(null);
    },
    [removeMeal]
  );

  const handleGenerateList = useCallback(() => {
    generateList({ weekStart });
    router.push("/shopping" as any);
  }, [generateList, weekStart, router]);

  const toggleMealType = (type: MealType) => {
    setVisibleTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const getMealsForSlot = (date: string, type: string) =>
    (planData?.meals ?? []).filter(
      (m: PlannedMeal) => m.date === date && m.mealType === type
    );

  const getRecipeTitle = (recipeId: string) =>
    (recipesData ?? []).find((r: Recipe) => r.id === recipeId)?.title ??
    t("common.unknown");

  const hasAnyMeals = (planData?.meals ?? []).length > 0;

  const filteredRecipes = searchQuery.trim()
    ? (recipesData ?? []).filter((r: Recipe) =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : (recipesData ?? []);

  // ── Loading ──
  if (planData === undefined || recipesData === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">
            {t("plan.loading")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const weekDates = getWeekDates(weekStart);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Delete confirmation */}
      <ConfirmDialog
        visible={mealToDelete !== null}
        title={t("plan.deleteMealTitle")}
        description={t("plan.deleteMealDesc")}
        confirmLabel={t("common.delete")}
        cancelLabel={t("common.cancel")}
        confirmVariant="danger"
        onConfirm={() => mealToDelete && handleRemoveMeal(mealToDelete)}
        onCancel={() => setMealToDelete(null)}
      />

      {/* Add Meal Modal */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <SafeAreaView
          style={{ flex: 1, backgroundColor: colors.background }}
        >
          <View className="px-4 pt-4 pb-2 gap-4">
            {/* Modal header */}
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={() => setAddModalVisible(false)}
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
              <ThemedText variant="h3">
                {selectedSlot
                  ? t("plan.addMealTitle", {
                      day: t(`plan.days.${DAYS[getDayIndex(selectedSlot.date)]}`),
                      meal: t(`plan.mealTypes.${selectedSlot.mealType}`),
                    })
                  : t("plan.addMeal")}
              </ThemedText>
              <View className="h-10 w-10" />
            </View>

            {/* Search */}
            <View
              className="flex-row items-center gap-2 rounded-full border px-4 py-3"
              style={{
                backgroundColor: colors.surface,
                borderColor: colors.outline,
              }}
            >
              <HugeiconsIcon
                icon={SearchIcon}
                size={18}
                color={colors.textMuted}
                strokeWidth={1.75}
              />
              <TextInput
                className="flex-1"
                style={{
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                  height: 20,
                  padding: 0,
                  margin: 0,
                }}
                placeholder={t("plan.searchRecipe")}
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            {/* Servings */}
            <View className="flex-row items-center justify-between">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                {t("plan.servings")}
              </ThemedText>
              <ServingScaler
                value={addServings}
                min={1}
                max={24}
                onChange={setAddServings}
              />
            </View>
          </View>

          {/* Recipe list */}
          <ScrollView
            className="flex-1"
            contentContainerClassName="px-4 pb-8 gap-2"
          >
            {filteredRecipes.length === 0 ? (
              <View className="items-center py-12">
                <ThemedText variant="bodySmall" color="secondary">
                  {searchQuery.trim()
                    ? t("common.noResults")
                    : t("plan.noRecipes")}
                </ThemedText>
              </View>
            ) : (
              filteredRecipes.map((recipe: Recipe) => {
                const isSelected = selectedRecipeId === recipe.id;
                return (
                  <Pressable
                    key={recipe.id}
                    onPress={() => setSelectedRecipeId(recipe.id)}
                    className="flex-row items-center gap-3 rounded-2xl border px-4 py-3"
                    style={({ pressed }) => ({
                      backgroundColor: isSelected
                        ? colors.primary + "18"
                        : colors.surface,
                      borderColor: isSelected
                        ? colors.primary
                        : colors.outline,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <View className="flex-1">
                      <ThemedText
                        variant="bodySmall"
                        style={{
                          fontFamily: isSelected
                            ? "Baloo2-SemiBold"
                            : "Baloo2-Regular",
                          color: isSelected
                            ? colors.primary
                            : colors.textPrimary,
                        }}
                      >
                        {recipe.title}
                      </ThemedText>
                      <ThemedText variant="caption" color="secondary">
                        {recipe.servings && recipe.prepTime
                          ? t("home.servingsPrep", {
                              servings: recipe.servings,
                              prepTime: recipe.prepTime,
                            })
                          : recipe.servings
                          ? t("home.servingsOnly", {
                              servings: recipe.servings,
                            })
                          : null}
                      </ThemedText>
                    </View>
                    {isSelected && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle01Icon}
                        size={20}
                        color={colors.primary}
                        strokeWidth={1.75}
                      />
                    )}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {/* CTA */}
          <View className="px-4 pb-6 pt-2">
            <ThemedButton
              onPress={handleAddMeal}
              disabled={!selectedRecipeId}
            >
              <View className="flex-row items-center gap-2">
                <HugeiconsIcon
                  icon={Add01Icon}
                  size={18}
                  color={colors.white}
                  strokeWidth={2}
                />
                <ThemedText
                  variant="bodySmall"
                  style={{
                    color: colors.white,
                    fontFamily: "Baloo2-SemiBold",
                  }}
                >
                  {t("plan.addToPlan")}
                </ThemedText>
              </View>
            </ThemedButton>
          </View>
        </SafeAreaView>
      </Modal>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-6 pb-8 gap-5"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={colors.primary}
          />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between">
          <ThemedText variant="h2">{t("plan.title")}</ThemedText>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => {
                const prev = new Date(weekStart);
                prev.setDate(prev.getDate() - 7);
                setWeekStart(formatDate(prev));
              }}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                backgroundColor: colors.surface,
              })}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                size={16}
                color={colors.textMuted}
                strokeWidth={1.75}
              />
            </Pressable>
            <ThemedText
              variant="bodySmall"
              style={{ fontFamily: "Baloo2-SemiBold" }}
            >
              {t("plan.weekOf", {
                date: new Date(weekStart).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                }),
              })}
            </ThemedText>
            <Pressable
              onPress={() => {
                const next = new Date(weekStart);
                next.setDate(next.getDate() + 7);
                setWeekStart(formatDate(next));
              }}
              className="h-8 w-8 items-center justify-center rounded-full"
              style={({ pressed }) => ({
                opacity: pressed ? 0.8 : 1,
                backgroundColor: colors.surface,
              })}
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                size={16}
                color={colors.textMuted}
                strokeWidth={1.75}
              />
            </Pressable>
          </View>
        </View>

        {/* Weekly Grid */}
        <View
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
        >
          {/* Day headers */}
          <View className="flex-row">
            {weekDates.map((date) => (
              <View
                key={date}
                className="flex-1 items-center py-2 border-b"
                style={{ borderBottomColor: colors.outline }}
              >
                <ThemedText variant="caption" color="muted">
                  {t(`plan.days.${DAYS[getDayIndex(date)]}`)}
                </ThemedText>
                <ThemedText
                  variant="bodySmall"
                  style={{ fontFamily: "Baloo2-SemiBold" }}
                >
                  {getDayNumber(date)}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Meal slots */}
          {MEAL_TYPES.filter((type) => visibleTypes.includes(type)).map(
            (type) => (
              <View
                key={type}
                className="flex-row border-b"
                style={{ borderBottomColor: colors.outline }}
              >
                {weekDates.map((date) => {
                  const slotMeals = getMealsForSlot(date, type);
                  return (
                    <View
                      key={`${date}-${type}`}
                      className="flex-1 min-h-16 px-1 py-1"
                      style={{
                        borderRightWidth: 1,
                        borderRightColor: colors.outline,
                      }}
                    >
                      {slotMeals.length === 0 ? (
                        <Pressable
                          onPress={() => handleOpenAddModal(date, type)}
                          className="flex-1 items-center justify-center rounded-lg"
                          style={({ pressed }) => ({
                            opacity: pressed ? 0.7 : 1,
                            backgroundColor: colors.background,
                          })}
                        >
                          <HugeiconsIcon
                            icon={Add01Icon}
                            size={14}
                            color={colors.textMuted}
                            strokeWidth={1.5}
                          />
                        </Pressable>
                      ) : (
                        <View className="gap-1">
                          {slotMeals.map((meal) => (
                            <View
                              key={meal.id}
                              className="rounded-md px-1.5 py-1"
                              style={{
                                backgroundColor:
                                  colors.neutral100 ?? colors.outline,
                              }}
                            >
                              <View className="flex-row items-center justify-between">
                                <ThemedText
                                  variant="caption"
                                  numberOfLines={1}
                                  style={{
                                    fontFamily: "Baloo2-SemiBold",
                                    flex: 1,
                                  }}
                                >
                                  {getRecipeTitle(meal.recipeId)}
                                </ThemedText>
                                <Pressable
                                  onPress={() => setMealToDelete(meal.id)}
                                  className="h-4 w-4 items-center justify-center"
                                  style={({ pressed }) => ({
                                    opacity: pressed ? 0.7 : 1,
                                  })}
                                >
                                  <HugeiconsIcon
                                    icon={Delete02Icon}
                                    size={10}
                                    color={colors.error}
                                    strokeWidth={2}
                                  />
                                </Pressable>
                              </View>
                              <ThemedText variant="caption" color="muted">
                                {t("plan.mealServings", {
                                  servings: meal.servings,
                                })}
                              </ThemedText>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )
          )}
        </View>

        {/* Meal type toggles */}
        <View className="flex-row gap-2 flex-wrap">
          {MEAL_TYPES.map((type) => (
            <Chip
              key={type}
              label={t(`plan.mealTypes.${type}`)}
              selected={visibleTypes.includes(type)}
              onPress={() => toggleMealType(type)}
            />
          ))}
        </View>

        {/* Actions */}
        <View className="gap-3">
          <ThemedButton onPress={handleGenerateList} disabled={!hasAnyMeals}>
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={18}
                color={colors.white}
                strokeWidth={1.75}
              />
              <ThemedText
                variant="bodySmall"
                style={{
                  color: colors.white,
                  fontFamily: "Baloo2-SemiBold",
                }}
              >
                {t("plan.generateList")}
              </ThemedText>
            </View>
          </ThemedButton>

          {!hasAnyMeals && (
            <ThemedText
              variant="caption"
              color="muted"
              style={{ textAlign: "center" }}
            >
              {t("plan.noMealsHint")}
            </ThemedText>
          )}
        </View>

        {/* Help card */}
        <View
          className="rounded-2xl border px-4 py-4 gap-3"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outline,
          }}
        >
          <View className="flex-row items-center gap-2">
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{
                backgroundColor: colors.neutral100 ?? colors.outline,
              }}
            >
              <HugeiconsIcon
                icon={Calendar03Icon}
                size={20}
                color={colors.primary}
                strokeWidth={1.75}
              />
            </View>
            <View className="flex-1">
              <ThemedText
                variant="bodySmall"
                style={{ fontFamily: "Baloo2-SemiBold" }}
              >
                {t("plan.helpTitle")}
              </ThemedText>
              <ThemedText variant="caption" color="secondary">
                {t("plan.helpDesc")}
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
