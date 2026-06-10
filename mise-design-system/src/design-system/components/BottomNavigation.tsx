import React from "react";
import { Pressable, View } from "react-native";
import { AppText } from "./AppText";
import { useAppTheme } from "../theme/useAppTheme";

type BottomNavItem = {
  key: string;
  label: string;
  icon: (color: string) => React.ReactNode;
};

type BottomNavigationProps = {
  items: BottomNavItem[];
  activeKey: string;
  onChange: (key: string) => void;
  centerAction?: React.ReactNode;
};

export function BottomNavigation({
  items,
  activeKey,
  onChange,
  centerAction,
}: BottomNavigationProps) {
  const { colors } = useAppTheme();

  return (
    <View
      className="flex-row items-center justify-around rounded-xl border px-3 py-2"
      style={{ backgroundColor: colors.surface, borderColor: colors.outline }}
    >
      {items.map((item) => {
        const active = item.key === activeKey;
        const color = active ? colors.primary : colors.textSecondary;

        return (
          <Pressable
            key={item.key}
            onPress={() => onChange(item.key)}
            className="min-h-11 items-center justify-center gap-1 px-2"
            style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
          >
            {item.icon(color)}
            <AppText
              variant="caption"
              style={{ color, fontFamily: active ? "Baloo2-SemiBold" : "Baloo2-Regular" }}
            >
              {item.label}
            </AppText>
          </Pressable>
        );
      })}

      {centerAction}
    </View>
  );
}
