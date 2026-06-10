import React, { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { AppText } from "./AppText";
import { useAppTheme } from "../theme/useAppTheme";

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  disabled?: boolean;
};

export function Input({ label, error, disabled = false, style, ...props }: InputProps) {
  const { colors, isDark } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? colors.error : focused ? colors.primary : colors.outline;

  return (
    <View className="gap-1">
      {label ? (
        <AppText variant="caption" color="secondary">
          {label}
        </AppText>
      ) : null}

      <TextInput
        {...props}
        editable={!disabled}
        placeholderTextColor={colors.textMuted}
        onFocus={(event) => {
          setFocused(true);
          props.onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          props.onBlur?.(event);
        }}
        className="min-h-11 rounded-xl border px-3"
        style={[
          {
            backgroundColor: disabled
              ? isDark
                ? colors.neutral800
                : colors.neutral100
              : colors.surface,
            borderColor,
            color: colors.textPrimary,
            fontFamily: "Baloo2-Regular",
            fontSize: 14,
            lineHeight: 20,
            opacity: disabled ? 0.6 : 1,
          },
          style,
        ]}
      />

      {error ? (
        <AppText variant="caption" color="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
