/**
 * Central type definitions for the Mise app.
 * These types are used across the UI, database, and utilities.
 */

export interface Ingredient {
  id: string;
  recipeId?: string;
  name: string;
  amount: number;
  unit: string;
  originalUnit?: string;
  category?: string;
  optional: boolean;
  notes?: string;
}

export interface Instruction {
  id: string;
  recipeId?: string;
  stepNumber: number;
  text: string;
  duration?: number;
  imageUri?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: string;
  cookTime: string;
  totalTime?: string;
  servings: number;
  tags: string[];
  source: string; // 'manual' | 'photo' | 'voice' | 'import'
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  imageUri?: string;
  notes?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface PlannedMeal {
  id: string;
  planId?: string;
  date: string; // ISO date (YYYY-MM-DD)
  mealType: MealType;
  recipeId: string;
  servings: number;
  notes?: string;
}

export interface MealPlan {
  id: string;
  weekStart: string; // ISO date (Monday of the week)
  createdAt: string;
  meals: PlannedMeal[];
}

export interface ShoppingItem {
  id: string;
  listId?: string;
  name: string;
  amount?: number;
  unit?: string;
  category: string;
  checked: boolean;
  sourceRecipeIds: string[];
  isCustom: boolean;
}

export interface ShoppingList {
  id: string;
  name: string;
  createdAt: string;
  isActive: boolean;
  items: ShoppingItem[];
}
