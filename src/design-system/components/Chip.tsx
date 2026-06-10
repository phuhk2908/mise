import React from "react";
import { Pressable, type PressableProps } from "react-native";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

type ChipProps = PressableProps & {
  label: string;
  selected?: boolean;
  disabled?: boolean;
};

export function Chip({ label, selected = false, disabled = false, style, ...props }: ChipProps) {
  const { colors, isDark } = useAppTheme();

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      className="min-h-8 flex-row items-center justify-center rounded-full border px-3"
      style={({ pressed, hovered }) => [
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.outline,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
        typeof style === "function" ? style({ pressed, hovered }) : style,
      ]}
    >
      <ThemedText
        variant="caption"
        style={{
          color: selected ? (isDark ? colors.neutral900! : colors.white) : colors.textPrimary,
          fontFamily: "Baloo2-Medium",
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
