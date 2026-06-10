import React from "react";
import { Pressable, View } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Add01Icon, MinusSignIcon } from "@hugeicons/core-free-icons";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";
import { iconSize, iconStrokeWidth } from "../tokens/iconography";

type ServingScalerProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
};

export function ServingScaler({ value, min = 1, max = 99, onChange }: ServingScalerProps) {
  const { colors } = useAppTheme();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View className="flex-row items-center gap-3">
      <View
        className="flex-row items-center rounded-xl border"
        style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
      >
        <Pressable
          disabled={!canDecrease}
          onPress={() => onChange(value - 1)}
          className="h-9 w-9 items-center justify-center"
          style={({ pressed }) => ({ opacity: !canDecrease ? 0.5 : pressed ? 0.8 : 1 })}
        >
          <HugeiconsIcon
            icon={MinusSignIcon}
            size={iconSize.sm}
            color={colors.textPrimary}
            strokeWidth={iconStrokeWidth.regular}
          />
        </Pressable>

        <ThemedText
          variant="bodySmall"
          style={{ minWidth: 32, textAlign: "center", fontFamily: "Baloo2-SemiBold" }}
        >
          {value}
        </ThemedText>

        <Pressable
          disabled={!canIncrease}
          onPress={() => onChange(value + 1)}
          className="h-9 w-9 items-center justify-center"
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
    </View>
  );
}
