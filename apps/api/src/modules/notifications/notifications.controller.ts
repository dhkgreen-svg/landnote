import { Controller, Post, Delete, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { PushSubscriptionDto } from './dto/push-subscription.dto';
import { CurrentAgent } from '../../common/decorators/current-agent.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  subscribe(@CurrentAgent() agent: any, @Body() dto: PushSubscriptionDto) {
    return this.notificationsService.subscribe(agent.id, dto);
  }

  @Delete('unsubscribe')
  unsubscribe(@CurrentAgent() agent: any, @Body('endpoint') endpoint: string) {
    return this.notificationsService.unsubscribe(agent.id, endpoint);
  }
}
