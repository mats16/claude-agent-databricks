-- Migration: 0003_add_cwd_column
-- Add cwd (current working directory) column to sessions table

ALTER TABLE sessions ADD COLUMN cwd TEXT;
