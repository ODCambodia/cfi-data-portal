BEGIN;

CREATE TABLE IF NOT EXISTS users (
  user_id INTEGER PRIMARY KEY NOT NULL,
  username VARCHAR(50),
  firstname VARCHAR(50),
  lastname VARCHAR(50),
  type VARCHAR(3) NOT NULL,
  approval_time DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

COMMIT;