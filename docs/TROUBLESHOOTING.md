# PTP Native App - Troubleshooting Guide

## Quick Diagnostics

Before diving into specific issues, run these checks:

```sql
-- Check if tables exist (run in Supabase SQL Editor)
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT tablename, policyname, cmd FROM pg_policies
WHERE schemaname = 'public';

-- Check recent orders
SELECT id, woo_order_id, status, billing_email, created_at
FROM orders ORDER BY created_at DESC LIMIT 5;

-- Check recent enrollments
SELECT e.id, c.first_name, ev.title, e.status, e.created_at
FROM enrollments e
JOIN children c ON e.child_id = c.id
JOIN events ev ON e.event_id = ev.id
ORDER BY e.created_at DESC LIMIT 5;
```

---

## Issue 1: Webhook Not Firing

### Symptoms
- Orders created in WooCommerce but no data in Supabase
- No entries in `orders` or `enrollments` tables

### Diagnosis Steps

**Step 1: Check WooCommerce Webhook Logs**
1. Go to **WooCommerce → Status → Logs**
2. Look for files starting with `webhooks-`
3. Check for error messages

**Step 2: Test Webhook Manually**
```bash
# Simple test (replace URL)
curl -X POST \
  https://xxxxx.supabase.co/functions/v1/woo-webhook \
  -H "Content-Type: application/json" \
  -d '{"id": 1, "status": "test"}'
```

**Step 3: Check Supabase Function Logs**
1. Go to Supabase Dashboard → **Edge Functions**
2. Click on `woo-webhook`
3. View **Logs** tab

### Solutions

**A. Webhook URL Incorrect**
- Verify URL format: `https://<project-ref>.supabase.co/functions/v1/woo-webhook`
- No trailing slash
- HTTPS required

**B. Webhook Not Active**
- Go to WooCommerce → Settings → Advanced → Webhooks
- Ensure status is "Active"
- Check "Last delivery" column for errors

**C. Function Not Deployed**
```bash
# Redeploy function
supabase functions deploy woo-webhook --no-verify-jwt
```

**D. CORS or SSL Issues**
```bash
# Test with verbose output
curl -v -X POST \
  https://xxxxx.supabase.co/functions/v1/woo-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

---

## Issue 2: Signature Mismatch (401 Invalid Signature)

### Symptoms
- Webhook returns 401 error
- Logs show "Webhook signature verification failed"

### Diagnosis

**Check Secrets Match**
```bash
# View current secret in Supabase
supabase secrets list

# Should show WOO_WEBHOOK_SECRET
```

### Solutions

**A. Regenerate and Sync Secret**
1. Generate new secret: `openssl rand -hex 32`
2. Update in WooCommerce webhook settings
3. Update in Supabase:
   ```bash
   supabase secrets set WOO_WEBHOOK_SECRET=your-new-secret
   ```
4. Redeploy function:
   ```bash
   supabase functions deploy woo-webhook --no-verify-jwt
   ```

**B. Temporarily Disable Signature Check (Development Only)**
Edit `supabase/functions/woo-webhook/index.ts`:
```typescript
// Comment out verification for testing
// if (webhookSecret) {
//   if (!verifyWebhookSignature(rawBody, signature, webhookSecret)) {
//     console.error("Webhook signature verification failed");
//     return new Response(JSON.stringify({ error: "Invalid signature" }), {
//       status: 401,
//     });
//   }
// }
```

**C. Encoding Issues**
Ensure the secret is stored without extra whitespace or newlines:
```bash
# Set secret without newline
echo -n "your-secret" | supabase secrets set WOO_WEBHOOK_SECRET
```

---

## Issue 3: RLS Blocking Reads (Empty Data in App)

### Symptoms
- App shows "No events found" but events exist in database
- Profile doesn't load after login
- Children list empty despite adding them

### Diagnosis

**Test Without RLS (Admin Query)**
```sql
-- In Supabase SQL Editor (bypasses RLS)
SELECT * FROM events LIMIT 5;
SELECT * FROM profiles LIMIT 5;
SELECT * FROM children LIMIT 5;
```

**Check User Session**
In the app, add debug logging:
```typescript
const { data: { user } } = await supabase.auth.getUser();
console.log('Current user:', user?.id);
```

### Solutions

**A. User Not Authenticated**
Check that the session is valid:
```typescript
// In your component
useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session) {
      console.log('No active session');
      // Redirect to login
    }
  });
}, []);
```

**B. RLS Policy Too Restrictive**
```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'events';

-- If events policy requires auth but should be public:
DROP POLICY IF EXISTS "Authenticated users can view events" ON events;

CREATE POLICY "Anyone can view published events"
  ON events FOR SELECT
  USING (is_published = TRUE);
```

**C. Profile Not Created on Signup**
Check if the trigger is working:
```sql
-- Verify trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Manually create missing profile
INSERT INTO profiles (id, email)
SELECT id, email FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

**D. Using Wrong Supabase Client**
Ensure you're using the authenticated client:
```typescript
// CORRECT - uses auth session
const { data } = await supabase
  .from('children')
  .select('*');

// WRONG - if you created a separate anon client
const anonClient = createClient(url, anonKey);  // No session!
```

---

## Issue 4: Deep Link Not Returning to App

### Symptoms
- Complete checkout but stuck on website
- App doesn't open after payment
- "Return to App" button doesn't work

### Diagnosis

**Check URL Scheme Configuration**
1. Verify `app.json` has correct scheme:
   ```json
   {
     "expo": {
       "scheme": "ptpcamp"
     }
   }
   ```

2. Test deep link manually:
   ```
   ptpcamp://checkout/success?order_id=123
   ```

### Solutions

**A. iOS: URL Scheme Not Registered**
After changing `app.json`, rebuild:
```bash
# Clear cache and rebuild
npx expo start --clear

# For native build
eas build --platform ios
```

**B. Android: Intent Filter Issues**
Check `app.json` has intent filters:
```json
{
  "android": {
    "intentFilters": [
      {
        "action": "VIEW",
        "data": [{"scheme": "ptpcamp"}],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  }
}
```

**C. WP Plugin Not Outputting Redirect**
Check order meta shows app source:
```sql
-- In WooCommerce database or Supabase
SELECT * FROM orders WHERE woo_order_id = 12345;
-- Should have _ptp_app_source = 'native_app'
```

If missing, the child ID wasn't passed from app:
```typescript
// In EventDetailScreen, verify URL includes ptp_children param
const checkoutUrl = `${event.woo_product_url}?add-to-cart=${event.woo_product_id}&ptp_children=${childIdsParam}`;
console.log('Checkout URL:', checkoutUrl);
```

**D. In-App Browser Issues**
Try using Linking instead of WebBrowser:
```typescript
import * as Linking from 'expo-linking';

// Instead of WebBrowser.openBrowserAsync
await Linking.openURL(checkoutUrl);
```

---

## Issue 5: Enrollments Not Mapping to Correct Child

### Symptoms
- Order created but no enrollment
- Enrollment created for wrong child
- Multiple children but only one enrolled

### Diagnosis

**Check Order Meta**
```sql
-- See what child_ids were captured
SELECT woo_order_id, child_ids, raw_webhook_data->>'meta_data' as meta
FROM orders
WHERE woo_order_id = 12345;
```

**Check Webhook Logs**
Look for console output like:
- "Auto-assigned single child: uuid"
- "No child mapped for line item X"

### Solutions

**A. Child ID Not Passed Through Checkout**
1. Verify the URL has the parameter:
   ```
   /product/123?ptp_children=["uuid1","uuid2"]
   ```

2. Check WP plugin is active and capturing:
   - Look for `ptp_child_ids` in cookies
   - Check order meta in WP Admin

**B. Parent Not Found by Email**
```sql
-- Check if parent exists with matching email
SELECT * FROM profiles WHERE email = 'customer@example.com';

-- If email case mismatch, the profile might exist but not match
SELECT * FROM profiles WHERE LOWER(email) = LOWER('Customer@Example.com');
```

**C. Child Doesn't Belong to Parent**
```sql
-- Verify child-parent relationship
SELECT c.*, p.email as parent_email
FROM children c
JOIN profiles p ON c.parent_id = p.id
WHERE c.id = 'child-uuid';
```

**D. Webhook Processing Multiple Times**
Check for duplicate enrollments:
```sql
SELECT child_id, event_id, COUNT(*)
FROM enrollments
GROUP BY child_id, event_id
HAVING COUNT(*) > 1;
```

The unique constraint should prevent this, but if using upsert incorrectly:
```sql
-- Clean up duplicates (keep earliest)
DELETE FROM enrollments e1
USING enrollments e2
WHERE e1.child_id = e2.child_id
  AND e1.event_id = e2.event_id
  AND e1.created_at > e2.created_at;
```

---

## Issue 6: QR Check-in Not Working

### Symptoms
- Staff scan returns error
- "Invalid QR code" message
- "Unauthorized" error

### Diagnosis

**Verify Staff Role**
```sql
SELECT * FROM staff_members WHERE user_id = 'staff-user-uuid';
-- Should return a row with is_active = true
```

**Verify QR Code Exists**
```sql
SELECT * FROM enrollments WHERE qr_code = 'scanned-qr-value';
```

### Solutions

**A. User Not Staff**
```sql
-- Grant staff access
INSERT INTO staff_members (user_id, role, full_name, email, is_active)
VALUES ('user-uuid', 'coach', 'Staff Name', 'staff@ptp.com', true);
```

**B. QR Code Not Found**
The QR code is auto-generated. If missing:
```sql
-- Regenerate QR codes for enrollments missing them
UPDATE enrollments
SET qr_code = encode(gen_random_bytes(16), 'hex')
WHERE qr_code IS NULL;
```

**C. Already Checked In**
```sql
-- Check status
SELECT checked_in_at FROM enrollments WHERE qr_code = 'xxx';

-- Reset check-in (for testing)
UPDATE enrollments
SET checked_in_at = NULL, checked_in_by = NULL
WHERE qr_code = 'xxx';
```

---

## Common Error Messages

| Error | Cause | Fix |
|-------|-------|-----|
| `PGRST301` | RLS policy violation | Check auth session and policy |
| `23505` | Duplicate key violation | Record already exists |
| `42501` | Permission denied | RLS or missing grants |
| `ECONNREFUSED` | Supabase unreachable | Check URL and network |
| `Invalid API key` | Wrong anon/service key | Verify keys in settings |
| `JWT expired` | Session timeout | Refresh token or re-login |

---

## Support Contacts

- **Supabase Issues**: [supabase.com/dashboard/support](https://supabase.com/dashboard/support)
- **Expo Issues**: [expo.dev/eas](https://expo.dev)
- **WooCommerce Webhooks**: [woocommerce.com/document/webhooks](https://woocommerce.com/document/webhooks/)

---

## Debug Mode

Enable verbose logging during development:

**Supabase Edge Function**
```typescript
// Add at top of function
console.log('Request headers:', Object.fromEntries(req.headers));
console.log('Request body:', rawBody);
```

**Expo App**
```typescript
// In supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(url, key, {
  auth: { ... },
  global: {
    // Log all requests
    fetch: (...args) => {
      console.log('Supabase request:', args[0]);
      return fetch(...args);
    },
  },
});
```

**WP Plugin**
```php
// Add to ptp-app-integration.php
add_action('init', function() {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('PTP Plugin: Child IDs = ' . print_r($_GET, true));
    }
});
```
