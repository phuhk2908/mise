import { useState } from "react";
import {
  ScrollView,
  View,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowRight01Icon,
  Clock01Icon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { ThemedText, Chip, useAppTheme, EmptyState } from "../../src/design-system";
import { api } from "../../convex/_generated/api";

const STATIC_TAGS = ["all", "favorites", "dinner", "quick", "breakfast", "vegetarian"];

export default function RecipesScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [activeTag, setActiveTag] = useState("all");

  const recipesData = useQuery(api.recipes.getAll);
  const allTagsData = useQuery(api.recipes.getTags);

  const recipes = recipesData ?? [];
  const allTags = Array.from(new Set([...STATIC_TAGS, ...(allTagsData ?? [])])).sort();

  const translateTag = (tag: string) => {
    const key = tag.toLowerCase();
    if (["all","favorites","dinner","quick","breakfast","vegetarian"].includes(key)) {
      return t(`recipes.tags.${key}`);
    }
    return tag;
  };

  const filtered = recipes.filter((r) => {
    if (activeTag === "all") return true;
    if (activeTag === "favorites") return false;
    return r.tags.includes(activeTag);
  });

  // Loading: centered both horizontally and vertically
  if (recipesData === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">{t("recipes.loading")}</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-6 pb-8 gap-5"
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
          <ThemedText variant="h2">{t("recipes.title")}</ThemedText>
          <Pressable
            onPress={() => router.push("/add-recipe?tab=manual" as any)}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={({ pressed }) => ({
              opacity: pressed ? 0.8 : 1,
              backgroundColor: colors.primary,
            })}
          >
            <HugeiconsIcon icon={Add01Icon} size={20} color={colors.white} strokeWidth={2} />
          </Pressable>
        </View>

        {/* Empty state: no recipes at all */}
        {recipes.length === 0 ? (
          <EmptyState
            title={t("recipes.noRecipesTitle")}
            description={t("recipes.noRecipesDesc")}
            actionLabel={t("recipes.addRecipe")}
            onAction={() => router.push("/add-recipe?tab=manual" as any)}
          />
        ) : (
          <>
            {/* Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
              <View className="flex-row gap-2 py-1">
                {allTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={translateTag(tag)}
                    selected={activeTag === tag}
                    onPress={() => setActiveTag(tag)}
                  />
                ))}
              </View>
            </ScrollView>

            {/* Recipe List - No images, clean text list */}
            <View className="gap-0 mt-2">
              {filtered.map((recipe, index) => (
                <Pressable
                  key={recipe.id}
                  onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <View className="py-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1 pr-3">
                        <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                          {recipe.title}
                        </ThemedText>
                        <View className="flex-row items-center gap-1 mt-1">
                          {recipe.servings ? (
                            <ThemedText variant="caption" color="secondary">
                              {t("home.servingsOnly", { servings: recipe.servings })}
                            </ThemedText>
                          ) : null}
                          {recipe.servings && recipe.prepTime ? (
                            <View className="h-1 w-1 rounded-full" style={{ backgroundColor: colors.textMuted }} />
                          ) : null}
                          {recipe.prepTime ? (
                            <View className="flex-row items-center gap-1">
                              <HugeiconsIcon
                                icon={Clock01Icon}
                                size={12}
                                color={colors.textMuted}
                                strokeWidth={1.75}
                              />
                              <ThemedText variant="caption" color="secondary">
                                {recipe.prepTime}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                      </View>
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        size={18}
                        color={colors.textMuted}
                        strokeWidth={1.75}
                      />
                    </View>
                  </View>
                  {index < filtered.length - 1 ? (
                    <View className="h-px" style={{ backgroundColor: colors.outline }} />
                  ) : null}
                </Pressable>
              ))}
            </View>

            {/* Empty state: filter returned nothing */}
            {filtered.length === 0 && (
              <View className="items-center justify-center py-12">
                <ThemedText variant="h4" style={{ textAlign: "center" }}>{t("recipes.noFilteredTitle")}</ThemedText>
                <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center", marginTop: 8 }}>
                  {t("recipes.noFilteredDesc")}
                </ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
