-- ============================================
-- PTP Native App Schema
-- Run this entire block in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (usually enabled by default)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE program_type AS ENUM ('winter_clinic', 'summer_camp');
CREATE TYPE enrollment_status AS ENUM ('active', 'waitlist', 'cancelled', 'refunded', 'pending');
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled', 'refunded', 'failed');
CREATE TYPE staff_role AS ENUM ('admin', 'coach', 'coordinator');

-- ============================================
-- PROFILES (Parents)
-- ============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  address_line1 TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  hubspot_contact_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for HubSpot sync
CREATE INDEX idx_profiles_hubspot ON profiles(hubspot_contact_id) WHERE hubspot_contact_id IS NOT NULL;

-- ============================================
-- CHILDREN
-- ============================================

CREATE TABLE children (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  birthdate DATE,
  age_at_signup INT,
  gender TEXT,
  skill_level TEXT,
  notes TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_children_parent ON children(parent_id);

-- ============================================
-- EVENTS (Camps/Clinics)
-- ============================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  woo_product_id BIGINT UNIQUE, -- Links to WooCommerce product
  title TEXT NOT NULL,
  program program_type NOT NULL,

  -- Location
  market_slug TEXT NOT NULL, -- main-line, princeton, etc.
  state TEXT NOT NULL, -- PA, NJ, DE, MD, NY
  venue_name TEXT,
  venue_address TEXT,

  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE, -- NULL for single-day clinics
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Capacity
  capacity INT NOT NULL DEFAULT 48,
  waitlist_capacity INT DEFAULT 10,

  -- Flags from WooCommerce
  is_bestseller BOOLEAN DEFAULT FALSE,
  is_almost_full BOOLEAN DEFAULT FALSE,

  -- Meta
  description TEXT,
  age_min INT DEFAULT 6,
  age_max INT DEFAULT 14,
  price_cents INT, -- Store price for display (actual charge in Woo)
  woo_product_url TEXT, -- Direct checkout link

  -- Status
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_market ON events(market_slug);
CREATE INDEX idx_events_state ON events(state);
CREATE INDEX idx_events_program ON events(program);
CREATE INDEX idx_events_date ON events(start_date);
CREATE INDEX idx_events_woo ON events(woo_product_id);

-- ============================================
-- ORDERS (Synced from WooCommerce)
-- ============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  woo_order_id BIGINT UNIQUE NOT NULL,
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Order details
  status order_status NOT NULL DEFAULT 'pending',
  total_cents INT,
  currency TEXT DEFAULT 'USD',

  -- Customer info (from Woo, for matching)
  billing_email TEXT NOT NULL,
  billing_name TEXT,
  billing_phone TEXT,

  -- Child mapping from app
  child_ids UUID[] DEFAULT '{}', -- Array of child UUIDs passed from app

  -- Meta
  woo_created_at TIMESTAMPTZ,
  woo_updated_at TIMESTAMPTZ,
  raw_webhook_data JSONB, -- Store full payload for debugging
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_parent ON orders(parent_id);
CREATE INDEX idx_orders_email ON orders(billing_email);
CREATE INDEX idx_orders_woo ON orders(woo_order_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================
-- ENROLLMENTS (Child → Event link)
-- ============================================

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Status
  status enrollment_status NOT NULL DEFAULT 'pending',
  waitlist_position INT, -- NULL if not on waitlist

  -- Check-in
  checked_in_at TIMESTAMPTZ,
  checked_in_by UUID REFERENCES profiles(id),

  -- QR Code
  qr_code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),

  -- Meta
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate enrollments
  UNIQUE(child_id, event_id)
);

CREATE INDEX idx_enrollments_child ON enrollments(child_id);
CREATE INDEX idx_enrollments_event ON enrollments(event_id);
CREATE INDEX idx_enrollments_parent ON enrollments(parent_id);
CREATE INDEX idx_enrollments_order ON enrollments(order_id);
CREATE INDEX idx_enrollments_qr ON enrollments(qr_code);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================
-- WAIVERS
-- ============================================

CREATE TABLE waivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Waiver status
  is_signed BOOLEAN DEFAULT FALSE,
  signed_at TIMESTAMPTZ,

  -- External waiver (MVP: Google Form link tracking)
  external_waiver_url TEXT,
  external_waiver_submitted BOOLEAN DEFAULT FALSE,

  -- Future: in-app signature
  signature_data TEXT, -- Base64 signature image

  -- Valid for season
  valid_from DATE DEFAULT CURRENT_DATE,
  valid_until DATE DEFAULT (CURRENT_DATE + INTERVAL '1 year'),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(child_id, valid_from)
);

CREATE INDEX idx_waivers_child ON waivers(child_id);
CREATE INDEX idx_waivers_parent ON waivers(parent_id);

-- ============================================
-- STAFF ROLES
-- ============================================

CREATE TABLE staff_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role staff_role NOT NULL DEFAULT 'coach',
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  assigned_markets TEXT[], -- Array of market_slugs they work
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_staff_user ON staff_members(user_id);
CREATE INDEX idx_staff_role ON staff_members(role);

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Event with computed seats_left
CREATE VIEW events_with_availability AS
SELECT
  e.*,
  e.capacity - COALESCE(active_count, 0) AS seats_left,
  COALESCE(active_count, 0) AS enrolled_count,
  COALESCE(waitlist_count, 0) AS waitlist_count,
  CASE
    WHEN e.capacity - COALESCE(active_count, 0) <= 0 THEN TRUE
    ELSE FALSE
  END AS is_sold_out,
  CASE
    WHEN e.capacity - COALESCE(active_count, 0) <= 5
         AND e.capacity - COALESCE(active_count, 0) > 0 THEN TRUE
    ELSE e.is_almost_full
  END AS computed_almost_full
FROM events e
LEFT JOIN (
  SELECT event_id,
         COUNT(*) FILTER (WHERE status = 'active') AS active_count,
         COUNT(*) FILTER (WHERE status = 'waitlist') AS waitlist_count
  FROM enrollments
  GROUP BY event_id
) counts ON e.id = counts.event_id;

-- View: Parent's upcoming events
CREATE VIEW my_upcoming_enrollments AS
SELECT
  en.id AS enrollment_id,
  en.qr_code,
  en.status AS enrollment_status,
  en.checked_in_at,
  c.id AS child_id,
  c.first_name AS child_first_name,
  c.last_name AS child_last_name,
  ev.id AS event_id,
  ev.title AS event_title,
  ev.program,
  ev.market_slug,
  ev.state,
  ev.venue_name,
  ev.start_date,
  ev.end_date,
  ev.start_time,
  ev.end_time,
  en.parent_id
FROM enrollments en
JOIN children c ON en.child_id = c.id
JOIN events ev ON en.event_id = ev.id
WHERE ev.start_date >= CURRENT_DATE
ORDER BY ev.start_date, ev.start_time;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE waivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- CHILDREN POLICIES
-- ============================================

-- Parents can view their own children
CREATE POLICY "Parents can view own children"
  ON children FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can create children
CREATE POLICY "Parents can create children"
  ON children FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Parents can update their own children
CREATE POLICY "Parents can update own children"
  ON children FOR UPDATE
  USING (auth.uid() = parent_id);

-- Parents can delete their own children
CREATE POLICY "Parents can delete own children"
  ON children FOR DELETE
  USING (auth.uid() = parent_id);

-- ============================================
-- EVENTS POLICIES
-- ============================================

-- Anyone authenticated can view published events
CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT
  USING (is_published = TRUE);

-- Service role can manage events (for webhook)
-- (Service role bypasses RLS automatically)

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Parents can view their own orders
CREATE POLICY "Parents can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = parent_id);

-- ============================================
-- ENROLLMENTS POLICIES
-- ============================================

-- Parents can view their own enrollments
CREATE POLICY "Parents can view own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = parent_id);

-- Staff can view all enrollments (for roster)
CREATE POLICY "Staff can view all enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- Staff can update enrollments (for check-in)
CREATE POLICY "Staff can update enrollments for checkin"
  ON enrollments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE user_id = auth.uid()
      AND is_active = TRUE
    )
  );

-- ============================================
-- WAIVERS POLICIES
-- ============================================

-- Parents can view their own waivers
CREATE POLICY "Parents can view own waivers"
  ON waivers FOR SELECT
  USING (auth.uid() = parent_id);

-- Parents can create waivers for their children
CREATE POLICY "Parents can create waivers"
  ON waivers FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Parents can update their own waivers
CREATE POLICY "Parents can update own waivers"
  ON waivers FOR UPDATE
  USING (auth.uid() = parent_id);

-- ============================================
-- STAFF POLICIES
-- ============================================

-- Staff can view their own record
CREATE POLICY "Staff can view own record"
  ON staff_members FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all staff
CREATE POLICY "Admins can view all staff"
  ON staff_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff_members
      WHERE user_id = auth.uid()
      AND role = 'admin'
      AND is_active = TRUE
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_enrollments_updated_at BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_waivers_updated_at BEFORE UPDATE ON waivers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- RPC: Get event roster (for staff)
-- ============================================

CREATE OR REPLACE FUNCTION get_event_roster(p_event_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  child_first_name TEXT,
  child_last_name TEXT,
  child_age INT,
  parent_name TEXT,
  parent_email TEXT,
  parent_phone TEXT,
  enrollment_status enrollment_status,
  checked_in_at TIMESTAMPTZ,
  qr_code TEXT
)
SECURITY DEFINER
AS $$
BEGIN
  -- Check if caller is staff
  IF NOT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Staff access required';
  END IF;

  RETURN QUERY
  SELECT
    en.id AS enrollment_id,
    c.first_name AS child_first_name,
    c.last_name AS child_last_name,
    EXTRACT(YEAR FROM AGE(c.birthdate))::INT AS child_age,
    p.full_name AS parent_name,
    p.email AS parent_email,
    p.phone AS parent_phone,
    en.status AS enrollment_status,
    en.checked_in_at,
    en.qr_code
  FROM enrollments en
  JOIN children c ON en.child_id = c.id
  JOIN profiles p ON en.parent_id = p.id
  WHERE en.event_id = p_event_id
  ORDER BY c.last_name, c.first_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RPC: Check in by QR code (for staff)
-- ============================================

CREATE OR REPLACE FUNCTION check_in_by_qr(p_qr_code TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  v_enrollment enrollments%ROWTYPE;
  v_child children%ROWTYPE;
  v_event events%ROWTYPE;
BEGIN
  -- Check if caller is staff
  IF NOT EXISTS (
    SELECT 1 FROM staff_members
    WHERE user_id = auth.uid()
    AND is_active = TRUE
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Staff access required';
  END IF;

  -- Find enrollment
  SELECT * INTO v_enrollment FROM enrollments WHERE qr_code = p_qr_code;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid QR code');
  END IF;

  IF v_enrollment.status != 'active' THEN
    RETURN json_build_object('success', false, 'error', 'Enrollment is not active', 'status', v_enrollment.status);
  END IF;

  IF v_enrollment.checked_in_at IS NOT NULL THEN
    RETURN json_build_object('success', false, 'error', 'Already checked in', 'checked_in_at', v_enrollment.checked_in_at);
  END IF;

  -- Get child and event info
  SELECT * INTO v_child FROM children WHERE id = v_enrollment.child_id;
  SELECT * INTO v_event FROM events WHERE id = v_enrollment.event_id;

  -- Perform check-in
  UPDATE enrollments
  SET checked_in_at = NOW(), checked_in_by = auth.uid()
  WHERE id = v_enrollment.id;

  RETURN json_build_object(
    'success', true,
    'child_name', v_child.first_name || ' ' || v_child.last_name,
    'event_title', v_event.title,
    'checked_in_at', NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SEED: Market slugs reference (for validation)
-- ============================================

-- Optional: Create a markets reference table
CREATE TABLE markets (
  slug TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  state TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE
);

INSERT INTO markets (slug, display_name, state) VALUES
  ('main-line', 'Main Line', 'PA'),
  ('media', 'Media', 'PA'),
  ('west-chester', 'West Chester', 'PA'),
  ('doylestown', 'Doylestown', 'PA'),
  ('princeton', 'Princeton', 'NJ'),
  ('short-hills', 'Short Hills', 'NJ'),
  ('ridgewood', 'Ridgewood', 'NJ'),
  ('hockessin', 'Hockessin', 'DE'),
  ('scarsdale', 'Scarsdale', 'NY'),
  ('rye', 'Rye', 'NY'),
  ('garden-city', 'Garden City', 'NY');

-- Markets are public read
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view markets" ON markets FOR SELECT USING (TRUE);

-- ============================================
-- GRANT permissions for service role functions
-- ============================================

-- The service role bypasses RLS, but explicit grants ensure clarity
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
