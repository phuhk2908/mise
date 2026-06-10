import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ── Types ───────────────────────────────────────────────────────

interface PlannedMealData {
  id: string;
  planId: string;
  date: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  recipeId: string;
  servings: number;
  notes?: string;
}

interface MealPlanData {
  id: string;
  weekStart: string;
  createdAt: string;
  meals: PlannedMealData[];
}

// ── Queries ─────────────────────────────────────────────────────

export const getByWeekStart = query({
  args: { weekStart: v.string() },
  handler: async (ctx, args): Promise<MealPlanData | null> => {
    const plan = await ctx.db
      .query("mealPlans")
      .withIndex("by_week_start", (q) => q.eq("weekStart", args.weekStart))
      .unique();

    if (!plan) return null;

    const meals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_id_and_date", (q) => q.eq("planId", plan._id))
      .order("asc")
      .take(100);

    return {
      id: plan._id,
      weekStart: plan.weekStart,
      createdAt: plan.createdAt,
      meals: meals.map((m: any) => ({
        id: m._id,
        planId: m.planId,
        date: m.date,
        mealType: m.mealType,
        recipeId: m.recipeId,
        servings: m.servings,
        notes: m.notes ?? undefined,
      })),
    };
  },
});

export const getById = query({
  args: { id: v.id("mealPlans") },
  handler: async (ctx, args): Promise<MealPlanData | null> => {
    const plan = await ctx.db.get("mealPlans", args.id);
    if (!plan) return null;

    const meals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_id_and_date", (q) => q.eq("planId", args.id))
      .order("asc")
      .take(100);

    return {
      id: plan._id,
      weekStart: plan.weekStart,
      createdAt: plan.createdAt,
      meals: meals.map((m: any) => ({
        id: m._id,
        planId: m.planId,
        date: m.date,
        mealType: m.mealType,
        recipeId: m.recipeId,
        servings: m.servings,
        notes: m.notes ?? undefined,
      })),
    };
  },
});

export const getMealsForDateRange = query({
  args: { startDate: v.string(), endDate: v.string() },
  handler: async (ctx, args): Promise<PlannedMealData[]> => {
    const meals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_date", (q) => q.gte("date", args.startDate).lte("date", args.endDate))
      .order("asc")
      .take(100);

    return meals.map((m: any) => ({
      id: m._id,
      planId: m.planId,
      date: m.date,
      mealType: m.mealType,
      recipeId: m.recipeId,
      servings: m.servings,
      notes: m.notes ?? undefined,
    }));
  },
});

// ── Mutations ───────────────────────────────────────────────────

export const getOrCreate = mutation({
  args: { weekStart: v.string() },
  handler: async (ctx, args): Promise<Id<"mealPlans">> => {
    const existing = await ctx.db
      .query("mealPlans")
      .withIndex("by_week_start", (q) => q.eq("weekStart", args.weekStart))
      .unique();

    if (existing) return existing._id;

    const id = await ctx.db.insert("mealPlans", {
      weekStart: args.weekStart,
      createdAt: new Date().toISOString(),
    });

    return id;
  },
});

export const addMeal = mutation({
  args: {
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
  },
  handler: async (ctx, args): Promise<Id<"plannedMeals">> => {
    const plan = await ctx.db.get("mealPlans", args.planId);
    if (!plan) throw new Error("Meal plan not found");

    return await ctx.db.insert("plannedMeals", {
      planId: args.planId,
      date: args.date,
      mealType: args.mealType,
      recipeId: args.recipeId,
      servings: args.servings,
      notes: args.notes,
    });
  },
});

export const removeMeal = mutation({
  args: { id: v.id("plannedMeals") },
  handler: async (ctx, args): Promise<void> => {
    await ctx.db.delete(args.id);
  },
});

export const updateMeal = mutation({
  args: {
    id: v.id("plannedMeals"),
    date: v.optional(v.string()),
    mealType: v.optional(
      v.union(
        v.literal("breakfast"),
        v.literal("lunch"),
        v.literal("dinner"),
        v.literal("snack")
      )
    ),
    recipeId: v.optional(v.id("recipes")),
    servings: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<void> => {
    const existing = await ctx.db.get("plannedMeals", args.id);
    if (!existing) throw new Error("Planned meal not found");

    const patch: any = {};
    if (args.date !== undefined) patch.date = args.date;
    if (args.mealType !== undefined) patch.mealType = args.mealType;
    if (args.recipeId !== undefined) patch.recipeId = args.recipeId;
    if (args.servings !== undefined) patch.servings = args.servings;
    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch("plannedMeals", args.id, patch);
  },
});

export const clearPlan = mutation({
  args: { planId: v.id("mealPlans") },
  handler: async (ctx, args): Promise<void> => {
    const meals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_id_and_date", (q) => q.eq("planId", args.planId))
      .take(100);

    for (const meal of meals) {
      await ctx.db.delete(meal._id);
    }
  },
});

export const duplicatePlan = mutation({
  args: { sourcePlanId: v.id("mealPlans"), targetWeekStart: v.string() },
  handler: async (ctx, args): Promise<Id<"mealPlans">> => {
    const source = await ctx.db.get("mealPlans", args.sourcePlanId);
    if (!source) throw new Error("Source meal plan not found");

    // Check if target plan exists
    let target = await ctx.db
      .query("mealPlans")
      .withIndex("by_week_start", (q) => q.eq("weekStart", args.targetWeekStart))
      .unique();

    if (!target) {
      const targetId = await ctx.db.insert("mealPlans", {
        weekStart: args.targetWeekStart,
        createdAt: new Date().toISOString(),
      });
      target = await ctx.db.get("mealPlans", targetId);
      if (!target) throw new Error("Failed to create target meal plan");
    }

    // Clear existing meals in target
    const existingMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_id_and_date", (q) => q.eq("planId", target!._id))
      .take(100);

    for (const meal of existingMeals) {
      await ctx.db.delete(meal._id);
    }

    // Copy meals from source
    const sourceMeals = await ctx.db
      .query("plannedMeals")
      .withIndex("by_plan_id_and_date", (q) => q.eq("planId", args.sourcePlanId))
      .take(100);

    for (const meal of sourceMeals) {
      await ctx.db.insert("plannedMeals", {
        planId: target._id,
        date: meal.date,
        mealType: meal.mealType,
        recipeId: meal.recipeId,
        servings: meal.servings,
        notes: meal.notes,
      });
    }

    return target._id;
  },
});
