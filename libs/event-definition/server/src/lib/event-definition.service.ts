import { FindManyOptions } from '@e7/common/db';
import {
  EventDefinitionColumn,
  InsertDefinition,
} from '@e7/event-definition/db';
import {
  CreateEventDefinitionDTO,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { Injectable } from '@nestjs/common';
import { AdsPermissionService } from './ads-permission.service';
import {
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

function isAlreadyFilteringAds(
  opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>,
) {
  const typeParam = opt?.filters?.type;
  if (!typeParam) return false;

  if (typeParam !== 'ads') return true;

  const notParam = opt?.filters?.['type.not'];

  if (!notParam) return false;

  if (notParam === 'ads') return true;

  return false;
}

function adPermissionFilters(ip: string, svc: AdsPermissionService) {
  return async (
    opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>,
  ): Promise<FindManyOptions<InsertDefinition, EventDefinitionColumn>> => {
    if (isAlreadyFilteringAds(opt) || (await svc.hasPermission(ip)))
      return opt ?? {};

    return {
      ...opt,
      filters: {
        ...opt?.filters,
        'type.not': 'ads',
      },
    };
  };
}

@Injectable()
export class EventDefinitionService {
  constructor(
    private readonly repo: EventDefinitionRepository,
    private readonly ads: AdsPermissionService,
  ) {}

  async list(
    ip: string,
    opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>,
  ) {
    return this.repo.findMany(await adPermissionFilters(ip, this.ads)(opt));
  }

  async listAndCount(
    ip: string,
    opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>,
  ) {
    return Promise.all([
      this.list(ip, opt),
      adPermissionFilters(ip, this.ads)(opt).then((f) => this.repo.count(f)),
    ]).then(([items, count]) => ({ items, count }));
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
