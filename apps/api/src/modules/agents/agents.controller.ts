import { Controller, Patch, Get, Body, Param } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { ChangeCategoriesDto } from './dto/change-categories.dto';
import { UpdateAgentTemplatesDto } from './dto/update-agent-templates.dto';

@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Patch('me')
  async updateProfile(
    @CurrentAgent() agent: any,
    @Body() dto: UpdateAgentProfileDto,
  ) {
    return this.agentsService.updateProfile(agent, dto);
  }

  @Patch('me/categories')
  async changeCategories(
    @CurrentAgent() agent: any,
    @Body() dto: ChangeCategoriesDto,
  ) {
    return this.agentsService.changeCategories(agent, dto.categories as any);
  }

  @Patch('me/templates')
  async updateTemplates(
    @CurrentAgent() agent: any,
    @Body() dto: UpdateAgentTemplatesDto,
  ) {
    return this.agentsService.updateTemplates(agent, dto);
  }

  @Get('me/qr')
  async getQrCodes(@CurrentAgent() agent: any) {
    return this.agentsService.getQrCodes(agent);
  }
}

@Public()
@Controller('public')
export class PublicAgentController {
  constructor(private readonly agentsService: AgentsService) {}

  @Get('agent/:agentCode')
  async getPublicProfile(@Param('agentCode') agentCode: string) {
    return this.agentsService.getPublicProfile(agentCode);
  }
}
