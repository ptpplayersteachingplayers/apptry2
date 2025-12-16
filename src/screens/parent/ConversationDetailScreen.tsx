/**
 * Conversation Detail Screen
 *
 * iOS iMessage-style chat interface with blue/gray bubbles,
 * delivery status indicators, and smooth animations.
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ParentStackParamList } from '../../types/navigation';
import { Message } from '../../types';
import { getMessages, sendMessage, markAsRead } from '../../api/messages';
import { PTPText, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

type ConversationDetailRouteProp = RouteProp<ParentStackParamList, 'ConversationDetail'>;

// iOS iMessage colors
const iOSColors = {
  blue: '#007AFF',
  gray: '#E9E9EB',
  inputBg: '#F6F6F6',
  sendButton: '#007AFF',
};

const ConversationDetailScreen: React.FC = () => {
  const route = useRoute<ConversationDetailRouteProp>();
  const { conversationId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Poll for new messages every 5 seconds
  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }, [conversationId])
  );

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const messageContent = inputText.trim();
    setInputText('');
    setInputHeight(36);
    setIsSending(true);

    // Optimistic update - add message immediately
    const tempMessage: Message = {
      id: Date.now(),
      conversationId,
      senderId: 0,
      senderType: 'parent',
      senderName: 'You',
      content: messageContent,
      status: 'sending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const response = await sendMessage({ conversationId, content: messageContent });
      // Replace temp message with actual message
      setMessages((prev) =>
        prev.map((m) => (m.id === tempMessage.id ? response.message : m))
      );
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Mark message as failed
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempMessage.id ? { ...m, status: 'failed' as const } : m
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'long' });
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const shouldShowDateHeader = (index: number) => {
    if (index === 0) return true;
    const currentDate = new Date(messages[index].createdAt).toDateString();
    const prevDate = new Date(messages[index - 1].createdAt).toDateString();
    return currentDate !== prevDate;
  };

  const getDeliveryStatus = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return null;
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      case 'failed':
        return 'Not Delivered';
      default:
        return null;
    }
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isOwnMessage = item.senderType === 'parent';
    const isLastInGroup =
      index === messages.length - 1 ||
      messages[index + 1].senderType !== item.senderType;
    const showDeliveryStatus = isOwnMessage && isLastInGroup;

    return (
      <View>
        {/* Date Header */}
        {shouldShowDateHeader(index) && (
          <View style={styles.dateHeader}>
            <PTPText variant="caption" color="gray500" style={styles.dateHeaderText}>
              {formatDateHeader(item.createdAt)}
            </PTPText>
          </View>
        )}

        {/* Message Bubble */}
        <View
          style={[
            styles.messageBubbleContainer,
            isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isOwnMessage ? styles.ownMessage : styles.otherMessage,
              !isLastInGroup && (isOwnMessage ? styles.ownMessageGrouped : styles.otherMessageGrouped),
            ]}
          >
            <PTPText
              style={[
                styles.messageText,
                isOwnMessage ? styles.ownMessageText : styles.otherMessageText,
              ]}
            >
              {item.content}
            </PTPText>
          </View>

          {/* Time and delivery status */}
          {isLastInGroup && (
            <View
              style={[
                styles.messageFooter,
                isOwnMessage ? styles.ownFooter : styles.otherFooter,
              ]}
            >
              <PTPText variant="caption" color="gray400" style={styles.timeText}>
                {formatTime(item.createdAt)}
              </PTPText>
              {showDeliveryStatus && item.status && (
                <PTPText
                  variant="caption"
                  color={item.status === 'failed' ? 'error' : 'gray400'}
                  style={styles.statusText}
                >
                  {getDeliveryStatus(item.status)}
                </PTPText>
              )}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) return <PTPLoading />;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        />

        {/* Input Area - iOS iMessage style */}
        <View style={styles.inputWrapper}>
          <View style={styles.inputContainer}>
            {/* Camera button (placeholder) */}
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="camera" size={24} color={colors.gray400} />
            </TouchableOpacity>

            {/* Text Input */}
            <View style={styles.textInputContainer}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { height: Math.max(36, Math.min(inputHeight, 100)) }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="iMessage"
                placeholderTextColor={colors.gray400}
                multiline
                maxLength={1000}
                onContentSizeChange={(e) =>
                  setInputHeight(e.nativeEvent.contentSize.height)
                }
              />
            </View>

            {/* Send Button */}
            {inputText.trim() ? (
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                disabled={isSending}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={32}
                  color={isSending ? colors.gray400 : iOSColors.sendButton}
                />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.iconButton}>
                <Ionicons name="mic" size={24} color={colors.gray400} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardView: {
    flex: 1,
  },
  messagesList: {
    paddingHorizontal: spacing[3],
    paddingTop: spacing[3],
    paddingBottom: spacing[2],
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: spacing[3],
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '500',
  },
  messageBubbleContainer: {
    marginBottom: spacing[1],
    maxWidth: '78%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: 18,
  },
  ownMessage: {
    backgroundColor: iOSColors.blue,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    backgroundColor: iOSColors.gray,
    borderBottomLeftRadius: 4,
  },
  ownMessageGrouped: {
    borderBottomRightRadius: 18,
    marginBottom: 2,
  },
  otherMessageGrouped: {
    borderBottomLeftRadius: 18,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 17,
    lineHeight: 22,
  },
  ownMessageText: {
    color: colors.white,
  },
  otherMessageText: {
    color: colors.inkBlack,
  },
  messageFooter: {
    flexDirection: 'row',
    marginTop: spacing[1],
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  ownFooter: {
    justifyContent: 'flex-end',
  },
  otherFooter: {
    justifyContent: 'flex-start',
  },
  timeText: {
    fontSize: 11,
  },
  statusText: {
    fontSize: 11,
    marginLeft: spacing[1],
  },
  inputWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing[2],
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: iOSColors.inputBg,
    borderRadius: 20,
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === 'ios' ? spacing[2] : 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.gray300,
  },
  input: {
    fontSize: 17,
    color: colors.inkBlack,
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ConversationDetailScreen;
