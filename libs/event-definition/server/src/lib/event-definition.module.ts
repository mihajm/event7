import { DynamicModule, Module } from '@nestjs/common';
import {
  ProvideAdPermissionOptions,
  provideAdPermissionService,
} from './ads-permission.service';
import { EventDefinitionTypeController } from './event-definition-type.controller';
import { EventDefinitionController } from './event-definition.controller';
import { EventDefinitionRepository } from './event-definition.repository';
import { EventDefinitionService } from './event-definition.service';

@Module({})
export class EventDefinitionModule {
  static forRootAsync<TConfig>(
    provideOpt?: ProvideAdPermissionOptions<TConfig>,
  ): DynamicModule {
    const permissionServices = provideAdPermissionService(provideOpt);
    return {
      global: true,
      module: EventDefinitionModule,
      providers: [
        ...permissionServices,
        EventDefinitionRepository,
        EventDefinitionService,
      ],
      controllers: [EventDefinitionController, EventDefinitionTypeController],
    };
  }
}
