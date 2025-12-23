<?php
/**
 * Auth Controller
 *
 * Handles authentication endpoints for the PTP Mobile API.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Auth_Controller class
 */
class PTP_Auth_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v2';

    /**
     * Rate limit settings
     */
    private $rate_limit_attempts = 5;
    private $rate_limit_window = 300; // 5 minutes

    /**
     * Register routes
     */
    public function register_routes() {
        // Login
        register_rest_route($this->namespace, '/auth/login', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'login'),
            'permission_callback' => '__return_true',
            'args' => array(
                'email' => array(
                    'required' => true,
                    'type' => 'string',
                    'format' => 'email',
                ),
                'password' => array(
                    'required' => true,
                    'type' => 'string',
                ),
            ),
        ));

        // Register
        register_rest_route($this->namespace, '/auth/register', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'register'),
            'permission_callback' => '__return_true',
            'args' => array(
                'email' => array(
                    'required' => true,
                    'type' => 'string',
                    'format' => 'email',
                ),
                'password' => array(
                    'required' => true,
                    'type' => 'string',
                    'minLength' => 8,
                ),
                'first_name' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'last_name' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'phone' => array(
                    'required' => false,
                    'type' => 'string',
                ),
                'role' => array(
                    'required' => false,
                    'type' => 'string',
                    'enum' => array('ptp_parent', 'ptp_trainer'),
                    'default' => 'ptp_parent',
                ),
            ),
        ));

        // Get current user
        register_rest_route($this->namespace, '/auth/me', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_current_user'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Update profile
        register_rest_route($this->namespace, '/auth/profile', array(
            'methods' => WP_REST_Server::EDITABLE,
            'callback' => array($this, 'update_profile'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Logout (invalidate token)
        register_rest_route($this->namespace, '/auth/logout', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'logout'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Password reset request
        register_rest_route($this->namespace, '/auth/forgot-password', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'forgot_password'),
            'permission_callback' => '__return_true',
            'args' => array(
                'email' => array(
                    'required' => true,
                    'type' => 'string',
                    'format' => 'email',
                ),
            ),
        ));

        // Register push token
        register_rest_route($this->namespace, '/auth/push-token', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'register_push_token'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'token' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'platform' => array(
                    'required' => true,
                    'type' => 'string',
                    'enum' => array('ios', 'android'),
                ),
            ),
        ));
    }

    /**
     * Check authentication
     */
    public function check_auth($request) {
        $user = wp_get_current_user();
        return $user->ID !== 0;
    }

    /**
     * Check rate limit for an action
     *
     * @param string $action The action being rate limited
     * @param string $identifier Unique identifier (email, IP, etc.)
     * @return true|WP_Error True if allowed, WP_Error if rate limited
     */
    private function check_rate_limit($action, $identifier) {
        $key = 'ptp_rate_' . $action . '_' . md5($identifier);
        $attempts = get_transient($key);

        if ($attempts === false) {
            $attempts = 0;
        }

        if ($attempts >= $this->rate_limit_attempts) {
            ptp_log_activity(0, 'rate_limit_exceeded', array(
                'action' => $action,
                'identifier' => $identifier,
                'ip' => $this->get_client_ip(),
            ));

            return new WP_Error(
                'rate_limited',
                'Too many attempts. Please try again in a few minutes.',
                array('status' => 429)
            );
        }

        return true;
    }

    /**
     * Increment rate limit counter
     *
     * @param string $action The action being rate limited
     * @param string $identifier Unique identifier
     */
    private function increment_rate_limit($action, $identifier) {
        $key = 'ptp_rate_' . $action . '_' . md5($identifier);
        $attempts = get_transient($key);

        if ($attempts === false) {
            $attempts = 0;
        }

        set_transient($key, $attempts + 1, $this->rate_limit_window);
    }

    /**
     * Clear rate limit on successful action
     *
     * @param string $action The action
     * @param string $identifier Unique identifier
     */
    private function clear_rate_limit($action, $identifier) {
        $key = 'ptp_rate_' . $action . '_' . md5($identifier);
        delete_transient($key);
    }

    /**
     * Get client IP address
     */
    private function get_client_ip() {
        $ip = '';
        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = sanitize_text_field($_SERVER['HTTP_CLIENT_IP']);
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = sanitize_text_field(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = sanitize_text_field($_SERVER['REMOTE_ADDR']);
        }
        return $ip;
    }

    /**
     * Login endpoint
     */
    public function login($request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');
        $ip = $this->get_client_ip();

        // Check rate limit by IP and email
        $rate_check = $this->check_rate_limit('login', $ip . '_' . $email);
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        // Authenticate user
        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            // Increment rate limit on failed attempt
            $this->increment_rate_limit('login', $ip . '_' . $email);

            ptp_log_activity(0, 'login_failed', array(
                'email' => $email,
                'ip' => $ip,
            ));

            return new WP_Error(
                'invalid_credentials',
                'Invalid email or password',
                array('status' => 401)
            );
        }

        // Clear rate limit on success
        $this->clear_rate_limit('login', $ip . '_' . $email);

        // Generate JWT token
        $token = $this->generate_jwt_token($user);

        ptp_log_activity($user->ID, 'login_success', array(
            'ip' => $ip,
        ));

        return rest_ensure_response(array(
            'token' => $token,
            'user' => $this->format_user($user),
        ));
    }

    /**
     * Register endpoint
     */
    public function register($request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');
        $first_name = sanitize_text_field($request->get_param('first_name'));
        $last_name = sanitize_text_field($request->get_param('last_name'));
        $phone = sanitize_text_field($request->get_param('phone'));
        $requested_role = sanitize_text_field($request->get_param('role')) ?: 'ptp_parent';
        $ip = $this->get_client_ip();

        // Check rate limit
        $rate_check = $this->check_rate_limit('register', $ip);
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        // Security: Only allow parent role from public registration
        // Trainers must be approved by admin
        $role = 'ptp_parent';
        $pending_trainer = false;
        if ($requested_role === 'ptp_trainer') {
            $pending_trainer = true;
        }

        // Check if email already exists
        if (email_exists($email)) {
            $this->increment_rate_limit('register', $ip);
            return new WP_Error(
                'email_exists',
                'An account with this email already exists',
                array('status' => 400)
            );
        }

        // Create user
        $user_id = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            $this->increment_rate_limit('register', $ip);
            return $user_id;
        }

        // Update user meta
        wp_update_user(array(
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => $first_name . ' ' . $last_name,
        ));

        // Set role (always parent for public registration)
        $user = new WP_User($user_id);
        $user->set_role($role);

        // Mark as pending trainer if requested
        if ($pending_trainer) {
            update_user_meta($user_id, 'ptp_pending_trainer', true);
            update_user_meta($user_id, 'ptp_trainer_request_date', current_time('mysql'));
        }

        // Save phone number
        if ($phone) {
            update_user_meta($user_id, 'phone', $phone);
        }

        // Generate JWT token
        $token = $this->generate_jwt_token($user);

        ptp_log_activity($user_id, 'user_registered', array(
            'ip' => $ip,
            'pending_trainer' => $pending_trainer,
        ));

        $response = array(
            'token' => $token,
            'user' => $this->format_user($user),
        );

        if ($pending_trainer) {
            $response['message'] = 'Account created. Your trainer application is pending approval.';
        }

        return rest_ensure_response($response);
    }

    /**
     * Get current user
     */
    public function get_current_user($request) {
        $user = wp_get_current_user();

        return rest_ensure_response(array(
            'user' => $this->format_user($user),
        ));
    }

    /**
     * Update profile
     */
    public function update_profile($request) {
        $user = wp_get_current_user();
        $params = $request->get_json_params();

        $update_data = array('ID' => $user->ID);

        if (isset($params['first_name'])) {
            $update_data['first_name'] = sanitize_text_field($params['first_name']);
        }

        if (isset($params['last_name'])) {
            $update_data['last_name'] = sanitize_text_field($params['last_name']);
        }

        if (isset($params['first_name']) || isset($params['last_name'])) {
            $first = isset($params['first_name']) ? $params['first_name'] : $user->first_name;
            $last = isset($params['last_name']) ? $params['last_name'] : $user->last_name;
            $update_data['display_name'] = $first . ' ' . $last;
        }

        $result = wp_update_user($update_data);

        if (is_wp_error($result)) {
            return $result;
        }

        // Update meta fields
        if (isset($params['phone'])) {
            update_user_meta($user->ID, 'phone', sanitize_text_field($params['phone']));
        }

        if (isset($params['location'])) {
            update_user_meta($user->ID, 'location', sanitize_text_field($params['location']));
        }

        if (isset($params['avatar_url'])) {
            update_user_meta($user->ID, 'avatar_url', esc_url_raw($params['avatar_url']));
        }

        // Refresh user data
        $user = new WP_User($user->ID);

        return rest_ensure_response(array(
            'user' => $this->format_user($user),
        ));
    }

    /**
     * Logout
     */
    public function logout($request) {
        $user = wp_get_current_user();

        // Remove push token
        delete_user_meta($user->ID, 'push_token');
        delete_user_meta($user->ID, 'push_platform');

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Logged out successfully',
        ));
    }

    /**
     * Forgot password
     */
    public function forgot_password($request) {
        $email = sanitize_email($request->get_param('email'));
        $ip = $this->get_client_ip();

        // Check rate limit (stricter for password reset)
        $rate_check = $this->check_rate_limit('forgot_password', $ip);
        if (is_wp_error($rate_check)) {
            return $rate_check;
        }

        // Always increment to prevent enumeration via timing
        $this->increment_rate_limit('forgot_password', $ip);

        $user = get_user_by('email', $email);

        if (!$user) {
            // Don't reveal if email exists - add consistent delay
            usleep(rand(100000, 300000)); // 100-300ms random delay
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'If an account exists with this email, you will receive password reset instructions.',
            ));
        }

        // Generate reset key
        $key = get_password_reset_key($user);

        if (is_wp_error($key)) {
            error_log('PTP Password Reset Error: ' . $key->get_error_message());
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'If an account exists with this email, you will receive password reset instructions.',
            ));
        }

        // Send reset email
        $reset_url = network_site_url("wp-login.php?action=rp&key=$key&login=" . rawurlencode($user->user_login), 'login');

        $message = sprintf(
            "Hi %s,\n\nYou requested a password reset for your PTP Soccer account.\n\nClick here to reset your password: %s\n\nIf you didn't request this, please ignore this email.\n\n- PTP Soccer Team",
            $user->first_name,
            $reset_url
        );

        wp_mail(
            $email,
            'Reset your PTP Soccer password',
            $message
        );

        ptp_log_activity($user->ID, 'password_reset_requested', array(
            'ip' => $ip,
        ));

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'If an account exists with this email, you will receive password reset instructions.',
        ));
    }

    /**
     * Register push token
     */
    public function register_push_token($request) {
        $user = wp_get_current_user();
        $token = sanitize_text_field($request->get_param('token'));
        $platform = sanitize_text_field($request->get_param('platform'));

        update_user_meta($user->ID, 'push_token', $token);
        update_user_meta($user->ID, 'push_platform', $platform);

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Push token registered',
        ));
    }

    /**
     * Generate JWT token
     */
    private function generate_jwt_token($user) {
        // Check if JWT Auth plugin is active
        if (class_exists('Jwt_Auth')) {
            // Use JWT Auth plugin
            $jwt = new Jwt_Auth();
            return $jwt->generate_token($user);
        }

        // Require explicit secret key configuration
        if (!defined('JWT_AUTH_SECRET_KEY')) {
            error_log('PTP Mobile API: JWT_AUTH_SECRET_KEY not defined in wp-config.php');
            // Fall back to a site-specific key, but log warning
            $secret_key = hash('sha256', wp_salt('auth') . wp_salt('secure_auth'));
        } else {
            $secret_key = JWT_AUTH_SECRET_KEY;
        }

        $issued_at = time();
        $expires_at = $issued_at + (DAY_IN_SECONDS * 7); // 7 days

        // Minimal payload - don't expose sensitive data
        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expires_at,
            'sub' => $user->ID, // Subject (user ID only)
            'jti' => bin2hex(random_bytes(16)), // Unique token ID
        );

        // Use URL-safe base64 encoding (proper JWT spec)
        $header = $this->base64url_encode(json_encode(array('typ' => 'JWT', 'alg' => 'HS256')));
        $payload_encoded = $this->base64url_encode(json_encode($payload));

        // Create signature with raw binary output then encode
        $signature = $this->base64url_encode(
            hash_hmac('sha256', "$header.$payload_encoded", $secret_key, true)
        );

        return "$header.$payload_encoded.$signature";
    }

    /**
     * URL-safe base64 encode (JWT spec compliant)
     */
    private function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * URL-safe base64 decode
     */
    private function base64url_decode($data) {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Verify and decode JWT token
     */
    public function verify_jwt_token($token) {
        $parts = explode('.', $token);
        if (count($parts) !== 3) {
            return false;
        }

        list($header, $payload, $signature) = $parts;

        // Get secret key
        if (!defined('JWT_AUTH_SECRET_KEY')) {
            $secret_key = hash('sha256', wp_salt('auth') . wp_salt('secure_auth'));
        } else {
            $secret_key = JWT_AUTH_SECRET_KEY;
        }

        // Verify signature
        $expected_signature = $this->base64url_encode(
            hash_hmac('sha256', "$header.$payload", $secret_key, true)
        );

        if (!hash_equals($expected_signature, $signature)) {
            return false;
        }

        // Decode payload
        $payload_data = json_decode($this->base64url_decode($payload), true);
        if (!$payload_data) {
            return false;
        }

        // Check expiration
        if (isset($payload_data['exp']) && $payload_data['exp'] < time()) {
            return false;
        }

        return $payload_data;
    }

    /**
     * Format user for API response
     */
    private function format_user($user) {
        $role = 'ptp_parent';
        if (in_array('ptp_trainer', $user->roles)) {
            $role = 'ptp_trainer';
        } elseif (in_array('administrator', $user->roles)) {
            $role = 'administrator';
        }

        $data = array(
            'id' => $user->ID,
            'email' => $user->user_email,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'display_name' => $user->display_name,
            'role' => $role,
            'phone' => get_user_meta($user->ID, 'phone', true),
            'location' => get_user_meta($user->ID, 'location', true),
            'avatar_url' => get_user_meta($user->ID, 'avatar_url', true) ?: get_avatar_url($user->ID),
            'created_at' => $user->user_registered,
        );

        // Add trainer-specific fields
        if ($role === 'ptp_trainer') {
            $data['bio'] = get_user_meta($user->ID, 'trainer_bio', true);
            $data['hourly_rate'] = (float) get_user_meta($user->ID, 'trainer_hourly_rate', true);
            $data['specializations'] = get_user_meta($user->ID, 'trainer_specializations', true) ?: array();
            $data['certifications'] = get_user_meta($user->ID, 'trainer_certifications', true) ?: array();
            $data['rating'] = (float) get_user_meta($user->ID, 'trainer_rating', true);
            $data['total_reviews'] = (int) get_user_meta($user->ID, 'trainer_total_reviews', true);
        }

        // Add parent-specific fields
        if ($role === 'ptp_parent') {
            $data['children'] = $this->get_children($user->ID);
        }

        return $data;
    }

    /**
     * Get children for a parent
     */
    private function get_children($parent_id) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_children';

        $children = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM $table_name WHERE parent_id = %d ORDER BY first_name ASC",
                $parent_id
            ),
            ARRAY_A
        );

        return array_map(function($child) {
            return array(
                'id' => (int) $child['id'],
                'first_name' => $child['first_name'],
                'last_name' => $child['last_name'],
                'date_of_birth' => $child['date_of_birth'],
                'age_band' => $child['age_band'],
                'skill_level' => $child['skill_level'],
                'position' => $child['position'],
                'team' => $child['team'],
                'notes' => $child['notes'],
                'avatar_url' => $child['avatar_url'],
            );
        }, $children ?: array());
    }
}
