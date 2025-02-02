import { DatabaseModule } from '@e7/common/db';
import { EventDefinitionModule } from '@e7/event-definition/server';
import { Module } from '@nestjs/common';
import { CONFIG, EnvModule } from './env';

@Module({
  imports: [
    EnvModule,
    DatabaseModule.forRootAsync({
      resolveOptions: (cfg) => ({
        url: cfg.DB.URL,
        pool: {
          min: cfg.DB.POOL_MIN,
          max: cfg.DB.POOL_MAX,
        },
      }),
      inject: [CONFIG],
    }),
    EventDefinitionModule,
  ],
})
export class AppModule {}
