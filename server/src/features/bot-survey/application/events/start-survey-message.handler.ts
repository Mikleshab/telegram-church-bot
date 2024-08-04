import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BOT_SENDER } from '@libs/telegram-bot/telegram-bot.module';
import { StartSurveyMessageEvent } from '@features/bot-survey/domain/events/start-survey-message.event';
import { TelegramBotSender } from '@libs/telegram-bot/types/sender.interface';

@EventsHandler(StartSurveyMessageEvent)
export class StartSurveyMessageHandler implements IEventHandler<StartSurveyMessageEvent> {
  constructor(@Inject(BOT_SENDER) private readonly sender: TelegramBotSender) {}

  async handle(event: StartSurveyMessageEvent) {
    const { userId, survey } = event;

    const questions = survey.getKeyboards();

    const { title, keyboard } = questions[0];
    this.sender.sendMessage(userId, survey.toTelegramText());
    this.sender.sendMessage(userId, title, keyboard);
  }
}
