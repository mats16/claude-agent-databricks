import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postgres from 'postgres';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function markBaseline() {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    console.error('Error: DB_URL environment variable is not set');
    process.exit(1);
  }

  const sql = postgres(dbUrl);

  try {
    // Create drizzle migrations table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS "__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT DEFAULT (EXTRACT(epoch FROM NOW()) * 1000)
      )
    `;
    console.log('Created __drizzle_migrations table (if not exists)');

    // Read migration journal to find baseline migrations
    const journalPath = path.join(
      __dirname,
      '..',
      'drizzle',
      'meta',
      '_journal.json'
    );

    if (!fs.existsSync(journalPath)) {
      console.log(
        'No migration journal found. Run "npm run db:generate" first.'
      );
      await sql.end();
      return;
    }

    const journal = JSON.parse(fs.readFileSync(journalPath, 'utf-8'));
    const migrations: { tag: string; idx: number }[] = journal.entries || [];

    if (migrations.length === 0) {
      console.log('No migrations found in journal.');
      await sql.end();
      return;
    }

    // Check existing migrations
    const existing = await sql`
      SELECT hash FROM "__drizzle_migrations"
    `;
    const existingHashes = new Set(existing.map((r) => r.hash));

    // Mark all migrations as applied
    for (const migration of migrations) {
      const hash = migration.tag;
      if (existingHashes.has(hash)) {
        console.log(`Already marked: ${hash}`);
        continue;
      }

      await sql`
        INSERT INTO "__drizzle_migrations" (hash, created_at)
        VALUES (${hash}, ${Date.now()})
      `;
      console.log(`Marked as applied: ${hash}`);
    }

    console.log('Baseline marking completed');
  } catch (error) {
    console.error('Baseline marking failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

markBaseline();
