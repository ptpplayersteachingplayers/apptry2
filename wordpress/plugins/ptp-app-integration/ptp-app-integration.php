<?php
/**
 * Plugin Name: PTP App Integration
 * Plugin URI: https://ptpcamp.com
 * Description: Connects the PTP native app to WooCommerce - passes child IDs through checkout and ensures proper enrollment mapping.
 * Version: 1.0.0
 * Author: PTP Development
 * Author URI: https://ptpcamp.com
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.4
 *
 * @package PTP_App_Integration
 */

defined('ABSPATH') || exit;

/**
 * Main plugin class
 */
class PTP_App_Integration {

    /**
     * Session key for storing child IDs
     */
    const SESSION_KEY = 'ptp_child_ids';

    /**
     * Order meta key
     */
    const ORDER_META_KEY = '_ptp_child_ids';

    /**
     * Query parameter names
     */
    const QUERY_PARAM_SINGLE = 'ptp_child';
    const QUERY_PARAM_MULTIPLE = 'ptp_children';

    /**
     * Constructor
     */
    public function __construct() {
        // Initialize on plugins loaded to ensure WC is available
        add_action('plugins_loaded', array($this, 'init'));
    }

    /**
     * Initialize the plugin
     */
    public function init() {
        // Check if WooCommerce is active
        if (!class_exists('WooCommerce')) {
            add_action('admin_notices', array($this, 'wc_missing_notice'));
            return;
        }

        // Hook into WooCommerce
        $this->init_hooks();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks() {
        // Capture child ID(s) from URL on any page load
        add_action('template_redirect', array($this, 'capture_child_ids_from_url'), 5);

        // Also capture on init for AJAX requests and early processing
        add_action('init', array($this, 'capture_child_ids_from_url'), 20);

        // Store in WC session when session is available
        add_action('woocommerce_init', array($this, 'store_in_session'));

        // Save to order meta when order is created
        add_action('woocommerce_checkout_create_order', array($this, 'save_child_ids_to_order'), 10, 2);

        // Also hook into order creation via REST API
        add_action('woocommerce_rest_insert_shop_order_object', array($this, 'save_child_ids_to_rest_order'), 10, 3);

        // Add to order notes for debugging
        add_action('woocommerce_checkout_order_processed', array($this, 'add_child_ids_order_note'), 10, 3);

        // Display in admin order page
        add_action('woocommerce_admin_order_data_after_billing_address', array($this, 'display_child_ids_in_admin'));

        // Add to order webhook payload
        add_filter('woocommerce_webhook_payload', array($this, 'add_child_ids_to_webhook'), 10, 4);

        // Add custom endpoint for app deep link return
        add_action('init', array($this, 'register_endpoints'));

        // Handle thank you page redirect to app
        add_action('woocommerce_thankyou', array($this, 'maybe_redirect_to_app'), 5);

        // Clear session after successful order
        add_action('woocommerce_thankyou', array($this, 'clear_session_child_ids'), 100);
    }

    /**
     * Admin notice if WooCommerce is missing
     */
    public function wc_missing_notice() {
        ?>
        <div class="notice notice-error">
            <p><?php esc_html_e('PTP App Integration requires WooCommerce to be installed and activated.', 'ptp-app'); ?></p>
        </div>
        <?php
    }

    /**
     * Capture child IDs from URL parameters
     * Supports: ?ptp_child=<uuid> or ?ptp_children=<json_array_or_csv>
     */
    public function capture_child_ids_from_url() {
        $child_ids = array();

        // Check for single child ID
        if (isset($_GET[self::QUERY_PARAM_SINGLE]) && !empty($_GET[self::QUERY_PARAM_SINGLE])) {
            $single_id = $this->sanitize_uuid($_GET[self::QUERY_PARAM_SINGLE]);
            if ($single_id) {
                $child_ids[] = $single_id;
            }
        }

        // Check for multiple child IDs (JSON array or CSV)
        if (isset($_GET[self::QUERY_PARAM_MULTIPLE]) && !empty($_GET[self::QUERY_PARAM_MULTIPLE])) {
            $raw_value = sanitize_text_field(wp_unslash($_GET[self::QUERY_PARAM_MULTIPLE]));

            // Try JSON decode first
            $decoded = json_decode($raw_value, true);
            if (is_array($decoded)) {
                foreach ($decoded as $id) {
                    $sanitized = $this->sanitize_uuid($id);
                    if ($sanitized) {
                        $child_ids[] = $sanitized;
                    }
                }
            } else {
                // Try CSV
                $csv_ids = explode(',', $raw_value);
                foreach ($csv_ids as $id) {
                    $sanitized = $this->sanitize_uuid(trim($id));
                    if ($sanitized) {
                        $child_ids[] = $sanitized;
                    }
                }
            }
        }

        // If we captured any child IDs, store them
        if (!empty($child_ids)) {
            // Store in a transient with user IP as part of key (works before WC session)
            $transient_key = 'ptp_child_ids_' . md5($this->get_client_ip() . wp_get_session_token());
            set_transient($transient_key, $child_ids, HOUR_IN_SECONDS);

            // Also store in cookie as backup
            if (!headers_sent()) {
                $cookie_value = wp_json_encode($child_ids);
                setcookie('ptp_child_ids', $cookie_value, time() + HOUR_IN_SECONDS, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
            }
        }
    }

    /**
     * Store captured child IDs in WC session
     */
    public function store_in_session() {
        if (!WC()->session) {
            return;
        }

        // Check transient first
        $transient_key = 'ptp_child_ids_' . md5($this->get_client_ip() . wp_get_session_token());
        $child_ids = get_transient($transient_key);

        // Fallback to cookie
        if (empty($child_ids) && isset($_COOKIE['ptp_child_ids'])) {
            $decoded = json_decode(sanitize_text_field(wp_unslash($_COOKIE['ptp_child_ids'])), true);
            if (is_array($decoded)) {
                $child_ids = array_map(array($this, 'sanitize_uuid'), $decoded);
                $child_ids = array_filter($child_ids);
            }
        }

        if (!empty($child_ids)) {
            WC()->session->set(self::SESSION_KEY, $child_ids);
        }
    }

    /**
     * Get child IDs from session/storage
     *
     * @return array
     */
    private function get_child_ids() {
        $child_ids = array();

        // Try WC session first
        if (WC()->session) {
            $child_ids = WC()->session->get(self::SESSION_KEY, array());
        }

        // Fallback to transient
        if (empty($child_ids)) {
            $transient_key = 'ptp_child_ids_' . md5($this->get_client_ip() . wp_get_session_token());
            $child_ids = get_transient($transient_key);
        }

        // Fallback to cookie
        if (empty($child_ids) && isset($_COOKIE['ptp_child_ids'])) {
            $decoded = json_decode(sanitize_text_field(wp_unslash($_COOKIE['ptp_child_ids'])), true);
            if (is_array($decoded)) {
                $child_ids = array_map(array($this, 'sanitize_uuid'), $decoded);
                $child_ids = array_filter($child_ids);
            }
        }

        return is_array($child_ids) ? $child_ids : array();
    }

    /**
     * Save child IDs to order meta during checkout
     *
     * @param WC_Order $order
     * @param array    $data
     */
    public function save_child_ids_to_order($order, $data) {
        $child_ids = $this->get_child_ids();

        if (!empty($child_ids)) {
            // Store as JSON string for reliable serialization
            $order->update_meta_data(self::ORDER_META_KEY, wp_json_encode($child_ids));

            // Also store source (for debugging)
            $order->update_meta_data('_ptp_app_source', 'native_app');
        }
    }

    /**
     * Save child IDs for REST API order creation
     *
     * @param WC_Order        $order
     * @param WP_REST_Request $request
     * @param bool            $creating
     */
    public function save_child_ids_to_rest_order($order, $request, $creating) {
        if (!$creating) {
            return;
        }

        // Check if child_ids passed in request meta
        $meta_data = $request->get_param('meta_data');
        if (is_array($meta_data)) {
            foreach ($meta_data as $meta) {
                if (isset($meta['key']) && $meta['key'] === self::ORDER_META_KEY) {
                    $order->update_meta_data(self::ORDER_META_KEY, sanitize_text_field($meta['value']));
                    $order->update_meta_data('_ptp_app_source', 'rest_api');
                    break;
                }
            }
        }
    }

    /**
     * Add order note with child IDs for debugging
     *
     * @param int      $order_id
     * @param array    $posted_data
     * @param WC_Order $order
     */
    public function add_child_ids_order_note($order_id, $posted_data, $order) {
        $child_ids = $order->get_meta(self::ORDER_META_KEY);

        if (!empty($child_ids)) {
            $decoded = json_decode($child_ids, true);
            $count = is_array($decoded) ? count($decoded) : 1;

            $order->add_order_note(
                sprintf(
                    /* translators: 1: Number of children, 2: JSON of child IDs */
                    __('PTP App: Order placed for %1$d child(ren). Child IDs: %2$s', 'ptp-app'),
                    $count,
                    $child_ids
                ),
                false, // Not customer note
                true   // Added by system
            );
        }
    }

    /**
     * Display child IDs in admin order page
     *
     * @param WC_Order $order
     */
    public function display_child_ids_in_admin($order) {
        $child_ids = $order->get_meta(self::ORDER_META_KEY);
        $app_source = $order->get_meta('_ptp_app_source');

        if (!empty($child_ids) || !empty($app_source)) {
            ?>
            <div class="ptp-app-info" style="margin-top: 12px; padding: 10px; background: #f0f7ff; border-left: 4px solid #0073aa;">
                <h4 style="margin: 0 0 8px 0;"><?php esc_html_e('PTP App Order', 'ptp-app'); ?></h4>
                <?php if (!empty($app_source)) : ?>
                    <p><strong><?php esc_html_e('Source:', 'ptp-app'); ?></strong> <?php echo esc_html($app_source); ?></p>
                <?php endif; ?>
                <?php if (!empty($child_ids)) : ?>
                    <p><strong><?php esc_html_e('Child IDs:', 'ptp-app'); ?></strong></p>
                    <code style="display: block; padding: 5px; background: #fff;"><?php echo esc_html($child_ids); ?></code>
                <?php endif; ?>
            </div>
            <?php
        }
    }

    /**
     * Add child IDs to webhook payload
     *
     * @param array  $payload
     * @param string $resource
     * @param int    $resource_id
     * @param int    $webhook_id
     * @return array
     */
    public function add_child_ids_to_webhook($payload, $resource, $resource_id, $webhook_id) {
        // Only modify order webhooks
        if ($resource !== 'order') {
            return $payload;
        }

        $order = wc_get_order($resource_id);
        if (!$order) {
            return $payload;
        }

        $child_ids = $order->get_meta(self::ORDER_META_KEY);
        if (!empty($child_ids)) {
            // Add to meta_data array if not already present
            $found = false;
            if (isset($payload['meta_data']) && is_array($payload['meta_data'])) {
                foreach ($payload['meta_data'] as &$meta) {
                    if ($meta['key'] === self::ORDER_META_KEY) {
                        $found = true;
                        break;
                    }
                }
            }

            if (!$found) {
                if (!isset($payload['meta_data'])) {
                    $payload['meta_data'] = array();
                }
                $payload['meta_data'][] = array(
                    'key'   => self::ORDER_META_KEY,
                    'value' => $child_ids,
                );
            }
        }

        return $payload;
    }

    /**
     * Register custom endpoints
     */
    public function register_endpoints() {
        // Endpoint for app return after checkout
        add_rewrite_rule(
            '^ptp-app-return/?$',
            'index.php?ptp_app_return=1',
            'top'
        );
        add_rewrite_tag('%ptp_app_return%', '1');
    }

    /**
     * Redirect to app after successful order (if from app)
     *
     * @param int $order_id
     */
    public function maybe_redirect_to_app($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) {
            return;
        }

        $app_source = $order->get_meta('_ptp_app_source');

        // Only redirect if order came from app
        if ($app_source !== 'native_app') {
            return;
        }

        // Check if already redirected (to prevent loops)
        if (isset($_GET['app_redirected'])) {
            return;
        }

        // Build app deep link
        $deep_link = sprintf(
            'ptpcamp://checkout/success?order_id=%d&status=%s',
            $order_id,
            $order->get_status()
        );

        // Output JavaScript to redirect to app
        // This is more reliable than header redirect for deep links
        ?>
        <script type="text/javascript">
            (function() {
                var deepLink = <?php echo wp_json_encode($deep_link); ?>;
                var fallbackUrl = <?php echo wp_json_encode(add_query_arg('app_redirected', '1', $order->get_checkout_order_received_url())); ?>;

                // Try to open app
                var start = Date.now();
                window.location.href = deepLink;

                // If still here after 2 seconds, app didn't open - stay on page
                setTimeout(function() {
                    if (Date.now() - start < 3000) {
                        // App opened, do nothing
                    }
                }, 2500);
            })();
        </script>
        <p style="text-align: center; margin-top: 20px;">
            <a href="<?php echo esc_url($deep_link); ?>" class="button" style="background: #0073aa; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                <?php esc_html_e('Return to PTP App', 'ptp-app'); ?>
            </a>
        </p>
        <?php
    }

    /**
     * Clear session child IDs after successful order
     *
     * @param int $order_id
     */
    public function clear_session_child_ids($order_id) {
        // Clear WC session
        if (WC()->session) {
            WC()->session->set(self::SESSION_KEY, null);
        }

        // Clear transient
        $transient_key = 'ptp_child_ids_' . md5($this->get_client_ip() . wp_get_session_token());
        delete_transient($transient_key);

        // Clear cookie
        if (!headers_sent()) {
            setcookie('ptp_child_ids', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true);
        }
    }

    /**
     * Sanitize UUID
     *
     * @param string $uuid
     * @return string|null
     */
    private function sanitize_uuid($uuid) {
        if (!is_string($uuid)) {
            return null;
        }

        $uuid = trim($uuid);

        // Validate UUID format
        if (preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $uuid)) {
            return strtolower($uuid);
        }

        return null;
    }

    /**
     * Get client IP address
     *
     * @return string
     */
    private function get_client_ip() {
        $ip = '';

        if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
            $ip = sanitize_text_field(wp_unslash($_SERVER['HTTP_CLIENT_IP']));
        } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
            $ip = sanitize_text_field(wp_unslash($_SERVER['HTTP_X_FORWARDED_FOR']));
        } elseif (!empty($_SERVER['REMOTE_ADDR'])) {
            $ip = sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']));
        }

        // If multiple IPs (proxy chain), take the first
        if (strpos($ip, ',') !== false) {
            $ip = trim(explode(',', $ip)[0]);
        }

        return $ip;
    }
}

// Initialize plugin
new PTP_App_Integration();

/**
 * Activation hook - flush rewrite rules
 */
register_activation_hook(__FILE__, function() {
    // Add rewrite rules
    add_rewrite_rule(
        '^ptp-app-return/?$',
        'index.php?ptp_app_return=1',
        'top'
    );

    flush_rewrite_rules();
});

/**
 * Deactivation hook
 */
register_deactivation_hook(__FILE__, function() {
    flush_rewrite_rules();
});
