<?php
/**
 * Payments Controller
 *
 * Handles Stripe payment endpoints for the PTP Mobile API.
 * Requires Stripe PHP library and WooCommerce for order management.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP_Payments_Controller class
 */
class PTP_Payments_Controller {

    /**
     * REST namespace
     */
    private $namespace = 'ptp/v2';

    /**
     * Stripe secret key
     */
    private $stripe_secret_key;

    /**
     * Constructor
     */
    public function __construct() {
        $this->stripe_secret_key = defined('STRIPE_SECRET_KEY')
            ? STRIPE_SECRET_KEY
            : get_option('ptp_stripe_secret_key', '');
    }

    /**
     * Register routes
     */
    public function register_routes() {
        // Get Stripe config (publishable key)
        register_rest_route($this->namespace, '/payments/config', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_config'),
            'permission_callback' => '__return_true',
        ));

        // Create payment intent
        register_rest_route($this->namespace, '/payments/intent', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'create_payment_intent'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'amount' => array(
                    'required' => true,
                    'type' => 'integer',
                    'description' => 'Amount in cents',
                ),
                'currency' => array(
                    'type' => 'string',
                    'default' => 'usd',
                ),
                'order_id' => array(
                    'type' => 'integer',
                ),
                'program_id' => array(
                    'type' => 'integer',
                ),
                'payment_method_id' => array(
                    'type' => 'string',
                ),
                'save_payment_method' => array(
                    'type' => 'boolean',
                    'default' => false,
                ),
            ),
        ));

        // Create setup intent (for saving payment methods)
        register_rest_route($this->namespace, '/payments/setup-intent', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'create_setup_intent'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Get payment sheet params
        register_rest_route($this->namespace, '/payments/sheet', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'get_payment_sheet_params'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'amount' => array(
                    'required' => true,
                    'type' => 'integer',
                ),
                'order_id' => array(
                    'type' => 'integer',
                ),
            ),
        ));

        // Confirm payment
        register_rest_route($this->namespace, '/payments/confirm', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'confirm_payment'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'payment_intent_id' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'payment_method_id' => array(
                    'type' => 'string',
                ),
            ),
        ));

        // Get saved payment methods
        register_rest_route($this->namespace, '/payments/methods', array(
            'methods' => WP_REST_Server::READABLE,
            'callback' => array($this, 'get_payment_methods'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Add payment method
        register_rest_route($this->namespace, '/payments/methods', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'add_payment_method'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'payment_method_id' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'set_as_default' => array(
                    'type' => 'boolean',
                    'default' => false,
                ),
            ),
        ));

        // Delete payment method
        register_rest_route($this->namespace, '/payments/methods/(?P<id>[a-zA-Z0-9_]+)', array(
            'methods' => WP_REST_Server::DELETABLE,
            'callback' => array($this, 'delete_payment_method'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Set default payment method
        register_rest_route($this->namespace, '/payments/methods/(?P<id>[a-zA-Z0-9_]+)/default', array(
            'methods' => 'PUT',
            'callback' => array($this, 'set_default_payment_method'),
            'permission_callback' => array($this, 'check_auth'),
        ));

        // Request refund
        register_rest_route($this->namespace, '/payments/refund', array(
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => array($this, 'request_refund'),
            'permission_callback' => array($this, 'check_auth'),
            'args' => array(
                'payment_intent_id' => array(
                    'required' => true,
                    'type' => 'string',
                ),
                'amount' => array(
                    'type' => 'integer',
                    'description' => 'Partial refund amount in cents (optional)',
                ),
                'reason' => array(
                    'type' => 'string',
                    'enum' => array('duplicate', 'fraudulent', 'requested_by_customer'),
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
     * Get Stripe configuration
     */
    public function get_config($request) {
        $publishable_key = defined('STRIPE_PUBLISHABLE_KEY')
            ? STRIPE_PUBLISHABLE_KEY
            : get_option('ptp_stripe_publishable_key', '');

        return rest_ensure_response(array(
            'publishable_key' => $publishable_key,
            'merchant_identifier' => 'merchant.com.ptpsoccer.app',
            'url_scheme' => 'ptpsoccer',
        ));
    }

    /**
     * Create payment intent
     */
    public function create_payment_intent($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $amount = (int) $request->get_param('amount');
        $currency = sanitize_text_field($request->get_param('currency'));
        $order_id = $request->get_param('order_id');
        $program_id = $request->get_param('program_id');
        $payment_method_id = $request->get_param('payment_method_id');
        $save_payment_method = $request->get_param('save_payment_method');

        // Get or create Stripe customer
        $customer_id = $this->get_or_create_stripe_customer($user);

        $intent_data = array(
            'amount' => $amount,
            'currency' => $currency,
            'customer' => $customer_id,
            'metadata' => array(
                'user_id' => $user->ID,
                'order_id' => $order_id,
                'program_id' => $program_id,
            ),
        );

        if ($payment_method_id) {
            $intent_data['payment_method'] = $payment_method_id;
        }

        if ($save_payment_method) {
            $intent_data['setup_future_usage'] = 'off_session';
        }

        try {
            $response = $this->stripe_request('payment_intents', $intent_data, 'POST');

            return rest_ensure_response(array(
                'id' => $response['id'],
                'client_secret' => $response['client_secret'],
                'amount' => $response['amount'],
                'currency' => $response['currency'],
                'status' => $response['status'],
                'payment_method' => $response['payment_method'],
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'payment_intent_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Create setup intent
     */
    public function create_setup_intent($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $customer_id = $this->get_or_create_stripe_customer($user);

        try {
            $response = $this->stripe_request('setup_intents', array(
                'customer' => $customer_id,
                'usage' => 'off_session',
            ), 'POST');

            return rest_ensure_response(array(
                'id' => $response['id'],
                'client_secret' => $response['client_secret'],
                'status' => $response['status'],
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'setup_intent_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Get payment sheet params
     */
    public function get_payment_sheet_params($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $amount = (int) $request->get_param('amount');
        $order_id = $request->get_param('order_id');

        $customer_id = $this->get_or_create_stripe_customer($user);

        try {
            // Create ephemeral key
            $ephemeral_key = $this->stripe_request('ephemeral_keys', array(
                'customer' => $customer_id,
            ), 'POST', array('Stripe-Version: 2023-10-16'));

            // Create payment intent
            $intent = $this->stripe_request('payment_intents', array(
                'amount' => $amount,
                'currency' => 'usd',
                'customer' => $customer_id,
                'metadata' => array(
                    'user_id' => $user->ID,
                    'order_id' => $order_id,
                ),
            ), 'POST');

            return rest_ensure_response(array(
                'payment_intent_client_secret' => $intent['client_secret'],
                'ephemeral_key' => $ephemeral_key['secret'],
                'customer_id' => $customer_id,
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'payment_sheet_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Confirm payment
     */
    public function confirm_payment($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $payment_intent_id = sanitize_text_field($request->get_param('payment_intent_id'));
        $payment_method_id = $request->get_param('payment_method_id');

        try {
            $confirm_data = array();
            if ($payment_method_id) {
                $confirm_data['payment_method'] = $payment_method_id;
            }

            $response = $this->stripe_request(
                "payment_intents/{$payment_intent_id}/confirm",
                $confirm_data,
                'POST'
            );

            // If payment succeeded, update order status
            if ($response['status'] === 'succeeded' && !empty($response['metadata']['order_id'])) {
                $order_id = (int) $response['metadata']['order_id'];
                $order = wc_get_order($order_id);
                if ($order) {
                    $order->payment_complete($payment_intent_id);
                }
            }

            return rest_ensure_response(array(
                'status' => $response['status'],
                'order_id' => $response['metadata']['order_id'] ?? null,
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'payment_confirmation_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Get saved payment methods
     */
    public function get_payment_methods($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $customer_id = get_user_meta($user->ID, 'stripe_customer_id', true);

        if (empty($customer_id)) {
            return rest_ensure_response(array(
                'payment_methods' => array(),
                'default_payment_method_id' => null,
            ));
        }

        try {
            $response = $this->stripe_request(
                "payment_methods?customer={$customer_id}&type=card",
                null,
                'GET'
            );

            // Get default payment method
            $customer = $this->stripe_request("customers/{$customer_id}", null, 'GET');
            $default_pm_id = $customer['invoice_settings']['default_payment_method'] ?? null;

            $payment_methods = array_map(function($pm) use ($default_pm_id) {
                return array(
                    'id' => $pm['id'],
                    'type' => $pm['type'],
                    'is_default' => $pm['id'] === $default_pm_id,
                    'created' => $pm['created'],
                    'card' => array(
                        'brand' => $pm['card']['brand'],
                        'last4' => $pm['card']['last4'],
                        'exp_month' => $pm['card']['exp_month'],
                        'exp_year' => $pm['card']['exp_year'],
                        'funding' => $pm['card']['funding'],
                    ),
                    'billing_details' => $pm['billing_details'],
                );
            }, $response['data'] ?? array());

            return rest_ensure_response(array(
                'payment_methods' => $payment_methods,
                'default_payment_method_id' => $default_pm_id,
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'get_payment_methods_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Add payment method
     */
    public function add_payment_method($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $payment_method_id = sanitize_text_field($request->get_param('payment_method_id'));
        $set_as_default = $request->get_param('set_as_default');

        $customer_id = $this->get_or_create_stripe_customer($user);

        try {
            // Attach payment method to customer
            $this->stripe_request(
                "payment_methods/{$payment_method_id}/attach",
                array('customer' => $customer_id),
                'POST'
            );

            // Set as default if requested or first payment method
            if ($set_as_default) {
                $this->stripe_request(
                    "customers/{$customer_id}",
                    array('invoice_settings' => array('default_payment_method' => $payment_method_id)),
                    'POST'
                );
            }

            // Get the payment method details
            $pm = $this->stripe_request("payment_methods/{$payment_method_id}", null, 'GET');

            return rest_ensure_response(array(
                'id' => $pm['id'],
                'type' => $pm['type'],
                'is_default' => $set_as_default,
                'card' => array(
                    'brand' => $pm['card']['brand'],
                    'last4' => $pm['card']['last4'],
                    'exp_month' => $pm['card']['exp_month'],
                    'exp_year' => $pm['card']['exp_year'],
                    'funding' => $pm['card']['funding'],
                ),
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'add_payment_method_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Delete payment method
     */
    public function delete_payment_method($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $payment_method_id = sanitize_text_field($request->get_param('id'));

        try {
            $this->stripe_request("payment_methods/{$payment_method_id}/detach", array(), 'POST');

            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Payment method removed',
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'delete_payment_method_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Set default payment method
     */
    public function set_default_payment_method($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $user = wp_get_current_user();
        $payment_method_id = sanitize_text_field($request->get_param('id'));
        $customer_id = get_user_meta($user->ID, 'stripe_customer_id', true);

        if (empty($customer_id)) {
            return new WP_Error(
                'no_customer',
                'No Stripe customer found',
                array('status' => 400)
            );
        }

        try {
            $this->stripe_request(
                "customers/{$customer_id}",
                array('invoice_settings' => array('default_payment_method' => $payment_method_id)),
                'POST'
            );

            return rest_ensure_response(array(
                'success' => true,
                'message' => 'Default payment method updated',
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'set_default_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Request refund
     */
    public function request_refund($request) {
        if (empty($this->stripe_secret_key)) {
            return new WP_Error(
                'stripe_not_configured',
                'Stripe is not configured',
                array('status' => 500)
            );
        }

        $payment_intent_id = sanitize_text_field($request->get_param('payment_intent_id'));
        $amount = $request->get_param('amount');
        $reason = $request->get_param('reason');

        try {
            $refund_data = array(
                'payment_intent' => $payment_intent_id,
            );

            if ($amount) {
                $refund_data['amount'] = (int) $amount;
            }

            if ($reason) {
                $refund_data['reason'] = $reason;
            }

            $response = $this->stripe_request('refunds', $refund_data, 'POST');

            return rest_ensure_response(array(
                'refund_id' => $response['id'],
                'amount' => $response['amount'],
                'status' => $response['status'],
            ));
        } catch (Exception $e) {
            return new WP_Error(
                'refund_failed',
                $e->getMessage(),
                array('status' => 400)
            );
        }
    }

    /**
     * Get or create Stripe customer
     */
    private function get_or_create_stripe_customer($user) {
        $customer_id = get_user_meta($user->ID, 'stripe_customer_id', true);

        if (!empty($customer_id)) {
            return $customer_id;
        }

        try {
            $response = $this->stripe_request('customers', array(
                'email' => $user->user_email,
                'name' => $user->display_name,
                'metadata' => array(
                    'wp_user_id' => $user->ID,
                ),
            ), 'POST');

            $customer_id = $response['id'];
            update_user_meta($user->ID, 'stripe_customer_id', $customer_id);

            return $customer_id;
        } catch (Exception $e) {
            error_log('PTP Stripe Error: Failed to create customer - ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Make Stripe API request
     */
    private function stripe_request($endpoint, $data = null, $method = 'POST', $extra_headers = array()) {
        $url = 'https://api.stripe.com/v1/' . $endpoint;

        $headers = array_merge(array(
            'Authorization' => 'Bearer ' . $this->stripe_secret_key,
            'Content-Type' => 'application/x-www-form-urlencoded',
        ), $extra_headers);

        $args = array(
            'method' => $method,
            'headers' => $headers,
            'timeout' => 30,
        );

        if ($data && $method !== 'GET') {
            $args['body'] = $this->build_stripe_body($data);
        }

        $response = wp_remote_request($url, $args);

        if (is_wp_error($response)) {
            throw new Exception($response->get_error_message());
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            throw new Exception($body['error']['message']);
        }

        return $body;
    }

    /**
     * Build Stripe request body (handles nested arrays)
     */
    private function build_stripe_body($data, $prefix = '') {
        $result = array();

        foreach ($data as $key => $value) {
            $full_key = $prefix ? "{$prefix}[{$key}]" : $key;

            if (is_array($value)) {
                $result = array_merge($result, $this->build_stripe_body($value, $full_key));
            } else {
                $result[$full_key] = $value;
            }
        }

        return $result;
    }
}
