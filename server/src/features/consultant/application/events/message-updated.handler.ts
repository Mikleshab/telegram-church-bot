import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PubSubEngine } from 'graphql-subscriptions';
import { MessageUpdatedEvent } from '@features/consultant/application/events/message-updated.event';
import { MessageRepository } from '@features/consultant/application/ports/message.repository';

@EventsHandler(MessageUpdatedEvent)
export class MessageUpdatedHandler implements IEventHandler<MessageUpdatedEvent> {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly pubSub: PubSubEngine,
  ) {}

  async handle(event: MessageUpdatedEvent) {
    const message = await this.messageRepository.getMessageById(event.messageId);

    this.pubSub.publish(MessageUpdatedEvent.name, message);
  }
}
