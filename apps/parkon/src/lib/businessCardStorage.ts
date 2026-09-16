import { UserBusinessCard } from '@/types/businessCard';
import { ParkOnStorage } from './storage';

const STORAGE_KEYS = {
  MY_CARD: 'parkon_my_business_card_v1',
  EXCHANGED_CARDS: 'parkon_exchanged_business_cards_v1',
};

// 기본 샘플/예시 동호인 명함 목록 (비즈니스 마켓 및 둘러보기용)
export const SAMPLE_COMMUNITY_CARDS: UserBusinessCard[] = [
  {
    id: 'sample_card_ceo',
    userId: 'user_kim_dh',
    name: '김대희',
    company: '나우공인중개사사무소',
    title: '대표 / 공인중개사',
    phone: '010-3814-1422',
    email: 'dhkgreen@naver.com',
    region: '경북 구미 · 대구 수성구',
    industry: '부동산/중개/자산',
    bio: '대구 수성구 범어동 160억 통빌딩 및 구미 전지역 상가·토지 전문 매칭. 파크온 창립자 겸 파크골프 동호인입니다.',
    visibility: 'PUBLIC',
    updatedAt: '2026-09-16',
    isSample: true,
  },
  {
    id: 'sample_card_golf_shop',
    userId: 'user_hong_gd',
    name: '홍길동',
    company: '동락 파크골프 종합백화점',
    title: '대표',
    phone: '054-480-1234',
    email: 'parkon_hong@golf.kr',
    region: '경북 구미',
    industry: '파크골프/용품/레저',
    bio: '혼마·미즈노·피닉스 공인 파크골프채, 특수 4피스 볼, 파우치 및 그립 무료 교체. 파크온 회원 10% 특별 우대!',
    visibility: 'PUBLIC',
    updatedAt: '2026-09-15',
    isSample: true,
  },
  {
    id: 'sample_card_clinic',
    userId: 'user_kim_park',
    name: '김파크',
    company: '수성 맑은 한의원',
    title: '대표원장 / 한의학박사',
    phone: '053-750-5678',
    email: 'clear_clinic@naver.com',
    region: '대구 수성구',
    industry: '의료/병원/한의원/건강',
    bio: '파크골프 엘보, 어깨·허리 회전근개 통증 집중 치료. 동호인 맞춤 관절 회복 침구 클리닉 운영 중입니다.',
    visibility: 'PUBLIC',
    updatedAt: '2026-09-14',
    isSample: true,
  },
  {
    id: 'sample_card_restaurant',
    userId: 'user_lee_on',
    name: '이온',
    company: '낙동강 참숯 한우마을',
    title: '대표',
    phone: '054-456-7890',
    email: 'hanwoo_on@daum.net',
    region: '경북 구미 낙동강체육공원 앞',
    industry: '식당/카페/요식업',
    bio: '동락·양호구장 라운드 후 동호회 뒤풀이 명소! 120석 대형 룸 및 버스 주차장 완비. 파크온 회원 육회 서비스!',
    visibility: 'PUBLIC',
    updatedAt: '2026-09-12',
    isSample: true,
  },
];

export const BusinessCardStorage = {
  // 내 명함 조회 (없으면 기본 프로필 기반 생성)
  getMyCard(): UserBusinessCard {
    if (typeof window === 'undefined') {
      return SAMPLE_COMMUNITY_CARDS[0];
    }
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MY_CARD);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse my business card:', e);
    }

    const selfName = ParkOnStorage.getUserDisplayName() || '플레이어';
    const defaultCard: UserBusinessCard = {
      id: 'my_card_' + Date.now(),
      userId: 'self',
      name: selfName,
      company: '',
      title: '골퍼',
      phone: '',
      email: '',
      region: '전국',
      industry: '파크골프/일반',
      bio: '즐거운 파크골프 라운딩과 활발한 동호인 인맥 교류를 응원합니다!',
      visibility: 'PUBLIC',
      updatedAt: new Date().toISOString().split('T')[0],
      isSample: false,
    };
    this.saveMyCard(defaultCard);
    return defaultCard;
  },

  // 내 명함 저장
  saveMyCard(card: UserBusinessCard): void {
    if (typeof window === 'undefined') return;
    try {
      card.updatedAt = new Date().toISOString().split('T')[0];
      localStorage.setItem(STORAGE_KEYS.MY_CARD, JSON.stringify(card));
      window.dispatchEvent(new Event('parkon_business_card_updated'));
    } catch (e) {
      console.error('Failed to save my business card:', e);
    }
  },

  // 내가 교환/보관한 동호인 명함 목록
  getExchangedCards(): UserBusinessCard[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXCHANGED_CARDS);
      if (data) {
        const parsed: UserBusinessCard[] = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (c) => c && !c.isSample && c.name !== '홍길동' && c.name !== '김파크' && c.name !== '이온'
          );
        }
      }
    } catch {
      // fallback
    }
    return [];
  },

  saveExchangedCards(cards: UserBusinessCard[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.EXCHANGED_CARDS, JSON.stringify(cards));
      window.dispatchEvent(new Event('parkon_business_cards_exchanged'));
    } catch (e) {
      console.error('Failed to save exchanged cards:', e);
    }
  },

  // 특정 명함 교환 추가
  exchangeCardWith(card: UserBusinessCard): boolean {
    const list = this.getExchangedCards();
    if (list.some((c) => c.id === card.id || (c.name === card.name && c.company === card.company))) {
      return false; // 이미 교환됨
    }
    const updated = [card, ...list];
    this.saveExchangedCards(updated);
    return true;
  },

  // 4인 라운드 완료 후 동반자들과 일괄 명함 교환 시뮬레이션
  exchangeWithRoundCompanions(players: Array<{ name: string; isSelf?: boolean }>): number {
    let addedCount = 0;
    const currentExchanged = this.getExchangedCards();

    players.forEach((p, idx) => {
      if (p.isSelf) return;
      const cleanName = p.name.replace(/\[.*?\]/g, '').trim() || `동반자 ${idx + 1}`;
      const existing = currentExchanged.find((c) => c.name.includes(cleanName));
      if (!existing) {
        // 동반자 가상 명함 자동 매칭/생성
        const matchedSample = SAMPLE_COMMUNITY_CARDS.find((s) => s.name.includes(cleanName));
        const newCard: UserBusinessCard = matchedSample || {
          id: 'card_comp_' + Date.now() + '_' + idx,
          userId: 'user_comp_' + idx,
          name: cleanName,
          company: `${cleanName} 비즈니스 / 동호인`,
          title: '회원 / 대표',
          phone: '010-****-****',
          region: '경북 구미 · 대구',
          industry: '은퇴/시니어 친목/기타',
          bio: '파크온 필드에서 함께 라운딩한 소중한 동반자입니다.',
          visibility: 'COMPANIONS_ONLY',
          updatedAt: new Date().toISOString().split('T')[0],
          isSample: true,
        };
        currentExchanged.unshift(newCard);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      this.saveExchangedCards(currentExchanged);
    }
    return addedCount;
  },

  // 전체 동호인 비즈니스 마켓 명함 목록 (내 명함 + 교환 명함 + 샘플)
  getAllCommunityCards(): UserBusinessCard[] {
    const myCard = this.getMyCard();
    const exchanged = this.getExchangedCards();
    const map = new Map<string, UserBusinessCard>();

    // 샘플 먼저 등록
    SAMPLE_COMMUNITY_CARDS.forEach((c) => map.set(c.id, c));
    // 교환된 명함 등록
    exchanged.forEach((c) => map.set(c.id, c));
    // 내 명함은 맨 앞
    if (myCard.visibility === 'PUBLIC') {
      map.set(myCard.id, myCard);
    }

    return Array.from(map.values());
  },
};
