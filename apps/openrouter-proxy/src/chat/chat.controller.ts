import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatBody } from './chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatBody, @Res() res: Response) {
    const { status, data } = await this.chatService.dispatch(body);
    res.status(status).json(data);
  }
}
