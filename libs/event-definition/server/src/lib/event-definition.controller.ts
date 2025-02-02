import {
  CreateEventDefinitionDTO,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { EventDefinitionService } from './event-definition.service';

@Controller('event-definition')
export class EventDefinitionController {
  constructor(private readonly svc: EventDefinitionService) {}

  @Get()
  list() {
    return this.svc.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.svc.get(id);
  }

  @Post()
  create(@Body() body: CreateEventDefinitionDTO) {
    return this.svc.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: UpdateEventDefinitionDTO) {
    return this.svc.update(id, body);
  }
}
