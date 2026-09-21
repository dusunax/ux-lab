import { Body, Controller, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { DecisionsService } from './decisions.service';
import { DecisionsBody } from './decisions.dto';

@ApiTags('decisions')
@Controller('decisions')
export class DecisionsController {
  constructor(private readonly decisionsService: DecisionsService) {}

  @Post()
  @ApiOperation({
    summary: 'OpenRouter Decisions(jev) 프록시',
    description:
      '~typesafe/jev-latest 모델로 state + questions를 보내 answers(확률 포함)를 받습니다.',
  })
  async decide(@Body() body: DecisionsBody, @Res() res: Response) {
    const { status, data } = await this.decisionsService.dispatch(body);
    res.status(status).json(data);
  }
}
