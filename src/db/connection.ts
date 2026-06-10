/**
 * Database connection and initialization.
 * Opens the SQLite database, runs schema creation, indexes, and migrations.
 */
import { SQLiteDatabase, openDatabaseAsync } from 'expo-sqlite';
import { CREATE_TABLES_SQL, CREATE_INDEXES_SQL, ENABLE_FTS_SQL, SCHEMA_VERSION } from './schema';
import { runMigrations } from './migrations';

const DB_NAME = 'mise.db';

let dbInstance: SQLiteDatabase | null = null;

/**
 * Drop all known tables. Used when schema version has changed.
 */
async function dropAllTables(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('PRAGMA foreign_keys = OFF;');
  await db.runAsync('DROP TABLE IF EXISTS migrations;');
  await db.runAsync('DROP TABLE IF EXISTS recipes_fts;');
  await db.runAsync('DROP TABLE IF EXISTS recipes;');
  await db.runAsync('DROP TABLE IF EXISTS ingredients;');
  await db.runAsync('DROP TABLE IF EXISTS instructions;');
  await db.runAsync('DROP TABLE IF EXISTS meal_plans;');
  await db.runAsync('DROP TABLE IF EXISTS planned_meals;');
  await db.runAsync('DROP TABLE IF EXISTS shopping_lists;');
  await db.runAsync('DROP TABLE IF EXISTS shopping_items;');
  await db.runAsync('PRAGMA foreign_keys = ON;');
}

/**
 * Open and initialize the database.
 * Safe to call multiple times — returns the existing instance after first init.
 */
export async function initDatabase(): Promise<SQLiteDatabase> {
  if (dbInstance) {
    return dbInstance;
  }

  const db = await openDatabaseAsync(DB_NAME);

  // Enable foreign key support
  await db.runAsync('PRAGMA foreign_keys = ON;');

  // Check schema version
  const versionRow = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;');
  const currentVersion = versionRow?.user_version ?? 0;

  if (currentVersion !== SCHEMA_VERSION) {
    // Schema has changed — drop everything and rebuild
    await dropAllTables(db);
  }

  // Create tables
  await db.execAsync(CREATE_TABLES_SQL);

  // Create indexes
  await db.execAsync(CREATE_INDEXES_SQL);

  // Attempt to enable FTS5 (best-effort; silently skip if unsupported)
  try {
    await db.execAsync(ENABLE_FTS_SQL);
  } catch {
    // FTS5 not available on this SQLite build — search will fall back to LIKE
  }

  // Set schema version
  await db.runAsync(`PRAGMA user_version = ${SCHEMA_VERSION};`);

  // Run data migrations / seeding
  await runMigrations(db);

  dbInstance = db;
  return db;
}

/**
 * Get the existing database instance.
 * Throws if initDatabase() has not been called.
 */
export function getDatabase(): SQLiteDatabase {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Close the database connection.
 * Useful for testing or cleanup.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * Reset the entire database (destructive).
 * Drops all tables and re-initializes from scratch.
 */
export async function resetDatabase(): Promise<SQLiteDatabase> {
  await closeDatabase();
  const db = await openDatabaseAsync(DB_NAME);
  await dropAllTables(db);
  await db.closeAsync();
  dbInstance = null;
  return initDatabase();
}
