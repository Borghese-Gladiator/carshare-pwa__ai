BEGIN;
CREATE TYPE reservation_status AS ENUM ('pending', 'active', 'completed', 'cancelled');

CREATE TABLE reservations (
  id         UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id     UUID               NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id    UUID               NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ        NOT NULL,
  end_time   TIMESTAMPTZ        NOT NULL,
  title      TEXT,
  purpose    TEXT,
  status     reservation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ        NOT NULL DEFAULT now()
);
COMMIT;
