import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { useTranslation } from "react-i18next";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

const COMMON_UNITS = [
  "cups",
  "tbsp",
  "tsp",
  "oz",
  "lb",
  "g",
  "kg",
  "ml",
  "l",
  "pinch",
  "cloves",
  "packet",
  "large",
  "medium",
  "small",
  "whole",
  "slice",
  "bunch",
  "can",
  "bottle",
  "jar",
  "piece",
  "leaf",
  "sprig",
  "head",
  "stalk",
  "fillet",
  "strip",
  "cube",
  "drop",
  "dash",
  "inch",
  "cm",
  "quart",
  "pint",
  "gallon",
  "gram",
  "kilogram",
  "liter",
  "milliliter",
];

type UnitPickerModalProps = {
  visible: boolean;
  selected: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function UnitPickerModal({ visible, selected, onSelect, onClose }: UnitPickerModalProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useAppTheme();
  const [query, setQuery] = useState(selected);
  const [customOptions, setCustomOptions] = useState<string[]>([]);

  const allOptions = useMemo(() => {
    const combined = [...customOptions, ...COMMON_UNITS];
    // dedupe case-insensitively keeping first occurrence
    const seen = new Set<string>();
    return combined.filter((u) => {
      const key = u.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allOptions;
    return allOptions.filter((u) => u.toLowerCase().includes(q));
  }, [query, allOptions]);

  const isNew = query.trim() && !allOptions.some((u) => u.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (unit: string) => {
    const trimmed = unit.trim();
    if (
      trimmed &&
      !allOptions.some((u) => u.toLowerCase() === trimmed.toLowerCase())
    ) {
      setCustomOptions((prev) => [trimmed, ...prev]);
    }
    onSelect(trimmed);
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
              maxHeight: 420,
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
                {t("unitSelect.title")}
              </ThemedText>
              <Pressable onPress={onClose} hitSlop={8}>
                <ThemedText
                  variant="body"
                  style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                >
                  {t("unitSelect.cancel")}
                </ThemedText>
              </Pressable>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={t("unitSelect.searchPlaceholder")}
                placeholderTextColor={colors.textMuted}
                autoFocus
                className="rounded-xl border px-3 py-2"
                style={{
                  borderColor: colors.outline,
                  color: colors.textPrimary,
                  fontFamily: "Baloo2-Regular",
                  fontSize: 14,
                  backgroundColor: colors.background,
                }}
              />
            </View>

            {/* Options */}
            <ScrollView
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 280 }}
            >
              {filtered.map((item, index) => (
                <Pressable
                  key={`${item}-${index}`}
                  onPress={() => handleSelect(item)}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.neutral100 ?? colors.outline
                      : selected.toLowerCase() === item.toLowerCase()
                      ? colors.primary + "14"
                      : colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  })}
                >
                  <ThemedText
                    variant="bodySmall"
                    style={{
                      fontFamily:
                        selected.toLowerCase() === item.toLowerCase()
                          ? "Baloo2-SemiBold"
                          : "Baloo2-Regular",
                      color:
                        selected.toLowerCase() === item.toLowerCase()
                          ? colors.primary
                          : colors.textPrimary,
                    }}
                  >
                    {item}
                  </ThemedText>
                </Pressable>
              ))}

              {isNew && (
                <Pressable
                  onPress={() => handleSelect(query.trim())}
                  style={({ pressed }) => ({
                    backgroundColor: pressed
                      ? colors.neutral100 ?? colors.outline
                      : colors.primary + "14",
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                  })}
                >
                  <ThemedText
                    variant="bodySmall"
                    style={{
                      fontFamily: "Baloo2-SemiBold",
                      color: colors.primary,
                    }}
                  >
                    {t("unitSelect.create", { unit: query.trim() })}
                  </ThemedText>
                </Pressable>
              )}

              {filtered.length === 0 && !isNew && (
                <View className="px-4 py-4">
                  <ThemedText variant="caption" color="muted">
                    {t("unitSelect.noResults")}
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

type UnitSelectProps = {
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  placeholder?: string;
};

export function UnitSelect({
  value,
  onChange,
  style,
  inputStyle,
  placeholder,
}: UnitSelectProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const resolvedPlaceholder = placeholder ?? t("unitSelect.placeholder");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="rounded-lg border px-2 py-1 items-center justify-center"
        style={[
          {
            borderColor: colors.outline,
            backgroundColor: colors.surface,
            minHeight: 32,
          },
          style,
        ]}
      >
        <ThemedText
          variant="bodySmall"
          style={[
            {
              fontFamily: "Baloo2-Regular",
              fontSize: 14,
              color: value ? colors.textPrimary : colors.textMuted,
            },
            inputStyle,
          ]}
        >
          {value || resolvedPlaceholder}
        </ThemedText>
      </Pressable>

      <UnitPickerModal
        visible={open}
        selected={value}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
