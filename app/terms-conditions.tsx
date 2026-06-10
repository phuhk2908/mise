import { ScrollView, View, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { ThemedText, useAppTheme } from "../src/design-system";
import { useTranslation } from "react-i18next";

export default function TermsConditionsScreen() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const sections = [
    { title: t("terms.usageTitle"), body: t("terms.usageBody") },
    { title: t("terms.contentTitle"), body: t("terms.contentBody") },
    { title: t("terms.responsibilityTitle"), body: t("terms.responsibilityBody") },
    { title: t("terms.offlineTitle"), body: t("terms.offlineBody") },
    { title: t("terms.changesTitle"), body: t("terms.changesBody") },
    { title: t("terms.liabilityTitle"), body: t("terms.liabilityBody") },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        className="flex-row items-center gap-3 px-4"
        style={{ paddingTop: insets.top + 8, paddingBottom: 12 }}
      >
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
        <ThemedText variant="h3" style={{ flex: 1 }}>
          {t("terms.title")}
        </ThemedText>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 pb-8 gap-5"
      >
        <ThemedText variant="caption" color="muted">
          {t("terms.lastUpdated")}
        </ThemedText>

        <ThemedText variant="body" color="secondary">
          {t("terms.intro")}
        </ThemedText>

        {sections.map((section, index) => (
          <View key={index} className="gap-2">
            <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
              {section.title}
            </ThemedText>
            <ThemedText variant="bodySmall" color="secondary" style={{ lineHeight: 22 }}>
              {section.body}
            </ThemedText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
