import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    console.error('Error: DB_URL environment variable is not set');
    process.exit(1);
  }

  // Use separate connection for migrations (recommended)
  const migrationClient = postgres(dbUrl, { max: 1 });
  const db = drizzle(migrationClient);

  try {
    console.log('Running Drizzle Kit migrations...');

    // Run Drizzle Kit managed migrations
    await migrate(db, {
      migrationsFolder: path.join(__dirname, 'drizzle'),
    });

    console.log('Drizzle migrations completed');

    // Run custom RLS policies (idempotent)
    console.log('Applying RLS policies...');
    const rlsPath = path.join(__dirname, 'custom', 'rls-policies.sql');

    if (fs.existsSync(rlsPath)) {
      const rlsSql = fs.readFileSync(rlsPath, 'utf-8');
      await migrationClient.unsafe(rlsSql);
      console.log('RLS policies applied');
    } else {
      console.warn('RLS policies file not found, skipping');
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

runMigrations();
