-- ============================================
-- PTP Training Platform Extension
-- Run AFTER the main schema.sql
-- ============================================

-- ============================================
-- ENUMS FOR TRAINING
-- ============================================

CREATE TYPE training_focus AS ENUM (
  '1v1',
  'finishing',
  'passing',
  'dribbling',
  'shooting',
  'goalkeeper',
  'defense',
  'midfield',
  'confidence',
  'speed_agility',
  'game_iq',
  'general'
);

CREATE TYPE session_status AS ENUM (
  'requested',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show'
);

CREATE TYPE player_position AS ENUM (
  'goalkeeper',
  'defender',
  'midfielder',
  'forward',
  'any'
);

CREATE TYPE payout_status AS ENUM (
  'pending',
  'processing',
  'completed',
  'failed'
);

-- ============================================
-- TRAINERS (extends profiles)
-- ============================================

CREATE TABLE trainers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Basic info
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  -- Professional background
  college_pro TEXT NOT NULL, -- "Villanova University" or "Philadelphia Union"
  position player_position NOT NULL,
  years_experience INT DEFAULT 0,

  -- Bio & Teaching
  bio TEXT,
  tagline TEXT, -- "Villanova forward | 1v1 & finishing"
  teaching_style TEXT,
  specialties training_focus[] DEFAULT '{}',

  -- Pricing
  hourly_rate INT NOT NULL DEFAULT 80, -- in dollars

  -- Media
  headshot_url TEXT,
  gallery_urls TEXT[] DEFAULT '{}',
  intro_video_url TEXT,

  -- Ratings (denormalized for performance)
  rating DECIMAL(3,2) DEFAULT 5.00,
  review_count INT DEFAULT 0,
  total_sessions INT DEFAULT 0,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  is_background_checked BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_accepting_students BOOLEAN DEFAULT TRUE,

  -- Stripe Connect
  stripe_account_id TEXT,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trainers_user ON trainers(user_id);
CREATE INDEX idx_trainers_rating ON trainers(rating DESC) WHERE is_active = TRUE;
CREATE INDEX idx_trainers_specialties ON trainers USING GIN(specialties);
CREATE INDEX idx_trainers_position ON trainers(position);

-- ============================================
-- TRAINER SERVICE LOCATIONS
-- ============================================

CREATE TABLE trainer_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

  name TEXT NOT NULL, -- "Steelyard Sports"
  address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL, -- PA, NJ, DE, MD, NY
  zip TEXT,
  market_slug TEXT NOT NULL REFERENCES markets(slug),

  is_home_base BOOLEAN DEFAULT FALSE,
  travel_radius_miles INT DEFAULT 10,

  -- Coordinates for distance search
  lat DECIMAL(10, 8),
  lng DECIMAL(11, 8),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trainer_locations_trainer ON trainer_locations(trainer_id);
CREATE INDEX idx_trainer_locations_market ON trainer_locations(market_slug);
CREATE INDEX idx_trainer_locations_geo ON trainer_locations(lat, lng);

-- ============================================
-- TRAINER AVAILABILITY
-- ============================================

CREATE TABLE trainer_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

  -- Recurring weekly schedule
  day_of_week INT NOT NULL, -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,

  -- Optional: specific date override
  specific_date DATE, -- If set, overrides recurring for this date
  is_available BOOLEAN DEFAULT TRUE, -- FALSE = blocked off

  location_id UUID REFERENCES trainer_locations(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(trainer_id, day_of_week, start_time) -- Prevent duplicate time slots
);

CREATE INDEX idx_trainer_avail_trainer ON trainer_availability(trainer_id);
CREATE INDEX idx_trainer_avail_day ON trainer_availability(day_of_week);
CREATE INDEX idx_trainer_avail_date ON trainer_availability(specific_date) WHERE specific_date IS NOT NULL;

-- ============================================
-- TRAINING SESSIONS
-- ============================================

CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Participants
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,

  -- Schedule
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,

  -- Location
  location_id UUID REFERENCES trainer_locations(id),
  location_name TEXT NOT NULL,
  location_address TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,

  -- Session details
  focus training_focus[] DEFAULT '{}',
  player_notes TEXT, -- Notes from parent before session
  trainer_notes TEXT, -- Notes from trainer after session
  homework TEXT, -- Trainer's homework for player

  -- Status
  status session_status NOT NULL DEFAULT 'requested',

  -- Payment
  price_cents INT NOT NULL,
  platform_fee_cents INT DEFAULT 0, -- PTP's cut
  trainer_payout_cents INT, -- trainer_payout = price - platform_fee
  is_paid BOOLEAN DEFAULT FALSE,
  payment_intent_id TEXT, -- Stripe payment intent
  paid_at TIMESTAMPTZ,

  -- Ratings (after completion)
  effort_rating INT CHECK (effort_rating >= 1 AND effort_rating <= 5),
  attitude_rating INT CHECK (attitude_rating >= 1 AND attitude_rating <= 5),

  -- Request management
  preferred_slots JSONB, -- [{date, start_time, end_time}, ...] for initial request
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_trainer ON training_sessions(trainer_id);
CREATE INDEX idx_sessions_parent ON training_sessions(parent_id);
CREATE INDEX idx_sessions_child ON training_sessions(child_id);
CREATE INDEX idx_sessions_date ON training_sessions(session_date);
CREATE INDEX idx_sessions_status ON training_sessions(status);
CREATE INDEX idx_sessions_trainer_date ON training_sessions(trainer_id, session_date);

-- ============================================
-- TRAINER REVIEWS
-- ============================================

CREATE TABLE trainer_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,

  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Response from trainer
  trainer_response TEXT,
  responded_at TIMESTAMPTZ,

  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(session_id) -- One review per session
);

CREATE INDEX idx_reviews_trainer ON trainer_reviews(trainer_id);
CREATE INDEX idx_reviews_rating ON trainer_reviews(trainer_id, rating);

-- ============================================
-- TRAINER PAYOUTS
-- ============================================

CREATE TABLE trainer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,

  amount_cents INT NOT NULL,
  status payout_status NOT NULL DEFAULT 'pending',

  -- Sessions included in this payout
  session_ids UUID[] DEFAULT '{}',

  -- Stripe
  stripe_transfer_id TEXT,
  stripe_payout_id TEXT,

  initiated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payouts_trainer ON trainer_payouts(trainer_id);
CREATE INDEX idx_payouts_status ON trainer_payouts(status);

-- ============================================
-- TRAINER FAVORITES (parents can favorite trainers)
-- ============================================

CREATE TABLE trainer_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(parent_id, trainer_id)
);

CREATE INDEX idx_favorites_parent ON trainer_favorites(parent_id);
CREATE INDEX idx_favorites_trainer ON trainer_favorites(trainer_id);

-- ============================================
-- VIEWS
-- ============================================

-- Trainer card view (for listings)
CREATE VIEW trainer_cards AS
SELECT
  t.id,
  t.user_id,
  t.first_name,
  t.last_name,
  t.college_pro,
  t.position,
  t.tagline,
  t.specialties,
  t.hourly_rate,
  t.rating,
  t.review_count,
  t.total_sessions,
  t.headshot_url,
  t.is_verified,
  t.is_accepting_students,
  -- Home base location
  (
    SELECT jsonb_build_object(
      'city', tl.city,
      'state', tl.state,
      'market_slug', tl.market_slug
    )
    FROM trainer_locations tl
    WHERE tl.trainer_id = t.id AND tl.is_home_base = TRUE
    LIMIT 1
  ) AS home_location,
  -- All markets served
  (
    SELECT array_agg(DISTINCT tl.market_slug)
    FROM trainer_locations tl
    WHERE tl.trainer_id = t.id
  ) AS markets_served
FROM trainers t
WHERE t.is_active = TRUE;

-- Parent's training sessions view
CREATE VIEW my_training_sessions AS
SELECT
  ts.id AS session_id,
  ts.session_date,
  ts.start_time,
  ts.end_time,
  ts.status,
  ts.price_cents,
  ts.is_paid,
  ts.location_name,
  ts.city,
  ts.state,
  ts.focus,
  ts.player_notes,
  ts.trainer_notes,
  -- Child info
  c.id AS child_id,
  c.first_name AS child_first_name,
  c.last_name AS child_last_name,
  -- Trainer info
  t.id AS trainer_id,
  t.first_name AS trainer_first_name,
  t.last_name AS trainer_last_name,
  t.college_pro AS trainer_college,
  t.headshot_url AS trainer_headshot,
  t.rating AS trainer_rating,
  -- Parent
  ts.parent_id,
  ts.created_at
FROM training_sessions ts
JOIN trainers t ON ts.trainer_id = t.id
LEFT JOIN children c ON ts.child_id = c.id;

-- Trainer's session view (for their dashboard)
CREATE VIEW trainer_session_dashboard AS
SELECT
  ts.id AS session_id,
  ts.session_date,
  ts.start_time,
  ts.end_time,
  ts.status,
  ts.price_cents,
  ts.trainer_payout_cents,
  ts.is_paid,
  ts.location_name,
  ts.city,
  ts.focus,
  ts.player_notes,
  -- Child info
  c.id AS child_id,
  c.first_name AS child_first_name,
  c.last_name AS child_last_name,
  c.birthdate AS child_birthdate,
  c.skill_level AS child_skill_level,
  -- Parent info
  p.id AS parent_id,
  p.full_name AS parent_name,
  p.email AS parent_email,
  p.phone AS parent_phone,
  -- Trainer
  ts.trainer_id,
  ts.created_at
FROM training_sessions ts
LEFT JOIN children c ON ts.child_id = c.id
JOIN profiles p ON ts.parent_id = p.id;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_favorites ENABLE ROW LEVEL SECURITY;

-- TRAINERS POLICIES
-- Anyone can view active trainers
CREATE POLICY "Anyone can view active trainers"
  ON trainers FOR SELECT
  USING (is_active = TRUE);

-- Trainers can update their own profile
CREATE POLICY "Trainers can update own profile"
  ON trainers FOR UPDATE
  USING (auth.uid() = user_id);

-- TRAINER LOCATIONS POLICIES
-- Anyone can view trainer locations
CREATE POLICY "Anyone can view trainer locations"
  ON trainer_locations FOR SELECT
  USING (TRUE);

-- Trainers can manage their locations
CREATE POLICY "Trainers can manage own locations"
  ON trainer_locations FOR ALL
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- TRAINER AVAILABILITY POLICIES
-- Anyone can view availability
CREATE POLICY "Anyone can view trainer availability"
  ON trainer_availability FOR SELECT
  USING (TRUE);

-- Trainers can manage their availability
CREATE POLICY "Trainers can manage own availability"
  ON trainer_availability FOR ALL
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- TRAINING SESSIONS POLICIES
-- Parents can view their own sessions
CREATE POLICY "Parents can view own sessions"
  ON training_sessions FOR SELECT
  USING (auth.uid() = parent_id);

-- Trainers can view their sessions
CREATE POLICY "Trainers can view their sessions"
  ON training_sessions FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Parents can create session requests
CREATE POLICY "Parents can request sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Trainers can update their sessions (confirm, complete, cancel)
CREATE POLICY "Trainers can update their sessions"
  ON training_sessions FOR UPDATE
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- Parents can update their sessions (cancel)
CREATE POLICY "Parents can update own sessions"
  ON training_sessions FOR UPDATE
  USING (auth.uid() = parent_id);

-- TRAINER REVIEWS POLICIES
-- Anyone can view visible reviews
CREATE POLICY "Anyone can view reviews"
  ON trainer_reviews FOR SELECT
  USING (is_visible = TRUE);

-- Parents can create reviews for their sessions
CREATE POLICY "Parents can create reviews"
  ON trainer_reviews FOR INSERT
  WITH CHECK (auth.uid() = parent_id);

-- Trainers can respond to their reviews
CREATE POLICY "Trainers can respond to reviews"
  ON trainer_reviews FOR UPDATE
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- TRAINER PAYOUTS POLICIES
-- Trainers can view their own payouts
CREATE POLICY "Trainers can view own payouts"
  ON trainer_payouts FOR SELECT
  USING (
    trainer_id IN (
      SELECT id FROM trainers WHERE user_id = auth.uid()
    )
  );

-- TRAINER FAVORITES POLICIES
-- Parents can manage their favorites
CREATE POLICY "Parents can manage favorites"
  ON trainer_favorites FOR ALL
  USING (auth.uid() = parent_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function: Get trainer availability for a date range
CREATE OR REPLACE FUNCTION get_trainer_availability(
  p_trainer_id UUID,
  p_date_from DATE,
  p_date_to DATE
)
RETURNS TABLE (
  available_date DATE,
  start_time TIME,
  end_time TIME,
  is_booked BOOLEAN,
  location_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH date_range AS (
    SELECT generate_series(p_date_from, p_date_to, '1 day'::interval)::DATE AS the_date
  ),
  recurring_slots AS (
    SELECT
      dr.the_date,
      ta.start_time,
      ta.end_time,
      tl.name AS location_name
    FROM date_range dr
    JOIN trainer_availability ta ON ta.trainer_id = p_trainer_id
      AND ta.day_of_week = EXTRACT(DOW FROM dr.the_date)
      AND ta.specific_date IS NULL
      AND ta.is_available = TRUE
    LEFT JOIN trainer_locations tl ON ta.location_id = tl.id
  ),
  specific_slots AS (
    SELECT
      ta.specific_date AS the_date,
      ta.start_time,
      ta.end_time,
      tl.name AS location_name
    FROM trainer_availability ta
    LEFT JOIN trainer_locations tl ON ta.location_id = tl.id
    WHERE ta.trainer_id = p_trainer_id
      AND ta.specific_date BETWEEN p_date_from AND p_date_to
      AND ta.is_available = TRUE
  ),
  all_slots AS (
    SELECT * FROM recurring_slots
    UNION ALL
    SELECT * FROM specific_slots
  ),
  booked_slots AS (
    SELECT session_date, start_time
    FROM training_sessions
    WHERE trainer_id = p_trainer_id
      AND session_date BETWEEN p_date_from AND p_date_to
      AND status IN ('confirmed', 'pending')
  )
  SELECT
    s.the_date AS available_date,
    s.start_time,
    s.end_time,
    EXISTS (
      SELECT 1 FROM booked_slots b
      WHERE b.session_date = s.the_date
        AND b.start_time = s.start_time
    ) AS is_booked,
    s.location_name
  FROM all_slots s
  ORDER BY s.the_date, s.start_time;
END;
$$;

-- Function: Request a training session
CREATE OR REPLACE FUNCTION request_training_session(
  p_trainer_id UUID,
  p_child_id UUID,
  p_preferred_slots JSONB, -- [{date, start_time, end_time}, ...]
  p_focus training_focus[],
  p_notes TEXT DEFAULT NULL,
  p_location_preference TEXT DEFAULT 'trainer' -- 'trainer' or 'custom'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id UUID;
  v_trainer trainers%ROWTYPE;
  v_session_id UUID;
  v_location trainer_locations%ROWTYPE;
  v_first_slot JSONB;
BEGIN
  -- Get parent ID from auth
  v_parent_id := auth.uid();
  IF v_parent_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Verify child belongs to parent
  IF p_child_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM children WHERE id = p_child_id AND parent_id = v_parent_id) THEN
      RETURN json_build_object('success', false, 'error', 'Child not found');
    END IF;
  END IF;

  -- Get trainer
  SELECT * INTO v_trainer FROM trainers WHERE id = p_trainer_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Trainer not found');
  END IF;

  -- Get trainer's home location
  SELECT * INTO v_location FROM trainer_locations
  WHERE trainer_id = p_trainer_id AND is_home_base = TRUE
  LIMIT 1;

  -- Get first preferred slot for initial booking
  v_first_slot := p_preferred_slots->0;

  -- Create session request
  INSERT INTO training_sessions (
    trainer_id,
    parent_id,
    child_id,
    session_date,
    start_time,
    end_time,
    duration_minutes,
    location_id,
    location_name,
    location_address,
    city,
    state,
    focus,
    player_notes,
    status,
    price_cents,
    platform_fee_cents,
    trainer_payout_cents,
    preferred_slots
  ) VALUES (
    p_trainer_id,
    v_parent_id,
    p_child_id,
    (v_first_slot->>'date')::DATE,
    (v_first_slot->>'start_time')::TIME,
    (v_first_slot->>'end_time')::TIME,
    60,
    v_location.id,
    COALESCE(v_location.name, 'TBD'),
    v_location.address,
    COALESCE(v_location.city, 'TBD'),
    COALESCE(v_location.state, 'PA'),
    p_focus,
    p_notes,
    'requested',
    v_trainer.hourly_rate * 100,
    (v_trainer.hourly_rate * 100 * 0.15)::INT, -- 15% platform fee
    (v_trainer.hourly_rate * 100 * 0.85)::INT,
    p_preferred_slots
  )
  RETURNING id INTO v_session_id;

  RETURN json_build_object(
    'success', true,
    'session_id', v_session_id,
    'message', 'Session request sent! The trainer will respond within 24 hours.'
  );
END;
$$;

-- Function: Trainer confirms/declines session
CREATE OR REPLACE FUNCTION respond_to_session(
  p_session_id UUID,
  p_action TEXT, -- 'confirm' or 'decline'
  p_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_session training_sessions%ROWTYPE;
BEGIN
  -- Get trainer ID from auth
  SELECT id INTO v_trainer_id FROM trainers WHERE user_id = auth.uid();
  IF v_trainer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a trainer');
  END IF;

  -- Get session
  SELECT * INTO v_session FROM training_sessions
  WHERE id = p_session_id AND trainer_id = v_trainer_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.status NOT IN ('requested', 'pending') THEN
    RETURN json_build_object('success', false, 'error', 'Session cannot be modified');
  END IF;

  IF p_action = 'confirm' THEN
    UPDATE training_sessions
    SET status = 'confirmed', confirmed_at = NOW(), updated_at = NOW()
    WHERE id = p_session_id;

    RETURN json_build_object('success', true, 'message', 'Session confirmed');
  ELSIF p_action = 'decline' THEN
    UPDATE training_sessions
    SET status = 'cancelled', cancelled_at = NOW(), cancellation_reason = p_message, updated_at = NOW()
    WHERE id = p_session_id;

    RETURN json_build_object('success', true, 'message', 'Session declined');
  ELSE
    RETURN json_build_object('success', false, 'error', 'Invalid action');
  END IF;
END;
$$;

-- Function: Complete a session
CREATE OR REPLACE FUNCTION complete_session(
  p_session_id UUID,
  p_trainer_notes TEXT DEFAULT NULL,
  p_homework TEXT DEFAULT NULL,
  p_effort_rating INT DEFAULT NULL,
  p_attitude_rating INT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_session training_sessions%ROWTYPE;
BEGIN
  -- Get trainer ID from auth
  SELECT id INTO v_trainer_id FROM trainers WHERE user_id = auth.uid();
  IF v_trainer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a trainer');
  END IF;

  -- Get session
  SELECT * INTO v_session FROM training_sessions
  WHERE id = p_session_id AND trainer_id = v_trainer_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.status != 'confirmed' THEN
    RETURN json_build_object('success', false, 'error', 'Session must be confirmed to complete');
  END IF;

  -- Update session
  UPDATE training_sessions
  SET
    status = 'completed',
    completed_at = NOW(),
    trainer_notes = p_trainer_notes,
    homework = p_homework,
    effort_rating = p_effort_rating,
    attitude_rating = p_attitude_rating,
    updated_at = NOW()
  WHERE id = p_session_id;

  -- Update trainer stats
  UPDATE trainers
  SET total_sessions = total_sessions + 1
  WHERE id = v_trainer_id;

  RETURN json_build_object('success', true, 'message', 'Session completed');
END;
$$;

-- Function: Submit review
CREATE OR REPLACE FUNCTION submit_trainer_review(
  p_session_id UUID,
  p_rating INT,
  p_comment TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_parent_id UUID;
  v_session training_sessions%ROWTYPE;
  v_new_rating DECIMAL;
  v_new_count INT;
BEGIN
  v_parent_id := auth.uid();
  IF v_parent_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get session
  SELECT * INTO v_session FROM training_sessions
  WHERE id = p_session_id AND parent_id = v_parent_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Session not found');
  END IF;

  IF v_session.status != 'completed' THEN
    RETURN json_build_object('success', false, 'error', 'Can only review completed sessions');
  END IF;

  -- Check if already reviewed
  IF EXISTS (SELECT 1 FROM trainer_reviews WHERE session_id = p_session_id) THEN
    RETURN json_build_object('success', false, 'error', 'Already reviewed');
  END IF;

  -- Insert review
  INSERT INTO trainer_reviews (trainer_id, parent_id, session_id, rating, comment)
  VALUES (v_session.trainer_id, v_parent_id, p_session_id, p_rating, p_comment);

  -- Update trainer rating (recalculate average)
  SELECT AVG(rating), COUNT(*) INTO v_new_rating, v_new_count
  FROM trainer_reviews
  WHERE trainer_id = v_session.trainer_id AND is_visible = TRUE;

  UPDATE trainers
  SET rating = v_new_rating, review_count = v_new_count
  WHERE id = v_session.trainer_id;

  RETURN json_build_object('success', true, 'message', 'Review submitted. Thank you!');
END;
$$;

-- Function: Get trainer dashboard stats
CREATE OR REPLACE FUNCTION get_trainer_dashboard()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trainer_id UUID;
  v_today DATE := CURRENT_DATE;
  v_week_start DATE := date_trunc('week', CURRENT_DATE)::DATE;
  v_month_start DATE := date_trunc('month', CURRENT_DATE)::DATE;
  v_result JSON;
BEGIN
  -- Get trainer ID from auth
  SELECT id INTO v_trainer_id FROM trainers WHERE user_id = auth.uid();
  IF v_trainer_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not a trainer');
  END IF;

  SELECT json_build_object(
    'success', true,
    'today_sessions', (
      SELECT COUNT(*) FROM training_sessions
      WHERE trainer_id = v_trainer_id
        AND session_date = v_today
        AND status = 'confirmed'
    ),
    'pending_requests', (
      SELECT COUNT(*) FROM training_sessions
      WHERE trainer_id = v_trainer_id
        AND status IN ('requested', 'pending')
    ),
    'week_sessions', (
      SELECT COUNT(*) FROM training_sessions
      WHERE trainer_id = v_trainer_id
        AND session_date >= v_week_start
        AND status IN ('confirmed', 'completed')
    ),
    'month_earnings', (
      SELECT COALESCE(SUM(trainer_payout_cents), 0) FROM training_sessions
      WHERE trainer_id = v_trainer_id
        AND session_date >= v_month_start
        AND status = 'completed'
        AND is_paid = TRUE
    ),
    'total_students', (
      SELECT COUNT(DISTINCT child_id) FROM training_sessions
      WHERE trainer_id = v_trainer_id
        AND status = 'completed'
    ),
    'next_session', (
      SELECT row_to_json(s) FROM (
        SELECT
          ts.id,
          ts.session_date,
          ts.start_time,
          ts.end_time,
          ts.location_name,
          c.first_name AS child_first_name,
          c.last_name AS child_last_name
        FROM training_sessions ts
        LEFT JOIN children c ON ts.child_id = c.id
        WHERE ts.trainer_id = v_trainer_id
          AND ts.session_date >= v_today
          AND ts.status = 'confirmed'
        ORDER BY ts.session_date, ts.start_time
        LIMIT 1
      ) s
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at for trainers
CREATE TRIGGER update_trainers_updated_at
  BEFORE UPDATE ON trainers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update updated_at for training_sessions
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- GRANTS
-- ============================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
