import { EventDefinitionRepository } from '@e7/event-definition/db';
import { Module } from '@nestjs/common';
import { EventDefinitionController } from './event-definition.controller';
import { EventDefinitionService } from './event-definition.service';

@Module({
  controllers: [EventDefinitionController],
  providers: [EventDefinitionRepository, EventDefinitionService],
})
export class EventDefinitionModule {}
