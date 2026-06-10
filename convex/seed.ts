import { mutation } from "./_generated/server";
import { v } from "convex/values";

const MOCK_RECIPES = [
  {
    title: "Classic Beef Tacos",
    description: "A family favorite with seasoned ground beef, fresh toppings, and warm tortillas.",
    prepTime: "15 min",
    cookTime: "20 min",
    servings: 4,
    tags: ["Dinner", "Quick", "Mexican"],
    source: "manual",
    ingredients: [
      { name: "ground beef", amount: 1, unit: "lb", category: "meat", optional: false },
      { name: "taco seasoning packet", amount: 1, unit: "packet", category: "pantry", optional: false },
      { name: "small flour tortillas", amount: 8, unit: "", category: "bakery", optional: false },
      { name: "shredded lettuce", amount: 2, unit: "cups", category: "produce", optional: false },
      { name: "shredded cheddar cheese", amount: 1, unit: "cup", category: "dairy", optional: false },
      { name: "tomato, diced", amount: 1, unit: "medium", category: "produce", optional: false },
      { name: "sour cream", amount: 0.5, unit: "cup", category: "dairy", optional: false },
      { name: "red onion, sliced", amount: 1, unit: "small", category: "produce", optional: false },
    ],
    instructions: [
      { stepNumber: 1, text: "Brown the ground beef in a skillet over medium-high heat, breaking it apart as it cooks." },
      { stepNumber: 2, text: "Drain excess fat and stir in the taco seasoning with 2/3 cup water. Simmer for 5 minutes." },
      { stepNumber: 3, text: "Warm tortillas in a dry skillet or microwave wrapped in a damp towel." },
      { stepNumber: 4, text: "Assemble tacos with beef, lettuce, cheese, tomato, onion, and a dollop of sour cream." },
    ],
  },
  {
    title: "Creamy Mushroom Risotto",
    description: "Rich, creamy Arborio rice cooked slowly with white wine and parmesan.",
    prepTime: "10 min",
    cookTime: "35 min",
    servings: 4,
    tags: ["Dinner", "Vegetarian", "Italian"],
    source: "manual",
    ingredients: [
      { name: "Arborio rice", amount: 1.5, unit: "cups", category: "pantry", optional: false },
      { name: "vegetable broth, warm", amount: 4, unit: "cups", category: "pantry", optional: false },
      { name: "white wine", amount: 1, unit: "cup", category: "pantry", optional: false },
      { name: "cremini mushrooms, sliced", amount: 8, unit: "oz", category: "produce", optional: false },
      { name: "Parmesan cheese, grated", amount: 0.5, unit: "cup", category: "dairy", optional: false },
      { name: "shallot, minced", amount: 1, unit: "medium", category: "produce", optional: false },
      { name: "unsalted butter", amount: 3, unit: "tbsp", category: "dairy", optional: false },
      { name: "olive oil", amount: 2, unit: "tbsp", category: "pantry", optional: false },
    ],
    instructions: [
      { stepNumber: 1, text: "Sauté mushrooms in 1 tbsp butter until browned, then remove and set aside." },
      { stepNumber: 2, text: "In the same pot, sauté shallot in olive oil until translucent." },
      { stepNumber: 3, text: "Add rice and toast for 2 minutes until edges are translucent." },
      { stepNumber: 4, text: "Deglaze with white wine and stir until fully absorbed." },
      { stepNumber: 5, text: "Add warm broth one ladle at a time, stirring constantly until absorbed before adding more." },
      { stepNumber: 6, text: "When rice is al dente, stir in remaining butter, Parmesan, and mushrooms. Rest 2 minutes." },
    ],
  },
  {
    title: "Lemon Herb Grilled Chicken",
    description: "Bright, zesty marinated chicken thighs with garlic and fresh herbs.",
    prepTime: "10 min",
    cookTime: "18 min",
    servings: 4,
    tags: ["Dinner", "Quick", "Healthy"],
    source: "manual",
    ingredients: [
      { name: "chicken thighs, boneless", amount: 2, unit: "lb", category: "meat", optional: false },
      { name: "lemon juice", amount: 3, unit: "tbsp", category: "produce", optional: false },
      { name: "olive oil", amount: 2, unit: "tbsp", category: "pantry", optional: false },
      { name: "garlic, minced", amount: 3, unit: "cloves", category: "produce", optional: false },
      { name: "fresh rosemary, chopped", amount: 1, unit: "tbsp", category: "produce", optional: false },
      { name: "kosher salt", amount: 1, unit: "tsp", category: "pantry", optional: false },
      { name: "black pepper", amount: 0.5, unit: "tsp", category: "pantry", optional: false },
      { name: "lemon, sliced for garnish", amount: 1, unit: "", category: "produce", optional: true },
    ],
    instructions: [
      { stepNumber: 1, text: "Whisk lemon juice, olive oil, garlic, rosemary, salt, and pepper in a bowl." },
      { stepNumber: 2, text: "Add chicken and coat thoroughly. Marinate at room temperature for 15 minutes (or overnight in fridge)." },
      { stepNumber: 3, text: "Preheat grill or grill pan to medium-high. Brush grates with oil." },
      { stepNumber: 4, text: "Grill chicken 6–7 minutes per side until internal temperature reaches 165°F (74°C)." },
      { stepNumber: 5, text: "Rest for 3 minutes, then serve with lemon slices." },
    ],
  },
  {
    title: "Blueberry Pancakes",
    description: "Fluffy buttermilk pancakes studded with fresh blueberries.",
    prepTime: "10 min",
    cookTime: "15 min",
    servings: 3,
    tags: ["Breakfast", "Quick", "Vegetarian"],
    source: "manual",
    ingredients: [
      { name: "all-purpose flour", amount: 1.5, unit: "cups", category: "pantry", optional: false },
      { name: "buttermilk", amount: 1.5, unit: "cups", category: "dairy", optional: false },
      { name: "egg", amount: 1, unit: "large", category: "dairy", optional: false },
      { name: "melted butter", amount: 3, unit: "tbsp", category: "dairy", optional: false },
      { name: "baking powder", amount: 2, unit: "tsp", category: "pantry", optional: false },
      { name: "baking soda", amount: 0.5, unit: "tsp", category: "pantry", optional: false },
      { name: "fresh blueberries", amount: 1, unit: "cup", category: "produce", optional: false },
      { name: "salt", amount: 1, unit: "pinch", category: "pantry", optional: false },
    ],
    instructions: [
      { stepNumber: 1, text: "Whisk flour, baking powder, baking soda, and salt in a large bowl." },
      { stepNumber: 2, text: "In a separate bowl, whisk buttermilk, egg, and melted butter." },
      { stepNumber: 3, text: "Pour wet ingredients into dry and stir until just combined (lumps are okay)." },
      { stepNumber: 4, text: "Gently fold in blueberries." },
      { stepNumber: 5, text: "Cook on a greased griddle over medium heat, flipping when bubbles form on the surface." },
    ],
  },
];

export const seedRecipes = mutation({
  args: {},
  handler: async (ctx): Promise<void> => {
    const existing = await ctx.db.query("recipes").take(1);
    if (existing.length > 0) return;

    const now = new Date().toISOString();

    for (const recipe of MOCK_RECIPES) {
      const recipeId = await ctx.db.insert("recipes", {
        title: recipe.title,
        description: recipe.description,
        prepTime: recipe.prepTime,
        cookTime: recipe.cookTime,
        servings: recipe.servings,
        tags: recipe.tags,
        source: recipe.source,
        createdAt: now,
        updatedAt: now,
      });

      for (const ing of recipe.ingredients) {
        await ctx.db.insert("ingredients", {
          recipeId,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          category: ing.category,
          optional: ing.optional,
        });
      }

      for (const inst of recipe.instructions) {
        await ctx.db.insert("instructions", {
          recipeId,
          stepNumber: inst.stepNumber,
          text: inst.text,
        });
      }
    }
  },
});
