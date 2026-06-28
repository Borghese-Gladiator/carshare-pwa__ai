BEGIN;
CREATE TYPE note_urgency AS ENUM ('urgent', 'fyi');

CREATE TABLE car_notes (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id     UUID         NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  author_id  UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body       TEXT         NOT NULL,
  urgency    note_urgency NOT NULL DEFAULT 'fyi',
  resolved   BOOLEAN      NOT NULL DEFAULT false,
  location   TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);
COMMIT;
