import { Controller, Post, Body, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatBody } from './chat.dto';

@ApiTags('chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  @ApiOperation({
    summary: 'OpenRouter chat completions 프록시',
    description:
      '요청 모델이 429이면 같은 그룹(image/text) 폴백 모델을 순서대로 자동 시도합니다.',
  })
  async chat(@Body() body: ChatBody, @Res() res: Response) {
    const { status, data } = await this.chatService.dispatch(body);
    res.status(status).json(data);
  }
}
