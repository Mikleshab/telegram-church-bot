import { Inject, Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { BOT_CALLBACK_HANDLER } from '@libs/telegram-bot/telegram-bot.module';
import { PressLocationsButtonCommand } from '@features/locations-message/application/press-locations-button.command';
import { MenuPayloadDto } from '@libs/telegram-bot/services/bot-callback.service';
import { MenuActions } from '@libs/bot-menu/types/menu-actions.enum';
import { isMenuCallback } from '@libs/bot-menu/types/callback.type';
import { TelegramBotCallback } from '@libs/telegram-bot/types/callback.interface';

@Injectable()
export class TelegramHandler {
  constructor(
    private readonly commandBus: CommandBus,
    @Inject(BOT_CALLBACK_HANDLER) private readonly callback: TelegramBotCallback,
  ) {}

  public listen(): void {
    this.callback.handleCallback(this.handleMenuActions.bind(this));
  }

  private handleMenuActions(data: MenuPayloadDto, ctx: { from: { id: number } }) {
    if (isMenuCallback(data)) {
      if (data.action === MenuActions.GET_LOCATIONS) {
        this.commandBus.execute(new PressLocationsButtonCommand(ctx.from.id));
      }
    }
  }
}
