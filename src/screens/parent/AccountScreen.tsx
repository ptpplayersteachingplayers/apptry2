/**
 * Account Screen (Parent)
 *
 * User profile, children, orders, and settings.
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import { ParentStackParamList } from '../../types/navigation';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { deleteAccount } from '../../api/auth';

type AccountNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

interface MenuItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    accessibilityLabel={title}
  >
    <View style={styles.menuItemIcon}>
      <PTPText style={{ fontSize: 20 }}>{icon}</PTPText>
    </View>
    <View style={styles.menuItemContent}>
      <PTPText
        variant="buttonMedium"
        color={danger ? 'error' : 'inkBlack'}
      >
        {title}
      </PTPText>
      {subtitle && (
        <PTPText variant="caption" color="gray500">
          {subtitle}
        </PTPText>
      )}
    </View>
    {showArrow && (
      <PTPText color="gray400">→</PTPText>
    )}
  </TouchableOpacity>
);

/**
 * AccountScreen - User profile and settings
 */
const AccountScreen: React.FC = () => {
  const navigation = useNavigation<AccountNavigationProp>();
  const { logout } = useAuth();
  const parentUser = useParentUser();

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAccount();
              await logout();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete account. Please contact support@ptpsoccer.com for assistance.'
              );
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  const handleEditChild = (childId: number) => {
    navigation.navigate('EditChild', { childId });
  };

  const handleAddChild = () => {
    navigation.navigate('EditChild', {}); // No childId means add new
  };

  const handleOrderHistory = () => {
    // Navigate to a filtered view or orders screen
    // For now, show an informational message about orders
    Alert.alert(
      'Order History',
      'Your order history is available on the PTP Soccer website. Would you like to open it?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Website',
          onPress: () => Linking.openURL('https://ptpsummercamps.com/my-account/orders/'),
        },
      ]
    );
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleLocationSettings = () => {
    // Navigate back to onboarding location screen or dedicated settings
    Alert.alert(
      'Location Preferences',
      'To change your location preferences, please update your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit Profile', onPress: handleEditProfile },
      ]
    );
  };

  const handleHelp = () => {
    Linking.openURL('https://ptpsummercamps.com/faq/');
  };

  const handleContact = () => {
    Linking.openURL('mailto:support@ptpsoccer.com?subject=PTP%20Soccer%20App%20Support');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <PTPText style={styles.avatarText}>
              {parentUser?.firstName?.[0] || 'U'}
              {parentUser?.lastName?.[0] || ''}
            </PTPText>
          </View>
          <PTPText variant="sectionTitle">
            {parentUser?.firstName} {parentUser?.lastName}
          </PTPText>
          <PTPText variant="body" color="gray500">
            {parentUser?.email}
          </PTPText>
        </View>

        {/* Children Section */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            PLAYERS
          </PTPText>
          <View style={styles.card}>
            {parentUser?.children && parentUser.children.length > 0 ? (
              parentUser.children.map((child, index) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childItem,
                    index < parentUser.children.length - 1 && styles.childItemBorder,
                  ]}
                  onPress={() => handleEditChild(child.id)}
                >
                  <View style={styles.childAvatar}>
                    <PTPText color="white" weight="semiBold">
                      {child.firstName[0]}
                    </PTPText>
                  </View>
                  <View style={styles.childInfo}>
                    <PTPText variant="buttonMedium">{child.firstName}</PTPText>
                    <PTPText variant="caption" color="gray500">
                      {child.ageBand} • {child.skillLevel} • {child.position || 'No position'}
                    </PTPText>
                  </View>
                  <PTPText color="gray400">→</PTPText>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyChildren}>
                <PTPText variant="body" color="gray500" center>
                  No players added yet
                </PTPText>
              </View>
            )}
            <TouchableOpacity
              style={styles.addChildButton}
              onPress={handleAddChild}
            >
              <PTPText variant="label" color="primary">
                + Add Player
              </PTPText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            ACCOUNT
          </PTPText>
          <View style={styles.card}>
            <MenuItem
              icon="👤"
              title="Edit Profile"
              onPress={handleEditProfile}
            />
            <MenuItem
              icon="🧾"
              title="Order History"
              subtitle="View past purchases"
              onPress={handleOrderHistory}
            />
            <MenuItem
              icon="💬"
              title="Messages"
              subtitle="Chat with trainers and support"
              onPress={() => navigation.navigate('Messages', {})}
            />
          </View>
        </View>

        {/* Settings Menu */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            SETTINGS
          </PTPText>
          <View style={styles.card}>
            <MenuItem
              icon="🔔"
              title="Notifications"
              subtitle="Manage push notifications"
              onPress={handleNotificationSettings}
            />
            <MenuItem
              icon="📍"
              title="Location Preferences"
              subtitle={parentUser?.preferredLocation?.city || 'Not set'}
              onPress={handleLocationSettings}
            />
          </View>
        </View>

        {/* Support Menu */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            SUPPORT
          </PTPText>
          <View style={styles.card}>
            <MenuItem
              icon="❓"
              title="Help & FAQ"
              onPress={handleHelp}
            />
            <MenuItem
              icon="📧"
              title="Contact Us"
              subtitle="support@ptpsoccer.com"
              onPress={handleContact}
            />
          </View>
        </View>

        {/* Logout and Delete */}
        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem
              icon="🚪"
              title="Log Out"
              onPress={handleLogout}
              showArrow={false}
            />
            <MenuItem
              icon="🗑️"
              title="Delete Account"
              onPress={handleDeleteAccount}
              showArrow={false}
              danger
            />
          </View>
        </View>

        {/* App Version */}
        <View style={styles.versionInfo}>
          <PTPText variant="caption" color="gray400" center>
            PTP Soccer v{Constants.expoConfig?.version || '1.0.0'}
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
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing[6],
    paddingHorizontal: spacing[4],
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.inkBlack,
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
    overflow: 'hidden',
    ...shadows.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  menuItemContent: {
    flex: 1,
  },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
  },
  childItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  childInfo: {
    flex: 1,
  },
  emptyChildren: {
    padding: spacing[4],
  },
  addChildButton: {
    padding: spacing[4],
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
  },
  versionInfo: {
    marginTop: spacing[6],
    padding: spacing[4],
  },
});

export default AccountScreen;
