-- Initial schema migration (idempotent)
-- This migration is safe to run multiple times

-- ============================================
-- Users table
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- Sessions table
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  stub TEXT,
  title TEXT,
  model TEXT NOT NULL,
  workspace_path TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  workspace_auto_push BOOLEAN DEFAULT FALSE NOT NULL,
  app_auto_deploy BOOLEAN DEFAULT FALSE NOT NULL,
  cwd TEXT,
  is_archived BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Unique index for stub (partial, allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_stub ON sessions (stub) WHERE stub IS NOT NULL;

-- ============================================
-- Events table
-- ============================================
CREATE TABLE IF NOT EXISTS events (
  uuid TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  type TEXT NOT NULL,
  subtype TEXT,
  message JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_session_seq ON events (session_id, seq);

-- ============================================
-- Settings table
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  claude_config_auto_push BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================
-- OAuth Tokens table
-- ============================================
CREATE TABLE IF NOT EXISTS oauth_tokens (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  auth_type TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT NOT NULL,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  PRIMARY KEY (user_id, provider)
);

-- Add expires_at column if it doesn't exist (for existing databases)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'oauth_tokens' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE oauth_tokens ADD COLUMN expires_at TIMESTAMP;
  END IF;
END $$;

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- Sessions RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sessions_user_policy ON sessions;
CREATE POLICY sessions_user_policy ON sessions
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- Settings RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS settings_user_policy ON settings;
CREATE POLICY settings_user_policy ON settings
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));

-- OAuth Tokens RLS
ALTER TABLE oauth_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS oauth_tokens_user_policy ON oauth_tokens;
CREATE POLICY oauth_tokens_user_policy ON oauth_tokens
  FOR ALL
  USING (user_id = current_setting('app.current_user_id', true))
  WITH CHECK (user_id = current_setting('app.current_user_id', true));
