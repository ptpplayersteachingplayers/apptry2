/**
 * Payment Methods Screen (Parent)
 *
 * Manage saved payment methods - view, add, delete, set default.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { PaymentMethod } from '../../types';
import {
  getPaymentMethods,
  deletePaymentMethod,
  setDefaultPaymentMethod,
  getCardBrandName,
  formatCardExpiry,
  isCardExpired,
} from '../../api/payments';
import {
  PTPText,
  PTPButton,
  PTPLoading,
  PTPEmptyState,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

const PaymentMethodsScreen: React.FC = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [defaultMethodId, setDefaultMethodId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadPaymentMethods();
    }, [])
  );

  const loadPaymentMethods = async () => {
    try {
      const response = await getPaymentMethods();
      setPaymentMethods(response.paymentMethods);
      setDefaultMethodId(response.defaultPaymentMethodId || null);
    } catch (error) {
      console.error('Error loading payment methods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPaymentMethods();
    setIsRefreshing(false);
  };

  const handleSetDefault = async (methodId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActionLoading(methodId);

    try {
      await setDefaultPaymentMethod(methodId);
      setDefaultMethodId(methodId);
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === methodId }))
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to set default payment method.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (method: PaymentMethod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Remove Card',
      `Remove ${getCardBrandName(method.card?.brand || 'unknown')} ending in ${method.card?.last4}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(method.id);
            try {
              await deletePaymentMethod(method.id);
              setPaymentMethods((prev) => prev.filter((m) => m.id !== method.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

              // If deleted card was default, clear default
              if (method.isDefault) {
                setDefaultMethodId(null);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to remove payment method.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const getCardIcon = (brand: string): string => {
    // Could map to specific card brand icons
    return 'card';
  };

  const renderPaymentMethod = ({ item }: { item: PaymentMethod }) => {
    const expired = item.card && isCardExpired(item.card.expMonth, item.card.expYear);
    const isDefault = item.id === defaultMethodId;
    const isActionLoading = actionLoading === item.id;

    return (
      <View style={[styles.card, expired && styles.cardExpired]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardBrand}>
            <View style={[styles.cardIcon, expired && styles.cardIconExpired]}>
              <Ionicons
                name={getCardIcon(item.card?.brand || 'unknown') as any}
                size={24}
                color={expired ? colors.gray400 : colors.primary}
              />
            </View>
            <View>
              <PTPText variant="body" weight="semiBold">
                {getCardBrandName(item.card?.brand || 'unknown')} •••• {item.card?.last4}
              </PTPText>
              <View style={styles.cardDetails}>
                {expired ? (
                  <View style={styles.expiredBadge}>
                    <Ionicons name="alert-circle" size={12} color={colors.error} />
                    <PTPText variant="caption" color="error">
                      Expired
                    </PTPText>
                  </View>
                ) : (
                  <PTPText variant="caption" color="gray500">
                    Expires {formatCardExpiry(item.card?.expMonth || 1, item.card?.expYear || 2025)}
                  </PTPText>
                )}
                {item.card?.funding && (
                  <PTPText variant="caption" color="gray400">
                    {' '}
                    • {item.card.funding.charAt(0).toUpperCase() + item.card.funding.slice(1)}
                  </PTPText>
                )}
              </View>
            </View>
          </View>

          {isDefault && (
            <View style={styles.defaultBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
              <PTPText variant="caption" color="success">
                Default
              </PTPText>
            </View>
          )}
        </View>

        <View style={styles.cardActions}>
          {!isDefault && !expired && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleSetDefault(item.id)}
              disabled={isActionLoading}
            >
              <Ionicons
                name="star-outline"
                size={18}
                color={isActionLoading ? colors.gray400 : colors.primary}
              />
              <PTPText
                variant="bodySmall"
                color={isActionLoading ? 'gray400' : 'primary'}
              >
                Set as Default
              </PTPText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDelete(item)}
            disabled={isActionLoading}
          >
            <Ionicons
              name="trash-outline"
              size={18}
              color={isActionLoading ? colors.gray400 : colors.error}
            />
            <PTPText
              variant="bodySmall"
              color={isActionLoading ? 'gray400' : 'error'}
            >
              Remove
            </PTPText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return <PTPLoading />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={paymentMethods}
        keyExtractor={(item) => item.id}
        renderItem={renderPaymentMethod}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <PTPEmptyState
            icon="card-outline"
            title="No Payment Methods"
            message="Add a card to make checkout faster and easier."
          />
        }
        ListHeaderComponent={
          paymentMethods.length > 0 ? (
            <View style={styles.header}>
              <PTPText variant="bodySmall" color="gray500">
                {paymentMethods.length} saved card{paymentMethods.length !== 1 ? 's' : ''}
              </PTPText>
            </View>
          ) : null
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddCard(true)}
            >
              <View style={styles.addButtonIcon}>
                <Ionicons name="add" size={24} color={colors.primary} />
              </View>
              <View style={styles.addButtonText}>
                <PTPText variant="body" weight="semiBold">
                  Add Payment Method
                </PTPText>
                <PTPText variant="caption" color="gray500">
                  Credit or debit card
                </PTPText>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            </TouchableOpacity>

            {/* Info about Apple Pay / Google Pay */}
            <View style={styles.walletInfo}>
              <Ionicons name="phone-portrait-outline" size={20} color={colors.gray500} />
              <View style={styles.walletInfoText}>
                <PTPText variant="bodySmall" color="gray600">
                  Apple Pay & Google Pay
                </PTPText>
                <PTPText variant="caption" color="gray500">
                  Use your phone's wallet at checkout for quick payments.
                </PTPText>
              </View>
            </View>

            {/* Security note */}
            <View style={styles.securityNote}>
              <Ionicons name="shield-checkmark" size={18} color={colors.success} />
              <PTPText variant="caption" color="gray500">
                Your payment information is encrypted and securely stored by Stripe.
                We never store your full card details.
              </PTPText>
            </View>
          </View>
        }
      />

      {/* Add Card Modal */}
      <Modal
        visible={showAddCard}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddCard(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowAddCard(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.gray600} />
            </TouchableOpacity>
            <PTPText variant="sectionTitle">Add Card</PTPText>
            <View style={styles.modalCloseButton} />
          </View>

          <View style={styles.modalContent}>
            {/* Placeholder for Stripe CardField */}
            <View style={styles.cardFieldPlaceholder}>
              <Ionicons name="card" size={48} color={colors.gray300} />
              <PTPText variant="body" color="gray500" center style={{ marginTop: spacing[3] }}>
                Stripe Card Input
              </PTPText>
              <PTPText variant="caption" color="gray400" center style={{ marginTop: spacing[2] }}>
                Install @stripe/stripe-react-native package to enable card input.
              </PTPText>
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
          </View>

          <View style={styles.modalFooter}>
            <PTPButton
              title="Add Card"
              variant="primary"
              size="large"
              fullWidth
              onPress={() => {
                // Demo: simulate adding a card
                Alert.alert(
                  'Demo Mode',
                  'In production, this would add your card via Stripe. Adding demo card...',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        loadPaymentMethods();
                        setShowAddCard(false);
                      },
                    },
                  ]
                );
              }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  listContent: {
    padding: spacing[4],
    flexGrow: 1,
  },
  header: {
    marginBottom: spacing[3],
  },
  card: {
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    padding: spacing[4],
    marginBottom: spacing[3],
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  cardExpired: {
    opacity: 0.7,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconExpired: {
    backgroundColor: colors.gray700,
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 0,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing[4],
    marginTop: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  deleteButton: {},
  footer: {
    marginTop: spacing[2],
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    padding: spacing[4],
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  addButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 0,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  addButtonText: {
    flex: 1,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.blackLight,
    padding: spacing[4],
    borderRadius: 0,
    gap: spacing[3],
    marginBottom: spacing[3],
  },
  walletInfoText: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[2],
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.blackCard,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.gray700,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
    padding: spacing[4],
  },
  cardFieldPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.blackLight,
    borderRadius: 0,
    marginBottom: spacing[4],
    borderWidth: 2,
    borderColor: colors.gray700,
    borderStyle: 'dashed',
  },
  cardFormInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
  },
  cardFormInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
  },
});

export default PaymentMethodsScreen;
