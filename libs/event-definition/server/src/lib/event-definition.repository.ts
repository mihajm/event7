import {
  buildFindMany,
  DRIZZLE,
  FindManyOptions,
  type Database,
} from '@e7/common/db';
import {
  EVENT_DEFINITION_COLUMNS,
  eventDefinition,
  EventDefinitionColumn,
  InsertDefinition,
} from '@e7/event-definition/db';
import { Inject, Injectable } from '@nestjs/common';
import { count, eq, not } from 'drizzle-orm';
import { PgSelect } from 'drizzle-orm/pg-core';

type CreateEventDefinition = Omit<
  InsertDefinition,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: InsertDefinition['createdAt'];
  updatedAt?: InsertDefinition['updatedAt'];
};

export type UpdateEventDefinition = Partial<CreateEventDefinition>;

function addFilters<T extends PgSelect>(
  qb: T,
  filters?: FindManyOptions<InsertDefinition, EventDefinitionColumn>['filters'],
) {
  if (!filters) return qb;

  if (filters.id) qb.where(eq(eventDefinition.id, filters.id));

  if (filters['id.not'])
    qb.where(not(eq(eventDefinition.id, filters['id.not'])));

  if (filters.name) qb.where(eq(eventDefinition.name, filters.name));

  if (filters['name.not'])
    qb.where(not(eq(eventDefinition.name, filters['name.not'])));

  if (filters.type) qb.where(eq(eventDefinition.type, filters.type));

  if (filters['type.not'])
    qb.where(not(eq(eventDefinition.type, filters['type.not'])));

  if (filters.priority)
    qb.where(eq(eventDefinition.priority, filters.priority));

  if (filters['priority.not'])
    qb.where(not(eq(eventDefinition.priority, filters['priority.not'])));

  if (filters.status) qb.where(eq(eventDefinition.status, filters.status));

  if (filters['status.not'])
    qb.where(not(eq(eventDefinition.status, filters['status.not'])));

  if (filters.createdAt)
    qb.where(eq(eventDefinition.createdAt, filters.createdAt));

  if (filters['createdAt.not'])
    qb.where(not(eq(eventDefinition.createdAt, filters['createdAt.not'])));

  if (filters.updatedAt)
    qb.where(eq(eventDefinition.updatedAt, filters.updatedAt));

  if (filters['updatedAt.not'])
    qb.where(not(eq(eventDefinition.updatedAt, filters['updatedAt.not'])));

  return qb;
}

@Injectable()
export class EventDefinitionRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findMany(
    opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>,
  ) {
    return addFilters(
      buildFindMany(
        this.db.select().from(eventDefinition).$dynamic(),
        EVENT_DEFINITION_COLUMNS,
        opt,
      ),
      opt?.filters,
    ).execute();
  }

  async count(opt?: FindManyOptions<InsertDefinition, EventDefinitionColumn>) {
    return addFilters(
      buildFindMany(
        this.db.select({ count: count() }).from(eventDefinition).$dynamic(),
        EVENT_DEFINITION_COLUMNS,
        {
          ...opt,
          sort: undefined,
          pagination: undefined,
        },
      ),
      opt?.filters,
    )
      .execute()
      .then((r) => {
        const count = +(r.at(0)?.count ?? 0);
        if (isNaN(count)) return 0;
        return count;
      });
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
    delete data.updatedAt;
    delete data.createdAt;
    delete data.id;

    return this.db
      .update(eventDefinition)
      .set(data)
      .where(eq(eventDefinition.id, id))
      .returning()
      .then((r) => r.at(0) ?? null);
  }
}
