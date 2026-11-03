BEGIN;
ALTER TABLE car_requests
  ADD COLUMN target_user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN requester_reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  ADD COLUMN linked_reservation_id    UUID REFERENCES reservations(id) ON DELETE SET NULL,
  ADD COLUMN requested_start          TIMESTAMPTZ,
  ADD COLUMN requested_end            TIMESTAMPTZ;
COMMIT;
