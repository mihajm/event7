import { Module, type DynamicModule } from '@nestjs/common';
import {
  provideDrizzle,
  type ProvideDrizzleOptions,
} from './db-connection.token';

@Module({})
export class DatabaseModule {
  static forRootAsync<TConfig>(
    opt: ProvideDrizzleOptions<TConfig>,
  ): DynamicModule {
    const providers = [provideDrizzle(opt)];

    return {
      global: true,
      module: DatabaseModule,
      providers: providers,
      exports: providers,
    };
  }
}
