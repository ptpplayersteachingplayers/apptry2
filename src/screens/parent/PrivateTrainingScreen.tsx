/**
 * Private Training Screen (Parent)
 *
 * Browse and filter trainers for private 1-on-1 sessions.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Image,
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
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { featureImages } from '../../assets/media';

type PrivateTrainingNavigationProp = NativeStackNavigationProp<ParentStackParamList>;
type PrivateTrainingRouteProp = RouteProp<ParentTabParamList, 'PrivateTraining'>;

/**
 * PrivateTrainingScreen - Browse trainers
 */
const PrivateTrainingScreen: React.FC = () => {
  const navigation = useNavigation<PrivateTrainingNavigationProp>();
  const route = useRoute<PrivateTrainingRouteProp>();

  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTrainers();
  }, []);

  const loadTrainers = async () => {
    try {
      const response = await getTrainers();
      setTrainers(response.trainers);
    } catch (error) {
      console.error('Error loading trainers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTrainers();
    setIsRefreshing(false);
  };

  const filteredTrainers = trainers.filter((trainer) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      trainer.firstName.toLowerCase().includes(query) ||
      trainer.lastName.toLowerCase().includes(query) ||
      trainer.collegePro.toLowerCase().includes(query) ||
      trainer.specialties.some((s) => s.toLowerCase().includes(query))
    );
  });

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
                {item.firstName} {item.lastName}
              </PTPText>
              {item.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={styles.verifiedBadge} />
              )}
            </View>
            <View style={styles.trainerPrice}>
              <PTPText variant="cardTitle" color="primary">
                ${item.hourlyRate}
              </PTPText>
              <PTPText variant="caption" color="gray500">/hr</PTPText>
            </View>
          </View>

          <PTPText variant="bodySmall" color="gray500" style={styles.trainerTagline}>
            {item.collegePro} • {item.position}
          </PTPText>

          <View style={styles.trainerSpecialties}>
            {item.specialties.slice(0, 3).map((specialty) => (
              <PTPTag
                key={specialty}
                label={specialty.replace('-', ' ')}
                size="small"
              />
            ))}
          </View>

          {item.rating && (
            <View style={styles.trainerRating}>
              <Ionicons name="star" size={14} color={colors.primary} />
              <PTPText variant="bodySmall" color="primary">
                {item.rating.toFixed(1)}
              </PTPText>
              <PTPText variant="caption" color="gray500">
                ({item.reviewCount} reviews)
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

      {/* Search */}
      <View style={styles.searchContainer}>
        <PTPSearchInput
          placeholder="Search by name, school, or specialty..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchInput}
        />

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

        <PTPText variant="caption" color="gray500" style={styles.resultsCount}>
          {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? 's' : ''} available
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
        data={filteredTrainers}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTrainer}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <PTPEmptyState
              iconName="search-outline"
              title="No trainers found"
              description="Try adjusting your search or check back later."
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[3],
  },
  infoIcon: {
    marginRight: spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  resultsCount: {
    marginTop: spacing[1],
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
