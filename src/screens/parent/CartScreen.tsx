/**
 * Cart Screen (Parent)
 *
 * Full shopping cart with:
 * - Product list with images, names, prices
 * - Quantity selector (+/- buttons)
 * - Remove item functionality
 * - Dynamic subtotal calculation
 * - Processing fee calculation
 * - Coupon/discount code application
 * - Bundle discount notifications
 * - Proceed to Checkout button
 * - Urgency messaging
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { useCartStore, CartItem } from '../../stores';
import {
  PTPText,
  PTPButton,
  AnimatedPressable,
  FadeInView,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { formatPrice, formatDateShort } from '../../lib/formatting';
import { useHaptics } from '../../hooks';

type CartScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * CartScreen - Shopping cart management
 */
const CartScreen: React.FC = () => {
  const navigation = useNavigation<CartScreenNavigationProp>();
  const { selection, success, warning } = useHaptics();

  const {
    items,
    appliedCoupon,
    isApplyingCoupon,
    couponError,
    getTotals,
    updateItemQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
    clearCart,
  } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [showCouponInput, setShowCouponInput] = useState(false);

  const totals = getTotals();

  const handleQuantityChange = (itemId: string, delta: number) => {
    selection();
    const item = items.find(i => i.id === itemId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity < 1) {
        handleRemoveItem(itemId);
      } else {
        updateItemQuantity(itemId, newQuantity);
      }
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            warning();
            removeItem(itemId);
          },
        },
      ]
    );
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    selection();
    const success = await applyCoupon(couponCode.trim());
    if (success) {
      setCouponCode('');
      setShowCouponInput(false);
    }
  };

  const handleRemoveCoupon = () => {
    selection();
    removeCoupon();
  };

  const handleClearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => {
            warning();
            clearCart();
          },
        },
      ]
    );
  };

  const handleCheckout = () => {
    success();
    navigation.navigate('Checkout');
  };

  const renderCartItem = (item: CartItem) => {
    const hasDiscount = item.program.salePrice && item.program.salePrice < item.program.price;
    const itemPrice = item.program.salePrice || item.program.price;

    return (
      <FadeInView key={item.id}>
        <View style={styles.cartItem}>
          {/* Product Image */}
          <Image
            source={{ uri: item.program.mainImageUrl }}
            style={styles.itemImage}
            resizeMode="cover"
          />

          {/* Product Details */}
          <View style={styles.itemDetails}>
            <PTPText variant="body" numberOfLines={2} style={styles.itemTitle}>
              {item.program.title}
            </PTPText>
            <PTPText variant="caption" color="gray400">
              {formatDateShort(item.program.date)}
            </PTPText>
            {item.selectedChildren.length > 0 && (
              <PTPText variant="caption" color="primary">
                {item.selectedChildren.map(c => c.firstName).join(', ')}
              </PTPText>
            )}

            {/* Price */}
            <View style={styles.priceRow}>
              {hasDiscount && (
                <PTPText variant="caption" color="gray500" style={styles.originalPrice}>
                  ${item.program.price}
                </PTPText>
              )}
              <PTPText variant="body" color="primary">
                {formatPrice(itemPrice)}
              </PTPText>
            </View>
          </View>

          {/* Quantity Controls */}
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, -1)}
            >
              <Ionicons name="remove" size={18} color={colors.white} />
            </TouchableOpacity>
            <PTPText variant="body" style={styles.quantityText}>
              {item.quantity}
            </PTPText>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => handleQuantityChange(item.id, 1)}
            >
              <Ionicons name="add" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveItem(item.id)}
          >
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </FadeInView>
    );
  };

  // Empty cart state
  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cart-outline" size={64} color={colors.gray600} />
          </View>
          <PTPText variant="sectionTitle" center style={styles.emptyTitle}>
            YOUR CART IS EMPTY
          </PTPText>
          <PTPText variant="body" color="gray400" center style={styles.emptySubtitle}>
            Browse our camps and clinics to find the perfect program for your player.
          </PTPText>
          <PTPButton
            title="BROWSE PROGRAMS"
            variant="primary"
            onPress={() => navigation.navigate('ParentTabs', { screen: 'Camps' })}
            style={styles.browseButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Urgency Banner */}
      <View style={styles.urgencyBanner}>
        <Ionicons name="alert-circle" size={16} color={colors.primary} />
        <PTPText variant="caption" color="primary" style={styles.urgencyText}>
          CAMPS HAVE LIMITED SPOTS - COMPLETE YOUR ORDER SOON!
        </PTPText>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {items.map(renderCartItem)}
        </View>

        {/* Bundle Discount Notification */}
        {totals.itemCount >= 2 && (
          <View style={styles.bundleNotification}>
            <Ionicons name="pricetag" size={18} color={colors.success} />
            <PTPText variant="body" color="success" style={styles.bundleText}>
              {totals.itemCount >= 3
                ? '15% bundle discount applied!'
                : '10% bundle discount applied!'}
            </PTPText>
          </View>
        )}

        {/* Coupon Section */}
        <View style={styles.couponSection}>
          {appliedCoupon ? (
            <View style={styles.appliedCoupon}>
              <View style={styles.appliedCouponInfo}>
                <Ionicons name="pricetag" size={18} color={colors.success} />
                <View>
                  <PTPText variant="body" color="success">
                    {appliedCoupon.code}
                  </PTPText>
                  <PTPText variant="caption" color="gray400">
                    {appliedCoupon.description}
                  </PTPText>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemoveCoupon}>
                <Ionicons name="close-circle" size={22} color={colors.gray500} />
              </TouchableOpacity>
            </View>
          ) : (
            <AnimatedPressable
              style={styles.couponToggle}
              onPress={() => setShowCouponInput(!showCouponInput)}
            >
              <Ionicons name="pricetag-outline" size={18} color={colors.gray400} />
              <PTPText variant="body" color="gray400">
                Have a coupon code?
              </PTPText>
              <Ionicons
                name={showCouponInput ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.gray400}
              />
            </AnimatedPressable>
          )}

          {showCouponInput && !appliedCoupon && (
            <View style={styles.couponInputContainer}>
              <TextInput
                style={styles.couponInput}
                placeholder="Enter code"
                placeholderTextColor={colors.gray500}
                value={couponCode}
                onChangeText={setCouponCode}
                autoCapitalize="characters"
                returnKeyType="done"
                onSubmitEditing={handleApplyCoupon}
              />
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  isApplyingCoupon && styles.applyButtonDisabled,
                ]}
                onPress={handleApplyCoupon}
                disabled={isApplyingCoupon}
              >
                <PTPText variant="label" color="inkBlack">
                  {isApplyingCoupon ? '...' : 'APPLY'}
                </PTPText>
              </TouchableOpacity>
            </View>
          )}

          {couponError && (
            <PTPText variant="caption" color="error" style={styles.couponError}>
              {couponError}
            </PTPText>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <PTPText variant="sectionTitle" style={styles.summaryTitle}>
            ORDER SUMMARY
          </PTPText>

          <View style={styles.summaryRow}>
            <PTPText variant="body" color="gray400">
              Subtotal ({totals.itemCount} item{totals.itemCount !== 1 ? 's' : ''})
            </PTPText>
            <PTPText variant="body">{formatPrice(totals.subtotal)}</PTPText>
          </View>

          {totals.discount > 0 && (
            <View style={styles.summaryRow}>
              <PTPText variant="body" color="success">
                Discount
              </PTPText>
              <PTPText variant="body" color="success">
                -{formatPrice(totals.discount)}
              </PTPText>
            </View>
          )}

          <View style={styles.summaryRow}>
            <PTPText variant="body" color="gray400">
              Processing Fee (3.5%)
            </PTPText>
            <PTPText variant="body">{formatPrice(totals.processingFee)}</PTPText>
          </View>

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <PTPText variant="sectionTitle">TOTAL</PTPText>
            <PTPText variant="heroTitle" color="primary">
              {formatPrice(totals.total)}
            </PTPText>
          </View>

          {totals.savings > 0 && (
            <View style={styles.savingsRow}>
              <Ionicons name="checkmark-circle" size={16} color={colors.success} />
              <PTPText variant="caption" color="success">
                You're saving {formatPrice(totals.savings)}!
              </PTPText>
            </View>
          )}
        </View>

        {/* Trust Badges */}
        <View style={styles.trustBadges}>
          <View style={styles.trustBadge}>
            <Ionicons name="lock-closed" size={16} color={colors.gray500} />
            <PTPText variant="caption" color="gray500">Secure</PTPText>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="shield-checkmark" size={16} color={colors.gray500} />
            <PTPText variant="caption" color="gray500">Safe Payment</PTPText>
          </View>
          <View style={styles.trustBadge}>
            <Ionicons name="ribbon" size={16} color={colors.gray500} />
            <PTPText variant="caption" color="gray500">Protected</PTPText>
          </View>
        </View>

        {/* Clear Cart Link */}
        <TouchableOpacity style={styles.clearCartLink} onPress={handleClearCart}>
          <PTPText variant="caption" color="gray500">
            Clear Cart
          </PTPText>
        </TouchableOpacity>
      </ScrollView>

      {/* Checkout Button */}
      <View style={styles.checkoutContainer}>
        <PTPButton
          title={`PROCEED TO CHECKOUT - ${formatPrice(totals.total)}`}
          variant="primary"
          size="large"
          fullWidth
          onPress={handleCheckout}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(252, 185, 0, 0.1)',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  urgencyText: {
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  itemsSection: {
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    padding: spacing[3],
    gap: spacing[3],
  },
  itemImage: {
    width: 80,
    height: 80,
    backgroundColor: colors.gray800,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemTitle: {
    marginBottom: spacing[1],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginTop: spacing[1],
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  quantityControls: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
  },
  quantityButton: {
    width: 28,
    height: 28,
    backgroundColor: colors.gray700,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    minWidth: 24,
    textAlign: 'center',
  },
  removeButton: {
    justifyContent: 'center',
    padding: spacing[2],
  },
  bundleNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: spacing[3],
    gap: spacing[2],
    marginBottom: spacing[4],
    borderWidth: 1,
    borderColor: colors.success,
  },
  bundleText: {
    flex: 1,
  },
  couponSection: {
    marginBottom: spacing[4],
  },
  couponToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    padding: spacing[3],
    gap: spacing[2],
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: colors.success,
    padding: spacing[3],
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  couponInputContainer: {
    flexDirection: 'row',
    marginTop: spacing[2],
    gap: spacing[2],
  },
  couponInput: {
    flex: 1,
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    color: colors.white,
    fontSize: 16,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  couponError: {
    marginTop: spacing[2],
  },
  summarySection: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  summaryTitle: {
    marginBottom: spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray700,
    marginVertical: spacing[3],
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[1],
    marginTop: spacing[3],
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginBottom: spacing[4],
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  clearCartLink: {
    alignItems: 'center',
    padding: spacing[2],
  },
  checkoutContainer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
    backgroundColor: colors.black,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[8],
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.blackCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  emptyTitle: {
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    marginBottom: spacing[6],
    maxWidth: 280,
  },
  browseButton: {
    minWidth: 200,
  },
});

export default CartScreen;
