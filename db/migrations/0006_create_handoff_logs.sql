BEGIN;
CREATE TYPE handoff_type AS ENUM ('pickup', 'return');

CREATE TABLE handoff_logs (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id           UUID         NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  user_id          UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type             handoff_type NOT NULL,
  parking_location TEXT,
  fuel             NUMERIC(5,2),
  mileage          INTEGER,
  logged_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMIT;
