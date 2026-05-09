import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenrouterService } from '../openrouter/openrouter.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, OpenrouterService],
})
export class ChatModule {}
