import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  integer,
  boolean,
} from 'drizzle-orm/pg-core';

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title'),
  model: text('model').notNull(),
  workspacePath: text('workspace_path'),
  userEmail: text('user_email'),
  autoSync: boolean('auto_sync').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// Events table
export const events = pgTable(
  'events',
  {
    uuid: text('uuid').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    type: text('type').notNull(),
    subtype: text('subtype'),
    message: jsonb('message'),
    data: jsonb('data'),
    parentToolUseId: text('parent_tool_use_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('idx_events_session_id').on(table.sessionId),
    index('idx_events_session_seq').on(table.sessionId, table.seq),
  ]
);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// Settings table (with RLS by user_id)
export const settings = pgTable('settings', {
  userId: text('user_id').primaryKey(),
  accessToken: text('access_token'),
  claudeConfigSync: boolean('claude_config_sync').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
