/**
 * Order History Screen (Parent)
 *
 * Displays past purchases and registrations.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Order } from '../../types';
import { getMyOrders } from '../../api/orders';
import { PTPText, PTPListSkeleton, PTPEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type OrderHistoryNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

const OrderHistoryScreen: React.FC = () => {
  const navigation = useNavigation<OrderHistoryNavigationProp>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await getMyOrders();
      setOrders(response.orders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadOrders();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'processing':
        return colors.primary;
      case 'pending':
        return colors.warning;
      case 'cancelled':
      case 'refunded':
        return colors.error;
      default:
        return colors.gray500;
    }
  };

  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'completed':
        return 'checkmark-circle';
      case 'processing':
        return 'time';
      case 'pending':
        return 'hourglass';
      case 'cancelled':
        return 'close-circle';
      case 'refunded':
        return 'arrow-back-circle';
      default:
        return 'help-circle';
    }
  };

  const renderOrderItem = useCallback(({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      accessibilityLabel={`Order ${item.orderNumber}`}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <PTPText variant="label" color="gray500">
            {item.orderNumber}
          </PTPText>
          <PTPText variant="caption" color="gray400">
            {formatDate(item.createdAt)}
          </PTPText>
        </View>
        <View style={styles.statusBadge}>
          <Ionicons
            name={getStatusIcon(item.status)}
            size={14}
            color={getStatusColor(item.status)}
          />
          <PTPText
            variant="caption"
            style={{ color: getStatusColor(item.status), marginLeft: spacing[1] }}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </PTPText>
        </View>
      </View>

      <View style={styles.orderItems}>
        {item.items.map((orderItem, index) => (
          <View key={orderItem.id} style={styles.itemRow}>
            <View style={styles.itemIcon}>
              <Ionicons
                name={orderItem.type === 'camp' ? 'sunny' : 'school'}
                size={16}
                color={colors.primary}
              />
            </View>
            <View style={styles.itemDetails}>
              <PTPText variant="buttonMedium" numberOfLines={1}>
                {orderItem.name}
              </PTPText>
              <PTPText variant="caption" color="gray500">
                {orderItem.programDate} {orderItem.childName ? `for ${orderItem.childName}` : ''}
              </PTPText>
            </View>
            <PTPText variant="label" color="gray600">
              {formatCurrency(orderItem.total)}
            </PTPText>
          </View>
        ))}
      </View>

      <View style={styles.orderFooter}>
        <View style={styles.totalRow}>
          {item.discount > 0 && (
            <PTPText variant="caption" color="success" style={styles.discount}>
              -{formatCurrency(item.discount)} discount
            </PTPText>
          )}
          <PTPText variant="buttonMedium" color="inkBlack">
            Total: {formatCurrency(item.total)}
          </PTPText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
      </View>
    </TouchableOpacity>
  ), [navigation]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="heroTitle">Order History</PTPText>
          <PTPText variant="body" color="gray500">
            Your past purchases and registrations
          </PTPText>
        </View>
        <PTPListSkeleton count={3} style={styles.loadingContainer} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PTPText variant="heroTitle">Order History</PTPText>
        <PTPText variant="body" color="gray500">
          Your past purchases and registrations
        </PTPText>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderOrderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PTPEmptyState
              iconName="receipt-outline"
              title="No orders yet"
              description="Your purchase history will appear here once you register for camps or clinics."
              actionLabel="Browse Programs"
              onAction={() => navigation.navigate('ParentTabs', { screen: 'CampsClinics' })}
            />
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    padding: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  loadingContainer: {
    padding: spacing[4],
  },
  listContent: {
    padding: spacing[4],
    paddingBottom: spacing[8],
  },
  emptyContainer: {
    padding: spacing[4],
    minHeight: 300,
  },
  orderCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...shadows.sm,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  orderInfo: {
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.sm,
  },
  orderItems: {
    padding: spacing[4],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  itemDetails: {
    flex: 1,
    marginRight: spacing[2],
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.gray50,
  },
  totalRow: {
    flex: 1,
  },
  discount: {
    marginBottom: spacing[1],
  },
});

export default OrderHistoryScreen;
