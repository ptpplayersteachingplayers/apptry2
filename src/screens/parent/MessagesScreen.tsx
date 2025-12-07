/**
 * Messages Screen (Parent)
 *
 * List of conversations with trainers and support.
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ParentStackParamList } from '../../types/navigation';
import { Conversation } from '../../types';
import { getConversations } from '../../api/messages';
import { PTPText, PTPListSkeleton, NoMessagesEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type MessagesNavigationProp = NativeStackNavigationProp<ParentStackParamList, 'Messages'>;

const MessagesScreen: React.FC = () => {
  const navigation = useNavigation<MessagesNavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => { loadConversations(); }, []);

  const loadConversations = async () => {
    try {
      const response = await getConversations();
      setConversations(response.conversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally { setIsLoading(false); }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadConversations();
    setIsRefreshing(false);
  };

  const formatTime = useCallback((dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  const getOtherParticipant = useCallback((conv: Conversation) => {
    return conv.participants.find(p => p.role !== 'parent') || conv.participants[0];
  }, []);

  const renderConversation = useCallback(({ item }: { item: Conversation }) => {
    const other = getOtherParticipant(item);
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
      >
        <View style={styles.avatar}>
          <PTPText color="white" weight="semiBold">{other.name[0]}</PTPText>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <PTPText variant="buttonMedium" numberOfLines={1} style={{ flex: 1 }}>{other.name}</PTPText>
            {item.lastMessage && (
              <PTPText variant="caption" color="gray400">{formatTime(item.lastMessage.createdAt)}</PTPText>
            )}
          </View>
          {item.lastMessage && (
            <PTPText variant="bodySmall" color="gray500" numberOfLines={2}>{item.lastMessage.content}</PTPText>
          )}
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <PTPText variant="caption" color="white">{item.unreadCount}</PTPText>
          </View>
        )}
      </TouchableOpacity>
    );
  }, [navigation, formatTime, getOtherParticipant]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <PTPListSkeleton count={5} style={{ padding: spacing[4] }} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversation}
        ListEmptyComponent={<NoMessagesEmptyState />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
        maxToRenderPerBatch={10}
        windowSize={10}
        removeClippedSubviews={true}
        initialNumToRender={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  listContent: { padding: spacing[4], flexGrow: 1 },
  conversationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, padding: spacing[4], borderRadius: borderRadius.lg, marginBottom: spacing[3], ...shadows.sm },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.inkBlack, justifyContent: 'center', alignItems: 'center', marginRight: spacing[3] },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  unreadBadge: { backgroundColor: colors.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing[1] },
});

export default MessagesScreen;
