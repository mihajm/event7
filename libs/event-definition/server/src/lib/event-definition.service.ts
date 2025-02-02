import { EventDefinitionRepository } from '@e7/event-definition/db';
import {
  CreateEventDefinitionDTO,
  UpdateEventDefinitionDTO,
} from '@e7/event-definition/shared';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EventDefinitionService {
  constructor(private readonly repo: EventDefinitionRepository) {}

  list() {
    return this.repo.findMany();
  }

  get(id: string) {
    return this.repo.findOne(id);
  }

  create(e: CreateEventDefinitionDTO) {
    return this.repo.create(e);
  }

  update(id: string, e: UpdateEventDefinitionDTO) {
    return this.repo.update(id, {
      ...e,
      createdAt: undefined,
      updatedAt: undefined,
    });
  }

  archive(id: string) {
    return this.repo.update(id, {
      status: 'archived',
    });
  }
}
