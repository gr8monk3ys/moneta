ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS completed_lessons_json TEXT;

UPDATE user_profiles
SET completed_lessons_json = COALESCE(completed_lessons_json, '{}');

ALTER TABLE user_profiles
  ALTER COLUMN completed_lessons_json SET NOT NULL;
