/**
 * Camps & Clinics Screen (Parent)
 *
 * Full-featured camp discovery with:
 * - ZIP code search with geolocation
 * - State-based filtering with camp counts
 * - Type filters (camps, clinics)
 * - Horizontal scrollable camp cards
 * - Featured/Popular/Sold Out tags
 * - Sale prices and urgency indicators
 */

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { Program, ProgramType, AppStats } from '../../types';
import { getPrograms, getMarkets } from '../../api/programs';
import { getAvailableStates, getAppStats } from '../../api/content';
import { useAppStore, useCartStore } from '../../stores';
import {
  PTPText,
  PTPButton,
  PTPHero,
  PTPListSkeleton,
  NoProgramsEmptyState,
  AnimatedPressable,
  FadeInView,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import { featureImages } from '../../assets/media';
import { formatDateShort, formatPrice, formatLocation } from '../../lib/formatting';
import { useHaptics } from '../../hooks';

type CampsClinicsNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type CampsClinicsRouteProp = RouteProp<ParentTabParamList, 'Camps'>;

type FilterType = 'all' | 'clinic' | 'camp';

interface StateInfo {
  stateCode: string;
  name: string;
  campCount: number;
}

/**
 * CampsClinicsScreen - Full-featured camp discovery
 */
const CampsClinicsScreen: React.FC = () => {
  const navigation = useNavigation<CampsClinicsNavigationProp>();
  const route = useRoute<CampsClinicsRouteProp>();
  const { selection, success } = useHaptics();
  const { userLocation, setUserLocation } = useAppStore();
  const cartItemCount = useCartStore((state) => state.getItemCount());

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>((route.params?.filter as FilterType) || 'all');
  const [zipCode, setZipCode] = useState(userLocation?.zipCode || '');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [states, setStates] = useState<StateInfo[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const zipInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Reload when filters change
  useEffect(() => {
    if (!isLoading) {
      loadPrograms();
    }
  }, [filter, selectedState, zipCode]);

  // Fade in animation
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadInitialData = async () => {
    try {
      const [statesData, statsData] = await Promise.all([
        getAvailableStates(),
        getAppStats(),
      ]);
      setStates(statesData);
      setStats(statsData);
      await loadPrograms();
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Unable to load data');
    }
  };

  const loadPrograms = async () => {
    setError(null);
    try {
      const typeFilter = filter === 'all' ? undefined : filter;
      const response = await getPrograms({
        type: typeFilter as ProgramType,
        state: selectedState || undefined,
      });
      setPrograms(response.programs || []);
    } catch (err) {
      console.error('Error loading programs:', err);
      setError('Unable to load programs');
      setPrograms([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPrograms();
    setIsRefreshing(false);
    success();
  };

  const handleUseMyLocation = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission',
          'Please enable location access to find camps near you.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address?.postalCode) {
        setZipCode(address.postalCode);
        setUserLocation({
          zipCode: address.postalCode,
          city: address.city || undefined,
          state: address.region || undefined,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        success();
      }
    } catch (err) {
      console.error('Error getting location:', err);
      Alert.alert('Location Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleStateSelect = (stateCode: string) => {
    selection();
    if (selectedState === stateCode) {
      setSelectedState(null);
    } else {
      setSelectedState(stateCode);
    }
  };

  const handleZipSearch = () => {
    selection();
    // Update user location with ZIP
    if (zipCode) {
      setUserLocation({
        zipCode,
        city: undefined,
        state: undefined,
      });
      loadPrograms();
    }
  };

  const navigateToProgram = useCallback((programId: number) => {
    selection();
    navigation.navigate('ProgramDetail', { programId });
  }, [navigation, selection]);

  // Filter programs by ZIP code if entered
  const filteredPrograms = useMemo(() => {
    if (!zipCode) return programs;
    // In production, this would use distance calculation
    // For now, just filter by state if ZIP is from a known state
    return programs;
  }, [programs, zipCode]);

  // Separate featured and regular programs
  const featuredPrograms = filteredPrograms.filter(p => p.bestseller);
  const regularPrograms = filteredPrograms;

  const renderProgramCard = useCallback(
    ({ item, horizontal = false }: { item: Program; horizontal?: boolean }) => {
      const isSoldOut = item.stockStatus === 'outofstock' || item.stock === 0;
      const hasDiscount = item.salePrice && item.salePrice < item.price;

      return (
        <AnimatedPressable
          style={[styles.programCard, horizontal && styles.horizontalCard]}
          onPress={() => navigateToProgram(item.id)}
        >
          {/* Image with badges */}
          <View style={styles.cardImageContainer}>
            <Animated.Image
              source={{ uri: item.mainImageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
            {/* Date badge */}
            <View style={styles.dateBadge}>
              <PTPText variant="caption" color="white" style={styles.dateBadgeText}>
                {formatDateShort(item.date)}
              </PTPText>
            </View>
            {/* Status tags */}
            <View style={styles.statusTags}>
              {item.bestseller && (
                <View style={[styles.statusTag, styles.featuredTag]}>
                  <PTPText variant="caption" style={styles.statusTagText}>FEATURED</PTPText>
                </View>
              )}
              {item.almostFull && !isSoldOut && (
                <View style={[styles.statusTag, styles.popularTag]}>
                  <PTPText variant="caption" style={styles.statusTagText}>ALMOST FULL</PTPText>
                </View>
              )}
              {isSoldOut && (
                <View style={[styles.statusTag, styles.soldOutTag]}>
                  <PTPText variant="caption" style={styles.statusTagText}>SOLD OUT</PTPText>
                </View>
              )}
            </View>
          </View>

          {/* Card content */}
          <View style={styles.cardContent}>
            <PTPText variant="sectionTitle" numberOfLines={2} style={styles.cardTitle}>
              {item.title}
            </PTPText>
            <View style={styles.cardMeta}>
              <Ionicons name="location-outline" size={14} color={colors.gray400} />
              <PTPText variant="caption" color="gray400" numberOfLines={1}>
                {formatLocation(item.city, item.state)}
              </PTPText>
            </View>
            <View style={styles.cardMeta}>
              <Ionicons name="people-outline" size={14} color={colors.gray400} />
              <PTPText variant="caption" color="gray400">
                Ages {item.ageBands?.join(', ') || 'All ages'}
              </PTPText>
            </View>

            {/* Price and CTA */}
            <View style={styles.cardFooter}>
              <View style={styles.priceContainer}>
                {hasDiscount && (
                  <PTPText variant="caption" color="gray500" style={styles.originalPrice}>
                    ${item.price}
                  </PTPText>
                )}
                <PTPText variant="sectionTitle" color="primary">
                  {formatPrice(item.salePrice || item.price)}
                </PTPText>
              </View>
              <TouchableOpacity
                style={[styles.registerButton, isSoldOut && styles.registerButtonDisabled]}
                onPress={() => navigateToProgram(item.id)}
                disabled={isSoldOut}
              >
                <PTPText variant="label" color={isSoldOut ? 'gray500' : 'inkBlack'}>
                  {isSoldOut ? 'WAITLIST' : 'REGISTER'}
                </PTPText>
              </TouchableOpacity>
            </View>
          </View>
        </AnimatedPressable>
      );
    },
    [navigateToProgram]
  );

  const ListHeader = () => (
    <Animated.View style={{ opacity: fadeAnim }}>
      {/* Hero with stats */}
      <PTPHero
        imageUrl={featureImages.campsHero}
        height={280}
      >
        <View style={styles.heroContent}>
          <PTPText variant="heroTitle" color="white" style={styles.heroTitle}>
            FIND A CAMP
          </PTPText>
          <PTPText variant="heroSubtitle" color="gray300">
            Train with NCAA mentors near you
          </PTPText>

          {/* Stats row */}
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <PTPText variant="heroTitle" color="primary">{stats.totalCamps}</PTPText>
                <PTPText variant="caption" color="gray400">Camps</PTPText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <PTPText variant="heroTitle" color="primary">{stats.playerToCoachRatio}</PTPText>
                <PTPText variant="caption" color="gray400">Ratio</PTPText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <PTPText variant="heroTitle" color="primary">{stats.averageRating}★</PTPText>
                <PTPText variant="caption" color="gray400">Rating</PTPText>
              </View>
            </View>
          )}
        </View>
      </PTPHero>

      {/* ZIP Code Search */}
      <View style={styles.searchSection}>
        <View style={styles.zipSearchContainer}>
          <View style={styles.zipInputContainer}>
            <Ionicons name="search" size={20} color={colors.gray500} />
            <TextInput
              ref={zipInputRef}
              style={styles.zipInput}
              placeholder="Enter ZIP code"
              placeholderTextColor={colors.gray500}
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="number-pad"
              maxLength={5}
              returnKeyType="search"
              onSubmitEditing={handleZipSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleUseMyLocation}
            disabled={isLocating}
          >
            <Ionicons
              name={isLocating ? 'hourglass' : 'locate'}
              size={20}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* State Filter Tabs */}
      <View style={styles.stateSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stateTabs}
        >
          {states.map((state) => (
            <TouchableOpacity
              key={state.stateCode}
              style={[
                styles.stateTab,
                selectedState === state.stateCode && styles.stateTabActive,
              ]}
              onPress={() => handleStateSelect(state.stateCode)}
            >
              <PTPText
                variant="label"
                color={selectedState === state.stateCode ? 'inkBlack' : 'white'}
              >
                {state.stateCode}
              </PTPText>
              <View style={[
                styles.stateCount,
                selectedState === state.stateCode && styles.stateCountActive,
              ]}>
                <PTPText
                  variant="caption"
                  color={selectedState === state.stateCode ? 'primary' : 'gray400'}
                  style={styles.stateCountText}
                >
                  {state.campCount}
                </PTPText>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Type Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterTabs}>
          {(['all', 'clinic', 'camp'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filter === type && styles.filterTabActive]}
              onPress={() => {
                selection();
                setFilter(type);
              }}
            >
              <PTPText
                variant="label"
                color={filter === type ? 'inkBlack' : 'gray500'}
              >
                {type === 'all' ? 'ALL' : type === 'clinic' ? 'CLINICS' : 'CAMPS'}
              </PTPText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results count */}
        <PTPText variant="caption" color="gray500" style={styles.resultsCount}>
          {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found
          {selectedState && ` in ${selectedState}`}
        </PTPText>
      </View>

      {/* Featured Programs Carousel (if any) */}
      {featuredPrograms.length > 0 && (
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <PTPText variant="sectionTitle">FEATURED</PTPText>
            <Ionicons name="star" size={16} color={colors.primary} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featuredPrograms.map((program) => (
              <View key={program.id}>
                {renderProgramCard({ item: program, horizontal: true })}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* All Programs Header */}
      <View style={styles.allProgramsHeader}>
        <PTPText variant="sectionTitle">ALL PROGRAMS</PTPText>
      </View>
    </Animated.View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ListHeader />
        <View style={styles.loadingContainer}>
          <PTPListSkeleton count={3} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={regularPrograms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => renderProgramCard({ item })}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <NoProgramsEmptyState
              onAction={() => {
                setSelectedState(null);
                setFilter('all');
                setZipCode('');
              }}
            />
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Cart Badge */}
      {cartItemCount > 0 && (
        <TouchableOpacity
          style={styles.cartBadge}
          onPress={() => navigation.navigate('Cart' as any)}
        >
          <Ionicons name="cart" size={24} color={colors.black} />
          <View style={styles.cartCount}>
            <PTPText variant="caption" color="white" style={styles.cartCountText}>
              {cartItemCount}
            </PTPText>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  heroContent: {
    alignItems: 'center',
    paddingTop: spacing[8],
  },
  heroTitle: {
    marginBottom: spacing[2],
    letterSpacing: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[4],
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: 0,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing[4],
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.gray600,
  },
  searchSection: {
    padding: spacing[4],
    backgroundColor: colors.black,
  },
  zipSearchContainer: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  zipInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    paddingHorizontal: spacing[3],
    gap: spacing[2],
  },
  zipInput: {
    flex: 1,
    color: colors.white,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? spacing[3] : spacing[2],
  },
  locationButton: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: spacing[3],
    justifyContent: 'center',
    alignItems: 'center',
  },
  stateSection: {
    paddingBottom: spacing[3],
  },
  stateTabs: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  stateTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  stateTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stateCount: {
    backgroundColor: colors.gray800,
    borderRadius: 10,
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  stateCountActive: {
    backgroundColor: colors.black,
  },
  stateCountText: {
    fontSize: 10,
  },
  filtersContainer: {
    padding: spacing[4],
    paddingTop: 0,
    backgroundColor: colors.black,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  filterTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  resultsCount: {
    marginTop: spacing[1],
  },
  featuredSection: {
    paddingTop: spacing[2],
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  featuredScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  allProgramsHeader: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  loadingContainer: {
    padding: spacing[4],
  },
  emptyContainer: {
    padding: spacing[4],
    minHeight: 300,
  },
  programCard: {
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    overflow: 'hidden',
  },
  horizontalCard: {
    width: 300,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  cardImageContainer: {
    height: 160,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  dateBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTags: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    gap: spacing[1],
  },
  statusTag: {
    paddingHorizontal: spacing[2],
    paddingVertical: 2,
  },
  featuredTag: {
    backgroundColor: colors.primary,
  },
  popularTag: {
    backgroundColor: colors.error,
  },
  soldOutTag: {
    backgroundColor: colors.gray600,
  },
  statusTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.black,
  },
  cardContent: {
    padding: spacing[3],
  },
  cardTitle: {
    marginBottom: spacing[2],
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[1],
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.gray700,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  originalPrice: {
    textDecorationLine: 'line-through',
  },
  registerButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
  },
  registerButtonDisabled: {
    backgroundColor: colors.gray700,
  },
  cartBadge: {
    position: 'absolute',
    bottom: spacing[6],
    right: spacing[4],
    backgroundColor: colors.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cartCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCountText: {
    fontSize: 11,
    fontWeight: '700',
  },
});

export default CampsClinicsScreen;
