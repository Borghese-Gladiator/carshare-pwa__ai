BEGIN;
CREATE TABLE cars (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  details    TEXT,
  fuel       NUMERIC(5,2),
  mileage    INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
COMMIT;
