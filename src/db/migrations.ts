/**
 * Database migrations and seed data.
 * Tracks migration versions and seeds initial data.
 */
import { SQLiteDatabase } from 'expo-sqlite';
import { Recipe } from '../types';
import { mockRecipes } from '../data/mockRecipes';

interface MigrationRecord {
  id: number;
  version: number;
  applied_at: string;
}

async function getAppliedMigrations(db: SQLiteDatabase): Promise<number[]> {
  const rows = await db.getAllAsync<MigrationRecord>(
    'SELECT version FROM migrations ORDER BY version ASC'
  );
  return rows.map((r) => r.version);
}

async function recordMigration(db: SQLiteDatabase, version: number): Promise<void> {
  await db.runAsync(
    'INSERT INTO migrations (version, applied_at) VALUES (?, ?)',
    version,
    new Date().toISOString()
  );
}

// ── Migrations ────────────────────────────────────────────────

type MigrationFn = (db: SQLiteDatabase) => Promise<void>;

const migrations: Record<number, MigrationFn> = {
  // v1: Seed with mock recipes
  1: async (db) => {
    const count = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM recipes'
    );
    if (count && count.count > 0) return;

    for (const recipe of mockRecipes) {
      await insertRecipe(db, recipe);
    }
  },
};

// ── Helpers used during seeding ─────────────────────────────

async function insertRecipe(db: SQLiteDatabase, recipe: Recipe): Promise<void> {
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
    recipe.source ?? 'manual',
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
}

// ── Public API ────────────────────────────────────────────────

export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const applied = await getAppliedMigrations(db);
  const allVersions = Object.keys(migrations)
    .map(Number)
    .sort((a, b) => a - b);

  for (const version of allVersions) {
    if (!applied.includes(version)) {
      await db.withTransactionAsync(async () => {
        await migrations[version](db);
        await recordMigration(db, version);
      });
    }
  }
}
