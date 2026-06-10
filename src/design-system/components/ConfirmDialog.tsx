/**
 * Reusable confirmation dialog / modal.
 * Shows a backdrop, title, description, and two action buttons.
 */
import React from "react";
import { Modal, View, Pressable } from "react-native";
import { ThemedText } from "./ThemedText";
import { ThemedButton } from "./ThemedButton";
import { useAppTheme } from "../theme/useAppTheme";

type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: "primary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  confirmVariant = "primary",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "#00000080" }}
      >
        <View
          className="w-full rounded-2xl border px-5 py-6 gap-4"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.outline,
          }}
        >
          <ThemedText variant="h4" style={{ textAlign: "center" }}>
            {title}
          </ThemedText>
          <ThemedText variant="bodySmall" color="secondary" style={{ textAlign: "center" }}>
            {description}
          </ThemedText>

          <View className="gap-2">
            <ThemedButton
              variant={confirmVariant === "danger" ? "secondary" : "primary"}
              onPress={onConfirm}
            >
              <ThemedText
                variant="bodySmall"
                style={{
                  color: confirmVariant === "danger" ? colors.error : colors.white,
                  fontFamily: "Baloo2-SemiBold",
                  textAlign: "center",
                }}
              >
                {confirmLabel}
              </ThemedText>
            </ThemedButton>
            <Pressable
              onPress={onCancel}
              className="items-center py-3"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <ThemedText variant="bodySmall" color="secondary">
                {cancelLabel}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
