import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { SQLiteTransaction } from 'drizzle-orm/sqlite-core';
import { ExtractTablesWithRelations } from 'drizzle-orm';

extendZodWithOpenApi(z);

const sqlite = new Database('./sqlite.db');
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
