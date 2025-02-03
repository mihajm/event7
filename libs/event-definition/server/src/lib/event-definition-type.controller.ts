import {
  EVENT_DEFINITION_TYPES,
  NO_PERMISSION_EVENT_TYPES,
} from '@e7/event-definition/shared';
import { Controller, Get, Ip } from '@nestjs/common';
import { AdsPermissionService } from './ads-permission.service';

@Controller('event-definition-type')
export class EventDefinitionTypeController {
  constructor(private readonly svc: AdsPermissionService) {}

  @Get()
  list(@Ip() ip: string) {
    return this.svc
      .hasPermission(ip)
      .then((r) => (r ? EVENT_DEFINITION_TYPES : NO_PERMISSION_EVENT_TYPES))
      .catch(() => NO_PERMISSION_EVENT_TYPES);
  }
}
