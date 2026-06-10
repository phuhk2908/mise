import React, { useState } from "react";
import { Pressable, View, TextInput } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { PencilEdit02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { UnitSelect } from "./UnitSelect";
import { ThemedText } from "./ThemedText";
import { useAppTheme } from "../theme/useAppTheme";
import { decimalToFraction } from "../../utils/fraction";
import { iconSize, iconStrokeWidth } from "../tokens/iconography";

export interface IngredientData {
  id: string;
  amount: number;
  unit: string;
  name: string;
}

type IngredientItemProps = {
  ingredient: IngredientData;
  onUpdate?: (updated: IngredientData) => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
};

export function IngredientItem({
  ingredient,
  onUpdate,
  onDelete,
  isEditable = true,
}: IngredientItemProps) {
  const { colors } = useAppTheme();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ingredient);

  const handleSave = () => {
    onUpdate?.(draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(ingredient);
    setEditing(false);
  };

  if (editing) {
    return (
      <View
        className="flex-row items-center gap-2 rounded-xl border px-3 py-2"
        style={{ backgroundColor: colors.surface, borderColor: colors.primary }}
      >
        <TextInput
          className="flex-1 rounded-xl border px-2 py-1"
          style={{
            borderColor: colors.outline,
            color: colors.textPrimary,
            fontFamily: "Baloo2-Regular",
            fontSize: 14,
            backgroundColor: colors.surface,
          }}
          value={draft.name}
          onChangeText={(text) => setDraft((d) => ({ ...d, name: text }))}
        />
        <TextInput
          className="w-14 rounded-xl border px-1 py-1 text-center"
          style={{
            borderColor: colors.outline,
            color: colors.textPrimary,
            fontFamily: "Baloo2-Regular",
            fontSize: 14,
            backgroundColor: colors.surface,
          }}
          value={String(draft.amount)}
          keyboardType="decimal-pad"
          onChangeText={(text) => {
            const num = parseFloat(text);
            setDraft((d) => ({ ...d, amount: isNaN(num) ? 0 : num }));
          }}
        />
        <UnitSelect
          value={draft.unit}
          onChange={(unit) => setDraft((d) => ({ ...d, unit }))}
          inputStyle={{ width: 72 }}
        />

        <Pressable onPress={handleSave} className="h-8 w-8 items-center justify-center">
          <ThemedText variant="bodySmall" style={{ color: colors.success, fontFamily: "Baloo2-SemiBold" }}>
            ✓
          </ThemedText>
        </Pressable>
        <Pressable onPress={handleCancel} className="h-8 w-8 items-center justify-center">
          <ThemedText variant="bodySmall" style={{ color: colors.error, fontFamily: "Baloo2-SemiBold" }}>
            ✕
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-3 py-2">
      <ThemedText variant="bodySmall" style={{ flex: 1 }}>
        {ingredient.name}
      </ThemedText>

      <View className="w-12">
        <ThemedText variant="bodySmall" style={{ fontFamily: "Baloo2-SemiBold" }}>
          {decimalToFraction(ingredient.amount)}
        </ThemedText>
      </View>

      <View className="w-16">
        <ThemedText variant="bodySmall" color="secondary">
          {ingredient.unit}
        </ThemedText>
      </View>

      {isEditable ? (
        <View className="flex-row items-center gap-1">
          <Pressable
            onPress={() => setEditing(true)}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <HugeiconsIcon
              icon={PencilEdit02Icon}
              size={iconSize.sm}
              color={colors.textMuted}
              strokeWidth={iconStrokeWidth.regular}
            />
          </Pressable>
          <Pressable
            onPress={() => onDelete?.(ingredient.id)}
            className="h-8 w-8 items-center justify-center rounded-full"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={iconSize.sm}
              color={colors.error}
              strokeWidth={iconStrokeWidth.regular}
            />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
