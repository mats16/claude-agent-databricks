-- Migration: 0004_add_auto_sync
-- Add auto_sync column to sessions table

ALTER TABLE sessions ADD COLUMN auto_sync BOOLEAN DEFAULT FALSE NOT NULL;
