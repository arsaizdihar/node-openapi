import { schema } from './db';
import { sqliteGenerate } from 'drizzle-dbml-generator'; // Using Postgres for this example

const out = './schema.dbml';
const relational = true;

sqliteGenerate({ schema, out, relational });
