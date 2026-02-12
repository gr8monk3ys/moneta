ALTER TABLE refresh_tokens
  ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT 'legacy',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

UPDATE refresh_tokens SET session_id = COALESCE(session_id, 'legacy');
UPDATE refresh_tokens SET created_at = COALESCE(created_at, NOW());

ALTER TABLE refresh_tokens ALTER COLUMN session_id SET NOT NULL;
ALTER TABLE refresh_tokens ALTER COLUMN created_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_session
  ON refresh_tokens (user_id, session_id);
