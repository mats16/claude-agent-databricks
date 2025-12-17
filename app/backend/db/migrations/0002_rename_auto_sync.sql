-- Rename auto_sync column to auto_workspace_push
ALTER TABLE sessions RENAME COLUMN auto_sync TO auto_workspace_push;
