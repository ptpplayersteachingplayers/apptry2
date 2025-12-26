<?php
/**
 * Webhook REST Controller
 *
 * Handles incoming webhooks from third-party providers (Stripe, etc.).
 * Adds signature verification to protect from forged webhook calls.
 *
 * @package PTP_Mobile_API
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * PTP Webhook Controller Class
 */
class PTP_Webhook_Controller {

    /**
     * REST namespace
     */
    const NAMESPACE = 'ptp/v1';

    /**
     * Signature tolerance window (seconds)
     */
    const SIGNATURE_TOLERANCE = 300; // 5 minutes

    /**
     * Register routes
     */
    public function register_routes() {
        register_rest_route(self::NAMESPACE, '/webhooks/stripe', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_stripe_webhook'),
            'permission_callback' => '__return_true', // Webhooks are authenticated via signature
        ));
    }

    /**
     * Handle Stripe webhook with signature verification
     *
     * @param WP_REST_Request $request The incoming request.
     * @return WP_REST_Response|WP_Error
     */
    public function handle_stripe_webhook($request) {
        $signing_secret = $this->get_stripe_signing_secret();

        if (empty($signing_secret)) {
            return new WP_Error(
                'stripe_secret_missing',
                'Stripe webhook signing secret is not configured.',
                array('status' => 500)
            );
        }

        $payload = $request->get_body();
        $signature_header = isset($_SERVER['HTTP_STRIPE_SIGNATURE']) ? wp_unslash($_SERVER['HTTP_STRIPE_SIGNATURE']) : '';

        if (!$this->verify_stripe_signature($payload, $signature_header, $signing_secret)) {
            return new WP_Error(
                'stripe_signature_invalid',
                'Webhook signature verification failed.',
                array('status' => 401)
            );
        }

        $event = json_decode($payload, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return new WP_Error('invalid_payload', 'Invalid JSON payload.', array('status' => 400));
        }

        $event_type = isset($event['type']) ? sanitize_text_field($event['type']) : 'unknown';
        $object_id = isset($event['data']['object']['id']) ? sanitize_text_field($event['data']['object']['id']) : '';

        // Log for traceability; downstream handlers can be added here (e.g., mark orders paid)
        if (function_exists('ptp_log_activity')) {
            ptp_log_activity(
                0,
                'stripe_webhook',
                array(
                    'type' => $event_type,
                    'object_id' => $object_id,
                )
            );
        }

        return rest_ensure_response(array(
            'received' => true,
            'type' => $event_type,
        ));
    }

    /**
     * Retrieve Stripe signing secret from env or constants
     *
     * @return string
     */
    private function get_stripe_signing_secret() {
        if (defined('STRIPE_WEBHOOK_SECRET') && !empty(STRIPE_WEBHOOK_SECRET)) {
            return STRIPE_WEBHOOK_SECRET;
        }

        $secret = getenv('STRIPE_WEBHOOK_SECRET');
        return $secret ? trim($secret) : '';
    }

    /**
     * Verify Stripe signature without requiring the stripe-php SDK
     *
     * @param string $payload Raw request body.
     * @param string $signature_header Stripe-Signature header.
     * @param string $signing_secret Signing secret from Stripe dashboard.
     * @return bool
     */
    private function verify_stripe_signature($payload, $signature_header, $signing_secret) {
        if (empty($payload) || empty($signature_header) || empty($signing_secret)) {
            return false;
        }

        $timestamp = null;
        $signatures = array();

        // Parse the header formatted like: t=timestamp,v1=signature
        $parts = explode(',', $signature_header);
        foreach ($parts as $part) {
            $kv = explode('=', trim($part), 2);
            if (count($kv) !== 2) {
                continue;
            }

            if ($kv[0] === 't') {
                $timestamp = intval($kv[1]);
            } elseif ($kv[0] === 'v1') {
                $signatures[] = $kv[1];
            }
        }

        if (null === $timestamp || empty($signatures)) {
            return false;
        }

        // Reject stale signatures to limit replay attacks
        if (abs(time() - $timestamp) > self::SIGNATURE_TOLERANCE) {
            return false;
        }

        $signed_payload = $timestamp . '.' . $payload;
        $expected_signature = hash_hmac('sha256', $signed_payload, $signing_secret);

        foreach ($signatures as $signature) {
            if (hash_equals($expected_signature, $signature)) {
                return true;
            }
        }

        return false;
    }
}
