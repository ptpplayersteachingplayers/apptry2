/**
 * Earnings Detail Screen (Trainer)
 *
 * Shows detailed earnings breakdown, payout history, and pending payments.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { TrainerStackParamList } from '../../types/navigation';
import { getTrainerEarnings } from '../../api/training';
import { PTPText, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type EarningsDetailNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

interface EarningsData {
  totalEarnings: number;
  pendingPayout: number;
  thisMonth: number;
  lastMonth: number;
  transactions: Transaction[];
}

interface Transaction {
  id: number;
  type: 'earning' | 'payout';
  amount: number;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  sessionId?: number;
}

/**
 * EarningsDetailScreen - View earnings and payout history
 */
const EarningsDetailScreen: React.FC = () => {
  const navigation = useNavigation<EarningsDetailNavigationProp>();
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('month');

  useEffect(() => {
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    try {
      const data = await getTrainerEarnings();
      // Use API response data (already in camelCase from TrainerEarnings type)
      setEarnings({
        totalEarnings: data.totalEarnings || 0,
        pendingPayout: data.pendingPayout || 0,
        thisMonth: data.thisMonth || 0,
        lastMonth: data.lastPayoutAmount || 0,
        transactions: mockTransactions, // Use mock for now
      });
    } catch (error) {
      console.error('Failed to load earnings:', error);
      // Use mock data as fallback
      setEarnings({
        totalEarnings: 4280,
        pendingPayout: 320,
        thisMonth: 960,
        lastMonth: 840,
        transactions: mockTransactions,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEarnings();
    setIsRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'processing':
        return colors.primary;
      default:
        return colors.gray500;
    }
  };

  const handleSessionPress = (sessionId?: number) => {
    if (sessionId) {
      navigation.navigate('SessionDetail', { sessionId });
    }
  };

  if (isLoading) {
    return <PTPLoading message="Loading earnings..." />;
  }

  if (!earnings) {
    return (
      <View style={styles.errorContainer}>
        <PTPText variant="sectionTitle">Unable to load earnings</PTPText>
      </View>
    );
  }

  const filteredTransactions = earnings.transactions.filter((t) => {
    if (selectedPeriod === 'all') return true;
    const date = new Date(t.date);
    const now = new Date();
    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return date >= weekAgo;
    }
    if (selectedPeriod === 'month') {
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summarySection}>
          <View style={styles.summaryCard}>
            <PTPText variant="caption" color="gray500">Total Earnings</PTPText>
            <PTPText variant="heroTitle" color="success">
              {formatCurrency(earnings.totalEarnings)}
            </PTPText>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCardSmall, styles.pendingCard]}>
              <Ionicons name="time-outline" size={24} color={colors.warning} />
              <View style={styles.summaryCardContent}>
                <PTPText variant="caption" color="gray500">Pending</PTPText>
                <PTPText variant="sectionTitle" color="warning">
                  {formatCurrency(earnings.pendingPayout)}
                </PTPText>
              </View>
            </View>

            <View style={styles.summaryCardSmall}>
              <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              <View style={styles.summaryCardContent}>
                <PTPText variant="caption" color="gray500">This Month</PTPText>
                <PTPText variant="sectionTitle">
                  {formatCurrency(earnings.thisMonth)}
                </PTPText>
              </View>
            </View>
          </View>
        </View>

        {/* Period Filter */}
        <View style={styles.filterSection}>
          <PTPText variant="label" color="gray500" style={styles.filterLabel}>
            TRANSACTION HISTORY
          </PTPText>
          <View style={styles.filterRow}>
            {(['week', 'month', 'all'] as const).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.filterChip,
                  selectedPeriod === period && styles.filterChipSelected,
                ]}
                onPress={() => setSelectedPeriod(period)}
              >
                <PTPText
                  variant="caption"
                  color={selectedPeriod === period ? 'white' : 'gray600'}
                >
                  {period === 'all' ? 'All Time' : period === 'month' ? 'This Month' : 'This Week'}
                </PTPText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          {filteredTransactions.length > 0 ? (
            <View style={styles.transactionsCard}>
              {filteredTransactions.map((transaction, index) => (
                <TouchableOpacity
                  key={transaction.id}
                  style={[
                    styles.transactionItem,
                    index < filteredTransactions.length - 1 && styles.transactionItemBorder,
                  ]}
                  onPress={() => handleSessionPress(transaction.sessionId)}
                  disabled={!transaction.sessionId}
                >
                  <View style={styles.transactionIcon}>
                    <Ionicons
                      name={transaction.type === 'earning' ? 'arrow-down' : 'arrow-up'}
                      size={20}
                      color={transaction.type === 'earning' ? colors.success : colors.primary}
                    />
                  </View>
                  <View style={styles.transactionContent}>
                    <PTPText variant="buttonMedium">{transaction.description}</PTPText>
                    <View style={styles.transactionMeta}>
                      <PTPText variant="caption" color="gray500">
                        {formatDate(transaction.date)}
                      </PTPText>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(transaction.status) }]}>
                        <PTPText variant="caption" color="white" style={styles.statusText}>
                          {transaction.status}
                        </PTPText>
                      </View>
                    </View>
                  </View>
                  <PTPText
                    variant="buttonMedium"
                    color={transaction.type === 'earning' ? 'success' : 'inkBlack'}
                  >
                    {transaction.type === 'earning' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </PTPText>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="receipt-outline" size={48} color={colors.gray300} />
              <PTPText variant="body" color="gray500" center style={styles.emptyText}>
                No transactions for this period
              </PTPText>
            </View>
          )}
        </View>

        {/* Payout Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={colors.gray500} />
            <PTPText variant="caption" color="gray500" style={styles.infoText}>
              Payouts are processed weekly on Fridays. Make sure your payment information is up to date in your account settings.
            </PTPText>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Mock transactions for demo
const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: 'earning',
    amount: 80,
    description: 'Training session - Jake J.',
    date: new Date().toISOString(),
    status: 'pending',
    sessionId: 1,
  },
  {
    id: 2,
    type: 'earning',
    amount: 80,
    description: 'Training session - Emma S.',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    sessionId: 2,
  },
  {
    id: 3,
    type: 'payout',
    amount: 480,
    description: 'Weekly payout',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
  },
  {
    id: 4,
    type: 'earning',
    amount: 160,
    description: '2-hour session - Michael T.',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    sessionId: 3,
  },
  {
    id: 5,
    type: 'earning',
    amount: 80,
    description: 'Training session - Sarah K.',
    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    sessionId: 4,
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[8],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  summarySection: {
    padding: spacing[4],
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[6],
    alignItems: 'center',
    marginBottom: spacing[3],
    ...shadows.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  summaryCardSmall: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.sm,
  },
  pendingCard: {},
  summaryCardContent: {
    marginLeft: spacing[3],
  },
  filterSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[2],
  },
  filterLabel: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  filterChip: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterChipSelected: {
    backgroundColor: colors.primary,
  },
  transactionsSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  transactionsCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.sm,
    overflow: 'hidden',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  transactionItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  transactionContent: {
    flex: 1,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing[2],
  },
  statusText: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[8],
    alignItems: 'center',
    ...shadows.sm,
  },
  emptyText: {
    marginTop: spacing[3],
  },
  infoSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray100,
    padding: spacing[4],
    borderRadius: borderRadius.md,
  },
  infoText: {
    flex: 1,
    marginLeft: spacing[2],
  },
});

export default EarningsDetailScreen;
