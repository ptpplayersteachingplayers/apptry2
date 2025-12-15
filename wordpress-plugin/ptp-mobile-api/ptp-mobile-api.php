<?php
/**
 * Plugin Name: PTP Mobile API
 * Plugin URI: https://ptpsummercamps.com
 * Description: REST API endpoints for the PTP Soccer mobile app. Provides endpoints for camps, clinics, private training, messaging, and more.
 * Version: 1.0.0
 * Author: PTP Soccer
 * Author URI: https://ptpsummercamps.com
 * License: GPL v2 or later
 * Text Domain: ptp-mobile-api
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('PTP_MOBILE_API_VERSION', '1.0.0');
define('PTP_MOBILE_API_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PTP_MOBILE_API_PLUGIN_URL', plugin_dir_url(__FILE__));

/**
 * Main Plugin Class
 */
class PTP_Mobile_API {

    /**
     * Instance
     */
    private static $instance = null;

    /**
     * REST namespace
     */
    const REST_NAMESPACE = 'ptp/v1';

    /**
     * Get instance
     */
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->includes();
        $this->init_hooks();
    }

    /**
     * Include required files
     */
    private function includes() {
        // Controllers
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-auth-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-programs-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-training-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-messages-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-events-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-trainer-controller.php';
        require_once PTP_MOBILE_API_PLUGIN_DIR . 'includes/class-ptp-push-controller.php';
    }

    /**
     * Initialize hooks
     */
    private function init_hooks() {
        add_action('rest_api_init', array($this, 'register_routes'));
        add_action('init', array($this, 'register_custom_roles'));

        // Add CORS headers for mobile app
        add_action('rest_api_init', array($this, 'add_cors_headers'));
    }

    /**
     * Register REST routes
     */
    public function register_routes() {
        // Auth routes
        $auth_controller = new PTP_Auth_Controller();
        $auth_controller->register_routes();

        // Programs routes (camps & clinics)
        $programs_controller = new PTP_Programs_Controller();
        $programs_controller->register_routes();

        // Training routes (mentors & sessions)
        $training_controller = new PTP_Training_Controller();
        $training_controller->register_routes();

        // Messages routes
        $messages_controller = new PTP_Messages_Controller();
        $messages_controller->register_routes();

        // Events routes (user's schedule)
        $events_controller = new PTP_Events_Controller();
        $events_controller->register_routes();

        // Trainer-specific routes
        $trainer_controller = new PTP_Trainer_Controller();
        $trainer_controller->register_routes();

        // Push notification routes
        $push_controller = new PTP_Push_Controller();
        $push_controller->register_routes();
    }

    /**
     * Register custom user roles
     */
    public function register_custom_roles() {
        // Parent role
        add_role('ptp_parent', 'PTP Parent', array(
            'read' => true,
        ));

        // Trainer role
        add_role('ptp_trainer', 'PTP Trainer', array(
            'read' => true,
        ));
    }

    /**
     * Add CORS headers
     */
    public function add_cors_headers() {
        remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
        add_filter('rest_pre_serve_request', function($value) {
            header('Access-Control-Allow-Origin: *');
            header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
            header('Access-Control-Allow-Headers: Authorization, Content-Type');
            header('Access-Control-Allow-Credentials: true');
            return $value;
        });
    }

    /**
     * Activation hook
     */
    public static function activate() {
        // Create custom database tables if needed
        self::create_tables();

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    /**
     * Create custom tables
     */
    private static function create_tables() {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Messages table
        $table_name = $wpdb->prefix . 'ptp_messages';
        $sql = "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            conversation_id bigint(20) NOT NULL,
            sender_id bigint(20) NOT NULL,
            sender_type varchar(20) NOT NULL,
            content text NOT NULL,
            attachment_urls text,
            status varchar(20) DEFAULT 'sent',
            read_at datetime,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY conversation_id (conversation_id),
            KEY sender_id (sender_id)
        ) $charset_collate;";

        // Conversations table
        $table_name = $wpdb->prefix . 'ptp_conversations';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            participant_ids text NOT NULL,
            related_session_id bigint(20),
            related_program_id bigint(20),
            status varchar(20) DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id)
        ) $charset_collate;";

        // Training sessions table
        $table_name = $wpdb->prefix . 'ptp_training_sessions';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            trainer_id bigint(20) NOT NULL,
            parent_id bigint(20) NOT NULL,
            child_id bigint(20),
            session_date date NOT NULL,
            start_time time NOT NULL,
            end_time time NOT NULL,
            location varchar(255),
            focus text,
            player_notes text,
            trainer_notes text,
            status varchar(20) DEFAULT 'requested',
            price decimal(10,2),
            is_paid tinyint(1) DEFAULT 0,
            order_id bigint(20),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            updated_at datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY trainer_id (trainer_id),
            KEY parent_id (parent_id)
        ) $charset_collate;";

        // Child profiles table
        $table_name = $wpdb->prefix . 'ptp_children';
        $sql .= "CREATE TABLE IF NOT EXISTS $table_name (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            parent_id bigint(20) NOT NULL,
            first_name varchar(100) NOT NULL,
            last_name varchar(100),
            date_of_birth date,
            age_band varchar(10),
            skill_level varchar(20),
            position varchar(50),
            team varchar(100),
            notes text,
            avatar_url varchar(255),
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY parent_id (parent_id)
        ) $charset_collate;";

        require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
        dbDelta($sql);

        // Create push notification tables
        PTP_Push_Controller::create_tables();
    }

    /**
     * Deactivation hook
     */
    public static function deactivate() {
        flush_rewrite_rules();
    }
}

// Initialize plugin
function ptp_mobile_api_init() {
    return PTP_Mobile_API::get_instance();
}
add_action('plugins_loaded', 'ptp_mobile_api_init');

// Activation/deactivation hooks
register_activation_hook(__FILE__, array('PTP_Mobile_API', 'activate'));
register_deactivation_hook(__FILE__, array('PTP_Mobile_API', 'deactivate'));
