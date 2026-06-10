import type { TextStyle } from "react-native";

export const typography = {
  h1: {
    fontFamily: "Baloo2-ExtraBold",
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: "Baloo2-Bold",
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.25,
  },
  h3: {
    fontFamily: "Baloo2-Bold",
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 0,
  },
  h4: {
    fontFamily: "Baloo2-SemiBold",
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: 0,
  },
  bodyLarge: {
    fontFamily: "Baloo2-Regular",
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
  },
  body: {
    fontFamily: "Baloo2-Regular",
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  bodySmall: {
    fontFamily: "Baloo2-Regular",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: "Baloo2-Regular",
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0,
  },
  overline: {
    fontFamily: "Baloo2-SemiBold",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
  },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
