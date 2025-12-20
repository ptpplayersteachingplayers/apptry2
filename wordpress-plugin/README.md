# PTP Stripe Payments Plugin

WordPress plugin for native Stripe payment processing with the PTP Soccer mobile app.

## Installation

1. Upload the `ptp-stripe-payments` folder to `/wp-content/plugins/`
2. Run `composer install` inside the plugin folder
3. Activate the plugin in WordPress admin
4. Go to **Settings > PTP Stripe** to configure

## Configuration

1. Get your Stripe API keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Enter your **Publishable Key** (pk_test_... or pk_live_...)
3. Enter your **Secret Key** (sk_test_... or sk_live_...)
4. Set up the webhook in Stripe Dashboard with the URL shown in settings
5. Enter the **Webhook Secret** (whsec_...)

## API Endpoints

All endpoints require authentication (logged-in user).

### Create Payment Intent
```
POST /wp-json/ptp/v1/payments/create-intent
{
    "amount": 2500,      // Amount in cents ($25.00)
    "orderId": 123,      // Optional
    "programId": 456,    // Optional
    "paymentMethodId": "pm_xxx"  // Optional
}
```

### Confirm Payment
```
POST /wp-json/ptp/v1/payments/confirm
{
    "paymentIntentId": "pi_xxx",
    "paymentMethodId": "pm_xxx"
}
```

### Get Payment Methods
```
GET /wp-json/ptp/v1/payments/methods
```

### Add Payment Method
```
POST /wp-json/ptp/v1/payments/methods
{
    "paymentMethodId": "pm_xxx",
    "setAsDefault": true
}
```

### Delete Payment Method
```
DELETE /wp-json/ptp/v1/payments/methods/{id}
```

### Set Default Payment Method
```
POST /wp-json/ptp/v1/payments/methods/{id}/default
```

### Create Setup Intent (for saving cards)
```
POST /wp-json/ptp/v1/payments/setup-intent
```

### Get Stripe Config
```
GET /wp-json/ptp/v1/payments/config
```

## Webhook Events

Configure these events in Stripe Dashboard:
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

## Apple Pay Setup

1. Register merchant ID in [Apple Developer Portal](https://developer.apple.com/)
2. Create Apple Pay certificate
3. Upload certificate to Stripe Dashboard
4. Add merchant ID to plugin settings

## Testing

Use Stripe test cards:
- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155

## Hooks

```php
// After successful payment
do_action('ptp_payment_success', $payment_intent, $user_id, $order_id);

// After failed payment
do_action('ptp_payment_failed', $payment_intent, $user_id, $order_id);
```
