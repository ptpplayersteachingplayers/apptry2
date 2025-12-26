/**
 * Trainer Messages Screen
 *
 * Conversations with parents.
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Conversation, TrainerStackParamList } from '../../types';
import { getConversations } from '../../api/messages';
import { PTPText, PTPListSkeleton, NoMessagesEmptyState } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius, shadows } from '../../theme/spacing';

type TrainerMessagesNavigationProp = NativeStackNavigationProp<TrainerStackParamList>;

const TrainerMessagesScreen: React.FC = () => {
  const navigation = useNavigation<TrainerMessagesNavigationProp>();
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getParentParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p.role === 'parent') || conv.participants[0];
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const parent = getParentParticipant(item);
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => navigation.navigate('ConversationDetail', { conversationId: item.id })}
      >
        <View style={styles.avatar}>
          <PTPText color="white" weight="semiBold">{parent.name[0]}</PTPText>
        </View>
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <PTPText variant="buttonMedium" numberOfLines={1} style={{ flex: 1 }}>{parent.name}</PTPText>
            {item.lastMessage && <PTPText variant="caption" color="gray400">{formatTime(item.lastMessage.createdAt)}</PTPText>}
          </View>
          {item.lastMessage && <PTPText variant="bodySmall" color="gray500" numberOfLines={2}>{item.lastMessage.content}</PTPText>}
        </View>
        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <PTPText variant="caption" color="white">{item.unreadCount}</PTPText>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}><PTPText variant="heroTitle">Messages</PTPText></View>
        <PTPListSkeleton count={5} style={{ padding: spacing[4] }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <PTPText variant="heroTitle">Messages</PTPText>
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderConversation}
        ListEmptyComponent={<NoMessagesEmptyState />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  header: { padding: spacing[4] },
  listContent: { padding: spacing[4], paddingTop: 0, flexGrow: 1 },
  conversationCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blackCard, padding: spacing[4], borderRadius: 0, marginBottom: spacing[3], borderWidth: 2, borderColor: colors.gray700 },
  avatar: { width: 48, height: 48, borderRadius: 0, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: spacing[3] },
  conversationContent: { flex: 1 },
  conversationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[1] },
  unreadBadge: { backgroundColor: colors.inkBlack, borderRadius: 0, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing[1] },
});

export default TrainerMessagesScreen;
