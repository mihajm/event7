import { Module } from '@nestjs/common';
import {
  AdsPermissionService,
  IPLocationService,
} from './ads-permission.service';
import { EventDefinitionTypeController } from './event-definition-type.controller';
import { EventDefinitionController } from './event-definition.controller';
import { EventDefinitionRepository } from './event-definition.repository';
import { EventDefinitionService } from './event-definition.service';

@Module({
  controllers: [EventDefinitionController, EventDefinitionTypeController],
  providers: [
    IPLocationService,
    AdsPermissionService,
    EventDefinitionRepository,
    EventDefinitionService,
  ],
})
export class EventDefinitionModule {}
