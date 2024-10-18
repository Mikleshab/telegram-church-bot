import { Module } from '@nestjs/common';
import { DevtoolsModule } from '@nestjs/devtools-integration';
import { InitializersModule } from '@initializers/initializers.module';
import { FirebaseModule } from '@libs/firebase/firebase.module';
import { TelegramBotModule } from '@libs/telegram-bot/telegram-bot.module';
import { FeaturesModule } from '@features/features.module';
import { ScheduleModule } from '@nestjs/schedule';

const libs = [FirebaseModule, TelegramBotModule];

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ...libs,
    InitializersModule,
    FeaturesModule,
    DevtoolsModule.register({
      http: process.env.NODE_ENV !== 'production',
    }),
  ],
})
export class AppModule {}