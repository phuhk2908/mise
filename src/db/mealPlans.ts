/**
 * Meal plan CRUD operations.
 */
import { SQLiteDatabase } from 'expo-sqlite';
import { MealPlan, PlannedMeal, MealType } from '../types';

interface MealPlanRow {
  id: string;
  week_start: string;
  created_at: string;
}

interface PlannedMealRow {
  id: string;
  plan_id: string;
  date: string;
  meal_type: string;
  recipe_id: string;
  servings: number;
  notes: string | null;
}

function rowToPlannedMeal(row: PlannedMealRow): PlannedMeal {
  return {
    id: row.id,
    planId: row.plan_id,
    date: row.date,
    mealType: row.meal_type as MealType,
    recipeId: row.recipe_id,
    servings: row.servings,
    notes: row.notes ?? undefined,
  };
}

// ── Meal Plans ────────────────────────────────────────────────

export async function getOrCreateMealPlan(
  db: SQLiteDatabase,
  weekStart: string
): Promise<MealPlan> {
  const existing = await db.getFirstAsync<MealPlanRow>(
    'SELECT * FROM meal_plans WHERE week_start = ?',
    weekStart
  );

  if (existing) {
    const meals = await db.getAllAsync<PlannedMealRow>(
      'SELECT * FROM planned_meals WHERE plan_id = ? ORDER BY date ASC, meal_type ASC',
      existing.id
    );
    return {
      id: existing.id,
      weekStart: existing.week_start,
      createdAt: existing.created_at,
      meals: meals.map(rowToPlannedMeal),
    };
  }

  // Create new plan
  const id = `plan-${weekStart}`;
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO meal_plans (id, week_start, created_at) VALUES (?, ?, ?)',
    id,
    weekStart,
    createdAt
  );

  return { id, weekStart, createdAt, meals: [] };
}

export async function getMealPlanById(db: SQLiteDatabase, planId: string): Promise<MealPlan | null> {
  const row = await db.getFirstAsync<MealPlanRow>(
    'SELECT * FROM meal_plans WHERE id = ?',
    planId
  );
  if (!row) return null;

  const meals = await db.getAllAsync<PlannedMealRow>(
    'SELECT * FROM planned_meals WHERE plan_id = ? ORDER BY date ASC, meal_type ASC',
    planId
  );

  return {
    id: row.id,
    weekStart: row.week_start,
    createdAt: row.created_at,
    meals: meals.map(rowToPlannedMeal),
  };
}

export async function getAllMealPlans(db: SQLiteDatabase): Promise<MealPlan[]> {
  const rows = await db.getAllAsync<MealPlanRow>(
    'SELECT * FROM meal_plans ORDER BY week_start DESC'
  );

  const plans: MealPlan[] = [];
  for (const row of rows) {
    const meals = await db.getAllAsync<PlannedMealRow>(
      'SELECT * FROM planned_meals WHERE plan_id = ? ORDER BY date ASC, meal_type ASC',
      row.id
    );
    plans.push({
      id: row.id,
      weekStart: row.week_start,
      createdAt: row.created_at,
      meals: meals.map(rowToPlannedMeal),
    });
  }

  return plans;
}

export async function deleteMealPlan(db: SQLiteDatabase, planId: string): Promise<void> {
  // Cascade deletes planned_meals via FK
  await db.runAsync('DELETE FROM meal_plans WHERE id = ?', planId);
}

// ── Planned Meals ─────────────────────────────────────────────

export async function addPlannedMeal(
  db: SQLiteDatabase,
  planId: string,
  date: string,
  mealType: MealType,
  recipeId: string,
  servings: number,
  notes?: string
): Promise<PlannedMeal> {
  const id = `pm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  await db.runAsync(
    `INSERT INTO planned_meals (id, plan_id, date, meal_type, recipe_id, servings, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id,
    planId,
    date,
    mealType,
    recipeId,
    servings,
    notes ?? null
  );

  return {
    id,
    planId,
    date,
    mealType,
    recipeId,
    servings,
    notes,
  };
}

export async function updatePlannedMeal(
  db: SQLiteDatabase,
  mealId: string,
  updates: Partial<Pick<PlannedMeal, 'servings' | 'notes' | 'mealType' | 'date' | 'recipeId'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.servings !== undefined) {
    fields.push('servings = ?');
    values.push(updates.servings);
  }
  if (updates.notes !== undefined) {
    fields.push('notes = ?');
    values.push(updates.notes ?? null);
  }
  if (updates.mealType !== undefined) {
    fields.push('meal_type = ?');
    values.push(updates.mealType);
  }
  if (updates.date !== undefined) {
    fields.push('date = ?');
    values.push(updates.date);
  }
  if (updates.recipeId !== undefined) {
    fields.push('recipe_id = ?');
    values.push(updates.recipeId);
  }

  if (fields.length === 0) return;

  values.push(mealId);
  await db.runAsync(
    `UPDATE planned_meals SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

export async function removePlannedMeal(db: SQLiteDatabase, mealId: string): Promise<void> {
  await db.runAsync('DELETE FROM planned_meals WHERE id = ?', mealId);
}

export async function getPlannedMealsForDate(
  db: SQLiteDatabase,
  date: string
): Promise<PlannedMeal[]> {
  const rows = await db.getAllAsync<PlannedMealRow>(
    'SELECT * FROM planned_meals WHERE date = ? ORDER BY meal_type ASC',
    date
  );
  return rows.map(rowToPlannedMeal);
}

export async function getPlannedMealsForDateRange(
  db: SQLiteDatabase,
  startDate: string,
  endDate: string
): Promise<PlannedMeal[]> {
  const rows = await db.getAllAsync<PlannedMealRow>(
    'SELECT * FROM planned_meals WHERE date BETWEEN ? AND ? ORDER BY date ASC, meal_type ASC',
    startDate,
    endDate
  );
  return rows.map(rowToPlannedMeal);
}

export async function clearMealPlan(db: SQLiteDatabase, planId: string): Promise<void> {
  await db.runAsync('DELETE FROM planned_meals WHERE plan_id = ?', planId);
}

export async function duplicateMealPlan(
  db: SQLiteDatabase,
  sourcePlanId: string,
  targetWeekStart: string
): Promise<MealPlan> {
  const source = await getMealPlanById(db, sourcePlanId);
  if (!source) throw new Error('Source meal plan not found');

  const newPlan = await getOrCreateMealPlan(db, targetWeekStart);
  await clearMealPlan(db, newPlan.id);

  for (const meal of source.meals) {
    await addPlannedMeal(
      db,
      newPlan.id,
      meal.date, // TODO: adjust date to target week if needed
      meal.mealType,
      meal.recipeId,
      meal.servings,
      meal.notes
    );
  }

  const result = await getMealPlanById(db, newPlan.id);
  if (!result) throw new Error('Failed to duplicate meal plan');
  return result;
}
