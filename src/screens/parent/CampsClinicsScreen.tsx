/**
 * Camps & Clinics Screen (Parent)
 *
 * Browse and filter camps and clinics.
 * This is the center of the PTP flow.
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList, ParentTabParamList } from '../../types/navigation';
import { Program, ProgramType } from '../../types';
import { getPrograms } from '../../api/programs';
import {
  PTPText,
  PTPSearchInput,
  PTPProgramCard,
  PTPTag,
  PTPHero,
  PTPListSkeleton,
  NoProgramsEmptyState,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages } from '../../assets/media';
import { formatDateShort, formatTime, formatLocation } from '../../lib/formatting';

type CampsClinicsNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type CampsClinicsRouteProp = RouteProp<ParentTabParamList, 'CampsClinics'>;

type FilterType = 'all' | 'clinic' | 'camp';

/**
 * CampsClinicsScreen - Browse camps and clinics
 */
const CampsClinicsScreen: React.FC = () => {
  const navigation = useNavigation<CampsClinicsNavigationProp>();
  const route = useRoute<CampsClinicsRouteProp>();

  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>((route.params?.filter as FilterType) || 'all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPrograms();
  }, [filter]);

  const loadPrograms = async () => {
    setError(null);
    try {
      const typeFilter = filter === 'all' ? undefined : filter;
      const response = await getPrograms({ type: typeFilter as ProgramType });
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
  };

  const filteredPrograms = programs.filter((program) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      (program.title?.toLowerCase() || '').includes(query) ||
      (program.city?.toLowerCase() || '').includes(query) ||
      (program.location?.toLowerCase() || '').includes(query)
    );
  });

  const renderProgram = useCallback(
    ({ item }: { item: Program }) => (
      <View style={styles.cardContainer}>
        <PTPProgramCard
          title={item.title}
          date={formatDateShort(item.date)}
          time={formatTime(item.time)}
          location={formatLocation(item.city, item.state)}
          price={item.price}
          imageUrl={item.mainImageUrl}
          almostFull={item.almostFull}
          bestseller={item.bestseller}
          onPress={() => navigation.navigate('ProgramDetail', { programId: item.id })}
        />
      </View>
    ),
    [navigation]
  );

  const ListHeader = () => (
    <>
      {/* Hero */}
      <PTPHero
        imageUrl={featureImages.campsHero}
        title="Camps & Clinics"
        subtitle="Train with NCAA mentors. Build skills. Have fun."
        height={240}
      />

      {/* Search and Filters */}
      <View style={styles.filtersContainer}>
        <PTPSearchInput
          placeholder="Search by name or location..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

        <View style={styles.filterTabs}>
          {(['all', 'clinic', 'camp'] as FilterType[]).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterTab, filter === type && styles.filterTabActive]}
              onPress={() => setFilter(type)}
              accessibilityLabel={`Filter by ${type}`}
              accessibilityState={{ selected: filter === type }}
            >
              <PTPText
                variant="label"
                color={filter === type ? 'inkBlack' : 'gray500'}
              >
                {type === 'all' ? 'All' : type === 'clinic' ? 'Winter Clinics' : 'Summer Camps'}
              </PTPText>
            </TouchableOpacity>
          ))}
        </View>

        {/* Results count */}
        <PTPText variant="caption" color="gray500" style={styles.resultsCount}>
          {filteredPrograms.length} program{filteredPrograms.length !== 1 ? 's' : ''} found
        </PTPText>
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

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredPrograms}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProgram}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <NoProgramsEmptyState
              onAction={() => {
                // TODO: Implement join priority list
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  filtersContainer: {
    padding: spacing[4],
  },
  searchInput: {
    marginBottom: spacing[3],
  },
  filterTabs: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  filterTab: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray100,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  resultsCount: {
    marginTop: spacing[1],
  },
  listContent: {
    paddingBottom: spacing[8],
  },
  cardContainer: {
    paddingHorizontal: spacing[4],
    marginBottom: spacing[3],
  },
  loadingContainer: {
    padding: spacing[4],
  },
  emptyContainer: {
    padding: spacing[4],
    minHeight: 300,
  },
});

export default CampsClinicsScreen;
