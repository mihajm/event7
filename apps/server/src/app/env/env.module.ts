import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CONFIG, provideConfig } from './env.token';

@Global()
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [provideConfig()],
  exports: [CONFIG],
})
export class EnvModule {}
