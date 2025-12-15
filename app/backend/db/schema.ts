import {
  pgTable,
  text,
  timestamp,
  jsonb,
  index,
  integer,
} from 'drizzle-orm/pg-core';

export const events = pgTable(
  'events',
  {
    uuid: text('uuid').primaryKey(),
    sessionId: text('session_id').notNull(),
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
