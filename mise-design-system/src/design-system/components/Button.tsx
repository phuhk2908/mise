import React from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { AppText } from "./AppText";
import { useAppTheme } from "../theme/useAppTheme";

type ButtonVariant = "primary" | "secondary" | "tertiary" | "destructive" | "ghost";

type ButtonProps = PressableProps & {
  children: React.ReactNode;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
};

export function Button({
  children,
  variant = "primary",
  loading = false,
  disabled = false,
  style,
  ...props
}: ButtonProps) {
  const { colors, isDark } = useAppTheme();
  const isDisabled = disabled || loading;

  const variantStyle: Record<ButtonVariant, ViewStyle> = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderColor: colors.outline,
    },
    tertiary: {
      backgroundColor: isDark ? colors.neutral800 : colors.neutral100,
      borderColor: "transparent",
    },
    destructive: {
      backgroundColor: "transparent",
      borderColor: colors.error,
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
  };

  const textColor: Record<ButtonVariant, string> = {
    primary: isDark ? colors.neutral900 : colors.white,
    secondary: colors.primary,
    tertiary: colors.textPrimary,
    destructive: colors.error,
    ghost: colors.primary,
  };

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={isDisabled}
      className="min-h-11 flex-row items-center justify-center gap-2 rounded-xl border px-4"
      style={({ pressed }) => [
        variantStyle[variant],
        { opacity: isDisabled ? 0.5 : pressed ? 0.8 : 1 },
        typeof style === "function" ? style({ pressed }) : style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor[variant]} /> : null}
      <AppText
        variant="bodySmall"
        style={{ color: textColor[variant], fontFamily: "Baloo2-SemiBold" }}
      >
        {children}
      </AppText>
    </Pressable>
  );
}
