/**
 * Checkout Screen (Parent)
 *
 * WebView-based WooCommerce checkout.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList } from '../../types/navigation';
import { getCheckoutUrl } from '../../api/orders';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type CheckoutRouteProp = RouteProp<ParentStackParamList, 'Checkout'>;
type CheckoutNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * CheckoutScreen - WooCommerce checkout in WebView
 *
 * Handles:
 * - WooCommerce checkout flow in WebView
 * - Detection of successful order completion
 * - Navigation to Schedule after success
 */
const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<CheckoutNavigationProp>();
  const route = useRoute<CheckoutRouteProp>();
  const { productId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const webViewRef = useRef<WebView>(null);
  const hasHandledSuccess = useRef(false);

  React.useEffect(() => {
    loadCheckoutUrl();
  }, [productId]);

  const loadCheckoutUrl = async () => {
    try {
      const url = await getCheckoutUrl(productId);
      setCheckoutUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load checkout');
    }
  };

  const handleCheckoutSuccess = () => {
    // Prevent handling success multiple times
    if (hasHandledSuccess.current) return;
    hasHandledSuccess.current = true;

    setIsSuccess(true);
  };

  const handleGoToSchedule = () => {
    // Navigate to Schedule tab to see the new booking
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          {
            name: 'ParentTabs',
            state: {
              index: 3, // Schedule tab
              routes: [
                { name: 'Home' },
                { name: 'CampsClinics' },
                { name: 'PrivateTraining' },
                { name: 'Schedule' },
                { name: 'Account' },
              ],
            },
          },
        ],
      })
    );
  };

  const handleContinueBrowsing = () => {
    navigation.goBack();
  };

  const handleNavigationChange = (navState: { url: string }) => {
    // Check for checkout success - WooCommerce redirects to order-received page
    if (
      navState.url.includes('order-received') ||
      navState.url.includes('checkout/order-received') ||
      navState.url.includes('ptp://checkout/success')
    ) {
      handleCheckoutSuccess();
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <PTPText variant="sectionTitle">Checkout Error</PTPText>
        <PTPText variant="body" color="gray500" style={styles.errorText}>{error}</PTPText>
        <PTPButton title="Try Again" onPress={loadCheckoutUrl} />
      </View>
    );
  }

  // Success screen
  if (isSuccess) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <PTPText style={styles.successEmoji}>✓</PTPText>
        </View>
        <PTPText variant="sectionTitle" style={styles.successTitle}>
          Booking Confirmed!
        </PTPText>
        <PTPText variant="body" color="gray500" center style={styles.successText}>
          Your registration is complete. You&apos;ll receive a confirmation email shortly.
        </PTPText>
        <View style={styles.successButtons}>
          <PTPButton
            title="View My Schedule"
            onPress={handleGoToSchedule}
            fullWidth
          />
          <PTPButton
            title="Continue Browsing"
            variant="outline"
            onPress={handleContinueBrowsing}
            fullWidth
            style={styles.secondaryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <PTPText variant="body" color="gray500" style={styles.loadingText}>
            Loading checkout...
          </PTPText>
        </View>
      )}
      {checkoutUrl && (
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webview}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          scalesPageToFit
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  errorText: {
    marginVertical: spacing[4],
    textAlign: 'center',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  successEmoji: {
    fontSize: 40,
    color: colors.white,
    fontWeight: '700',
  },
  successTitle: {
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  successText: {
    marginBottom: spacing[8],
  },
  successButtons: {
    width: '100%',
  },
  secondaryButton: {
    marginTop: spacing[3],
  },
});

export default CheckoutScreen;
