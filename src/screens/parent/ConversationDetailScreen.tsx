/**
 * Conversation Detail Screen
 *
 * Chat view with message input.
 */

import React, { useEffect, useState, useRef } from 'react';
import {
  View, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { ParentStackParamList } from '../../types/navigation';
import { Message } from '../../types';
import { getMessages, sendMessage, markAsRead } from '../../api/messages';
import { PTPText, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type ConversationDetailRouteProp = RouteProp<ParentStackParamList, 'ConversationDetail'>;

const ConversationDetailScreen: React.FC = () => {
  const route = useRoute<ConversationDetailRouteProp>();
  const { conversationId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadMessages();
    markAsRead(conversationId);
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      const response = await getMessages(conversationId);
      setMessages(response.messages.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally { setIsLoading(false); }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await sendMessage({ conversationId, content: inputText.trim() });
      setMessages((prev) => [...prev, response.message]);
      setInputText('');
      flatListRef.current?.scrollToEnd();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally { setIsSending(false); }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderType === 'parent';
    return (
      <View style={[styles.messageBubbleContainer, isOwnMessage && styles.ownMessageContainer]}>
        <View style={[styles.messageBubble, isOwnMessage ? styles.ownMessage : styles.otherMessage]}>
          {!isOwnMessage && (
            <PTPText variant="caption" color="gray500" style={styles.senderName}>{item.senderName}</PTPText>
          )}
          <PTPText variant="body" color={isOwnMessage ? 'white' : 'inkBlack'}>{item.content}</PTPText>
          <PTPText variant="caption" color={isOwnMessage ? 'gray300' : 'gray400'} style={styles.messageTime}>
            {formatTime(item.createdAt)}
            {isOwnMessage && item.status === 'read' && ' ✓✓'}
          </PTPText>
        </View>
      </View>
    );
  };

  if (isLoading) return <PTPLoading />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.keyboardView} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Type a message..."
            placeholderTextColor={colors.gray400}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <PTPText color={inputText.trim() && !isSending ? 'primary' : 'gray400'} weight="semiBold">Send</PTPText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.offWhite },
  keyboardView: { flex: 1 },
  messagesList: { padding: spacing[4], paddingBottom: spacing[2] },
  messageBubbleContainer: { marginBottom: spacing[2], maxWidth: '80%' },
  ownMessageContainer: { alignSelf: 'flex-end' },
  messageBubble: { padding: spacing[3], borderRadius: borderRadius.lg },
  ownMessage: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  otherMessage: { backgroundColor: colors.white, borderBottomLeftRadius: 4 },
  senderName: { marginBottom: spacing[1] },
  messageTime: { marginTop: spacing[1], alignSelf: 'flex-end' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: spacing[3], backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray200 },
  input: { flex: 1, backgroundColor: colors.gray50, borderRadius: borderRadius.lg, paddingHorizontal: spacing[4], paddingVertical: spacing[3], maxHeight: 100, fontSize: 16, color: colors.inkBlack },
  sendButton: { marginLeft: spacing[2], paddingHorizontal: spacing[3], paddingVertical: spacing[3] },
  sendButtonDisabled: { opacity: 0.5 },
});

export default ConversationDetailScreen;
