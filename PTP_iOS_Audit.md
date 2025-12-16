# PTP Soccer iOS App Audit Report

**Audit Date**: December 16, 2025
**Auditor**: Claude Code
**App Version**: 1.0.0
**Expo SDK**: 54.0.0

---

## Executive Summary

This audit evaluates the PTP Soccer Camps iOS app and its WordPress/WooCommerce backend integration against production readiness criteria for security, payments, push notifications, and App Store compliance.

### Critical Findings

| Priority | Count | Summary |
|----------|-------|---------|
| **P0 (Critical)** | 5 | CORS wildcard, missing webhook verification, no server-side payment validation, EAS build failing, Node version mismatch |
| **P1 (High)** | 4 | No analytics/crash reporting, missing tests/CI, rate limiting absent, ATT disclosures incomplete |
| **P2 (Medium)** | 4 | Privacy URLs placeholder, documentation gaps, checkout error handling, JWT refresh strategy |

---

## 1. System Architecture Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PTP Soccer iOS App                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────────────┐ │
│  │   Expo 54   │  │   React     │  │    Axios    │  │   expo-    │ │
│  │   Runtime   │  │ Navigation 7│  │ API Client  │  │ secure-    │ │
│  │             │  │             │  │ + JWT Intcp │  │ store      │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────────────┘ │
│         │                │                │               │         │
│         └────────────────┴────────────────┴───────────────┘         │
│                                   │                                  │
└───────────────────────────────────┼──────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    WordPress / WooCommerce Backend                   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                  PTP Mobile API Plugin                        │   │
│  │  /wp-json/ptp/v1/                                            │   │
│  │  ├── auth/ (login, register, forgot-password, push-token)   │   │
│  │  ├── programs/ (camps, clinics, featured, locations)        │   │
│  │  ├── trainers/ (list, detail, availability)                 │   │
│  │  ├── training/ (sessions, requests)                         │   │
│  │  ├── messages/ (conversations, send)                        │   │
│  │  ├── events/ (schedule, calendar)                           │   │
│  │  └── push/ (register, preferences, notifications)           │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐ │
│  │ WooCommerce │  │  JWT Auth   │  │    Custom DB Tables         │ │
│  │  Products   │  │   Plugin    │  │ ptp_messages, ptp_children  │ │
│  │  Orders     │  │             │  │ ptp_training_sessions       │ │
│  │  Checkout   │◄─┤ (Required)  │  │ ptp_push_tokens             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘ │
│         │                                        │                   │
└─────────┼────────────────────────────────────────┼───────────────────┘
          │                                        │
          ▼                                        ▼
┌─────────────────────┐                 ┌─────────────────────────────┐
│   Stripe Payments   │                 │     Expo Push Service       │
│   (via WooCommerce) │                 │   exp.host/--/api/v2/push   │
└─────────────────────┘                 └─────────────────────────────┘
```

### Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Framework | React Native + Expo | 0.76.9 / SDK 54 |
| Language | TypeScript | 5.3 |
| Navigation | React Navigation | 7.x |
| Data Fetching | React Query + Axios | 5.17 / 1.6 |
| Secure Storage | expo-secure-store | 14.0.1 |
| Push Notifications | expo-notifications | 0.29.13 |
| Backend | WordPress + WooCommerce | - |
| Auth | JWT Authentication | Custom + WP Plugin |
| Checkout | WebView (WooCommerce) | - |

### API Strategy

- **Primary API**: Custom `/wp-json/ptp/v1/*` endpoints (versioned)
- **Auth**: WordPress JWT Authentication plugin (`/wp-json/jwt-auth/v1/token`)
- **Checkout**: WebView-based WooCommerce checkout (not native Store API)

---

## 2. Detailed Audit Checklist

### Legend
- ✅ **PASS**: Requirement met with evidence
- ❌ **FAIL**: Requirement not met, fix required
- ⚠️ **PARTIAL**: Partially met, improvements needed
- ❓ **UNKNOWN**: Cannot verify from repo, treat as FAIL

---

### 0) System Map

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| README exists | ✅ PASS | `README.md:1-227` - Comprehensive documentation | - |
| Architecture documented | ✅ PASS | `README.md:77-119` - Project structure | - |
| API endpoints documented | ✅ PASS | `README.md:154-192` - All endpoints listed | - |
| Environment separation | ✅ PASS | `app.config.js:12-26`, `eas.json:1-75` - dev/preview/prod | - |
| Base URL not hardcoded | ⚠️ PARTIAL | `src/api/config.ts:18` - Fallback hardcoded | Move to env-only |

---

### 1) WordPress Backend Fundamentals

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| HTTPS enforced | ✅ PASS | `app.config.js:105` - `https://ptpsummercamps.com` | - |
| HSTS configured | ❓ UNKNOWN | Server config not in repo | Add server-side |
| WAF/CDN noted | ❓ UNKNOWN | Not documented | Document in README |
| Rate limiting | ❌ FAIL | No rate limiting in plugin code | Add rate limiting middleware |
| WP update hygiene | ❓ UNKNOWN | No documentation | Add to ops docs |
| Least privilege | ✅ PASS | `ptp-mobile-api.php:121-128` - Custom roles defined | - |
| XML-RPC disabled | ❓ UNKNOWN | Not in plugin | Document/disable |
| Backups/monitoring | ❓ UNKNOWN | Not documented | Add to ops docs |

---

### 2) API Strategy

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Versioned endpoints | ✅ PASS | `ptp-mobile-api.php:38` - `/ptp/v1` namespace | - |
| Auth documented | ✅ PASS | `README.md:152-153` - JWT mentioned | - |
| CORS not wildcard | ❌ FAIL (P0) | `ptp-mobile-api.php:136` - `Access-Control-Allow-Origin: *` | Restrict to app domains |
| Protected endpoints | ✅ PASS | `class-ptp-auth-controller.php:88-89` - `check_auth` used | - |
| Rate limiting | ❌ FAIL | No implementation found | Add via WP plugin or server |

**CORS Fix Required** (`wordpress-plugin/ptp-mobile-api/ptp-mobile-api.php:134-141`):
```php
// BEFORE (insecure)
header('Access-Control-Allow-Origin: *');

// AFTER (secure)
$allowed_origins = array(
    'https://ptpsummercamps.com',
    'exp://localhost:8081', // Dev only
);
$origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
if (in_array($origin, $allowed_origins) || defined('WP_DEBUG') && WP_DEBUG) {
    header('Access-Control-Allow-Origin: ' . $origin);
}
```

---

### 3) Data Model (PTP-Specific Fields)

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Program type (winter/summer) | ✅ PASS | `src/types/program.ts:76` - `categorySlug: 'winter-clinics' \| 'summer'` | - |
| City/market slug | ✅ PASS | `src/types/program.ts:42` - `marketSlug` field | - |
| State | ✅ PASS | `src/types/program.ts:41` - `state: USState` | - |
| Date (ISO) | ✅ PASS | `src/types/program.ts:30` - ISO format documented | - |
| Time display | ✅ PASS | `src/types/program.ts:32-34` - time, timeStart, timeEnd | - |
| Venue/address | ✅ PASS | `src/types/program.ts:37-39` - venue, address fields | - |
| Age range | ✅ PASS | `src/types/program.ts:58-60` - ageBands, minAge, maxAge | - |
| Stock/capacity | ✅ PASS | `src/types/program.ts:53` - stock field | - |
| Badges (bestseller/almost full) | ✅ PASS | `src/types/program.ts:54-55` - boolean flags | - |
| Price + sale price | ✅ PASS | `src/types/program.ts:49-51` - price, regularPrice, salePrice | - |
| WP meta conventions | ⚠️ PARTIAL | `class-ptp-programs-controller.php:420-431` - Uses `_ptp_*` prefix | Not `_camp_*` per spec |

---

### 4) Authentication & Accounts

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Guest browsing | ✅ PASS | `class-ptp-programs-controller.php:34` - `permission_callback: __return_true` | - |
| Sign in | ✅ PASS | `src/api/auth.ts:26-49` - `login()` function | - |
| Sign out | ✅ PASS | `src/api/auth.ts:133-135` - `logout()` clears tokens | - |
| Forgot password | ✅ PASS | `src/api/auth.ts:142-149` - `requestPasswordReset()` | - |
| Order history | ✅ PASS | `src/api/orders.ts:24-31` - `getMyOrders()` | - |
| Tokens in Keychain | ✅ PASS | `src/api/client.ts:45-51` - Uses `SecureStore` | - |
| Token refresh strategy | ⚠️ PARTIAL | `src/api/client.ts:104-111` - Clears on 401, no refresh | Add refresh token flow |
| No secrets in logs | ✅ PASS | No `console.log(token)` found | - |

**Token Refresh Fix** (`src/api/client.ts`): Add refresh token interceptor before clearing tokens.

---

### 5) Checkout & Payments

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Add to cart | ⚠️ PARTIAL | `src/api/config.ts:59-72` - URL-based, not native | Uses WebView |
| Inventory respected | ❓ UNKNOWN | WooCommerce handles via WebView | - |
| Stripe supported | ✅ PASS | `mockOrders` show `paymentMethod: 'stripe'` | - |
| Apple Pay | ❓ UNKNOWN | Depends on WooCommerce config | Verify in WC |
| Terms/waiver acceptance | ❓ UNKNOWN | WebView checkout - not verified | Add to checkout |
| Confirmation screen | ✅ PASS | `CheckoutScreen.tsx:112-140` - Success state | - |
| Order stored | ✅ PASS | `src/api/orders.ts:24-31` - Orders API | - |
| Receipt email | ❓ UNKNOWN | WooCommerce handles | Verify WC config |
| Server-side validation | ❌ FAIL (P0) | Token passed in URL `src/api/config.ts:68` | Don't pass token in URL |
| Webhook verification | ❌ FAIL (P0) | No Stripe webhook code in plugin | Add webhook handler |
| Idempotency | ⚠️ PARTIAL | `CheckoutScreen.tsx:39,56-57` - `hasHandledSuccess` ref | Backend needs idempotency keys |

**Critical Security Fixes Required**:

1. **Token in URL** (`src/api/config.ts:67-70`):
```typescript
// BEFORE (insecure - token in URL can be logged)
if (token) {
  url += `&ptp_token=${encodeURIComponent(token)}`;
}

// AFTER (secure - use session cookies or POST body)
// Remove token from URL; implement session-based auth for WebView
```

2. **Add Stripe Webhook Handler** (new file needed):
```php
// wordpress-plugin/ptp-mobile-api/includes/class-ptp-webhook-controller.php
// Verify Stripe signatures, handle payment confirmation server-side
```

---

### 6) Core App UX Flows

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| ZIP search | ⚠️ PARTIAL | Not found - uses market/city filters | Add ZIP search |
| Location-based markets | ✅ PASS | `src/api/programs.ts:131-138` - `getMarkets()` | - |
| Filters (program, age, date) | ✅ PASS | `src/api/programs.ts:94-104` - Filter params | - |
| Radius filter | ❌ FAIL | Not implemented | Add geolocation radius |
| Product detail | ✅ PASS | `ProgramDetailScreen.tsx:1-434` - Full detail view | - |
| Date/time display | ✅ PASS | `ProgramDetailScreen.tsx:150-166` - Info cards | - |
| Venue info | ✅ PASS | `ProgramDetailScreen.tsx:169-188` - Location card | - |
| What to bring | ✅ PASS | `ProgramDetailScreen.tsx:232-246` - Bring list | - |
| Register CTA | ✅ PASS | `ProgramDetailScreen.tsx:280-286` - Bottom bar button | - |
| My Camps/Clinics | ✅ PASS | `ScheduleScreen.tsx` exists | - |
| Add to Calendar | ❌ FAIL | Not implemented | Add expo-calendar |
| Directions deep link | ✅ PASS | `ProgramDetailScreen.tsx:68-76` - Opens Maps | - |

---

### 7) Push Notifications & Reminders

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| APNs setup | ✅ PASS | `app.config.js:57,59-61` - Background modes, entitlements | - |
| Provider configured | ✅ PASS | `class-ptp-push-controller.php:29` - Expo Push API | - |
| Permission timing | ✅ PASS | `NotificationProvider.tsx:48-62` - After login, 1s delay | - |
| Purchase confirm | ❓ UNKNOWN | Need to verify WC integration | Add order webhook |
| 24h reminder | ❓ UNKNOWN | Backend scheduling not visible | Implement in WP |
| 2h reminder | ❓ UNKNOWN | Backend scheduling not visible | Implement in WP |
| Venue update | ❓ UNKNOWN | Need admin trigger | Implement in WP |
| Deep links | ✅ PASS | `src/services/navigation.ts:144-176` - `handleNotificationNavigation` | - |
| No PII in payload | ✅ PASS | `class-ptp-push-controller.php:456-465` - Only title/body/data | - |
| Preference controls | ✅ PASS | `src/api/push.ts:49-79` - Preferences API | - |
| Unread count/badge | ✅ PASS | `NotificationProvider.tsx:44,83-87` - Badge tracking | - |

---

### 8) Analytics & Attribution

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Analytics SDK | ❌ FAIL (P1) | No analytics package in `package.json` | Add expo-analytics or Amplitude |
| zip_search event | ❌ FAIL | No analytics | - |
| view_product event | ❌ FAIL | No analytics | - |
| add_to_cart event | ❌ FAIL | No analytics | - |
| begin_checkout event | ❌ FAIL | No analytics | - |
| purchase event | ❌ FAIL | No analytics | - |
| Crash reporting | ❌ FAIL (P1) | No Sentry/Bugsnag in deps | Add Sentry |
| No PII in logs | ✅ PASS | No sensitive data logging found | - |

**Add Analytics** (`package.json`):
```json
"dependencies": {
  "@sentry/react-native": "^5.x",
  "expo-analytics": "^1.x"  // or Amplitude/Mixpanel
}
```

---

### 9) Performance & Reliability

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| API timeouts | ✅ PASS | `src/api/config.ts:31` - 30s timeout | - |
| Retry config | ✅ PASS | `src/api/config.ts:34-35` - 3 retries, 1s delay | - |
| Exponential backoff | ✅ PASS | `src/lib/queryClient.ts:13` - React Query backoff | - |
| Error mapping | ✅ PASS | `src/api/client.ts:135-162` - User-friendly messages | - |
| Image caching | ✅ PASS | Uses `expo-image` (built-in caching) | - |
| List caching | ✅ PASS | `src/lib/queryClient.ts:6-9` - 5min stale, 30min gc | - |
| Offline state | ⚠️ PARTIAL | `ErrorBoundary` exists, no offline indicator | Add offline banner |
| Empty states | ✅ PASS | `CampsClinicsScreen.tsx:177-185` - `NoProgramsEmptyState` | - |
| Main thread blocking | ✅ PASS | Async API calls, no blocking found | - |
| Cold start | ✅ PASS | `App.tsx:40-46` - Splash screen management | - |

---

### 10) Security (App + Server)

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| No embedded secrets | ✅ PASS | `.env.example` exists, no secrets in code | - |
| Keychain for tokens | ✅ PASS | `src/api/client.ts:12,35` - expo-secure-store | - |
| Certificate pinning | ❌ FAIL | Not implemented | Optional but recommended |
| Input validation (WP) | ✅ PASS | `class-ptp-auth-controller.php:150,177-182` - `sanitize_*` | - |
| Capability checks | ✅ PASS | `class-ptp-auth-controller.php:141-143` - `check_auth` | - |
| Prepared statements | ✅ PASS | `class-ptp-auth-controller.php:449-454` - `$wpdb->prepare` | - |
| Nonces | ❓ UNKNOWN | REST API uses JWT, nonces for forms | Verify forms |
| Expo token validation | ✅ PASS | `class-ptp-push-controller.php:401-403` - Regex validation | - |

---

### 11) App Store Compliance

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Privacy Policy URL | ❌ FAIL | Not in `app.config.js` or `app.json` | Add to extra config |
| Terms URL | ❌ FAIL | Not in config | Add to extra config |
| ATT disclosure | ⚠️ PARTIAL | No tracking SDKs, but must declare in App Store Connect | Verify ASC |
| Data collection labels | ⚠️ PARTIAL | Need to match SDK usage | Review before submit |
| Sign in with Apple | ⚠️ N/A | No 3rd-party social login found | - |
| Location permission string | ✅ PASS | `app.config.js:51-52` - Clear description | - |
| Camera permission string | ✅ PASS | `app.config.js:53-54` - Clear description | - |
| Notification permission | ✅ PASS | Plugin config in `app.config.js:86-94` | - |
| Physical goods = no IAP | ✅ PASS | Camps are physical services, Stripe OK | - |

**Add Privacy URLs** (`app.config.js`):
```javascript
extra: {
  // ... existing
  PRIVACY_POLICY_URL: 'https://ptpsummercamps.com/privacy-policy',
  TERMS_URL: 'https://ptpsummercamps.com/terms-of-service',
}
```

---

### 12) Build, Release, CI/CD

| Item | Status | Evidence | Fix |
|------|--------|----------|-----|
| Separate env configs | ✅ PASS | `eas.json:10-12,24-26,38-40` - Per-profile env | - |
| Signing documented | ⚠️ PARTIAL | `eas.json:63-72` - Placeholder values | Update with real values |
| CI pipeline | ❌ FAIL (P1) | No `.github/workflows` or Fastfile | Add GitHub Actions |
| Tests exist | ❌ FAIL (P1) | No `*.test.ts` or `*.spec.ts` files | Add Jest tests |
| Tests run on PR | ❌ FAIL | No CI | Add CI workflow |
| Versioning strategy | ✅ PASS | `eas.json:49` - `autoIncrement: true` | - |
| Lockfile present | ✅ PASS | `package-lock.json` exists (530KB) | - |
| Node version compatible | ❌ FAIL (P0) | metro-cache needs Node >=20.19.4 | Update to Node 22 LTS |

---

### 13) QA Test Plan

| Test Case | Status | Notes |
|-----------|--------|-------|
| Happy path (install → ZIP → select → pay → confirm → push) | ⚠️ | ZIP search missing |
| Sold out during checkout | ❓ | WebView handles |
| Payment fail then succeed | ❓ | WebView handles |
| Double-tap pay (idempotency) | ⚠️ | Client-side only |
| Network drop mid-checkout | ❓ | WebView handles |
| Timezone change | ⚠️ | Dates are ISO, should work |

---

## 3. Critical Risks Summary

### P0 - Critical (Must Fix Before Launch)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **CORS wildcard in production** | `ptp-mobile-api.php:136` | Anyone can call API from any origin |
| 2 | **JWT token in checkout URL** | `src/api/config.ts:67-70` | Token can be logged in server/proxy logs |
| 3 | **No Stripe webhook verification** | Missing | Payments not verified server-side |
| 4 | **EAS build fails - Node version** | `package.json` | Cannot build for App Store |
| 5 | **Missing yarn.lock for EAS** | Root | EAS prefers yarn.lock over package-lock.json |

### P1 - High (Fix Before Stable)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **No analytics SDK** | `package.json` | No visibility into user behavior |
| 2 | **No crash reporting** | `package.json` | No visibility into production errors |
| 3 | **No CI/CD pipeline** | Missing `.github/workflows` | Manual testing only |
| 4 | **No automated tests** | Missing `__tests__` | Quality risk |

### P2 - Medium (Fix Post-Launch)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | **Privacy/Terms URLs missing** | `app.config.js` | App Store metadata incomplete |
| 2 | **No token refresh strategy** | `src/api/client.ts` | Users logged out unexpectedly |
| 3 | **No ZIP code search** | Missing | Primary UX flow incomplete |
| 4 | **No Add to Calendar** | Missing | Feature gap |

---

## 4. Ordered Fix Plan

### Phase 1: Build Fixes (Immediate)

1. **Create yarn.lock for EAS compatibility**
   ```bash
   rm -rf node_modules
   yarn install  # Creates yarn.lock
   git add yarn.lock
   ```

2. **Update Node version requirement**
   Add to `package.json`:
   ```json
   "engines": {
     "node": ">=20.19.4"
   }
   ```

   Update EAS build to use Node 22:
   ```json
   // eas.json - add to each profile
   "node": "22.11.0"
   ```

### Phase 2: Security Fixes (P0)

3. **Fix CORS wildcard** - `ptp-mobile-api.php:134-141`

4. **Remove token from checkout URL** - `src/api/config.ts:67-70`
   - Implement server-side session creation for checkout

5. **Add Stripe webhook handler** - New controller class

### Phase 3: Observability (P1)

6. **Add Sentry for crash reporting**
   ```bash
   npm install @sentry/react-native
   ```

7. **Add analytics (Amplitude/Mixpanel)**

8. **Add CI pipeline** - `.github/workflows/ci.yml`

### Phase 4: Polish (P2)

9. Add privacy policy URLs
10. Implement token refresh
11. Add ZIP code search
12. Add calendar integration

---

## 5. Build Error Resolution

The EAS build errors reported are:

### Error 1: Missing lockfile
```
warning expo > ... info No lockfile found.
```

**Root Cause**: EAS Build is using yarn but finding no `yarn.lock`. The project has `package-lock.json` (npm).

**Fix**: Generate `yarn.lock` or configure EAS to use npm.

### Error 2: Node version incompatibility
```
error metro-cache@0.83.2: The engine "node" is incompatible with this module.
Expected version ">=20.19.4". Got "20.18.3"
```

**Root Cause**: Expo SDK 54 dependencies require Node 20.19.4+.

**Fix**: Update EAS build to use Node 22 LTS.

---

## 6. Files Modified in This Audit

None - this is a read-only audit. See fix plan for required changes.

---

## Appendix: Key File References

| File | Purpose |
|------|---------|
| `App.tsx` | Root component, provider stack |
| `src/api/client.ts` | Axios instance, JWT interceptor |
| `src/api/config.ts` | API configuration, checkout URL builder |
| `src/hooks/useAuth.tsx` | Authentication context |
| `src/hooks/useNotifications.tsx` | Push notification hook |
| `src/screens/parent/CheckoutScreen.tsx` | WebView checkout |
| `wordpress-plugin/ptp-mobile-api/ptp-mobile-api.php` | Main plugin file |
| `wordpress-plugin/.../class-ptp-auth-controller.php` | Auth endpoints |
| `wordpress-plugin/.../class-ptp-push-controller.php` | Push notification handling |

---

*Report generated by Claude Code*
