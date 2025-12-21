/**
 * Checkout Screen (Parent)
 *
 * WebView-based WooCommerce checkout.
 */

import React, { useState, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { getCheckoutUrl, getOrder, mockOrders } from '../../api/orders';
import { Order, PaymentResult } from '../../types';
import { PTPText, PTPButton, NativeCheckout } from '../../components';
import { useAuth } from '../../hooks/useAuth';
import { apiConfig } from '../../api/config';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { formatDateLong } from '../../lib/formatting';

type CheckoutMode = 'native' | 'webview';

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
// Demo price for native checkout (in production, fetch from API)
const DEMO_PRICE = 175;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<CheckoutNavigationProp>();
  const route = useRoute<CheckoutRouteProp>();
  const { productId, programName, programDate, programLocation } = route.params as {
    productId: number;
    programName?: string;
    programDate?: string;
    programLocation?: string;
  };
  const { isGuest, logout, user } = useAuth();

  // Checkout mode: native (Stripe) or webview (WooCommerce)
  const [checkoutMode, setCheckoutMode] = useState<CheckoutMode>(
    apiConfig.demoMode ? 'native' : 'webview'
  );
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderDetails, setOrderDetails] = useState<Order | null>(null);
  const webViewRef = useRef<WebView>(null);
  const hasHandledSuccess = useRef(false);

  React.useEffect(() => {
    if (!isGuest && checkoutMode === 'webview') {
      loadCheckoutUrl();
    } else {
      setIsLoading(false);
    }
  }, [productId, isGuest, checkoutMode]);

  // Handle native checkout success
  const handleNativePaymentSuccess = (result: PaymentResult) => {
    handleCheckoutSuccess(result.orderId);
  };

  // Handle native checkout cancel
  const handleNativePaymentCancel = () => {
    navigation.goBack();
  };

  // Guest users need to create an account to checkout
  const handleGuestSignUp = async () => {
    // Exit guest mode and go to sign up
    await logout();
  };

  const loadCheckoutUrl = async () => {
    try {
      const url = await getCheckoutUrl(productId);
      setCheckoutUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load checkout');
    }
  };

  const handleCheckoutSuccess = async (orderId?: number) => {
    // Prevent handling success multiple times
    if (hasHandledSuccess.current) return;
    hasHandledSuccess.current = true;

    setIsSuccess(true);

    // Try to fetch order details for confirmation
    try {
      if (orderId) {
        const order = await getOrder(orderId);
        setOrderDetails(order);
      } else {
        // In demo mode, use the first mock order as template
        const mockOrder: Order = {
          ...mockOrders[0],
          id: Date.now(),
          orderNumber: `PTP-${Date.now().toString().slice(-6)}`,
          items: [{
            ...mockOrders[0].items[0],
            name: programName || 'Program',
            programDate: programDate || new Date().toISOString().split('T')[0],
            programLocation: programLocation || 'TBD',
          }],
          createdAt: new Date().toISOString(),
        };
        setOrderDetails(mockOrder);
      }
    } catch (err) {
      // Still show success even if order details fail
      console.error('Error fetching order details:', err);
    }
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
      // Try to extract order ID from URL
      const orderIdMatch = navState.url.match(/order-received\/(\d+)/);
      const orderId = orderIdMatch ? parseInt(orderIdMatch[1], 10) : undefined;
      handleCheckoutSuccess(orderId);
    }
  };

  // Guest users need to create an account first
  if (isGuest) {
    return (
      <View style={styles.guestContainer}>
        <View style={styles.guestIcon}>
          <PTPText style={styles.guestEmoji}>👤</PTPText>
        </View>
        <PTPText variant="sectionTitle" style={styles.guestTitle}>
          Create an Account to Register
        </PTPText>
        <PTPText variant="body" color="gray500" center style={styles.guestText}>
          You&apos;ll need an account to complete your registration and receive important updates about your camp or clinic.
        </PTPText>
        <View style={styles.guestButtons}>
          <PTPButton
            title="Create Account"
            onPress={handleGuestSignUp}
            fullWidth
          />
          <PTPButton
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            fullWidth
            style={styles.secondaryButton}
          />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <PTPText variant="sectionTitle">Checkout Error</PTPText>
        <PTPText variant="body" color="gray500" style={styles.errorText}>{error}</PTPText>
        <PTPButton title="Try Again" onPress={loadCheckoutUrl} />
      </View>
    );
  }

  // Success screen with enhanced confirmation details
  if (isSuccess) {
    const orderItem = orderDetails?.items?.[0];
    const confirmationNumber = orderDetails?.orderNumber || `PTP-${Date.now().toString().slice(-6)}`;

    return (
      <SafeAreaView style={styles.successContainer} edges={['top', 'bottom']}>
        <ScrollView
          style={styles.successScroll}
          contentContainerStyle={styles.successScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Success Header */}
          <View style={styles.successHeader}>
            <View style={styles.successIcon}>
              <Ionicons name="checkmark" size={44} color={colors.white} />
            </View>
            <PTPText variant="heroTitle" style={styles.successTitle}>
              You're All Set!
            </PTPText>
            <PTPText variant="body" color="gray500" style={styles.successSubtitle}>
              Your registration is confirmed
            </PTPText>
          </View>

          {/* Confirmation Card */}
          <View style={styles.confirmationCard}>
            <View style={styles.confirmationHeader}>
              <PTPText variant="caption" color="gray500">
                CONFIRMATION NUMBER
              </PTPText>
              <PTPText variant="sectionTitle" color="primary">
                {confirmationNumber}
              </PTPText>
            </View>

            <View style={styles.confirmationDivider} />

            {/* Program Details */}
            <View style={styles.confirmationSection}>
              <View style={styles.confirmationRow}>
                <Ionicons name="football-outline" size={20} color={colors.primary} />
                <View style={styles.confirmationRowContent}>
                  <PTPText variant="caption" color="gray500">Program</PTPText>
                  <PTPText variant="cardTitle">
                    {orderItem?.name || programName || 'Training Program'}
                  </PTPText>
                </View>
              </View>

              <View style={styles.confirmationRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary} />
                <View style={styles.confirmationRowContent}>
                  <PTPText variant="caption" color="gray500">Date & Time</PTPText>
                  <PTPText variant="body">
                    {orderItem?.programDate ? formatDateLong(orderItem.programDate) : (programDate || 'Date TBD')}
                  </PTPText>
                  {orderItem?.programTime && (
                    <PTPText variant="bodySmall" color="gray500">
                      {orderItem.programTime}
                    </PTPText>
                  )}
                </View>
              </View>

              <View style={styles.confirmationRow}>
                <Ionicons name="location-outline" size={20} color={colors.primary} />
                <View style={styles.confirmationRowContent}>
                  <PTPText variant="caption" color="gray500">Location</PTPText>
                  <PTPText variant="body">
                    {orderItem?.programLocation || programLocation || 'Location TBD'}
                  </PTPText>
                </View>
              </View>

              {orderItem?.childName && (
                <View style={styles.confirmationRow}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                  <View style={styles.confirmationRowContent}>
                    <PTPText variant="caption" color="gray500">Participant</PTPText>
                    <PTPText variant="body">{orderItem.childName}</PTPText>
                  </View>
                </View>
              )}
            </View>

            {/* Total */}
            {orderDetails?.total && (
              <>
                <View style={styles.confirmationDivider} />
                <View style={styles.confirmationTotal}>
                  <PTPText variant="body" color="gray500">Total Paid</PTPText>
                  <PTPText variant="sectionTitle" color="success">
                    ${orderDetails.total.toFixed(2)}
                  </PTPText>
                </View>
              </>
            )}
          </View>

          {/* Next Steps */}
          <View style={styles.nextStepsCard}>
            <PTPText variant="label" style={styles.nextStepsTitle}>
              What's Next?
            </PTPText>
            <View style={styles.nextStep}>
              <View style={styles.nextStepNumber}>
                <PTPText variant="caption" color="white">1</PTPText>
              </View>
              <View style={styles.nextStepContent}>
                <PTPText variant="bodySmall" weight="semiBold">Check your email</PTPText>
                <PTPText variant="caption" color="gray500">
                  Confirmation sent to {user?.email || 'your email'}
                </PTPText>
              </View>
            </View>
            <View style={styles.nextStep}>
              <View style={styles.nextStepNumber}>
                <PTPText variant="caption" color="white">2</PTPText>
              </View>
              <View style={styles.nextStepContent}>
                <PTPText variant="bodySmall" weight="semiBold">Mark your calendar</PTPText>
                <PTPText variant="caption" color="gray500">
                  Add the event to your calendar
                </PTPText>
              </View>
            </View>
            <View style={styles.nextStep}>
              <View style={styles.nextStepNumber}>
                <PTPText variant="caption" color="white">3</PTPText>
              </View>
              <View style={styles.nextStepContent}>
                <PTPText variant="bodySmall" weight="semiBold">Come prepared</PTPText>
                <PTPText variant="caption" color="gray500">
                  Bring water, cleats, and shin guards
                </PTPText>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Buttons */}
        <View style={styles.successFooter}>
          <PTPButton
            title="View My Schedule"
            onPress={handleGoToSchedule}
            fullWidth
          />
          <PTPButton
            title="Browse More Programs"
            variant="outline"
            onPress={handleContinueBrowsing}
            fullWidth
            style={styles.secondaryButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Mode Toggle Component - defined outside of conditional branches
  const isNativeMode = checkoutMode === 'native';
  const renderModeToggle = () => (
    <View style={styles.modeToggle}>
      <TouchableOpacity
        style={[styles.modeButton, isNativeMode && styles.modeButtonActive]}
        onPress={() => setCheckoutMode('native')}
      >
        <Ionicons
          name="card"
          size={16}
          color={isNativeMode ? colors.inkBlack : colors.gray500}
        />
        <PTPText
          variant="caption"
          color={isNativeMode ? 'inkBlack' : 'gray500'}
        >
          Card / {Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay'}
        </PTPText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.modeButton, !isNativeMode && styles.modeButtonActive]}
        onPress={() => setCheckoutMode('webview')}
      >
        <Ionicons
          name="globe-outline"
          size={16}
          color={!isNativeMode ? colors.inkBlack : colors.gray500}
        />
        <PTPText
          variant="caption"
          color={!isNativeMode ? 'inkBlack' : 'gray500'}
        >
          Web Checkout
        </PTPText>
      </TouchableOpacity>
    </View>
  );

  // Native checkout mode
  if (isNativeMode) {
    return (
      <View style={styles.container}>
        {renderModeToggle()}

        <NativeCheckout
          amount={DEMO_PRICE}
          productName={programName || 'Training Program'}
          productDescription={programDate ? `${formatDateLong(programDate)} | ${programLocation || 'TBD'}` : undefined}
          programId={productId}
          onSuccess={handleNativePaymentSuccess}
          onCancel={handleNativePaymentCancel}
        />
      </View>
    );
  }

  // WebView checkout mode
  return (
    <View style={styles.container}>
      {renderModeToggle()}

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
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: 4,
    margin: spacing[3],
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.sm,
  },
  modeButtonActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
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
  // Enhanced Success Screen Styles
  successContainer: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  successScroll: {
    flex: 1,
  },
  successScrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  successHeader: {
    alignItems: 'center',
    paddingVertical: spacing[6],
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  successTitle: {
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  successSubtitle: {
    textAlign: 'center',
  },
  confirmationCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.md,
  },
  confirmationHeader: {
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  confirmationDivider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing[4],
  },
  confirmationSection: {
    gap: spacing[4],
  },
  confirmationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  confirmationRowContent: {
    flex: 1,
  },
  confirmationTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nextStepsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[5],
    ...shadows.sm,
  },
  nextStepsTitle: {
    marginBottom: spacing[4],
  },
  nextStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  nextStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextStepContent: {
    flex: 1,
  },
  successFooter: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  secondaryButton: {
    marginTop: spacing[3],
  },
  guestContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    backgroundColor: colors.white,
  },
  guestIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  guestEmoji: {
    fontSize: 40,
  },
  guestTitle: {
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  guestText: {
    marginBottom: spacing[8],
  },
  guestButtons: {
    width: '100%',
  },
});

export default CheckoutScreen;
