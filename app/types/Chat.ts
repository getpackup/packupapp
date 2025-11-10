import { Timestamp } from 'firebase/firestore'

export interface ChatMessage {
  id: string
  userId: string
  userName: string // Cached for display (avoids extra lookups)
  userPhotoUrl?: string
  content: string
  createdAt: Timestamp
  updatedAt?: Timestamp
  isEdited: boolean
  type: 'text' | 'image' | 'system'
  imageUrl?: string
  reactions?: {
    [emoji: string]: string[] // emoji -> array of userIds who reacted
  }
  replyToMessageId?: string
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
