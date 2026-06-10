import React from "react";
import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
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
        <AppText variant="bodySmall">{title}</AppText>
        <AppText variant="caption" color="secondary" style={{ marginTop: 4 }}>
          {meta}
        </AppText>
      </View>
    </Pressable>
  );
}
