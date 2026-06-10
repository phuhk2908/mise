import { mutation } from "./_generated/server";

/**
 * Dangerous: permanently deletes all user data.
 * Use for resetting the app or clearing sample data.
 */
export const clearAll = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    // ── Recipes + children ──────────────────────────────────────
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

    // ── Meal plans + planned meals ──────────────────────────────
    const plans = await ctx.db.query("mealPlans").take(100);
    for (const plan of plans) {
      const meals = await ctx.db
        .query("plannedMeals")
        .withIndex("by_plan_id_and_date", (q) => q.eq("planId", plan._id))
        .take(100);
      for (const meal of meals) {
        await ctx.db.delete(meal._id);
      }
      await ctx.db.delete(plan._id);
    }

    // ── Shopping lists + items ──────────────────────────────────
    const lists = await ctx.db.query("shoppingLists").take(50);
    for (const list of lists) {
      const items = await ctx.db
        .query("shoppingItems")
        .withIndex("by_list_id", (q) => q.eq("listId", list._id))
        .take(200);
      for (const item of items) {
        await ctx.db.delete(item._id);
      }
      await ctx.db.delete(list._id);
    }
  },
});
