/**
 * Recipe CRUD operations.
 * All functions read/write the full recipe graph (recipe + ingredients + instructions).
 */
import { SQLiteDatabase } from 'expo-sqlite';
import { Recipe, Ingredient, Instruction } from '../types';

// ── Row types from SQLite ─────────────────────────────────────

interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  prep_time: string | null;
  cook_time: string | null;
  total_time: string | null;
  servings: number;
  tags: string | null;
  source: string | null;
  created_at: string;
  updated_at: string;
  image_uri: string | null;
  notes: string | null;
}

interface IngredientRow {
  id: string;
  recipe_id: string;
  name: string;
  amount: number;
  unit: string;
  original_unit: string | null;
  category: string | null;
  optional: number;
  notes: string | null;
}

interface InstructionRow {
  id: string;
  recipe_id: string;
  step_number: number;
  text: string;
  duration: number | null;
  image_uri: string | null;
}

// ── Helpers ───────────────────────────────────────────────────

function rowToRecipe(row: RecipeRow, ingredients: Ingredient[], instructions: Instruction[]): Recipe {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    prepTime: row.prep_time ?? '',
    cookTime: row.cook_time ?? '',
    totalTime: row.total_time ?? undefined,
    servings: row.servings,
    tags: row.tags ? JSON.parse(row.tags) : [],
    source: row.source ?? 'manual',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    imageUri: row.image_uri ?? undefined,
    notes: row.notes ?? undefined,
    ingredients,
    instructions,
  };
}

function rowToIngredient(row: IngredientRow): Ingredient {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    name: row.name,
    amount: row.amount,
    unit: row.unit,
    originalUnit: row.original_unit ?? undefined,
    category: row.category ?? undefined,
    optional: Boolean(row.optional),
    notes: row.notes ?? undefined,
  };
}

function rowToInstruction(row: InstructionRow): Instruction {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    stepNumber: row.step_number,
    text: row.text,
    duration: row.duration ?? undefined,
    imageUri: row.image_uri ?? undefined,
  };
}

// ── Create ────────────────────────────────────────────────────

export async function insertRecipe(db: SQLiteDatabase, recipe: Recipe): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO recipes (
        id, title, description, prep_time, cook_time, total_time,
        servings, tags, source, created_at, updated_at, image_uri, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      recipe.id,
      recipe.title,
      recipe.description,
      recipe.prepTime,
      recipe.cookTime,
      recipe.totalTime ?? null,
      recipe.servings,
      JSON.stringify(recipe.tags),
      recipe.source,
      recipe.createdAt,
      recipe.updatedAt,
      recipe.imageUri ?? null,
      recipe.notes ?? null
    );

    for (const ing of recipe.ingredients) {
      await db.runAsync(
        `INSERT INTO ingredients (
          id, recipe_id, name, amount, unit, original_unit, category, optional, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ing.id,
        recipe.id,
        ing.name,
        ing.amount,
        ing.unit,
        ing.originalUnit ?? null,
        ing.category ?? null,
        ing.optional ? 1 : 0,
        ing.notes ?? null
      );
    }

    for (const inst of recipe.instructions) {
      await db.runAsync(
        `INSERT INTO instructions (
          id, recipe_id, step_number, text, duration, image_uri
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        inst.id,
        recipe.id,
        inst.stepNumber,
        inst.text,
        inst.duration ?? null,
        inst.imageUri ?? null
      );
    }
  });
}

// ── Read ──────────────────────────────────────────────────────

export async function getRecipeById(db: SQLiteDatabase, id: string): Promise<Recipe | null> {
  const row = await db.getFirstAsync<RecipeRow>('SELECT * FROM recipes WHERE id = ?', id);
  if (!row) return null;

  const ingredients = await db.getAllAsync<IngredientRow>(
    'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC',
    id
  );
  const instructions = await db.getAllAsync<InstructionRow>(
    'SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number ASC',
    id
  );

  return rowToRecipe(
    row,
    ingredients.map(rowToIngredient),
    instructions.map(rowToInstruction)
  );
}

export async function getAllRecipes(db: SQLiteDatabase): Promise<Recipe[]> {
  const rows = await db.getAllAsync<RecipeRow>(
    'SELECT * FROM recipes ORDER BY updated_at DESC'
  );
  const recipes: Recipe[] = [];

  for (const row of rows) {
    const ingredients = await db.getAllAsync<IngredientRow>(
      'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC',
      row.id
    );
    const instructions = await db.getAllAsync<InstructionRow>(
      'SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number ASC',
      row.id
    );
    recipes.push(rowToRecipe(
      row,
      ingredients.map(rowToIngredient),
      instructions.map(rowToInstruction)
    ));
  }

  return recipes;
}

export async function searchRecipes(db: SQLiteDatabase, query: string): Promise<Recipe[]> {
  const q = `%${query.toLowerCase()}%`;
  const rows = await db.getAllAsync<RecipeRow>(
    `SELECT * FROM recipes
     WHERE LOWER(title) LIKE ? OR LOWER(description) LIKE ?
     ORDER BY updated_at DESC`,
    q,
    q
  );

  const recipes: Recipe[] = [];
  for (const row of rows) {
    const ingredients = await db.getAllAsync<IngredientRow>(
      'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC',
      row.id
    );
    const instructions = await db.getAllAsync<InstructionRow>(
      'SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number ASC',
      row.id
    );
    recipes.push(rowToRecipe(
      row,
      ingredients.map(rowToIngredient),
      instructions.map(rowToInstruction)
    ));
  }

  return recipes;
}

export async function getRecipesByTag(db: SQLiteDatabase, tag: string): Promise<Recipe[]> {
  // SQLite JSON matching via string contains (simplest portable approach)
  const q = `%"${tag}"%`;
  const rows = await db.getAllAsync<RecipeRow>(
    `SELECT * FROM recipes WHERE tags LIKE ? ORDER BY updated_at DESC`,
    q
  );

  const recipes: Recipe[] = [];
  for (const row of rows) {
    const ingredients = await db.getAllAsync<IngredientRow>(
      'SELECT * FROM ingredients WHERE recipe_id = ? ORDER BY id ASC',
      row.id
    );
    const instructions = await db.getAllAsync<InstructionRow>(
      'SELECT * FROM instructions WHERE recipe_id = ? ORDER BY step_number ASC',
      row.id
    );
    recipes.push(rowToRecipe(
      row,
      ingredients.map(rowToIngredient),
      instructions.map(rowToInstruction)
    ));
  }

  return recipes;
}

export async function getAllTags(db: SQLiteDatabase): Promise<string[]> {
  const rows = await db.getAllAsync<{ tags: string }>('SELECT tags FROM recipes');
  const tagSet = new Set<string>();
  for (const row of rows) {
    if (row.tags) {
      try {
        const parsed = JSON.parse(row.tags) as string[];
        parsed.forEach((t) => tagSet.add(t));
      } catch {
        // ignore malformed JSON
      }
    }
  }
  return Array.from(tagSet).sort();
}

// ── Update ─────────────────────────────────────────────────────

export async function updateRecipe(db: SQLiteDatabase, id: string, recipe: Partial<Recipe>): Promise<void> {
  await db.withTransactionAsync(async () => {
    // Update recipe fields if provided
    const fields: string[] = [];
    const values: (string | number | null)[] = [];

    if (recipe.title !== undefined) {
      fields.push('title = ?');
      values.push(recipe.title);
    }
    if (recipe.description !== undefined) {
      fields.push('description = ?');
      values.push(recipe.description);
    }
    if (recipe.prepTime !== undefined) {
      fields.push('prep_time = ?');
      values.push(recipe.prepTime);
    }
    if (recipe.cookTime !== undefined) {
      fields.push('cook_time = ?');
      values.push(recipe.cookTime);
    }
    if (recipe.totalTime !== undefined) {
      fields.push('total_time = ?');
      values.push(recipe.totalTime);
    }
    if (recipe.servings !== undefined) {
      fields.push('servings = ?');
      values.push(recipe.servings);
    }
    if (recipe.tags !== undefined) {
      fields.push('tags = ?');
      values.push(JSON.stringify(recipe.tags));
    }
    if (recipe.source !== undefined) {
      fields.push('source = ?');
      values.push(recipe.source);
    }
    if (recipe.imageUri !== undefined) {
      fields.push('image_uri = ?');
      values.push(recipe.imageUri);
    }
    if (recipe.notes !== undefined) {
      fields.push('notes = ?');
      values.push(recipe.notes);
    }

    // Always update updated_at
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    if (fields.length > 1) {
      await db.runAsync(
        `UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`,
        ...values
      );
    }

    // Replace ingredients if provided
    if (recipe.ingredients) {
      await db.runAsync('DELETE FROM ingredients WHERE recipe_id = ?', id);
      for (const ing of recipe.ingredients) {
        await db.runAsync(
          `INSERT INTO ingredients (
            id, recipe_id, name, amount, unit, original_unit, category, optional, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ing.id,
          id,
          ing.name,
          ing.amount,
          ing.unit,
          ing.originalUnit ?? null,
          ing.category ?? null,
          ing.optional ? 1 : 0,
          ing.notes ?? null
        );
      }
    }

    // Replace instructions if provided
    if (recipe.instructions) {
      await db.runAsync('DELETE FROM instructions WHERE recipe_id = ?', id);
      for (const inst of recipe.instructions) {
        await db.runAsync(
          `INSERT INTO instructions (
            id, recipe_id, step_number, text, duration, image_uri
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          inst.id,
          id,
          inst.stepNumber,
          inst.text,
          inst.duration ?? null,
          inst.imageUri ?? null
        );
      }
    }
  });
}

// ── Delete ────────────────────────────────────────────────────

export async function deleteRecipe(db: SQLiteDatabase, id: string): Promise<void> {
  // Cascade deletes ingredients and instructions via foreign key
  await db.runAsync('DELETE FROM recipes WHERE id = ?', id);
}

export async function deleteAllRecipes(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM instructions');
    await db.runAsync('DELETE FROM ingredients');
    await db.runAsync('DELETE FROM recipes');
  });
}

// ── Count ─────────────────────────────────────────────────────

export async function countRecipes(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM recipes');
  return row?.count ?? 0;
}
