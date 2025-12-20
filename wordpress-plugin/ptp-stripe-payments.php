<?php
/**
 * Plugin Name: PTP Stripe Payments
 * Plugin URI: https://ptpsoccer.com
 * Description: Native Stripe payment processing for PTP Soccer mobile app
 * Version: 1.0.0
 * Author: PTP Soccer
 * Author URI: https://ptpsoccer.com
 * Text Domain: ptp-stripe
 * Requires PHP: 7.4
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PTP_STRIPE_VERSION', '1.0.0');
define('PTP_STRIPE_PLUGIN_DIR', plugin_dir_path(__FILE__));

/**
 * Main PTP Stripe Payments Class
 */
class PTP_Stripe_Payments {

    private static $instance = null;
    private $stripe;

    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->init_hooks();
    }

    private function init_hooks() {
        add_action('rest_api_init', [$this, 'register_rest_routes']);
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('wp_ajax_ptp_stripe_webhook', [$this, 'handle_webhook']);
        add_action('wp_ajax_nopriv_ptp_stripe_webhook', [$this, 'handle_webhook']);
    }

    /**
     * Get Stripe instance
     */
    private function get_stripe() {
        if (!$this->stripe) {
            require_once PTP_STRIPE_PLUGIN_DIR . 'vendor/autoload.php';
            $secret_key = get_option('ptp_stripe_secret_key', '');
            \Stripe\Stripe::setApiKey($secret_key);
            $this->stripe = new \Stripe\StripeClient($secret_key);
        }
        return $this->stripe;
    }

    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        $namespace = 'ptp/v1';

        // Payment Intent endpoints
        register_rest_route($namespace, '/payments/create-intent', [
            'methods' => 'POST',
            'callback' => [$this, 'create_payment_intent'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        register_rest_route($namespace, '/payments/confirm', [
            'methods' => 'POST',
            'callback' => [$this, 'confirm_payment'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        // Payment Methods endpoints
        register_rest_route($namespace, '/payments/methods', [
            'methods' => 'GET',
            'callback' => [$this, 'get_payment_methods'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        register_rest_route($namespace, '/payments/methods', [
            'methods' => 'POST',
            'callback' => [$this, 'add_payment_method'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        register_rest_route($namespace, '/payments/methods/(?P<id>[a-zA-Z0-9_]+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_payment_method'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        register_rest_route($namespace, '/payments/methods/(?P<id>[a-zA-Z0-9_]+)/default', [
            'methods' => 'POST',
            'callback' => [$this, 'set_default_payment_method'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        // Setup Intent for saving cards
        register_rest_route($namespace, '/payments/setup-intent', [
            'methods' => 'POST',
            'callback' => [$this, 'create_setup_intent'],
            'permission_callback' => [$this, 'check_auth'],
        ]);

        // Stripe config (publishable key)
        register_rest_route($namespace, '/payments/config', [
            'methods' => 'GET',
            'callback' => [$this, 'get_stripe_config'],
            'permission_callback' => '__return_true',
        ]);

        // Webhook endpoint
        register_rest_route($namespace, '/payments/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    /**
     * Check if user is authenticated
     */
    public function check_auth() {
        return is_user_logged_in();
    }

    /**
     * Get or create Stripe customer for user
     */
    private function get_or_create_customer($user_id) {
        $customer_id = get_user_meta($user_id, 'ptp_stripe_customer_id', true);

        if ($customer_id) {
            try {
                $customer = $this->get_stripe()->customers->retrieve($customer_id);
                if ($customer && !$customer->deleted) {
                    return $customer_id;
                }
            } catch (\Exception $e) {
                // Customer doesn't exist, create new one
            }
        }

        $user = get_userdata($user_id);

        try {
            $customer = $this->get_stripe()->customers->create([
                'email' => $user->user_email,
                'name' => $user->display_name,
                'metadata' => [
                    'wp_user_id' => $user_id,
                ],
            ]);

            update_user_meta($user_id, 'ptp_stripe_customer_id', $customer->id);
            return $customer->id;
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage());
        }
    }

    /**
     * Create Payment Intent
     */
    public function create_payment_intent($request) {
        $user_id = get_current_user_id();
        $amount = intval($request->get_param('amount')); // Amount in cents
        $order_id = $request->get_param('orderId');
        $program_id = $request->get_param('programId');
        $payment_method_id = $request->get_param('paymentMethodId');

        if ($amount < 50) {
            return new WP_Error('invalid_amount', 'Amount must be at least $0.50', ['status' => 400]);
        }

        $customer_id = $this->get_or_create_customer($user_id);
        if (is_wp_error($customer_id)) {
            return $customer_id;
        }

        try {
            $intent_params = [
                'amount' => $amount,
                'currency' => 'usd',
                'customer' => $customer_id,
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'wp_user_id' => $user_id,
                    'order_id' => $order_id,
                    'program_id' => $program_id,
                ],
            ];

            // Attach payment method if provided
            if ($payment_method_id) {
                $intent_params['payment_method'] = $payment_method_id;
            }

            $intent = $this->get_stripe()->paymentIntents->create($intent_params);

            return rest_ensure_response([
                'id' => $intent->id,
                'clientSecret' => $intent->client_secret,
                'amount' => $intent->amount,
                'currency' => $intent->currency,
                'status' => $intent->status,
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Confirm Payment
     */
    public function confirm_payment($request) {
        $payment_intent_id = $request->get_param('paymentIntentId');
        $payment_method_id = $request->get_param('paymentMethodId');

        try {
            $intent = $this->get_stripe()->paymentIntents->confirm($payment_intent_id, [
                'payment_method' => $payment_method_id,
            ]);

            return rest_ensure_response([
                'success' => $intent->status === 'succeeded',
                'status' => $intent->status,
                'paymentIntent' => [
                    'id' => $intent->id,
                    'status' => $intent->status,
                    'amount' => $intent->amount,
                ],
            ]);
        } catch (\Exception $e) {
            return rest_ensure_response([
                'success' => false,
                'error' => [
                    'code' => 'payment_failed',
                    'message' => $e->getMessage(),
                ],
            ]);
        }
    }

    /**
     * Get Payment Methods
     */
    public function get_payment_methods($request) {
        $user_id = get_current_user_id();
        $customer_id = $this->get_or_create_customer($user_id);

        if (is_wp_error($customer_id)) {
            return $customer_id;
        }

        try {
            $payment_methods = $this->get_stripe()->paymentMethods->all([
                'customer' => $customer_id,
                'type' => 'card',
            ]);

            // Get customer to find default payment method
            $customer = $this->get_stripe()->customers->retrieve($customer_id);
            $default_pm = $customer->invoice_settings->default_payment_method ?? null;

            $methods = [];
            foreach ($payment_methods->data as $pm) {
                $methods[] = [
                    'id' => $pm->id,
                    'type' => 'card',
                    'isDefault' => $pm->id === $default_pm,
                    'card' => [
                        'brand' => $pm->card->brand,
                        'last4' => $pm->card->last4,
                        'expMonth' => $pm->card->exp_month,
                        'expYear' => $pm->card->exp_year,
                        'funding' => $pm->card->funding,
                    ],
                ];
            }

            return rest_ensure_response([
                'paymentMethods' => $methods,
                'defaultPaymentMethodId' => $default_pm,
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Add Payment Method
     */
    public function add_payment_method($request) {
        $user_id = get_current_user_id();
        $payment_method_id = $request->get_param('paymentMethodId');
        $set_as_default = $request->get_param('setAsDefault') ?? false;

        $customer_id = $this->get_or_create_customer($user_id);
        if (is_wp_error($customer_id)) {
            return $customer_id;
        }

        try {
            // Attach payment method to customer
            $this->get_stripe()->paymentMethods->attach($payment_method_id, [
                'customer' => $customer_id,
            ]);

            // Set as default if requested
            if ($set_as_default) {
                $this->get_stripe()->customers->update($customer_id, [
                    'invoice_settings' => [
                        'default_payment_method' => $payment_method_id,
                    ],
                ]);
            }

            // Get the payment method details
            $pm = $this->get_stripe()->paymentMethods->retrieve($payment_method_id);

            return rest_ensure_response([
                'success' => true,
                'paymentMethod' => [
                    'id' => $pm->id,
                    'type' => 'card',
                    'isDefault' => $set_as_default,
                    'card' => [
                        'brand' => $pm->card->brand,
                        'last4' => $pm->card->last4,
                        'expMonth' => $pm->card->exp_month,
                        'expYear' => $pm->card->exp_year,
                        'funding' => $pm->card->funding,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Delete Payment Method
     */
    public function delete_payment_method($request) {
        $payment_method_id = $request->get_param('id');

        try {
            $this->get_stripe()->paymentMethods->detach($payment_method_id);

            return rest_ensure_response([
                'success' => true,
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Set Default Payment Method
     */
    public function set_default_payment_method($request) {
        $user_id = get_current_user_id();
        $payment_method_id = $request->get_param('id');

        $customer_id = $this->get_or_create_customer($user_id);
        if (is_wp_error($customer_id)) {
            return $customer_id;
        }

        try {
            $this->get_stripe()->customers->update($customer_id, [
                'invoice_settings' => [
                    'default_payment_method' => $payment_method_id,
                ],
            ]);

            return rest_ensure_response([
                'success' => true,
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Create Setup Intent (for saving cards without payment)
     */
    public function create_setup_intent($request) {
        $user_id = get_current_user_id();

        $customer_id = $this->get_or_create_customer($user_id);
        if (is_wp_error($customer_id)) {
            return $customer_id;
        }

        try {
            $setup_intent = $this->get_stripe()->setupIntents->create([
                'customer' => $customer_id,
                'payment_method_types' => ['card'],
                'metadata' => [
                    'wp_user_id' => $user_id,
                ],
            ]);

            return rest_ensure_response([
                'id' => $setup_intent->id,
                'clientSecret' => $setup_intent->client_secret,
            ]);
        } catch (\Exception $e) {
            return new WP_Error('stripe_error', $e->getMessage(), ['status' => 400]);
        }
    }

    /**
     * Get Stripe Config (publishable key)
     */
    public function get_stripe_config($request) {
        return rest_ensure_response([
            'publishableKey' => get_option('ptp_stripe_publishable_key', ''),
            'merchantIdentifier' => get_option('ptp_stripe_merchant_id', 'merchant.com.ptpsoccer.app'),
        ]);
    }

    /**
     * Handle Stripe Webhooks
     */
    public function handle_webhook($request) {
        $payload = $request->get_body();
        $sig_header = $request->get_header('Stripe-Signature');
        $webhook_secret = get_option('ptp_stripe_webhook_secret', '');

        try {
            $event = \Stripe\Webhook::constructEvent(
                $payload, $sig_header, $webhook_secret
            );
        } catch (\UnexpectedValueException $e) {
            return new WP_Error('invalid_payload', 'Invalid payload', ['status' => 400]);
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return new WP_Error('invalid_signature', 'Invalid signature', ['status' => 400]);
        }

        // Handle the event
        switch ($event->type) {
            case 'payment_intent.succeeded':
                $payment_intent = $event->data->object;
                $this->handle_payment_success($payment_intent);
                break;

            case 'payment_intent.payment_failed':
                $payment_intent = $event->data->object;
                $this->handle_payment_failure($payment_intent);
                break;

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
            case 'customer.subscription.deleted':
                // Handle subscription events if needed
                break;
        }

        return rest_ensure_response(['received' => true]);
    }

    /**
     * Handle successful payment
     */
    private function handle_payment_success($payment_intent) {
        $order_id = $payment_intent->metadata->order_id ?? null;
        $user_id = $payment_intent->metadata->wp_user_id ?? null;

        if ($order_id) {
            // Update WooCommerce order if using WooCommerce
            if (function_exists('wc_get_order')) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $order->payment_complete($payment_intent->id);
                    $order->add_order_note(
                        sprintf('Payment completed via Stripe. Payment Intent: %s', $payment_intent->id)
                    );
                }
            }

            // Or update custom order table
            global $wpdb;
            $wpdb->update(
                $wpdb->prefix . 'ptp_orders',
                [
                    'status' => 'completed',
                    'stripe_payment_intent' => $payment_intent->id,
                    'paid_at' => current_time('mysql'),
                ],
                ['id' => $order_id]
            );
        }

        // Fire action for other plugins to hook into
        do_action('ptp_payment_success', $payment_intent, $user_id, $order_id);
    }

    /**
     * Handle failed payment
     */
    private function handle_payment_failure($payment_intent) {
        $order_id = $payment_intent->metadata->order_id ?? null;
        $user_id = $payment_intent->metadata->wp_user_id ?? null;

        if ($order_id) {
            if (function_exists('wc_get_order')) {
                $order = wc_get_order($order_id);
                if ($order) {
                    $order->update_status('failed', 'Payment failed via Stripe.');
                }
            }
        }

        do_action('ptp_payment_failed', $payment_intent, $user_id, $order_id);
    }

    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_options_page(
            'PTP Stripe Settings',
            'PTP Stripe',
            'manage_options',
            'ptp-stripe-settings',
            [$this, 'render_settings_page']
        );
    }

    /**
     * Register settings
     */
    public function register_settings() {
        register_setting('ptp_stripe_settings', 'ptp_stripe_publishable_key');
        register_setting('ptp_stripe_settings', 'ptp_stripe_secret_key');
        register_setting('ptp_stripe_settings', 'ptp_stripe_webhook_secret');
        register_setting('ptp_stripe_settings', 'ptp_stripe_merchant_id');
        register_setting('ptp_stripe_settings', 'ptp_stripe_test_mode');
    }

    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1>PTP Stripe Payment Settings</h1>

            <form method="post" action="options.php">
                <?php settings_fields('ptp_stripe_settings'); ?>

                <table class="form-table">
                    <tr>
                        <th scope="row">Test Mode</th>
                        <td>
                            <label>
                                <input type="checkbox" name="ptp_stripe_test_mode" value="1"
                                    <?php checked(get_option('ptp_stripe_test_mode'), 1); ?>>
                                Enable test mode
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Publishable Key</th>
                        <td>
                            <input type="text" name="ptp_stripe_publishable_key"
                                value="<?php echo esc_attr(get_option('ptp_stripe_publishable_key')); ?>"
                                class="regular-text" placeholder="pk_test_... or pk_live_...">
                            <p class="description">Your Stripe publishable key (starts with pk_)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Secret Key</th>
                        <td>
                            <input type="password" name="ptp_stripe_secret_key"
                                value="<?php echo esc_attr(get_option('ptp_stripe_secret_key')); ?>"
                                class="regular-text" placeholder="sk_test_... or sk_live_...">
                            <p class="description">Your Stripe secret key (starts with sk_)</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Webhook Secret</th>
                        <td>
                            <input type="password" name="ptp_stripe_webhook_secret"
                                value="<?php echo esc_attr(get_option('ptp_stripe_webhook_secret')); ?>"
                                class="regular-text" placeholder="whsec_...">
                            <p class="description">Your Stripe webhook signing secret</p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row">Apple Pay Merchant ID</th>
                        <td>
                            <input type="text" name="ptp_stripe_merchant_id"
                                value="<?php echo esc_attr(get_option('ptp_stripe_merchant_id', 'merchant.com.ptpsoccer.app')); ?>"
                                class="regular-text">
                            <p class="description">Your Apple Pay merchant identifier</p>
                        </td>
                    </tr>
                </table>

                <h2>Webhook URL</h2>
                <p>Add this URL to your Stripe Dashboard webhook settings:</p>
                <code><?php echo esc_url(rest_url('ptp/v1/payments/webhook')); ?></code>

                <h3>Required Webhook Events</h3>
                <ul>
                    <li><code>payment_intent.succeeded</code></li>
                    <li><code>payment_intent.payment_failed</code></li>
                </ul>

                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}

// Initialize plugin
PTP_Stripe_Payments::get_instance();

/**
 * Plugin activation
 */
register_activation_hook(__FILE__, function() {
    // Create custom orders table if not using WooCommerce
    global $wpdb;
    $charset_collate = $wpdb->get_charset_collate();

    $sql = "CREATE TABLE IF NOT EXISTS {$wpdb->prefix}ptp_orders (
        id bigint(20) NOT NULL AUTO_INCREMENT,
        user_id bigint(20) NOT NULL,
        program_id bigint(20),
        amount int(11) NOT NULL,
        currency varchar(3) DEFAULT 'usd',
        status varchar(20) DEFAULT 'pending',
        stripe_payment_intent varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        paid_at datetime,
        PRIMARY KEY (id),
        KEY user_id (user_id),
        KEY status (status)
    ) $charset_collate;";

    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
});
