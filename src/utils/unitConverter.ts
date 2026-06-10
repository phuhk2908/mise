export type UnitCategory = "volume" | "weight" | "count" | "length";

export interface UnitDefinition {
  name: string;
  aliases: string[];
  category: UnitCategory;
  toBase: number; // multiplier to convert to base unit (ml for volume, g for weight)
}

const VOLUME_UNITS: UnitDefinition[] = [
  { name: "tsp", aliases: ["teaspoon", "teaspoons", "tsp.", "tspn"], category: "volume", toBase: 4.929 },
  { name: "tbsp", aliases: ["tablespoon", "tablespoons", "tbsp.", "tbs"], category: "volume", toBase: 14.787 },
  { name: "fl oz", aliases: ["fluid ounce", "fluid ounces", "fl. oz"], category: "volume", toBase: 29.574 },
  { name: "cup", aliases: ["cups", "c."], category: "volume", toBase: 236.588 },
  { name: "pt", aliases: ["pint", "pints"], category: "volume", toBase: 473.176 },
  { name: "qt", aliases: ["quart", "quarts"], category: "volume", toBase: 946.353 },
  { name: "gal", aliases: ["gallon", "gallons"], category: "volume", toBase: 3785.41 },
  { name: "ml", aliases: ["milliliter", "milliliters", "millilitre"], category: "volume", toBase: 1 },
  { name: "l", aliases: ["liter", "liters", "litre", "litres"], category: "volume", toBase: 1000 },
];

const WEIGHT_UNITS: UnitDefinition[] = [
  { name: "g", aliases: ["gram", "grams", "gramme"], category: "weight", toBase: 1 },
  { name: "kg", aliases: ["kilogram", "kilograms", "kilogramme"], category: "weight", toBase: 1000 },
  { name: "oz", aliases: ["ounce", "ounces"], category: "weight", toBase: 28.35 },
  { name: "lb", aliases: ["pound", "pounds", "lbs"], category: "weight", toBase: 453.59 },
];

const COUNT_UNITS: UnitDefinition[] = [
  { name: "pc", aliases: ["piece", "pieces"], category: "count", toBase: 1 },
  { name: "each", aliases: ["ea"], category: "count", toBase: 1 },
  { name: "can", aliases: ["cans"], category: "count", toBase: 1 },
  { name: "bottle", aliases: ["bottles"], category: "count", toBase: 1 },
  { name: "package", aliases: ["pkg", "packages", "packet", "packets"], category: "count", toBase: 1 },
  { name: "bag", aliases: ["bags"], category: "count", toBase: 1 },
  { name: "bunch", aliases: ["bunches"], category: "count", toBase: 1 },
  { name: "clove", aliases: ["cloves"], category: "count", toBase: 1 },
  { name: "slice", aliases: ["slices"], category: "count", toBase: 1 },
  { name: "sprig", aliases: ["sprigs"], category: "count", toBase: 1 },
];

const ALL_UNITS = [...VOLUME_UNITS, ...WEIGHT_UNITS, ...COUNT_UNITS];

export function normalizeUnit(unit: string): string {
  const lower = unit.toLowerCase().trim();
  for (const def of ALL_UNITS) {
    if (def.name === lower || def.aliases.includes(lower)) {
      return def.name;
    }
  }
  return lower;
}

export function getUnitCategory(unit: string): UnitCategory | null {
  const normalized = normalizeUnit(unit);
  const def = ALL_UNITS.find((u) => u.name === normalized);
  return def?.category ?? null;
}

/**
 * Simplify an ingredient amount by converting to the most appropriate unit.
 * e.g., 3 tsp → 1 tbsp, 16 tbsp → 1 cup
 */
export function simplifyUnit(
  amount: number,
  unit: string
): { amount: number; unit: string } {
  const normalized = normalizeUnit(unit);
  const def = ALL_UNITS.find((u) => u.name === normalized);
  if (!def) return { amount, unit: normalized };

  const baseAmount = amount * def.toBase;

  // Only simplify within the same category
  const sameCategory = ALL_UNITS.filter((u) => u.category === def.category);

  // Sort by base value descending to prefer larger units
  const sorted = sameCategory.sort((a, b) => b.toBase - a.toBase);

  for (const target of sorted) {
    const converted = baseAmount / target.toBase;
    // Prefer units where the converted amount is >= 1 and reasonably round
    if (converted >= 1 && converted < 100) {
      // Check if it's close to a clean fraction
      const rounded = Math.round(converted * 4) / 4;
      if (Math.abs(converted - rounded) < 0.01 && rounded >= 0.25) {
        return { amount: rounded, unit: target.name };
      }
    }
  }

  return { amount, unit: normalized };
}

/**
 * Scale an ingredient amount by a ratio (e.g., 2x servings).
 */
export function scaleAmount(amount: number, ratio: number): number {
  const scaled = amount * ratio;
  // Round to nearest 1/8 for clean fractions
  return Math.round(scaled * 8) / 8;
}
