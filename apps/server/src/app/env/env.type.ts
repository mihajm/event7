import { z } from 'zod';

const dbSchema = z.object({
  URL: z.string().url(),
  POOL_MIN: z.number().default(1),
  POOL_MAX: z.number().optional(),
  MIGRATING: z.boolean().default(false),
  SEEDING: z.boolean().default(false),
});

const adPermissionSchema = z.object({
  URL: z.string().url().optional(),
  USERNAME: z.string().optional(),
  PASSWORD: z.string().optional(),
});

export const envSchema = z.object({
  PORT: z.string().default('3000'),
  DB: dbSchema,
  AD_PERMISSION: adPermissionSchema,
  IP_API_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof envSchema>;
