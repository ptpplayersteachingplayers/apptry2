<?php
/**
 * Push Notification REST Controller
 *
 * Handles push notification registration, preferences, and sending
 * for the PTP Soccer mobile app using Expo Push Notifications.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP Push Controller Class
 */
class PTP_Push_Controller {

    /**
     * REST namespace
     */
    const NAMESPACE = 'ptp/v2';

    /**
     * Expo Push API URL
     */
    const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

    /**
     * Register routes
     */
    public function register_routes() {
        // Register push token
        register_rest_route(self::NAMESPACE, '/push/register', array(
            'methods' => 'POST',
            'callback' => array($this, 'register_token'),
            'permission_callback' => array($this, 'check_authentication'),
            'args' => array(
                'token' => array(
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Expo push token',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
                'platform' => array(
                    'required' => true,
                    'type' => 'string',
                    'enum' => array('ios', 'android'),
                    'description' => 'Device platform',
                ),
            ),
        ));

        // Unregister push token
        register_rest_route(self::NAMESPACE, '/push/unregister', array(
            'methods' => 'POST',
            'callback' => array($this, 'unregister_token'),
            'permission_callback' => array($this, 'check_authentication'),
            'args' => array(
                'token' => array(
                    'required' => true,
                    'type' => 'string',
                    'description' => 'Expo push token to remove',
                    'sanitize_callback' => 'sanitize_text_field',
                ),
            ),
        ));

        // Get notification preferences
        register_rest_route(self::NAMESPACE, '/push/preferences', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_preferences'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Update notification preferences
        register_rest_route(self::NAMESPACE, '/push/preferences', array(
            'methods' => 'PUT',
            'callback' => array($this, 'update_preferences'),
            'permission_callback' => array($this, 'check_authentication'),
            'args' => array(
                'enabled' => array(
                    'type' => 'boolean',
                    'description' => 'Master toggle for all notifications',
                ),
                'sessionReminders' => array(
                    'type' => 'boolean',
                    'description' => 'Session reminder notifications',
                ),
                'newMessages' => array(
                    'type' => 'boolean',
                    'description' => 'New message notifications',
                ),
                'newPrograms' => array(
                    'type' => 'boolean',
                    'description' => 'New program/camp notifications',
                ),
                'promotions' => array(
                    'type' => 'boolean',
                    'description' => 'Promotional notifications',
                ),
                'reminderTime' => array(
                    'type' => 'integer',
                    'description' => 'Minutes before session for reminder',
                    'minimum' => 15,
                    'maximum' => 1440,
                ),
            ),
        ));

        // Get notifications list
        register_rest_route(self::NAMESPACE, '/push/notifications', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_notifications'),
            'permission_callback' => array($this, 'check_authentication'),
            'args' => array(
                'page' => array(
                    'type' => 'integer',
                    'default' => 1,
                ),
                'per_page' => array(
                    'type' => 'integer',
                    'default' => 20,
                    'maximum' => 100,
                ),
            ),
        ));

        // Mark notification as read
        register_rest_route(self::NAMESPACE, '/push/notifications/(?P<id>\d+)/read', array(
            'methods' => 'POST',
            'callback' => array($this, 'mark_as_read'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Mark all as read
        register_rest_route(self::NAMESPACE, '/push/notifications/read-all', array(
            'methods' => 'POST',
            'callback' => array($this, 'mark_all_as_read'),
            'permission_callback' => array($this, 'check_authentication'),
        ));

        // Get unread count
        register_rest_route(self::NAMESPACE, '/push/unread-count', array(
            'methods' => 'GET',
            'callback' => array($this, 'get_unread_count'),
            'permission_callback' => array($this, 'check_authentication'),
        ));
    }

    /**
     * Check if user is authenticated
     */
    public function check_authentication($request) {
        return is_user_logged_in();
    }

    /**
     * Register push notification token
     */
    public function register_token($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $token = $request->get_param('token');
        $platform = $request->get_param('platform');
        $table_name = $wpdb->prefix . 'ptp_push_tokens';

        // Validate Expo push token format
        if (!$this->is_valid_expo_token($token)) {
            return new WP_Error(
                'invalid_token',
                'Invalid Expo push token format',
                array('status' => 400)
            );
        }

        // Check if token already exists
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM $table_name WHERE push_token = %s",
            $token
        ));

        if ($existing) {
            // Update existing token with current user
            $wpdb->update(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'platform' => $platform,
                    'updated_at' => current_time('mysql'),
                ),
                array('id' => $existing)
            );
        } else {
            // Insert new token
            $wpdb->insert(
                $table_name,
                array(
                    'user_id' => $user_id,
                    'push_token' => $token,
                    'platform' => $platform,
                    'created_at' => current_time('mysql'),
                    'updated_at' => current_time('mysql'),
                )
            );
        }

        return rest_ensure_response(array(
            'success' => true,
            'message' => 'Push token registered successfully',
        ));
    }

    /**
     * Unregister push notification token
     */
    public function unregister_token($request) {
        global $wpdb;
        $token = $request->get_param('token');
        $table_name = $wpdb->prefix . 'ptp_push_tokens';

        $deleted = $wpdb->delete(
            $table_name,
            array('push_token' => $token)
        );

        return rest_ensure_response(array(
            'success' => $deleted > 0,
            'message' => $deleted > 0 ? 'Push token removed' : 'Token not found',
        ));
    }

    /**
     * Get notification preferences
     */
    public function get_preferences($request) {
        $user_id = get_current_user_id();

        $defaults = array(
            'enabled' => true,
            'sessionReminders' => true,
            'newMessages' => true,
            'newPrograms' => true,
            'promotions' => false,
            'reminderTime' => 60,
        );

        $saved = get_user_meta($user_id, 'ptp_notification_preferences', true);

        if (empty($saved)) {
            $saved = array();
        }

        return rest_ensure_response(array_merge($defaults, $saved));
    }

    /**
     * Update notification preferences
     */
    public function update_preferences($request) {
        $user_id = get_current_user_id();
        $params = $request->get_params();

        $allowed_keys = array(
            'enabled',
            'sessionReminders',
            'newMessages',
            'newPrograms',
            'promotions',
            'reminderTime',
        );

        $current = get_user_meta($user_id, 'ptp_notification_preferences', true);
        if (empty($current)) {
            $current = array();
        }

        foreach ($allowed_keys as $key) {
            if (isset($params[$key])) {
                $current[$key] = $params[$key];
            }
        }

        update_user_meta($user_id, 'ptp_notification_preferences', $current);

        return rest_ensure_response(array(
            'success' => true,
            'preferences' => $current,
        ));
    }

    /**
     * Get user notifications
     */
    public function get_notifications($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $page = $request->get_param('page');
        $per_page = $request->get_param('per_page');
        $offset = ($page - 1) * $per_page;
        $table_name = $wpdb->prefix . 'ptp_notifications';

        $notifications = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM $table_name
             WHERE user_id = %d
             ORDER BY created_at DESC
             LIMIT %d OFFSET %d",
            $user_id,
            $per_page,
            $offset
        ));

        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE user_id = %d",
            $user_id
        ));

        $formatted = array_map(function($n) {
            return array(
                'id' => (int) $n->id,
                'title' => $n->title,
                'message' => $n->message,
                'type' => $n->type,
                'data' => json_decode($n->data, true),
                'isRead' => (bool) $n->is_read,
                'createdAt' => $n->created_at,
            );
        }, $notifications);

        return rest_ensure_response(array(
            'notifications' => $formatted,
            'total' => (int) $total,
            'page' => $page,
            'perPage' => $per_page,
            'totalPages' => ceil($total / $per_page),
        ));
    }

    /**
     * Mark notification as read
     */
    public function mark_as_read($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $notification_id = $request->get_param('id');
        $table_name = $wpdb->prefix . 'ptp_notifications';

        $updated = $wpdb->update(
            $table_name,
            array('is_read' => 1, 'read_at' => current_time('mysql')),
            array('id' => $notification_id, 'user_id' => $user_id)
        );

        return rest_ensure_response(array(
            'success' => $updated > 0,
        ));
    }

    /**
     * Mark all notifications as read
     */
    public function mark_all_as_read($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $table_name = $wpdb->prefix . 'ptp_notifications';

        $wpdb->update(
            $table_name,
            array('is_read' => 1, 'read_at' => current_time('mysql')),
            array('user_id' => $user_id, 'is_read' => 0)
        );

        return rest_ensure_response(array(
            'success' => true,
        ));
    }

    /**
     * Get unread notification count
     */
    public function get_unread_count($request) {
        global $wpdb;
        $user_id = get_current_user_id();
        $table_name = $wpdb->prefix . 'ptp_notifications';

        $count = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM $table_name WHERE user_id = %d AND is_read = 0",
            $user_id
        ));

        return rest_ensure_response(array(
            'count' => (int) $count,
        ));
    }

    /**
     * Validate Expo push token format
     */
    private function is_valid_expo_token($token) {
        return preg_match('/^ExponentPushToken\[.+\]$/', $token) ||
               preg_match('/^ExpoPushToken\[.+\]$/', $token);
    }

    /**
     * Send push notification to user (static method for use by other controllers)
     */
    public static function send_to_user($user_id, $title, $body, $data = array()) {
        global $wpdb;
        $table_name = $wpdb->prefix . 'ptp_push_tokens';
        $notifications_table = $wpdb->prefix . 'ptp_notifications';

        // Check user notification preferences
        $prefs = get_user_meta($user_id, 'ptp_notification_preferences', true);
        if (!empty($prefs) && isset($prefs['enabled']) && !$prefs['enabled']) {
            return false; // User has disabled notifications
        }

        // Store notification in database
        $wpdb->insert(
            $notifications_table,
            array(
                'user_id' => $user_id,
                'title' => $title,
                'message' => $body,
                'type' => $data['type'] ?? 'general',
                'data' => json_encode($data),
                'is_read' => 0,
                'created_at' => current_time('mysql'),
            )
        );

        // Get user's push tokens (active in last 30 days)
        $tokens = $wpdb->get_col($wpdb->prepare(
            "SELECT push_token FROM $table_name
             WHERE user_id = %d
             AND updated_at > DATE_SUB(NOW(), INTERVAL 30 DAY)",
            $user_id
        ));

        if (empty($tokens)) {
            return false;
        }

        // Send to Expo Push API
        return self::send_expo_push($tokens, $title, $body, $data);
    }

    /**
     * Send push notification via Expo Push API
     */
    private static function send_expo_push($tokens, $title, $body, $data = array()) {
        $messages = array();

        foreach ($tokens as $token) {
            $messages[] = array(
                'to' => $token,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'data' => $data,
                'badge' => 1,
            );
        }

        $response = wp_remote_post(self::EXPO_PUSH_URL, array(
            'headers' => array(
                'Accept' => 'application/json',
                'Accept-Encoding' => 'gzip, deflate',
                'Content-Type' => 'application/json',
            ),
            'body' => json_encode($messages),
            'timeout' => 30,
        ));

        if (is_wp_error($response)) {
            error_log('PTP Push Error: ' . $response->get_error_message());
            return false;
        }

        $result = json_decode(wp_remote_retrieve_body($response), true);

        // Handle invalid tokens (remove them from database)
        if (!empty($result['data'])) {
            global $wpdb;
            $table_name = $wpdb->prefix . 'ptp_push_tokens';

            foreach ($result['data'] as $i => $r) {
                if (!empty($r['status']) && $r['status'] === 'error') {
                    if (in_array($r['details']['error'] ?? '', array('DeviceNotRegistered', 'InvalidCredentials'))) {
                        $wpdb->delete($table_name, array('push_token' => $tokens[$i]));
                    }
                }
            }
        }

        return $result;
    }

    /**
     * Send bulk notification to all users of a role
     */
    public static function send_to_role($role, $title, $body, $data = array()) {
        $users = get_users(array('role' => $role));
        $sent = 0;

        foreach ($users as $user) {
            if (self::send_to_user($user->ID, $title, $body, $data)) {
                $sent++;
            }
        }

        return $sent;
    }

    /**
     * Create database tables
     */
    public static function create_tables() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        // Push tokens table
        $table_name = $wpdb->prefix . 'ptp_push_tokens';
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            push_token varchar(255) NOT NULL,
            platform varchar(20) NOT NULL,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY push_token (push_token),
            KEY user_id (user_id)
        ) $charset_collate;";

        // Notifications table
        $table_name = $wpdb->prefix . 'ptp_notifications';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            user_id bigint(20) NOT NULL,
            title varchar(255) NOT NULL,
            message text NOT NULL,
            type varchar(50) DEFAULT 'general',
            data text,
            is_read tinyint(1) DEFAULT 0,
            read_at datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY user_id (user_id),
            KEY is_read (is_read),
            KEY type (type)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);
    }
}
