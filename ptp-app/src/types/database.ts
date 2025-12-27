// Database types matching Supabase schema

export type ProgramType = 'winter_clinic' | 'summer_camp';
export type EnrollmentStatus = 'active' | 'waitlist' | 'cancelled' | 'refunded' | 'pending';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded' | 'failed';
export type StaffRole = 'admin' | 'coach' | 'coordinator';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address_line1: string | null;
  address_city: string | null;
  address_state: string | null;
  address_zip: string | null;
  hubspot_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Child {
  id: string;
  parent_id: string;
  first_name: string;
  last_name: string;
  birthdate: string | null;
  age_at_signup: number | null;
  gender: string | null;
  skill_level: string | null;
  notes: string | null;
  medical_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  woo_product_id: number | null;
  title: string;
  program: ProgramType;
  market_slug: string;
  state: string;
  venue_name: string | null;
  venue_address: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  waitlist_capacity: number | null;
  is_bestseller: boolean;
  is_almost_full: boolean;
  description: string | null;
  age_min: number;
  age_max: number;
  price_cents: number | null;
  woo_product_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventWithAvailability extends Event {
  seats_left: number;
  enrolled_count: number;
  waitlist_count: number;
  is_sold_out: boolean;
  computed_almost_full: boolean;
}

export interface Order {
  id: string;
  woo_order_id: number;
  parent_id: string | null;
  status: OrderStatus;
  total_cents: number | null;
  currency: string;
  billing_email: string;
  billing_name: string | null;
  billing_phone: string | null;
  child_ids: string[];
  woo_created_at: string | null;
  woo_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  child_id: string;
  event_id: string;
  order_id: string | null;
  parent_id: string;
  status: EnrollmentStatus;
  waitlist_position: number | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  qr_code: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Waiver {
  id: string;
  child_id: string;
  parent_id: string;
  is_signed: boolean;
  signed_at: string | null;
  external_waiver_url: string | null;
  external_waiver_submitted: boolean;
  signature_data: string | null;
  valid_from: string;
  valid_until: string;
  created_at: string;
  updated_at: string;
}

export interface StaffMember {
  id: string;
  user_id: string;
  role: StaffRole;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  assigned_markets: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Market {
  slug: string;
  display_name: string;
  state: string;
  is_active: boolean;
}

// View types
export interface MyUpcomingEnrollment {
  enrollment_id: string;
  qr_code: string;
  enrollment_status: EnrollmentStatus;
  checked_in_at: string | null;
  child_id: string;
  child_first_name: string;
  child_last_name: string;
  event_id: string;
  event_title: string;
  program: ProgramType;
  market_slug: string;
  state: string;
  venue_name: string | null;
  start_date: string;
  end_date: string | null;
  start_time: string;
  end_time: string;
  parent_id: string;
}

// RPC return types
export interface EventRosterEntry {
  enrollment_id: string;
  child_first_name: string;
  child_last_name: string;
  child_age: number | null;
  parent_name: string | null;
  parent_email: string;
  parent_phone: string | null;
  enrollment_status: EnrollmentStatus;
  checked_in_at: string | null;
  qr_code: string;
}

export interface CheckInResult {
  success: boolean;
  error?: string;
  child_name?: string;
  event_title?: string;
  checked_in_at?: string;
  status?: EnrollmentStatus;
}
