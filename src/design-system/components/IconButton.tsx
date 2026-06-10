import React from "react";
import { Pressable, type PressableProps } from "react-native";
import { useAppTheme } from "../theme/useAppTheme";

type IconButtonProps = PressableProps & {
  icon: (color: string) => React.ReactNode;
  color?: "primary" | "secondary" | "muted" | "error";
  selected?: boolean;
  disabled?: boolean;
};

export function IconButton({
  icon,
  color = "secondary",
  selected = false,
  disabled = false,
  style,
  ...props
}: IconButtonProps) {
  const { colors } = useAppTheme();

  const colorMap = {
    primary: colors.primary,
    secondary: colors.textSecondary,
    muted: colors.textMuted,
    error: colors.error,
  } as const;

  const iconColor = selected ? colors.primary : colorMap[color];

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      disabled={disabled}
      className="min-h-11 min-w-11 items-center justify-center rounded-full"
      style={({ pressed, hovered }) => [
        { opacity: disabled ? 0.5 : pressed ? 0.8 : 1 },
        typeof style === "function" ? style({ pressed, hovered }) : style,
      ]}
    >
      {icon(iconColor)}
    </Pressable>
  );
}
