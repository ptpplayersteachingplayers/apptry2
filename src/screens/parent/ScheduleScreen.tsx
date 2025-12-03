/**
 * Schedule Screen (Parent)
 *
 * Calendar view of upcoming camps, clinics, and training sessions.
 */

import React, { useEffect, useState } from 'react';
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
import { ParentStackParamList } from '../../types/navigation';
import { ScheduleEvent, EventsByDate } from '../../types';
import { getMyEvents, groupEventsByDate } from '../../api/events';
import {
  PTPText,
  PTPTag,
  PTPListSkeleton,
  NoSessionsEmptyState,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type ScheduleNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * ScheduleScreen - View upcoming events
 */
const ScheduleScreen: React.FC = () => {
  const navigation = useNavigation<ScheduleNavigationProp>();

  const [groupedEvents, setGroupedEvents] = useState<EventsByDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const response = await getMyEvents();
      const grouped = groupEventsByDate(response.events);
      setGroupedEvents(grouped);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };

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
            variant={event.type === 'camp' ? 'primary' : event.type === 'training' ? 'success' : 'info'}
            size="small"
          />
          <PTPText variant="caption" color="gray500">
            {event.startTime} - {event.endTime}
          </PTPText>
        </View>
        <PTPText variant="cardTitle" style={styles.eventTitle}>
          {event.title}
        </PTPText>
        <PTPText variant="bodySmall" color="gray500">
          {event.location}
        </PTPText>
        {event.childName && (
          <PTPText variant="caption" color="gray400" style={styles.childName}>
            For: {event.childName}
          </PTPText>
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="heroTitle">My Schedule</PTPText>
        </View>
        <View style={styles.loadingContainer}>
          <PTPListSkeleton count={3} />
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
          groupedEvents.map((group) => (
            <View key={group.date} style={styles.dateGroup}>
              <View style={styles.dateHeader}>
                <PTPText variant="label" color={group.isToday ? 'primary' : 'gray500'}>
                  {group.isToday ? 'TODAY' : group.dateFormatted.toUpperCase()}
                </PTPText>
              </View>
              {group.events.map(renderEventCard)}
            </View>
          ))
        )}

        {/* Upsell for private training */}
        {groupedEvents.length > 0 && (
          <View style={styles.upsellCard}>
            <PTPText variant="sectionTitle">Keep the momentum going!</PTPText>
            <PTPText variant="body" color="gray500" style={styles.upsellText}>
              Book private training to continue building on what you learn in camps and clinics.
            </PTPText>
            <TouchableOpacity
              style={styles.upsellButton}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
            >
              <PTPText variant="buttonMedium" color="primary">
                Find a Trainer →
              </PTPText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
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
  dateGroup: {
    marginBottom: spacing[6],
  },
  dateHeader: {
    marginBottom: spacing[3],
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...shadows.sm,
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
    marginBottom: spacing[1],
  },
  childName: {
    marginTop: spacing[2],
  },
  upsellCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginTop: spacing[4],
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  upsellText: {
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  upsellButton: {
    alignSelf: 'flex-start',
  },
});

export default ScheduleScreen;
