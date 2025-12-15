-- Migration: 0001_init
-- Create events table for storing SDK messages

-- Drop old tables if they exist
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS sessions;

-- Create events table with uuid as primary key
CREATE TABLE events (
  uuid TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  message JSONB,
  data JSONB,
  parent_tool_use_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_session_seq ON events(session_id, seq);
