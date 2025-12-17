<?php
/**
 * Plugin Name: PTP WooCommerce Bridge
 * Description: Connects WooCommerce products to the PTP Mobile App API
 * Version: 2.0.0
 * Author: PTP
 */

if (!defined('ABSPATH')) {
    exit;
}

// ============================================================
// REGISTER ALL REST API ENDPOINTS
// ============================================================

add_action('rest_api_init', function () {

    // =====================
    // AUTHENTICATION
    // =====================

    // POST /wp-json/ptp/v1/auth/login
    register_rest_route('ptp/v1', '/auth/login', [
        'methods' => 'POST',
        'callback' => 'ptp_auth_login',
        'permission_callback' => '__return_true',
    ]);

    // POST /wp-json/ptp/v1/auth/register
    register_rest_route('ptp/v1', '/auth/register', [
        'methods' => 'POST',
        'callback' => 'ptp_auth_register',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/auth/me - Get current user
    register_rest_route('ptp/v1', '/auth/me', [
        'methods' => 'GET',
        'callback' => 'ptp_auth_me',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // POST /wp-json/ptp/v1/auth/forgot-password
    register_rest_route('ptp/v1', '/auth/forgot-password', [
        'methods' => 'POST',
        'callback' => 'ptp_auth_forgot_password',
        'permission_callback' => '__return_true',
    ]);

    // POST /wp-json/ptp/v1/auth/fcm-token - Register push notification token
    register_rest_route('ptp/v1', '/auth/fcm-token', [
        'methods' => 'POST',
        'callback' => 'ptp_register_fcm_token',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // =====================
    // PROGRAMS (Camps/Clinics)
    // =====================

    register_rest_route('ptp/v1', '/programs', [
        'methods' => 'GET',
        'callback' => 'ptp_get_programs',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('ptp/v1', '/programs/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_program',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('ptp/v1', '/programs/featured', [
        'methods' => 'GET',
        'callback' => 'ptp_get_featured_programs',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('ptp/v1', '/markets', [
        'methods' => 'GET',
        'callback' => 'ptp_get_markets',
        'permission_callback' => '__return_true',
    ]);

    // =====================
    // TRAINERS
    // =====================

    register_rest_route('ptp/v1', '/trainers', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainers',
        'permission_callback' => '__return_true',
    ]);

    register_rest_route('ptp/v1', '/trainers/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer',
        'permission_callback' => '__return_true',
    ]);

    // GET /wp-json/ptp/v1/trainers/:id/availability
    register_rest_route('ptp/v1', '/trainers/(?P<id>\d+)/availability', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer_availability',
        'permission_callback' => '__return_true',
    ]);

    // =====================
    // TRAINING SESSIONS (Parent Side)
    // =====================

    // POST /wp-json/ptp/v1/training/request - Request a new session
    register_rest_route('ptp/v1', '/training/request', [
        'methods' => 'POST',
        'callback' => 'ptp_request_training',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // GET /wp-json/ptp/v1/training/my-sessions - Get parent's sessions
    register_rest_route('ptp/v1', '/training/my-sessions', [
        'methods' => 'GET',
        'callback' => 'ptp_get_my_sessions',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // GET /wp-json/ptp/v1/training/sessions/:id
    register_rest_route('ptp/v1', '/training/sessions/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_session',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // POST /wp-json/ptp/v1/training/sessions/:id/cancel
    register_rest_route('ptp/v1', '/training/sessions/(?P<id>\d+)/cancel', [
        'methods' => 'POST',
        'callback' => 'ptp_cancel_session',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // =====================
    // TRAINER DASHBOARD
    // =====================

    // GET /wp-json/ptp/v1/trainer/bookings
    register_rest_route('ptp/v1', '/trainer/bookings', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer_bookings',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // GET /wp-json/ptp/v1/trainer/stats
    register_rest_route('ptp/v1', '/trainer/stats', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer_stats',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // GET /wp-json/ptp/v1/trainer/earnings
    register_rest_route('ptp/v1', '/trainer/earnings', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer_earnings',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // GET /wp-json/ptp/v1/trainer/players
    register_rest_route('ptp/v1', '/trainer/players', [
        'methods' => 'GET',
        'callback' => 'ptp_get_trainer_players',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // PUT /wp-json/ptp/v1/trainer/profile
    register_rest_route('ptp/v1', '/trainer/profile', [
        'methods' => ['PUT', 'POST'],
        'callback' => 'ptp_update_trainer_profile',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // POST /wp-json/ptp/v1/bookings/:id/confirm
    register_rest_route('ptp/v1', '/bookings/(?P<id>\d+)/confirm', [
        'methods' => 'POST',
        'callback' => 'ptp_confirm_booking',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // POST /wp-json/ptp/v1/bookings/:id/cancel
    register_rest_route('ptp/v1', '/bookings/(?P<id>\d+)/cancel', [
        'methods' => 'POST',
        'callback' => 'ptp_trainer_cancel_booking',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // POST /wp-json/ptp/v1/bookings/:id/complete
    register_rest_route('ptp/v1', '/bookings/(?P<id>\d+)/complete', [
        'methods' => 'POST',
        'callback' => 'ptp_complete_booking',
        'permission_callback' => 'ptp_is_trainer',
    ]);

    // =====================
    // PLAYERS (Children)
    // =====================

    register_rest_route('ptp/v1', '/players', [
        'methods' => 'GET',
        'callback' => 'ptp_get_players',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/players/(?P<id>\d+)', [
        'methods' => 'GET',
        'callback' => 'ptp_get_player',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/players', [
        'methods' => 'POST',
        'callback' => 'ptp_add_player',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/players/(?P<id>\d+)', [
        'methods' => 'PUT',
        'callback' => 'ptp_update_player',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/players/(?P<id>\d+)', [
        'methods' => 'DELETE',
        'callback' => 'ptp_delete_player',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // =====================
    // CONVERSATIONS/MESSAGES
    // =====================

    register_rest_route('ptp/v1', '/conversations', [
        'methods' => 'GET',
        'callback' => 'ptp_get_conversations',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/conversations/start', [
        'methods' => 'POST',
        'callback' => 'ptp_start_conversation',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/conversations/(?P<id>\d+)/messages', [
        'methods' => 'GET',
        'callback' => 'ptp_get_messages',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/conversations/(?P<id>\d+)/messages', [
        'methods' => 'POST',
        'callback' => 'ptp_send_message',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/conversations/(?P<id>\d+)/read', [
        'methods' => 'POST',
        'callback' => 'ptp_mark_as_read',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // =====================
    // USER PROFILE
    // =====================

    register_rest_route('ptp/v1', '/parent/profile', [
        'methods' => ['PUT', 'POST'],
        'callback' => 'ptp_update_parent_profile',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/profile', [
        'methods' => 'POST',
        'callback' => 'ptp_save_onboarding',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    register_rest_route('ptp/v1', '/me', [
        'methods' => 'DELETE',
        'callback' => 'ptp_delete_account',
        'permission_callback' => 'ptp_is_authenticated',
    ]);

    // =====================
    // USER EVENTS (Calendar)
    // =====================

    register_rest_route('ptp/v1', '/me/events', [
        'methods' => 'GET',
        'callback' => 'ptp_get_my_events',
        'permission_callback' => 'ptp_is_authenticated',
    ]);
});

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

/**
 * Simple JWT token generation (for basic use)
 * For production, use a proper JWT library
 */
function ptp_generate_token($user_id) {
    $secret = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : wp_salt('auth');
    $issued = time();
    $expiry = $issued + (DAY_IN_SECONDS * 30); // 30 days

    $payload = base64_encode(json_encode([
        'iss' => get_site_url(),
        'iat' => $issued,
        'exp' => $expiry,
        'user_id' => $user_id,
    ]));

    $signature = hash_hmac('sha256', $payload, $secret);

    return $payload . '.' . $signature;
}

/**
 * Validate JWT token and return user ID
 */
function ptp_validate_token($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 2) {
        return false;
    }

    $payload = $parts[0];
    $signature = $parts[1];

    $secret = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : wp_salt('auth');
    $expected_signature = hash_hmac('sha256', $payload, $secret);

    if (!hash_equals($expected_signature, $signature)) {
        return false;
    }

    $data = json_decode(base64_decode($payload), true);

    if (!$data || !isset($data['user_id']) || !isset($data['exp'])) {
        return false;
    }

    if ($data['exp'] < time()) {
        return false;
    }

    return $data['user_id'];
}

/**
 * Get current user from JWT token
 */
function ptp_get_current_user_from_token() {
    $auth_header = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';

    if (empty($auth_header)) {
        // Try alternate header
        $auth_header = isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION']) ? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] : '';
    }

    if (empty($auth_header) || strpos($auth_header, 'Bearer ') !== 0) {
        return null;
    }

    $token = substr($auth_header, 7);
    $user_id = ptp_validate_token($token);

    if (!$user_id) {
        return null;
    }

    return get_user_by('ID', $user_id);
}

/**
 * Permission callback: Is user authenticated?
 */
function ptp_is_authenticated() {
    $user = ptp_get_current_user_from_token();
    return $user !== null;
}

/**
 * Permission callback: Is user a trainer?
 */
function ptp_is_trainer() {
    $user = ptp_get_current_user_from_token();
    if (!$user) return false;

    return in_array('ptp_trainer', $user->roles) || in_array('trainer', $user->roles);
}

// ============================================================
// AUTHENTICATION ENDPOINTS
// ============================================================

/**
 * Login endpoint
 */
function ptp_auth_login(WP_REST_Request $request) {
    $email = sanitize_email($request->get_param('email'));
    $password = $request->get_param('password');

    if (empty($email) || empty($password)) {
        return new WP_Error('missing_credentials', 'Email and password are required', ['status' => 400]);
    }

    // Try to authenticate
    $user = wp_authenticate($email, $password);

    if (is_wp_error($user)) {
        return new WP_Error('invalid_credentials', 'Invalid email or password', ['status' => 401]);
    }

    // Generate token
    $token = ptp_generate_token($user->ID);

    return [
        'token' => $token,
        'user' => ptp_format_user($user),
    ];
}

/**
 * Register endpoint
 */
function ptp_auth_register(WP_REST_Request $request) {
    $email = sanitize_email($request->get_param('email'));
    $password = $request->get_param('password');
    $first_name = sanitize_text_field($request->get_param('first_name'));
    $last_name = sanitize_text_field($request->get_param('last_name'));
    $phone = sanitize_text_field($request->get_param('phone'));
    $role = sanitize_text_field($request->get_param('role')) ?: 'ptp_parent';

    if (empty($email) || empty($password)) {
        return new WP_Error('missing_fields', 'Email and password are required', ['status' => 400]);
    }

    if (email_exists($email)) {
        return new WP_Error('email_exists', 'An account with this email already exists', ['status' => 400]);
    }

    // Create user
    $user_id = wp_create_user($email, $password, $email);

    if (is_wp_error($user_id)) {
        return new WP_Error('registration_failed', 'Failed to create account', ['status' => 500]);
    }

    // Update user meta
    wp_update_user([
        'ID' => $user_id,
        'first_name' => $first_name,
        'last_name' => $last_name,
        'display_name' => trim("$first_name $last_name"),
    ]);

    update_user_meta($user_id, 'phone', $phone);
    update_user_meta($user_id, 'billing_phone', $phone);

    // Set role
    $user = get_user_by('ID', $user_id);
    $user->set_role($role);

    // Generate token
    $token = ptp_generate_token($user_id);

    return [
        'token' => $token,
        'user' => ptp_format_user($user),
    ];
}

/**
 * Get current user endpoint
 */
function ptp_auth_me(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    if (!$user) {
        return new WP_Error('not_authenticated', 'Invalid or expired token', ['status' => 401]);
    }

    return ptp_format_user($user);
}

/**
 * Forgot password endpoint
 */
function ptp_auth_forgot_password(WP_REST_Request $request) {
    $email = sanitize_email($request->get_param('email'));

    if (empty($email)) {
        return new WP_Error('missing_email', 'Email is required', ['status' => 400]);
    }

    $user = get_user_by('email', $email);

    if (!$user) {
        // Don't reveal if email exists
        return ['success' => true, 'message' => 'If an account exists with this email, you will receive a password reset link.'];
    }

    // Send password reset email
    $result = retrieve_password($email);

    return ['success' => true, 'message' => 'If an account exists with this email, you will receive a password reset link.'];
}

/**
 * Register FCM token for push notifications
 */
function ptp_register_fcm_token(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $fcm_token = sanitize_text_field($request->get_param('fcm_token'));
    $device_type = sanitize_text_field($request->get_param('device_type')) ?: 'ios';

    if (empty($fcm_token)) {
        return new WP_Error('missing_token', 'FCM token is required', ['status' => 400]);
    }

    update_user_meta($user->ID, 'fcm_token', $fcm_token);
    update_user_meta($user->ID, 'fcm_device_type', $device_type);

    return ['success' => true];
}

/**
 * Format user for API response
 */
function ptp_format_user($user) {
    $id = $user->ID;
    $is_trainer = in_array('ptp_trainer', $user->roles) || in_array('trainer', $user->roles);

    $base = [
        'id' => $id,
        'email' => $user->user_email,
        'firstName' => get_user_meta($id, 'first_name', true),
        'lastName' => get_user_meta($id, 'last_name', true),
        'phone' => get_user_meta($id, 'phone', true) ?: get_user_meta($id, 'billing_phone', true),
        'role' => $is_trainer ? 'ptp_trainer' : 'ptp_parent',
        'notificationsEnabled' => get_user_meta($id, 'notifications_enabled', true) !== 'no',
        'createdAt' => $user->user_registered,
        'updatedAt' => get_user_meta($id, 'last_updated', true) ?: $user->user_registered,
    ];

    if ($is_trainer) {
        // Add trainer-specific fields
        $base['collegePro'] = get_user_meta($id, 'trainer_education', true);
        $base['position'] = get_user_meta($id, 'trainer_position', true) ?: 'midfielder';
        $base['bio'] = get_user_meta($id, 'description', true);
        $base['teachingStyle'] = get_user_meta($id, 'trainer_teaching_style', true);
        $base['hourlyRate'] = (float) (get_user_meta($id, 'trainer_hourly_rate', true) ?: 80);
        $base['rating'] = (float) (get_user_meta($id, 'trainer_rating', true) ?: 5.0);
        $base['reviewCount'] = (int) (get_user_meta($id, 'trainer_review_count', true) ?: 0);
        $base['isVerified'] = get_user_meta($id, 'trainer_verified', true) === 'yes';
        $base['isBackgroundChecked'] = get_user_meta($id, 'trainer_background_checked', true) === 'yes';
        $base['headshotUrl'] = get_user_meta($id, 'trainer_headshot', true) ?: get_avatar_url($id, ['size' => 400]);

        $specializations = get_user_meta($id, 'trainer_specializations', true);
        $base['specialties'] = is_array($specializations) ? $specializations : array_map('trim', explode(',', $specializations ?: ''));
    } else {
        // Add parent-specific fields - get children
        $base['children'] = ptp_get_user_children($id);
        $base['preferredLocation'] = [
            'state' => get_user_meta($id, 'preferred_state', true),
            'city' => get_user_meta($id, 'preferred_city', true),
        ];
        $base['mainInterest'] = get_user_meta($id, 'main_interest', true) ?: 'all';
    }

    return $base;
}

/**
 * Get children for a parent user
 */
function ptp_get_user_children($parent_id) {
    $args = [
        'post_type' => 'ptp_player',
        'posts_per_page' => -1,
        'author' => $parent_id,
        'post_status' => 'publish',
    ];

    $query = new WP_Query($args);
    $children = [];

    foreach ($query->posts as $post) {
        $children[] = [
            'id' => $post->ID,
            'firstName' => get_post_meta($post->ID, '_first_name', true) ?: $post->post_title,
            'lastName' => get_post_meta($post->ID, '_last_name', true),
            'ageBand' => get_post_meta($post->ID, '_age_band', true),
            'skillLevel' => get_post_meta($post->ID, '_skill_level', true),
            'position' => get_post_meta($post->ID, '_position', true),
            'team' => get_post_meta($post->ID, '_team', true),
        ];
    }

    return $children;
}

// ============================================================
// TRAINER AVAILABILITY
// ============================================================

function ptp_get_trainer_availability(WP_REST_Request $request) {
    $trainer_id = $request->get_param('id');
    $date = $request->get_param('date') ?: date('Y-m-d');

    $user = get_user_by('ID', $trainer_id);
    if (!$user) {
        return new WP_Error('not_found', 'Trainer not found', ['status' => 404]);
    }

    // Get trainer's availability settings
    $availability = get_user_meta($trainer_id, 'trainer_availability', true);
    $hourly_rate = get_user_meta($trainer_id, 'trainer_hourly_rate', true) ?: 80;

    // Get existing bookings for this date
    $existing_bookings = ptp_get_trainer_bookings_for_date($trainer_id, $date);
    $booked_times = array_map(function($b) {
        return $b['start_time'];
    }, $existing_bookings);

    // Generate available slots
    $day_of_week = strtolower(date('l', strtotime($date)));
    $day_slots = isset($availability[$day_of_week]) ? $availability[$day_of_week] : [];

    // Default slots if not configured
    if (empty($day_slots)) {
        $day_slots = [
            ['start' => '16:00', 'end' => '17:00'],
            ['start' => '17:00', 'end' => '18:00'],
            ['start' => '18:00', 'end' => '19:00'],
        ];
    }

    $available_slots = [];
    foreach ($day_slots as $slot) {
        $is_booked = in_array($slot['start'], $booked_times);
        $available_slots[] = [
            'start_time' => $slot['start'],
            'end_time' => $slot['end'],
            'is_available' => !$is_booked,
            'price' => (float) $hourly_rate,
        ];
    }

    return [
        'date' => $date,
        'trainer_id' => (int) $trainer_id,
        'available_slots' => $available_slots,
    ];
}

function ptp_get_trainer_bookings_for_date($trainer_id, $date) {
    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            'relation' => 'AND',
            [
                'key' => '_trainer_id',
                'value' => $trainer_id,
            ],
            [
                'key' => '_date',
                'value' => $date,
            ],
            [
                'key' => '_status',
                'value' => ['pending', 'confirmed'],
                'compare' => 'IN',
            ],
        ],
    ];

    $query = new WP_Query($args);
    $bookings = [];

    foreach ($query->posts as $post) {
        $bookings[] = [
            'id' => $post->ID,
            'start_time' => get_post_meta($post->ID, '_start_time', true),
            'end_time' => get_post_meta($post->ID, '_end_time', true),
        ];
    }

    return $bookings;
}

// ============================================================
// TRAINING SESSION ENDPOINTS
// ============================================================

/**
 * Request a training session
 */
function ptp_request_training(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $trainer_id = (int) $request->get_param('trainer_id');
    $child_id = (int) $request->get_param('child_id');
    $preferred_slots = $request->get_param('preferred_slots');
    $location = sanitize_text_field($request->get_param('location_preference'));
    $custom_location = sanitize_text_field($request->get_param('custom_location'));
    $focus = sanitize_text_field($request->get_param('focus'));
    $notes = sanitize_textarea_field($request->get_param('notes'));

    // Get the first preferred slot
    $slot = is_array($preferred_slots) && !empty($preferred_slots) ? $preferred_slots[0] : null;

    if (!$trainer_id || !$slot) {
        return new WP_Error('missing_data', 'Trainer ID and preferred slot are required', ['status' => 400]);
    }

    // Get trainer's hourly rate
    $hourly_rate = get_user_meta($trainer_id, 'trainer_hourly_rate', true) ?: 80;

    // Create booking post
    $booking_id = wp_insert_post([
        'post_type' => 'ptp_booking',
        'post_status' => 'publish',
        'post_title' => 'Training Session Request',
        'post_author' => $user->ID,
    ]);

    if (is_wp_error($booking_id)) {
        return new WP_Error('booking_failed', 'Failed to create booking', ['status' => 500]);
    }

    // Save booking meta
    update_post_meta($booking_id, '_trainer_id', $trainer_id);
    update_post_meta($booking_id, '_parent_id', $user->ID);
    update_post_meta($booking_id, '_child_id', $child_id);
    update_post_meta($booking_id, '_date', sanitize_text_field($slot['date']));
    update_post_meta($booking_id, '_start_time', sanitize_text_field($slot['start_time']));
    update_post_meta($booking_id, '_end_time', sanitize_text_field($slot['end_time']));
    update_post_meta($booking_id, '_location', $location ?: $custom_location);
    update_post_meta($booking_id, '_focus', $focus);
    update_post_meta($booking_id, '_notes', $notes);
    update_post_meta($booking_id, '_status', 'pending');
    update_post_meta($booking_id, '_price', $hourly_rate);
    update_post_meta($booking_id, '_is_paid', false);

    // TODO: Send notification to trainer

    return [
        'success' => true,
        'session_id' => $booking_id,
        'message' => 'Your session request has been sent! The trainer will respond within 24 hours.',
    ];
}

/**
 * Get parent's training sessions
 */
function ptp_get_my_sessions(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $status = $request->get_param('status');

    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            [
                'key' => '_parent_id',
                'value' => $user->ID,
            ],
        ],
        'orderby' => 'meta_value',
        'meta_key' => '_date',
        'order' => 'ASC',
    ];

    if ($status && $status !== 'all') {
        $args['meta_query'][] = [
            'key' => '_status',
            'value' => $status,
        ];
    }

    $query = new WP_Query($args);
    $sessions = [];

    foreach ($query->posts as $post) {
        $sessions[] = ptp_format_booking($post);
    }

    return ['sessions' => $sessions];
}

/**
 * Get single session
 */
function ptp_get_session(WP_REST_Request $request) {
    $session_id = $request->get_param('id');
    $post = get_post($session_id);

    if (!$post || $post->post_type !== 'ptp_booking') {
        return new WP_Error('not_found', 'Session not found', ['status' => 404]);
    }

    return ptp_format_booking($post);
}

/**
 * Cancel a session (parent)
 */
function ptp_cancel_session(WP_REST_Request $request) {
    $session_id = $request->get_param('id');
    $reason = sanitize_textarea_field($request->get_param('reason'));

    $post = get_post($session_id);
    if (!$post || $post->post_type !== 'ptp_booking') {
        return new WP_Error('not_found', 'Session not found', ['status' => 404]);
    }

    update_post_meta($session_id, '_status', 'cancelled');
    update_post_meta($session_id, '_cancel_reason', $reason);

    return ['success' => true, 'message' => 'Session cancelled'];
}

/**
 * Format booking for API response
 */
function ptp_format_booking($post) {
    $id = $post->ID;
    $trainer_id = get_post_meta($id, '_trainer_id', true);
    $child_id = get_post_meta($id, '_child_id', true);

    $trainer = get_user_by('ID', $trainer_id);
    $child = get_post($child_id);

    return [
        'id' => $id,
        'trainer_id' => (int) $trainer_id,
        'trainer' => $trainer ? [
            'id' => $trainer->ID,
            'name' => trim(get_user_meta($trainer->ID, 'first_name', true) . ' ' . get_user_meta($trainer->ID, 'last_name', true)),
            'avatar_url' => get_user_meta($trainer->ID, 'trainer_headshot', true) ?: get_avatar_url($trainer->ID),
        ] : null,
        'parent_id' => (int) get_post_meta($id, '_parent_id', true),
        'child_id' => (int) $child_id,
        'child' => $child ? [
            'id' => $child->ID,
            'name' => get_post_meta($child->ID, '_first_name', true),
            'first_name' => get_post_meta($child->ID, '_first_name', true),
            'age_band' => get_post_meta($child->ID, '_age_band', true),
            'skill_level' => get_post_meta($child->ID, '_skill_level', true),
            'position' => get_post_meta($child->ID, '_position', true),
        ] : null,
        'date' => get_post_meta($id, '_date', true),
        'start_time' => get_post_meta($id, '_start_time', true),
        'end_time' => get_post_meta($id, '_end_time', true),
        'location' => get_post_meta($id, '_location', true),
        'focus' => get_post_meta($id, '_focus', true),
        'player_notes' => get_post_meta($id, '_notes', true),
        'status' => get_post_meta($id, '_status', true),
        'price' => (float) get_post_meta($id, '_price', true),
        'is_paid' => get_post_meta($id, '_is_paid', true) === 'yes',
        'created_at' => $post->post_date,
        'updated_at' => $post->post_modified,
    ];
}

// ============================================================
// TRAINER DASHBOARD ENDPOINTS
// ============================================================

function ptp_get_trainer_bookings(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $status = $request->get_param('status');
    $date = $request->get_param('date');

    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            [
                'key' => '_trainer_id',
                'value' => $user->ID,
            ],
        ],
        'orderby' => 'meta_value',
        'meta_key' => '_date',
        'order' => 'ASC',
    ];

    if ($status) {
        $args['meta_query'][] = [
            'key' => '_status',
            'value' => $status,
        ];
    }

    if ($date) {
        $args['meta_query'][] = [
            'key' => '_date',
            'value' => $date,
        ];
    }

    $query = new WP_Query($args);
    $bookings = [];

    foreach ($query->posts as $post) {
        $bookings[] = ptp_format_booking($post);
    }

    return ['bookings' => $bookings];
}

function ptp_get_trainer_stats(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    // Count sessions
    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'fields' => 'ids',
        'meta_query' => [
            [
                'key' => '_trainer_id',
                'value' => $user->ID,
            ],
        ],
    ];

    $all_bookings = new WP_Query($args);

    // Count this week
    $args['meta_query'][] = [
        'key' => '_date',
        'value' => [date('Y-m-d'), date('Y-m-d', strtotime('+7 days'))],
        'compare' => 'BETWEEN',
    ];
    $weekly_bookings = new WP_Query($args);

    // Get unique students
    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'meta_query' => [
            [
                'key' => '_trainer_id',
                'value' => $user->ID,
            ],
        ],
    ];
    $student_query = new WP_Query($args);
    $student_ids = [];
    foreach ($student_query->posts as $post) {
        $child_id = get_post_meta($post->ID, '_child_id', true);
        if ($child_id) $student_ids[$child_id] = true;
    }

    return [
        'total_sessions' => $all_bookings->found_posts,
        'sessions_this_week' => $weekly_bookings->found_posts,
        'total_students' => count($student_ids),
        'average_rating' => (float) (get_user_meta($user->ID, 'trainer_rating', true) ?: 5.0),
        'total_reviews' => (int) (get_user_meta($user->ID, 'trainer_review_count', true) ?: 0),
    ];
}

function ptp_get_trainer_earnings(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $period = $request->get_param('period') ?: 'month';

    // Calculate date range
    $end_date = date('Y-m-d');
    switch ($period) {
        case 'week':
            $start_date = date('Y-m-d', strtotime('-7 days'));
            break;
        case 'year':
            $start_date = date('Y-m-d', strtotime('-1 year'));
            break;
        default:
            $start_date = date('Y-m-d', strtotime('-30 days'));
    }

    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            'relation' => 'AND',
            [
                'key' => '_trainer_id',
                'value' => $user->ID,
            ],
            [
                'key' => '_status',
                'value' => 'completed',
            ],
            [
                'key' => '_date',
                'value' => [$start_date, $end_date],
                'compare' => 'BETWEEN',
            ],
        ],
    ];

    $query = new WP_Query($args);
    $total_earnings = 0;
    $pending_earnings = 0;
    $paid_earnings = 0;

    foreach ($query->posts as $post) {
        $price = (float) get_post_meta($post->ID, '_price', true);
        $is_paid = get_post_meta($post->ID, '_is_paid', true) === 'yes';

        $total_earnings += $price;
        if ($is_paid) {
            $paid_earnings += $price;
        } else {
            $pending_earnings += $price;
        }
    }

    return [
        'total_earnings' => $total_earnings,
        'pending_earnings' => $pending_earnings,
        'paid_earnings' => $paid_earnings,
        'period' => $period,
    ];
}

function ptp_get_trainer_players(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    // Get all bookings for this trainer
    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'meta_query' => [
            [
                'key' => '_trainer_id',
                'value' => $user->ID,
            ],
        ],
    ];

    $query = new WP_Query($args);
    $player_ids = [];

    foreach ($query->posts as $post) {
        $child_id = get_post_meta($post->ID, '_child_id', true);
        if ($child_id) $player_ids[$child_id] = true;
    }

    $players = [];
    foreach (array_keys($player_ids) as $player_id) {
        $player = get_post($player_id);
        if ($player) {
            $players[] = [
                'id' => $player->ID,
                'first_name' => get_post_meta($player->ID, '_first_name', true),
                'last_name' => get_post_meta($player->ID, '_last_name', true),
                'age_band' => get_post_meta($player->ID, '_age_band', true),
                'skill_level' => get_post_meta($player->ID, '_skill_level', true),
            ];
        }
    }

    return ['players' => $players];
}

function ptp_update_trainer_profile(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $fields = [
        'first_name' => 'first_name',
        'last_name' => 'last_name',
        'phone' => 'phone',
        'bio' => 'description',
        'hourly_rate' => 'trainer_hourly_rate',
        'location' => 'trainer_location',
        'specializations' => 'trainer_specializations',
        'avatar_url' => 'trainer_headshot',
    ];

    foreach ($fields as $param => $meta_key) {
        $value = $request->get_param($param);
        if ($value !== null) {
            update_user_meta($user->ID, $meta_key, $value);
        }
    }

    update_user_meta($user->ID, 'last_updated', current_time('mysql'));

    return ['success' => true, 'message' => 'Profile updated'];
}

function ptp_confirm_booking(WP_REST_Request $request) {
    $booking_id = $request->get_param('id');
    $message = sanitize_textarea_field($request->get_param('message'));

    update_post_meta($booking_id, '_status', 'confirmed');
    if ($message) {
        update_post_meta($booking_id, '_trainer_message', $message);
    }

    // TODO: Send notification to parent

    return ['success' => true, 'status' => 'confirmed', 'message' => 'Booking confirmed'];
}

function ptp_trainer_cancel_booking(WP_REST_Request $request) {
    $booking_id = $request->get_param('id');
    $message = sanitize_textarea_field($request->get_param('message'));

    update_post_meta($booking_id, '_status', 'cancelled');
    if ($message) {
        update_post_meta($booking_id, '_cancel_reason', $message);
    }

    return ['success' => true, 'status' => 'cancelled', 'message' => 'Booking declined'];
}

function ptp_complete_booking(WP_REST_Request $request) {
    $booking_id = $request->get_param('id');
    $notes = sanitize_textarea_field($request->get_param('notes'));

    update_post_meta($booking_id, '_status', 'completed');
    if ($notes) {
        update_post_meta($booking_id, '_trainer_notes', $notes);
    }

    return ['success' => true, 'message' => 'Session marked as completed'];
}

// ============================================================
// PLAYERS (CHILDREN) ENDPOINTS
// ============================================================

function ptp_get_players(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $args = [
        'post_type' => 'ptp_player',
        'posts_per_page' => -1,
        'author' => $user->ID,
        'post_status' => 'publish',
    ];

    $query = new WP_Query($args);
    $players = [];

    foreach ($query->posts as $post) {
        $players[] = ptp_format_player($post);
    }

    return ['players' => $players];
}

function ptp_get_player(WP_REST_Request $request) {
    $player_id = $request->get_param('id');
    $post = get_post($player_id);

    if (!$post || $post->post_type !== 'ptp_player') {
        return new WP_Error('not_found', 'Player not found', ['status' => 404]);
    }

    return ptp_format_player($post);
}

function ptp_add_player(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $first_name = sanitize_text_field($request->get_param('first_name'));
    $last_name = sanitize_text_field($request->get_param('last_name'));

    $player_id = wp_insert_post([
        'post_type' => 'ptp_player',
        'post_status' => 'publish',
        'post_title' => trim("$first_name $last_name"),
        'post_author' => $user->ID,
    ]);

    if (is_wp_error($player_id)) {
        return new WP_Error('create_failed', 'Failed to create player', ['status' => 500]);
    }

    // Save meta
    update_post_meta($player_id, '_first_name', $first_name);
    update_post_meta($player_id, '_last_name', $last_name);
    update_post_meta($player_id, '_date_of_birth', sanitize_text_field($request->get_param('date_of_birth')));
    update_post_meta($player_id, '_age_band', sanitize_text_field($request->get_param('age_band')));
    update_post_meta($player_id, '_skill_level', sanitize_text_field($request->get_param('skill_level')));
    update_post_meta($player_id, '_position', sanitize_text_field($request->get_param('position')));
    update_post_meta($player_id, '_team', sanitize_text_field($request->get_param('team')));
    update_post_meta($player_id, '_notes', sanitize_textarea_field($request->get_param('notes')));

    return [
        'success' => true,
        'child_id' => $player_id,
        'message' => 'Player profile created',
    ];
}

function ptp_update_player(WP_REST_Request $request) {
    $player_id = $request->get_param('id');
    $post = get_post($player_id);

    if (!$post || $post->post_type !== 'ptp_player') {
        return new WP_Error('not_found', 'Player not found', ['status' => 404]);
    }

    $fields = [
        'first_name' => '_first_name',
        'last_name' => '_last_name',
        'date_of_birth' => '_date_of_birth',
        'age_band' => '_age_band',
        'skill_level' => '_skill_level',
        'position' => '_position',
        'team' => '_team',
        'notes' => '_notes',
    ];

    foreach ($fields as $param => $meta_key) {
        $value = $request->get_param($param);
        if ($value !== null) {
            update_post_meta($player_id, $meta_key, sanitize_text_field($value));
        }
    }

    return ['success' => true, 'message' => 'Player profile updated'];
}

function ptp_delete_player(WP_REST_Request $request) {
    $player_id = $request->get_param('id');

    $result = wp_delete_post($player_id, true);

    if (!$result) {
        return new WP_Error('delete_failed', 'Failed to delete player', ['status' => 500]);
    }

    return ['success' => true, 'message' => 'Player profile deleted'];
}

function ptp_format_player($post) {
    return [
        'id' => $post->ID,
        'first_name' => get_post_meta($post->ID, '_first_name', true),
        'last_name' => get_post_meta($post->ID, '_last_name', true),
        'date_of_birth' => get_post_meta($post->ID, '_date_of_birth', true),
        'age_band' => get_post_meta($post->ID, '_age_band', true),
        'skill_level' => get_post_meta($post->ID, '_skill_level', true),
        'position' => get_post_meta($post->ID, '_position', true),
        'team' => get_post_meta($post->ID, '_team', true),
        'notes' => get_post_meta($post->ID, '_notes', true),
    ];
}

// ============================================================
// CONVERSATIONS/MESSAGES ENDPOINTS
// ============================================================

function ptp_get_conversations(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $args = [
        'post_type' => 'ptp_conversation',
        'posts_per_page' => -1,
        'post_status' => 'publish',
        'meta_query' => [
            'relation' => 'OR',
            [
                'key' => '_participant_1',
                'value' => $user->ID,
            ],
            [
                'key' => '_participant_2',
                'value' => $user->ID,
            ],
        ],
        'orderby' => 'modified',
        'order' => 'DESC',
    ];

    $query = new WP_Query($args);
    $conversations = [];

    foreach ($query->posts as $post) {
        $conversations[] = ptp_format_conversation($post, $user->ID);
    }

    return ['conversations' => $conversations, 'total' => count($conversations)];
}

function ptp_start_conversation(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $participant_id = (int) $request->get_param('participant_id');
    $initial_message = sanitize_textarea_field($request->get_param('initial_message'));
    $related_session_id = (int) $request->get_param('related_session_id');
    $related_program_id = (int) $request->get_param('related_program_id');

    // Check if conversation already exists
    $existing = ptp_find_conversation($user->ID, $participant_id);
    if ($existing) {
        // Send message to existing conversation
        if ($initial_message) {
            ptp_create_message($existing->ID, $user->ID, $initial_message);
        }
        return [
            'success' => true,
            'conversation' => ptp_format_conversation($existing, $user->ID),
        ];
    }

    // Create new conversation
    $conv_id = wp_insert_post([
        'post_type' => 'ptp_conversation',
        'post_status' => 'publish',
        'post_title' => 'Conversation',
        'post_author' => $user->ID,
    ]);

    update_post_meta($conv_id, '_participant_1', $user->ID);
    update_post_meta($conv_id, '_participant_2', $participant_id);
    update_post_meta($conv_id, '_related_session_id', $related_session_id);
    update_post_meta($conv_id, '_related_program_id', $related_program_id);

    // Send initial message
    if ($initial_message) {
        ptp_create_message($conv_id, $user->ID, $initial_message);
    }

    $conv = get_post($conv_id);

    return [
        'success' => true,
        'conversation' => ptp_format_conversation($conv, $user->ID),
    ];
}

function ptp_find_conversation($user1_id, $user2_id) {
    $args = [
        'post_type' => 'ptp_conversation',
        'posts_per_page' => 1,
        'post_status' => 'publish',
        'meta_query' => [
            'relation' => 'OR',
            [
                'relation' => 'AND',
                ['key' => '_participant_1', 'value' => $user1_id],
                ['key' => '_participant_2', 'value' => $user2_id],
            ],
            [
                'relation' => 'AND',
                ['key' => '_participant_1', 'value' => $user2_id],
                ['key' => '_participant_2', 'value' => $user1_id],
            ],
        ],
    ];

    $query = new WP_Query($args);
    return $query->have_posts() ? $query->posts[0] : null;
}

function ptp_get_messages(WP_REST_Request $request) {
    $conv_id = $request->get_param('id');
    $limit = $request->get_param('limit') ?: 50;

    $args = [
        'post_type' => 'ptp_message',
        'posts_per_page' => $limit,
        'post_status' => 'publish',
        'meta_query' => [
            [
                'key' => '_conversation_id',
                'value' => $conv_id,
            ],
        ],
        'orderby' => 'date',
        'order' => 'DESC',
    ];

    $query = new WP_Query($args);
    $messages = [];

    foreach ($query->posts as $post) {
        $messages[] = ptp_format_message($post);
    }

    return [
        'messages' => array_reverse($messages),
        'has_more' => $query->found_posts > $limit,
    ];
}

function ptp_send_message(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $conv_id = $request->get_param('id');
    $content = sanitize_textarea_field($request->get_param('content'));

    if (empty($content)) {
        return new WP_Error('empty_message', 'Message content is required', ['status' => 400]);
    }

    $message_id = ptp_create_message($conv_id, $user->ID, $content);
    $message = get_post($message_id);

    return [
        'success' => true,
        'message' => ptp_format_message($message),
    ];
}

function ptp_create_message($conv_id, $sender_id, $content) {
    $message_id = wp_insert_post([
        'post_type' => 'ptp_message',
        'post_status' => 'publish',
        'post_content' => $content,
        'post_author' => $sender_id,
    ]);

    update_post_meta($message_id, '_conversation_id', $conv_id);
    update_post_meta($message_id, '_sender_id', $sender_id);
    update_post_meta($message_id, '_status', 'sent');

    // Update conversation modified time
    wp_update_post(['ID' => $conv_id, 'post_modified' => current_time('mysql')]);

    // Increment unread count for other participant
    $p1 = get_post_meta($conv_id, '_participant_1', true);
    $p2 = get_post_meta($conv_id, '_participant_2', true);
    $other_id = ($sender_id == $p1) ? $p2 : $p1;

    $unread_key = '_unread_' . $other_id;
    $current_unread = (int) get_post_meta($conv_id, $unread_key, true);
    update_post_meta($conv_id, $unread_key, $current_unread + 1);
    update_post_meta($conv_id, '_last_message', $content);
    update_post_meta($conv_id, '_last_message_at', current_time('mysql'));

    return $message_id;
}

function ptp_mark_as_read(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();
    $conv_id = $request->get_param('id');

    $unread_key = '_unread_' . $user->ID;
    update_post_meta($conv_id, $unread_key, 0);

    return ['success' => true];
}

function ptp_format_conversation($post, $current_user_id) {
    $id = $post->ID;
    $p1 = get_post_meta($id, '_participant_1', true);
    $p2 = get_post_meta($id, '_participant_2', true);
    $other_id = ($current_user_id == $p1) ? $p2 : $p1;
    $other_user = get_user_by('ID', $other_id);

    $unread_key = '_unread_' . $current_user_id;

    return [
        'id' => $id,
        'participant' => $other_user ? [
            'id' => $other_user->ID,
            'name' => trim(get_user_meta($other_user->ID, 'first_name', true) . ' ' . get_user_meta($other_user->ID, 'last_name', true)),
            'role' => in_array('ptp_trainer', $other_user->roles) ? 'trainer' : 'parent',
            'avatar_url' => get_user_meta($other_user->ID, 'trainer_headshot', true) ?: get_avatar_url($other_user->ID),
        ] : null,
        'last_message' => get_post_meta($id, '_last_message', true),
        'last_message_at' => get_post_meta($id, '_last_message_at', true),
        'unread_count' => (int) get_post_meta($id, $unread_key, true),
        'related_session_id' => get_post_meta($id, '_related_session_id', true),
        'related_program_id' => get_post_meta($id, '_related_program_id', true),
        'created_at' => $post->post_date,
        'updated_at' => $post->post_modified,
    ];
}

function ptp_format_message($post) {
    $sender_id = get_post_meta($post->ID, '_sender_id', true);
    $sender = get_user_by('ID', $sender_id);

    return [
        'id' => $post->ID,
        'conversation_id' => get_post_meta($post->ID, '_conversation_id', true),
        'sender_id' => (int) $sender_id,
        'sender_type' => $sender && in_array('ptp_trainer', $sender->roles) ? 'trainer' : 'parent',
        'sender' => $sender ? [
            'id' => $sender->ID,
            'name' => trim(get_user_meta($sender->ID, 'first_name', true) . ' ' . get_user_meta($sender->ID, 'last_name', true)),
            'avatar_url' => get_avatar_url($sender->ID),
        ] : null,
        'content' => $post->post_content,
        'status' => get_post_meta($post->ID, '_status', true),
        'created_at' => $post->post_date,
    ];
}

// ============================================================
// USER PROFILE ENDPOINTS
// ============================================================

function ptp_update_parent_profile(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    $first_name = $request->get_param('firstName');
    $last_name = $request->get_param('lastName');
    $phone = $request->get_param('phone');

    if ($first_name !== null) {
        update_user_meta($user->ID, 'first_name', sanitize_text_field($first_name));
    }
    if ($last_name !== null) {
        update_user_meta($user->ID, 'last_name', sanitize_text_field($last_name));
    }
    if ($phone !== null) {
        update_user_meta($user->ID, 'phone', sanitize_text_field($phone));
    }

    update_user_meta($user->ID, 'last_updated', current_time('mysql'));

    return ptp_format_user($user);
}

function ptp_save_onboarding(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    update_user_meta($user->ID, 'preferred_state', sanitize_text_field($request->get_param('preferred_state')));
    update_user_meta($user->ID, 'preferred_city', sanitize_text_field($request->get_param('preferred_city')));
    update_user_meta($user->ID, 'player_age_band', sanitize_text_field($request->get_param('player_age_band')));
    update_user_meta($user->ID, 'player_skill_level', sanitize_text_field($request->get_param('player_skill_level')));
    update_user_meta($user->ID, 'main_interest', sanitize_text_field($request->get_param('main_interest')));
    update_user_meta($user->ID, 'onboarding_complete', 'yes');

    return ['success' => true];
}

function ptp_delete_account(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    // Delete user's players
    $args = [
        'post_type' => 'ptp_player',
        'author' => $user->ID,
        'posts_per_page' => -1,
        'fields' => 'ids',
    ];
    $players = get_posts($args);
    foreach ($players as $player_id) {
        wp_delete_post($player_id, true);
    }

    // Delete user
    require_once(ABSPATH . 'wp-admin/includes/user.php');
    wp_delete_user($user->ID);

    return ['success' => true];
}

function ptp_get_my_events(WP_REST_Request $request) {
    $user = ptp_get_current_user_from_token();

    // Get training sessions
    $sessions = [];
    $args = [
        'post_type' => 'ptp_booking',
        'posts_per_page' => -1,
        'meta_query' => [
            [
                'key' => '_parent_id',
                'value' => $user->ID,
            ],
            [
                'key' => '_status',
                'value' => ['pending', 'confirmed'],
                'compare' => 'IN',
            ],
        ],
    ];

    $query = new WP_Query($args);
    foreach ($query->posts as $post) {
        $booking = ptp_format_booking($post);
        $sessions[] = [
            'id' => $booking['id'],
            'type' => 'training',
            'title' => 'Private Training Session',
            'subtitle' => $booking['trainer']['name'] ?? 'Trainer',
            'date' => $booking['date'],
            'startTime' => $booking['start_time'],
            'endTime' => $booking['end_time'],
            'location' => $booking['location'],
            'status' => $booking['status'] === 'pending' ? 'upcoming' : 'confirmed',
        ];
    }

    // TODO: Add WooCommerce order events (camps/clinics purchased)

    return ['events' => $sessions, 'total' => count($sessions)];
}

// ============================================================
// PROGRAMS ENDPOINTS (from original plugin)
// ============================================================

function ptp_get_programs(WP_REST_Request $request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 20;
    $type = $request->get_param('type');
    $state = $request->get_param('state');
    $city = $request->get_param('city');
    $market = $request->get_param('market');

    $args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => $per_page,
        'paged' => $page,
        'meta_query' => [],
        'tax_query' => [],
    ];

    $categories = [];
    if ($type === 'camp') {
        $categories = ['summer-camps', 'summer', 'camps'];
    } elseif ($type === 'clinic') {
        $categories = ['winter-clinics', 'clinics', 'clinic'];
    } else {
        $categories = ['summer-camps', 'summer', 'camps', 'winter-clinics', 'clinics', 'clinic'];
    }

    if (!empty($categories)) {
        $args['tax_query'][] = [
            'taxonomy' => 'product_cat',
            'field' => 'slug',
            'terms' => $categories,
            'operator' => 'IN',
        ];
    }

    if ($state) {
        $args['meta_query'][] = ['key' => '_camp_state', 'value' => $state];
    }
    if ($city) {
        $args['meta_query'][] = ['key' => '_camp_city', 'value' => $city, 'compare' => 'LIKE'];
    }
    if ($market) {
        $args['meta_query'][] = ['key' => '_market_slug', 'value' => $market];
    }

    $query = new WP_Query($args);
    $programs = [];

    foreach ($query->posts as $post) {
        $product = wc_get_product($post->ID);
        if ($product) {
            $programs[] = ptp_format_program($product);
        }
    }

    return [
        'programs' => $programs,
        'total' => $query->found_posts,
        'page' => (int) $page,
        'per_page' => (int) $per_page,
        'total_pages' => $query->max_num_pages,
    ];
}

function ptp_get_program(WP_REST_Request $request) {
    $id = $request->get_param('id');
    $product = wc_get_product($id);

    if (!$product) {
        return new WP_Error('not_found', 'Program not found', ['status' => 404]);
    }

    return ptp_format_program($product, true);
}

function ptp_get_featured_programs(WP_REST_Request $request) {
    $args = [
        'post_type' => 'product',
        'post_status' => 'publish',
        'posts_per_page' => 6,
        'tax_query' => [
            ['taxonomy' => 'product_visibility', 'field' => 'name', 'terms' => 'featured'],
        ],
    ];

    $query = new WP_Query($args);
    $programs = [];

    foreach ($query->posts as $post) {
        $product = wc_get_product($post->ID);
        if ($product) $programs[] = ptp_format_program($product);
    }

    if (empty($programs)) {
        $args['tax_query'] = [
            ['taxonomy' => 'product_cat', 'field' => 'slug', 'terms' => ['summer-camps', 'summer', 'camps', 'winter-clinics', 'clinics'], 'operator' => 'IN'],
        ];
        unset($args['tax_query'][0]);
        $query = new WP_Query($args);
        foreach ($query->posts as $post) {
            $product = wc_get_product($post->ID);
            if ($product) $programs[] = ptp_format_program($product);
        }
    }

    return $programs;
}

function ptp_format_program($product, $full_details = false) {
    $id = $product->get_id();
    $categories = wp_get_post_terms($id, 'product_cat', ['fields' => 'slugs']);
    $type = array_intersect(['winter-clinics', 'clinics', 'clinic'], $categories) ? 'clinic' : 'camp';

    $image_id = $product->get_image_id();
    $main_image = $image_id ? wp_get_attachment_url($image_id) : '';
    $gallery_urls = array_map('wp_get_attachment_url', $product->get_gallery_image_ids());

    $date = get_post_meta($id, '_camp_date', true);
    $age_bands = get_post_meta($id, '_age_bands', true);
    if (is_string($age_bands)) $age_bands = array_map('trim', explode(',', $age_bands));
    if (empty($age_bands)) $age_bands = ['6-8', '9-11', '12-14'];

    $program = [
        'id' => $id,
        'title' => $product->get_name(),
        'type' => $type,
        'description' => $product->get_description(),
        'shortDescription' => $product->get_short_description(),
        'date' => $date,
        'endDate' => get_post_meta($id, '_camp_end_date', true),
        'time' => get_post_meta($id, '_camp_time', true),
        'timeStart' => get_post_meta($id, '_camp_time_start', true) ?: '09:00',
        'timeEnd' => get_post_meta($id, '_camp_time_end', true) ?: '15:00',
        'location' => get_post_meta($id, '_camp_location', true),
        'venue' => get_post_meta($id, '_camp_venue', true),
        'address' => get_post_meta($id, '_camp_address', true),
        'city' => get_post_meta($id, '_camp_city', true),
        'state' => get_post_meta($id, '_camp_state', true) ?: 'PA',
        'marketSlug' => get_post_meta($id, '_market_slug', true) ?: 'main-line',
        'price' => (float) $product->get_price(),
        'regularPrice' => (float) $product->get_regular_price(),
        'salePrice' => $product->get_sale_price() ? (float) $product->get_sale_price() : null,
        'stock' => $product->get_stock_quantity(),
        'stockStatus' => $product->get_stock_status(),
        'almostFull' => $product->get_stock_quantity() !== null && $product->get_stock_quantity() <= 5,
        'bestseller' => $product->is_featured(),
        'ageBands' => $age_bands,
        'mainImageUrl' => $main_image,
        'galleryUrls' => $gallery_urls,
        'status' => 'upcoming',
        'wooProductId' => $id,
    ];

    if ($full_details) {
        $what_to_bring = get_post_meta($id, '_what_to_bring', true);
        $highlights = get_post_meta($id, '_highlights', true);
        $program['whatToBring'] = is_string($what_to_bring) ? array_map('trim', explode("\n", $what_to_bring)) : ($what_to_bring ?: []);
        $program['highlights'] = is_string($highlights) ? array_map('trim', explode("\n", $highlights)) : ($highlights ?: []);
    }

    return $program;
}

function ptp_get_markets(WP_REST_Request $request) {
    return [
        ['slug' => 'main-line', 'name' => 'Main Line, PA', 'city' => 'Wayne', 'state' => 'PA'],
        ['slug' => 'west-chester', 'name' => 'West Chester, PA', 'city' => 'West Chester', 'state' => 'PA'],
        ['slug' => 'king-of-prussia', 'name' => 'King of Prussia, PA', 'city' => 'King of Prussia', 'state' => 'PA'],
        ['slug' => 'short-hills', 'name' => 'Short Hills, NJ', 'city' => 'Short Hills', 'state' => 'NJ'],
        ['slug' => 'princeton', 'name' => 'Princeton, NJ', 'city' => 'Princeton', 'state' => 'NJ'],
    ];
}

function ptp_get_trainers(WP_REST_Request $request) {
    $page = $request->get_param('page') ?: 1;
    $per_page = $request->get_param('per_page') ?: 20;

    $args = [
        'role__in' => ['ptp_trainer', 'trainer'],
        'number' => $per_page,
        'paged' => $page,
    ];

    $user_query = new WP_User_Query($args);
    $trainers = [];

    foreach ($user_query->get_results() as $user) {
        $trainers[] = ptp_format_trainer_public($user);
    }

    return [
        'trainers' => $trainers,
        'total' => $user_query->get_total(),
        'total_pages' => ceil($user_query->get_total() / $per_page),
    ];
}

function ptp_get_trainer(WP_REST_Request $request) {
    $id = $request->get_param('id');
    $user = get_user_by('ID', $id);

    if (!$user) {
        return new WP_Error('not_found', 'Trainer not found', ['status' => 404]);
    }

    return ptp_format_trainer_public($user, true);
}

function ptp_format_trainer_public($user, $full_details = false) {
    $id = $user->ID;
    $specializations = get_user_meta($id, 'trainer_specializations', true);

    $trainer = [
        'id' => $id,
        'first_name' => get_user_meta($id, 'first_name', true),
        'last_name' => get_user_meta($id, 'last_name', true),
        'avatar_url' => get_user_meta($id, 'trainer_headshot', true) ?: get_avatar_url($id, ['size' => 400]),
        'bio' => get_user_meta($id, 'description', true),
        'education' => get_user_meta($id, 'trainer_education', true),
        'hourly_rate' => (float) (get_user_meta($id, 'trainer_hourly_rate', true) ?: 80),
        'location' => get_user_meta($id, 'trainer_location', true),
        'specializations' => is_array($specializations) ? $specializations : array_map('trim', explode(',', $specializations ?: '')),
        'teaching_style' => get_user_meta($id, 'trainer_teaching_style', true),
        'rating' => (float) (get_user_meta($id, 'trainer_rating', true) ?: 5.0),
        'total_reviews' => (int) (get_user_meta($id, 'trainer_review_count', true) ?: 0),
    ];

    if ($full_details) {
        $trainer['gallery'] = get_user_meta($id, 'trainer_gallery', true) ?: [];
        // Add reviews here if needed
    }

    return $trainer;
}

// ============================================================
// REGISTER CUSTOM POST TYPES
// ============================================================

add_action('init', function() {
    // Players (Children)
    register_post_type('ptp_player', [
        'public' => false,
        'show_ui' => true,
        'labels' => ['name' => 'Players', 'singular_name' => 'Player'],
        'supports' => ['title', 'author'],
    ]);

    // Bookings (Training Sessions)
    register_post_type('ptp_booking', [
        'public' => false,
        'show_ui' => true,
        'labels' => ['name' => 'Bookings', 'singular_name' => 'Booking'],
        'supports' => ['title', 'author'],
    ]);

    // Conversations
    register_post_type('ptp_conversation', [
        'public' => false,
        'show_ui' => true,
        'labels' => ['name' => 'Conversations', 'singular_name' => 'Conversation'],
        'supports' => ['title', 'author'],
    ]);

    // Messages
    register_post_type('ptp_message', [
        'public' => false,
        'show_ui' => false,
        'supports' => ['content', 'author'],
    ]);

    // Trainer role
    if (!get_role('ptp_trainer')) {
        add_role('ptp_trainer', 'PTP Trainer', [
            'read' => true,
            'edit_posts' => false,
            'delete_posts' => false,
        ]);
    }

    // Parent role
    if (!get_role('ptp_parent')) {
        add_role('ptp_parent', 'PTP Parent', [
            'read' => true,
            'edit_posts' => false,
            'delete_posts' => false,
        ]);
    }
});

// ============================================================
// ADMIN META BOXES
// ============================================================

add_action('add_meta_boxes', function() {
    add_meta_box('ptp_camp_details', 'PTP Camp/Clinic Details', 'ptp_render_camp_meta_box', 'product', 'normal', 'high');
});

function ptp_render_camp_meta_box($post) {
    wp_nonce_field('ptp_camp_meta', 'ptp_camp_meta_nonce');

    $fields = [
        '_camp_date' => 'Start Date (YYYY-MM-DD)',
        '_camp_end_date' => 'End Date (YYYY-MM-DD)',
        '_camp_time' => 'Time Display (e.g., "9:00 AM - 3:00 PM")',
        '_camp_time_start' => 'Start Time (24h)',
        '_camp_time_end' => 'End Time (24h)',
        '_camp_location' => 'Full Location',
        '_camp_venue' => 'Venue Name',
        '_camp_address' => 'Street Address',
        '_camp_city' => 'City',
        '_camp_state' => 'State',
        '_market_slug' => 'Market Slug',
        '_age_bands' => 'Age Bands (comma-separated)',
        '_what_to_bring' => 'What to Bring (one per line)',
        '_highlights' => 'Highlights (one per line)',
    ];

    echo '<table class="form-table">';
    foreach ($fields as $key => $label) {
        $value = get_post_meta($post->ID, $key, true);
        $is_textarea = in_array($key, ['_what_to_bring', '_highlights']);
        echo '<tr><th><label for="' . esc_attr($key) . '">' . esc_html($label) . '</label></th><td>';
        if ($is_textarea) {
            echo '<textarea name="' . esc_attr($key) . '" rows="4" class="large-text">' . esc_textarea($value) . '</textarea>';
        } else {
            echo '<input type="text" name="' . esc_attr($key) . '" value="' . esc_attr($value) . '" class="regular-text">';
        }
        echo '</td></tr>';
    }
    echo '</table>';
}

add_action('save_post_product', function($post_id) {
    if (!isset($_POST['ptp_camp_meta_nonce']) || !wp_verify_nonce($_POST['ptp_camp_meta_nonce'], 'ptp_camp_meta')) return;
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) return;

    $fields = ['_camp_date', '_camp_end_date', '_camp_time', '_camp_time_start', '_camp_time_end', '_camp_location', '_camp_venue', '_camp_address', '_camp_city', '_camp_state', '_market_slug', '_age_bands', '_what_to_bring', '_highlights'];
    foreach ($fields as $field) {
        if (isset($_POST[$field])) {
            update_post_meta($post_id, $field, sanitize_textarea_field($_POST[$field]));
        }
    }
});
