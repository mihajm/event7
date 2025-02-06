import {
  createFindMany,
  DRIZZLE,
  FindManyOptions,
  resolveMaxCountLimit,
  type Database,
} from '@e7/common/db';
import {
  EVENT_DEFINITION_COLUMNS,
  eventDefinition,
  EventDefinitionColumn,
  InsertDefinition,
  resolveEventDefinitionSearch,
} from '@e7/event-definition/db';
import { Inject, Injectable } from '@nestjs/common';
import { count, eq } from 'drizzle-orm';

type CreateEventDefinition = Omit<
  InsertDefinition,
  'createdAt' | 'updatedAt'
> & {
  createdAt?: InsertDefinition['createdAt'];
  updatedAt?: InsertDefinition['updatedAt'];
};

export type UpdateEventDefinition = Partial<CreateEventDefinition>;

export const EVENT_DEFINITION_COLUMN_MAP = new Map(
  EVENT_DEFINITION_COLUMNS.map((c) => [c.name, c]),
);

@Injectable()
export class EventDefinitionRepository {
  private readonly buildFindMany = createFindMany(
    () => this.db.select().from(eventDefinition).$dynamic(),
    EVENT_DEFINITION_COLUMN_MAP,
    resolveEventDefinitionSearch,
  );

  private readonly buildCountFindMany = createFindMany(
    () => this.db.select({ count: count() }).from(eventDefinition).$dynamic(),
    EVENT_DEFINITION_COLUMN_MAP,
    resolveEventDefinitionSearch,
  );

  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findMany(opt?: FindManyOptions<EventDefinitionColumn>) {
    return this.buildFindMany(opt).execute();
  }

  async count(opt?: FindManyOptions<EventDefinitionColumn>) {
    const pagination = resolveMaxCountLimit(opt?.pagination);
    return this.buildCountFindMany({
      ...opt,
      sort: undefined,
      pagination,
    })
      .execute()
      .then((r) => {
        const count = +(r.at(0)?.count ?? 0);
        if (isNaN(count)) return 0;
        return count;
      })
      .catch(() => 0);
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

    return this.db
      .insert(eventDefinition)
      .values(data)
      .returning()
      .then((r) => r.at(0) ?? null);
  }

  async update(id: string, data: UpdateEventDefinition) {
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
