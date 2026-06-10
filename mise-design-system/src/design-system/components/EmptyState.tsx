import React from "react";
import { View } from "react-native";
import { AppText } from "./AppText";
import { Button } from "./Button";

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

      <AppText variant="h4" style={{ textAlign: "center" }}>
        {title}
      </AppText>

      <AppText variant="bodySmall" color="secondary" style={{ marginTop: 8, textAlign: "center" }}>
        {description}
      </AppText>

      {actionLabel ? (
        <View className="mt-4">
          <Button onPress={onAction}>{actionLabel}</Button>
        </View>
      ) : null}
    </View>
  );
}
