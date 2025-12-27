# PTP Native App - Complete Setup Guide

## Overview

This guide walks you through setting up the PTP native app backend with Supabase and connecting it to WordPress/WooCommerce.

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Expo App      │────▶│   Supabase      │◀────│  WooCommerce    │
│   (React Native)│     │   (Backend)     │     │  (Checkout)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │  Auth + Data          │  Edge Functions       │ Webhooks
        └───────────────────────┴───────────────────────┘
```

---

## Step 1: Create Supabase Project

### 1.1 Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Name: `ptp-camp` (or your preference)
4. Database Password: Generate a strong password and **save it**
5. Region: Choose closest to your users (e.g., `us-east-1`)
6. Click "Create new project" - wait ~2 minutes

### 1.2 Get Your Keys
1. Go to **Settings → API**
2. Copy and save these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (safe for client)
   - **service_role key**: `eyJhbG...` (**SECRET - never expose**)

### 1.3 Run the Schema
1. Go to **SQL Editor** in Supabase Dashboard
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Click "Run" (or Ctrl+Enter)
5. You should see "Success. No rows returned"

### 1.4 Verify Tables Created
1. Go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `children`
   - `events`
   - `orders`
   - `enrollments`
   - `waivers`
   - `staff_members`
   - `markets`

---

## Step 2: Configure Supabase Auth

### 2.1 Enable Email Auth
1. Go to **Authentication → Providers**
2. Email should be enabled by default
3. Click on "Email" settings:
   - Enable "Confirm email" → OFF for faster signup (or ON if you want verification)
   - Enable "Secure email change" → ON

### 2.2 Configure Redirect URLs
1. Go to **Authentication → URL Configuration**
2. Set **Site URL**: `https://ptpcamp.com` (your main website)
3. Add **Redirect URLs**:
   ```
   ptpcamp://auth/callback
   ptpcamp://checkout/success
   https://ptpcamp.com/**
   exp://localhost:8081/**
   ```

### 2.3 Configure Email Templates (Optional)
1. Go to **Authentication → Email Templates**
2. Customize the "Magic Link" template with your branding

---

## Step 3: Deploy Edge Function

### 3.1 Install Supabase CLI (Windows)
Open PowerShell as Administrator:
```powershell
# Install via npm (requires Node.js)
npm install -g supabase

# OR via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 3.2 Login and Link Project
```bash
# Login to Supabase
supabase login

# Navigate to project folder
cd /path/to/apptry2

# Link to your project (get project ref from Supabase URL)
supabase link --project-ref your-project-ref
```

### 3.3 Set Edge Function Secrets
```bash
# Set the webhook secret (generate a random string)
supabase secrets set WOO_WEBHOOK_SECRET=your-random-secret-here

# Verify secrets
supabase secrets list
```

### 3.4 Deploy the Function
```bash
# Deploy woo-webhook function
supabase functions deploy woo-webhook --no-verify-jwt
```

### 3.5 Get Function URL
After deployment, your webhook URL will be:
```
https://<project-ref>.supabase.co/functions/v1/woo-webhook
```

---

## Step 4: Setup WordPress Plugin

### 4.1 Install Plugin
1. Copy `wordpress/plugins/ptp-app-integration` folder to your WordPress site:
   ```
   /wp-content/plugins/ptp-app-integration/
   ```

2. In WordPress Admin, go to **Plugins**
3. Activate "PTP App Integration"

### 4.2 Create WooCommerce Webhooks

Go to **WooCommerce → Settings → Advanced → Webhooks**

Create **Webhook 1: Order Created**
- Name: `PTP App - Order Created`
- Status: Active
- Topic: Order created
- Delivery URL: `https://<project-ref>.supabase.co/functions/v1/woo-webhook`
- Secret: Same secret you set in Step 3.3
- API Version: WP REST API Integration v3

Create **Webhook 2: Order Updated**
- Name: `PTP App - Order Updated`
- Status: Active
- Topic: Order updated
- Delivery URL: `https://<project-ref>.supabase.co/functions/v1/woo-webhook`
- Secret: Same secret
- API Version: WP REST API Integration v3

### 4.3 Add Required Product Meta Fields

For each camp/clinic product in WooCommerce, add these custom fields:
- `_camp_date`: ISO date (e.g., `2025-06-15`)
- `_camp_time`: Time string (e.g., `9:00 AM`)
- `_camp_location`: Market name (e.g., `Princeton`)
- `_camp_state`: State code (e.g., `NJ`)
- `_bestseller`: `yes` or empty
- `_almost_full`: `yes` or empty

You can add these via:
- ACF (Advanced Custom Fields)
- Custom meta boxes
- Product data tab custom fields

---

## Step 5: Setup Expo App

### 5.1 Prerequisites (Windows)
```powershell
# Install Node.js (if not installed)
# Download from https://nodejs.org

# Verify installation
node --version  # Should be 18+
npm --version

# Install Expo CLI globally
npm install -g expo-cli eas-cli
```

### 5.2 Install Dependencies
```bash
cd ptp-app

# Install packages
npm install

# Install iOS/Android dependencies (optional, for native builds)
npx expo install
```

### 5.3 Configure Environment
```bash
# Copy example env
cp .env.example .env

# Edit .env with your values
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
EXPO_PUBLIC_WOO_STORE_URL=https://ptpcamp.com
```

### 5.4 Update Supabase Client
Edit `src/lib/supabase.ts` and replace the placeholder values:
```typescript
const SUPABASE_URL = 'https://xxxxx.supabase.co';  // Your URL
const SUPABASE_ANON_KEY = 'eyJhbG...';  // Your anon key
```

### 5.5 Run the App
```bash
# Start development server
npx expo start

# Press 'w' for web
# Press 'a' for Android (needs emulator/device)
# Press 'i' for iOS (needs Mac)
```

---

## Step 6: Test the Integration

### 6.1 Test Webhook with cURL

Test payload (save as `test-order.json`):
```json
{
  "id": 12345,
  "status": "processing",
  "total": "99.00",
  "currency": "USD",
  "date_created": "2025-01-15T10:00:00",
  "date_modified": "2025-01-15T10:00:00",
  "billing": {
    "email": "parent@example.com",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "555-123-4567"
  },
  "line_items": [
    {
      "id": 1,
      "name": "Winter Soccer Clinic - Princeton",
      "product_id": 101,
      "quantity": 1,
      "price": "99.00",
      "meta_data": [
        {"key": "_camp_date", "value": "2025-02-15"},
        {"key": "_camp_time", "value": "6:00 PM"},
        {"key": "_camp_location", "value": "Princeton"},
        {"key": "_camp_state", "value": "NJ"}
      ]
    }
  ],
  "meta_data": [
    {"key": "_ptp_child_ids", "value": "[\"child-uuid-here\"]"}
  ]
}
```

Send test request:
```bash
# Without signature (for testing only, signature verification must be disabled)
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/woo-webhook \
  -H "Content-Type: application/json" \
  -H "x-wc-webhook-topic: order.created" \
  -d @test-order.json
```

Expected response:
```json
{
  "success": true,
  "order_id": "uuid-here",
  "woo_order_id": 12345,
  "enrollments_processed": 1,
  "enrollments": [
    {"child_id": "child-uuid", "event_id": "event-uuid", "action": "created"}
  ]
}
```

### 6.2 Test App Flow
1. Open app → should see login screen
2. Enter email → receive magic link
3. Click link → app opens, logged in
4. Add child profile
5. Browse events
6. Click Register → opens WooCommerce checkout
7. Complete checkout → webhook fires → enrollment created
8. Return to app → ticket appears

---

## Step 7: Add a Staff Member

```sql
-- Run in Supabase SQL Editor
-- First, the user must sign up through the app

-- Then grant staff role (replace with actual user ID from auth.users)
INSERT INTO staff_members (user_id, role, full_name, email)
VALUES (
  'user-uuid-from-auth-users',
  'admin',  -- or 'coach' or 'coordinator'
  'Staff Name',
  'staff@ptpcamp.com'
);
```

---

## File Structure Summary

```
apptry2/
├── supabase/
│   ├── schema.sql              # Database schema + RLS
│   └── functions/
│       └── woo-webhook/
│           └── index.ts        # Webhook handler
├── wordpress/
│   └── plugins/
│       └── ptp-app-integration/
│           └── ptp-app-integration.php
├── ptp-app/
│   ├── app/                    # Expo Router pages
│   │   ├── _layout.tsx
│   │   ├── auth.tsx
│   │   ├── (tabs)/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx       # Events
│   │   │   ├── kids.tsx
│   │   │   ├── tickets.tsx
│   │   │   ├── staff.tsx
│   │   │   └── profile.tsx
│   │   └── event/
│   │       └── [id].tsx
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   ├── lib/
│   │   │   └── supabase.ts
│   │   ├── screens/            # Screen components
│   │   └── types/
│   │       └── database.ts
│   ├── package.json
│   ├── app.json
│   └── tsconfig.json
└── docs/
    ├── SETUP_GUIDE.md          # This file
    └── TROUBLESHOOTING.md      # Error solutions
```
