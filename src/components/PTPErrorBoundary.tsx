import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { PTPText } from './PTPText';
import { PTPButton } from './PTPButton';
import { colors } from '@theme/colors';
import { spacing } from '@theme/spacing';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class PTPErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to reporting service
    console.error('Error caught by boundary:', error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <PTPText variant="h2" style={styles.title}>
              Oops! Something went wrong
            </PTPText>
            <PTPText variant="body" color="secondary" style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </PTPText>
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <PTPText variant="caption" color="error">
                  {this.state.error.message}
                </PTPText>
              </View>
            )}
            <PTPButton
              title="Try Again"
              onPress={this.handleRetry}
              style={styles.button}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for use with hooks
interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
}) => (
  <View style={styles.container}>
    <View style={styles.content}>
      <PTPText variant="h2" style={styles.title}>
        Oops! Something went wrong
      </PTPText>
      <PTPText variant="body" color="secondary" style={styles.message}>
        We're sorry, but something unexpected happened. Please try again.
      </PTPText>
      {__DEV__ && (
        <View style={styles.errorDetails}>
          <PTPText variant="caption" color="error">
            {error.message}
          </PTPText>
        </View>
      )}
      <PTPButton title="Try Again" onPress={resetError} style={styles.button} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  message: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  errorDetails: {
    backgroundColor: colors.status.error + '10',
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.lg,
    width: '100%',
  },
  button: {
    minWidth: 160,
  },
});

export default PTPErrorBoundary;
