import { faker } from '@faker-js/faker';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { reset } from 'drizzle-seed';
import { InsertDefinition } from './event-definition-db.type';
import { eventDefinition } from './event-definition.schema';

function oneOf<T>(values: T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function generateEventDefinition(): InsertDefinition {
  return {
    name: faker.word.verb(),
    description: faker.lorem.sentence(),
    type: oneOf(['crosspromo', 'liveops', 'app', 'ads']),
    status: oneOf(['draft', 'ready', 'active', 'archived']),
    priority: faker.number.int({ min: 0, max: 10 }),
  };
}

export async function seedEventDefinitions<T extends NodePgDatabase>(
  db: T,
  count = 100,
) {
  await reset(db, { eventDefinition });
  await db
    .insert(eventDefinition)
    .values(Array.from({ length: count }).map(() => generateEventDefinition()))
    .execute();
}
