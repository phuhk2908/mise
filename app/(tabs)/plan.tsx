import { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, View, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Calendar03Icon,
  ArrowRight01Icon,
  Add01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import {
  ThemedText,
  useAppTheme,
  EmptyState,
  ThemedButton,
  Chip,
} from "../../src/design-system";
import { api } from "../../convex/_generated/api";
import type { Recipe, PlannedMeal } from "../../src/types";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

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

  const planData = useQuery(api.mealPlans.getByWeekStart, { weekStart });
  const recipesData = useQuery(api.recipes.getAll);

  const createPlan = useMutation(api.mealPlans.getOrCreate);
  const removeMeal = useMutation(api.mealPlans.removeMeal);
  const generateList = useMutation(api.shoppingLists.generateFromPlan);

  const createdRef = useRef(false);

  useEffect(() => {
    if (planData === null && !createdRef.current) {
      createdRef.current = true;
      createPlan({ weekStart });
    }
  }, [planData, weekStart, createPlan]);

  // Reset ref when week changes
  useEffect(() => {
    createdRef.current = false;
  }, [weekStart]);

  const handleRemoveMeal = useCallback(
    (mealId: string) => {
      removeMeal({ id: mealId as any });
    },
    [removeMeal]
  );

  const handleGenerateList = useCallback(() => {
    generateList({ weekStart });
    router.push("/shopping" as any);
  }, [generateList, weekStart, router]);

  const getMealsForSlot = (date: string, type: string) =>
    (planData?.meals ?? []).filter((m: PlannedMeal) => m.date === date && m.mealType === type);

  const getRecipeTitle = (recipeId: string) =>
    (recipesData ?? []).find((r: Recipe) => r.id === recipeId)?.title ?? t("common.unknown");

  const hasAnyMeals = (planData?.meals ?? []).length > 0;

  // Loading: centered both horizontally and vertically
  if (planData === undefined || recipesData === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">{t("plan.loading")}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const weekDates = getWeekDates(weekStart);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
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
                icon={ArrowRight01Icon}
                size={16}
                color={colors.textMuted}
                strokeWidth={1.75}
                style={{ transform: [{ rotate: "180deg" }] }}
              />
            </Pressable>
            <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
              {t("plan.weekOf", { date: new Date(weekStart).toLocaleDateString("en-US", { month: "short", day: "numeric" }) })}
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
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.textMuted} strokeWidth={1.75} />
            </Pressable>
          </View>
        </View>

        {/* Weekly Grid */}
        <View className="rounded-2xl border overflow-hidden"
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
                <ThemedText variant="caption" color="muted">{t(`plan.days.${DAYS[getDayIndex(date)]}`)}</ThemedText>
                <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {getDayNumber(date)}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Meal slots */}
          {MEAL_TYPES.map((type) => (
            <View key={type} className="flex-row border-b"
              style={{ borderBottomColor: colors.outline }}
            >
              {weekDates.map((date) => {
                const slotMeals = getMealsForSlot(date, type);
                return (
                  <View
                    key={`${date}-${type}`}
                    className="flex-1 min-h-16 px-1 py-1"
                    style={{ borderRightWidth: 1, borderRightColor: colors.outline }}
                  >
                    {slotMeals.length === 0 ? (
                      <Pressable
                        onPress={() => {}}
                        className="flex-1 items-center justify-center rounded-lg"
                        style={({ pressed }) => ({
                          opacity: pressed ? 0.7 : 1,
                          backgroundColor: colors.background,
                        })}
                      >
                        <HugeiconsIcon icon={Add01Icon} size={14} color={colors.textMuted} strokeWidth={1.5} />
                      </Pressable>
                    ) : (
                      <View className="gap-1">
                        {slotMeals.map((meal) => (
                          <View
                            key={meal.id}
                            className="rounded-md px-1.5 py-1"
                            style={{ backgroundColor: colors.neutral100 ?? colors.outline }}
                          >
                            <View className="flex-row items-center justify-between">
                              <ThemedText
                                variant="caption"
                                numberOfLines={1}
                                style={{ fontFamily: "Baloo2-SemiBold", flex: 1 }}
                              >
                                {getRecipeTitle(meal.recipeId)}
                              </ThemedText>
                              <Pressable
                                onPress={() => handleRemoveMeal(meal.id)}
                                className="h-4 w-4 items-center justify-center"
                                style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={10} color={colors.error} strokeWidth={2} />
                              </Pressable>
                            </View>
                            <ThemedText variant="caption" color="muted">{t("plan.mealServings", { servings: meal.servings })}</ThemedText>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Meal type legend */}
        <View className="flex-row gap-2 flex-wrap">
          {MEAL_TYPES.map((type) => (
            <Chip
              key={type}
              label={t(`plan.mealTypes.${type}`)}
              selected={false}
              onPress={() => {}}
            />
          ))}
        </View>

        {/* Actions */}
        <View className="gap-3">
          <ThemedButton
            onPress={handleGenerateList}
            disabled={!hasAnyMeals}
          >
            <View className="flex-row items-center gap-2">
              <HugeiconsIcon icon={Calendar03Icon} size={18} color={colors.white} strokeWidth={1.75} />
              <ThemedText variant="bodySmall" style={{ color: colors.white, fontFamily: "Baloo2-SemiBold" }}>
                {t("plan.generateList")}
              </ThemedText>
            </View>
          </ThemedButton>

          {!hasAnyMeals && (
            <ThemedText variant="caption" color="muted" style={{ textAlign: "center" }}>
              {t("plan.noMealsHint")}
            </ThemedText>
          )}
        </View>

        {/* Help card */}
        <View
          className="rounded-2xl border px-4 py-4 gap-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
        >
          <View className="flex-row items-center gap-2">
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: colors.neutral100 ?? colors.outline }}
            >
              <HugeiconsIcon icon={Calendar03Icon} size={20} color={colors.primary} strokeWidth={1.75} />
            </View>
            <View className="flex-1">
              <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("plan.helpTitle")}</ThemedText>
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
