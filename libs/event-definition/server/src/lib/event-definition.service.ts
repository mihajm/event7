import { FindManyOptions, toFilterEntries } from '@e7/common/db';
import { removeEmptyKeys } from '@e7/common/object';
import { EventDefinitionColumn } from '@e7/event-definition/db';
import {
  CreateEventDefinitionDTO,
  EventDefinition,
  EventDefinitionChangeEvent,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { filter, from, map, Subject, switchMap } from 'rxjs';
import { AdsPermissionService } from './ads-permission.service';
import {
  EVENT_DEFINITION_COLUMN_MAP,
  EventDefinitionRepository,
  UpdateEventDefinition,
} from './event-definition.repository';

function parseUpdateDTO(
  id: string,
  dto: UpdateEventDefinitionDTO,
): UpdateEventDefinition {
  const obj: UpdateEventDefinition = {
    id,
  };

  if (dto.name) obj.name = dto.name;
  if (dto.description) obj.description = dto.description;
  if (dto.priority) obj.priority = dto.priority;
  if (dto.status) obj.status = dto.status;
  if (dto.type) obj.type = dto.type;

  return obj;
}

function isAlreadyFilteringAds(opt?: FindManyOptions<EventDefinitionColumn>) {
  const typeParamFilters = opt?.filters?.filter(([key]) =>
    key.includes('type'),
  );
  if (!typeParamFilters?.length) return false;

  return typeParamFilters.some(([key, value]) => {
    const filteringForOthers = value !== 'ads' && key === 'type.eq';
    if (filteringForOthers) return true;
    return value === 'ads' && key === 'type.neq';
  });
}

function adPermissionFilters(ip: string, svc: AdsPermissionService) {
  return async (
    opt?: FindManyOptions<EventDefinitionColumn>,
  ): Promise<FindManyOptions<EventDefinitionColumn>> => {
    if (isAlreadyFilteringAds(opt) || (await svc.hasPermission(ip)))
      return opt ?? {};

    return {
      ...opt,
      filters: [
        ...(opt?.filters?.filter(([key]) => !key.includes('type')) ?? []),
        ['type.neq', 'ads'],
      ],
    };
  };
}

@Injectable()
export class EventDefinitionService {
  private readonly events$ = new Subject<EventDefinitionChangeEvent>();

  constructor(
    private readonly repo: EventDefinitionRepository,
    private readonly ads: AdsPermissionService,
  ) {}

  async list(ip: string, opt?: FindManyOptions<EventDefinitionColumn>) {
    return this.repo.findMany(await adPermissionFilters(ip, this.ads)(opt));
  }

  async count(ip: string, opt?: FindManyOptions<EventDefinitionColumn>) {
    return this.repo.count(
      await adPermissionFilters(
        ip,
        this.ads,
      )({ ...opt, pagination: undefined, sort: undefined }),
    );
  }

  async listAndCount(
    ip: string,
    opt?: Omit<FindManyOptions<EventDefinitionColumn>, 'filters'>,
    queryParams?: ExpressRequest['query'],
  ): Promise<{ items: EventDefinition[]; count: number }> {
    const resolvedOpt = await adPermissionFilters(
      ip,
      this.ads,
    )({
      ...opt,
      filters: toFilterEntries(EVENT_DEFINITION_COLUMN_MAP, queryParams),
    });

    return Promise.all([
      this.list(ip, resolvedOpt),
      this.count(ip, resolvedOpt),
    ])
      .then(([items, count]) => ({ items, count }))
      .catch((e) => {
        Logger.error(`Error listing and counting events: ${e}`);
        return {
          items: [],
          count: 0,
        };
      });
  }

  async get(id: string, ip: string) {
    const found = await this.repo.findOne(id);
    if (found?.type !== 'ads') return found;
    if (!found) throw new NotFoundException(`Event with id ${id} not found`);
    const ads = await this.ads.hasPermission(ip);
    if (ads) return found;
    throw new UnauthorizedException(`Not allowed to get ads events`);
  }

  async create(e: CreateEventDefinitionDTO, ip: string, clientId?: string) {
    if (e.type === 'ads' && !(await this.ads.hasPermission(ip)))
      throw new UnauthorizedException(`Not allowed to create ads events`);
    const created = await this.repo.create(e);
    if (created)
      this.events$.next({ value: created, clientId, type: 'create' });
    return created;
  }

  async update(
    id: string,
    e: UpdateEventDefinitionDTO,
    ip: string,
    clientId?: string,
  ) {
    const found = await this.repo.findOne(id);
    if (!found) throw new NotFoundException(`Event with id ${id} not found`);

    const canModify =
      found.type !== 'ads' || (await this.ads.hasPermission(ip));

    if (!canModify)
      throw new UnauthorizedException(`Not allowed to update ads events`);

    const updated = await this.repo.update(id, parseUpdateDTO(id, e));
    if (updated)
      this.events$.next({
        value: {
          ...removeEmptyKeys(e),
          id,
          type: updated.type,
          updatedAt: updated.updatedAt,
        },
        clientId,
        type: 'update',
      });

    return updated;
  }

  archive(id: string, ip: string, clientId?: string) {
    return this.update(
      id,
      {
        status: 'archived',
      },
      ip,
      clientId,
    );
  }

  changes(clientId: string, ip: string) {
    return from(this.ads.hasPermission(ip))
      .pipe(
        switchMap((hasPermission) =>
          this.events$.pipe(
            filter((e) => {
              // Do not send ads events to clients without permission
              if (e.value.type === 'ads' && !hasPermission) return false;
              // Do not send to the client that triggered the event
              if (e.clientId === clientId) return false;
              return true;
            }),
          ),
        ),
      )
      .pipe(map((e) => ({ value: e.value, type: e.type })));
  }
}
