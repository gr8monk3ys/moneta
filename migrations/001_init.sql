CREATE TABLE IF NOT EXISTS auth_users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
  user_id TEXT PRIMARY KEY,
  current_level TEXT NOT NULL,
  streak_days INTEGER NOT NULL,
  last_active_date TEXT,
  skills_json TEXT NOT NULL
);
