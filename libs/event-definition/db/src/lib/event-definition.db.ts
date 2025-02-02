import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';
import * as schema from './event-definition.schema';

type EventDefinitionDatabase = NodePgDatabase<typeof schema>;

export function createEventDefinitionDB(pool: Pool): EventDefinitionDatabase {
  return drizzle(pool, {
    schema,
  });
}
