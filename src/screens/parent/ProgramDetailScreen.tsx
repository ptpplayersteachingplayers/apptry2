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
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Program } from '../../types';
import { getProgram, joinWaitlist, getWaitlistStatus } from '../../api/programs';
import {
  PTPText,
  PTPButton,
  PTPTag,
  PTPLoading,
} from '../../components';
import { useAuth } from '../../hooks';
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
  const { user } = useAuth();

  const [program, setProgram] = useState<Program | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [isJoiningWaitlist, setIsJoiningWaitlist] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null);

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

      // Check waitlist status if program is sold out
      const stockStatus = getStockStatus(data.stock);
      if (stockStatus.isSoldOut) {
        try {
          const waitlistStatus = await getWaitlistStatus(numericProgramId);
          setIsOnWaitlist(waitlistStatus.isOnWaitlist);
          if (waitlistStatus.position) {
            setWaitlistPosition(waitlistStatus.position);
          }
        } catch (err) {
          console.log('Waitlist status check failed:', err);
        }
      }
    } catch (err) {
      console.error('Error loading program:', err);
      setError(err instanceof Error ? err.message : 'Failed to load program');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (program) {
      navigation.navigate('Checkout', {
        productId: program.wooProductId,
        programName: program.title,
        programDate: program.date,
        programLocation: program.location,
      });
    }
  };

  const handleJoinWaitlist = async () => {
    if (!program) return;

    setIsJoiningWaitlist(true);
    try {
      const result = await joinWaitlist({
        programId: program.id,
        email: user?.email,
      });

      setShowWaitlistModal(false);

      if (result.success) {
        setIsOnWaitlist(true);
        if (result.position) {
          setWaitlistPosition(result.position);
        }

        Alert.alert(
          'Waitlist Confirmed!',
          `${result.message}\n\n${result.estimatedAvailability || ''}`,
          [{ text: 'Got it!' }]
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setIsJoiningWaitlist(false);
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
            {isOnWaitlist && waitlistPosition && (
              <PTPText variant="caption" color="success">
                Waitlist Position: #{waitlistPosition}
              </PTPText>
            )}
          </View>
          {stockStatus?.isSoldOut ? (
            <PTPButton
              title={isOnWaitlist ? 'On Waitlist' : 'Join Waitlist'}
              variant={isOnWaitlist ? 'outline' : 'secondary'}
              size="large"
              onPress={() => !isOnWaitlist && setShowWaitlistModal(true)}
              disabled={isOnWaitlist}
              leftIcon={isOnWaitlist ? <Ionicons name="checkmark-circle" size={18} color={colors.success} /> : <Ionicons name="notifications-outline" size={18} color={colors.white} />}
              style={styles.registerButton}
            />
          ) : (
            <PTPButton
              title="Register Now"
              variant="primary"
              size="large"
              onPress={handleRegister}
              style={styles.registerButton}
            />
          )}
        </View>
      </SafeAreaView>

      {/* Waitlist Modal */}
      <Modal
        visible={showWaitlistModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowWaitlistModal(false)}
      >
        <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setShowWaitlistModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.gray600} />
            </TouchableOpacity>
            <PTPText variant="sectionTitle">Join Waitlist</PTPText>
            <View style={styles.modalCloseButton} />
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
          >
            {/* Program Info */}
            <View style={styles.waitlistProgramInfo}>
              <PTPTag
                label={program.type === 'camp' ? 'Camp' : 'Clinic'}
                variant="default"
                size="small"
              />
              <PTPText variant="cardTitle" style={styles.waitlistProgramTitle}>
                {program.title}
              </PTPText>
              <PTPText variant="bodySmall" color="gray500">
                {formatDateLong(program.date)} | {program.location}
              </PTPText>
            </View>

            {/* Waitlist Benefits */}
            <View style={styles.waitlistBenefits}>
              <PTPText variant="label" style={styles.waitlistSectionTitle}>
                What Happens When You Join
              </PTPText>
              <View style={styles.waitlistBenefit}>
                <View style={styles.waitlistBenefitIcon}>
                  <Ionicons name="notifications" size={20} color={colors.primary} />
                </View>
                <View style={styles.waitlistBenefitContent}>
                  <PTPText variant="bodySmall" weight="semiBold">
                    Instant Notifications
                  </PTPText>
                  <PTPText variant="caption" color="gray500">
                    Get notified immediately when a spot opens up
                  </PTPText>
                </View>
              </View>
              <View style={styles.waitlistBenefit}>
                <View style={styles.waitlistBenefitIcon}>
                  <Ionicons name="flash" size={20} color={colors.primary} />
                </View>
                <View style={styles.waitlistBenefitContent}>
                  <PTPText variant="bodySmall" weight="semiBold">
                    Priority Access
                  </PTPText>
                  <PTPText variant="caption" color="gray500">
                    24-hour window to register before spots go public
                  </PTPText>
                </View>
              </View>
              <View style={styles.waitlistBenefit}>
                <View style={styles.waitlistBenefitIcon}>
                  <Ionicons name="shield-checkmark" size={20} color={colors.primary} />
                </View>
                <View style={styles.waitlistBenefitContent}>
                  <PTPText variant="bodySmall" weight="semiBold">
                    No Obligation
                  </PTPText>
                  <PTPText variant="caption" color="gray500">
                    You can remove yourself from the waitlist anytime
                  </PTPText>
                </View>
              </View>
            </View>

            {/* Contact Info */}
            <View style={styles.waitlistContact}>
              <Ionicons name="mail-outline" size={18} color={colors.gray500} />
              <PTPText variant="bodySmall" color="gray500">
                Notifications will be sent to: {user?.email || 'your email'}
              </PTPText>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <PTPButton
              title="Join Waitlist"
              variant="primary"
              size="large"
              fullWidth
              loading={isJoiningWaitlist}
              onPress={handleJoinWaitlist}
              leftIcon={<Ionicons name="notifications" size={18} color={colors.inkBlack} />}
            />
            <TouchableOpacity
              onPress={() => setShowWaitlistModal(false)}
              style={styles.modalCancelButton}
            >
              <PTPText variant="label" color="gray500">
                Maybe Later
              </PTPText>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
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
    borderRadius: 0,
    backgroundColor: colors.blackCard,
    borderWidth: 2,
    borderColor: colors.gray700,
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
    backgroundColor: colors.overlayDark,
  },
  heroTags: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  content: {
    padding: spacing[4],
    backgroundColor: colors.black,
    marginTop: -spacing[4],
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
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
    padding: spacing[3],
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 24,
    marginBottom: spacing[1],
  },
  locationCard: {
    flexDirection: 'row',
    backgroundColor: colors.blackCard,
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
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
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
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
    backgroundColor: colors.blackCard,
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
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
  // Waitlist Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.black,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: colors.gray700,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing[4],
  },
  waitlistProgramInfo: {
    backgroundColor: colors.blackCard,
    padding: spacing[4],
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
    marginBottom: spacing[6],
  },
  waitlistProgramTitle: {
    marginTop: spacing[2],
    marginBottom: spacing[1],
  },
  waitlistBenefits: {
    marginBottom: spacing[6],
  },
  waitlistSectionTitle: {
    marginBottom: spacing[4],
  },
  waitlistBenefit: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
    gap: spacing[3],
  },
  waitlistBenefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 0,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitlistBenefitContent: {
    flex: 1,
  },
  waitlistContact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    backgroundColor: colors.blackCard,
    padding: spacing[3],
    borderRadius: 0,
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  modalFooter: {
    padding: spacing[4],
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
    alignItems: 'center',
    backgroundColor: colors.blackCard,
  },
  modalCancelButton: {
    marginTop: spacing[4],
    padding: spacing[2],
  },
});

export default ProgramDetailScreen;
