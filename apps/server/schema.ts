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
