import React, { useState } from "react";
import {
  Modal,
  View,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowDown01Icon, Tick01Icon } from "@hugeicons/core-free-icons";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectModalProps = {
  visible: boolean;
  title: string;
  options: SelectOption[];
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function SelectModal({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: SelectModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();

  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0.4)" },
        ]}
        onPress={onClose}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 24,
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: 320,
              backgroundColor: colors.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.outline,
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 16,
                paddingTop: 16,
                paddingBottom: 8,
              }}
            >
              <ThemedText variant="body" style={{ fontFamily: "Baloo2-SemiBold" }}>
                {title}
              </ThemedText>
              <Pressable onPress={onClose} hitSlop={8}>
                <ThemedText
                  variant="body"
                  style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                >
                  {t("common.cancel")}
                </ThemedText>
              </Pressable>
            </View>

            {/* Options */}
            <ScrollView keyboardShouldPersistTaps="handled">
              {options.map((option) => {
                const isActive = selected === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleSelect(option.value)}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      backgroundColor: pressed
                        ? colors.neutral100 ?? colors.outline
                        : isActive
                        ? colors.primary + "14"
                        : colors.surface,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    })}
                  >
                    <ThemedText
                      variant="bodySmall"
                      style={{
                        fontFamily: isActive ? "Baloo2-SemiBold" : "Baloo2-Regular",
                        color: isActive ? colors.primary : colors.textPrimary,
                      }}
                    >
                      {option.label}
                    </ThemedText>
                    {isActive && (
                      <HugeiconsIcon
                        icon={Tick01Icon}
                        size={18}
                        color={colors.primary}
                        strokeWidth={2}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export type SelectFieldProps = {
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
}: SelectFieldProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? placeholder ?? "";

  return (
    <>
      <View className="gap-2">
        <ThemedText variant="caption" color="secondary">
          {label}
        </ThemedText>
        <Pressable
          onPress={() => setOpen(true)}
          className="min-h-11 flex-row items-center justify-between rounded-xl border px-3"
          style={{
            borderColor: colors.outline,
            backgroundColor: colors.surface,
            height: 44,
          }}
        >
          <ThemedText
            variant="bodySmall"
            style={{
              fontFamily: "Baloo2-Regular",
              color: value ? colors.textPrimary : colors.textMuted,
            }}
          >
            {selectedLabel}
          </ThemedText>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            color={colors.textMuted}
            strokeWidth={1.75}
          />
        </Pressable>
      </View>

      <SelectModal
        visible={open}
        title={label}
        options={options}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
