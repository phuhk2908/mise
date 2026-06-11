import { useState, useCallback, useEffect, useRef } from "react";
import { ScrollView, View, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useQuery, useMutation } from "convex/react";
import {
  ThemedText,
  ThemedButton,
  ShoppingItem,
  SectionHeader,
  useAppTheme,
  EmptyState,
} from "../../src/design-system";
import { api } from "../../convex/_generated/api";
import type { ShoppingItem as ShoppingItemType } from "../../src/types";
import { simplifyUnit } from "../../src/utils/unitConverter";
import { decimalToFraction } from "../../src/utils/fraction";

const CATEGORY_ORDER_KEYS = [
  "produce",
  "dairy",
  "meat",
  "pantry",
  "frozen",
  "bakery",
  "other",
];

function getCategoryLabel(key: string, t: TFunction): string {
  const map: Record<string, string> = {
    produce: "shopping.categories.produce",
    dairy: "shopping.categories.dairy",
    meat: "shopping.categories.meat",
    pantry: "shopping.categories.pantry",
    frozen: "shopping.categories.frozen",
    bakery: "shopping.categories.bakery",
    other: "shopping.categories.other",
  };
  return t(map[key] ?? "shopping.categories.other");
}

function groupByCategory(
  items: ShoppingItemType[],
  t: TFunction
): Record<string, ShoppingItemType[]> {
  const groups: Record<string, ShoppingItemType[]> = {};
  for (const item of items) {
    const label = getCategoryLabel(item.category, t);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  const sorted: Record<string, ShoppingItemType[]> = {};
  for (const key of CATEGORY_ORDER_KEYS) {
    const label = getCategoryLabel(key, t);
    if (groups[label]) sorted[label] = groups[label];
  }
  for (const cat of Object.keys(groups)) {
    if (!sorted[cat]) sorted[cat] = groups[cat];
  }
  return sorted;
}

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const listData = useQuery(api.shoppingLists.getActive);
  const recipesData = useQuery(api.recipes.getAll);

  const toggleMutation = useMutation(api.shoppingLists.toggleItem);
  const clearMutation = useMutation(api.shoppingLists.clearChecked);
  const generateFromRecipes = useMutation(api.shoppingLists.generateFromRecipes);

  const [clearing, setClearing] = useState(false);
  const generatedRef = useRef(false);

  // Auto-generate list from all recipes if no active list exists
  useEffect(() => {
    if (
      listData === null &&
      recipesData != null &&
      recipesData.length > 0 &&
      !generatedRef.current
    ) {
      generatedRef.current = true;
      generateFromRecipes({
        recipeServings: recipesData.map((r) => ({ recipeId: r.id as any, servings: r.servings })),
        name: "All Recipes",
      });
    }
  }, [listData, recipesData, generateFromRecipes]);

  // Reset ref when navigating away / remounting
  useEffect(() => {
    return () => {
      generatedRef.current = false;
    };
  }, []);

  const list = listData;
  const items = list ? groupByCategory(list.items, t) : {};
  const allItems = Object.values(items).flat();
  const totalItems = allItems.length;
  const checkedCount = allItems.filter((i) => i.checked).length;

  const handleToggle = useCallback(
    (itemId: string) => {
      toggleMutation({ id: itemId as any });
    },
    [toggleMutation]
  );

  const handleClearChecked = useCallback(async () => {
    if (!list) return;
    setClearing(true);
    try {
      await clearMutation({ listId: list.id as any });
    } finally {
      setClearing(false);
    }
  }, [clearMutation, list]);

  const formatLabel = (item: ShoppingItemType): string => {
    if (item.amount == null || item.unit == null) return item.name;
    const simplified = simplifyUnit(item.amount, item.unit);
    const amountStr = decimalToFraction(simplified.amount);
    return `${amountStr} ${simplified.unit} ${item.name}`.trim();
  };

  // Loading: centered both horizontally and vertically
  if (listData === undefined || recipesData === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">{t("shopping.loading")}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-6 pb-8 gap-4"
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={colors.primary}
          />
        }
      >
        <View className="flex-row items-center justify-between">
          <ThemedText variant="h2">{t("shopping.title")}</ThemedText>
          {checkedCount > 0 ? (
            <ThemedText variant="caption" color="primary">
              {t("shopping.checkedCount", { checked: checkedCount, total: totalItems })}
            </ThemedText>
          ) : (
            <ThemedText variant="caption" color="muted">
              {t("shopping.totalItems", { total: totalItems })}
            </ThemedText>
          )}
        </View>

        {totalItems === 0 ? (
          <EmptyState
            title={t("shopping.emptyTitle")}
            description={t("shopping.emptyDesc")}
          />
        ) : (
          <>
            {checkedCount > 0 ? (
              <View className="mt-2">
                <ThemedButton variant="ghost" onPress={handleClearChecked} disabled={clearing}>
                  {clearing ? t("shopping.clearing") : t("shopping.clearChecked")}
                </ThemedButton>
              </View>
            ) : null}

            {Object.entries(items).map(([category, list]) => {
              if (list.length === 0) return null;
              return (
                <View key={category} className="gap-1">
                  <SectionHeader title={category} count={list.length} />
                  {list.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      label={formatLabel(item)}
                      checked={item.checked}
                      onToggle={() => handleToggle(item.id)}
                    />
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
