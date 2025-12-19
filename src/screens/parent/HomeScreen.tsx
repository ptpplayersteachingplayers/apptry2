/**
 * Home Screen (Parent)
 *
 * Main landing screen with hero, featured programs, and quick actions.
 */

import React, { useCallback, useState, useEffect, memo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Program } from '../../types';
import {
  useParentUser,
  useRefresh,
  useHaptics,
} from '../../hooks';
import {
  PTPText,
  PTPButton,
  PTPSectionHeader,
  PTPHero,
  PTPHeroCard,
  HomeScreenSkeleton,
  AnimatedPressable,
  FadeInView,
  StaggeredItem,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages, cardBackgrounds } from '../../assets/media';
import { LOGO_URL } from '../../assets/logo';
import { getPrograms } from '../../api/programs';

type HomeScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * HomeScreen - Parent home with featured programs
 */
const HomeScreen: React.FC = memo(() => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const parentUser = useParentUser();
  const { selection } = useHaptics();
  const [isLoading, setIsLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);

  const firstName = parentUser?.firstName || 'there';

  // Load programs from API
  const loadPrograms = useCallback(async () => {
    try {
      const response = await getPrograms();
      setPrograms(response.programs);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load programs on mount
  useEffect(() => {
    loadPrograms();
  }, [loadPrograms]);

  // Get featured clinics (first 3 clinics or any programs if no clinics)
  const featuredPrograms = programs.filter(p => p.type === 'clinic').slice(0, 3);
  const winterClinics = featuredPrograms.length > 0 ? featuredPrograms : programs.slice(0, 3);

  // Pull-to-refresh with haptic feedback
  const { refreshing, onRefresh } = useRefresh({
    onRefresh: loadPrograms,
  });

  // Navigate to program
  const navigateToProgram = useCallback((programId: number) => {
    selection();
    navigation.navigate('ProgramDetail', { programId });
  }, [navigation, selection]);

  // Show skeleton while loading
  if (isLoading) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Hero Section */}
        <FadeInView>
          <PTPHero
            imageUrl={featureImages.homeHero}
            showLogo
            height={320}
          >
            <PTPText variant="heroTitle" color="white" style={styles.heroTitle}>
              Hey {firstName}!
            </PTPText>
            <PTPText variant="heroSubtitle" color="gray300">
              Train with NCAA mentors. No lines. All reps.
            </PTPText>
          </PTPHero>
        </FadeInView>

        {/* Quick Actions */}
        <FadeInView delay={100}>
          <View style={styles.section}>
            <View style={styles.quickActions}>
              <AnimatedPressable
                style={styles.quickAction}
                onPress={() => {
                  selection();
                  navigation.navigate('ParentTabs', { screen: 'CampsClinics' });
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="football-outline" size={28} color={colors.inkBlack} />
                </View>
                <PTPText variant="label">Camps & Clinics</PTPText>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.quickAction}
                onPress={() => {
                  selection();
                  navigation.navigate('ParentTabs', { screen: 'PrivateTraining' });
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="fitness-outline" size={28} color={colors.inkBlack} />
                </View>
                <PTPText variant="label">Private Training</PTPText>
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.quickAction}
                onPress={() => {
                  selection();
                  navigation.navigate('ParentTabs', { screen: 'Schedule' });
                }}
              >
                <View style={styles.quickActionIcon}>
                  <Ionicons name="calendar-outline" size={28} color={colors.inkBlack} />
                </View>
                <PTPText variant="label">My Schedule</PTPText>
              </AnimatedPressable>
            </View>
          </View>
        </FadeInView>

        {/* Winter Clinics Section */}
        <FadeInView delay={200}>
          <View style={styles.section}>
            <PTPSectionHeader
              title="Winter Clinics"
              subtitle="Beat the off-season"
              actionText="See All"
              onAction={() => navigation.navigate('ParentTabs', { screen: 'CampsClinics', params: { filter: 'clinic' } })}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScroll}
            >
              {winterClinics.map((program, index) => (
                <StaggeredItem key={program.id} index={index}>
                  <PTPHeroCard
                    imageUrl={program.mainImageUrl || cardBackgrounds.winterClinics[index % 3]}
                    title={program.title}
                    subtitle={`${program.date} • ${program.city}, ${program.state}`}
                    onPress={() => navigateToProgram(program.id)}
                    style={styles.horizontalCard}
                  />
                </StaggeredItem>
              ))}
            </ScrollView>
          </View>
        </FadeInView>

        {/* Summer Camps Promo */}
        <FadeInView delay={300}>
          <View style={styles.section}>
            <PTPSectionHeader
              title="Summer Camps"
              subtitle="Registration opens soon!"
            />
            <PTPHeroCard
              imageUrl={featureImages.summerCamp}
              title="PTP Summer Soccer Camp"
              subtitle="Full week of training, games, and fun"
              height={180}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'CampsClinics', params: { filter: 'camp' } })}
            />
          </View>
        </FadeInView>

        {/* Private Training Promo */}
        <FadeInView delay={400}>
          <View style={styles.section}>
            <PTPSectionHeader
              title="Private Training"
              subtitle="1-on-1 with NCAA mentors"
            />
            <AnimatedPressable
              style={styles.trainingPromo}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
            >
              <View style={styles.trainingPromoContent}>
                <PTPText variant="sectionTitle">Personalized Training</PTPText>
                <PTPText variant="body" color="gray500" style={styles.trainingPromoText}>
                  Work 1-on-1 with college athletes who know what it takes to level up.
                </PTPText>
                <View style={styles.trainingFeatures}>
                  <View style={styles.trainingFeature}>
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                    <PTPText variant="bodySmall">Customized drills</PTPText>
                  </View>
                  <View style={styles.trainingFeature}>
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                    <PTPText variant="bodySmall">Flexible scheduling</PTPText>
                  </View>
                  <View style={styles.trainingFeature}>
                    <Ionicons name="checkmark" size={16} color={colors.primary} />
                    <PTPText variant="bodySmall">Progress tracking</PTPText>
                  </View>
                </View>
                <PTPButton
                  title="Find a Trainer"
                  variant="primary"
                  size="medium"
                  onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
                  style={styles.trainingButton}
                />
              </View>
            </AnimatedPressable>
          </View>
        </FadeInView>

        {/* Trust Section */}
        <FadeInView delay={500}>
          <View style={styles.trustSection}>
            <View style={styles.trustLogoContainer}>
              <PTPText variant="body" color="gray500">Why</PTPText>
              <Image
                source={{ uri: LOGO_URL }}
                style={styles.trustLogo}
                resizeMode="contain"
              />
              <PTPText variant="body" color="gray500">?</PTPText>
            </View>
            <View style={styles.trustBadges}>
              <View style={styles.trustBadge}>
                <View style={styles.trustIconContainer}>
                  <Ionicons name="school-outline" size={28} color={colors.primary} />
                </View>
                <PTPText variant="label" center>NCAA Mentors</PTPText>
                <PTPText variant="caption" color="gray500" center>
                  Real role models
                </PTPText>
              </View>
              <View style={styles.trustBadge}>
                <View style={styles.trustIconContainer}>
                  <Ionicons name="checkmark-circle-outline" size={28} color={colors.primary} />
                </View>
                <PTPText variant="label" center>Background Checked</PTPText>
                <PTPText variant="caption" color="gray500" center>
                  Safety first
                </PTPText>
              </View>
              <View style={styles.trustBadge}>
                <View style={styles.trustIconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
                </View>
                <PTPText variant="label" center>Fully Insured</PTPText>
                <PTPText variant="caption" color="gray500" center>
                  Peace of mind
                </PTPText>
              </View>
            </View>
          </View>
        </FadeInView>
      </ScrollView>
    </View>
  );
});

HomeScreen.displayName = 'HomeScreen';

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
  heroTitle: {
    marginTop: spacing[4],
    marginBottom: spacing[2],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    marginTop: -spacing[10],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  horizontalScroll: {
    paddingRight: spacing[4],
  },
  horizontalCard: {
    width: 280,
    marginRight: spacing[3],
  },
  trainingPromo: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  trainingPromoContent: {
    flex: 1,
    padding: spacing[4],
  },
  trainingPromoText: {
    marginTop: spacing[2],
    marginBottom: spacing[3],
  },
  trainingFeatures: {
    gap: spacing[2],
    marginBottom: spacing[4],
  },
  trainingFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  trainingButton: {
    alignSelf: 'flex-start',
  },
  trustSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[8],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
  },
  trustLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  trustLogo: {
    width: 80,
    height: 32,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing[4],
  },
  trustBadge: {
    alignItems: 'center',
    flex: 1,
  },
  trustIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
});

export default HomeScreen;
