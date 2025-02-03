import {
  CreateEventDefinitionDTO,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import {
  Body,
  Controller,
  Get,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Response,
} from '@nestjs/common';
import { Response as Res } from 'express';
import { EventDefinitionService } from './event-definition.service';

function contentRange(total: number, offset: number, limit: number) {
  let end = offset + limit;

  if (end > total) {
    end = total;
  }

  return `items ${offset}-${end}/${total}`;
}

@Controller('event-definition')
export class EventDefinitionController {
  constructor(private readonly svc: EventDefinitionService) {}

  @Get()
  async list(
    @Ip() ip: string,
    @Response() res: Res,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const { items, count } = await this.svc.listAndCount(ip, {
      pagination: {
        offset: offset ?? 0,
        limit: limit ?? 10,
      },
    });

    return res
      .set('Content-Range', contentRange(count, offset ?? 0, limit ?? 10))
      .json(items);
  }

  @Get(':id')
  get(@Param('id') id: string, @Ip() ip: string) {
    return this.svc.get(id, ip);
  }

  @Post()
  create(@Body() body: CreateEventDefinitionDTO, @Ip() ip: string) {
    return this.svc.create(body, ip);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateEventDefinitionDTO,
    @Ip() ip: string,
  ) {
    return this.svc.update(id, body, ip);
  }
}
