import { Timestamp } from 'firebase/firestore'

import type { ChatMessage, ChatMetadata, UserReadStatus } from '~/types/Chat'

export const createChatMessage = (
  userId: string,
  userName: string,
  content: string,
  userPhotoUrl?: string
): Omit<ChatMessage, 'id'> => ({
  userId,
  userName,
  userPhotoUrl,
  content,
  createdAt: Timestamp.now(),
  isEdited: false,
  isDeleted: false,
  type: 'text',
  reactions: {},
})

export const createSystemMessage = (content: string): Omit<ChatMessage, 'id'> => ({
  userId: 'system',
  userName: 'Packup Yak',
  content,
  createdAt: Timestamp.now(),
  isEdited: false,
  isDeleted: false,
  type: 'system',
  userPhotoUrl: '/icons/icon-192x192.png',
})

export const initializeChatMetadata = (): ChatMetadata => ({
  lastMessageAt: Timestamp.now(),
  lastMessageContent: '',
  lastMessageUserId: '',
  lastMessageUserName: '',
  messageCount: 0,
  createdAt: Timestamp.now(),
})

export const initializeUserReadStatus = (userId: string): UserReadStatus => ({
  userId,
  lastReadAt: Timestamp.now(),
  lastReadMessageId: '',
  unreadCount: 0,
  isTyping: false,
})
