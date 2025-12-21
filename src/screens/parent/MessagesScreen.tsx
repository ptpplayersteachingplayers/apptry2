/**
 * Messages Screen (Parent)
 *
 * iOS-style message list with conversations.
 * Clean, minimal design like native iOS Messages app.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Conversation } from '../../types';
import { getConversations, getOnlineStatus } from '../../api/messages';
import { PTPText, PTPListSkeleton, NoMessagesEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type MessagesNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load conversations on mount and when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [])
  );

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
      setFilteredConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredConversations(conversations);
    } else {
      const filtered = conversations.filter((conv) => {
        const otherParticipant = getOtherParticipant(conv);
        return otherParticipant.name.toLowerCase().includes(text.toLowerCase()) ||
               conv.lastMessage?.content.toLowerCase().includes(text.toLowerCase());
      });
      setFilteredConversations(filtered);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find((p) => p.role !== 'parent') || conv.participants[0];
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name: string) => {
    const avatarColors = [
      '#007AFF', // iOS Blue
      '#34C759', // iOS Green
      '#FF9500', // iOS Orange
      '#FF2D55', // iOS Pink
      '#5856D6', // iOS Purple
      '#00C7BE', // iOS Teal
    ];
    const index = name.charCodeAt(0) % avatarColors.length;
    return avatarColors[index];
  };

  const renderConversation = ({ item, index }: { item: Conversation; index: number }) => {
    const other = getOtherParticipant(item);
    const hasUnread = item.unreadCount > 0;
    const onlineStatus = getOnlineStatus(other.id);

    return (
      <TouchableOpacity
        style={styles.conversationRow}
        onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
        activeOpacity={0.6}
      >
        {/* Avatar with online indicator */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatar, { backgroundColor: getAvatarColor(other.name) }]}>
            <PTPText style={styles.avatarText}>{getInitials(other.name)}</PTPText>
          </View>
          {onlineStatus.isOnline && <View style={styles.onlineIndicator} />}
        </View>

        {/* Content */}
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <PTPText
              variant="body"
              weight={hasUnread ? 'semiBold' : 'regular'}
              numberOfLines={1}
              style={styles.nameText}
            >
              {other.name}
            </PTPText>
            <View style={styles.timeContainer}>
              {item.lastMessage && (
                <PTPText variant="caption" color="gray400">
                  {formatTime(item.lastMessage.createdAt)}
                </PTPText>
              )}
              <Ionicons name="chevron-forward" size={16} color={colors.gray300} style={styles.chevron} />
            </View>
          </View>

          <View style={styles.messagePreviewRow}>
            <PTPText
              variant="bodySmall"
              color={hasUnread ? 'inkBlack' : 'gray500'}
              weight={hasUnread ? 'medium' : 'regular'}
              numberOfLines={2}
              style={styles.previewText}
            >
              {item.lastMessage?.content || 'No messages yet'}
            </PTPText>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <PTPText style={styles.unreadText}>{item.unreadCount}</PTPText>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSeparator = () => <View style={styles.separator} />;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <PTPText variant="sectionTitle" weight="bold">Messages</PTPText>
        </View>
        <PTPListSkeleton count={6} style={{ padding: spacing[4] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <PTPText variant="sectionTitle" weight="bold">Messages</PTPText>
        <TouchableOpacity style={styles.composeButton}>
          <Ionicons name="create-outline" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.gray400} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor={colors.gray400}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.gray400} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversation}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={
          searchQuery ? (
            <View style={styles.emptySearch}>
              <Ionicons name="search" size={48} color={colors.gray300} />
              <PTPText variant="body" color="gray500" style={styles.emptySearchText}>
                No results for "{searchQuery}"
              </PTPText>
            </View>
          ) : (
            <NoMessagesEmptyState />
          )
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  composeButton: {
    padding: spacing[2],
  },
  searchContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.inkBlack,
    paddingVertical: spacing[1],
  },
  listContent: {
    flexGrow: 1,
  },
  conversationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    backgroundColor: colors.white,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: spacing[3],
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#34C759', // iOS green
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '600',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  nameText: {
    flex: 1,
    fontSize: 17,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: spacing[1],
  },
  messagePreviewRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  previewText: {
    flex: 1,
    lineHeight: 20,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[2],
    marginLeft: spacing[2],
  },
  unreadText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.gray200,
    marginLeft: 76, // Avatar container width + margin
  },
  emptySearch: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing[16],
  },
  emptySearchText: {
    marginTop: spacing[3],
    textAlign: 'center',
  },
});

export default MessagesScreen;
