-- v_conversations and v_visits answer "who came and what did they ask". Neither
-- shows an answer, which makes reading a conversation back a join every time.
-- These two do the reading: one row per message for scanning, one row per
-- session for reading the exchange as it happened.

DROP VIEW IF EXISTS v_messages;
CREATE VIEW v_messages AS
SELECT m.created_at,
       s.id AS session_id,
       s.title,
       v.label,
       s.ip_hash,
       v.country,
       m.seq,
       m.role,
       m.status,
       m.model_used,
       m.latency_ms,
       m.content
FROM chat_messages m
JOIN chat_sessions s ON s.id = m.session_id
LEFT JOIN visitors v ON v.token = s.visitor_token;

DROP VIEW IF EXISTS v_transcript;
CREATE VIEW v_transcript AS
SELECT s.id AS session_id,
       s.title,
       s.created_at,
       s.last_message_at,
       s.message_count,
       v.label,
       s.ip_hash,
       v.ua_browser,
       v.country,
       string_agg(
         CASE m.role WHEN 'user' THEN 'Q' ELSE 'A' END ||
         CASE WHEN m.status <> 'ok' THEN ' (' || m.status || ')' ELSE '' END ||
         ': ' || m.content,
         E'\n\n' ORDER BY m.seq
       ) AS dialogue
FROM chat_sessions s
JOIN chat_messages m ON m.session_id = s.id
LEFT JOIN visitors v ON v.token = s.visitor_token
GROUP BY s.id, s.title, s.created_at, s.last_message_at, s.message_count,
         v.label, s.ip_hash, v.ua_browser, v.country;
