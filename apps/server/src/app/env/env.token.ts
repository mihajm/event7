import { type Provider, InjectionToken } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type Env, envSchema } from './env.type';

export const CONFIG: InjectionToken<Env> = 'EVENT7_CONFIG';

export function provideConfig(): Provider {
  return {
    provide: CONFIG,
    useFactory: (cfg: ConfigService<Record<string, unknown>>): Env => {
      return envSchema.parse({
        PORT: cfg.get('PORT'),
        DB: {
          URL: cfg.get('DB_URL'),
          POOL_MIN: cfg.get('DB_POOL_MIN'),
          POOL_MAX: cfg.get('DB_POOL_MAX'),
          MIGRATING: cfg.get('DB_MIGRATING'),
          SEEDING: cfg.get('DB_SEEDING'),
        },
        IP_API_URL: cfg.get('IP_API_URL'),
        AD_PERMISSION: {
          URL: cfg.get('AD_PERMISSION_URL'),
          USERNAME: cfg.get('AD_PERMISSION_USERNAME'),
          PASSWORD: cfg.get('AD_PERMISSION_PASSWORD'),
        },
      });
    },
    inject: [ConfigService],
  };
}
