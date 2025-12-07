/**
 * Notification Settings Screen (Parent)
 *
 * Allows parents to manage their notification preferences.
 */

import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import { updateProfile } from '../../api/auth';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

interface NotificationToggleProps {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  description,
  value,
  onValueChange,
  disabled,
}) => (
  <View style={styles.toggleRow}>
    <View style={styles.toggleContent}>
      <PTPText variant="buttonMedium" color={disabled ? 'gray400' : 'inkBlack'}>
        {title}
      </PTPText>
      <PTPText variant="caption" color={disabled ? 'gray300' : 'gray500'}>
        {description}
      </PTPText>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.gray300, true: colors.primary }}
      thumbColor={colors.white}
      ios_backgroundColor={colors.gray300}
    />
  </View>
);

/**
 * NotificationSettingsScreen - Manage push notification preferences
 */
const NotificationSettingsScreen: React.FC = () => {
  const { refreshUser } = useAuth();
  const parentUser = useParentUser();

  // System permission state
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Notification preferences
  const [masterEnabled, setMasterEnabled] = useState(parentUser?.notificationsEnabled ?? true);
  const [sessionReminders, setSessionReminders] = useState(true);
  const [newMessages, setNewMessages] = useState(true);
  const [promotions, setPromotions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check notification permission on mount
  React.useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setHasPermission(status === 'granted');

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable notifications in your device settings to receive updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            },
          },
        ]
      );
    }
  };

  const handleMasterToggle = async (value: boolean) => {
    setMasterEnabled(value);
    setIsLoading(true);

    try {
      await updateProfile({ notificationsEnabled: value });
      await refreshUser();
    } catch (error) {
      // Revert on error
      setMasterEnabled(!value);
      Alert.alert('Error', 'Failed to update notification settings.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSettings = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Permission Status */}
        {hasPermission === false && (
          <View style={styles.permissionBanner}>
            <PTPText variant="buttonMedium" color="white">
              Notifications Disabled
            </PTPText>
            <PTPText variant="caption" color="white" style={styles.permissionText}>
              Enable notifications to receive updates about sessions, messages, and promotions.
            </PTPText>
            <PTPButton
              title="Enable Notifications"
              variant="secondary"
              onPress={requestPermission}
              style={styles.permissionButton}
            />
          </View>
        )}

        {/* Master Toggle */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            NOTIFICATIONS
          </PTPText>
          <View style={styles.card}>
            <NotificationToggle
              title="Push Notifications"
              description="Enable or disable all push notifications"
              value={masterEnabled}
              onValueChange={handleMasterToggle}
              disabled={isLoading || hasPermission === false}
            />
          </View>
        </View>

        {/* Notification Types */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            NOTIFICATION TYPES
          </PTPText>
          <View style={styles.card}>
            <NotificationToggle
              title="Session Reminders"
              description="Get reminded before upcoming sessions"
              value={sessionReminders && masterEnabled}
              onValueChange={setSessionReminders}
              disabled={!masterEnabled || hasPermission === false}
            />
            <View style={styles.divider} />
            <NotificationToggle
              title="New Messages"
              description="Get notified when you receive messages"
              value={newMessages && masterEnabled}
              onValueChange={setNewMessages}
              disabled={!masterEnabled || hasPermission === false}
            />
            <View style={styles.divider} />
            <NotificationToggle
              title="Promotions & Updates"
              description="Learn about new camps, clinics, and special offers"
              value={promotions && masterEnabled}
              onValueChange={setPromotions}
              disabled={!masterEnabled || hasPermission === false}
            />
          </View>
        </View>

        {/* Device Settings */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            DEVICE SETTINGS
          </PTPText>
          <View style={styles.card}>
            <View style={styles.settingsRow}>
              <View style={styles.settingsContent}>
                <PTPText variant="buttonMedium">System Settings</PTPText>
                <PTPText variant="caption" color="gray500">
                  Manage notification permissions and sound settings in your device settings
                </PTPText>
              </View>
            </View>
            <PTPButton
              title="Open Device Settings"
              variant="outline"
              onPress={handleOpenSettings}
              fullWidth
            />
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <PTPText variant="caption" color="gray400" center>
            We respect your inbox. We only send notifications that matter - session reminders,
            messages from trainers, and occasional updates about new programs.
          </PTPText>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  permissionBanner: {
    backgroundColor: colors.error,
    margin: spacing[4],
    padding: spacing[4],
    borderRadius: borderRadius.lg,
  },
  permissionText: {
    marginTop: spacing[1],
    opacity: 0.9,
  },
  permissionButton: {
    marginTop: spacing[3],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionTitle: {
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing[4],
    ...shadows.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  toggleContent: {
    flex: 1,
    marginRight: spacing[3],
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray100,
    marginVertical: spacing[3],
  },
  settingsRow: {
    marginBottom: spacing[4],
  },
  settingsContent: {
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[6],
  },
});

export default NotificationSettingsScreen;
