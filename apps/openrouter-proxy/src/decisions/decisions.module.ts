import { Module } from '@nestjs/common';
import { DecisionsController } from './decisions.controller';
import { DecisionsService } from './decisions.service';
import { OpenrouterService } from '../openrouter/openrouter.service';

@Module({
  controllers: [DecisionsController],
  providers: [DecisionsService, OpenrouterService],
})
export class DecisionsModule {}
