/**
 * Messages API Module
 *
 * Handles in-app messaging between parents and trainers.
 * Uses REST polling for v1 (no websockets required).
 *
 * TODO: Implement real-time updates
 * - Consider websockets or Firebase for real-time messaging
 * - Implement read receipts
 * - Add image/video attachment support
 */

import { apiClient } from './client';
import { apiConfig } from './config';
import {
  Message,
  Conversation,
  MessagesResponse,
  ConversationsResponse,
  SendMessageRequest,
  SendMessageResponse,
  StartConversationRequest,
  StartConversationResponse,
} from '../types';

// Polling interval for new messages (in milliseconds)
export const MESSAGE_POLL_INTERVAL = 10000; // 10 seconds

/**
 * Get all conversations for the current user
 *
 * GET /wp-json/ptp/v1/messages/conversations
 */
export const getConversations = async (): Promise<ConversationsResponse> => {
  if (apiConfig.demoMode) {
    return { conversations: mockConversations, total: mockConversations.length };
  }

  const response = await apiClient.get('/messages/conversations');
  return response.data;
};

/**
 * Get messages for a specific conversation
 *
 * GET /wp-json/ptp/v1/messages?conversation_id=...
 */
export const getMessages = async (
  conversationId: number,
  limit = 50,
  before?: number
): Promise<MessagesResponse> => {
  if (apiConfig.demoMode) {
    return getMockMessages(conversationId);
  }

  const params = new URLSearchParams();
  params.append('conversation_id', conversationId.toString());
  params.append('limit', limit.toString());
  if (before) params.append('before', before.toString());

  const response = await apiClient.get(`/messages?${params.toString()}`);
  return response.data;
};

/**
 * Send a message
 *
 * POST /wp-json/ptp/v1/messages
 */
export const sendMessage = async (data: SendMessageRequest): Promise<SendMessageResponse> => {
  if (apiConfig.demoMode) {
    return mockSendMessage(data);
  }

  const response = await apiClient.post('/messages', data);
  return response.data;
};

/**
 * Start a new conversation
 *
 * POST /wp-json/ptp/v1/messages/conversations
 */
export const startConversation = async (
  data: StartConversationRequest
): Promise<StartConversationResponse> => {
  if (apiConfig.demoMode) {
    return mockStartConversation(data);
  }

  const response = await apiClient.post('/messages/conversations', data);
  return response.data;
};

/**
 * Mark messages as read
 *
 * POST /wp-json/ptp/v1/messages/read
 */
export const markAsRead = async (conversationId: number): Promise<void> => {
  if (apiConfig.demoMode) {
    // Update mock data
    const conv = mockConversations.find((c) => c.id === conversationId);
    if (conv) conv.unreadCount = 0;
    return;
  }

  await apiClient.post('/messages/read', { conversation_id: conversationId });
};

/**
 * Get unread message count
 *
 * GET /wp-json/ptp/v1/messages/unread-count
 */
export const getUnreadCount = async (): Promise<number> => {
  if (apiConfig.demoMode) {
    return mockConversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }

  const response = await apiClient.get('/messages/unread-count');
  return response.data.count;
};

// ============================================================
// MOCK DATA FOR DEMO MODE
// ============================================================

const mockConversations: Conversation[] = [
  {
    id: 1,
    participantIds: [1, 101],
    participants: [
      { id: 1, name: 'Sarah Johnson', role: 'parent' },
      { id: 101, name: 'Marcus Williams', role: 'trainer', avatarUrl: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg' },
    ],
    lastMessage: {
      content: 'Great session today! Jake is really improving on his weak foot.',
      senderName: 'Marcus Williams',
      senderType: 'trainer',
      createdAt: '2024-11-28T18:30:00Z',
    },
    unreadCount: 1,
    relatedSessionId: 1,
    status: 'active',
    createdAt: '2024-11-20T10:00:00Z',
    updatedAt: '2024-11-28T18:30:00Z',
  },
  {
    id: 2,
    participantIds: [1, 0],
    participants: [
      { id: 1, name: 'Sarah Johnson', role: 'parent' },
      { id: 0, name: 'PTP Support', role: 'support' },
    ],
    lastMessage: {
      content: 'Your refund has been processed. Let us know if you have any other questions!',
      senderName: 'PTP Support',
      senderType: 'support',
      createdAt: '2024-11-25T14:00:00Z',
    },
    unreadCount: 0,
    status: 'active',
    createdAt: '2024-11-24T09:00:00Z',
    updatedAt: '2024-11-25T14:00:00Z',
  },
];

const mockMessages: { [conversationId: number]: Message[] } = {
  1: [
    {
      id: 1,
      conversationId: 1,
      senderId: 1,
      senderType: 'parent',
      senderName: 'Sarah Johnson',
      content: 'Hi Marcus! Looking forward to Jake\'s session this Thursday.',
      status: 'read',
      readAt: '2024-11-27T10:05:00Z',
      createdAt: '2024-11-27T10:00:00Z',
      updatedAt: '2024-11-27T10:00:00Z',
    },
    {
      id: 2,
      conversationId: 1,
      senderId: 101,
      senderType: 'trainer',
      senderName: 'Marcus Williams',
      senderAvatarUrl: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
      content: 'Hey Sarah! Looking forward to it too. Does Jake want to focus on anything specific?',
      status: 'read',
      readAt: '2024-11-27T10:30:00Z',
      createdAt: '2024-11-27T10:15:00Z',
      updatedAt: '2024-11-27T10:15:00Z',
    },
    {
      id: 3,
      conversationId: 1,
      senderId: 1,
      senderType: 'parent',
      senderName: 'Sarah Johnson',
      content: 'He really wants to work on finishing with his left foot. He\'s been struggling with that in games.',
      status: 'read',
      readAt: '2024-11-27T11:00:00Z',
      createdAt: '2024-11-27T10:45:00Z',
      updatedAt: '2024-11-27T10:45:00Z',
    },
    {
      id: 4,
      conversationId: 1,
      senderId: 101,
      senderType: 'trainer',
      senderName: 'Marcus Williams',
      senderAvatarUrl: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
      content: 'Perfect! I\'ll prepare some specific drills for weak foot finishing. We\'ll work on technique first then move to game situations.',
      status: 'read',
      readAt: '2024-11-27T12:00:00Z',
      createdAt: '2024-11-27T11:30:00Z',
      updatedAt: '2024-11-27T11:30:00Z',
    },
    {
      id: 5,
      conversationId: 1,
      senderId: 101,
      senderType: 'trainer',
      senderName: 'Marcus Williams',
      senderAvatarUrl: 'https://ptpsummercamps.com/wp-content/uploads/2025/12/BG7A1915.jpg',
      content: 'Great session today! Jake is really improving on his weak foot. He was hitting the corners by the end of our session. Keep encouraging him to practice at home!',
      status: 'delivered',
      createdAt: '2024-11-28T18:30:00Z',
      updatedAt: '2024-11-28T18:30:00Z',
    },
  ],
  2: [
    {
      id: 10,
      conversationId: 2,
      senderId: 1,
      senderType: 'parent',
      senderName: 'Sarah Johnson',
      content: 'Hi, I need to request a refund for the Winter Clinic on Dec 28. We have a family conflict.',
      status: 'read',
      createdAt: '2024-11-24T09:00:00Z',
      updatedAt: '2024-11-24T09:00:00Z',
    },
    {
      id: 11,
      conversationId: 2,
      senderId: 0,
      senderType: 'support',
      senderName: 'PTP Support',
      content: 'Hi Sarah! No problem at all. I can process a full refund for the Winter Clinic. It will be credited back to your original payment method within 5-7 business days.',
      status: 'read',
      createdAt: '2024-11-24T10:30:00Z',
      updatedAt: '2024-11-24T10:30:00Z',
    },
    {
      id: 12,
      conversationId: 2,
      senderId: 1,
      senderType: 'parent',
      senderName: 'Sarah Johnson',
      content: 'Thank you so much! That was fast!',
      status: 'read',
      createdAt: '2024-11-24T11:00:00Z',
      updatedAt: '2024-11-24T11:00:00Z',
    },
    {
      id: 13,
      conversationId: 2,
      senderId: 0,
      senderType: 'support',
      senderName: 'PTP Support',
      content: 'Your refund has been processed. Let us know if you have any other questions!',
      status: 'read',
      createdAt: '2024-11-25T14:00:00Z',
      updatedAt: '2024-11-25T14:00:00Z',
    },
  ],
};

const getMockMessages = async (conversationId: number): Promise<MessagesResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 200));

  const messages = mockMessages[conversationId] || [];
  return {
    messages: [...messages].reverse(), // Return newest first
    hasMore: false,
  };
};

const mockSendMessage = async (data: SendMessageRequest): Promise<SendMessageResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newMessage: Message = {
    id: Date.now(),
    conversationId: data.conversationId,
    senderId: 1,
    senderType: 'parent',
    senderName: 'Sarah Johnson',
    content: data.content,
    attachmentUrls: data.attachmentUrls,
    status: 'sent',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Add to mock messages
  if (!mockMessages[data.conversationId]) {
    mockMessages[data.conversationId] = [];
  }
  mockMessages[data.conversationId].push(newMessage);

  // Update conversation last message
  const conv = mockConversations.find((c) => c.id === data.conversationId);
  if (conv) {
    conv.lastMessage = {
      content: data.content,
      senderName: 'Sarah Johnson',
      senderType: 'parent',
      createdAt: newMessage.createdAt,
    };
    conv.updatedAt = newMessage.createdAt;
  }

  return {
    success: true,
    message: newMessage,
  };
};

const mockStartConversation = async (
  data: StartConversationRequest
): Promise<StartConversationResponse> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const newConversation: Conversation = {
    id: Date.now(),
    participantIds: [1, data.recipientId],
    participants: [
      { id: 1, name: 'Sarah Johnson', role: 'parent' },
      {
        id: data.recipientId,
        name: data.recipientType === 'support' ? 'PTP Support' : 'Trainer',
        role: data.recipientType,
      },
    ],
    unreadCount: 0,
    relatedSessionId: data.relatedSessionId,
    relatedProgramId: data.relatedProgramId,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (data.initialMessage) {
    newConversation.lastMessage = {
      content: data.initialMessage,
      senderName: 'Sarah Johnson',
      senderType: 'parent',
      createdAt: newConversation.createdAt,
    };
  }

  mockConversations.unshift(newConversation);

  return {
    success: true,
    conversation: newConversation,
  };
};

export { mockConversations };
