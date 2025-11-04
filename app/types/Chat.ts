import { Timestamp } from 'firebase/firestore'

// ==========================================
// CHAT MESSAGE MODEL
// ==========================================
// Stored in: trips/{tripId}/messages/{messageId}
export interface ChatMessage {
  id: string
  userId: string // ID of the user who sent the message
  userName: string // Cached for display (avoids extra lookups)
  userPhotoUrl?: string // Optional profile photo
  content: string
  createdAt: Timestamp
  updatedAt?: Timestamp // For edited messages
  isEdited: boolean
  isDeleted: boolean // Soft delete - keeps message structure but hides content

  // Message type support
  type: 'text' | 'image' | 'system' // Extensible for future types
  imageUrl?: string // If type is 'image'

  // Reactions support
  reactions?: {
    [emoji: string]: string[] // emoji -> array of userIds who reacted
  }

  // Reply/thread support (optional - for future enhancement)
  replyToMessageId?: string

  // Metadata
  metadata?: {
    [key: string]: any // For future extensions
  }
}

// ==========================================
// CHAT METADATA MODEL
// ==========================================
// Stored in: trips/{tripId}/chatMetadata/meta
// Single document that tracks chat-level information
export interface ChatMetadata {
  lastMessageAt: Timestamp
  lastMessageContent: string // Preview of last message (truncated)
  lastMessageUserId: string
  lastMessageUserName: string
  messageCount: number
  createdAt: Timestamp
}

// ==========================================
// USER READ STATUS MODEL
// ==========================================
// Stored in: trips/{tripId}/chatReadStatus/{userId}
// One document per user to track their read status
export interface UserReadStatus {
  userId: string
  lastReadAt: Timestamp
  lastReadMessageId: string // ID of last message they read
  unreadCount: number // Calculated based on messages after lastReadAt

  // Typing indicator support
  isTyping: boolean
  typingStartedAt?: Timestamp // Auto-clear if older than 5 seconds
}

// ==========================================
// CLIENT-SIDE HELPER INTERFACES
// ==========================================
// These aren't stored in Firebase but useful for your app logic

export interface ChatMessageWithStatus extends ChatMessage {
  isRead: boolean // Calculated based on current user's read status
  isMine: boolean // Whether current user sent this
  readBy?: string[] // Array of userIds who have read this message
}

export interface UnreadInfo {
  count: number
  lastUnreadMessage?: ChatMessage
  hasUnread: boolean
}

// ==========================================
// FIRESTORE HELPERS
// ==========================================
// Example helper functions for common operations

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
  userName: 'System',
  content,
  createdAt: Timestamp.now(),
  isEdited: false,
  isDeleted: false,
  type: 'system',
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

// ==========================================
// USAGE NOTES
// ==========================================
/*
FIRESTORE STRUCTURE:
trips/{tripId}/messages/{messageId} - ChatMessage documents
trips/{tripId}/chatMetadata/meta - Single ChatMetadata document
trips/{tripId}/chatReadStatus/{userId} - UserReadStatus documents

INDEXING RECOMMENDATIONS:
1. Composite index: messages collection on (createdAt, DESC)
2. Consider adding isDeleted to indexes if you query non-deleted messages

SECURITY RULES CONSIDERATIONS:
- Users should only read/write messages for trips they're members of
- Users can only update their own UserReadStatus document
- Users can only create messages with their own userId

REALTIME LISTENERS:
- Listen to messages collection for real-time chat updates
- Listen to chatReadStatus/{currentUserId} for read receipts
- Listen to chatReadStatus collection for typing indicators

UNREAD COUNT CALCULATION:
1. Query messages where createdAt > user's lastReadAt
2. Count results (or use messageCount - messages up to lastReadAt)
3. Update UserReadStatus.unreadCount periodically

OPTIMIZATION TIPS:
- Paginate messages (e.g., load last 50, then load more on scroll)
- Cache userName and userPhotoUrl to avoid user collection lookups
- Use Firestore transactions when updating messageCount
- Consider Cloud Functions to update ChatMetadata automatically
- Implement message batching for high-traffic chats

FUTURE ENHANCEMENTS:
- File attachments (add fileUrl, fileType, fileName fields)
- Message reactions (already supported with reactions field)
- Threading/replies (replyToMessageId already included)
- Push notifications (integrate with FCM using Cloud Functions)
- Message search (requires Algolia or similar)
- Read receipts (track readBy array in messages)
- Media galleries (filter messages by type: 'image')
*/
