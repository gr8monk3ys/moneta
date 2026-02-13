CREATE TABLE IF NOT EXISTS billing_webhook_events (
  event_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  product_id TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT fk_billing_webhook_user FOREIGN KEY (user_id) REFERENCES auth_users(user_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_events_user_id
  ON billing_webhook_events (user_id);
