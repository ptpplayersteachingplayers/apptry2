/**
 * Schedule Screen (Parent)
 *
 * Calendar view of upcoming camps, clinics, and training sessions.
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { ScheduleEvent, EventsByDate } from '../../types';
import { getMyEvents, groupEventsByDate } from '../../api/events';
import {
  PTPText,
  PTPTag,
  PTPListSkeleton,
  PTPButton,
  NoSessionsEmptyState,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type ScheduleNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

type ViewMode = 'upcoming' | 'all';

/**
 * ScheduleScreen - View upcoming events
 */
const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleNavigationProp>();

  const [groupedEvents, setGroupedEvents] = useState<EventsByDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setError(null);
    try {
      const response = await getMyEvents();
      const grouped = groupEventsByDate(response.events || []);
      setGroupedEvents(grouped);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Unable to load your schedule. Please try again.');
      setGroupedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

  // Calculate event stats
  const eventStats = useMemo(() => {
    let totalEvents = 0;
    let todayEvents = 0;
    let thisWeekEvents = 0;

    groupedEvents.forEach((group) => {
      totalEvents += group.events.length;
      if (group.isToday) {
        todayEvents += group.events.length;
      }
      // Simple "this week" check - events within next 7 days
      const groupDate = new Date(group.date);
      const today = new Date();
      const diffDays = Math.ceil((groupDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        thisWeekEvents += group.events.length;
      }
    });

    return { totalEvents, todayEvents, thisWeekEvents };
  }, [groupedEvents]);

  const getEventTypeColor = (type: string): string => {
    switch (type) {
      case 'camp':
        return colors.primary;
      case 'clinic':
        return colors.info;
      case 'training':
        return colors.success;
      default:
        return colors.gray500;
    }
  };

  const getEventTypeLabel = (type: string): string => {
    switch (type) {
      case 'camp':
        return 'Camp';
      case 'clinic':
        return 'Clinic';
      case 'training':
        return 'Training';
      default:
        return type;
    }
  };

  const getEventTypeVariant = (type: string): 'primary' | 'success' | 'info' | 'default' => {
    switch (type) {
      case 'camp':
        return 'primary';
      case 'training':
        return 'success';
      case 'clinic':
        return 'info';
      default:
        return 'default';
    }
  };

  const renderEventCard = (event: ScheduleEvent) => (
    <TouchableOpacity
      key={event.id}
      style={styles.eventCard}
      onPress={() => {
        if (event.programId) {
          navigation.navigate('ProgramDetail', { programId: event.programId });
        }
      }}
      accessibilityLabel={`${event.title} on ${event.date} at ${event.startTime}`}
    >
      <View style={[styles.eventTypeIndicator, { backgroundColor: getEventTypeColor(event.type) }]} />
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <PTPTag
            label={getEventTypeLabel(event.type)}
            variant={getEventTypeVariant(event.type)}
            size="small"
          />
          <PTPText variant="caption" color="gray500">
            {event.startTime || 'TBD'} {event.endTime ? `- ${event.endTime}` : ''}
          </PTPText>
        </View>
        <PTPText variant="cardTitle" style={styles.eventTitle} numberOfLines={2}>
          {event.title || 'Upcoming Event'}
        </PTPText>
        <View style={styles.eventDetails}>
          <View style={styles.eventDetailRow}>
            <Ionicons name="location-outline" size={14} color={colors.gray400} />
            <PTPText variant="bodySmall" color="gray500" numberOfLines={1}>
              {event.location || 'Location TBD'}
            </PTPText>
          </View>
          {event.childName && (
            <View style={styles.eventDetailRow}>
              <Ionicons name="person-outline" size={14} color={colors.gray400} />
              <PTPText variant="caption" color="gray400">
                {event.childName}
              </PTPText>
            </View>
          )}
        </View>
      </View>
      <View style={styles.eventArrow}>
        <Ionicons name="chevron-forward" size={20} color={colors.gray300} />
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="heroTitle">My Schedule</PTPText>
          <PTPText variant="body" color="gray500">
            Loading your events...
          </PTPText>
        </View>
        <View style={styles.loadingContainer}>
          <PTPListSkeleton count={4} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="heroTitle">My Schedule</PTPText>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="calendar-outline" size={48} color={colors.gray400} />
          <PTPText variant="body" color="gray500" style={styles.errorText}>
            {error}
          </PTPText>
          <PTPButton
            title="Try Again"
            variant="primary"
            onPress={loadEvents}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PTPText variant="heroTitle">My Schedule</PTPText>
        <PTPText variant="body" color="gray500">
          Upcoming camps, clinics, and training
        </PTPText>
      </View>

      {/* Stats Bar */}
      {groupedEvents.length > 0 && (
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle" color="primary">
              {eventStats.todayEvents}
            </PTPText>
            <PTPText variant="caption" color="gray500">Today</PTPText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle" color="primary">
              {eventStats.thisWeekEvents}
            </PTPText>
            <PTPText variant="caption" color="gray500">This Week</PTPText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle" color="primary">
              {eventStats.totalEvents}
            </PTPText>
            <PTPText variant="caption" color="gray500">Total</PTPText>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {groupedEvents.length === 0 ? (
          <NoSessionsEmptyState
            onAction={() => navigation.navigate('ParentTabs', { screen: 'CampsClinics' })}
          />
        ) : (
          <>
            {groupedEvents.map((group) => (
              <View key={group.date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  {group.isToday && (
                    <View style={styles.todayBadge}>
                      <PTPText variant="caption" color="white" weight="semiBold">
                        TODAY
                      </PTPText>
                    </View>
                  )}
                  <PTPText
                    variant="label"
                    color={group.isToday ? 'inkBlack' : 'gray500'}
                  >
                    {group.isToday ? '' : group.dateFormatted.toUpperCase()}
                  </PTPText>
                  <PTPText variant="caption" color="gray400">
                    {group.events.length} event{group.events.length !== 1 ? 's' : ''}
                  </PTPText>
                </View>
                {group.events.map(renderEventCard)}
              </View>
            ))}

            {/* Upsell for private training */}
            <View style={styles.upsellCard}>
              <View style={styles.upsellIcon}>
                <Ionicons name="fitness-outline" size={32} color={colors.primary} />
              </View>
              <PTPText variant="sectionTitle">Keep the momentum going!</PTPText>
              <PTPText variant="body" color="gray500" style={styles.upsellText}>
                Book private training to continue building on what you learn in camps and clinics.
              </PTPText>
              <PTPButton
                title="Find a Trainer"
                variant="outline"
                size="medium"
                rightIcon={<Ionicons name="arrow-forward" size={16} color={colors.inkBlack} />}
                onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[2],
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.blackCard,
    marginHorizontal: spacing[4],
    marginBottom: spacing[4],
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
    padding: spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 2,
    backgroundColor: colors.gray700,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing[4],
    paddingTop: 0,
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    padding: spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    textAlign: 'center',
    marginVertical: spacing[4],
  },
  dateGroup: {
    marginBottom: spacing[6],
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[3],
    gap: spacing[2],
  },
  todayBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: 0,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  eventTypeIndicator: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: spacing[4],
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  eventTitle: {
    marginBottom: spacing[2],
  },
  eventDetails: {
    gap: spacing[1],
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  eventArrow: {
    justifyContent: 'center',
    paddingRight: spacing[3],
  },
  upsellCard: {
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    padding: spacing[5],
    marginTop: spacing[4],
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  upsellIcon: {
    width: 64,
    height: 64,
    borderRadius: 0,
    backgroundColor: colors.blackLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  upsellText: {
    marginTop: spacing[2],
    marginBottom: spacing[4],
    textAlign: 'center',
  },
});

export default ScheduleScreen;
