import { drizzle } from 'drizzle-orm/node-postgres';
import { type Pool } from 'pg';
import * as schema from './event-definition.schema';
import { type EventDefinitionDatabase } from './event-definition.type';

export function createEventDefinitionDB(pool: Pool): EventDefinitionDatabase {
  return drizzle(pool, {
    schema,
  });
}
