import { DRIZZLE, type Database } from '@e7/common/db';
import { Inject, Injectable } from '@nestjs/common';
import { eq, type InferInsertModel } from 'drizzle-orm';
import type * as schema from './event-definition.schema';
import { eventDefinition } from './event-definition.schema';

type InsertDefinition = InferInsertModel<typeof schema.eventDefinition>;

type CreateEventDefinition = Omit<
  InsertDefinition,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: InsertDefinition['createdAt'];
  updatedAt?: InsertDefinition['updatedAt'];
};

type UpdateEventDefinition = Partial<CreateEventDefinition>;

@Injectable()
export class EventDefinitionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findMany() {
    return this.db.select().from(eventDefinition);
  }

  async findOne(id: string) {
    return this.db
      .select()
      .from(eventDefinition)
      .where(eq(eventDefinition.id, id))
      .then((r) => r.at(0) ?? null);
  }

  async create(data: CreateEventDefinition) {
    delete data.createdAt;
    delete data.updatedAt;

    return this.db
      .insert(eventDefinition)
      .values(data)
      .returning()
      .then((r) => r.at(0) ?? null);
  }

  async update(id: string, data: UpdateEventDefinition) {
    delete data.createdAt;
    delete data.updatedAt;
    delete data.id;

    return this.db
      .update(eventDefinition)
      .set(data)
      .where(eq(eventDefinition.id, id))
      .returning()
      .then((r) => r.at(0) ?? null);
  }
}
