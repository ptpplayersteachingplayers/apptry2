/**
 * PTP Soccer Components
 *
 * Central export for all reusable UI components.
 * Dark theme with sharp edges and gold accents.
 */

// Text
export {
  PTPText,
  PTPTitle,
  PTPHeading,
  PTPSubheading,
  PTPBody,
  PTPCaption,
  PTPLabel,
  PTPPrice,
} from './PTPText';

// Buttons
export { PTPButton } from './PTPButton';

// Cards
export {
  PTPCard,
  PTPSimpleCard,
  PTPProgramCard,
  PTPTrainerCard,
} from './PTPCard';

// Tags and Badges
export {
  PTPTag,
  PTPBadge,
  PTPStatusIndicator,
} from './PTPTag';

// Inputs
export {
  PTPInput,
  PTPPasswordInput,
  PTPSearchInput,
  PTPTextArea,
} from './PTPInput';

// Search Bar
export { PTPSearchBar } from './PTPSearchBar';

// Section Headers
export { PTPSectionHeader } from './PTPSectionHeader';

// Loading States
export {
  PTPLoading,
  PTPLoadingOverlay,
  PTPLoadingInline,
  PTPSkeleton,
  PTPCardSkeleton,
  PTPTrainerCardSkeleton,
  PTPListSkeleton,
} from './PTPLoading';

// Skeleton Loaders (legacy compatibility)
export {
  Skeleton,
  ProgramCardSkeleton,
  TrainerCardSkeleton,
  SessionCardSkeleton,
  MessageItemSkeleton,
  ListSkeleton,
  HomeScreenSkeleton,
  DetailScreenSkeleton,
} from './PTPSkeleton';

// Empty States
export {
  PTPEmptyState,
  NoTrainersEmptyState,
  NoProgramsEmptyState,
  NoBookingsEmptyState,
  NoSessionsEmptyState,
  NoMessagesEmptyState,
  NoChildrenEmptyState,
  NoEarningsEmptyState,
  NoReviewsEmptyState,
  ErrorEmptyState,
  OfflineEmptyState,
} from './PTPEmptyState';

// Hero Sections
export {
  PTPHero,
  PTPHeroCard,
  PTPScreenHero,
  PTPStatHero,
} from './PTPHero';

// Images
export { PTPImage, PTPAvatar, PTPHeroImage, PTPGallery } from './PTPImage';

// Animated Components
export {
  AnimatedPressable,
  FadeInView,
  StaggeredItem,
  ShakeView,
  PulseView,
  SlideUpView,
  AnimatedCounter,
  AnimatedProgress,
  animations,
} from './PTPAnimated';

// Error Boundary
export {
  PTPErrorBoundary,
  ErrorFallback,
  InlineErrorFallback,
  NetworkErrorFallback,
} from './PTPErrorBoundary';

// Payment Components
export { NativeCheckout } from './payment';
