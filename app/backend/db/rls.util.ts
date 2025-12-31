import { sql } from 'drizzle-orm';
import type { PgTransaction } from 'drizzle-orm/pg-core';
import type { PostgresJsQueryResultHKT } from 'drizzle-orm/postgres-js';
import { db } from './index.js';
import type * as schema from './schema.js';

/**
 * Transaction type for PostgreSQL with schema.
 * This provides compile-time type safety for transaction operations.
 */
export type DbTransaction = PgTransaction<
  PostgresJsQueryResultHKT,
  typeof schema,
  Record<string, never>
>;

/**
 * Helper to execute database queries with RLS (Row Level Security) user context.
 * Sets the PostgreSQL session variable 'app.current_user_id' to enable RLS policies.
 *
 * @param userId - The user ID to set in the RLS context
 * @param fn - The database operation to execute within the user context
 * @returns The result of the database operation
 *
 * @example
 * ```typescript
 * const sessions = await withUserContext(userId, async () => {
 *   return db.select().from(sessions).where(eq(sessions.userId, userId));
 * });
 * ```
 */
export async function withUserContext<T>(
  userId: string,
  fn: () => Promise<T>
): Promise<T> {
  // Set the user context for RLS policy
  // Using set_config() instead of SET LOCAL because it supports parameterized queries
  // The third parameter (true) makes it local to the current transaction
  await db.execute(
    sql`SELECT set_config('app.current_user_id', ${userId}, true)`
  );
  return fn();
}

/**
 * Helper to execute database operations within a transaction with RLS user context.
 * Ensures RLS context is set at the beginning of the transaction for security.
 *
 * @param userId - The user ID to set in the RLS context
 * @param fn - The database operation to execute within the transaction
 * @returns The result of the database operation
 *
 * @example
 * ```typescript
 * const user = await withUserContextInTransaction(userId, async (tx) => {
 *   await tx.insert(users).values({ id: userId, email });
 *   await tx.insert(settings).values({ userId, ...defaultSettings });
 *   return tx.select().from(users).where(eq(users.id, userId));
 * });
 * ```
 */
export async function withUserContextInTransaction<T>(
  userId: string,
  fn: (tx: DbTransaction) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    // Set RLS context FIRST, before any other queries
    await tx.execute(
      sql`SELECT set_config('app.current_user_id', ${userId}, true)`
    );
    return fn(tx);
  });
}
