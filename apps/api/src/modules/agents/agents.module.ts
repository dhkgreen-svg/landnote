import { Module } from '@nestjs/common';
import { AgentsController, PublicAgentController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  controllers: [AgentsController, PublicAgentController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
