import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, source, purchasePurpose, briefingPreference } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // 1. CRM DB 저장 (Supabase vip_leads 테이블)
    const supabase = createClient();
    
    const { error: dbError } = await supabase
      .from('vip_leads')
      .insert([
        { 
          name, 
          phone, 
          source: source || 'beomeo-160',
          purchase_purpose: purchasePurpose || null,
          briefing_preference: briefingPreference || null
        }
      ]);
      
    if (dbError) {
      console.error('Supabase 저장 실패:', dbError);
      // DB 저장 실패해도 알림톡과 디스코드는 보내도록 진행
    } else {
      console.log(`[LandNote CRM] VIP 리드(DB) 저장 성공! (이름: ${name})`);
    }

    // 2. 다이렉트센드 알림톡 전송 시뮬레이션
    console.log(`[다이렉트센드 API 호출] 알림톡 발송 중... 대상: ${phone}`);
    console.log(`메시지 내용: "요청하신 범어동 160억 빌딩 상세 제안서를 송부드립니다. 프라이빗 투어를 원하시면 이 톡으로 회신 주십시오. - 구미나우공인중개사 대표 OOO 올림"`);
    console.log('알림톡 발송 완료! (시뮬레이션)\n');

    // 3. 디스코드 알림 발송 (실제 연동)
    const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1524234313393115187/jEMao8PuDp6mS21XW1bxu0ZKaXRgl74bwdwHRwk6ZFEmX_rI-IVQlsfkmvP4UhahZ9B7';
    
    if (DISCORD_WEBHOOK_URL) {
      const discordMessage = {
        embeds: [{
          title: '🚨 [LandNote] 새로운 VIP 리드 접수!',
          color: 0xFACC15, // Yellow/Gold
          fields: [
            { name: '👤 성함/법인명', value: name, inline: true },
            { name: '📱 연락처', value: phone, inline: true },
            { name: '🏢 매입 목적', value: purchasePurpose || '미선택', inline: true },
            { name: '🤝 브리핑 희망', value: briefingPreference || '미선택', inline: true },
            { name: '📍 유입 경로', value: source || 'beomeo-160', inline: false },
            { name: '⏰ 접수 시간', value: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }), inline: false }
          ],
          footer: {
            text: 'LandNote CRM System'
          }
        }]
      };

      try {
        await fetch(DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discordMessage),
        });
        console.log('디스코드 알림 발송 완료!');
      } catch (e) {
        console.error('디스코드 알림 발송 실패:', e);
      }
    }

    return NextResponse.json({ success: true, message: 'VIP Lead saved, Alimtalk simulated, and Discord alert sent' });
  } catch (error) {
    console.error('Error processing lead:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
