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
    private $namespace = 'ptp/v1';

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
     * Login endpoint
     */
    public function login($request) {
        $email = sanitize_email($request->get_param('email'));
        $password = $request->get_param('password');

        // Authenticate user
        $user = wp_authenticate($email, $password);

        if (is_wp_error($user)) {
            return new WP_Error(
                'invalid_credentials',
                'Invalid email or password',
                array('status' => 401)
            );
        }

        // Generate JWT token (requires JWT Auth plugin or custom implementation)
        $token = $this->generate_jwt_token($user);

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
        $role = sanitize_text_field($request->get_param('role')) ?: 'ptp_parent';

        // Check if email already exists
        if (email_exists($email)) {
            return new WP_Error(
                'email_exists',
                'An account with this email already exists',
                array('status' => 400)
            );
        }

        // Create user
        $user_id = wp_create_user($email, $password, $email);

        if (is_wp_error($user_id)) {
            return $user_id;
        }

        // Update user meta
        wp_update_user(array(
            'ID' => $user_id,
            'first_name' => $first_name,
            'last_name' => $last_name,
            'display_name' => $first_name . ' ' . $last_name,
        ));

        // Set role
        $user = new WP_User($user_id);
        $user->set_role($role);

        // Save phone number
        if ($phone) {
            update_user_meta($user_id, 'phone', $phone);
        }

        // Generate JWT token
        $token = $this->generate_jwt_token($user);

        return rest_ensure_response(array(
            'token' => $token,
            'user' => $this->format_user($user),
        ));
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

        $user = get_user_by('email', $email);

        if (!$user) {
            // Don't reveal if email exists
            return rest_ensure_response(array(
                'success' => true,
                'message' => 'If an account exists with this email, you will receive password reset instructions.',
            ));
        }

        // Generate reset key
        $key = get_password_reset_key($user);

        if (is_wp_error($key)) {
            return new WP_Error(
                'reset_error',
                'Unable to generate password reset link',
                array('status' => 500)
            );
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

        // Simple token implementation (for development)
        // In production, use a proper JWT library
        $secret_key = defined('JWT_AUTH_SECRET_KEY') ? JWT_AUTH_SECRET_KEY : wp_salt('auth');
        $issued_at = time();
        $expires_at = $issued_at + (DAY_IN_SECONDS * 7); // 7 days

        $payload = array(
            'iss' => get_bloginfo('url'),
            'iat' => $issued_at,
            'exp' => $expires_at,
            'user_id' => $user->ID,
            'email' => $user->user_email,
        );

        $header = base64_encode(json_encode(array('typ' => 'JWT', 'alg' => 'HS256')));
        $payload_encoded = base64_encode(json_encode($payload));
        $signature = hash_hmac('sha256', "$header.$payload_encoded", $secret_key);

        return "$header.$payload_encoded.$signature";
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
