import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const dbUrl = process.env.DB_URL;

  if (!dbUrl) {
    console.error('Error: DB_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(dbUrl);

  try {
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (!file.endsWith('.sql')) continue;

      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');

      await sql.unsafe(content);
      console.log(`Completed: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
