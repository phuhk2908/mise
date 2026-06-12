import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  ArrowDown01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";

type PickerModalProps = {
  visible: boolean;
  title: string;
  options: string[];
  selected: string;
  searchPlaceholder: string;
  createLabel: (query: string) => string;
  noResultsLabel: string;
  onSelect: (value: string) => void;
  onClose: () => void;
};

function PickerModal({
  visible,
  title,
  options,
  selected,
  searchPlaceholder,
  createLabel,
  noResultsLabel,
  onSelect,
  onClose,
}: PickerModalProps) {
  const { colors, isDark } = useAppTheme();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [query, options]);

  const isNew =
    query.trim() &&
    !options.some((o) => o.toLowerCase() === query.trim().toLowerCase());

  const handleSelect = (value: string) => {
    onSelect(value.trim());
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
                {title}
              </ThemedText>
              <Pressable onPress={onClose} hitSlop={8}>
                <ThemedText
                  variant="body"
                  style={{ color: colors.primary, fontFamily: "Baloo2-SemiBold" }}
                >
                  Cancel
                </ThemedText>
              </Pressable>
            </View>

            {/* Search */}
            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <View
                className="flex-row items-center rounded-xl border px-3"
                style={{
                  borderColor: colors.outline,
                  backgroundColor: colors.background,
                }}
              >
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder={searchPlaceholder}
                  placeholderTextColor={colors.textMuted}
                  autoFocus
                  className="flex-1 py-2"
                  style={{
                    color: colors.textPrimary,
                    fontFamily: "Baloo2-Regular",
                    fontSize: 14,
                  }}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <HugeiconsIcon
                      icon={Cancel01Icon}
                      size={16}
                      color={colors.textMuted}
                      strokeWidth={1.75}
                    />
                  </Pressable>
                )}
              </View>
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
                    {createLabel(query.trim())}
                  </ThemedText>
                </Pressable>
              )}

              {filtered.length === 0 && !isNew && (
                <View className="px-4 py-4">
                  <ThemedText variant="caption" color="muted">
                    {noResultsLabel}
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

type SelectProps = {
  label?: string;
  placeholder?: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  modalTitle: string;
  searchPlaceholder: string;
  createLabel: (query: string) => string;
  noResultsLabel: string;
};

export function Select({
  label,
  placeholder,
  options,
  value,
  onChange,
  modalTitle,
  searchPlaceholder,
  createLabel,
  noResultsLabel,
}: SelectProps) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <View className="gap-1">
        {label ? (
          <ThemedText variant="caption" color="secondary">
            {label}
          </ThemedText>
        ) : null}
        <Pressable
          onPress={() => setOpen(true)}
          className="min-h-11 flex-row items-center justify-between rounded-xl border px-3"
          style={{
            borderColor: colors.outline,
            backgroundColor: colors.surface,
          }}
        >
          <ThemedText
            variant="bodySmall"
            style={{
              fontFamily: "Baloo2-Regular",
              fontSize: 14,
              color: value ? colors.textPrimary : colors.textMuted,
            }}
          >
            {value || placeholder || "Select..."}
          </ThemedText>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={16}
            color={colors.textMuted}
            strokeWidth={1.75}
          />
        </Pressable>
      </View>

      <PickerModal
        visible={open}
        title={modalTitle}
        options={options}
        selected={value}
        searchPlaceholder={searchPlaceholder}
        createLabel={createLabel}
        noResultsLabel={noResultsLabel}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
