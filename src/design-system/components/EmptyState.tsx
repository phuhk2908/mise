import React from "react";
import { View } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedButton } from "./ThemedButton";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
};

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  illustration,
}: EmptyStateProps) {
  return (
    <View className="items-center justify-center px-6 py-12">
      {illustration ? <View className="mb-4">{illustration}</View> : null}

      <ThemedText variant="h4" style={{ textAlign: "center" }}>
        {title}
      </ThemedText>

      <ThemedText variant="bodySmall" color="secondary" style={{ marginTop: 8, textAlign: "center" }}>
        {description}
      </ThemedText>

      {actionLabel ? (
        <View className="mt-4">
          <ThemedButton onPress={onAction}>{actionLabel}</ThemedButton>
        </View>
      ) : null}
    </View>
  );
}
