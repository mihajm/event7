import { type Config, defineConfig } from 'drizzle-kit';
import { resolve } from 'node:path';

const baseConfig: Pick<Config, 'migrations'> & {
  dialect: 'postgresql';
} = {
  dialect: 'postgresql',
  migrations: {
    prefix: 'timestamp',
  },
};

export function createEventDefinitionConfig(url: string): Config {
  return defineConfig({
    ...baseConfig,
    schema: resolve(__dirname, './event-definition.schema.ts'),
    out: resolve(__dirname, '../../migrations'),
    dbCredentials: {
      url,
    },
  });
}

// lib internal
export default defineConfig({
  ...baseConfig,
  schema: './src/lib/event-definition.schema.ts',
  out: './migrations',
});
