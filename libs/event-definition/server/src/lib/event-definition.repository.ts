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
import { count, desc, eq, getTableColumns, sql } from 'drizzle-orm';

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

    const selectStatement = hasSearchQuery
      ? this.db
          .select({
            ...getTableColumns(eventDefinition),
            rank: sql`ts_rank(
              setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
              setweight(to_tsvector('english', ${eventDefinition.description}), 'B'),
              websearch_to_tsquery('english', ${searchPhrase})
            )`,
            rankCd: sql`ts_rank_cd(
              setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
              setweight(to_tsvector('english', ${eventDefinition.description}), 'B'),
              websearch_to_tsquery('english', ${searchPhrase})
            )`,
          })
          .from(eventDefinition)
          .where(
            sql`(
            setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
            setweight(to_tsvector('english', ${eventDefinition.description}), 'B')
          ) @@ websearch_to_tsquery('english', ${searchPhrase})`,
          )
          .orderBy((t) => [desc(t.rank), desc(t.rankCd)])
      : this.db.select().from(eventDefinition);

    return buildFindMany(
      selectStatement.$dynamic(),
      EVENT_DEFINITION_COLUMN_MAP,
      {
        ...opt,
      },
    )
      .execute()
      .then((res) => {
        if (!hasSearchQuery) return res;

        type $ = (typeof res)[0];

        (res as ($ & { rank?: number; rankCd?: number })[]).forEach((r) => {
          delete r.rank;
          delete r.rankCd;
        });

        return res;
      });
  }

  async count(opt?: FindManyOptions<EventDefinitionColumn>) {
    const searchPhrase = opt?.search?.trim() ?? '';

    const selectStatement = searchPhrase
      ? this.db
          .select({
            count: count(),
          })
          .from(eventDefinition)
          .where(
            sql`(
            setweight(to_tsvector('english', ${eventDefinition.name}), 'A') ||
            setweight(to_tsvector('english', ${eventDefinition.description}), 'B')
          ) @@ websearch_to_tsquery('english', ${searchPhrase})`,
          )
      : this.db.select({ count: count() }).from(eventDefinition);

    return buildFindMany(
      selectStatement.$dynamic(),
      EVENT_DEFINITION_COLUMN_MAP,
      {
        ...opt,
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
