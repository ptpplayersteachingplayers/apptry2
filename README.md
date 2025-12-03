# PTP Soccer Mobile App

A production-ready mobile application for PTP Soccer built with Expo, TypeScript, and React Navigation. The app serves two user roles: Parents/Families and Trainers/Mentors.

## Features

### Parent/Family App
- Browse and register for camps and clinics
- Discover private training mentors
- Book private training sessions
- View upcoming schedule and events
- Message trainers directly
- Manage child profiles
- Account management

### Trainer/Mentor App
- Dashboard with daily overview and stats
- Accept/decline session requests
- View and manage schedule
- Track students and their progress
- Earnings overview
- Direct messaging with parents

## Tech Stack

- **Framework**: Expo SDK 52
- **Language**: TypeScript
- **Navigation**: React Navigation 6 (native-stack + bottom-tabs)
- **HTTP Client**: Axios with JWT interceptors
- **Secure Storage**: expo-secure-store
- **Push Notifications**: expo-notifications
- **Backend**: WordPress + WooCommerce with custom REST API plugin

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your device (for development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd apptry2

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your API URL
# API_URL=https://your-wordpress-site.com/wp-json/ptp/v1
```

### Running the App

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

## Project Structure

```
├── App.tsx                 # Root component
├── src/
│   ├── api/                # API layer
│   │   ├── client.ts       # Axios instance with interceptors
│   │   ├── config.ts       # API configuration
│   │   ├── auth.ts         # Auth endpoints
│   │   ├── programs.ts     # Camps/clinics endpoints
│   │   ├── training.ts     # Private training endpoints
│   │   ├── messages.ts     # Messaging endpoints
│   │   ├── events.ts       # Schedule endpoints
│   │   └── orders.ts       # WooCommerce orders
│   ├── components/         # Reusable UI components
│   │   ├── PTPButton.tsx
│   │   ├── PTPCard.tsx
│   │   ├── PTPText.tsx
│   │   ├── PTPInput.tsx
│   │   └── ...
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.tsx     # Authentication context
│   │   └── useNotifications.tsx
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── ParentTabNavigator.tsx
│   │   └── TrainerTabNavigator.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/           # Auth flow screens
│   │   ├── parent/         # Parent app screens
│   │   └── trainer/        # Trainer app screens
│   ├── theme/              # Theming
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── PTPThemeProvider.tsx
│   └── types/              # TypeScript types
│       ├── user.ts
│       ├── program.ts
│       ├── training.ts
│       └── ...
└── wordpress-plugin/       # WordPress REST API plugin
    └── ptp-mobile-api/
```

## Environment Variables

Create a `.env` file in the root directory:

```env
API_URL=https://your-site.com/wp-json/ptp/v1
WC_CONSUMER_KEY=your_woocommerce_key
WC_CONSUMER_SECRET=your_woocommerce_secret
```

## Demo Mode

The app includes a demo mode with mock data for development and testing. Enable it by setting:

```typescript
// src/api/config.ts
export const USE_MOCK_DATA = true;
```

Demo credentials:
- **Parent**: demo@parent.com / password
- **Trainer**: demo@trainer.com / password

## WordPress Plugin

The `wordpress-plugin/ptp-mobile-api` directory contains a WordPress plugin that provides REST API endpoints for the mobile app.

### Installation

1. Upload the `ptp-mobile-api` folder to `/wp-content/plugins/`
2. Activate the plugin in WordPress admin
3. Configure JWT authentication (requires [JWT Authentication for WP-API](https://wordpress.org/plugins/jwt-authentication-for-wp-rest-api/) or similar)

### API Endpoints

**Authentication**
- `POST /ptp/v1/auth/login` - User login
- `POST /ptp/v1/auth/register` - User registration
- `GET /ptp/v1/auth/me` - Get current user
- `PUT /ptp/v1/auth/profile` - Update profile
- `POST /ptp/v1/auth/forgot-password` - Password reset

**Programs (Camps & Clinics)**
- `GET /ptp/v1/programs` - List programs
- `GET /ptp/v1/programs/:id` - Get program details
- `GET /ptp/v1/programs/featured` - Featured programs
- `GET /ptp/v1/programs/locations` - Available locations

**Training**
- `GET /ptp/v1/trainers` - List trainers
- `GET /ptp/v1/trainers/:id` - Trainer profile
- `GET /ptp/v1/trainers/:id/availability` - Trainer availability
- `POST /ptp/v1/training/request` - Request session
- `GET /ptp/v1/training/my-sessions` - User's sessions

**Messages**
- `GET /ptp/v1/messages/conversations` - List conversations
- `GET /ptp/v1/messages/conversations/:id/messages` - Get messages
- `POST /ptp/v1/messages/send` - Send message

**Events (Schedule)**
- `GET /ptp/v1/events` - User's events
- `GET /ptp/v1/events/upcoming` - Upcoming events
- `GET /ptp/v1/events/calendar` - Calendar data

**Trainer Endpoints**
- `GET /ptp/v1/trainer/dashboard` - Dashboard stats
- `GET /ptp/v1/trainer/sessions` - Trainer's sessions
- `POST /ptp/v1/trainer/sessions/:id/respond` - Accept/decline
- `GET /ptp/v1/trainer/students` - Student list
- `GET /ptp/v1/trainer/earnings` - Earnings data

## Branding

### Colors
- **Primary (PTP Yellow)**: `#FCB900`
- **Dark (Ink Black)**: `#0E0F11`
- **Light (Off-white)**: `#F4F3F0`

### Typography
- Font Family: Inter (loaded via @expo-google-fonts/inter)

## Building for Production

```bash
# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Run linting: `npm run lint`
4. Submit a pull request

## License

GPL v2 or later
