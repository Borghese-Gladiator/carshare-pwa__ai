BEGIN;
CREATE TYPE request_type   AS ENUM ('borrow_now', 'swap');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'declined');

CREATE TABLE car_requests (
  id                    UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  car_id                UUID           NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
  requester_id          UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_reservation_id UUID           REFERENCES reservations(id) ON DELETE SET NULL,
  type                  request_type   NOT NULL,
  status                request_status NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now()
);
COMMIT;
