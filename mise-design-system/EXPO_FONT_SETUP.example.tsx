import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";

export function AppFontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    "Baloo2-Regular": require("./assets/fonts/Baloo2-Regular.ttf"),
    "Baloo2-Medium": require("./assets/fonts/Baloo2-Medium.ttf"),
    "Baloo2-SemiBold": require("./assets/fonts/Baloo2-SemiBold.ttf"),
    "Baloo2-Bold": require("./assets/fonts/Baloo2-Bold.ttf"),
    "Baloo2-ExtraBold": require("./assets/fonts/Baloo2-ExtraBold.ttf"),
  });

  if (!fontsLoaded) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <>{children}</>;
}
