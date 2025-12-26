# PTP Training Platform - Checkout API Documentation

## Base URL
```
https://ptpsummercamps.com/wp-json/ptp/v1
```

## Authentication
All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Checkout Endpoints

### 1. Get Checkout Config (Public)
Get Stripe publishable key and checkout configuration.

```
GET /checkout/config
```

**Response:**
```json
{
  "stripe_enabled": true,
  "stripe_publishable_key": "pk_live_...",
  "platform_fee_percent": 20,
  "cancellation_policy": "24 hours notice required for full refund"
}
```

---

### 2. Process Checkout (Authenticated)
Create a booking and payment intent in one call for logged-in users.

```
POST /checkout
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "trainer_id": 123,
  "player_id": 456,
  "session_date": "2025-01-15",
  "session_time": "14:00",
  "location": "Main Street Park",
  "session_type": "single",
  "amount": 80.00,
  "notes": "Focus on dribbling",
  "phone": "555-123-4567"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| trainer_id | int | Yes | Trainer's ID |
| player_id | int | Yes | Player's ID (must belong to parent) |
| session_date | string | Yes | Date in YYYY-MM-DD format |
| session_time | string | Yes | Time in HH:MM format |
| location | string | Yes | Training location |
| session_type | string | Yes | `single`, `package_5`, `package_10`, or `group` |
| amount | float | Yes | Total amount in dollars |
| notes | string | No | Special requests |
| phone | string | No | Parent phone number |

**Response:**
```json
{
  "booking_id": 789,
  "booking_number": "PTP-A1B2C3D4",
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 80.00
}
```

---

### 3. Confirm Checkout (Authenticated)
Confirm payment after Stripe confirms the charge.

```
POST /checkout/confirm
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "booking_id": 789,
  "payment_intent_id": "pi_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "booking_id": 789,
  "booking_number": "PTP-A1B2C3D4",
  "message": "Booking confirmed",
  "redirect_url": "https://ptpsummercamps.com/booking-confirmation/?booking=PTP-A1B2C3D4"
}
```

---

### 4. Guest Checkout (Public)
Create a booking without an account. Optionally create an account.

```
POST /checkout/guest
Content-Type: application/json
```

**Request Body:**
```json
{
  "trainer_id": 123,
  "session_date": "2025-01-15",
  "session_time": "14:00",
  "location": "Main Street Park",
  "session_type": "single",
  "amount": 80.00,
  "email": "parent@example.com",
  "first_name": "John",
  "last_name": "Smith",
  "phone": "555-123-4567",
  "player_first_name": "Jimmy",
  "player_last_name": "Smith",
  "player_age": 12,
  "player_skill": "intermediate",
  "notes": "Focus on shooting",
  "create_account": true,
  "password": "securepassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| trainer_id | int | Yes | Trainer's ID |
| session_date | string | Yes | Date in YYYY-MM-DD format |
| session_time | string | Yes | Time in HH:MM format |
| location | string | Yes | Training location |
| session_type | string | Yes | `single`, `package_5`, `package_10`, or `group` |
| amount | float | Yes | Total amount in dollars |
| email | string | Yes | Parent email |
| first_name | string | Yes | Parent first name |
| last_name | string | Yes | Parent last name |
| phone | string | Yes | Parent phone |
| player_first_name | string | Yes | Player first name |
| player_age | int | Yes | Player age |
| player_last_name | string | No | Player last name |
| player_skill | string | No | `beginner`, `intermediate`, `advanced` |
| notes | string | No | Special requests |
| create_account | bool | No | Create an account with this booking |
| password | string | No | Required if create_account is true (min 8 chars) |

**Response:**
```json
{
  "booking_id": 789,
  "booking_number": "PTP-A1B2C3D4",
  "client_secret": "pi_xxx_secret_xxx",
  "payment_intent_id": "pi_xxx",
  "amount": 80.00,
  "token": "eyJhbGciOiJIUzI1...",
  "user_id": 100,
  "parent_id": 50
}
```

Note: `token` is only returned if `create_account` was true and successful.

---

## Complete Checkout Flow (React Native Example)

```javascript
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';

// 1. Get Stripe config
const configResponse = await fetch(`${API_URL}/checkout/config`);
const { stripe_publishable_key } = await configResponse.json();

// 2. Wrap app in StripeProvider
<StripeProvider publishableKey={stripe_publishable_key}>
  <App />
</StripeProvider>

// 3. In checkout component
const { confirmPayment } = useStripe();

async function handleCheckout() {
  // Create booking + payment intent
  const checkoutResponse = await fetch(`${API_URL}/checkout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      trainer_id: selectedTrainer.id,
      player_id: selectedPlayer.id,
      session_date: date,
      session_time: time,
      location: location,
      session_type: 'single',
      amount: trainer.hourly_rate,
    }),
  });

  const { client_secret, booking_id, payment_intent_id } = await checkoutResponse.json();

  // Confirm payment with Stripe
  const { error, paymentIntent } = await confirmPayment(client_secret, {
    paymentMethodType: 'Card',
  });

  if (error) {
    Alert.alert('Error', error.message);
    return;
  }

  // Confirm booking on server
  const confirmResponse = await fetch(`${API_URL}/checkout/confirm`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      booking_id,
      payment_intent_id,
    }),
  });

  const result = await confirmResponse.json();

  if (result.success) {
    navigation.navigate('BookingConfirmation', {
      bookingNumber: result.booking_number
    });
  }
}
```

---

## Session Types & Pricing

| Type | Value | Description | Discount |
|------|-------|-------------|----------|
| Single | `single` | One 1-hour session | 0% |
| 5-Pack | `package_5` | 5 sessions | 10% |
| 10-Pack | `package_10` | 10 sessions | 15% |
| Group | `group` | Group session | 40% |

**Calculate amount:**
```javascript
const baseRate = trainer.hourly_rate;
let amount = baseRate;
let sessionCount = 1;

switch (sessionType) {
  case 'package_5':
    sessionCount = 5;
    amount = baseRate * 5 * 0.90; // 10% discount
    break;
  case 'package_10':
    sessionCount = 10;
    amount = baseRate * 10 * 0.85; // 15% discount
    break;
  case 'group':
    amount = baseRate * 0.60; // 40% off per player
    break;
}
```

---

## Error Responses

All errors return this format:
```json
{
  "code": "error_code",
  "message": "Human readable message",
  "data": {
    "status": 400
  }
}
```

Common error codes:
- `missing_fields` - Required fields not provided
- `invalid_trainer` - Trainer not found or inactive
- `invalid_player` - Player doesn't belong to parent
- `slot_taken` - Time slot already booked
- `stripe_error` - Payment processing error
- `booking_error` - Database error creating booking

---

## Other Useful Endpoints

### Get Trainers
```
GET /trainers?state=PA&city=Philadelphia
```

### Get Trainer Details
```
GET /trainers/{id}
```

### Get Trainer Availability
```
GET /trainers/{id}/availability?month=1&year=2025
```

### Get Parent's Players
```
GET /parent/players
Authorization: Bearer <token>
```

### Create Player
```
POST /parent/players
Authorization: Bearer <token>
```

### Get Parent's Bookings
```
GET /parent/bookings
Authorization: Bearer <token>
```
