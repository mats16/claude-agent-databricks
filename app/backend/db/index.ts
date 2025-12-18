import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DB_URL;

if (!connectionString) {
  throw new Error('DB_URL environment variable is required');
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
