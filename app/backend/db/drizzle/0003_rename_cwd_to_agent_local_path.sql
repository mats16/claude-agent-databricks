-- Rename cwd column to agentLocalPath
-- Migration: 0003_rename_cwd_to_agent_local_path.sql

-- Check if cwd column exists and agentLocalPath doesn't before renaming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'cwd'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sessions' AND column_name = 'agentLocalPath'
  ) THEN
    ALTER TABLE sessions RENAME COLUMN cwd TO "agentLocalPath";
  END IF;
END $$;
