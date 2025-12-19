/**
 * PTPErrorBoundary Component
 *
 * Professional error boundary for catching and handling React errors gracefully.
 * Provides user-friendly error messages and recovery options.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PTPText } from './PTPText';
import { PTPButton } from './PTPButton';
import { colors } from '@theme/colors';
import { spacing, borderRadius } from '@theme/spacing';
import { LOGO_URL } from '../assets/logo';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onRetry?: () => void;
  showLogo?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * PTPErrorBoundary - Class component error boundary
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class PTPErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('PTPErrorBoundary caught an error:', error);
    console.error('Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // Call optional error handler (could send to error reporting service)
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    // Reset the error state
    this.setState({ hasError: false, error: null, errorInfo: null });

    // Call optional retry handler
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Render default error UI
      return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* Logo */}
              {this.props.showLogo !== false && (
                <Image
                  source={{ uri: LOGO_URL }}
                  style={styles.logo}
                  resizeMode="contain"
                />
              )}

              {/* Error Icon */}
              <View style={styles.iconContainer}>
                <PTPText style={styles.icon}>⚠️</PTPText>
              </View>

              {/* Error Message */}
              <PTPText variant="sectionTitle" style={styles.title}>
                Oops! Something went wrong
              </PTPText>
              <PTPText variant="body" color="gray500" style={styles.message}>
                We're sorry, but something unexpected happened. Please try again
                or contact support if the problem persists.
              </PTPText>

              {/* Error Details (Development Only) */}
              {__DEV__ && this.state.error && (
                <View style={styles.errorDetails}>
                  <PTPText variant="label" style={styles.errorLabel}>
                    Error Details (Dev Only)
                  </PTPText>
                  <PTPText variant="caption" style={styles.errorText}>
                    {this.state.error.name}: {this.state.error.message}
                  </PTPText>
                  {this.state.errorInfo?.componentStack && (
                    <PTPText
                      variant="caption"
                      style={styles.stackTrace}
                      numberOfLines={10}
                    >
                      {this.state.errorInfo.componentStack.trim().slice(0, 500)}
                    </PTPText>
                  )}
                </View>
              )}

              {/* Actions */}
              <View style={styles.actions}>
                <PTPButton
                  title="Try Again"
                  variant="primary"
                  size="large"
                  onPress={this.handleRetry}
                  style={styles.button}
                />
              </View>

              {/* Support Info */}
              <View style={styles.supportInfo}>
                <PTPText variant="caption" color="gray400" center>
                  If this problem continues, please contact us at
                </PTPText>
                <PTPText variant="caption" color="primary" center>
                  support@ptpsoccer.com
                </PTPText>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

/**
 * ErrorFallback - Functional component for use with error boundary hooks
 */
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  showLogo?: boolean;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  showLogo = true,
}) => (
  <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        {/* Logo */}
        {showLogo && (
          <Image
            source={{ uri: LOGO_URL }}
            style={styles.logo}
            resizeMode="contain"
          />
        )}

        {/* Error Icon */}
        <View style={styles.iconContainer}>
          <PTPText style={styles.icon}>⚠️</PTPText>
        </View>

        {/* Error Message */}
        <PTPText variant="sectionTitle" style={styles.title}>
          Oops! Something went wrong
        </PTPText>
        <PTPText variant="body" color="gray500" style={styles.message}>
          We're sorry, but something unexpected happened. Please try again or
          contact support if the problem persists.
        </PTPText>

        {/* Error Details (Development Only) */}
        {__DEV__ && (
          <View style={styles.errorDetails}>
            <PTPText variant="label" style={styles.errorLabel}>
              Error Details (Dev Only)
            </PTPText>
            <PTPText variant="caption" style={styles.errorText}>
              {error.name}: {error.message}
            </PTPText>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <PTPButton
            title="Try Again"
            variant="primary"
            size="large"
            onPress={resetError}
            style={styles.button}
          />
        </View>

        {/* Support Info */}
        <View style={styles.supportInfo}>
          <PTPText variant="caption" color="gray400" center>
            If this problem continues, please contact us at
          </PTPText>
          <PTPText variant="caption" color="primary" center>
            support@ptpsoccer.com
          </PTPText>
        </View>
      </View>
    </ScrollView>
  </SafeAreaView>
);

/**
 * InlineErrorFallback - Compact error display for inline use
 */
interface InlineErrorFallbackProps {
  message?: string;
  onRetry?: () => void;
}

export const InlineErrorFallback: React.FC<InlineErrorFallbackProps> = ({
  message = 'Unable to load content',
  onRetry,
}) => (
  <View style={styles.inlineContainer}>
    <PTPText variant="body" color="gray500" center>
      {message}
    </PTPText>
    {onRetry && (
      <PTPButton
        title="Retry"
        variant="outline"
        size="small"
        onPress={onRetry}
        style={styles.inlineButton}
      />
    )}
  </View>
);

/**
 * NetworkErrorFallback - Error display for network issues
 */
interface NetworkErrorFallbackProps {
  onRetry?: () => void;
}

export const NetworkErrorFallback: React.FC<NetworkErrorFallbackProps> = ({
  onRetry,
}) => (
  <View style={styles.networkContainer}>
    <View style={styles.iconContainer}>
      <PTPText style={styles.networkIcon}>📶</PTPText>
    </View>
    <PTPText variant="sectionTitle" style={styles.networkTitle}>
      No Internet Connection
    </PTPText>
    <PTPText variant="body" color="gray500" style={styles.networkMessage}>
      Please check your internet connection and try again.
    </PTPText>
    {onRetry && (
      <PTPButton
        title="Retry"
        variant="primary"
        size="medium"
        onPress={onRetry}
        style={styles.networkButton}
      />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 48,
    marginBottom: spacing[6],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  icon: {
    fontSize: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: colors.gray50,
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[6],
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  errorLabel: {
    color: colors.warning,
    marginBottom: spacing[2],
  },
  errorText: {
    color: colors.gray600,
    fontFamily: 'monospace',
  },
  stackTrace: {
    color: colors.gray500,
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: spacing[2],
  },
  actions: {
    width: '100%',
    gap: spacing[3],
  },
  button: {
    width: '100%',
  },
  supportInfo: {
    marginTop: spacing[8],
    gap: spacing[1],
  },
  // Inline error styles
  inlineContainer: {
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  inlineButton: {
    marginTop: spacing[4],
  },
  // Network error styles
  networkContainer: {
    flex: 1,
    padding: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  networkIcon: {
    fontSize: 48,
  },
  networkTitle: {
    textAlign: 'center',
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  networkMessage: {
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  networkButton: {
    minWidth: 160,
  },
});

export default PTPErrorBoundary;
