import { query, mutation, DatabaseWriter } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Types ───────────────────────────────────────────────────────

interface ShoppingItemData {
  id: string;
  listId: string;
  name: string;
  amount?: number;
  unit?: string;
  category: string;
  checked: boolean;
  sourceRecipeIds: string[];
  isCustom: boolean;
}

interface ShoppingListData {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  items: ShoppingItemData[];
}

// ── Helpers ─────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: [
    "lettuce", "tomato", "onion", "garlic", "mushroom", "blueberry",
    "lemon", "shallot", "potato", "carrot", "spinach", "apple",
    "banana", "herb", "parsley", "cilantro", "basil", "ginger",
    "avocado", "pepper", "cucumber", "celery", "broccoli", "cauliflower",
    "zucchini", "eggplant", "corn", "peas", "green bean", "asparagus",
  ],
  dairy: [
    "cheese", "cream", "milk", "buttermilk", "butter", "yogurt",
    "egg", "eggs", "mozzarella", "parmesan", "cheddar", "feta",
    "ricotta", "cream cheese", "sour cream", "whipped cream",
  ],
  meat: [
    "beef", "chicken", "pork", "meat", "fish", "salmon", "shrimp",
    "bacon", "sausage", "turkey", "lamb", "ham", "steak", "ground",
    "tenderloin", "rib", "wing", "breast", "thigh", "drumstick",
  ],
  pantry: [
    "flour", "oil", "seasoning", "broth", "rice", "wine", "tortilla",
    "pasta", "sugar", "salt", "pepper", "vinegar", "soy sauce",
    "honey", "maple syrup", "baking powder", "baking soda", "vanilla",
    "yeast", "cocoa", "chocolate", "nutmeg", "cinnamon", "cumin",
    "oregano", "thyme", "bay leaf", "stock", "noodle", "spaghetti",
    "cereal", "oat", "quinoa", "lentil", "bean", "can", "jar",
  ],
  frozen: [
    "frozen", "ice cream", "pizza", "waffle", "fries",
  ],
  bakery: [
    "bread", "bun", "roll", "baguette", "croissant", "tortilla",
    "pita", "naan", "bagel", "muffin", "cake", "pie crust",
  ],
};

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return "other";
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,.*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim();
}

function mergeShoppingItems(
  items: Omit<ShoppingItemData, "id" | "listId" | "checked">[]
): Omit<ShoppingItemData, "id" | "listId">[] {
  const buckets = new Map<
    string,
    {
      name: string;
      amount: number;
      unit: string;
      category: string;
      sourceRecipeIds: string[];
    }
  >();

  for (const item of items) {
    const normName = normalizeName(item.name);
    const normUnit = normalizeUnit(item.unit ?? "");
    const key = `${normName}::${normUnit}`;

    if (buckets.has(key)) {
      const existing = buckets.get(key)!;
      existing.amount += item.amount ?? 0;
      existing.sourceRecipeIds.push(...item.sourceRecipeIds);
    } else {
      buckets.set(key, {
        name: item.name,
        amount: item.amount ?? 0,
        unit: item.unit ?? "",
        category: item.category,
        sourceRecipeIds: [...item.sourceRecipeIds],
      });
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    name: b.name,
    amount: Math.round(b.amount * 100) / 100,
    unit: b.unit,
    category: b.category,
    sourceRecipeIds: [...new Set(b.sourceRecipeIds)],
    isCustom: false,
    checked: false,
  }));
}

async function buildIngredientsFromRecipes(
  ctx: { db: DatabaseWriter },
  recipeServings: { recipeId: Id<"recipes">; servings: number }[]
): Promise<Omit<ShoppingItemData, "id" | "listId" | "checked">[]> {
  const items: Omit<ShoppingItemData, "id" | "listId" | "checked">[] = [];

  for (const { recipeId, servings } of recipeServings) {
    const recipe = await ctx.db.get("recipes", recipeId);
    if (!recipe) continue;

    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe_id", (q: any) => q.eq("recipeId", recipeId))
      .take(100);

    const ratio = servings / recipe.servings;
    for (const ing of ingredients) {
      const scaledAmount = Math.round(ing.amount * ratio * 8) / 8;
      items.push({
        name: ing.name,
        amount: scaledAmount,
        unit: ing.unit,
        category: ing.category || categorizeIngredient(ing.name),
        sourceRecipeIds: [recipeId],
        isCustom: false,
      });
    }
  }

  return items;
}

async function createListWithItems(
  ctx: { db: DatabaseWriter },
  recipeServings: { recipeId: Id<"recipes">; servings: number }[],
  name: string
): Promise<Id<"shoppingLists">> {
  const rawItems = await buildIngredientsFromRecipes(ctx, recipeServings);
  const merged = mergeShoppingItems(rawItems);

  // Deactivate existing active lists
  const activeLists = await ctx.db
    .query("shoppingLists")
    .withIndex("by_active", (q) => q.eq("isActive", true))
    .take(50);

  for (const list of activeLists) {
    await ctx.db.patch("shoppingLists", list._id, { isActive: false });
  }

  const listId = await ctx.db.insert("shoppingLists", {
    name,
    createdAt: new Date().toISOString(),
    isActive: true,
  });

  for (const item of merged) {
    await ctx.db.insert("shoppingItems", {
      listId,
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      category: item.category,
      checked: false,
      sourceRecipeIds: item.sourceRecipeIds as Id<"recipes">[],
      isCustom: item.isCustom,
    });
  }

  return listId;
}

// ── Queries ─────────────────────────────────────────────────────

export const getActive = query({
  args: {},
  handler: async (ctx): Promise<ShoppingListData | null> => {
    const list = await ctx.db
      .query("shoppingLists")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first();

    if (!list) return null;

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_id", (q) => q.eq("listId", list._id))
      .order("asc")
      .take(200);

    return {
      id: list._id,
      name: list.name,
      createdAt: list.createdAt,
      isActive: list.isActive,
      items: items.map((item: any) => ({
        id: item._id,
        listId: item.listId,
        name: item.name,
        amount: item.amount ?? undefined,
        unit: item.unit ?? undefined,
        category: item.category,
        checked: item.checked,
        sourceRecipeIds: item.sourceRecipeIds,
        isCustom: item.isCustom,
      })),
    };
  },
});

export const getById = query({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args): Promise<ShoppingListData | null> => {
    const list = await ctx.db.get("shoppingLists", args.id);
    if (!list) return null;

    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_id", (q) => q.eq("listId", args.id))
      .order("asc")
      .take(200);

    return {
      id: list._id,
      name: list.name,
      createdAt: list.createdAt,
      isActive: list.isActive,
      items: items.map((item: any) => ({
        id: item._id,
        listId: item.listId,
        name: item.name,
        amount: item.amount ?? undefined,
        unit: item.unit ?? undefined,
        category: item.category,
        checked: item.checked,
        sourceRecipeIds: item.sourceRecipeIds,
        isCustom: item.isCustom,
      })),
    };
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx): Promise<ShoppingListData[]> => {
    const lists = await ctx.db
      .query("shoppingLists")
      .order("desc")
      .take(50);

    const result: ShoppingListData[] = [];
    for (const list of lists) {
      const items = await ctx.db
        .query("shoppingItems")
        .withIndex("by_list_id", (q) => q.eq("listId", list._id))
        .order("asc")
        .take(200);

      result.push({
        id: list._id,
        name: list.name,
        createdAt: list.createdAt,
        isActive: list.isActive,
        items: items.map((item: any) => ({
          id: item._id,
          listId: item.listId,
          name: item.name,
          amount: item.amount ?? undefined,
          unit: item.unit ?? undefined,
          category: item.category,
          checked: item.checked,
          sourceRecipeIds: item.sourceRecipeIds,
          isCustom: item.isCustom,
        })),
      });
    }

    return result;
  },
});

// ── Mutations ───────────────────────────────────────────────────

export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args): Promise<Id<"shoppingLists">> => {
    // Deactivate existing active lists
    const activeLists = await ctx.db
      .query("shoppingLists")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .take(50);

    for (const list of activeLists) {
      await ctx.db.patch("shoppingLists", list._id, { isActive: false });
    }

    const id = await ctx.db.insert("shoppingLists", {
      name: args.name,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    return id;
  },
});

export const toggleItem = mutation({
  args: { id: v.id("shoppingItems") },
  handler: async (ctx, args): Promise<void> => {
    const item = await ctx.db.get("shoppingItems", args.id);
    if (!item) throw new Error("Shopping item not found");

    await ctx.db.patch("shoppingItems", args.id, { checked: !item.checked });
  },
});

export const clearChecked = mutation({
  args: { listId: v.id("shoppingLists") },
  handler: async (ctx, args): Promise<void> => {
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_id_and_checked", (q) =>
        q.eq("listId", args.listId).eq("checked", true)
      )
      .take(200);

    for (const item of items) {
      await ctx.db.delete(item._id);
    }
  },
});

export const deleteList = mutation({
  args: { id: v.id("shoppingLists") },
  handler: async (ctx, args): Promise<void> => {
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_list_id", (q) => q.eq("listId", args.id))
      .take(200);

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const addItem = mutation({
  args: {
    listId: v.id("shoppingLists"),
    name: v.string(),
    amount: v.optional(v.number()),
    unit: v.optional(v.string()),
    category: v.string(),
    sourceRecipeIds: v.array(v.id("recipes")),
    isCustom: v.boolean(),
  },
  handler: async (ctx, args): Promise<Id<"shoppingItems">> => {
    return await ctx.db.insert("shoppingItems", {
      listId: args.listId,
      name: args.name,
      amount: args.amount,
      unit: args.unit,
      category: args.category,
      checked: false,
      sourceRecipeIds: args.sourceRecipeIds,
      isCustom: args.isCustom,
    });
  },
});

export const generateFromRecipes = mutation({
  args: {
    recipeServings: v.array(
      v.object({
        recipeId: v.id("recipes"),
        servings: v.number(),
      })
    ),
    name: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"shoppingLists">> => {
    return await createListWithItems(ctx, args.recipeServings, args.name);
  },
});

export const generateFromPlan = mutation({
  args: {
    weekStart: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<Id<"shoppingLists">> => {
    const start = new Date(args.weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const endStr = end.toISOString().split("T")[0];

    const meals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_date", (q: any) => q.gte("date", args.weekStart).lte("date", endStr))
      .take(100);

    const recipeServings = meals.map((m: any) => ({
      recipeId: m.recipeId,
      servings: m.servings,
    }));

    return await createListWithItems(ctx, recipeServings, args.name ?? `Week of ${args.weekStart}`);
  },
});
