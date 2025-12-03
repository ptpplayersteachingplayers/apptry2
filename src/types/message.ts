/**
 * Message-related TypeScript types
 *
 * Defines types for in-app messaging between parents and trainers.
 */

// Message sender type
export type MessageSender = 'parent' | 'trainer' | 'support';

// Message status
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Conversation status
export type ConversationStatus = 'active' | 'archived';

/**
 * Message
 * Individual message in a conversation
 */
export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderType: MessageSender;
  senderName: string;
  senderAvatarUrl?: string;

  // Content
  content: string;
  attachmentUrls?: string[];

  // Status
  status: MessageStatus;
  readAt?: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation
 * A conversation between parent and trainer (or support)
 */
export interface Conversation {
  id: number;
  participantIds: number[];
  participants: ConversationParticipant[];

  // Last message preview
  lastMessage?: MessagePreview;
  unreadCount: number;

  // Related context (optional - e.g., linked to a session)
  relatedSessionId?: number;
  relatedProgramId?: number;

  // Status
  status: ConversationStatus;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Conversation participant
 */
export interface ConversationParticipant {
  id: number;
  name: string;
  avatarUrl?: string;
  role: MessageSender;
}

/**
 * Message preview for conversation list
 */
export interface MessagePreview {
  content: string;
  senderName: string;
  senderType: MessageSender;
  createdAt: string;
}

/**
 * Send message request
 */
export interface SendMessageRequest {
  conversationId: number;
  content: string;
  attachmentUrls?: string[];
}

/**
 * Send message response
 */
export interface SendMessageResponse {
  success: boolean;
  message: Message;
}

/**
 * Get messages request
 */
export interface GetMessagesRequest {
  conversationId: number;
  limit?: number;
  before?: number; // Message ID for pagination
}

/**
 * Messages API response
 */
export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

/**
 * Conversations API response
 */
export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

/**
 * Start conversation request
 * Used when parent initiates a conversation with a trainer
 */
export interface StartConversationRequest {
  recipientId: number;
  recipientType: 'trainer' | 'support';
  initialMessage?: string;
  relatedSessionId?: number;
  relatedProgramId?: number;
}

/**
 * Start conversation response
 */
export interface StartConversationResponse {
  success: boolean;
  conversation: Conversation;
}

/**
 * Message notification payload
 * For push notification display
 */
export interface MessageNotification {
  conversationId: number;
  messageId: number;
  senderName: string;
  preview: string;
}
