ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS entitlement_json TEXT;

UPDATE user_profiles
SET entitlement_json = COALESCE(
  entitlement_json,
  '{"plan":"free","isActive":true,"source":"none"}'
);

ALTER TABLE user_profiles
  ALTER COLUMN entitlement_json SET NOT NULL;
