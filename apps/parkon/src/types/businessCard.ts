export type BusinessCardVisibility = 'PUBLIC' | 'COMPANIONS_ONLY' | 'PRIVATE';

export interface UserBusinessCard {
  id: string;
  userId: string;
  name: string;
  company: string;         // 상호 / 회사 / 가게명 (예: 나우공인중개사, 전국파크골프용품 등)
  title: string;           // 직함 (대표, 공인중개사, 총무, 회장 등)
  phone: string;           // 연락처
  email?: string;
  region: string;          // 활동 지역 (예: 경북 구미, 대구 수성구 등)
  industry: string;        // 업종 (부동산/중개, 파크골프/레저, 요식업, 건강/의료, 유통/도소매, 건설/인테리어, 전문직, 기타)
  bio: string;             // 한 줄 소개 / 슬로건 (예: 범어동 160억 통빌딩 전문, 정직과 신뢰로 보답합니다)
  cardImage?: string;      // 실물 명함 사진 URL / DataURL (선택사항)
  visibility: BusinessCardVisibility;
  updatedAt: string;
  isSample?: boolean;      // 예시/체험용 명함 여부
}

export const BUSINESS_INDUSTRIES = [
  '부동산/중개/자산',
  '파크골프/용품/레저',
  '식당/카페/요식업',
  '의료/병원/한의원/건강',
  '제조/유통/도소매',
  '건설/인테리어/설비',
  '세무/회계/법률/행정',
  '자동차/정비/운송',
  '은퇴/시니어 친목/기타',
] as const;
