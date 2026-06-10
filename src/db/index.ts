/**
 * Database module exports.
 * Import from here for all database operations.
 */
export { initDatabase, getDatabase, closeDatabase, resetDatabase } from './connection';
export { runMigrations } from './migrations';
export {
  insertRecipe,
  getRecipeById,
  getAllRecipes,
  searchRecipes,
  getRecipesByTag,
  getAllTags,
  updateRecipe,
  deleteRecipe,
  deleteAllRecipes,
  countRecipes,
} from './recipes';
export {
  getOrCreateMealPlan,
  getMealPlanById,
  getAllMealPlans,
  deleteMealPlan,
  addPlannedMeal,
  updatePlannedMeal,
  removePlannedMeal,
  getPlannedMealsForDate,
  getPlannedMealsForDateRange,
  clearMealPlan,
  duplicateMealPlan,
} from './mealPlans';
export {
  createShoppingList,
  getShoppingListById,
  getActiveShoppingList,
  getAllShoppingLists,
  setActiveShoppingList,
  renameShoppingList,
  deleteShoppingList,
  addShoppingItem,
  toggleShoppingItem,
  setItemChecked,
  clearCheckedItems,
  removeShoppingItem,
  updateShoppingItem,
  generateShoppingListFromPlan,
  generateShoppingListFromRecipes,
  buildIngredientsFromRecipes,
  mergeShoppingItems,
} from './shoppingLists';
