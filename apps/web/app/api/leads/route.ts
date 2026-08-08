import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, source } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    // 1. CRM DB 저장 시뮬레이션 (실제로는 Prisma나 NestJS API 호출)
    console.log('\n====================================');
    console.log('[LandNote CRM] 새로운 VIP 리드 수집됨!');
    console.log(`이름(법인명): ${name}`);
    console.log(`연락처: ${phone}`);
    console.log(`유입 경로: ${source || 'beomeo-160'}`);
    console.log('====================================');

    // 2. 다이렉트센드 알림톡 전송 시뮬레이션
    console.log(`[다이렉트센드 API 호출] 알림톡 발송 중... 대상: ${phone}`);
    console.log(`메시지 내용: "요청하신 범어동 160억 빌딩 상세 제안서를 송부드립니다. 프라이빗 투어를 원하시면 이 톡으로 회신 주십시오. - 구미나우공인중개사 대표 OOO 올림"`);
    console.log('알림톡 발송 완료! (시뮬레이션)\n');

    return NextResponse.json({ success: true, message: 'VIP Lead saved and Alimtalk sent' });
  } catch (error) {
    console.error('Error processing lead:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
