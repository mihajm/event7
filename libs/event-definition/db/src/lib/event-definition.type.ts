import { type InferSelectModel } from 'drizzle-orm';
import { type NodePgDatabase } from 'drizzle-orm/node-postgres';
import type * as schema from './event-definition.schema';

export type EventDefinition = InferSelectModel<typeof schema.eventDefinition>;
export type EventDefinitionDatabase = NodePgDatabase<typeof schema>;
