import { ChatEventRepository } from '@features/events/application/repositories/chat-event.repository';
import { ChatEvent } from '@features/events/domain/model/chat-event';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetChatEventByAnnouncementIdQuery } from './get-chat-event-by-announcement-id.query';

@QueryHandler(GetChatEventByAnnouncementIdQuery)
export class GetChatEventByAnnouncementIdHandler implements IQueryHandler<GetChatEventByAnnouncementIdQuery> {
  constructor(private readonly repository: ChatEventRepository) {}

  async execute(query: GetChatEventByAnnouncementIdQuery): Promise<ChatEvent> {
    const { announcementId, chatId } = query;

    return this.repository.getOneByAnnouncementId(announcementId, chatId);
  }
}
