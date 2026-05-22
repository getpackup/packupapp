import type { Firestore } from 'firebase-admin/firestore'

import type { ChatMessage, ChatMetadataWritePayload } from '../../app/types/Chat'

const CONTENT_PREVIEW_LENGTH = 100

export interface ChatMetadataDeps {
  writeMetadata: (data: ChatMetadataWritePayload) => Promise<void>
}

export async function processChatMessage(
  message: Pick<ChatMessage, 'userId' | 'userName' | 'content' | 'createdAt'>,
  deps: ChatMetadataDeps
): Promise<void> {
  const preview =
    message.content.length > CONTENT_PREVIEW_LENGTH
      ? message.content.slice(0, CONTENT_PREVIEW_LENGTH)
      : message.content

  await deps.writeMetadata({
    lastMessageAt: message.createdAt,
    lastMessageContent: preview,
    lastMessageUserId: message.userId,
    lastMessageUserName: message.userName,
  })
}

export function buildChatMetadataDeps(db: Firestore, tripId: string): ChatMetadataDeps {
  return {
    writeMetadata: async (data) => {
      const { FieldValue } = await import('firebase-admin/firestore')
      await db
        .collection('trips')
        .doc(tripId)
        .collection('chatMetadata')
        .doc('meta')
        .set({ ...data, messageCount: FieldValue.increment(1) }, { merge: true })
    },
  }
}
