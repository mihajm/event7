import { ColumnName, SortParameter } from '@e7/common/db';
import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { v7 } from 'uuid';

export const eventDefinitionType = pgEnum('eventDefinitionType', [
  'crosspromo',
  'liveops',
  'app',
  'ads',
]);

export const eventDefinitionStatus = pgEnum('eventDefinitionStatus', [
  'draft',
  'ready',
  'active',
  'archived',
]);

export const eventDefinition = pgTable('eventDefinition', {
  id: uuid()
    .$defaultFn(() => v7())
    .primaryKey(),
  name: text().notNull(),
  description: text().notNull(),
  type: eventDefinitionType().notNull(),
  priority: integer().notNull().default(0),
  status: eventDefinitionStatus().notNull().default('draft'),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow(),
});

export const EVENT_DEFINITION_COLUMNS = [
  eventDefinition.id,
  eventDefinition.name,
  eventDefinition.description,
  eventDefinition.type,
  eventDefinition.priority,
  eventDefinition.status,
  eventDefinition.createdAt,
  eventDefinition.updatedAt,
];

const keys = new Set(EVENT_DEFINITION_COLUMNS.map((c) => c.name));

export type EventDefinitionColumn = (typeof EVENT_DEFINITION_COLUMNS)[number];

export type EventDefinitionSort = SortParameter<
  ColumnName<EventDefinitionColumn>
>;

export function isEventDefinitionSort(
  sort: string,
): sort is EventDefinitionSort {
  const nonDirectional = sort.replace('-', '');
  return keys.has(nonDirectional);
}

export function toEventDefinitionSort(
  sort?: string | string[],
): EventDefinitionSort[] {
  if (!sort) return [];
  const arr = Array.isArray(sort) ? sort : [sort];

  return arr.filter(isEventDefinitionSort);
}
