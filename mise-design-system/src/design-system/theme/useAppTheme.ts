import { useColorScheme } from "react-native";
import { darkColors, lightColors } from "../tokens/colors";

export function useAppTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    colorScheme,
    isDark,
    colors: isDark ? darkColors : lightColors,
  };
}
