/**
 * Account Screen (Parent)
 *
 * User profile, children, orders, and settings.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ParentStackParamList } from '../../types/navigation';
import { useAuth, useParentUser } from '../../hooks/useAuth';
import { useNotificationContext } from '../../providers';
import { PTPText, PTPButton } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';
import { deleteAccount } from '../../api/auth';

type AccountNavigationProp = NativeStackNavigationProp<ParentStackParamList>;

interface MenuItemProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  danger?: boolean;
  badge?: number;
}

const MenuItem: React.FC<MenuItemProps> = ({
  iconName,
  title,
  subtitle,
  onPress,
  showArrow = true,
  danger = false,
  badge,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    accessibilityLabel={title}
  >
    <View style={[styles.menuItemIcon, danger && styles.menuItemIconDanger]}>
      <Ionicons
        name={iconName}
        size={20}
        color={danger ? colors.error : colors.inkBlack}
      />
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
    {badge !== undefined && badge > 0 && (
      <View style={styles.badge}>
        <PTPText style={styles.badgeText}>
          {badge > 99 ? '99+' : badge}
        </PTPText>
      </View>
    )}
    {showArrow && (
      <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
    )}
  </TouchableOpacity>
);

/**
 * AccountScreen - User profile and settings
 */
const AccountScreen: React.FC = () => {
  const navigation = useNavigation<AccountNavigationProp>();
  const { logout, refreshUser } = useAuth();
  const parentUser = useParentUser();
  const { unreadCount } = useNotificationContext();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh user data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (refreshUser) {
        refreshUser();
      }
    }, [refreshUser])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (refreshUser) {
      await refreshUser();
    }
    setIsRefreshing(false);
  };

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

  const handleNotificationCenter = () => {
    navigation.navigate('NotificationCenter');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleLocationSettings = () => {
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

  const childCount = parentUser?.children?.length || 0;
  const locationText = parentUser?.preferredLocation
    ? `${parentUser.preferredLocation.city || ''}, ${parentUser.preferredLocation.state || ''}`.replace(/^, |, $/g, '')
    : 'Not set';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderTop}>
            <TouchableOpacity
              style={styles.avatar}
              onPress={handleEditProfile}
              accessibilityLabel="Edit profile"
            >
              <PTPText style={styles.avatarText}>
                {parentUser?.firstName?.[0]?.toUpperCase() || 'U'}
                {parentUser?.lastName?.[0]?.toUpperCase() || ''}
              </PTPText>
              <View style={styles.avatarEditBadge}>
                <Ionicons name="pencil" size={12} color={colors.white} />
              </View>
            </TouchableOpacity>
          </View>
          <PTPText variant="sectionTitle">
            {parentUser?.firstName || 'User'} {parentUser?.lastName || ''}
          </PTPText>
          <PTPText variant="body" color="gray500">
            {parentUser?.email || 'No email'}
          </PTPText>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <PTPText variant="sectionTitle" color="primary">
                {childCount}
              </PTPText>
              <PTPText variant="caption" color="gray500">
                {childCount === 1 ? 'Player' : 'Players'}
              </PTPText>
            </View>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={handleNotificationCenter}>
              <PTPText variant="sectionTitle" color={unreadCount > 0 ? 'error' : 'primary'}>
                {unreadCount}
              </PTPText>
              <PTPText variant="caption" color="gray500">
                Unread
              </PTPText>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <TouchableOpacity style={styles.statItem} onPress={handleLocationSettings}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <PTPText variant="caption" color="gray500" numberOfLines={1}>
                {locationText || 'Set location'}
              </PTPText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Children Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PTPText variant="label" color="gray500">
              PLAYERS
            </PTPText>
            <TouchableOpacity onPress={handleAddChild}>
              <PTPText variant="caption" color="primary">+ Add</PTPText>
            </TouchableOpacity>
          </View>
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
                  <View style={[styles.childAvatar, { backgroundColor: getAvatarColor(index) }]}>
                    <PTPText color="white" weight="semiBold">
                      {child.firstName?.[0]?.toUpperCase() || '?'}
                    </PTPText>
                  </View>
                  <View style={styles.childInfo}>
                    <PTPText variant="buttonMedium">{child.firstName || 'Player'}</PTPText>
                    <PTPText variant="caption" color="gray500">
                      {[child.ageBand, child.skillLevel, child.position].filter(Boolean).join(' • ') || 'Tap to edit'}
                    </PTPText>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.gray400} />
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyChildren}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="people-outline" size={32} color={colors.gray300} />
                </View>
                <PTPText variant="body" color="gray500" center>
                  No players added yet
                </PTPText>
                <PTPText variant="caption" color="gray400" center style={styles.emptyHint}>
                  Add your players to register for camps and training
                </PTPText>
                <PTPButton
                  title="Add Player"
                  variant="primary"
                  size="small"
                  onPress={handleAddChild}
                  style={styles.emptyButton}
                />
              </View>
            )}
          </View>
        </View>

        {/* Account Menu */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            ACCOUNT
          </PTPText>
          <View style={styles.card}>
            <MenuItem
              iconName="person-outline"
              title="Edit Profile"
              onPress={handleEditProfile}
            />
            <MenuItem
              iconName="receipt-outline"
              title="Order History"
              subtitle="View past purchases"
              onPress={handleOrderHistory}
            />
            <MenuItem
              iconName="chatbubbles-outline"
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
              iconName="notifications-outline"
              title="Notifications"
              subtitle="View your notifications"
              onPress={handleNotificationCenter}
              badge={unreadCount}
            />
            <MenuItem
              iconName="settings-outline"
              title="Notification Settings"
              subtitle="Manage push notification preferences"
              onPress={handleNotificationSettings}
            />
            <MenuItem
              iconName="location-outline"
              title="Location Preferences"
              subtitle={locationText}
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
              iconName="help-circle-outline"
              title="Help & FAQ"
              onPress={handleHelp}
            />
            <MenuItem
              iconName="mail-outline"
              title="Contact Us"
              subtitle="support@ptpsoccer.com"
              onPress={handleContact}
            />
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <PTPText variant="label" color="gray500" style={styles.sectionTitle}>
            LEGAL
          </PTPText>
          <View style={styles.card}>
            <MenuItem
              iconName="shield-checkmark-outline"
              title="Privacy Policy"
              onPress={() => Linking.openURL('https://ptpsummercamps.com/privacy-policy/')}
            />
            <MenuItem
              iconName="document-text-outline"
              title="Terms of Service"
              onPress={() => Linking.openURL('https://ptpsummercamps.com/terms-of-service/')}
            />
          </View>
        </View>

        {/* Logout and Delete */}
        <View style={styles.section}>
          <View style={styles.card}>
            <MenuItem
              iconName="log-out-outline"
              title="Log Out"
              onPress={handleLogout}
              showArrow={false}
            />
            <MenuItem
              iconName="trash-outline"
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
          <PTPText variant="caption" color="gray300" center>
            Made with passion for young athletes
          </PTPText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper function to get different colors for child avatars
const getAvatarColor = (index: number): string => {
  const colorPalette = [
    colors.inkBlack,
    colors.primary,
    colors.info,
    colors.success,
    '#8B5CF6', // purple
    '#EC4899', // pink
  ];
  return colorPalette[index % colorPalette.length];
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
  profileHeaderTop: {
    position: 'relative',
    marginBottom: spacing[3],
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.inkBlack,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: spacing[4],
    paddingHorizontal: spacing[2],
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.gray200,
    marginVertical: spacing[1],
  },
  section: {
    paddingHorizontal: spacing[4],
    marginTop: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
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
  menuItemIconDanger: {
    backgroundColor: colors.errorLight,
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.inkBlack,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing[3],
  },
  childInfo: {
    flex: 1,
  },
  emptyChildren: {
    padding: spacing[6],
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  emptyHint: {
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  emptyButton: {
    minWidth: 140,
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
    gap: spacing[1],
  },
  badge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[1],
    marginRight: spacing[2],
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

export default AccountScreen;
