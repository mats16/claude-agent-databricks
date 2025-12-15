import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const FALLBACK_DB_URL =
  'postgresql://neondb_owner:npg_IFxH3C1eEBJh@ep-gentle-mouse-a1csqvv0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const connectionString = process.env.DB_URL || FALLBACK_DB_URL;

if (!process.env.DB_URL) {
  console.warn('DB_URL is not set. Using fallback database URL.');
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
