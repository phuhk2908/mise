import { View, Pressable, Text } from "react-native";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../src/design-system";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home01Icon,
  CookBookIcon,
  Calendar03Icon,
  Menu01Icon,
} from "@hugeicons/core-free-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const tabs = [
    { routeIndex: 0, label: t("tabs.home"), icon: Home01Icon },
    { routeIndex: 1, label: t("tabs.recipes"), icon: CookBookIcon },
    { routeIndex: 2, label: t("tabs.plan"), icon: Calendar03Icon },
    { routeIndex: 3, label: t("tabs.more"), icon: Menu01Icon },
  ];

  return (
    <View
      className="flex-row items-end justify-around"
      style={{
        backgroundColor: colors.surface,
        borderTopColor: colors.outline,
        borderTopWidth: 1,
        paddingBottom: insets.bottom + 8,
        paddingTop: 4,
      }}
    >
      {tabs.map((tab) => {
        const route = state.routes[tab.routeIndex];
        const isFocused = state.index === tab.routeIndex;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            className="items-center justify-center"
            style={{ minWidth: 64, height: 56, paddingTop: 4 }}
          >
            <HugeiconsIcon
              icon={tab.icon}
              size={22}
              color={isFocused ? colors.primary : colors.textMuted}
              strokeWidth={isFocused ? 2 : 1.75}
            />
            <Text
              style={{
                fontFamily: isFocused ? "Baloo2-SemiBold" : "Baloo2-Regular",
                fontSize: 10,
                color: isFocused ? colors.primary : colors.textMuted,
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home") }} />
      <Tabs.Screen name="recipes" options={{ title: t("tabs.recipes") }} />
      <Tabs.Screen name="plan" options={{ title: t("tabs.plan") }} />
      <Tabs.Screen name="more" options={{ title: t("tabs.more") }} />
    </Tabs>
  );
}
