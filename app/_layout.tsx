import { useEffect, useRef } from "react";
import { View } from "react-native";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ConvexProvider, ConvexReactClient, useMutation } from "convex/react";
import { I18nextProvider } from "react-i18next";
import * as SystemUI from "expo-system-ui";
import { ThemeProvider, AppFontLoader, useAppTheme } from "../src/design-system";
import { api } from "../convex/_generated/api";
import i18n from "../src/i18n";
import "../global.css";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  // Expo web / React Native compatible
  unsavedChangesWarning: false,
});

function SeedOnMount() {
  const seed = useMutation(api.seed.seedRecipes);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    seed();
  }, [seed]);

  return null;
}

function ThemedStack() {
  const { colors } = useAppTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="recipe/[id]"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="add-recipe"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="edit-recipe"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="terms-conditions"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="data-safety"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="ai-settings"
          options={{ presentation: "card" }}
        />
        <Stack.Screen
          name="ai-review"
          options={{ presentation: "card" }}
        />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <SeedOnMount />
      <ThemeProvider>
        <I18nextProvider i18n={i18n}>
          <SafeAreaProvider>
            <AppFontLoader>
              <ThemedStack />
            </AppFontLoader>
          </SafeAreaProvider>
        </I18nextProvider>
      </ThemeProvider>
    </ConvexProvider>
  );
}
