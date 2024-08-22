import { MessageRepository } from '@features/bot-consultant/application/message.repository';
import { MessageDomain } from '@features/bot-consultant/domain/message.domain';
import { FirebaseService } from '@libs/firebase/services/firebase.service';
import { MessageMapper } from '@features/bot-consultant/infrastructure/firebase/mappers/message.mapper';
import { Conversation } from '@features/bot-consultant/domain/value-objects/conversation';
import { ConversationMapper } from '@features/bot-consultant/infrastructure/firebase/mappers/conversation.mapper';
import * as admin from 'firebase-admin';

export class MessagesCollection implements MessageRepository {
  private readonly messagesCollectionName = 'messages';
  private readonly conversationsCollectionName = 'conversations';

  constructor(private readonly firebase: FirebaseService) {}

  async saveMessage(conversation: Conversation, message: MessageDomain): Promise<void> {
    const messageData = MessageMapper.toDocData(message);
    const conversationData = ConversationMapper.toDocData(conversation);

    const db = this.firebase.app.firestore();
    const messageRef = db.collection(this.messagesCollectionName).doc(message.messageId);
    const conversationRef = db.collection(this.conversationsCollectionName).doc(conversation.client.userId);

    await db.runTransaction(async (transaction) => {
      transaction.set(messageRef, messageData);

      transaction.set(conversationRef, conversationData);

      if (message.parentId) {
        const parentDocRef = db.collection(this.messagesCollectionName).doc(message.parentId);
        transaction.update(parentDocRef, {
          replyCount: admin.firestore.FieldValue.increment(1),
        });
      }
    });
  }

  async getMessages(
    filter: {
      authorId?: MessageDomain['author']['userId'];
      parentId: MessageDomain['parentId'];
    },
    pageInfo: { first?: number; after?: string },
  ): Promise<MessageDomain[]> {
    const db = this.firebase.app.firestore();
    const messagesRef = db.collection(this.messagesCollectionName);

    let query = filter.parentId
      ? messagesRef.where('parentId', '==', filter.parentId)
      : messagesRef.where('author.userId', '==', filter.authorId).where('parentId', '==', null);

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

  async getMessageById(messageId: MessageDomain['messageId']): Promise<MessageDomain> {
    const db = this.firebase.app.firestore();
    const messageRef = db.collection(this.messagesCollectionName).doc(messageId);

    const doc = await messageRef.get();

    if (!doc.exists) {
      throw new Error(`Message does not exist with id "${messageId}"`);
    }

    return MessageMapper.toDomain(doc.data());
  }

  async addTelegramMessageId(
    messageId: MessageDomain['messageId'],
    telegramMessageId: MessageDomain['telegramMessageId'],
  ): Promise<void> {
    const db = this.firebase.app.firestore();
    const messageRef = db.collection(this.messagesCollectionName).doc(messageId);

    await db.runTransaction(async (transaction) => {
      const messageDoc = await transaction.get(messageRef);

      if (messageDoc.exists) {
        transaction.update(messageRef, { telegramMessageId });
      }
    });
  }

  async getMessageByTelegramId(telegramMessageId: MessageDomain['telegramMessageId']): Promise<MessageDomain> {
    const db = this.firebase.app.firestore();
    const messagesRef = db.collection(this.messagesCollectionName);

    const querySnapshot = await messagesRef.where('telegramMessageId', '==', telegramMessageId).limit(1).get();

    if (querySnapshot.empty) {
      throw new Error(`Message does not exist with telegramMessageId "${telegramMessageId}"`);
    }

    const doc = querySnapshot.docs[0];
    return MessageMapper.toDomain(doc.data());
  }
}