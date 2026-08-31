-- Conversations used to live in two places: chat_history for what the visitor sees,
-- chat_logs for everything worth reviewing. The same text was written twice and the
-- interesting half had no foreign key. One table now holds the turn and its outcome,
-- and visitors get a row of their own so a salted hash can replace the raw address
-- that used to sit on every log line.

DROP VIEW  IF EXISTS v_visits;
DROP VIEW  IF EXISTS v_conversations;
DROP TABLE IF EXISTS chat_logs;
DROP TABLE IF EXISTS chat_history;
DROP TABLE IF EXISTS chat_sessions;

CREATE TABLE visitors (
  token       TEXT PRIMARY KEY,
  label       TEXT,
  ip_hash     TEXT,
  ua_browser  TEXT,
  ua_os       TEXT,
  is_bot      BOOLEAN NOT NULL DEFAULT FALSE,
  country     TEXT,
  first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chat_sessions (
  id              TEXT PRIMARY KEY,
  visitor_token   TEXT NOT NULL REFERENCES visitors(token) ON DELETE CASCADE,
  title           TEXT,
  model           TEXT,
  ip_hash         TEXT,
  message_count   INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ
);

CREATE INDEX idx_chat_sessions_visitor
  ON chat_sessions (visitor_token, (COALESCE(last_message_at, created_at)) DESC);

CREATE TABLE chat_messages (
  id          BIGSERIAL PRIMARY KEY,
  session_id  TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  seq         INT  NOT NULL,
  role        TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'refused', 'error')),
  model       TEXT,
  model_used  TEXT,
  error       TEXT,
  latency_ms  INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, seq)
);

CREATE INDEX idx_chat_messages_session ON chat_messages (session_id, seq);

-- One row per conversation, with the visitor already joined in.
CREATE VIEW v_conversations AS
SELECT s.id,
       s.created_at,
       s.last_message_at,
       s.message_count,
       s.model,
       v.label,
       s.ip_hash,
       v.ua_browser,
       v.ua_os,
       v.is_bot,
       v.country,
       (SELECT m.content FROM chat_messages m
         WHERE m.session_id = s.id AND m.role = 'user'
         ORDER BY m.seq LIMIT 1) AS first_question,
       (SELECT string_agg(m.content, ' | ' ORDER BY m.seq) FROM chat_messages m
         WHERE m.session_id = s.id AND m.role = 'user') AS all_questions,
       (SELECT count(*) FROM chat_messages m
         WHERE m.session_id = s.id AND m.role = 'user'
           AND m.status = 'refused') AS refused_turns
FROM chat_sessions s
LEFT JOIN visitors v ON v.token = s.visitor_token;

-- One row per sitting. Sessions of the same visitor less than 30 minutes
-- apart are one visit, which is how a person actually reads as a person.
CREATE VIEW v_visits AS
WITH ordered AS (
  SELECT s.visitor_token,
         s.title,
         s.message_count,
         s.created_at,
         s.last_message_at,
         CASE
           WHEN LAG(s.created_at) OVER (PARTITION BY s.visitor_token ORDER BY s.created_at)
                > s.created_at - INTERVAL '30 minutes'
           THEN 0 ELSE 1
         END AS starts_visit
  FROM chat_sessions s
),
grouped AS (
  SELECT ordered.*,
         SUM(starts_visit) OVER (
           PARTITION BY visitor_token ORDER BY created_at ROWS UNBOUNDED PRECEDING
         ) AS visit_no
  FROM ordered
)
SELECT g.visitor_token,
       g.visit_no,
       v.label,
       v.ip_hash,
       v.ua_browser,
       v.ua_os,
       v.is_bot,
       v.country,
       MIN(g.created_at) AS started_at,
       MAX(COALESCE(g.last_message_at, g.created_at)) AS ended_at,
       count(*) AS sessions,
       SUM(g.message_count) AS messages,
       string_agg(g.title, ' | ' ORDER BY g.created_at) AS titles
FROM grouped g
LEFT JOIN visitors v ON v.token = g.visitor_token
GROUP BY g.visitor_token, g.visit_no, v.label, v.ip_hash,
         v.ua_browser, v.ua_os, v.is_bot, v.country;
