# PTP Soccer App - Deployment Guide

## Quick Start

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your production values

# 2. Build for preview testing
eas build --platform all --profile preview

# 3. Build for production
eas build --platform all --profile production

# 4. Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Build Profiles

| Profile | Demo Mode | Use Case |
|---------|-----------|----------|
| `development` | ✅ On | Local dev with Expo Go |
| `development:device` | ✅ On | Physical device testing |
| `preview` | ❌ Off | Internal testing with real API |
| `production` | ❌ Off | App Store / Play Store release |

## Environment Setup

### Required for Production

1. **WordPress Backend**
   - Ensure WordPress is running at your `API_BASE_URL`
   - Install PTP Mobile API plugin
   - Enable JWT Authentication plugin
   - Configure WooCommerce for payments

2. **Stripe Account**
   - Get production keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Set `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` in `.env`
   - Configure webhooks for order completion

3. **Apple Developer Account** (iOS)
   - Update `eas.json` with your Apple credentials:
     ```json
     "submit": {
       "production": {
         "ios": {
           "appleId": "your-apple-id@example.com",
           "ascAppId": "YOUR_APP_STORE_CONNECT_APP_ID",
           "appleTeamId": "YOUR_APPLE_TEAM_ID"
         }
       }
     }
     ```

4. **Google Play Console** (Android)
   - Download service account JSON from Google Cloud Console
   - Save as `play-store-service-account.json` in project root
   - Grant "Release Manager" permissions

## Configuration Files

### `.env` (Production)

```bash
API_BASE_URL=https://ptpsummercamps.com
MOBILE_API_NAMESPACE=/wp-json/ptp/v2
DEMO_MODE=false
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

### `eas.json`

Build configuration is already set up with:
- Node 22.12.0
- Auto-incrementing versions for production
- Separate channels for each environment

## WordPress Backend Requirements

### Required Plugins
- **PTP Mobile API** - Custom REST API endpoints
- **JWT Authentication** - Secure token-based auth
- **WooCommerce** - Product/order management

### Required Endpoints

The app expects these REST API endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/wp-json/jwt-auth/v1/token` | POST | Authentication |
| `/wp-json/ptp/v2/programs` | GET | List camps/clinics |
| `/wp-json/ptp/v2/trainers` | GET | List trainers |
| `/wp-json/ptp/v2/events` | GET | Calendar events |
| `/wp-json/ptp/v2/payments/*` | POST | Stripe integration |

## Push Notifications

### iOS (APNs)
- Automatically configured via EAS
- Certificates managed by Expo

### Android (FCM)
1. Create Firebase project
2. Download `google-services.json`
3. Place in project root
4. Build will automatically include it

## Deployment Checklist

### Pre-Build
- [ ] Updated `.env` with production values
- [ ] Set `DEMO_MODE=false`
- [ ] Configured Stripe live keys
- [ ] WordPress backend is running
- [ ] All API endpoints tested

### iOS
- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Provisioning profiles configured
- [ ] App privacy details filled out

### Android
- [ ] Google Play Console app created
- [ ] Service account JSON in place
- [ ] Signing keystore configured
- [ ] Privacy policy URL set

### Post-Build
- [ ] Test on physical devices
- [ ] Verify payments work
- [ ] Check push notifications
- [ ] Review analytics/crash reporting

## Commands Reference

```bash
# Development
npm start                    # Start Expo dev server
npm run ios                  # Run iOS simulator
npm run android              # Run Android emulator

# Building
eas build --platform ios --profile production
eas build --platform android --profile production
eas build --platform all --profile production

# Submitting
eas submit --platform ios --latest
eas submit --platform android --latest

# OTA Updates
eas update --branch production --message "Bug fix"

# Check build status
eas build:list
```

## Troubleshooting

### Build Failures
- Run `npm run typecheck` before building
- Clear cache: `npx expo start --clear`
- Check EAS build logs online

### API Connection Issues
- Verify `API_BASE_URL` is accessible
- Check CORS settings on WordPress
- Ensure JWT plugin is activated

### Payment Failures
- Verify Stripe keys are correct
- Check Stripe webhooks configuration
- Review Stripe Dashboard for errors

## Support

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Guide](https://docs.expo.dev/build/introduction/)
- [Stripe React Native](https://stripe.com/docs/payments/accept-a-payment?platform=react-native)
