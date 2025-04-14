import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';
import path from 'path';

const dbPath = path.join(__dirname, '../sqlite.db');

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

export const DB_SYMBOL = Symbol('db');

export type Database = typeof db;

export type Transaction = SQLiteTransaction<
  'sync',
  Database.RunResult,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export { schema };
