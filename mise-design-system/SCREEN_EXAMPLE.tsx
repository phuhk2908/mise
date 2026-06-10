import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Search } from "lucide-react-native";
import { AppText, Button, Chip, Input, useAppTheme } from "./src/design-system";

export function RecipesScreenExample() {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View className="flex-1 px-4 pt-6">
        <AppText variant="h2">Recipes</AppText>
        <AppText variant="body" color="secondary" style={{ marginTop: 4 }}>
          Organized. Scaled. Made Simple.
        </AppText>

        <View className="mt-6">
          <Input placeholder="Search recipes..." />
        </View>

        <View className="mt-4 flex-row gap-2">
          <Chip label="Dinner" selected />
          <Chip label="Quick" />
          <Chip label="Vegetarian" />
        </View>

        <View className="mt-6">
          <Button>Add Recipe</Button>
        </View>
      </View>
    </SafeAreaView>
  );
}
