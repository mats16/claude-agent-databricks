-- Migration: 0003_events_fk
-- Add foreign key constraint on events.session_id referencing sessions.id

-- First, delete orphaned events (events without a corresponding session)
DELETE FROM events
WHERE session_id NOT IN (SELECT id FROM sessions);

-- Add foreign key constraint with ON DELETE CASCADE
ALTER TABLE events
ADD CONSTRAINT fk_events_session_id
FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
