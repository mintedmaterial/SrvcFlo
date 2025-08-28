import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const DATABASE_PATH = process.env.NODE_ENV === 'test' ? ':memory:' : './tmp/agents.db';

let dbInstance: any = null;

export async function getSqliteDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await open({
    filename: DATABASE_PATH,
    driver: sqlite3.Database,
  });

  // Create customers table if it doesn't exist
  await dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      address TEXT,
      projectDescription TEXT
    );
  `);

  return dbInstance;
}
