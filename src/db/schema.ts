/**
 * SQLite schema definitions for the Mise app.
 * All CREATE TABLE statements and indexes.
 */

/** Bump this when schema changes to force table recreation. */
export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
-- Recipes master table
CREATE TABLE IF NOT EXISTS recipes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  prep_time TEXT,
  cook_time TEXT,
  total_time TEXT,
  servings INTEGER NOT NULL DEFAULT 4,
  tags TEXT,                    -- JSON array string
  source TEXT DEFAULT 'manual',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  image_uri TEXT,
  notes TEXT
);

-- Ingredients (one-to-many with recipes)
CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  original_unit TEXT,
  category TEXT,
  optional INTEGER DEFAULT 0,
  notes TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Instructions (one-to-many with recipes)
CREATE TABLE IF NOT EXISTS instructions (
  id TEXT PRIMARY KEY,
  recipe_id TEXT NOT NULL,
  step_number INTEGER NOT NULL,
  text TEXT NOT NULL,
  duration INTEGER,
  image_uri TEXT,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Meal plans (weekly)
CREATE TABLE IF NOT EXISTS meal_plans (
  id TEXT PRIMARY KEY,
  week_start TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Planned meals (one-to-many with meal_plans)
CREATE TABLE IF NOT EXISTS planned_meals (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  date TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK(meal_type IN ('breakfast','lunch','dinner','snack')),
  recipe_id TEXT NOT NULL,
  servings INTEGER NOT NULL,
  notes TEXT,
  FOREIGN KEY (plan_id) REFERENCES meal_plans(id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
);

-- Shopping lists
CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  is_active INTEGER DEFAULT 1
);

-- Shopping items (one-to-many with shopping_lists)
CREATE TABLE IF NOT EXISTS shopping_items (
  id TEXT PRIMARY KEY,
  list_id TEXT NOT NULL,
  name TEXT NOT NULL,
  amount REAL,
  unit TEXT,
  category TEXT NOT NULL,
  checked INTEGER DEFAULT 0,
  source_recipe_ids TEXT,       -- JSON array string
  is_custom INTEGER DEFAULT 0,
  FOREIGN KEY (list_id) REFERENCES shopping_lists(id) ON DELETE CASCADE
);

-- Migration tracking
CREATE TABLE IF NOT EXISTS migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  version INTEGER NOT NULL UNIQUE,
  applied_at TEXT NOT NULL
);
`;

export const CREATE_INDEXES_SQL = `
-- Speed up recipe lookups
CREATE INDEX IF NOT EXISTS idx_ingredients_recipe_id ON ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS idx_instructions_recipe_id ON instructions(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipes_created_at ON recipes(created_at DESC);

-- Speed up meal plan lookups
CREATE INDEX IF NOT EXISTS idx_planned_meals_plan_id ON planned_meals(plan_id);
CREATE INDEX IF NOT EXISTS idx_planned_meals_date ON planned_meals(date);
CREATE INDEX IF NOT EXISTS idx_planned_meals_recipe_id ON planned_meals(recipe_id);
CREATE INDEX IF NOT EXISTS idx_meal_plans_week_start ON meal_plans(week_start);

-- Speed up shopping list lookups
CREATE INDEX IF NOT EXISTS idx_shopping_items_list_id ON shopping_items(list_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_checked ON shopping_items(list_id, checked);
`;

export const ENABLE_FTS_SQL = `
-- Full-text search on recipes (best-effort; some builds may not support FTS5)
CREATE VIRTUAL TABLE IF NOT EXISTS recipes_fts USING fts5(
  title, description,
  content='recipes',
  content_rowid='rowid'
);

-- Triggers to keep FTS index in sync
CREATE TRIGGER IF NOT EXISTS recipes_fts_insert AFTER INSERT ON recipes BEGIN
  INSERT INTO recipes_fts(rowid, title, description)
  VALUES (new.rowid, new.title, new.description);
END;

CREATE TRIGGER IF NOT EXISTS recipes_fts_delete AFTER DELETE ON recipes BEGIN
  INSERT INTO recipes_fts(recipes_fts, rowid, title, description)
  VALUES ('delete', old.rowid, old.title, old.description);
END;

CREATE TRIGGER IF NOT EXISTS recipes_fts_update AFTER UPDATE ON recipes BEGIN
  INSERT INTO recipes_fts(recipes_fts, rowid, title, description)
  VALUES ('delete', old.rowid, old.title, old.description);
  INSERT INTO recipes_fts(rowid, title, description)
  VALUES (new.rowid, new.title, new.description);
END;
`;

export const DROP_FTS_SQL = `
DROP TABLE IF EXISTS recipes_fts;
DROP TRIGGER IF EXISTS recipes_fts_insert;
DROP TRIGGER IF EXISTS recipes_fts_delete;
DROP TRIGGER IF EXISTS recipes_fts_update;
`;
