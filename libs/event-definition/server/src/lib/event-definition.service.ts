import { FindManyOptions, toFilterEntries } from '@e7/common/db';
import { EventDefinitionColumn } from '@e7/event-definition/db';
import {
  CreateEventDefinitionDTO,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { Injectable, Logger } from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
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
  ) {
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

    const ads = await this.ads.hasPermission(ip);
    if (ads) return found;

    return null;
  }

  async create(e: CreateEventDefinitionDTO, ip: string) {
    if (e.type === 'ads' && !(await this.ads.hasPermission(ip))) return null;
    return this.repo.create(e);
  }

  async update(id: string, e: UpdateEventDefinitionDTO, ip: string) {
    const verified = await this.ads.hasPermission(ip);
    if (verified) return this.repo.update(id, parseUpdateDTO(id, e));

    const found = await this.repo.findOne(id);
    // doesnt have permission to update this event
    if (!found) return null;

    return this.repo.update(id, parseUpdateDTO(id, e));
  }

  archive(id: string, ip: string) {
    return this.update(
      id,
      {
        status: 'archived',
      },
      ip,
    );
  }
}
