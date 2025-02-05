import {
  CreateEventDefinitionDTO,
  createEventDefinitionSchema,
  EventDefinition,
  EventDefinitionChangeEvent,
  UpdateEventDefinitionDTO,
  updateEventDefinitionSchema,
} from '@e7/event-definition/shared';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Ip,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  Response,
  Sse,
} from '@nestjs/common';
import {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { map, Observable } from 'rxjs';
import { fromError, isZodErrorLike } from 'zod-validation-error';
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
    @Response() res: ExpressResponse,
    @Request() req: ExpressRequest,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('sort') sort?: string | string[],
    @Query('search') search?: string | string[],
  ) {
    const searchQuery = Array.isArray(search) ? search.at(0) : search;

    const { items, count } = await this.svc.listAndCount(
      ip,
      {
        pagination: {
          offset: offset ?? 0,
          limit: limit ?? 10,
        },
        sort: Array.isArray(sort) ? sort : sort ? [sort] : undefined,
        search: searchQuery,
      },
      req.query,
    );

    return res
      .set('Content-Range', contentRange(count, offset ?? 0, limit ?? 10))
      .json(items satisfies EventDefinition[]);
  }

  @Get(':id')
  get(
    @Param('id') id: string,
    @Ip() ip: string,
  ): Promise<EventDefinition | null> {
    return this.svc.get(id, ip);
  }

  @Post()
  create(
    @Body() body: CreateEventDefinitionDTO,
    @Ip() ip: string,
    @Request() req: ExpressRequest,
  ): Promise<EventDefinition> {
    try {
      const validated = createEventDefinitionSchema.parse(body);
      const clientId = req.headers['x-client-id'];
      return this.svc.create(
        validated,
        ip,
        typeof clientId === 'string' && clientId ? clientId : undefined,
      );
    } catch (e) {
      if (isZodErrorLike(e)) throw new BadRequestException(fromError(e));
      throw new InternalServerErrorException();
    }
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateEventDefinitionDTO,
    @Ip() ip: string,
    @Request() req: ExpressRequest,
  ): Promise<EventDefinition> {
    try {
      const validated = updateEventDefinitionSchema.parse(body);
      const clientId = req.headers['x-client-id'];
      return this.svc.update(
        id,
        validated,
        ip,
        typeof clientId === 'string' && clientId ? clientId : undefined,
      );
    } catch (e) {
      if (isZodErrorLike(e)) throw new BadRequestException(fromError(e));
      throw new InternalServerErrorException();
    }
  }

  @Sse('changes/:id')
  changes(@Param('id') clientId: string, @Ip() ip: string) {
    const changes$ = this.svc.changes(
      clientId,
      ip,
    ) satisfies Observable<EventDefinitionChangeEvent>;
    return changes$.pipe(map((e) => JSON.stringify(e)));
  }
}
