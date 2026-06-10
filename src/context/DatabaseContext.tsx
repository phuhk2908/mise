/**
 * Database React Context.
 * Initializes SQLite on app launch and provides the db instance to children.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { SQLiteDatabase } from 'expo-sqlite';
import { initDatabase } from '../db/connection';

interface DatabaseContextValue {
  /** The SQLite database instance (null until initialization completes) */
  db: SQLiteDatabase | null;
  /** True when the database is open and migrations have run */
  ready: boolean;
  /** Error that occurred during initialization, if any */
  error: Error | null;
  /** Re-initialize the database (useful after a reset) */
  reinit: () => Promise<void>;
}

const DatabaseContext = createContext<DatabaseContextValue>({
  db: null,
  ready: false,
  error: null,
  reinit: async () => {},
});

export function useDatabase(): DatabaseContextValue {
  return useContext(DatabaseContext);
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const initialize = async () => {
    try {
      setReady(false);
      setError(null);
      const database = await initDatabase();
      setDb(database);
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setReady(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const reinit = async () => {
    setDb(null);
    setReady(false);
    await initialize();
  };

  return (
    <DatabaseContext.Provider value={{ db, ready, error, reinit }}>
      {children}
    </DatabaseContext.Provider>
  );
}
