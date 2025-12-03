/**
 * Home Screen (Parent)
 *
 * Main landing screen with hero, featured programs, and quick actions.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList } from '../../types/navigation';
import { Program } from '../../types';
import { getPrograms, getFeaturedPrograms } from '../../api/programs';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import {
  PTPText,
  PTPButton,
  PTPSectionHeader,
  PTPHero,
  PTPProgramCard,
  PTPHeroCard,
  PTPListSkeleton,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { featureImages, cardBackgrounds } from '../../assets/media';
import { LOGO_URL } from '../../assets/logo';

type HomeScreenNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

/**
 * HomeScreen - Parent home with featured programs
 */
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const parentUser = useParentUser();

  const [featuredPrograms, setFeaturedPrograms] = useState<Program[]>([]);
  const [winterClinics, setWinterClinics] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const firstName = parentUser?.firstName || 'there';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [featured, clinics] = await Promise.all([
        getFeaturedPrograms(),
        getPrograms({ type: 'clinic' }, 1, 3),
      ]);
      setFeaturedPrograms(featured);
      setWinterClinics(clinics.programs);
    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const navigateToProgram = (programId: number) => {
    navigation.navigate('ProgramDetail', { programId });
  };

  return (
    <View style={styles.container}>
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
        {/* Hero Section */}
        <PTPHero
          imageUrl={featureImages.homeHero}
          showLogo
          height={320}
        >
          <PTPText variant="heroTitle" color="white" style={styles.heroTitle}>
            Hey {firstName}! 👋
          </PTPText>
          <PTPText variant="heroSubtitle" color="gray300">
            Train with NCAA mentors. No lines. All reps.
          </PTPText>
        </PTPHero>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'CampsClinics' })}
              accessibilityLabel="Find camps and clinics"
            >
              <View style={styles.quickActionIcon}>
                <PTPText style={{ fontSize: 28 }}>⚽</PTPText>
              </View>
              <PTPText variant="label">Camps & Clinics</PTPText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
              accessibilityLabel="Find private training"
            >
              <View style={styles.quickActionIcon}>
                <PTPText style={{ fontSize: 28 }}>🎯</PTPText>
              </View>
              <PTPText variant="label">Private Training</PTPText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('ParentTabs', { screen: 'Schedule' })}
              accessibilityLabel="View your schedule"
            >
              <View style={styles.quickActionIcon}>
                <PTPText style={{ fontSize: 28 }}>📅</PTPText>
              </View>
              <PTPText variant="label">My Schedule</PTPText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Programs */}
        {isLoading ? (
          <View style={styles.section}>
            <PTPListSkeleton count={2} />
          </View>
        ) : (
          <>
            {/* Winter Clinics Section */}
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
                  <PTPHeroCard
                    key={program.id}
                    imageUrl={program.mainImageUrl || cardBackgrounds.winterClinics[index % 3]}
                    title={program.title}
                    subtitle={`${program.date} • ${program.city}, ${program.state}`}
                    onPress={() => navigateToProgram(program.id)}
                    style={styles.horizontalCard}
                  />
                ))}
              </ScrollView>
            </View>

            {/* Summer Camps Promo */}
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

            {/* Private Training Promo */}
            <View style={styles.section}>
              <PTPSectionHeader
                title="Private Training"
                subtitle="1-on-1 with NCAA mentors"
              />
              <TouchableOpacity
                style={styles.trainingPromo}
                onPress={() => navigation.navigate('ParentTabs', { screen: 'PrivateTraining' })}
                accessibilityLabel="Explore private training"
              >
                <View style={styles.trainingPromoContent}>
                  <PTPText variant="sectionTitle">Personalized Training</PTPText>
                  <PTPText variant="body" color="gray500" style={styles.trainingPromoText}>
                    Work 1-on-1 with college athletes who know what it takes to level up.
                  </PTPText>
                  <View style={styles.trainingFeatures}>
                    <View style={styles.trainingFeature}>
                      <PTPText color="primary">✓</PTPText>
                      <PTPText variant="bodySmall">Customized drills</PTPText>
                    </View>
                    <View style={styles.trainingFeature}>
                      <PTPText color="primary">✓</PTPText>
                      <PTPText variant="bodySmall">Flexible scheduling</PTPText>
                    </View>
                    <View style={styles.trainingFeature}>
                      <PTPText color="primary">✓</PTPText>
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
                <Image
                  source={{ uri: featureImages.oneOnOne }}
                  style={styles.trainingPromoImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            </View>

            {/* Trust Section */}
            <View style={styles.trustSection}>
              <PTPText variant="sectionTitle" center>
                Why PTP?
              </PTPText>
              <View style={styles.trustBadges}>
                <View style={styles.trustBadge}>
                  <PTPText style={styles.trustIcon}>🎓</PTPText>
                  <PTPText variant="label" center>NCAA Mentors</PTPText>
                  <PTPText variant="caption" color="gray500" center>
                    Real role models
                  </PTPText>
                </View>
                <View style={styles.trustBadge}>
                  <PTPText style={styles.trustIcon}>✓</PTPText>
                  <PTPText variant="label" center>Background Checked</PTPText>
                  <PTPText variant="caption" color="gray500" center>
                    Safety first
                  </PTPText>
                </View>
                <View style={styles.trustBadge}>
                  <PTPText style={styles.trustIcon}>🛡️</PTPText>
                  <PTPText variant="label" center>Fully Insured</PTPText>
                  <PTPText variant="caption" color="gray500" center>
                    Peace of mind
                  </PTPText>
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

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
  trainingPromoImage: {
    width: 120,
    height: '100%',
  },
  trustSection: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[8],
    paddingTop: spacing[6],
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
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
  trustIcon: {
    fontSize: 32,
    marginBottom: spacing[2],
  },
});

export default HomeScreen;
