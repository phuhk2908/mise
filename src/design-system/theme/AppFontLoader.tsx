import React from "react";
import { ActivityIndicator, View } from "react-native";
import { useFonts } from "expo-font";
import {
  Baloo2_400Regular,
  Baloo2_500Medium,
  Baloo2_600SemiBold,
  Baloo2_700Bold,
  Baloo2_800ExtraBold,
} from "@expo-google-fonts/baloo-2";

export function AppFontLoader({ children }: { children: React.ReactNode }) {
  const [fontsLoaded] = useFonts({
    "Baloo2-Regular": Baloo2_400Regular,
    "Baloo2-Medium": Baloo2_500Medium,
    "Baloo2-SemiBold": Baloo2_600SemiBold,
    "Baloo2-Bold": Baloo2_700Bold,
    "Baloo2-ExtraBold": Baloo2_800ExtraBold,
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
