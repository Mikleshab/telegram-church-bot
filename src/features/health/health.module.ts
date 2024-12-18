import { Module } from '@nestjs/common';
import { HealthController } from '@features/health/health.controller';

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
