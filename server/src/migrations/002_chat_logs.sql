CREATE TABLE IF NOT EXISTS chat_logs (
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  ip TEXT,
  user_agent TEXT,
  model TEXT,
  used_model TEXT,
  message TEXT NOT NULL,
  reply TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
