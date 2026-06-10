import React from "react";
import { View } from "react-native";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

type SectionHeaderProps = {
  title: string;
  count?: number;
};

export function SectionHeader({ title, count }: SectionHeaderProps) {
  const { colors } = useAppTheme();

  return (
    <View className="flex-row items-center gap-2 py-3">
      <ThemedText variant="overline" color="primary">
        {title.toUpperCase()}
      </ThemedText>
      {count != null ? (
        <View
          className="h-5 min-w-5 items-center justify-center rounded-full px-1.5"
          style={{ backgroundColor: colors.primaryLight }}
        >
          <ThemedText
            variant="caption"
            style={{ color: colors.white, fontFamily: "Baloo2-SemiBold" }}
          >
            {count}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}
