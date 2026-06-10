import React from "react";
import { Pressable, View } from "react-native";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

type RecipeCardProps = {
  title: string;
  meta: string;
  onPress?: () => void;
};

export function RecipeCard({ title, meta, onPress }: RecipeCardProps) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden rounded-xl border"
      style={({ pressed }) => ({
        backgroundColor: colors.card,
        borderColor: colors.outline,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View className="p-4">
        <ThemedText variant="bodySmall">{title}</ThemedText>
        <ThemedText variant="caption" color="secondary" style={{ marginTop: 4 }}>
          {meta}
        </ThemedText>
      </View>
    </Pressable>
  );
}
