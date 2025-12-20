/**
 * Native Checkout Component
 *
 * Provides native payment processing with Stripe.
 * Supports card payments, Apple Pay, and Google Pay.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import {
  useStripe,
  CardField,
  CardFieldInput,
  PlatformPayButton,
  isPlatformPaySupported,
  PlatformPay,
} from '@stripe/stripe-react-native';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import {
  PaymentMethod,
  PaymentResult,
} from '../../types';
import {
  getPaymentMethods,
  createPaymentIntent,
  confirmPayment,
  addPaymentMethod,
  getCardBrandName,
  formatCardExpiry,
  isCardExpired,
} from '../../api/payments';
import { apiConfig } from '../../api/config';

interface NativeCheckoutProps {
  amount: number;
  productName: string;
  productDescription?: string;
  orderId?: number;
  programId?: number;
  onSuccess: (result: PaymentResult) => void;
  onCancel: () => void;
  onError?: (error: string) => void;
}

/**
 * Native Checkout - Stripe payment sheet with saved cards
 */
export const NativeCheckout: React.FC<NativeCheckoutProps> = ({
  amount,
  productName,
  productDescription,
  orderId,
  programId,
  onSuccess,
  onCancel,
  onError,
}) => {
  const { confirmPayment: stripeConfirmPayment, createPaymentMethod } = useStripe();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
  const [isPlatformPayAvailable, setIsPlatformPayAvailable] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Check if Apple Pay / Google Pay is available
  useEffect(() => {
    const checkPlatformPay = async () => {
      const isSupported = await isPlatformPaySupported();
      setIsPlatformPayAvailable(isSupported);
    };
    checkPlatformPay();
  }, []);

  // Load saved payment methods
  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const response = await getPaymentMethods();
      setPaymentMethods(response.paymentMethods);
      if (response.defaultPaymentMethodId) {
        setSelectedMethodId(response.defaultPaymentMethodId);
      } else if (response.paymentMethods.length > 0) {
        setSelectedMethodId(response.paymentMethods[0].id);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePay = async () => {
    if (!selectedMethodId) {
      Alert.alert('Select Payment Method', 'Please select a payment method to continue.');
      return;
    }

    setIsProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create payment intent on backend
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(amount * 100), // Convert to cents
        orderId,
        programId,
        paymentMethodId: selectedMethodId,
      });

      if (!paymentIntent.clientSecret) {
        throw new Error('Payment setup failed. Please try again.');
      }

      // In demo mode, simulate the payment confirmation
      if (apiConfig.demoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const result: PaymentResult = {
          success: true,
          paymentIntent,
          orderId: orderId || Date.now(),
        };
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(result);
        return;
      }

      // Confirm the payment with Stripe SDK
      const { error, paymentIntent: confirmedIntent } = await stripeConfirmPayment(
        paymentIntent.clientSecret,
        {
          paymentMethodType: 'Card',
          paymentMethodData: {
            paymentMethodId: selectedMethodId,
          },
        }
      );

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert('Payment Failed', error.message || 'Unable to process payment.');
        onError?.(error.message);
      } else if (confirmedIntent) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess({
          success: true,
          paymentIntent: {
            ...paymentIntent,
            status: confirmedIntent.status,
          },
          orderId: orderId || Date.now(),
        });
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Something went wrong. Please try again.');
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlatformPay = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (apiConfig.demoMode) {
      const payType = Platform.OS === 'ios' ? 'Apple Pay' : 'Google Pay';
      Alert.alert(
        payType,
        `${payType} would open here in production. For demo, we'll simulate a successful payment.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Simulate Success',
            onPress: async () => {
              setIsProcessing(true);
              await new Promise((resolve) => setTimeout(resolve, 1000));
              setIsProcessing(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess({
                success: true,
                orderId: orderId || Date.now(),
              });
            },
          },
        ]
      );
      return;
    }

    setIsProcessing(true);

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount: Math.round(amount * 100),
        orderId,
        programId,
      });

      if (!paymentIntent.clientSecret) {
        throw new Error('Payment setup failed.');
      }

      // Confirm with platform pay
      const { error } = await stripeConfirmPayment(paymentIntent.clientSecret, {
        paymentMethodType: 'Card',
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        onError?.(error.message);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess({
          success: true,
          paymentIntent,
          orderId: orderId || Date.now(),
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Payment failed.');
      onError?.(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddCard = async () => {
    if (!cardDetails?.complete) {
      Alert.alert('Incomplete Card', 'Please enter all card details.');
      return;
    }

    setIsSavingCard(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Create payment method with Stripe
      const { paymentMethod, error } = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {},
        },
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to add card.');
        return;
      }

      if (paymentMethod) {
        // Save to backend
        if (apiConfig.demoMode) {
          // In demo mode, add mock card
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else {
          await addPaymentMethod(paymentMethod.id);
        }

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Success', 'Card added successfully!');
        await loadPaymentMethods();
        setShowAddCard(false);
        setCardDetails(null);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add card.');
    } finally {
      setIsSavingCard(false);
    }
  };

  const renderPaymentMethod = (method: PaymentMethod) => {
    const isSelected = selectedMethodId === method.id;
    const expired = method.card && isCardExpired(method.card.expMonth, method.card.expYear);

    return (
      <TouchableOpacity
        key={method.id}
        style={[
          styles.paymentMethodCard,
          isSelected && styles.paymentMethodSelected,
          expired && styles.paymentMethodExpired,
        ]}
        onPress={() => !expired && setSelectedMethodId(method.id)}
        disabled={expired}
      >
        <View style={styles.paymentMethodIcon}>
          <Ionicons
            name="card"
            size={24}
            color={isSelected ? colors.primary : colors.gray500}
          />
        </View>
        <View style={styles.paymentMethodInfo}>
          <PTPText variant="body" weight={isSelected ? 'semiBold' : 'regular'}>
            {method.card ? getCardBrandName(method.card.brand) : 'Card'} ••••{' '}
            {method.card?.last4}
          </PTPText>
          <PTPText variant="caption" color={expired ? 'error' : 'gray500'}>
            {expired
              ? 'Expired'
              : method.card
              ? `Expires ${formatCardExpiry(method.card.expMonth, method.card.expYear)}`
              : ''}
          </PTPText>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        )}
        {method.isDefault && !isSelected && (
          <View style={styles.defaultBadge}>
            <PTPText variant="caption" color="gray500">
              Default
            </PTPText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <PTPText variant="body" color="gray500" style={{ marginTop: spacing[4] }}>
          Loading payment options...
        </PTPText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Summary */}
        <View style={styles.orderSummary}>
          <PTPText variant="label" color="gray500">
            ORDER SUMMARY
          </PTPText>
          <View style={styles.orderRow}>
            <PTPText variant="body">{productName}</PTPText>
            <PTPText variant="body" weight="semiBold">
              ${amount.toFixed(2)}
            </PTPText>
          </View>
          {productDescription && (
            <PTPText variant="caption" color="gray500">
              {productDescription}
            </PTPText>
          )}
        </View>

        {/* Express Checkout - Platform Pay */}
        {isPlatformPayAvailable && (
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              EXPRESS CHECKOUT
            </PTPText>
            <PlatformPayButton
              type={Platform.OS === 'ios' ? PlatformPay.ButtonType.Pay : PlatformPay.ButtonType.Pay}
              onPress={handlePlatformPay}
              disabled={isProcessing}
              style={styles.platformPayButton}
            />
          </View>
        )}

        {/* Manual Express Buttons as fallback */}
        {!isPlatformPayAvailable && (
          <View style={styles.section}>
            <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
              EXPRESS CHECKOUT
            </PTPText>
            <View style={styles.expressButtons}>
              {Platform.OS === 'ios' && (
                <TouchableOpacity
                  style={styles.applePayButton}
                  onPress={handlePlatformPay}
                  disabled={isProcessing}
                >
                  <Ionicons name="logo-apple" size={20} color={colors.white} />
                  <PTPText style={styles.applePayText}>Pay</PTPText>
                </TouchableOpacity>
              )}
              {Platform.OS === 'android' && (
                <TouchableOpacity
                  style={styles.googlePayButton}
                  onPress={handlePlatformPay}
                  disabled={isProcessing}
                >
                  <Ionicons name="logo-google" size={18} color={colors.inkBlack} />
                  <PTPText style={styles.googlePayText}>Pay</PTPText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={styles.dividerLine} />
          <PTPText variant="caption" color="gray400" style={styles.dividerText}>
            or pay with card
          </PTPText>
          <View style={styles.dividerLine} />
        </View>

        {/* Saved Payment Methods */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            SAVED CARDS
          </PTPText>

          {paymentMethods.length > 0 ? (
            <View style={styles.paymentMethods}>
              {paymentMethods.map(renderPaymentMethod)}
            </View>
          ) : (
            <View style={styles.noCards}>
              <Ionicons name="card-outline" size={32} color={colors.gray400} />
              <PTPText variant="bodySmall" color="gray500" style={{ marginTop: spacing[2] }}>
                No saved cards
              </PTPText>
            </View>
          )}

          <TouchableOpacity
            style={styles.addCardButton}
            onPress={() => setShowAddCard(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <PTPText variant="bodySmall" color="primary">
              Add new card
            </PTPText>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <Ionicons name="shield-checkmark" size={16} color={colors.success} />
          <PTPText variant="caption" color="gray500">
            Your payment is secured with Stripe. Card details are never stored on our servers.
          </PTPText>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <PTPText variant="body" color="gray600">
            Total
          </PTPText>
          <PTPText variant="sectionTitle" color="inkBlack">
            ${amount.toFixed(2)}
          </PTPText>
        </View>
        <View style={styles.footerButtons}>
          <PTPButton
            title="Cancel"
            variant="outline"
            onPress={onCancel}
            style={styles.cancelButton}
            disabled={isProcessing}
          />
          <PTPButton
            title={isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
            variant="primary"
            onPress={handlePay}
            style={styles.payButton}
            loading={isProcessing}
            disabled={!selectedMethodId || isProcessing}
          />
        </View>
      </View>

      {/* Add Card Modal with Stripe CardField */}
      <Modal
        visible={showAddCard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCard(false)}
      >
        <SafeAreaView style={styles.addCardModal}>
          <View style={styles.addCardHeader}>
            <TouchableOpacity onPress={() => setShowAddCard(false)}>
              <Ionicons name="close" size={24} color={colors.gray600} />
            </TouchableOpacity>
            <PTPText variant="sectionTitle">Add Card</PTPText>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.addCardContent}>
            <View style={styles.cardFieldContainer}>
              <PTPText variant="label" color="gray600" style={styles.cardFieldLabel}>
                CARD INFORMATION
              </PTPText>
              <CardField
                postalCodeEnabled={true}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={cardFieldStyles}
                style={styles.cardField}
                onCardChange={(details) => setCardDetails(details)}
              />
            </View>

            <View style={styles.cardFormInfo}>
              <View style={styles.cardFormInfoRow}>
                <Ionicons name="lock-closed" size={16} color={colors.success} />
                <PTPText variant="caption" color="gray500">
                  256-bit encryption
                </PTPText>
              </View>
              <View style={styles.cardFormInfoRow}>
                <Ionicons name="shield-checkmark" size={16} color={colors.success} />
                <PTPText variant="caption" color="gray500">
                  PCI DSS compliant
                </PTPText>
              </View>
            </View>

            <View style={styles.testCardNote}>
              <Ionicons name="information-circle" size={18} color={colors.primary} />
              <PTPText variant="caption" color="gray600">
                Test card: 4242 4242 4242 4242, any future date, any CVC
              </PTPText>
            </View>
          </View>

          <View style={styles.addCardFooter}>
            <PTPButton
              title={isSavingCard ? 'Adding Card...' : 'Add Card'}
              variant="primary"
              fullWidth
              loading={isSavingCard}
              disabled={!cardDetails?.complete || isSavingCard}
              onPress={handleAddCard}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const cardFieldStyles = {
  backgroundColor: colors.white,
  textColor: colors.inkBlack,
  fontSize: 16,
  placeholderColor: colors.gray400,
  cursorColor: colors.primary,
  borderRadius: 8,
  borderWidth: 1,
  borderColor: colors.gray300,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  orderSummary: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.sm,
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  platformPayButton: {
    width: '100%',
    height: 50,
  },
  expressButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  applePayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inkBlack,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    gap: spacing[2],
  },
  applePayText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '500',
  },
  googlePayButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray300,
    gap: spacing[2],
  },
  googlePayText: {
    color: colors.inkBlack,
    fontSize: 17,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing[4],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    paddingHorizontal: spacing[3],
  },
  paymentMethods: {
    gap: spacing[2],
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  paymentMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  paymentMethodExpired: {
    opacity: 0.5,
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  paymentMethodInfo: {
    flex: 1,
  },
  defaultBadge: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  noCards: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing[6],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderStyle: 'dashed',
  },
  addCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[3],
    marginTop: spacing[2],
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.successLight,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[2],
  },
  footer: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    padding: spacing[4],
    ...shadows.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 0.4,
  },
  payButton: {
    flex: 0.6,
  },
  addCardModal: {
    flex: 1,
    backgroundColor: colors.white,
  },
  addCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  addCardContent: {
    flex: 1,
    padding: spacing[4],
  },
  cardFieldContainer: {
    marginBottom: spacing[4],
  },
  cardFieldLabel: {
    marginBottom: spacing[2],
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: spacing[2],
  },
  cardFormInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginTop: spacing[4],
  },
  cardFormInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  testCardNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.primaryLight,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginTop: spacing[6],
  },
  addCardFooter: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
});

export default NativeCheckout;
