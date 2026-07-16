import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import * as webpush from 'web-push';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class NotificationsService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  constructor() {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      webpush.setVapidDetails(
        `mailto:${process.env.RESEND_FROM_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );
    }
  }

  async subscribe(agentId: string, dto: PushSubscriptionDto) {
    const { data, error } = await this.supabase
      .from('push_subscriptions')
      .upsert(
        {
          agent_id: agentId,
          endpoint: dto.endpoint,
          auth_key: dto.auth_key,
          p256dh_key: dto.p256dh_key,
          is_active: true,
        },
        { onConflict: 'agent_id,endpoint' },
      )
      .select()
      .single();

    if (error) throw new Error(`구독 저장 실패: ${error.message}`);
    return data;
  }

  async unsubscribe(agentId: string, endpoint: string) {
    await this.supabase
      .from('push_subscriptions')
      .delete()
      .eq('agent_id', agentId)
      .eq('endpoint', endpoint);

    return { deleted: true };
  }

  async sendPush(agentId: string, payload: { title: string; body: string; url?: string }) {
    const { data: subs } = await this.supabase
      .from('push_subscriptions')
      .select('id, endpoint, auth_key, p256dh_key')
      .eq('agent_id', agentId)
      .eq('is_active', true);

    if (!subs || subs.length === 0) return;

    const results = await Promise.allSettled(
      subs.map(sub =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { auth: sub.auth_key, p256dh: sub.p256dh_key },
          },
          JSON.stringify(payload),
        ),
      ),
    );

    // 만료/삭제된 구독 비활성화 (410 Gone, 404 Not Found)
    const expiredIds: string[] = [];
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const statusCode = (result.reason as any)?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          expiredIds.push(subs[i].id);
        }
      }
    });

    if (expiredIds.length > 0) {
      await this.supabase
        .from('push_subscriptions')
        .update({ is_active: false })
        .in('id', expiredIds);
    }
  }
}
