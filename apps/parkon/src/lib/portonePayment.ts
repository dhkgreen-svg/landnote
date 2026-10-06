// PortOne V2 Payment Integration for ParkGolf All-in-One (파크골프 올인원)

export const PORTONE_CONFIG = {
  storeId: 'store-dc14565c-d386-4d90-86ea-52cc5810dd25',
  channelKey: 'channel-key-0b062364-7264-4f25-b35f-a7e505c8dd42',
};

export type MembershipPlanId = 'COFFEE_SUPPORT' | 'VIP_PASS_MONTH' | 'LIFETIME_FOUNDER';

export interface MembershipPlan {
  id: MembershipPlanId;
  name: string;
  price: number;
  badge: string;
  description: string;
  features: string[];
}

export const MEMBERSHIP_PLANS: Record<MembershipPlanId, MembershipPlan> = {
  COFFEE_SUPPORT: {
    id: 'COFFEE_SUPPORT',
    name: '[파크골프 올인원] 따뜻한 커피 1잔 응원 후원',
    price: 3000,
    badge: '따뜻한 마음',
    description: '전국 400개 구장 정보와 룰북의 무료 공익 서비스를 응원해 주세요.',
    features: ['개발진 커피 한 잔 후원', '파크골프 올인원 감사 배지 제공', '전국 무료 서비스 운영 지원'],
  },
  VIP_PASS_MONTH: {
    id: 'VIP_PASS_MONTH',
    name: '[파크골프 올인원] VIP 프리미엄 1개월 이용권',
    price: 9900,
    badge: '인기 추천',
    description: '광고 없는 클린 화면, 전국 시합 실시간 알림, VIP 스코어보드 테마를 이용하세요.',
    features: ['앱 내 광고 완전 제거 (클린 모드)', '전국 400개 구장 실시간 날씨 위젯', '대회 및 번개 모임 우선 알림'],
  },
  LIFETIME_FOUNDER: {
    id: 'LIFETIME_FOUNDER',
    name: '[파크골프 올인원] 평생 프리미엄 마스터 멤버십',
    price: 49000,
    badge: '최고 등급',
    description: '한 번 결제로 평생 모든 프리미엄 기능과 명예의 전당 골드 마크를 부여받습니다.',
    features: ['평생 클라우드 스코어 영구 보관', '전국 랭킹 골드 마스터 왕관 배지', '향후 출시되는 모든 AI 기능 무료'],
  },
};

export interface RequestPaymentParams {
  planId: MembershipPlanId;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
}

export async function requestPortOnePayment(params: RequestPaymentParams) {
  const plan = MEMBERSHIP_PLANS[params.planId];
  if (!plan) {
    throw new Error('유효하지 않은 상품입니다.');
  }

  // Generate unique order ID
  const orderId = `pg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  if (typeof window === 'undefined') {
    throw new Error('결제는 브라우저 환경에서만 진행 가능합니다.');
  }

  const portone = (window as any).PortOne;
  if (!portone || typeof portone.requestPayment !== 'function') {
    throw new Error('결제 모듈을 로드 중입니다. 잠시 후 다시 시도해 주세요.');
  }

  try {
    const response = await portone.requestPayment({
      storeId: PORTONE_CONFIG.storeId,
      channelKey: PORTONE_CONFIG.channelKey,
      paymentId: orderId,
      orderName: plan.name,
      totalAmount: plan.price,
      currency: 'KRW',
      customer: {
        fullName: params.customerName || '파크골프 회원',
        phoneNumber: params.customerPhone || '010-0000-0000',
        email: params.customerEmail || 'contact@parkgolfallinone.com',
      },
      windowType: {
        pc: 'IFRAME',
        mobile: 'REDIRECTION',
      },
      redirectUrl: `${window.location.origin}/?payment=success&orderId=${orderId}`,
    });

    return {
      success: !response?.code,
      response,
      orderId,
      plan,
    };
  } catch (error: any) {
    console.error('PortOne payment error:', error);
    return {
      success: false,
      error: error?.message || '결제 진행 중 오류가 발생했습니다.',
      orderId,
      plan,
    };
  }
}
