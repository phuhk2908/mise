import { query, mutation, DatabaseReader } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Types matching the frontend ─────────────────────────────────

interface IngredientData {
  id: string;
  recipeId: string;
  name: string;
  amount: number;
  unit: string;
  originalUnit?: string;
  category?: string;
  optional: boolean;
  notes?: string;
}

interface InstructionData {
  id: string;
  recipeId: string;
  stepNumber: number;
  text: string;
  duration?: number;
  imageUri?: string;
}

interface RecipeData {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime?: string;
  servings: number;
  tags: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
  imageUri?: string;
  notes?: string;
  ingredients: IngredientData[];
  instructions: InstructionData[];
}

// ── Helpers ─────────────────────────────────────────────────────

async function getRecipeWithRelations(
  ctx: { db: DatabaseReader },
  recipeId: Id<"recipes">
): Promise<RecipeData | null> {
  const recipe = await ctx.db.get("recipes", recipeId);
  if (!recipe) return null;

  const ingredients = await ctx.db
    .query("ingredients")
    .withIndex("by_recipe_id", (q) => q.eq("recipeId", recipeId))
    .take(100);

  const instructions = await ctx.db
    .query("instructions")
    .withIndex("by_recipe_id", (q) => q.eq("recipeId", recipeId))
    .order("asc")
    .take(100);

  return {
    id: recipeId,
    title: recipe.title,
    description: recipe.description,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    totalTime: recipe.totalTime ?? undefined,
    servings: recipe.servings,
    tags: recipe.tags,
    source: recipe.source,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
    imageUri: recipe.imageUri ?? undefined,
    notes: recipe.notes ?? undefined,
    ingredients: ingredients.map((ing: any) => ({
      id: ing._id,
      recipeId: recipeId,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      originalUnit: ing.originalUnit ?? undefined,
      category: ing.category ?? undefined,
      optional: ing.optional,
      notes: ing.notes ?? undefined,
    })),
    instructions: instructions.map((inst: any) => ({
      id: inst._id,
      recipeId: recipeId,
      stepNumber: inst.stepNumber,
      text: inst.text,
      duration: inst.duration ?? undefined,
      imageUri: inst.imageUri ?? undefined,
    })),
  };
}

// ── Queries ─────────────────────────────────────────────────────

export const getAll = query({
  args: {},
  handler: async (ctx): Promise<RecipeData[]> => {
    const recipes = await ctx.db
      .query("recipes")
      .withIndex("by_updated_at", (q) => q)
      .order("desc")
      .take(200);

    const result: RecipeData[] = [];
    for (const recipe of recipes) {
      const withRelations = await getRecipeWithRelations(ctx, recipe._id);
      if (withRelations) result.push(withRelations);
    }
    return result;
  },
});

export const getById = query({
  args: { id: v.id("recipes") },
  handler: async (ctx, args): Promise<RecipeData | null> => {
    return getRecipeWithRelations(ctx, args.id);
  },
});

export const getTags = query({
  args: {},
  handler: async (ctx): Promise<string[]> => {
    const recipes = await ctx.db
      .query("recipes")
      .take(200);

    const tagSet = new Set<string>();
    for (const recipe of recipes) {
      for (const tag of recipe.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  },
});

// ── Mutations ─────────────────────────────────────────────────────

export const create = mutation({
  args: {
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
    ingredients: v.array(
      v.object({
        name: v.string(),
        amount: v.number(),
        unit: v.string(),
        originalUnit: v.optional(v.string()),
        category: v.optional(v.string()),
        optional: v.boolean(),
        notes: v.optional(v.string()),
      })
    ),
    instructions: v.array(
      v.object({
        stepNumber: v.number(),
        text: v.string(),
        duration: v.optional(v.number()),
        imageUri: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args): Promise<Id<"recipes">> => {
    const now = new Date().toISOString();

    const recipeId = await ctx.db.insert("recipes", {
      title: args.title,
      description: args.description,
      prepTime: args.prepTime,
      cookTime: args.cookTime,
      totalTime: args.totalTime,
      servings: args.servings,
      tags: args.tags,
      source: args.source,
      imageUri: args.imageUri,
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    for (const ing of args.ingredients) {
      await ctx.db.insert("ingredients", {
        recipeId,
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        originalUnit: ing.originalUnit,
        category: ing.category,
        optional: ing.optional,
        notes: ing.notes,
      });
    }

    for (const inst of args.instructions) {
      await ctx.db.insert("instructions", {
        recipeId,
        stepNumber: inst.stepNumber,
        text: inst.text,
        duration: inst.duration,
        imageUri: inst.imageUri,
      });
    }

    return recipeId;
  },
});

export const update = mutation({
  args: {
    id: v.id("recipes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    prepTime: v.optional(v.string()),
    cookTime: v.optional(v.string()),
    totalTime: v.optional(v.string()),
    servings: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    source: v.optional(v.string()),
    imageUri: v.optional(v.string()),
    notes: v.optional(v.string()),
    ingredients: v.optional(
      v.array(
        v.object({
          name: v.string(),
          amount: v.number(),
          unit: v.string(),
          originalUnit: v.optional(v.string()),
          category: v.optional(v.string()),
          optional: v.boolean(),
          notes: v.optional(v.string()),
        })
      )
    ),
    instructions: v.optional(
      v.array(
        v.object({
          stepNumber: v.number(),
          text: v.string(),
          duration: v.optional(v.number()),
          imageUri: v.optional(v.string()),
        })
      )
    ),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db.get("recipes", args.id);
    if (!existing) throw new Error("Recipe not found");

    const patch: any = { updatedAt: new Date().toISOString() };
    if (args.title !== undefined) patch.title = args.title;
    if (args.description !== undefined) patch.description = args.description;
    if (args.prepTime !== undefined) patch.prepTime = args.prepTime;
    if (args.cookTime !== undefined) patch.cookTime = args.cookTime;
    if (args.totalTime !== undefined) patch.totalTime = args.totalTime;
    if (args.servings !== undefined) patch.servings = args.servings;
    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.source !== undefined) patch.source = args.source;
    if (args.imageUri !== undefined) patch.imageUri = args.imageUri;
    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch("recipes", args.id, patch);

    if (args.ingredients) {
      // Delete existing ingredients
      const existingIngs = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe_id", (q) => q.eq("recipeId", args.id))
        .take(100);
      for (const ing of existingIngs) {
        await ctx.db.delete(ing._id);
      }
      // Insert new ingredients
      for (const ing of args.ingredients) {
        await ctx.db.insert("ingredients", {
          recipeId: args.id,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          originalUnit: ing.originalUnit,
          category: ing.category,
          optional: ing.optional,
          notes: ing.notes,
        });
      }
    }

    if (args.instructions) {
      // Delete existing instructions
      const existingInsts = await ctx.db
        .query("instructions")
        .withIndex("by_recipe_id", (q) => q.eq("recipeId", args.id))
        .take(100);
      for (const inst of existingInsts) {
        await ctx.db.delete(inst._id);
      }
      // Insert new instructions
      for (const inst of args.instructions) {
        await ctx.db.insert("instructions", {
          recipeId: args.id,
          stepNumber: inst.stepNumber,
          text: inst.text,
          duration: inst.duration,
          imageUri: inst.imageUri,
        });
      }
    }
  },
});

export const deleteRecipe = mutation({
  args: { id: v.id("recipes") },
  handler: async (ctx, args): Promise<void> => {
    const recipe = await ctx.db.get("recipes", args.id);
    if (!recipe) throw new Error("Recipe not found");

    // Delete ingredients
    const ingredients = await ctx.db
      .query("ingredients")
      .withIndex("by_recipe_id", (q) => q.eq("recipeId", args.id))
      .take(100);
    for (const ing of ingredients) {
      await ctx.db.delete(ing._id);
    }

    // Delete instructions
    const instructions = await ctx.db
      .query("instructions")
      .withIndex("by_recipe_id", (q) => q.eq("recipeId", args.id))
      .take(100);
    for (const inst of instructions) {
      await ctx.db.delete(inst._id);
    }

    // Delete recipe
    await ctx.db.delete(args.id);
  },
});

export const deleteAll = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const recipes = await ctx.db.query("recipes").take(200);
    for (const recipe of recipes) {
      const ingredients = await ctx.db
        .query("ingredients")
        .withIndex("by_recipe_id", (q) => q.eq("recipeId", recipe._id))
        .take(100);
      for (const ing of ingredients) {
        await ctx.db.delete(ing._id);
      }

      const instructions = await ctx.db
        .query("instructions")
        .withIndex("by_recipe_id", (q) => q.eq("recipeId", recipe._id))
        .take(100);
      for (const inst of instructions) {
        await ctx.db.delete(inst._id);
      }

      await ctx.db.delete(recipe._id);
    }
  },
});
