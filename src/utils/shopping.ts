import { normalizeUnit } from "./unitConverter";

export interface ShoppingIngredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
}

const CATEGORY_MAP: Record<string, string> = {
  produce: "Produce",
  dairy: "Dairy & Eggs",
  pantry: "Pantry",
  meat: "Meat & Seafood",
  frozen: "Frozen",
  bakery: "Bakery",
  other: "Other",
};

export function getCategoryLabel(key: string): string {
  return CATEGORY_MAP[key] ?? "Other";
}

/**
 * Group ingredients by their category.
 */
export function groupByCategory(
  ingredients: ShoppingIngredient[]
): Record<string, ShoppingIngredient[]> {
  const groups: Record<string, ShoppingIngredient[]> = {};

  for (const item of ingredients) {
    const label = getCategoryLabel(item.category);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }

  // Sort categories in a sensible order
  const order = ["Produce", "Dairy & Eggs", "Meat & Seafood", "Pantry", "Frozen", "Bakery", "Other"];
  const sorted: Record<string, ShoppingIngredient[]> = {};
  for (const cat of order) {
    if (groups[cat]) sorted[cat] = groups[cat];
  }
  // Add any remaining categories not in the order list
  for (const cat of Object.keys(groups)) {
    if (!sorted[cat]) sorted[cat] = groups[cat];
  }

  return sorted;
}

/**
 * Merge ingredients with the same name and compatible units.
 * e.g., "2 cups flour" + "1 cup flour" → "3 cups flour"
 */
export function mergeIngredients(
  ingredients: ShoppingIngredient[]
): ShoppingIngredient[] {
  const merged: Record<
    string,
    { amount: number; unit: string; category: string; items: ShoppingIngredient[] }
  > = {};

  for (const item of ingredients) {
    const normUnit = normalizeUnit(item.unit);
    const normName = item.name.toLowerCase().trim();
    const key = `${normName}__${normUnit}`;

    if (merged[key]) {
      merged[key].amount += item.amount;
      merged[key].items.push(item);
    } else {
      merged[key] = {
        amount: item.amount,
        unit: normUnit,
        category: item.category,
        items: [item],
      };
    }
  }

  return Object.entries(merged).map(([key, data]) => ({
    id: key,
    name: data.items[0].name,
    amount: Math.round(data.amount * 100) / 100,
    unit: data.unit,
    category: data.category,
    checked: false,
  }));
}

/**
 * Generate a shopping list from recipe ingredients.
 */
export function generateShoppingList(
  allIngredients: ShoppingIngredient[]
): Record<string, ShoppingIngredient[]> {
  const merged = mergeIngredients(allIngredients);
  return groupByCategory(merged);
}
