export type ReservationStatus = 'pending' | 'active' | 'completed' | 'cancelled';
export type NoteUrgency       = 'urgent' | 'fyi';
export type HandoffType       = 'pickup' | 'return';
export type RequestType       = 'borrow_now' | 'swap';
export type RequestStatus     = 'pending' | 'accepted' | 'declined';

export interface Group {
  id: string;
  name: string;
  created_at: Date;
}

export interface User {
  id: string;
  name: string;
  avatar: string | null;
  group_id: string;
  created_at: Date;
}

export interface Car {
  id: string;
  group_id: string;
  name: string;
  details: string | null;
  fuel: string | null;
  mileage: number | null;
  created_at: Date;
}

export interface Reservation {
  id: string;
  car_id: string;
  user_id: string;
  start_time: Date;
  end_time: Date;
  title: string | null;
  purpose: string | null;
  status: ReservationStatus;
  created_at: Date;
}

export interface CarNote {
  id: string;
  car_id: string;
  author_id: string;
  body: string;
  urgency: NoteUrgency;
  resolved: boolean;
  location: string | null;
  created_at: Date;
}

export interface HandoffLog {
  id: string;
  car_id: string;
  user_id: string;
  type: HandoffType;
  parking_location: string | null;
  fuel: string | null;
  mileage: number | null;
  logged_at: Date;
}

export interface CarRequest {
  id: string;
  car_id: string;
  requester_id: string;
  target_reservation_id: string | null;
  type: RequestType;
  status: RequestStatus;
  created_at: Date;
}
