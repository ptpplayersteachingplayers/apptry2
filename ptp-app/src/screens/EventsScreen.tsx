import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { EventWithAvailability, Market } from '../types/database';

type ProgramFilter = 'all' | 'winter_clinic' | 'summer_camp';

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<EventWithAvailability[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [programFilter, setProgramFilter] = useState<ProgramFilter>('all');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [marketFilter, setMarketFilter] = useState<string>('all');

  const states = ['all', 'PA', 'NJ', 'DE', 'MD', 'NY'];

  const fetchMarkets = useCallback(async () => {
    const { data } = await supabase
      .from('markets')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    setMarkets(data || []);
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      let query = supabase
        .from('events_with_availability')
        .select('*')
        .eq('is_published', true)
        .gte('start_date', new Date().toISOString().split('T')[0])
        .order('start_date', { ascending: true });

      if (programFilter !== 'all') {
        query = query.eq('program', programFilter);
      }
      if (stateFilter !== 'all') {
        query = query.eq('state', stateFilter);
      }
      if (marketFilter !== 'all') {
        query = query.eq('market_slug', marketFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [programFilter, stateFilter, marketFilter]);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  useEffect(() => {
    setIsLoading(true);
    fetchEvents();
  }, [fetchEvents]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string): string => {
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getProgramBadge = (program: string) => {
    const isWinter = program === 'winter_clinic';
    return {
      label: isWinter ? 'Winter Clinic' : 'Summer Camp',
      color: isWinter ? '#3b82f6' : '#f59e0b',
    };
  };

  const filteredMarkets = stateFilter === 'all'
    ? markets
    : markets.filter(m => m.state === stateFilter);

  const renderEvent = ({ item }: { item: EventWithAvailability }) => {
    const badge = getProgramBadge(item.program);
    const market = markets.find(m => m.slug === item.market_slug);

    return (
      <TouchableOpacity
        style={styles.eventCard}
        onPress={() => router.push(`/event/${item.id}` as any)}
      >
        <View style={styles.eventHeader}>
          <View style={[styles.badge, { backgroundColor: badge.color }]}>
            <Text style={styles.badgeText}>{badge.label}</Text>
          </View>
          {item.is_bestseller && (
            <View style={[styles.badge, styles.bestsellerBadge]}>
              <Text style={styles.badgeText}>Bestseller</Text>
            </View>
          )}
          {item.computed_almost_full && !item.is_sold_out && (
            <View style={[styles.badge, styles.almostFullBadge]}>
              <Text style={styles.badgeText}>Almost Full</Text>
            </View>
          )}
        </View>

        <Text style={styles.eventTitle}>{item.title}</Text>

        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatDate(item.start_date)}
              {item.end_date && item.end_date !== item.start_date && ` - ${formatDate(item.end_date)}`}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {formatTime(item.start_time)} - {formatTime(item.end_time)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={16} color="#6b7280" />
            <Text style={styles.detailText}>
              {market?.display_name || item.market_slug}, {item.state}
            </Text>
          </View>
        </View>

        <View style={styles.eventFooter}>
          <View style={styles.availability}>
            {item.is_sold_out ? (
              <Text style={styles.soldOut}>Sold Out</Text>
            ) : (
              <Text style={styles.seatsLeft}>
                {item.seats_left} spots left
              </Text>
            )}
          </View>
          {item.price_cents && (
            <Text style={styles.price}>
              ${(item.price_cents / 100).toFixed(0)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Filters */}
      <View style={styles.filters}>
        {/* Program Filter */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, programFilter === 'all' && styles.filterChipActive]}
            onPress={() => setProgramFilter('all')}
          >
            <Text style={[styles.filterChipText, programFilter === 'all' && styles.filterChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, programFilter === 'winter_clinic' && styles.filterChipActive]}
            onPress={() => setProgramFilter('winter_clinic')}
          >
            <Text style={[styles.filterChipText, programFilter === 'winter_clinic' && styles.filterChipTextActive]}>
              Winter Clinics
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, programFilter === 'summer_camp' && styles.filterChipActive]}
            onPress={() => setProgramFilter('summer_camp')}
          >
            <Text style={[styles.filterChipText, programFilter === 'summer_camp' && styles.filterChipTextActive]}>
              Summer Camps
            </Text>
          </TouchableOpacity>
        </View>

        {/* State Filter */}
        <View style={styles.filterRow}>
          {states.map((state) => (
            <TouchableOpacity
              key={state}
              style={[styles.stateChip, stateFilter === state && styles.stateChipActive]}
              onPress={() => {
                setStateFilter(state);
                setMarketFilter('all');
              }}
            >
              <Text style={[styles.stateChipText, stateFilter === state && styles.stateChipTextActive]}>
                {state === 'all' ? 'All States' : state}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Market Filter */}
        {stateFilter !== 'all' && filteredMarkets.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.marketChip, marketFilter === 'all' && styles.marketChipActive]}
              onPress={() => setMarketFilter('all')}
            >
              <Text style={[styles.marketChipText, marketFilter === 'all' && styles.marketChipTextActive]}>
                All {stateFilter}
              </Text>
            </TouchableOpacity>
            {filteredMarkets.map((market) => (
              <TouchableOpacity
                key={market.slug}
                style={[styles.marketChip, marketFilter === market.slug && styles.marketChipActive]}
                onPress={() => setMarketFilter(market.slug)}
              >
                <Text style={[styles.marketChipText, marketFilter === market.slug && styles.marketChipTextActive]}>
                  {market.display_name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Events List */}
      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#1a365d" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No events found</Text>
              <Text style={styles.emptyText}>
                Try adjusting your filters or check back later
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filters: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    marginRight: 8,
    marginBottom: 4,
  },
  filterChipActive: {
    backgroundColor: '#1a365d',
  },
  filterChipText: {
    fontSize: 13,
    color: '#6b7280',
  },
  filterChipTextActive: {
    color: '#fff',
  },
  stateChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    marginRight: 6,
  },
  stateChipActive: {
    backgroundColor: '#1a365d',
  },
  stateChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  stateChipTextActive: {
    color: '#fff',
  },
  marketChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginRight: 6,
    marginBottom: 4,
  },
  marketChipActive: {
    backgroundColor: '#1a365d',
    borderColor: '#1a365d',
  },
  marketChipText: {
    fontSize: 12,
    color: '#6b7280',
  },
  marketChipTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  bestsellerBadge: {
    backgroundColor: '#10b981',
  },
  almostFullBadge: {
    backgroundColor: '#ef4444',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  eventFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  availability: {},
  seatsLeft: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '500',
  },
  soldOut: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
  },
});
