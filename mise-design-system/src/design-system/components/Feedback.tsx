import React from "react";
import { View } from "react-native";
import { AppText } from "./AppText";
import { useAppTheme } from "../theme/useAppTheme";

type FeedbackVariant = "success" | "error" | "info" | "warning";

type FeedbackProps = {
  message: string;
  variant?: FeedbackVariant;
};

export function Feedback({ message, variant = "success" }: FeedbackProps) {
  const { colors } = useAppTheme();

  const colorMap = {
    success: colors.success,
    error: colors.error,
    info: colors.info,
    warning: colors.warning,
  } as const;

  const color = colorMap[variant];

  return (
    <View
      className="flex-row items-center rounded-xl border px-3 py-2"
      style={{ borderColor: color, backgroundColor: `${color}1A` }}
    >
      <AppText variant="caption" style={{ color, fontFamily: "Baloo2-Medium" }}>
        {message}
      </AppText>
    </View>
  );
}
