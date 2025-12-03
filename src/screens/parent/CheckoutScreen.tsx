/**
 * Checkout Screen (Parent)
 *
 * WebView-based WooCommerce checkout.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ParentStackParamList } from '../../types/navigation';
import { getCheckoutUrl } from '../../api/orders';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type CheckoutRouteProp = RouteProp<ParentStackParamList, 'Checkout'>;

/**
 * CheckoutScreen - WooCommerce checkout in WebView
 *
 * TODO: Wire in real WooCommerce checkout
 * - Handle checkout success via deep link (ptp://checkout/success)
 * - Pass user token for auto-login
 * - Sync order back to app after completion
 */
const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<CheckoutRouteProp>();
  const { productId } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webViewRef = useRef<WebView>(null);

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

  const handleNavigationChange = (navState: { url: string }) => {
    // Check for checkout success
    if (navState.url.includes('order-received') || navState.url.includes('ptp://checkout/success')) {
      navigation.goBack();
      // TODO: Show success message and refresh events
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
  container: { flex: 1, backgroundColor: colors.white },
  webview: { flex: 1 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.white, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  loadingText: { marginTop: spacing[4] },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] },
  errorText: { marginVertical: spacing[4], textAlign: 'center' },
});

export default CheckoutScreen;
