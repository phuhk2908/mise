import React from "react";
import { Text as RNText, type TextProps } from "react-native";
import { typography, type TypographyVariant } from "../tokens/typography";
import { useAppTheme } from "../theme/useAppTheme";

type TextColor =
  | "primary"
  | "secondary"
  | "muted"
  | "success"
  | "warning"
  | "error"
  | "info";

type ThemedTextProps = TextProps & {
  variant?: TypographyVariant;
  color?: TextColor;
};

export function ThemedText({
  variant = "body",
  color = "primary",
  style,
  children,
  ...props
}: ThemedTextProps) {
  const { colors } = useAppTheme();

  const colorMap = {
    primary: colors.textPrimary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
  } as const;

  return (
    <RNText
      {...props}
      style={[
        typography[variant],
        { color: colorMap[color] },
        variant === "overline" ? { textTransform: "uppercase" } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
