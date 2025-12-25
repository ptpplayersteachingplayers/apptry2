/**
 * Trainer Profile Screen
 *
 * Trainer profile and settings.
 */

import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { TrainerStackParamList } from '../../types/navigation';
import { useAuth, useTrainerUser } from '../../hooks/useAuth';
import { PTPText, PTPButton, PTPTag } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type ProfileNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

const TrainerProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileNavigationProp>();
  const { logout } = useAuth();
  const trainerUser = useTrainerUser();

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image source={{ uri: trainerUser?.headshotUrl }} style={styles.avatar} />
          <PTPText variant="heroTitle">{trainerUser?.firstName?.toUpperCase()} {trainerUser?.lastName?.toUpperCase()}</PTPText>
          <PTPText variant="body" color="gray300">{trainerUser?.collegePro} • {trainerUser?.position}</PTPText>
          {trainerUser?.rating && (
            <View style={styles.rating}>
              <PTPText variant="body" color="primary">★ {trainerUser.rating.toFixed(1)}</PTPText>
              <PTPText variant="bodySmall" color="gray300"> ({trainerUser.reviewCount} reviews)</PTPText>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle" color="primary">${trainerUser?.hourlyRate}</PTPText>
            <PTPText variant="caption" color="gray300">PER HOUR</PTPText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <PTPText variant="sectionTitle">{trainerUser?.reviewCount || 0}</PTPText>
            <PTPText variant="caption" color="gray300">REVIEWS</PTPText>
          </View>
        </View>

        {/* Specialties */}
        <View style={styles.section}>
          <PTPText variant="sectionTitle" style={styles.sectionTitle}>SPECIALTIES</PTPText>
          <View style={styles.specialties}>
            {trainerUser?.specialties.map(s => <PTPTag key={s} label={s} />)}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <PTPText variant="sectionTitle" style={styles.sectionTitle}>SETTINGS</PTPText>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditTrainerProfile')}>
              <PTPText>Edit Profile</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EditAvailability')}>
              <PTPText>Update Availability</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('EarningsDetail')}>
              <PTPText>Earnings & Payouts</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <PTPText variant="sectionTitle" style={styles.sectionTitle}>LEGAL</PTPText>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://ptpsummercamps.com/privacy-policy/')}>
              <PTPText>Privacy Policy</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://ptpsummercamps.com/terms-of-service/')}>
              <PTPText>Terms of Service</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL('https://ptpsummercamps.com/faq/')}>
              <PTPText>Help & Support</PTPText>
              <PTPText color="gray500">→</PTPText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
              <PTPText color="error">LOG OUT</PTPText>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.version}>
          <PTPText variant="caption" color="gray500" center>PTP Soccer v{Constants.expoConfig?.version || '1.0.0'}</PTPText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: spacing[8] },
  profileHeader: { alignItems: 'center', padding: spacing[6], backgroundColor: colors.blackCard, borderBottomWidth: 2, borderBottomColor: colors.gray700 },
  avatar: { width: 100, height: 100, borderRadius: 0, backgroundColor: colors.gray700, marginBottom: spacing[4] },
  rating: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[2] },
  statsCard: { flexDirection: 'row', margin: spacing[4], backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700, padding: spacing[4] },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: colors.gray700 },
  section: { paddingHorizontal: spacing[4], marginTop: spacing[4] },
  sectionTitle: { marginBottom: spacing[3] },
  specialties: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] },
  menuCard: { backgroundColor: colors.blackCard, borderRadius: 0, borderWidth: 2, borderColor: colors.gray700 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing[4], borderBottomWidth: 1, borderBottomColor: colors.gray700 },
  version: { marginTop: spacing[6], padding: spacing[4] },
});

export default TrainerProfileScreen;
