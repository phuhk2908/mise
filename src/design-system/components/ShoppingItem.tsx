import React from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

type ShoppingItemProps = {
  label: string;
  checked: boolean;
  onToggle: () => void;
};

export function ShoppingItem({ label, checked, onToggle }: ShoppingItemProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onToggle}
      className="min-h-11 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderColor: colors.outline,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        className="h-5 w-5 items-center justify-center rounded-full border"
        style={{
          borderColor: checked ? colors.primary : colors.outlineStrong,
          backgroundColor: checked ? colors.primary : colors.surface,
        }}
      >
        {checked ? (
          <ThemedText
            variant="caption"
            style={{
              color: colors.white,
              fontFamily: "Baloo2-Bold",
              fontSize: 12,
            }}
          >
            ✓
          </ThemedText>
        ) : null}
      </View>

      <ThemedText
        variant="body"
        style={{
          flex: 1,
          textDecorationLine: checked ? "line-through" : "none",
          color: checked ? colors.textMuted : colors.textPrimary,
        }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
