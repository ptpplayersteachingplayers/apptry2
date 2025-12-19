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
import {
  formatDateLong,
  formatTime,
  formatLocation,
  getStockStatus,
  safeString,
} from '../../lib/formatting';

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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProgram();
  }, [programId]);

  const loadProgram = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const numericProgramId = typeof programId === 'string' ? parseInt(programId, 10) : programId;
      if (isNaN(numericProgramId)) {
        throw new Error('Invalid program ID');
      }
      const data = await getProgram(numericProgramId);
      if (!data) {
        throw new Error('Program not found');
      }
      setProgram(data);
    } catch (err) {
      console.error('Error loading program:', err);
      setError(err instanceof Error ? err.message : 'Failed to load program');
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

  // Get stock status for display
  const stockStatus = program ? getStockStatus(program.stock) : null;

  if (isLoading) {
    return <PTPLoading message="Loading program..." />;
  }

  if (error || !program) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <PTPText style={styles.errorIcon}>📋</PTPText>
          </View>
          <PTPText variant="sectionTitle" style={styles.errorTitle}>
            {error || 'Program not found'}
          </PTPText>
          <PTPText variant="body" color="gray500" style={styles.errorMessage}>
            We couldn't load this program. It may have been removed or there was a connection issue.
          </PTPText>
          <View style={styles.errorActions}>
            <PTPButton
              title="Try Again"
              variant="primary"
              onPress={loadProgram}
              style={styles.errorButton}
            />
            <PTPButton
              title="Go Back"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.errorButton}
            />
          </View>
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
              {safeString(program.title, 'Program Details')}
            </PTPText>
            <PTPText variant="body" color="gray500">
              {formatLocation(program.city, program.state)}
            </PTPText>
          </View>

          {/* Quick Info Cards */}
          <View style={styles.infoCards}>
            <View style={styles.infoCard}>
              <PTPText style={styles.infoIcon}>📅</PTPText>
              <PTPText variant="label">Date</PTPText>
              <PTPText variant="bodySmall" color="gray500">
                {formatDateLong(program.date)}
                {program.endDate && ` - ${formatDateLong(program.endDate)}`}
              </PTPText>
            </View>
            <View style={styles.infoCard}>
              <PTPText style={styles.infoIcon}>⏰</PTPText>
              <PTPText variant="label">Time</PTPText>
              <PTPText variant="bodySmall" color="gray500">
                {formatTime(program.time)}
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
              <PTPText style={{ fontSize: 24 }}>📍</PTPText>
            </View>
            <View style={styles.locationInfo}>
              <PTPText variant="label">
                {safeString(program.venue, '') || safeString(program.location, 'Location TBD')}
              </PTPText>
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
                    <PTPText color="primary">✓</PTPText>
                    <PTPText variant="body">{item}</PTPText>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trust Badges */}
          <View style={styles.trustSection}>
            <View style={styles.trustBadge}>
              <PTPText style={styles.trustIcon}>🎓</PTPText>
              <PTPText variant="caption" center>College-Athlete{'\n'}Mentors</PTPText>
            </View>
            <View style={styles.trustBadge}>
              <PTPText style={styles.trustIcon}>✓</PTPText>
              <PTPText variant="caption" center>Background{'\n'}Checked</PTPText>
            </View>
            <View style={styles.trustBadge}>
              <PTPText style={styles.trustIcon}>🛡️</PTPText>
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
              ${program.price ?? 0}
            </PTPText>
            {stockStatus?.message && (
              <PTPText
                variant="caption"
                color={stockStatus.variant === 'error' ? 'error' : 'warning'}
              >
                {stockStatus.message}
              </PTPText>
            )}
          </View>
          <PTPButton
            title={stockStatus?.isSoldOut ? 'Sold Out' : 'Register Now'}
            variant={stockStatus?.isSoldOut ? 'outline' : 'primary'}
            size="large"
            onPress={handleRegister}
            disabled={stockStatus?.isSoldOut}
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
    padding: spacing[6],
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  errorIcon: {
    fontSize: 40,
  },
  errorTitle: {
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  errorMessage: {
    textAlign: 'center',
    marginBottom: spacing[6],
    maxWidth: 300,
  },
  errorActions: {
    width: '100%',
    maxWidth: 280,
    gap: spacing[3],
  },
  errorButton: {
    width: '100%',
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
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
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
  },
  trustIcon: {
    fontSize: 28,
    marginBottom: spacing[1],
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
