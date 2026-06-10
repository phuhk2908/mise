import React from "react";
import { Pressable, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";
import { iconSize, iconStrokeWidth } from "../tokens/iconography";

type StepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function Stepper({ value, min = 0, max = Number.MAX_SAFE_INTEGER, onChange }: StepperProps) {
  const { colors } = useAppTheme();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View
      className="flex-row items-center rounded-full border"
      style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
    >
      <Pressable
        disabled={!canDecrease}
        onPress={() => onChange(value - 1)}
        className="h-9 w-9 items-center justify-center rounded-full"
        style={({ pressed }) => ({ opacity: !canDecrease ? 0.5 : pressed ? 0.8 : 1 })}
      >
        <HugeiconsIcon
          icon={MinusSignIcon}
          size={iconSize.sm}
          color={colors.textPrimary}
          strokeWidth={iconStrokeWidth.regular}
        />
      </Pressable>

      <ThemedText variant="bodySmall" style={{ minWidth: 32, textAlign: "center" }}>
        {value}
      </ThemedText>

      <Pressable
        disabled={!canIncrease}
        onPress={() => onChange(value + 1)}
        className="h-9 w-9 items-center justify-center rounded-full"
        style={({ pressed }) => ({ opacity: !canIncrease ? 0.5 : pressed ? 0.8 : 1 })}
      >
        <HugeiconsIcon
          icon={Add01Icon}
          size={iconSize.sm}
          color={colors.textPrimary}
          strokeWidth={iconStrokeWidth.regular}
        />
      </Pressable>
    </View>
  );
}
