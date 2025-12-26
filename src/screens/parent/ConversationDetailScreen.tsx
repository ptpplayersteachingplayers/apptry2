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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ParentStackParamList } from '../../types/navigation';
import { Message, Conversation } from '../../types';
import {
  getMessages,
  sendMessage,
  markAsRead,
  getConversation,
  sendTypingIndicator,
  getTypingStatus,
  getOnlineStatus,
  formatLastSeen,
  TYPING_INDICATOR_TIMEOUT,
} from '../../api/messages';
import { PTPText, PTPLoading } from '../../components';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';

type ConversationDetailRouteProp = RouteProp<ParentStackParamList, 'ConversationDetail'>;

// iOS iMessage colors
const iOSColors = {
  blue: '#007AFF',
  gray: '#E9E9EB',
  inputBg: '#F6F6F6',
  sendButton: '#007AFF',
};

// Typing indicator dots animation component
const TypingIndicator: React.FC = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDots = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
            Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
          ]),
        ])
      ).start();
    };
    animateDots();
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        {[dot1, dot2, dot3].map((dot, index) => (
          <Animated.View
            key={index}
            style={[
              styles.typingDot,
              {
                opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const ConversationDetailScreen: React.FC = () => {
  const route = useRoute<ConversationDetailRouteProp>();
  const navigation = useNavigation();
  const { conversationId } = route.params;

  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(36);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Get other participant info
  const otherParticipant = conversation?.participants.find((p) => p.role !== 'parent');
  const onlineStatus = otherParticipant ? getOnlineStatus(otherParticipant.id) : null;

  // Poll for new messages and typing status
  useFocusEffect(
    useCallback(() => {
      const messageInterval = setInterval(loadMessages, 5000);
      const typingInterval = setInterval(() => {
        setIsOtherTyping(getTypingStatus(conversationId));
      }, 1000);

      return () => {
        clearInterval(messageInterval);
        clearInterval(typingInterval);
      };
    }, [conversationId])
  );

  useEffect(() => {
    loadConversation();
    loadMessages();
    markAsRead(conversationId);
  }, [conversationId]);

  // Update header with online status
  useEffect(() => {
    if (otherParticipant && onlineStatus) {
      navigation.setOptions({
        headerTitle: () => (
          <View style={styles.headerTitle}>
            <PTPText variant="body" weight="semiBold" numberOfLines={1}>
              {otherParticipant.name}
            </PTPText>
            <View style={styles.onlineStatusContainer}>
              {onlineStatus.isOnline && <View style={styles.onlineDot} />}
              <PTPText variant="caption" color="gray400">
                {onlineStatus.isOnline ? 'Active now' : formatLastSeen(onlineStatus.lastSeen)}
              </PTPText>
            </View>
          </View>
        ),
      });
    }
  }, [otherParticipant, onlineStatus, navigation]);

  const loadConversation = async () => {
    try {
      const conv = await getConversation(conversationId);
      setConversation(conv);
    } catch (error) {
      console.error('Error loading conversation:', error);
    }
  };

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

  // Send typing indicator when user types
  const handleInputChange = (text: string) => {
    setInputText(text);

    // Throttle typing indicator - send at most once per 2 seconds
    const now = Date.now();
    if (text.length > 0 && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      sendTypingIndicator(conversationId);
    }

    // Reset typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    // Haptic feedback on send
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const messageContent = inputText.trim();
    setInputText('');
    setInputHeight(36);
    setIsSending(true);

    // Optimistic update - add message immediately with animation
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

      // Haptic feedback on success
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      // Haptic feedback on error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

  // Render checkmark icons for message status
  const renderDeliveryStatus = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return (
          <View style={styles.statusIconContainer}>
            <Ionicons name="time-outline" size={14} color={colors.gray400} />
          </View>
        );
      case 'sent':
        return (
          <View style={styles.statusIconContainer}>
            <Ionicons name="checkmark" size={14} color={colors.gray400} />
          </View>
        );
      case 'delivered':
        return (
          <View style={styles.statusIconContainer}>
            <View style={styles.doubleCheck}>
              <Ionicons name="checkmark" size={14} color={colors.gray400} style={{ marginRight: -6 }} />
              <Ionicons name="checkmark" size={14} color={colors.gray400} />
            </View>
          </View>
        );
      case 'read':
        return (
          <View style={styles.statusIconContainer}>
            <View style={styles.doubleCheck}>
              <Ionicons name="checkmark" size={14} color={iOSColors.blue} style={{ marginRight: -6 }} />
              <Ionicons name="checkmark" size={14} color={iOSColors.blue} />
            </View>
          </View>
        );
      case 'failed':
        return (
          <View style={styles.statusIconContainer}>
            <Ionicons name="alert-circle" size={14} color={colors.error} />
            <PTPText variant="caption" color="error" style={{ marginLeft: 2 }}>
              Failed
            </PTPText>
          </View>
        );
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
              {showDeliveryStatus && item.status && renderDeliveryStatus(item.status)}
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
          ListFooterComponent={isOtherTyping ? <TypingIndicator /> : null}
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
                onChangeText={handleInputChange}
                placeholder="Message"
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
    backgroundColor: colors.blackCard,
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
    borderTopWidth: 2,
    borderTopColor: colors.gray700,
    backgroundColor: colors.blackCard,
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
    backgroundColor: colors.gray700,
    borderRadius: 0,
    paddingHorizontal: spacing[3],
    paddingVertical: Platform.OS === 'ios' ? spacing[2] : 0,
    borderWidth: 2,
    borderColor: colors.gray700,
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
  // Header title with online status
  headerTitle: {
    alignItems: 'center',
  },
  onlineStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759', // iOS green
  },
  // Typing indicator styles
  typingContainer: {
    alignSelf: 'flex-start',
    marginBottom: spacing[2],
    marginLeft: spacing[1],
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: iOSColors.gray,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.gray500,
  },
  // Status icon styles
  statusIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing[1],
  },
  doubleCheck: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default ConversationDetailScreen;
