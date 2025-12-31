import { eq } from 'drizzle-orm';
import { db } from './index.js';
import {
  users,
  settings,
  type SelectUser,
  type InsertUser,
} from './schema.js';
import { withUserContextInTransaction } from './rls.util.js';

/**
 * Create a new user (pure insert).
 * Does NOT create default settings - that's the responsibility of the service layer.
 *
 * @param id - User ID
 * @param email - User email
 * @returns Created user
 */
export async function createUser(id: string, email: string): Promise<SelectUser> {
  const newUser: InsertUser = {
    id,
    email,
  };
  await db.insert(users).values(newUser);

  const created = await db
    .select()
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return created[0];
}

/**
 * Update user email (pure update).
 *
 * @param id - User ID
 * @param email - New email
 */
export async function updateUserEmail(
  id: string,
  email: string
): Promise<void> {
  await db
    .update(users)
    .set({ email, updatedAt: new Date() })
    .where(eq(users.id, id));
}

// Get user by ID
export async function getUserById(id: string): Promise<SelectUser | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);

  return result[0] ?? null;
}

// Get user by email
export async function getUserByEmail(
  email: string
): Promise<SelectUser | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create user with default settings in a transaction.
 * This ensures atomicity - either both user and settings are created, or neither.
 * Uses withUserContextInTransaction to ensure RLS context is set before any queries.
 *
 * @param id - User ID
 * @param email - User email
 * @param defaultSettings - Default settings to create
 * @returns Created user
 * @throws Error if transaction fails
 */
export async function createUserWithDefaultSettings(
  id: string,
  email: string,
  defaultSettings: { claudeConfigAutoPush: boolean }
): Promise<SelectUser> {
  return withUserContextInTransaction(id, async (tx) => {
    // Create user
    const newUser: InsertUser = { id, email };
    await tx.insert(users).values(newUser);

    // Create default settings
    await tx.insert(settings).values({
      userId: id,
      claudeConfigAutoPush: defaultSettings.claudeConfigAutoPush,
    });

    // Return created user
    const created = await tx
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return created[0];
  });
}
