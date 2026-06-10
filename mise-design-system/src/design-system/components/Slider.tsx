import React from "react";
import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { useAppTheme } from "../theme/useAppTheme";

type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  label?: string;
  onChange?: (value: number) => void;
};

export function Slider({ value, min = 0, max = 100, label }: SliderProps) {
  const { colors } = useAppTheme();
  const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));

  return (
    <View className="gap-2">
      <View className="h-6 justify-center">
        <View className="h-1 rounded-full" style={{ backgroundColor: colors.outline }}>
          <View
            className="h-1 rounded-full"
            style={{ backgroundColor: colors.primary, width: `${progress * 100}%` }}
          />
        </View>
        <Pressable
          className="absolute h-6 w-6 items-center justify-center rounded-full"
          style={({ pressed }) => ({
            left: `${progress * 100}%`,
            marginLeft: -12,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <View className="h-4 w-4 rounded-full" style={{ backgroundColor: colors.primary }} />
        </Pressable>
      </View>

      {label ? (
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
      ) : null}
    </View>
  );
}
