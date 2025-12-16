-- Migration: 0005_add_settings
-- Add settings table with Row Level Security (RLS)

-- Create settings table (if not exists)
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY,
  access_token TEXT,
  claude_config_sync BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists, then create
DROP POLICY IF EXISTS settings_user_policy ON settings;

-- Create policy: users can only access their own settings
-- Uses app.current_user_id session variable set by application
CREATE POLICY settings_user_policy ON settings
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
