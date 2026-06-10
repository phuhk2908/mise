import { useState } from "react";
import { View, Pressable } from "react-native";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "convex/react";
import { useRouter } from "expo-router";
import {
  ThemedText,
  ThemedButton,
  useAppTheme,
  ConfirmDialog,
  type ThemePreference,
} from "../../src/design-system";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Sun02Icon,
  Moon02Icon,
  ComputerSettingsIcon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Database02Icon,
  TranslateIcon,
  ArrowRight01Icon,
  File01Icon,
  Shield02Icon,
  LockIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { api } from "../../convex/_generated/api";
import { useTranslation } from "react-i18next";
import { changeLanguage, getCurrentLanguage } from "../../src/i18n";

const THEME_OPTIONS: { value: ThemePreference; icon: any }[] = [
  { value: "light", icon: Sun02Icon },
  { value: "dark", icon: Moon02Icon },
  { value: "system", icon: ComputerSettingsIcon },
];

const LEGAL_ITEMS: {
  key: string;
  labelKey: string;
  route: string;
  icon: any;
}[] = [
  {
    key: "privacy",
    labelKey: "more.privacyPolicy",
    route: "/privacy-policy",
    icon: Shield02Icon,
  },
  {
    key: "terms",
    labelKey: "more.termsConditions",
    route: "/terms-conditions",
    icon: File01Icon,
  },
  {
    key: "dataSafety",
    labelKey: "more.dataSafety",
    route: "/data-safety",
    icon: LockIcon,
  },
];

const LANG_OPTIONS: { value: "vi" | "en"; labelKey: string }[] = [
  { value: "vi", labelKey: "more.vietnamese" },
  { value: "en", labelKey: "more.english" },
];

export default function MoreScreen() {
  const { colors, themePreference, setThemePreference } = useAppTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const clearAll = useMutation(api.reset.clearAll);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lang, setLang] = useState<"vi" | "en">(getCurrentLanguage());

  const handleReset = async () => {
    setResetting(true);
    try {
      await clearAll();
      setShowResetDialog(false);
    } catch (err) {
      console.error("Reset failed:", err);
    } finally {
      setResetting(false);
    }
  };

  const handleChangeLanguage = (value: "vi" | "en") => {
    setLang(value);
    changeLanguage(value);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pt-6 pb-8 gap-6"
      >
        <ThemedText variant="h2">{t("more.title")}</ThemedText>

        {/* Preferences Section */}
        <View className="gap-3">
          <ThemedText variant="overline" color="primary">
            {t("more.preferences")}
          </ThemedText>

          {/* Language */}
          <View
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <View className="flex-row items-center gap-3 px-4 py-3">
              <HugeiconsIcon
                icon={TranslateIcon}
                size={20}
                color={colors.primary}
                strokeWidth={1.75}
              />
              <View className="flex-1">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {t("more.language")}
                </ThemedText>
                <ThemedText variant="caption" color="secondary">
                  {t("more.languageDesc")}
                </ThemedText>
              </View>
            </View>
            <View className="px-4 pb-3">
              <View className="flex-row gap-2">
                {LANG_OPTIONS.map((option) => {
                  const active = lang === option.value;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => handleChangeLanguage(option.value)}
                      className="flex-1 flex-row items-center justify-center gap-2 rounded-xl border px-3 py-2"
                      style={{
                        backgroundColor: active
                          ? colors.primary + "15"
                          : colors.surface,
                        borderColor: active ? colors.primary : colors.outline,
                      }}
                    >
                      <ThemedText
                        variant="bodySmall"
                        style={{
                          color: active ? colors.primary : colors.textSecondary,
                          fontFamily: active
                            ? "Baloo2-SemiBold"
                            : "Baloo2-Regular",
                        }}
                      >
                        {t(option.labelKey)}
                      </ThemedText>
                      {active ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle01Icon}
                          size={16}
                          color={colors.primary}
                          strokeWidth={1.75}
                        />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>

          {/* AI Settings */}
          <Pressable
            onPress={() => router.push("/ai-settings" as any)}
            className="rounded-2xl border overflow-hidden flex-row items-center gap-3 px-4 py-3"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <HugeiconsIcon
              icon={SparklesIcon}
              size={20}
              color={colors.primary}
              strokeWidth={1.75}
            />
            <View className="flex-1">
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                {t("more.aiSettings")}
              </ThemedText>
              <ThemedText variant="caption" color="secondary">
                {t("more.aiSettingsDesc")}
              </ThemedText>
            </View>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={18}
              color={colors.textMuted}
              strokeWidth={1.75}
            />
          </Pressable>

          {/* Appearance */}
          <View
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            {THEME_OPTIONS.map((option, index) => {
              const active = themePreference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setThemePreference(option.value)}
                  className="min-h-14 flex-row items-center gap-3 px-4 py-3"
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    borderBottomWidth:
                      index < THEME_OPTIONS.length - 1 ? 1 : 0,
                    borderBottomColor: colors.outline,
                  })}
                >
                  <HugeiconsIcon
                    icon={option.icon}
                    size={20}
                    color={active ? colors.primary : colors.textSecondary}
                    strokeWidth={1.75}
                  />
                  <ThemedText
                    variant="body"
                    style={{
                      flex: 1,
                      color: active
                        ? colors.textPrimary
                        : colors.textSecondary,
                      fontFamily: active
                        ? "Baloo2-SemiBold"
                        : "Baloo2-Regular",
                    }}
                  >
                    {t(`more.${option.value}`)}
                  </ThemedText>
                  {active ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={20}
                      color={colors.primary}
                      strokeWidth={1.75}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <ThemedText variant="caption" color="muted">
            {themePreference === "system"
              ? t("more.systemDesc")
              : t("more.modeDesc", {
                  mode: t(`more.${themePreference}`),
                })}
          </ThemedText>
        </View>

        {/* Data Section */}
        <View className="gap-3">
          <ThemedText variant="overline" color="primary">
            {t("more.data")}
          </ThemedText>

          <View
            className="rounded-2xl border px-4 py-3 gap-3"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <View className="flex-row items-center gap-3">
              <View
                className="h-10 w-10 items-center justify-center rounded-full"
                style={{ backgroundColor: colors.error + "15" }}
              >
                <HugeiconsIcon
                  icon={Database02Icon}
                  size={20}
                  color={colors.error}
                  strokeWidth={1.75}
                />
              </View>
              <View className="flex-1">
                <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                  {t("more.resetData")}
                </ThemedText>
                <ThemedText variant="caption" color="secondary">
                  {t("more.resetDataDesc")}
                </ThemedText>
              </View>
            </View>
            <ThemedButton
              variant="destructive"
              onPress={() => setShowResetDialog(true)}
              disabled={resetting}
            >
              {resetting ? t("more.deleting") : t("more.deleteAll")}
            </ThemedButton>
          </View>
        </View>

        {/* Legal Section */}
        <View className="gap-3">
          <ThemedText variant="overline" color="primary">
            {t("more.legal")}
          </ThemedText>

          <View
            className="rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            {LEGAL_ITEMS.map((item, index) => (
              <Pressable
                key={item.key}
                onPress={() => router.push(item.route as any)}
                className="min-h-14 flex-row items-center gap-3 px-4 py-3"
                style={{
                  borderBottomWidth:
                    index < LEGAL_ITEMS.length - 1 ? 1 : 0,
                  borderBottomColor: colors.outline,
                }}
              >
                <HugeiconsIcon
                  icon={item.icon}
                  size={20}
                  color={colors.primary}
                  strokeWidth={1.75}
                />
                <ThemedText variant="body" style={{ flex: 1 }}>
                  {t(item.labelKey)}
                </ThemedText>
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={18}
                  color={colors.textMuted}
                  strokeWidth={1.75}
                />
              </Pressable>
            ))}
          </View>
        </View>

        {/* About Section */}
        <View className="gap-3">
          <ThemedText variant="overline" color="primary">
            {t("more.about")}
          </ThemedText>

          <View
            className="rounded-2xl border px-4 py-3"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.outline,
            }}
          >
            <View className="flex-row items-center justify-between py-1">
              <ThemedText variant="body" color="secondary">
                {t("more.version")}
              </ThemedText>
              <ThemedText variant="body">1.0.0</ThemedText>
            </View>
            <View className="flex-row items-center justify-between py-1">
              <ThemedText variant="body" color="secondary">
                {t("more.build")}
              </ThemedText>
              <ThemedText variant="body">2025.0608</ThemedText>
            </View>
            <View className="flex-row items-center justify-between py-1">
              <ThemedText variant="body" color="secondary">
                {t("more.expoSdk")}
              </ThemedText>
              <ThemedText variant="body">54</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showResetDialog}
        title={t("dialogs.resetTitle")}
        description={t("dialogs.resetDesc")}
        confirmLabel={t("dialogs.confirmDelete")}
        cancelLabel={t("dialogs.cancel")}
        confirmVariant="danger"
        onConfirm={handleReset}
        onCancel={() => setShowResetDialog(false)}
      />
    </SafeAreaView>
  );
}
