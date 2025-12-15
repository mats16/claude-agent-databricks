import { eq, desc } from 'drizzle-orm';
import { db } from './index.js';
import { sessions, type NewSession, type Session } from './schema.js';

// Create a new session
export async function createSession(session: NewSession): Promise<void> {
  await db.insert(sessions).values(session);
}

// Get session by ID
export async function getSessionById(id: string): Promise<Session | null> {
  const result = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, id))
    .limit(1);

  return result[0] ?? null;
}

// Get all sessions (ordered by created_at desc)
export async function getSessions(): Promise<Session[]> {
  return db.select().from(sessions).orderBy(desc(sessions.createdAt));
}

// Get sessions by user email
export async function getSessionsByUserEmail(
  userEmail: string
): Promise<Session[]> {
  return db
    .select()
    .from(sessions)
    .where(eq(sessions.userEmail, userEmail))
    .orderBy(desc(sessions.createdAt));
}

// Update session title
export async function updateSessionTitle(
  id: string,
  title: string
): Promise<void> {
  await db
    .update(sessions)
    .set({ title, updatedAt: new Date() })
    .where(eq(sessions.id, id));
}
