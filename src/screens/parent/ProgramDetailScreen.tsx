/**
 * Program Detail Screen (Parent)
 *
 * Full details for a camp or clinic with registration CTA.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Program } from '../../types';
import { getProgram } from '../../api/programs';
import {
  PTPText,
  PTPButton,
  PTPTag,
  PTPLoading,
} from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type ProgramDetailNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'ProgramDetail'>;
type ProgramDetailRouteProp = RouteProp<ParentStackParamList, 'ProgramDetail'>;

/**
 * ProgramDetailScreen - Full program information
 */
const ProgramDetailScreen: React.FC = () => {
  const navigation = useNavigation<ProgramDetailNavigationProp>();
  const route = useRoute<ProgramDetailRouteProp>();
  const { programId } = route.params;

  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    try {
      const numericProgramId = typeof programId === 'string' ? parseInt(programId, 10) : programId;
      const data = await getProgram(numericProgramId);
      setProgram(data);
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (program) {
      navigation.navigate('Checkout', { productId: program.wooProductId });
    }
  };

  const handleOpenMaps = () => {
    if (program?.coordinates) {
      const url = `https://maps.google.com/?q=${program.coordinates.lat},${program.coordinates.lng}`;
      Linking.openURL(url);
    } else if (program?.address) {
      const url = `https://maps.google.com/?q=${encodeURIComponent(program.address)}`;
      Linking.openURL(url);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date TBD';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date TBD';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return <PTPLoading message="Loading program..." />;
  }

  if (!program) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <PTPText variant="sectionTitle">Program not found</PTPText>
          <PTPButton
            title="Go Back"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing[4] }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <ImageBackground
          source={{ uri: program.mainImageUrl }}
          style={styles.heroImage}
        >
          <View style={styles.heroOverlay}>
            <View style={styles.heroTags}>
              {program.bestseller && (
                <PTPTag label="Bestseller" variant="primary" />
              )}
              {program.almostFull && (
                <PTPTag label="Almost Full" variant="warning" />
              )}
            </View>
          </View>
        </ImageBackground>

        {/* Content */}
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <PTPTag
              label={program.type === 'camp' ? 'Camp' : 'Clinic'}
              variant="default"
              size="small"
            />
            <PTPText variant="heroTitle" style={styles.title}>
              {program.title}
            </PTPText>
            <PTPText variant="body" color="gray500">
              {program.city}, {program.state}
            </PTPText>
          </View>

          {/* Quick Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="calendar-outline" size={24} color={colors.primary} />
              </View>
              <PTPText variant="label">Date</PTPText>
              <PTPText variant="bodySmall" color="gray500" center>
                {formatDate(program.date)}
                {program.endDate && program.endDate !== program.date && `\nto ${formatDate(program.endDate)}`}
              </PTPText>
            </View>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="time-outline" size={24} color={colors.primary} />
              </View>
              <PTPText variant="label">Time</PTPText>
              <PTPText variant="bodySmall" color="gray500">
                {program.time || 'Time TBD'}
              </PTPText>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity
            style={styles.locationCard}
            onPress={handleOpenMaps}
            accessibilityLabel="Open location in maps"
          >
            <View style={styles.locationIcon}>
              <Ionicons name="location-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <PTPText variant="label">{program.venue || program.location}</PTPText>
              {program.address && (
                <PTPText variant="bodySmall" color="gray500">
                  {program.address}
                </PTPText>
              )}
              <PTPText variant="caption" color="primary">
                Open in Maps →
              </PTPText>
            </View>
          </TouchableOpacity>

          {/* Description */}
          <View style={styles.section}>
            <PTPText variant="sectionTitle" style={styles.sectionTitle}>
              About
            </PTPText>
            <PTPText variant="body" color="gray600">
              {program.description}
            </PTPText>
          </View>

          {/* Ages */}
          <View style={styles.section}>
            <PTPText variant="sectionTitle" style={styles.sectionTitle}>
              Ages
            </PTPText>
            <View style={styles.ageTags}>
              {program.ageBands.map((band) => (
                <PTPTag key={band} label={`Ages ${band}`} variant="default" />
              ))}
            </View>
          </View>

          {/* Schedule */}
          {program.schedule && program.schedule.length > 0 && (
            <View style={styles.section}>
              <PTPText variant="sectionTitle" style={styles.sectionTitle}>
                Daily Schedule
              </PTPText>
              <View style={styles.scheduleList}>
                {program.schedule.map((item, index) => (
                  <View key={index} style={styles.scheduleItem}>
                    <PTPText variant="label" style={styles.scheduleTime}>
                      {item.time}
                    </PTPText>
                    <PTPText variant="body">{item.activity}</PTPText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* What to Bring */}
          {program.whatToBring && program.whatToBring.length > 0 && (
            <View style={styles.section}>
              <PTPText variant="sectionTitle" style={styles.sectionTitle}>
                What to Bring
              </PTPText>
              <View style={styles.bringList}>
                {program.whatToBring.map((item, index) => (
                  <View key={index} style={styles.bringItem}>
                    <Ionicons name="checkmark" size={18} color={colors.primary} />
                    <PTPText variant="body">{item}</PTPText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustSection}>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Ionicons name="school-outline" size={24} color={colors.primary} />
              </View>
              <PTPText variant="caption" center>College-Athlete{'\n'}Mentors</PTPText>
            </View>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.primary} />
              </View>
              <PTPText variant="caption" center>Background{'\n'}Checked</PTPText>
            </View>
            <View style={styles.trustBadge}>
              <View style={styles.trustIconContainer}>
                <Ionicons name="shield-checkmark-outline" size={24} color={colors.primary} />
              </View>
              <PTPText variant="caption" center>Fully{'\n'}Insured</PTPText>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Bar */}
      <SafeAreaView edges={['bottom']} style={styles.bottomBar}>
        <View style={styles.bottomBarContent}>
          <View style={styles.priceContainer}>
            <PTPText variant="caption" color="gray500">Price</PTPText>
            <PTPText variant="heroTitle" color="primary">
              ${program.price}
            </PTPText>
            {program.stock !== undefined && program.stock <= 5 && program.stock > 0 && (
              <PTPText variant="caption" color="warning">
                Only {program.stock} spots left!
              </PTPText>
            )}
            {program.stock === 0 && (
              <PTPText variant="caption" color="error">
                Sold Out
              </PTPText>
            )}
          </View>
          <PTPButton
            title="Register Now"
            variant="primary"
            size="large"
            onPress={handleRegister}
            style={styles.registerButton}
          />
        </View>
      </SafeAreaView>
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
    paddingBottom: 120,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  heroImage: {
    height: 300,
    justifyContent: 'flex-end',
  },
  heroOverlay: {
    padding: spacing[4],
    paddingTop: spacing[8],
    backgroundColor: colors.overlayLight,
  },
  heroTags: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  content: {
    padding: spacing[4],
    backgroundColor: colors.white,
    marginTop: -spacing[4],
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
  },
  titleSection: {
    marginBottom: spacing[4],
  },
  title: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  infoCards: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    alignItems: 'center',
  },
  infoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: colors.gray50,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    marginBottom: spacing[4],
  },
  locationIcon: {
    marginRight: spacing[3],
  },
  locationInfo: {
    flex: 1,
  },
  section: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    marginBottom: spacing[3],
  },
  ageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  scheduleList: {
    gap: spacing[3],
  },
  scheduleItem: {
    flexDirection: 'row',
  },
  scheduleTime: {
    width: 80,
    color: colors.primary,
  },
  bringList: {
    gap: spacing[2],
  },
  bringItem: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
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
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    ...shadows.lg,
  },
  bottomBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[4],
  },
  priceContainer: {
    flex: 1,
  },
  registerButton: {
    flex: 1,
  },
});

export default ProgramDetailScreen;
