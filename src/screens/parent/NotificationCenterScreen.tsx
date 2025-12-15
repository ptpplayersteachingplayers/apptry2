/**
 * Notification Center Screen
 *
 * Displays user notification history with ability to mark as read
 * and navigate to related content.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ParentStackParamList } from '../../types/navigation';
import { PTPText, PTPLoading, PTPEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationItem,
} from '../../api/push';
import { useNotificationContext } from '../../providers';

type NotificationCenterNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * Format relative time for notification
 */
const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Get icon for notification type
 */
const getNotificationIcon = (type: string): string => {
  switch (type) {
    case 'session_reminder':
      return '⏰';
    case 'new_message':
      return '💬';
    case 'session_request':
      return '📩';
    case 'session_confirmed':
      return '✅';
    case 'session_cancelled':
      return '❌';
    case 'new_program':
      return '🏕️';
    case 'promotion':
      return '🎉';
    case 'booking_new':
      return '📅';
    case 'booking_confirmed':
      return '✅';
    case 'booking_cancelled':
      return '❌';
    case 'review_request':
      return '⭐';
    case 'review_received':
      return '⭐';
    case 'group_joined':
      return '👥';
    default:
      return '🔔';
  }
};

interface NotificationItemComponentProps {
  notification: NotificationItem;
  onPress: () => void;
}

const NotificationItemComponent: React.FC<NotificationItemComponentProps> = ({
  notification,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.isRead && styles.unreadNotification,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <PTPText style={styles.icon}>
          {getNotificationIcon(notification.type)}
        </PTPText>
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <PTPText
            variant="buttonMedium"
            numberOfLines={1}
            style={styles.title}
          >
            {notification.title}
          </PTPText>
          <PTPText variant="caption" color="gray400">
            {formatRelativeTime(notification.createdAt)}
          </PTPText>
        </View>
        <PTPText
          variant="body"
          color="gray600"
          numberOfLines={2}
        >
          {notification.message}
        </PTPText>
      </View>
      {!notification.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
};

/**
 * NotificationCenterScreen - Notification history list
 */
const NotificationCenterScreen: React.FC = () => {
  const navigation = useNavigation<NotificationCenterNavigationProp>();
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationContext();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications(1, 50),
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
    },
  });

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleNotificationPress = (notification: NotificationItem) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type and data
    const notifData = notification.data;
    if (!notifData) return;

    if (notifData.conversationId) {
      navigation.navigate('ConversationDetail', {
        conversationId: notifData.conversationId as number,
      });
    } else if (notifData.programId) {
      navigation.navigate('ProgramDetail', {
        programId: String(notifData.programId),
      });
    } else if (notifData.sessionId || notifData.booking_id) {
      // For session-related notifications, go to schedule
      navigation.navigate('ParentTabs', { screen: 'Schedule' } as any);
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const unreadCount = data?.notifications.filter((n) => !n.isRead).length || 0;

  if (isLoading) {
    return <PTPLoading message="Loading notifications..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header with mark all read button */}
      {unreadCount > 0 && (
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={handleMarkAllRead}
            disabled={markAllReadMutation.isPending}
          >
            <PTPText variant="label" color="primary">
              Mark all as read
            </PTPText>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={data?.notifications || []}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationItemComponent
            notification={item}
            onPress={() => handleNotificationPress(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <PTPEmptyState
            icon="🔔"
            title="No Notifications"
            description="You're all caught up! Notifications about your sessions and messages will appear here."
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
    backgroundColor: colors.white,
  },
  listContent: {
    flexGrow: 1,
    paddingTop: spacing[2],
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
    backgroundColor: colors.white,
    marginHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  unreadNotification: {
    backgroundColor: colors.primaryLight,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  title: {
    flex: 1,
    marginRight: spacing[2],
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing[2],
    marginTop: spacing[1],
  },
  separator: {
    height: spacing[2],
  },
});

export default NotificationCenterScreen;
