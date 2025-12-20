/**
 * Private Training Screen (Parent)
 *
 * Browse and filter trainers for private 1-on-1 sessions.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { TrainerUser } from '../../types';
import { getTrainers } from '../../api/training';
import {
  PTPText,
  PTPSearchInput,
  PTPTag,
  PTPHero,
  PTPListSkeleton,
  PTPEmptyState,
  PTPButton,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

type PrivateTrainingNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type PrivateTrainingRouteProp = RouteProp<ParentTabParamList, 'PrivateTraining'>;

type SortOption = 'rating' | 'price_low' | 'price_high' | 'name';

const SPECIALTY_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'ball-mastery', label: 'Ball Mastery' },
  { key: 'finishing', label: 'Finishing' },
  { key: '1v1', label: '1v1 Moves' },
  { key: 'defending', label: 'Defending' },
  { key: 'goalkeeper', label: 'Goalkeeper' },
];

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'rating', label: 'Top Rated' },
  { key: 'price_low', label: 'Price: Low to High' },
  { key: 'price_high', label: 'Price: High to Low' },
  { key: 'name', label: 'Name A-Z' },
];

/**
 * PrivateTrainingScreen - Browse trainers
 */
const PrivateTrainingScreen: React.FC = () => {
  const navigation = useNavigation<PrivateTrainingNavigationProp>();
  const route = useRoute<PrivateTrainingRouteProp>();

  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('rating');
  const [showSortOptions, setShowSortOptions] = useState(false);

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    setError(null);
    try {
      const response = await getTrainers();
      setTrainers(response.trainers || []);
    } catch (err) {
      console.error('Error loading trainers:', err);
      setError('Unable to load trainers. Please try again.');
      setTrainers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrainers();
    setIsRefreshing(false);
  };

  // Filter and sort trainers
  const filteredTrainers = useMemo(() => {
    let result = trainers.filter((trainer) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          (trainer.firstName?.toLowerCase() || '').includes(query) ||
          (trainer.lastName?.toLowerCase() || '').includes(query) ||
          (trainer.collegePro?.toLowerCase() || '').includes(query) ||
          trainer.specialties?.some((s) => s.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      // Specialty filter
      if (selectedSpecialty !== 'all') {
        if (!trainer.specialties?.some((s) => s.toLowerCase().includes(selectedSpecialty))) {
          return false;
        }
      }

      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'price_low':
          return (a.hourlyRate || 0) - (b.hourlyRate || 0);
        case 'price_high':
          return (b.hourlyRate || 0) - (a.hourlyRate || 0);
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        default:
          return 0;
      }
    });

    return result;
  }, [trainers, searchQuery, selectedSpecialty, sortBy]);

  const renderTrainer = useCallback(
    ({ item }: { item: TrainerUser }) => (
      <TouchableOpacity
        style={styles.trainerCard}
        onPress={() => navigation.navigate('TrainerDetail', { trainerId: item.id })}
        accessibilityLabel={`View ${item.firstName} ${item.lastName}'s profile`}
      >
        <Image
          source={{ uri: item.headshotUrl || featureImages.trainerProfile }}
          style={styles.trainerImage}
          resizeMode="cover"
        />
        <View style={styles.trainerInfo}>
          <View style={styles.trainerHeader}>
            <View style={styles.trainerName}>
              <PTPText variant="cardTitle">
                {item.firstName || ''} {item.lastName || ''}
              </PTPText>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.verifiedBadge} />
              )}
            </View>
            <View style={styles.trainerPrice}>
              <PTPText variant="cardTitle" color="primary">
                ${item.hourlyRate || 0}
              </PTPText>
              <PTPText variant="caption" color="gray500">/hr</PTPText>
            </View>
          </View>

          <PTPText variant="bodySmall" color="gray500" style={styles.trainerTagline}>
            {item.collegePro || 'College Athlete'} {item.position ? `• ${item.position}` : ''}
          </PTPText>

          <View style={styles.trainerSpecialties}>
            {(item.specialties || []).slice(0, 3).map((specialty) => (
              <PTPTag
                key={specialty}
                label={specialty.replace(/-/g, ' ')}
                size="small"
              />
            ))}
          </View>

          {item.rating != null && item.rating > 0 && (
            <View style={styles.trainerRating}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <PTPText variant="bodySmall" color="primary">
                {item.rating.toFixed(1)}
              </PTPText>
              <PTPText variant="caption" color="gray500">
                ({item.reviewCount || 0} reviews)
              </PTPText>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
    [navigation]
  );

  const ListHeader = () => (
    <>
      {/* Hero */}
      <PTPHero
        imageUrl={featureImages.trainingHero}
        title="Private Training"
        subtitle="1-on-1 with NCAA mentors. Personalized. Flexible."
        height={220}
      />

      {/* Search and Filters */}
      <View style={styles.searchContainer}>
        <PTPSearchInput
          placeholder="Search by name, school, or specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        {/* Specialty Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {SPECIALTY_FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterPill,
                selectedSpecialty === filter.key && styles.filterPillActive,
              ]}
              onPress={() => setSelectedSpecialty(filter.key)}
            >
              <PTPText
                variant="caption"
                color={selectedSpecialty === filter.key ? 'inkBlack' : 'gray500'}
                weight={selectedSpecialty === filter.key ? 'semiBold' : 'regular'}
              >
                {filter.label}
              </PTPText>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort and Results */}
        <View style={styles.sortRow}>
          <PTPText variant="caption" color="gray500">
            {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''} available
          </PTPText>
          <TouchableOpacity
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="swap-vertical" size={16} color={colors.gray500} />
            <PTPText variant="caption" color="gray500">
              {SORT_OPTIONS.find((o) => o.key === sortBy)?.label}
            </PTPText>
          </TouchableOpacity>
        </View>

        {/* Sort Options Dropdown */}
        {showSortOptions && (
          <View style={styles.sortDropdown}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  sortBy === option.key && styles.sortOptionActive,
                ]}
                onPress={() => {
                  setSortBy(option.key);
                  setShowSortOptions(false);
                }}
              >
                <PTPText
                  variant="bodySmall"
                  color={sortBy === option.key ? 'primary' : 'gray600'}
                >
                  {option.label}
                </PTPText>
                {sortBy === option.key && (
                  <Ionicons name="checkmark" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
          </View>
          <View style={styles.infoContent}>
            <PTPText variant="bodySmall" weight="semiBold">
              How it works
            </PTPText>
            <PTPText variant="caption" color="gray500">
              Browse trainers, request a session, and our team will help finalize the booking.
            </PTPText>
          </View>
        </View>
      </View>
    </>
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

  if (error) {
    return (
      <View style={styles.container}>
        <PTPHero
          imageUrl={featureImages.trainingHero}
          title="Private Training"
          subtitle="1-on-1 with NCAA mentors. Personalized. Flexible."
          height={220}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.gray400} />
          <PTPText variant="body" color="gray500" style={styles.errorText}>
            {error}
          </PTPText>
          <PTPButton
            title="Try Again"
            variant="primary"
            onPress={loadTrainers}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredTrainers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTrainer}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PTPEmptyState
              iconName="search-outline"
              title="No trainers found"
              description={
                searchQuery || selectedSpecialty !== 'all'
                  ? 'Try adjusting your filters or search.'
                  : 'Check back later for available trainers.'
              }
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  searchContainer: {
    padding: spacing[4],
  },
  searchInput: {
    marginBottom: spacing[3],
  },
  filterScroll: {
    paddingBottom: spacing[3],
    gap: spacing[2],
  },
  filterPill: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
  },
  sortRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  sortDropdown: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
    ...shadows.md,
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  sortOptionActive: {
    backgroundColor: colors.gray50,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing[3],
  },
  infoIcon: {
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
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
  trainerCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    overflow: 'hidden',
    ...shadows.md,
  },
  trainerImage: {
    width: '100%',
    height: 200,
    backgroundColor: colors.gray100,
  },
  trainerInfo: {
    padding: spacing[4],
  },
  trainerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  trainerName: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  verifiedBadge: {
    marginLeft: spacing[1],
    marginTop: 2,
  },
  trainerPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  trainerTagline: {
    marginBottom: spacing[2],
  },
  trainerSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  trainerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
});

export default PrivateTrainingScreen;
