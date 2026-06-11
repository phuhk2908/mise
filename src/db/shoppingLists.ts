/**
 * Shopping list CRUD operations.
 * Supports generating lists from recipes or meal plans.
 */
import { SQLiteDatabase } from 'expo-sqlite';
import { ShoppingItem, ShoppingList } from '../types';
import { getPlannedMealsForDateRange } from './mealPlans';
import { getRecipeById } from './recipes';

interface ShoppingListRow {
  id: string;
  name: string;
  created_at: string;
  is_active: number;
}

interface ShoppingItemRow {
  id: string;
  list_id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  category: string;
  checked: number;
  source_recipe_ids: string | null;
  is_custom: number;
}

function rowToShoppingItem(row: ShoppingItemRow): ShoppingItem {
  return {
    id: row.id,
    listId: row.list_id,
    name: row.name,
    amount: row.amount ?? undefined,
    unit: row.unit ?? undefined,
    category: row.category,
    checked: Boolean(row.checked),
    sourceRecipeIds: row.source_recipe_ids ? JSON.parse(row.source_recipe_ids) : [],
    isCustom: Boolean(row.is_custom),
  };
}

function rowToShoppingList(row: ShoppingListRow, items: ShoppingItem[]): ShoppingList {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    isActive: Boolean(row.is_active),
    items,
  };
}

// ── Helpers ───────────────────────────────────────────────────

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  produce: [
    'lettuce', 'tomato', 'onion', 'garlic', 'mushroom', 'blueberry',
    'lemon', 'shallot', 'potato', 'carrot', 'spinach', 'apple',
    'banana', 'herb', 'parsley', 'cilantro', 'basil', 'ginger',
    'avocado', 'pepper', 'cucumber', 'celery', 'broccoli', 'cauliflower',
    'zucchini', 'eggplant', 'corn', 'peas', 'green bean', 'asparagus',
  ],
  dairy: [
    'cheese', 'cream', 'milk', 'buttermilk', 'butter', 'yogurt',
    'egg', 'eggs', 'mozzarella', 'parmesan', 'cheddar', 'feta',
    'ricotta', 'cream cheese', 'sour cream', 'whipped cream',
  ],
  meat: [
    'beef', 'chicken', 'pork', 'meat', 'fish', 'salmon', 'shrimp',
    'bacon', 'sausage', 'turkey', 'lamb', 'ham', 'steak', 'ground',
    'tenderloin', 'rib', 'wing', 'breast', 'thigh', 'drumstick',
  ],
  pantry: [
    'flour', 'oil', 'seasoning', 'broth', 'rice', 'wine', 'tortilla',
    'pasta', 'sugar', 'salt', 'pepper', 'vinegar', 'soy sauce',
    'honey', 'maple syrup', 'baking powder', 'baking soda', 'vanilla',
    'yeast', 'cocoa', 'chocolate', 'nutmeg', 'cinnamon', 'cumin',
    'oregano', 'thyme', 'bay leaf', 'stock', 'noodle', 'spaghetti',
    'cereal', 'oat', 'quinoa', 'lentil', 'bean', 'can', 'jar',
  ],
  frozen: [
    'frozen', 'ice cream', 'pizza', 'waffle', 'fries',
  ],
  bakery: [
    'bread', 'bun', 'roll', 'baguette', 'croissant', 'tortilla',
    'pita', 'naan', 'bagel', 'muffin', 'cake', 'pie crust',
  ],
};

function categorizeIngredient(name: string): string {
  const lower = name.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) return category;
    }
  }
  return 'other';
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/,.*$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUnit(unit: string): string {
  return unit.toLowerCase().trim();
}

// ── Shopping Lists ─────────────────────────────────────────────

export async function createShoppingList(db: SQLiteDatabase, name: string): Promise<ShoppingList> {
  // Deactivate any existing active list
  await db.runAsync('UPDATE shopping_lists SET is_active = 0 WHERE is_active = 1');

  const id = generateId('sl');
  const createdAt = new Date().toISOString();
  await db.runAsync(
    'INSERT INTO shopping_lists (id, name, created_at, is_active) VALUES (?, ?, ?, ?)',
    id,
    name,
    createdAt,
    1
  );

  return { id, name, createdAt, isActive: true, items: [] };
}

export async function getShoppingListById(
  db: SQLiteDatabase,
  listId: string
): Promise<ShoppingList | null> {
  const row = await db.getFirstAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists WHERE id = ?',
    listId
  );
  if (!row) return null;

  const items = await db.getAllAsync<ShoppingItemRow>(
    'SELECT * FROM shopping_items WHERE list_id = ? ORDER BY category ASC, name ASC',
    listId
  );

  return rowToShoppingList(row, items.map(rowToShoppingItem));
}

export async function getActiveShoppingList(db: SQLiteDatabase): Promise<ShoppingList | null> {
  const row = await db.getFirstAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists WHERE is_active = 1 ORDER BY created_at DESC'
  );
  if (!row) return null;

  const items = await db.getAllAsync<ShoppingItemRow>(
    'SELECT * FROM shopping_items WHERE list_id = ? ORDER BY category ASC, name ASC',
    row.id
  );

  return rowToShoppingList(row, items.map(rowToShoppingItem));
}

export async function getAllShoppingLists(db: SQLiteDatabase): Promise<ShoppingList[]> {
  const rows = await db.getAllAsync<ShoppingListRow>(
    'SELECT * FROM shopping_lists ORDER BY created_at DESC'
  );

  const lists: ShoppingList[] = [];
  for (const row of rows) {
    const items = await db.getAllAsync<ShoppingItemRow>(
      'SELECT * FROM shopping_items WHERE list_id = ? ORDER BY category ASC, name ASC',
      row.id
    );
    lists.push(rowToShoppingList(row, items.map(rowToShoppingItem)));
  }

  return lists;
}

export async function setActiveShoppingList(db: SQLiteDatabase, listId: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE shopping_lists SET is_active = 0');
    await db.runAsync('UPDATE shopping_lists SET is_active = 1 WHERE id = ?', listId);
  });
}

export async function renameShoppingList(
  db: SQLiteDatabase,
  listId: string,
  name: string
): Promise<void> {
  await db.runAsync('UPDATE shopping_lists SET name = ? WHERE id = ?', name, listId);
}

export async function deleteShoppingList(db: SQLiteDatabase, listId: string): Promise<void> {
  // Cascade deletes items via FK
  await db.runAsync('DELETE FROM shopping_lists WHERE id = ?', listId);
}

// ── Shopping Items ────────────────────────────────────────────

export async function addShoppingItem(
  db: SQLiteDatabase,
  listId: string,
  item: Omit<ShoppingItem, 'id' | 'listId'>
): Promise<ShoppingItem> {
  const id = generateId('si');
  await db.runAsync(
    `INSERT INTO shopping_items (
      id, list_id, name, amount, unit, category, checked, source_recipe_ids, is_custom
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    listId,
    item.name,
    item.amount ?? null,
    item.unit ?? null,
    item.category,
    item.checked ? 1 : 0,
    JSON.stringify(item.sourceRecipeIds),
    item.isCustom ? 1 : 0
  );

  return { ...item, id, listId };
}

export async function toggleShoppingItem(db: SQLiteDatabase, itemId: string): Promise<void> {
  await db.runAsync(
    'UPDATE shopping_items SET checked = ((checked | 1) - (checked & 1)) WHERE id = ?',
    itemId
  );
}

export async function setItemChecked(
  db: SQLiteDatabase,
  itemId: string,
  checked: boolean
): Promise<void> {
  await db.runAsync('UPDATE shopping_items SET checked = ? WHERE id = ?', checked ? 1 : 0, itemId);
}

export async function clearCheckedItems(db: SQLiteDatabase, listId: string): Promise<void> {
  await db.runAsync(
    'DELETE FROM shopping_items WHERE list_id = ? AND checked = 1',
    listId
  );
}

export async function removeShoppingItem(db: SQLiteDatabase, itemId: string): Promise<void> {
  await db.runAsync('DELETE FROM shopping_items WHERE id = ?', itemId);
}

export async function updateShoppingItem(
  db: SQLiteDatabase,
  itemId: string,
  updates: Partial<Pick<ShoppingItem, 'name' | 'amount' | 'unit' | 'category'>>
): Promise<void> {
  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.amount !== undefined) {
    fields.push('amount = ?');
    values.push(updates.amount ?? null);
  }
  if (updates.unit !== undefined) {
    fields.push('unit = ?');
    values.push(updates.unit ?? null);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }

  if (fields.length === 0) return;
  values.push(itemId);

  await db.runAsync(
    `UPDATE shopping_items SET ${fields.join(', ')} WHERE id = ?`,
    ...values
  );
}

// ── List Generation ─────────────────────────────────────────

/**
 * Build a flat list of ingredients from one or more recipes,
 * with amounts scaled to target servings.
 */
export async function buildIngredientsFromRecipes(
  db: SQLiteDatabase,
  recipeServings: { recipeId: string; servings: number }[]
): Promise<Omit<ShoppingItem, 'id' | 'listId' | 'checked'>[]> {
  const items: Omit<ShoppingItem, 'id' | 'listId' | 'checked'>[] = [];

  for (const { recipeId, servings } of recipeServings) {
    const recipe = await getRecipeById(db, recipeId);
    if (!recipe) continue;

    const ratio = servings / recipe.servings;
    for (const ing of recipe.ingredients) {
      const scaledAmount = Math.round(ing.amount * ratio * 8) / 8;
      items.push({
        name: ing.name,
        amount: scaledAmount,
        unit: ing.unit,
        category: ing.category || categorizeIngredient(ing.name),
        sourceRecipeIds: [recipeId],
        isCustom: false,
      });
    }
  }

  return items;
}

/**
 * Merge duplicate ingredients by name + unit category.
 */
export function mergeShoppingItems(
  items: Omit<ShoppingItem, 'id' | 'listId' | 'checked'>[]
): Omit<ShoppingItem, 'id' | 'listId'>[] {
  const buckets = new Map<
    string,
    {
      name: string;
      amount: number;
      unit: string;
      category: string;
      sourceRecipeIds: string[];
    }
  >();

  for (const item of items) {
    const normName = normalizeName(item.name);
    const normUnit = normalizeUnit(item.unit ?? '');
    const key = `${normName}::${normUnit}`;

    if (buckets.has(key)) {
      const existing = buckets.get(key)!;
      existing.amount += item.amount ?? 0;
      existing.sourceRecipeIds.push(...item.sourceRecipeIds);
    } else {
      buckets.set(key, {
        name: item.name,
        amount: item.amount ?? 0,
        unit: item.unit ?? '',
        category: item.category,
        sourceRecipeIds: [...item.sourceRecipeIds],
      });
    }
  }

  return Array.from(buckets.values()).map((b) => ({
    name: b.name,
    amount: Math.round(b.amount * 100) / 100,
    unit: b.unit,
    category: b.category,
    sourceRecipeIds: [...new Set(b.sourceRecipeIds)],
    isCustom: false,
    checked: false,
  }));
}

/**
 * Generate a shopping list from a meal plan week.
 */
export async function generateShoppingListFromPlan(
  db: SQLiteDatabase,
  weekStart: string,
  listName?: string
): Promise<ShoppingList> {
  // Calculate week end (7 days)
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const endStr = end.toISOString().split('T')[0];

  const meals = await getPlannedMealsForDateRange(db, weekStart, endStr);
  const recipeServings = meals.map((m) => ({
    recipeId: m.recipeId,
    servings: m.servings,
  }));

  return generateShoppingListFromRecipes(db, recipeServings, listName ?? `Week of ${weekStart}`);
}

/**
 * Generate a shopping list from specific recipes.
 */
export async function generateShoppingListFromRecipes(
  db: SQLiteDatabase,
  recipeServings: { recipeId: string; servings: number }[],
  listName: string
): Promise<ShoppingList> {
  const rawItems = await buildIngredientsFromRecipes(db, recipeServings);
  const merged = mergeShoppingItems(rawItems);

  // Create list
  const list = await createShoppingList(db, listName);

  // Insert merged items
  for (const item of merged) {
    await addShoppingItem(db, list.id, item);
  }

  const result = await getShoppingListById(db, list.id);
  if (!result) throw new Error('Failed to create shopping list');
  return result;
}
