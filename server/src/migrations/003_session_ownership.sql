-- Sessions predating this migration have no owner, so they stop being listed.
-- That is the point: until now every visitor could read every other visitor's chat.

ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS owner_token TEXT;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_owner
  ON chat_sessions (owner_token, created_at DESC);

ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_session_id_fkey;
ALTER TABLE chat_history ADD CONSTRAINT chat_history_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE;

ALTER TABLE chat_history DROP CONSTRAINT IF EXISTS chat_history_session_present;
ALTER TABLE chat_history ADD CONSTRAINT chat_history_session_present
  CHECK (session_id IS NOT NULL) NOT VALID;

CREATE INDEX IF NOT EXISTS idx_chat_logs_created ON chat_logs (created_at);
