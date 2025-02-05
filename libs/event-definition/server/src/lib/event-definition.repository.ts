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
import { count, eq, sql } from 'drizzle-orm';

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
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findMany(opt?: FindManyOptions<EventDefinitionColumn>) {
    const hasSearchQuery = opt?.search && opt.search.trim().length > 0;
    const searchPhrase = opt?.search?.trim() ?? '';

    const selectStatement = this.db.select().from(eventDefinition);

    return buildFindMany(
      selectStatement.$dynamic(),
      EVENT_DEFINITION_COLUMN_MAP,
      {
        ...opt,
        search: hasSearchQuery
          ? sql`(
          setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
          setweight(to_tsvector('english', ${eventDefinition.description}), 'B')
        ) @@ websearch_to_tsquery('english', ${searchPhrase})`
          : undefined,
      },
    ).execute();
  }

  async count(opt?: FindManyOptions<EventDefinitionColumn>) {
    const hasSearchQuery = opt?.search && opt.search.trim().length > 0;

    const searchPhrase = opt?.search?.trim() ?? '';

    const selectStatement = searchPhrase
      ? this.db
          .select({
            count: count(),
          })
          .from(eventDefinition)
      : this.db.select({ count: count() }).from(eventDefinition);

    return buildFindMany(
      selectStatement.$dynamic(),
      EVENT_DEFINITION_COLUMN_MAP,
      {
        ...opt,
        search: hasSearchQuery
          ? sql`(
          setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
          setweight(to_tsvector('english', ${eventDefinition.description}), 'B')
        ) @@ websearch_to_tsquery('english', ${searchPhrase})`
          : undefined,
        sort: undefined,
        pagination: undefined,
      },
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
