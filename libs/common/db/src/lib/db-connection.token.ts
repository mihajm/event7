import { type InjectionToken, type Provider } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Database = NodePgDatabase<Record<string, never>> & {
  $client: Pool;
};

export const DRIZZLE: InjectionToken<Database> = 'EVENT7_DRIZZLE';

type DrizzleOptions = {
  url: string;
  pool?: {
    min?: number;
    max?: number;
  };
};

export type ProvideDrizzleOptions<TConfig> = {
  resolveOptions: (conf: TConfig) => DrizzleOptions;
  inject: Array<InjectionToken<TConfig>>;
};

export function provideDrizzle<TConfig>(
  opt: ProvideDrizzleOptions<TConfig>,
): Provider {
  return {
    provide: DRIZZLE,
    useFactory: (config: TConfig): Database => {
      const { url, pool = {} } = opt.resolveOptions(config);
      const dbPool = new Pool({
        connectionString: url,
        min: pool.min,
        max: pool.max,
      });
      return drizzle(dbPool);
    },
    inject: opt.inject,
  };
}
