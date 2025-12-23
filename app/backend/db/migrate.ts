/**
 * Database Migration Runner
 *
 * Runs idempotent SQL migrations from db/drizzle/*.sql in sorted order.
 * Each migration file should use IF NOT EXISTS, IF EXISTS patterns
 * to be safely re-runnable.
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(dbUrl?: string) {
  const connectionUrl = dbUrl ?? process.env.DB_URL;

  if (!connectionUrl) {
    console.error('Error: DB_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(connectionUrl, { max: 1 });

  try {
    const migrationsDir = path.join(__dirname, 'drizzle');

    // Get all SQL files sorted by name
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    console.log(`Found ${files.length} migration file(s)`);

    for (const file of files) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      console.log(`Running migration: ${file}`);
      await client.unsafe(sql);
      console.log(`  ✓ ${file} completed`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run if executed directly
const isMainModule = process.argv[1]?.endsWith('migrate.ts');
if (isMainModule) {
  runMigrations().catch(() => process.exit(1));
}
