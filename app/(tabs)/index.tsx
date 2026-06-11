import { useState, useMemo } from "react";
import {
  ScrollView,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  SearchIcon,
  Upload01Icon,
  ScanIcon,
  VoiceIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import {
  ThemedText,
  useAppTheme,
  EmptyState,
} from "../../src/design-system";
import { api } from "../../convex/_generated/api";

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "home.greetingMorning";
  if (hour < 17) return "home.greetingAfternoon";
  return "home.greetingEvening";
}

const QUICK_ACTIONS = [
  {
    key: "add",
    labelKey: "home.addRecipe",
    subtitleKey: "home.manually",
    icon: Upload01Icon,
    route: "/add-recipe?tab=manual" as const,
  },
  {
    key: "scan",
    labelKey: "home.scanRecipe",
    subtitleKey: "home.photoImage",
    icon: ScanIcon,
    route: "/add-recipe?tab=photo" as const,
  },
  {
    key: "voice",
    labelKey: "home.voiceInput",
    subtitleKey: "home.handsFree",
    icon: VoiceIcon,
    route: "/add-recipe?tab=voice" as const,
  },
];

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const greetingKey = useMemo(() => getGreetingKey(), []);

  const recipesData = useQuery(api.recipes.getAll);
  const recipes = recipesData ?? [];

  const filteredRecipes = search.trim()
    ? recipes.filter(
        (r) =>
          r.title.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const recentRecipes = recipes.slice(0, 3);
  const showSearchResults = search.trim().length > 0;
  const hasRecipes = recipes.length > 0;

  // Loading: centered both horizontally and vertically
  if (recipesData === undefined) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary} />
          <ThemedText variant="body" color="muted">
            {t("home.loadingKitchen")}
          </ThemedText>
        </View>
      </SafeAreaView>
    );
  }

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
        <View className="gap-1">
          <ThemedText variant="h1">{t("home.title")}</ThemedText>
          <ThemedText variant="h3">{t(greetingKey)}</ThemedText>
          <ThemedText variant="body" color="secondary">
            {t("home.subtitle")}
          </ThemedText>
        </View>

        {/* Search Bar */}
        <View
          className="flex-row items-center gap-2 rounded-full border px-4 py-3"
          style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
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
            placeholder={t("home.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Search Results */}
        {showSearchResults ? (
          <View className="gap-2">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("common.results")}</ThemedText>
            {filteredRecipes.length === 0 ? (
              <ThemedText variant="bodySmall" color="secondary">{t("common.noResults")}</ThemedText>
            ) : (
              <View className="gap-2">
                {filteredRecipes.map((recipe) => (
                  <Pressable
                    key={recipe.id}
                    onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                    className="flex-row items-center gap-3 rounded-2xl border px-4 py-3"
                    style={({ pressed }) => ({
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      opacity: pressed ? 0.9 : 1,
                    })}
                  >
                    <View className="flex-1">
                      <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                        {recipe.title}
                      </ThemedText>
                      <ThemedText variant="caption" color="secondary">
                        {recipe.servings && recipe.prepTime
                          ? t("home.servingsPrep", { servings: recipe.servings, prepTime: recipe.prepTime })
                          : recipe.servings
                          ? t("home.servingsOnly", { servings: recipe.servings })
                          : null}
                      </ThemedText>
                    </View>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color={colors.textMuted}
                      strokeWidth={1.75}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ) : null}

        {/* Quick Actions */}
        {!showSearchResults && (
          <>
            <View className="gap-3">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("home.quickActions")}</ThemedText>
              <View className="flex-row gap-3">
                {QUICK_ACTIONS.map((action) => (
                  <Pressable
                    key={action.key}
                    onPress={() => router.push(action.route as any)}
                    className="flex-1 items-center gap-2 rounded-2xl border px-2 py-4"
                    style={({ pressed }) => ({
                      backgroundColor: colors.surface,
                      borderColor: colors.outline,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <View
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: colors.neutral100 ?? colors.outline }}
                    >
                      <HugeiconsIcon
                        icon={action.icon}
                        size={20}
                        color={colors.primary}
                        strokeWidth={1.75}
                      />
                    </View>
                    <ThemedText
                      variant="caption"
                      style={{
                        fontFamily: "Baloo2-SemiBold",
                        textAlign: "center",
                      }}
                    >
                      {t(action.labelKey)}
                    </ThemedText>
                    <ThemedText variant="caption" color="muted" style={{ textAlign: "center" }}>
                      {t(action.subtitleKey)}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Recent Recipes */}
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("home.recentRecipes")}</ThemedText>
                <Pressable onPress={() => router.push("/recipes" as any)}>
                  <ThemedText variant="caption" color="primary" style={{ fontFamily: "Baloo2-SemiBold" }}>{t("common.seeAll")}</ThemedText>
                </Pressable>
              </View>

              {hasRecipes ? (
                <View className="gap-0">
                  {recentRecipes.map((recipe, index) => (
                    <Pressable
                      key={recipe.id}
                      onPress={() => router.push(`/recipe/${recipe.id}` as any)}
                      style={({ pressed }) => ({
                        opacity: pressed ? 0.9 : 1,
                      })}
                    >
                      <View className="flex-row items-center gap-3 py-4">
                        <View className="flex-1">
                          <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
                            {recipe.title}
                          </ThemedText>
                          <ThemedText variant="caption" color="secondary">
                            {recipe.servings ? t("home.servingsOnly", { servings: recipe.servings }) : null}
                          </ThemedText>
                        </View>
                        <HugeiconsIcon
                          icon={ArrowRight01Icon}
                          size={16}
                          color={colors.textMuted}
                          strokeWidth={1.75}
                        />
                      </View>
                      {index < recentRecipes.length - 1 ? (
                        <View className="h-px" style={{ backgroundColor: colors.outline }} />
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View
                  className="rounded-2xl border px-4 py-6"
                  style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
                >
                  <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
                    {t("home.noRecipesYet")}
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
