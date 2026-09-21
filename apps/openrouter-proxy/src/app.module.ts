import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';
import { ChatModule } from './chat/chat.module';
import { DecisionsModule } from './decisions/decisions.module';

// dist/app.module.js 기준 → apps/openrouter-proxy/.env
const envFilePath = resolve(__dirname, '../.env');

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath }),
    ChatModule,
    DecisionsModule,
  ],
})
export class AppModule {}
