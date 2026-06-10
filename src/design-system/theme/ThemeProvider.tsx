import React, { createContext, useContext, useState, useCallback } from "react";
import { useColorScheme } from "react-native";
import { darkColors, lightColors, type Colors } from "../tokens/colors";

export type ThemePreference = "system" | "light" | "dark";

interface ThemeContextValue {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
  colorScheme: "light" | "dark" | null;
  isDark: boolean;
  colors: Colors;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themePreference, setThemePreferenceState] =
    useState<ThemePreference>("system");

  const setThemePreference = useCallback((preference: ThemePreference) => {
    setThemePreferenceState(preference);
  }, []);

  const resolvedColorScheme: "light" | "dark" =
    themePreference === "system"
      ? systemColorScheme ?? "light"
      : themePreference;

  const isDark = resolvedColorScheme === "dark";
  const colors = (isDark ? darkColors : lightColors) as Colors;

  return (
    <ThemeContext.Provider
      value={{
        themePreference,
        setThemePreference,
        colorScheme: resolvedColorScheme,
        isDark,
        colors,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within a ThemeProvider");
  }
  return context;
}
