-- Migration: 0004_add_is_archived
-- Add is_archived column to sessions table

ALTER TABLE sessions ADD COLUMN is_archived BOOLEAN DEFAULT FALSE NOT NULL;
CREATE INDEX idx_sessions_user_archived ON sessions(user_id, is_archived);
