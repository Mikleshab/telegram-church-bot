import { MessageRepository } from '@features/consultant/application/ports/message.repository';
import { ConversationMessage } from '@features/consultant/domain/models/conversation-message';
import { Conversation } from '@features/consultant/domain/value-objects/conversation';
import { ConversationMapper } from '@features/consultant/infrastructure/firebase/mappers/conversation.mapper';
import { MessageMapper } from '@features/consultant/infrastructure/firebase/mappers/message.mapper';
import { FirebaseService } from '@libs/firebase/services/firebase.service';
import * as admin from 'firebase-admin';
import { CONVERSATIONS, CONVERSATIONS_MESSAGES } from 'src/common/constants/collections';

export class MessagesCollection implements MessageRepository {
  constructor(private readonly firebase: FirebaseService) {}

  async saveMessage(conversation: Conversation, message: ConversationMessage): Promise<void> {
    const messageData = MessageMapper.toDocData(message);
    const conversationData = ConversationMapper.toDocData(conversation);

    const db = this.firebase.app.firestore();
    const messageRef = db.collection(CONVERSATIONS_MESSAGES).doc(message.telegramMessageId.toString());
    const conversationRef = db.collection(CONVERSATIONS).doc(conversation.client.userId.toString());

    await db.runTransaction(async (transaction) => {
      transaction.set(messageRef, messageData);

      transaction.set(conversationRef, conversationData);

      if (message.replyToMessageId) {
        const parentDocRef = db.collection(CONVERSATIONS_MESSAGES).doc(message.replyToMessageId.toString());
        transaction.update(parentDocRef, {
          replyCount: admin.firestore.FieldValue.increment(1),
        });
      }
    });
  }

  async getMessages(
    filter: {
      authorId?: ConversationMessage['author']['userId'];
      replyToMessageId: ConversationMessage['replyToMessageId'];
    },
    pageInfo: { first?: number; after?: string },
  ): Promise<ConversationMessage[]> {
    const db = this.firebase.app.firestore();
    const messagesRef = db.collection(CONVERSATIONS_MESSAGES);

    let query = filter.replyToMessageId
      ? messagesRef.where('replyToMessageId', '==', filter.replyToMessageId)
      : messagesRef.where('author.userId', '==', filter.authorId).where('replyToMessageId', '==', null);

    query = query.orderBy('timestamp', 'desc');

    if (pageInfo.first) {
      query = query.limit(pageInfo.first);
    }

    if (pageInfo.after) {
      const afterTimestamp = admin.firestore.Timestamp.fromMillis(parseInt(pageInfo.after, 10));

      query = query.startAfter(afterTimestamp);
    }

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return [];
    }

    const docs = querySnapshot.docs;

    return docs.map((doc) => MessageMapper.toDomain(doc.data()));
  }

  async getMessageById(telegramMessageId: ConversationMessage['telegramMessageId']): Promise<ConversationMessage> {
    const db = this.firebase.app.firestore();
    const messageRef = db.collection(CONVERSATIONS_MESSAGES).doc(telegramMessageId.toString());

    const doc = await messageRef.get();

    if (!doc.exists) {
      throw new Error(`Message does not exist with id "${telegramMessageId}"`);
    }

    return MessageMapper.toDomain(doc.data());
  }
}
