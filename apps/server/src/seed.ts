import { drizzle } from 'drizzle-orm/node-postgres';
// eslint-disable-next-line @nx/enforce-module-boundaries -- not part of build so can ignore internal import
import { seedEventDefinitions } from 'libs/event-definition/db/src/lib/seed';

async function main() {
  const url = process.env.DB_URL;
  if (!url) throw new Error('DB_URL is required');
  const count = parseInt(process.env.SEED_COUNT || '100', 10);

  const db = drizzle(url);

  await seedEventDefinitions(db, count);
}

main();

export {};
