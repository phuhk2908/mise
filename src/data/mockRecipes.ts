import type { Recipe, Ingredient, Instruction } from "../types";

export { Recipe };

export const mockRecipes: Recipe[] = [
  {
    id: "1",
    title: "Classic Beef Tacos",
    description: "A family favorite with seasoned ground beef, fresh toppings, and warm tortillas.",
    prepTime: "15 min",
    cookTime: "20 min",
    servings: 4,
    tags: ["Dinner", "Quick", "Mexican"],
    source: "manual",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    ingredients: [
      { id: "1-1", recipeId: "1", name: "ground beef", amount: 1, unit: "lb", category: "meat", optional: false },
      { id: "1-2", recipeId: "1", name: "taco seasoning packet", amount: 1, unit: "packet", category: "pantry", optional: false },
      { id: "1-3", recipeId: "1", name: "small flour tortillas", amount: 8, unit: "", category: "bakery", optional: false },
      { id: "1-4", recipeId: "1", name: "shredded lettuce", amount: 2, unit: "cups", category: "produce", optional: false },
      { id: "1-5", recipeId: "1", name: "shredded cheddar cheese", amount: 1, unit: "cup", category: "dairy", optional: false },
      { id: "1-6", recipeId: "1", name: "tomato, diced", amount: 1, unit: "medium", category: "produce", optional: false },
      { id: "1-7", recipeId: "1", name: "sour cream", amount: 0.5, unit: "cup", category: "dairy", optional: false },
      { id: "1-8", recipeId: "1", name: "red onion, sliced", amount: 1, unit: "small", category: "produce", optional: false },
    ],
    instructions: [
      { id: "1-s1", recipeId: "1", stepNumber: 1, text: "Brown the ground beef in a skillet over medium-high heat, breaking it apart as it cooks." },
      { id: "1-s2", recipeId: "1", stepNumber: 2, text: "Drain excess fat and stir in the taco seasoning with 2/3 cup water. Simmer for 5 minutes." },
      { id: "1-s3", recipeId: "1", stepNumber: 3, text: "Warm tortillas in a dry skillet or microwave wrapped in a damp towel." },
      { id: "1-s4", recipeId: "1", stepNumber: 4, text: "Assemble tacos with beef, lettuce, cheese, tomato, onion, and a dollop of sour cream." },
    ],
  },
  {
    id: "2",
    title: "Creamy Mushroom Risotto",
    description: "Rich, creamy Arborio rice cooked slowly with white wine and parmesan.",
    prepTime: "10 min",
    cookTime: "35 min",
    servings: 4,
    tags: ["Dinner", "Vegetarian", "Italian"],
    source: "manual",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    ingredients: [
      { id: "2-1", recipeId: "2", name: "Arborio rice", amount: 1.5, unit: "cups", category: "pantry", optional: false },
      { id: "2-2", recipeId: "2", name: "vegetable broth, warm", amount: 4, unit: "cups", category: "pantry", optional: false },
      { id: "2-3", recipeId: "2", name: "white wine", amount: 1, unit: "cup", category: "pantry", optional: false },
      { id: "2-4", recipeId: "2", name: "cremini mushrooms, sliced", amount: 8, unit: "oz", category: "produce", optional: false },
      { id: "2-5", recipeId: "2", name: "Parmesan cheese, grated", amount: 0.5, unit: "cup", category: "dairy", optional: false },
      { id: "2-6", recipeId: "2", name: "shallot, minced", amount: 1, unit: "medium", category: "produce", optional: false },
      { id: "2-7", recipeId: "2", name: "unsalted butter", amount: 3, unit: "tbsp", category: "dairy", optional: false },
      { id: "2-8", recipeId: "2", name: "olive oil", amount: 2, unit: "tbsp", category: "pantry", optional: false },
    ],
    instructions: [
      { id: "2-s1", recipeId: "2", stepNumber: 1, text: "Sauté mushrooms in 1 tbsp butter until browned, then remove and set aside." },
      { id: "2-s2", recipeId: "2", stepNumber: 2, text: "In the same pot, sauté shallot in olive oil until translucent." },
      { id: "2-s3", recipeId: "2", stepNumber: 3, text: "Add rice and toast for 2 minutes until edges are translucent." },
      { id: "2-s4", recipeId: "2", stepNumber: 4, text: "Deglaze with white wine and stir until fully absorbed." },
      { id: "2-s5", recipeId: "2", stepNumber: 5, text: "Add warm broth one ladle at a time, stirring constantly until absorbed before adding more." },
      { id: "2-s6", recipeId: "2", stepNumber: 6, text: "When rice is al dente, stir in remaining butter, Parmesan, and mushrooms. Rest 2 minutes." },
    ],
  },
  {
    id: "3",
    title: "Lemon Herb Grilled Chicken",
    description: "Bright, zesty marinated chicken thighs with garlic and fresh herbs.",
    prepTime: "10 min",
    cookTime: "18 min",
    servings: 4,
    tags: ["Dinner", "Quick", "Healthy"],
    source: "manual",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    ingredients: [
      { id: "3-1", recipeId: "3", name: "chicken thighs, boneless", amount: 2, unit: "lb", category: "meat", optional: false },
      { id: "3-2", recipeId: "3", name: "lemon juice", amount: 3, unit: "tbsp", category: "produce", optional: false },
      { id: "3-3", recipeId: "3", name: "olive oil", amount: 2, unit: "tbsp", category: "pantry", optional: false },
      { id: "3-4", recipeId: "3", name: "garlic, minced", amount: 3, unit: "cloves", category: "produce", optional: false },
      { id: "3-5", recipeId: "3", name: "fresh rosemary, chopped", amount: 1, unit: "tbsp", category: "produce", optional: false },
      { id: "3-6", recipeId: "3", name: "kosher salt", amount: 1, unit: "tsp", category: "pantry", optional: false },
      { id: "3-7", recipeId: "3", name: "black pepper", amount: 0.5, unit: "tsp", category: "pantry", optional: false },
      { id: "3-8", recipeId: "3", name: "lemon, sliced for garnish", amount: 1, unit: "", category: "produce", optional: true },
    ],
    instructions: [
      { id: "3-s1", recipeId: "3", stepNumber: 1, text: "Whisk lemon juice, olive oil, garlic, rosemary, salt, and pepper in a bowl." },
      { id: "3-s2", recipeId: "3", stepNumber: 2, text: "Add chicken and coat thoroughly. Marinate at room temperature for 15 minutes (or overnight in fridge)." },
      { id: "3-s3", recipeId: "3", stepNumber: 3, text: "Preheat grill or grill pan to medium-high. Brush grates with oil." },
      { id: "3-s4", recipeId: "3", stepNumber: 4, text: "Grill chicken 6–7 minutes per side until internal temperature reaches 165°F (74°C)." },
      { id: "3-s5", recipeId: "3", stepNumber: 5, text: "Rest for 3 minutes, then serve with lemon slices." },
    ],
  },
  {
    id: "4",
    title: "Blueberry Pancakes",
    description: "Fluffy buttermilk pancakes studded with fresh blueberries.",
    prepTime: "10 min",
    cookTime: "15 min",
    servings: 3,
    tags: ["Breakfast", "Quick", "Vegetarian"],
    source: "manual",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    ingredients: [
      { id: "4-1", recipeId: "4", name: "all-purpose flour", amount: 1.5, unit: "cups", category: "pantry", optional: false },
      { id: "4-2", recipeId: "4", name: "buttermilk", amount: 1.5, unit: "cups", category: "dairy", optional: false },
      { id: "4-3", recipeId: "4", name: "egg", amount: 1, unit: "large", category: "dairy", optional: false },
      { id: "4-4", recipeId: "4", name: "melted butter", amount: 3, unit: "tbsp", category: "dairy", optional: false },
      { id: "4-5", recipeId: "4", name: "baking powder", amount: 2, unit: "tsp", category: "pantry", optional: false },
      { id: "4-6", recipeId: "4", name: "baking soda", amount: 0.5, unit: "tsp", category: "pantry", optional: false },
      { id: "4-7", recipeId: "4", name: "fresh blueberries", amount: 1, unit: "cup", category: "produce", optional: false },
      { id: "4-8", recipeId: "4", name: "salt", amount: 1, unit: "pinch", category: "pantry", optional: false },
    ],
    instructions: [
      { id: "4-s1", recipeId: "4", stepNumber: 1, text: "Whisk flour, baking powder, baking soda, and salt in a large bowl." },
      { id: "4-s2", recipeId: "4", stepNumber: 2, text: "In a separate bowl, whisk buttermilk, egg, and melted butter." },
      { id: "4-s3", recipeId: "4", stepNumber: 3, text: "Pour wet ingredients into dry and stir until just combined (lumps are okay)." },
      { id: "4-s4", recipeId: "4", stepNumber: 4, text: "Gently fold in blueberries." },
      { id: "4-s5", recipeId: "4", stepNumber: 5, text: "Cook on a greased griddle over medium heat, flipping when bubbles form on the surface." },
    ],
  },
];

/**
 * @deprecated Use `getRecipeById` from `src/db/recipes` with a database instance.
 * Kept for reference; mock data is seeded into SQLite on first launch.
 */
export function getRecipeById(id: string): Recipe | undefined {
  return mockRecipes.find((r) => r.id === id);
}
