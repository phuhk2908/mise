import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  recipes: defineTable({
    title: v.string(),
    description: v.string(),
    prepTime: v.string(),
    cookTime: v.string(),
    totalTime: v.optional(v.string()),
    servings: v.number(),
    tags: v.array(v.string()),
    source: v.string(),
    imageUri: v.optional(v.string()),
    notes: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_updated_at", ["updatedAt"]),

  ingredients: defineTable({
    recipeId: v.id("recipes"),
    name: v.string(),
    amount: v.number(),
    unit: v.string(),
    originalUnit: v.optional(v.string()),
    category: v.optional(v.string()),
    optional: v.boolean(),
    notes: v.optional(v.string()),
  })
    .index("by_recipe_id", ["recipeId"]),

  instructions: defineTable({
    recipeId: v.id("recipes"),
    stepNumber: v.number(),
    text: v.string(),
    duration: v.optional(v.number()),
    imageUri: v.optional(v.string()),
  })
    .index("by_recipe_id", ["recipeId"]),

  mealPlans: defineTable({
    weekStart: v.string(),
    createdAt: v.string(),
  })
    .index("by_week_start", ["weekStart"]),

  plannedMeals: defineTable({
    planId: v.id("mealPlans"),
    date: v.string(),
    mealType: v.union(
      v.literal("breakfast"),
      v.literal("lunch"),
      v.literal("dinner"),
      v.literal("snack")
    ),
    recipeId: v.id("recipes"),
    servings: v.number(),
    notes: v.optional(v.string()),
  })
    .index("by_plan_id_and_date", ["planId", "date"])
    .index("by_date", ["date"]),

  shoppingLists: defineTable({
    name: v.string(),
    createdAt: v.string(),
    isActive: v.boolean(),
  })
    .index("by_active", ["isActive"]),

  shoppingItems: defineTable({
    listId: v.id("shoppingLists"),
    name: v.string(),
    amount: v.optional(v.number()),
    unit: v.optional(v.string()),
    category: v.string(),
    checked: v.boolean(),
    sourceRecipeIds: v.array(v.id("recipes")),
    isCustom: v.boolean(),
  })
    .index("by_list_id", ["listId"])
    .index("by_list_id_and_checked", ["listId", "checked"]),
});
