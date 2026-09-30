import { TournamentNotice, ParkGolfNewsItem, UserVoiceItem, FreeBoardPost } from '@/types/board';

const STORAGE_KEYS = {
  NOTICES: 'parkon_tournament_notices_v8',
  NEWS: 'parkon_news_items_v6',
  VOICES: 'parkon_user_voices_v1',
  POSTS: 'parkon_free_posts_v1',
  USER_LOCATION: 'parkon_user_gps_v1',
};

// 위도/경도 간 거리(km) 계산 (하버사인 공식)
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const DEFAULT_NOTICES: TournamentNotice[] = [
  // =================== 🇯🇵 일본 공식 시합 공고 (NPGA 공인 메이저) ===================
  {
    id: 'notice-npga-1',
    country: 'JP',
    title: '🏆 第39回 日本航空(JAL)カップ 幕別国際パークゴルフ選手権大会',
    titleKo: '🏆 제39회 일본항공(JAL)컵 마쿠베츠 국제 파크골프 선수권대회',
    titleJa: '🏆 第39回 日本航空(JAL)カップ 幕別国際パークゴルフ選手権大会',
    host: '日本航空(JAL) / (公社)日本パークゴルフ協会 / 幕別町',
    hostKo: '일본항공(JAL) / (공사)일본파크골프협회 / 마쿠베츠町',
    hostJa: '日本航空(JAL) / (公社)日本パークゴルフ協会 / 幕別町',
    region: '北海道 幕別',
    regionKo: '홋카이도 마쿠베츠',
    regionJa: '北海道 幕別',
    courseName: 'つつじコース・ちろっとコース (72ホール公認コース)',
    courseNameKo: '츠츠지 코스 & 치롯토 코스 (72홀 공인 코스)',
    courseNameJa: 'つつじコース・ちろっとコース (72ホール公認コース)',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 10.15',
    periodStrKo: '2026.09.10 ~ 10.15',
    periodStrJa: '2026.09.10 ~ 10.15',
    eventDateStr: '2026年 10月 25日(日) ~ 26日(月)',
    eventDateStrKo: '2026년 10월 25일(일) ~ 26일(월)',
    eventDateStrJa: '2026年 10月 25日(日) ~ 26日(月)',
    entryFee: '1人 3,500円 (昼食・記念品付)',
    entryFeeKo: '1인 3,500엔 (점심·기념품 포함)',
    entryFeeJa: '1人 3,500円 (昼食・記念品付)',
    targetCount: '全国・国際愛好者 480名 (先着順)',
    targetCountKo: '전국 및 국제 동호인 480명 (선착순)',
    targetCountJa: '全国・国際愛好者 480名 (先着順)',
    qualification: 'NPGA愛好者および海外親善参加者 (韓国愛好者大歓迎)',
    qualificationKo: 'NPGA 등록 애호가 및 해외 친선 참가자 (한국 골퍼 환영)',
    qualificationJa: 'NPGA愛好者および海外親善参加者 (韓国愛好者大歓迎)',
    linkUrl: 'https://www.parkgolf.or.jp/event/jal-cup-2026',
    directNoticeUrl: 'https://www.parkgolf.or.jp/event/jal-cup-2026',
    pdfUrl: 'https://www.parkgolf.or.jp/downloads/jal-cup-2026-guideline.pdf',
    pdfFileName: 'JALカップ2026_大会開催要項.pdf',
    isAiCurated: true,
    createdAt: '2026-09-15',
    lat: 42.9068,
    lng: 143.3542,
  },
  {
    id: 'notice-npga-2',
    country: 'JP',
    title: '🏆 2026 全日本パークゴルフ選手権大会 (北海道知事杯)',
    titleKo: '🏆 2026 전일본 파크골프 선수권대회 (홋카이도 지사배)',
    titleJa: '🏆 2026 全日本パークゴルフ選手権大会 (北海道知事杯)',
    host: '(公社)日本パークゴルフ協会 (NPGA) / 北海道',
    hostKo: '(공사)일본파크골프협회 (NPGA) / 홋카이도',
    hostJa: '(公社)日本パークゴルフ協会 (NPGA) / 北海道',
    region: '北海道 札幌',
    regionKo: '홋카이도 삿포로',
    regionJa: '北海道 札幌',
    courseName: '札幌前田森林公園 パークゴルフ場 (36ホール)',
    courseNameKo: '삿포로 마에다 삼림공원 파크골프장 (36홀)',
    courseNameJa: '札幌前田森林公園 パークゴルフ場 (36ホール)',
    status: 'RECRUITING',
    periodStr: '2026.09.15 ~ 10.10',
    periodStrKo: '2026.09.15 ~ 10.10',
    periodStrJa: '2026.09.15 ~ 10.10',
    eventDateStr: '2026年 10月 28日(水)',
    eventDateStrKo: '2026년 10월 28일(수)',
    eventDateStrJa: '2026年 10月 28日(水)',
    entryFee: '1人 3,000円',
    entryFeeKo: '1인 3,000엔',
    entryFeeJa: '1人 3,000円',
    targetCount: '各都道府県代表選手 計 360名',
    targetCountKo: '각 도도부현 대표 선수 총 360명',
    targetCountJa: '各都道府県代表選手 計 360名',
    qualification: 'NPGA公認指導員・公認選手選抜枠',
    qualificationKo: 'NPGA 공인 지도원 및 각 부현 선발 대표',
    qualificationJa: 'NPGA公認指導員・公認選手選抜枠',
    linkUrl: 'https://www.parkgolf.or.jp/alljapan-championship-2026',
    directNoticeUrl: 'https://www.parkgolf.or.jp/alljapan-championship-2026',
    isAiCurated: true,
    createdAt: '2026-09-14',
    lat: 43.1412,
    lng: 141.2789,
  },
  {
    id: 'notice-npga-3',
    country: 'JP',
    title: '🏆 2026 ミズノ(Mizuno) パークゴルフクラシック in 東北',
    titleKo: '🏆 2026 미즈노(Mizuno) 파크골프 클래식 in 도호쿠',
    titleJa: '🏆 2026 ミズノ(Mizuno) パークゴルフクラシック in 東北',
    host: '美津濃株式会社(MIZUNO) / 宮城県パークゴルフ協会',
    hostKo: '미즈노 주식회사(MIZUNO) / 미야기현 파크골프협회',
    hostJa: '美津濃株式会社(MIZUNO) / 宮城県パークゴルフ協会',
    region: '宮城 仙台',
    regionKo: '미야기 센다이',
    regionJa: '宮城 仙台',
    courseName: 'みやぎパークランド 杜の都コース (36ホール)',
    courseNameKo: '미야기 파크랜드 모리의 미야코 코스 (36홀)',
    courseNameJa: 'みやぎパークランド 杜の都コース (36ホール)',
    status: 'UPCOMING',
    periodStr: '2026.10.01 ~ 10.20',
    periodStrKo: '2026.10.01 ~ 10.20',
    periodStrJa: '2026.10.01 ~ 10.20',
    eventDateStr: '2026年 11月 05日(木) 09:00',
    eventDateStrKo: '2026년 11월 05일(목) 09:00',
    eventDateStrJa: '2026年 11月 05日(木) 09:00',
    entryFee: '1人 4,000円 (ミズノ特製記念ボール付)',
    entryFeeKo: '1인 4,000엔 (미즈노 기념볼 포함)',
    entryFeeJa: '1人 4,000円 (ミズノ特製記念ボール付)',
    targetCount: '東日本・全国愛好者 240名',
    targetCountKo: '동일본 및 전국 동호인 240명',
    targetCountJa: '東日本・全国愛好者 240名',
    qualification: 'ミズノ公認クラブまたはNPGA公認用具使用者',
    qualificationKo: '미즈노 클럽 또는 NPGA 공인 용품 사용자 누구나',
    qualificationJa: 'ミズノ公認クラブまたはNPGA公認用具使用者',
    linkUrl: 'https://jpn.mizuno.com/parkgolf/classic2026',
    directNoticeUrl: 'https://jpn.mizuno.com/parkgolf/classic2026',
    isAiCurated: true,
    createdAt: '2026-09-12',
    lat: 38.2682,
    lng: 140.8694,
  },
  {
    id: 'notice-npga-4',
    country: 'JP',
    title: '🏆 第12回 アシックス(asics)カップ 関西パークゴルフ親善大会',
    titleKo: '🏆 제12회 아식스(asics)컵 간사이 파크골프 친선대회',
    titleJa: '🏆 第12回 アシックス(asics)カップ 関西パークゴルフ親善大会',
    host: 'アシックスジャパン(asics) / 兵庫県パークゴルフ連盟',
    hostKo: '아식스재팬(asics) / 효고현 파크골프연맹',
    hostJa: 'アシックスジャパン(asics) / 兵庫県パークゴルフ連盟',
    region: '兵庫 神戸',
    regionKo: '효고 고베',
    regionJa: '兵庫 神戸',
    courseName: 'しあわせの村 パークゴルフ場 (18ホール)',
    courseNameKo: '시아와세노무라 파크골프장 (18홀)',
    courseNameJa: 'しあわせの村 パークゴルフ場 (18ホール)',
    status: 'RECRUITING',
    periodStr: '2026.09.18 ~ 10.12',
    periodStrKo: '2026.09.18 ~ 10.12',
    periodStrJa: '2026.09.18 ~ 10.12',
    eventDateStr: '2026年 10月 30日(金)',
    eventDateStrKo: '2026년 10월 30일(금)',
    eventDateStrJa: '2026年 10月 30日(金)',
    entryFee: '1人 2,500円',
    entryFeeKo: '1인 2,500엔',
    entryFeeJa: '1人 2,500円',
    targetCount: 'シニア・一般 160名',
    targetCountKo: '시니어 및 일반 160명',
    targetCountJa: 'シニア・一般 160名',
    qualification: '親善オープン参加 (初心者・海外旅行者歓迎)',
    qualificationKo: '친선 오픈 참가 (초보자 및 해외 여행객 환영)',
    qualificationJa: '親善オープン参加 (初心者・海外旅行者歓迎)',
    linkUrl: 'https://www.asics.com/jp/ja-jp/parkgolf/cup-kansai',
    directNoticeUrl: 'https://www.asics.com/jp/ja-jp/parkgolf/cup-kansai',
    isAiCurated: true,
    createdAt: '2026-09-18',
    lat: 34.6901,
    lng: 135.1955,
  },
  {
    id: 'notice-npga-5',
    country: 'JP',
    title: '🏆 2026 本間ゴルフ(HONMA)杯 九州オープン パークゴルフ大会',
    titleKo: '🏆 2026 혼마골프(HONMA)배 규슈 오픈 파크골프 대회',
    titleJa: '🏆 2026 本間ゴルフ(HONMA)杯 九州オープン パークゴルフ大会',
    host: '株式会社 本間ゴルフ / 熊本県パークゴルフ協会',
    hostKo: '주식회사 혼마골프 / 구마모토현 파크골프협회',
    hostJa: '株式会社 本間ゴルフ / 熊本県パークゴルフ協会',
    region: '熊本 阿蘇',
    regionKo: '구마모토 아소',
    regionJa: '熊本 阿蘇',
    courseName: '阿蘇ハイランド パークゴルフコース (36ホール)',
    courseNameKo: '아소 하이랜드 파크골프 코스 (36홀)',
    courseNameJa: '阿蘇ハイランド パークゴルフコース (36ホール)',
    status: 'RECRUITING',
    periodStr: '2026.09.20 ~ 10.20',
    periodStrKo: '2026.09.20 ~ 10.20',
    periodStrJa: '2026.09.20 ~ 10.20',
    eventDateStr: '2026年 11月 12日(木)',
    eventDateStrKo: '2026년 11월 12일(목)',
    eventDateStrJa: '2026年 11月 12日(木)',
    entryFee: '1人 3,500円',
    entryFeeKo: '1인 3,500엔',
    entryFeeJa: '1人 3,500円',
    targetCount: '九州および全国愛好者 200名',
    targetCountKo: '규슈 및 전국 동호인 200명',
    targetCountJa: '九州および全国愛好者 200名',
    qualification: 'NPGA公認用具愛好者',
    qualificationKo: 'NPGA 공인 용품 애호가',
    qualificationJa: 'NPGA公認用具愛好者',
    linkUrl: 'https://honmagolf.com/jp/parkgolf/kyushu-open-2026',
    directNoticeUrl: 'https://honmagolf.com/jp/parkgolf/kyushu-open-2026',
    isAiCurated: true,
    createdAt: '2026-09-20',
    lat: 32.8841,
    lng: 131.0532,
  },

  // =================== 🇰🇷 대한민국 공식 시합 공고 ===================
  {
    id: 'notice-kpga-1',
    country: 'KR',
    title: '🏆 제4회 문화체육관광부장관기 전국 파크골프대회',
    titleKo: '🏆 제4회 문화체육관광부장관기 전국 파크골프대회',
    titleJa: '🏆 第4回 文化体育観光部長官旗 全国パークゴルフ大会',
    host: '사단법인 대한파크골프협회 / 문화체육관광부',
    hostKo: '사단법인 대한파크골프협회 / 문화체육관광부',
    hostJa: '(社)大韓パークゴルフ協会 / 文化体育観光部',
    region: '경남 창원',
    regionKo: '경남 창원',
    regionJa: '慶南 昌原',
    courseName: '창원 대산면 파크골프장 (72홀 공인구장)',
    courseNameKo: '창원 대산면 파크골프장 (72홀 공인구장)',
    courseNameJa: '昌原大山面パークゴルフ場 (72ホール公認コース)',
    courseId: 'course-changwon-daesan',
    status: 'RECRUITING',
    periodStr: '2026.09.15 ~ 10.05 (협회 공고)',
    periodStrKo: '2026.09.15 ~ 10.05 (협회 공고)',
    periodStrJa: '2026.09.15 ~ 10.05 (公式公示)',
    eventDateStr: '2026년 10월 20일(화) ~ 21일(수)',
    eventDateStrKo: '2026년 10월 20일(화) ~ 21일(수)',
    eventDateStrJa: '2026年 10月 20日(火) ~ 21日(水)',
    entryFee: '1인 30,000원',
    entryFeeKo: '1인 30,000원',
    entryFeeJa: '1人 30,000ウォン',
    targetCount: '전국 시·도 대표선수단 총 600명',
    targetCountKo: '전국 시·도 대표선수단 총 600명',
    targetCountJa: '全国市・道代表選手団 計600名',
    qualification: '대한파크골프협회 2026 등록 정회원 및 시·도 선발 선수',
    qualificationKo: '대한파크골프협회 2026 등록 정회원 및 시·도 선발 선수',
    qualificationJa: '大韓パークゴルフ協会2026登録正会員および選抜選手',
    linkUrl: 'https://www.kpga7330.com/competitions/e1472f5c-4ae0-4bd2-86ff-a619617ab70e/register',
    directNoticeUrl: 'https://www.kpga7330.com/competitions/e1472f5c-4ae0-4bd2-86ff-a619617ab70e/register',
    pdfUrl: 'https://d366hz6313pnn3.cloudfront.net/uploads/events/1789456462652/1789456462652-_4__________________________.pdf',
    pdfFileName: '제4회 문화체육관광부장관기 전국 파크골프대회 대회요강.pdf',
    isAiCurated: true,
    createdAt: '2026-09-15',
    lat: 35.3352,
    lng: 128.6914,
  },
  {
    id: 'notice-kpga-2',
    country: 'KR',
    title: '🏆 제9회 물맑은 양평 전국 파크골프대회',
    titleKo: '🏆 제9회 물맑은 양평 전국 파크골프대회',
    titleJa: '🏆 第9回 水清き楊平 全国パークゴルフ大会',
    host: '양평군 파크골프협회 / 사단법인 대한파크골프협회',
    hostKo: '양평군 파크골프협회 / 사단법인 대한파크골프협회',
    hostJa: '楊平郡パークゴルフ協会 / (社)大韓パークゴルフ協会',
    region: '경기 양평',
    regionKo: '경기 양평',
    regionJa: '京畿 楊平',
    courseName: '양평 강상 파크골프장 (36홀)',
    courseNameKo: '양평 강상 파크골프장 (36홀)',
    courseNameJa: '楊平江上パークゴルフ場 (36ホール)',
    courseId: 'course-yangpyeong-gangsang',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 09.30',
    periodStrKo: '2026.09.10 ~ 09.30',
    periodStrJa: '2026.09.10 ~ 09.30',
    eventDateStr: '2026년 10월 24일(토)',
    eventDateStrKo: '2026년 10월 24일(토)',
    eventDateStrJa: '2026年 10月 24日(土)',
    entryFee: '1인 30,000원',
    entryFeeKo: '1인 30,000원',
    entryFeeJa: '1人 30,000ウォン',
    targetCount: '전국 동호인 360명 (선착순)',
    targetCountKo: '전국 동호인 360명 (선착순)',
    targetCountJa: '全国愛好者 360名 (先着順)',
    qualification: '전국 파크골프 동호인 (대한파크골프협회 등록회원)',
    qualificationKo: '전국 파크골프 동호인 (대한파크골프협회 등록회원)',
    qualificationJa: '全国パークゴルフ愛好者 (協会登録会員)',
    linkUrl: 'https://www.kpga7330.com/competitions/173bf931-f2ae-4e88-bdb3-27cc5562e70a/register',
    directNoticeUrl: 'https://www.kpga7330.com/competitions/173bf931-f2ae-4e88-bdb3-27cc5562e70a/register',
    pdfUrl: 'https://d366hz6313pnn3.cloudfront.net/uploads/events/1788771126178/1788771126178-_9____________________.pdf',
    pdfFileName: '제9회 물맑은 양평 전국 파크골프대회 요강.pdf',
    isAiCurated: true,
    createdAt: '2026-09-14',
    lat: 37.4912,
    lng: 127.4875,
  },
  {
    id: 'notice-kpga-3',
    country: 'KR',
    title: '🏆 2026 대구광역시 파크골프협회장기 및 시장배 시니어 대회',
    titleKo: '🏆 2026 대구광역시 파크골프협회장기 및 시장배 시니어 대회',
    titleJa: '🏆 2026 大邱広域市パークゴルフ協会長旗＆市長杯 シニア大会',
    host: '대구광역시 파크골프협회 / 대구광역시체육회',
    hostKo: '대구광역시 파크골프협회 / 대구광역시체육회',
    hostJa: '大邱広域市パークゴルフ協会 / 大邱広域市体育会',
    region: '대구 수성',
    regionKo: '대구 수성',
    regionJa: '大邱 寿城',
    courseName: '대구 수성 파크골프장 (18홀) / 달성 구지 레포츠파크',
    courseNameKo: '대구 수성 파크골프장 (18홀) / 달성 구지 레포츠파크',
    courseNameJa: '大邱寿城パークゴルフ場 (18ホール) / 達城丘智レポーツパーク',
    courseId: 'course-daegu-suseong',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 09.28',
    periodStrKo: '2026.09.10 ~ 09.28',
    periodStrJa: '2026.09.10 ~ 09.28',
    eventDateStr: '2026년 10월 10일(토) 09:00',
    eventDateStrKo: '2026년 10월 10일(토) 09:00',
    eventDateStrJa: '2026年 10月 10日(土) 09:00',
    entryFee: '1인 20,000원',
    entryFeeKo: '1인 20,000원',
    entryFeeJa: '1人 20,000ウォン',
    targetCount: '대구 및 영남권 동호인 총 288명',
    targetCountKo: '대구 및 영남권 동호인 총 288명',
    targetCountJa: '大邱・嶺南地域愛好者 計288名',
    qualification: '대구광역시 및 전국 파크골프협회 등록 동호인',
    qualificationKo: '대구광역시 및 전국 파크골프협회 등록 동호인',
    qualificationJa: '大邱広域市および全国パークゴルフ協会登録愛好者',
    linkUrl: 'https://parkgolf.daegu.go.kr',
    directNoticeUrl: 'https://parkgolf.daegu.go.kr',
    isAiCurated: true,
    createdAt: '2026-09-13',
    lat: 35.8583,
    lng: 128.6318,
  },
  {
    id: 'notice-kpga-4',
    country: 'KR',
    title: '🏆 제2회 청풍호반배 전국 파크골프대회',
    titleKo: '🏆 제2회 청풍호반배 전국 파크골프대회',
    titleJa: '🏆 第2回 清風湖畔杯 全国パークゴルフ大会',
    host: '제천시 파크골프협회 / 사단법인 대한파크골프협회',
    hostKo: '제천시 파크골프협회 / 사단법인 대한파크골프협회',
    hostJa: '堤川市パークゴルフ協会 / (社)大韓パークゴルフ協会',
    region: '충북 제천',
    regionKo: '충북 제천',
    regionJa: '忠北 堤川',
    courseName: '제천 청풍호 파크골프장 (36홀)',
    courseNameKo: '제천 청풍호 파크골프장 (36홀)',
    courseNameJa: '堤川清風湖パークゴルフ場 (36ホール)',
    courseId: 'course-jecheon-cheongpung',
    status: 'RECRUITING',
    periodStr: '2026.09.12 ~ 10.15',
    periodStrKo: '2026.09.12 ~ 10.15',
    periodStrJa: '2026.09.12 ~ 10.15',
    eventDateStr: '2026년 10월 24일(토) 09:00',
    eventDateStrKo: '2026년 10월 24일(토) 09:00',
    eventDateStrJa: '2026年 10月 24日(土) 09:00',
    entryFee: '1인 25,000원',
    entryFeeKo: '1인 25,000원',
    entryFeeJa: '1人 25,000ウォン',
    targetCount: '전국 동호인 240명',
    targetCountKo: '전국 동호인 240명',
    targetCountJa: '全国愛好者 240名',
    qualification: '대한파크골프협회 등록 동호인 누구나',
    qualificationKo: '대한파크골프협회 등록 동호인 누구나',
    qualificationJa: '大韓パークゴルフ協会登録愛好者どなたでも',
    linkUrl: 'https://www.kpga7330.com/competitions/0be3091d-8450-44e2-b3df-993272d89780/register',
    directNoticeUrl: 'https://www.kpga7330.com/competitions/0be3091d-8450-44e2-b3df-993272d89780/register',
    pdfUrl: 'https://d366hz6313pnn3.cloudfront.net/uploads/events/1788996814733/1788996814733-_2___________________.pdf',
    pdfFileName: '제2회 청풍호반배 전국 파크골프대회 요강.pdf',
    isAiCurated: true,
    createdAt: '2026-09-12',
    lat: 36.9852,
    lng: 128.1632,
  },
  {
    id: 'notice-kpga-5',
    country: 'KR',
    title: '🏆 2026 볼빅(Volvik) 전국 파크골프 챔피언십',
    titleKo: '🏆 2026 볼빅(Volvik) 전국 파크골프 챔피언십',
    titleJa: '🏆 2026 ボルビック(Volvik) 全国パークゴルフ選手権',
    host: '볼빅 / 사단법인 대한파크골프협회 공인',
    hostKo: '볼빅 / 사단법인 대한파크골프협회 공인',
    hostJa: 'Volvik / (社)大韓パークゴルフ協会公認',
    region: '인천 서구',
    regionKo: '인천 서구',
    regionJa: '仁川 西区',
    courseName: '인천 청라 아시아드 파크골프장 (36홀)',
    courseNameKo: '인천 청라 아시아드 파크골프장 (36홀)',
    courseNameJa: '仁川青羅アジアード パークゴルフ場 (36ホール)',
    courseId: 'course-incheon-asiad',
    status: 'RECRUITING',
    periodStr: '2026.09.08 ~ 09.25',
    periodStrKo: '2026.09.08 ~ 09.25',
    periodStrJa: '2026.09.08 ~ 09.25',
    eventDateStr: '2026년 10월 19일(월) 08:30',
    eventDateStrKo: '2026년 10월 19일(월) 08:30',
    eventDateStrJa: '2026年 10月 19日(月) 08:30',
    entryFee: '1인 30,000원',
    entryFeeKo: '1인 30,000원',
    entryFeeJa: '1人 30,000ウォン',
    targetCount: '전국 320명 (오픈 챔피언십)',
    targetCountKo: '전국 320명 (오픈 챔피언십)',
    targetCountJa: '全国 320名 (オープン選手権)',
    qualification: '전국 파크골프 동호인 (볼빅 공인구 사용 필수)',
    qualificationKo: '전국 파크골프 동호인 (볼빅 공인구 사용 필수)',
    qualificationJa: '全国愛好者 (ボルビック公認球使用必須)',
    linkUrl: 'https://www.kpga7330.com/competitions/582a3e52-685f-448f-b034-bd2363f79ceb/register',
    directNoticeUrl: 'https://www.kpga7330.com/competitions/582a3e52-685f-448f-b034-bd2363f79ceb/register',
    pdfUrl: 'https://d366hz6313pnn3.cloudfront.net/uploads/events/1788768779771/1788768779771-2026___________________.pdf',
    pdfFileName: '2026 볼빅 전국 파크골프 챔피언십 요강.pdf',
    isAiCurated: true,
    createdAt: '2026-09-10',
    lat: 37.5458,
    lng: 126.6625,
  },
  {
    id: 'notice-kpga-6',
    country: 'KR',
    title: '🏆 제2회 달성군·MBN 전국파크골프대회',
    titleKo: '🏆 제2회 달성군·MBN 전국파크골프대회',
    titleJa: '🏆 第2回 達城郡・MBN 全国パークゴルフ大会',
    host: '달성군체육회 / MBN 매일방송 / 사단법인 대한파크골프협회',
    hostKo: '달성군체육회 / MBN 매일방송 / 사단법인 대한파크골프협회',
    hostJa: '達城郡体育会 / MBN毎日放送 / (社)大韓パークゴルフ協会',
    region: '대구 달성',
    regionKo: '대구 달성',
    regionJa: '大邱 達城',
    courseName: '다사세천 파크골프장 (36홀)',
    courseNameKo: '다사세천 파크골프장 (36홀)',
    courseNameJa: '多斯洗川パークゴルフ場 (36ホール)',
    courseId: 'course-daegu-dasa',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 10.05',
    periodStrKo: '2026.09.10 ~ 10.05',
    periodStrJa: '2026.09.10 ~ 10.05',
    eventDateStr: '2026년 10월 17일(토) ~ 18일(일)',
    eventDateStrKo: '2026년 10월 17일(토) ~ 18일(일)',
    eventDateStrJa: '2026年 10月 17日(土) ~ 18日(日)',
    entryFee: '1인 30,000원',
    entryFeeKo: '1인 30,000원',
    entryFeeJa: '1人 30,000ウォン',
    targetCount: '전국 480명',
    targetCountKo: '전국 480명',
    targetCountJa: '全国 480名',
    qualification: '전국 파크골프 동호인 누구나',
    qualificationKo: '전국 파크골프 동호인 누구나',
    qualificationJa: '全国愛好者どなたでも',
    linkUrl: 'https://www.kpga7330.com/competitions/41b69b51-f5b8-4756-b7c1-0c8bfb820cea/register',
    directNoticeUrl: 'https://www.kpga7330.com/competitions/41b69b51-f5b8-4756-b7c1-0c8bfb820cea/register',
    pdfUrl: 'https://d366hz6313pnn3.cloudfront.net/uploads/events/1787303710069/1787303710069-_2_____MBN___________.pdf',
    pdfFileName: '제2회 달성군 MBN 전국파크골프대회 요강.pdf',
    isAiCurated: true,
    createdAt: '2026-09-08',
    lat: 35.8752,
    lng: 128.4612,
  },
];

export const DEFAULT_NEWS: ParkGolfNewsItem[] = [
  // =================== 🇰🇷 한국 메이저/지역 뉴스 ===================
  {
    id: 'news-1',
    country: 'KR',
    title: '전국 파크골프 인구 400만 돌파! 공인 구장 450개소 신설 및 확장 가속화',
    titleKo: '전국 파크골프 인구 400만 돌파! 공인 구장 450개소 신설 및 확장 가속화',
    titleJa: '韓国パークゴルフ愛好者400万人突破！公認コース450か所新設・拡張が加速',
    summary: '시니어 레저를 넘어 3040 세대까지 급속히 확산되며 전국 지자체의 파크골프장 인프라 확충 투자가 사상 최대치를 기록하고 있습니다.',
    summaryKo: '시니어 레저를 넘어 3040 세대까지 급속히 확산되며 전국 지자체의 파크골프장 인프라 확충 투자가 사상 최대치를 기록하고 있습니다.',
    summaryJa: 'シニアの余暇を超え30〜40代まで急速に広がり、全国自治体のパークゴルフ場インフラ投資が過去最高を記録しています。',
    source: '한국레저산업연구원 / 대한파크골프협회',
    region: '전국',
    category: 'MAJOR',
    dateStr: '2026.09.16',
    linkUrl: 'https://www.kpga7330.com',
    viewCount: 1420,
    likeCount: 98,
  },
  {
    id: 'news-2',
    country: 'KR',
    title: '대한파크골프협회, 2026 공인구 반발력 및 그립 규격 개정안 공시',
    titleKo: '대한파크골프협회, 2026 공인구 반발력 및 그립 규격 개정안 공시',
    titleJa: '大韓パークゴルフ協会、2026公認球の反発力およびグリップ規格改定案を告示',
    summary: '비거리 과열 방지와 필드 안전 강화를 위해 2026년 하반기 공식 시합부터 적용되는 장비 검정 가이드라인을 최종 고시했습니다.',
    summaryKo: '비거리 과열 방지와 필드 안전 강화를 위해 2026년 하반기 공식 시합부터 적용되는 장비 검정 가이드라인을 최종 고시했습니다.',
    summaryJa: '飛距離過熱防止と安全性向上のため、2026年後半の公式競技から適用される用具検定基準を告示しました。',
    source: '사단법인 대한파크골프협회 공지',
    region: '전국',
    category: 'MAJOR',
    dateStr: '2026.09.15',
    linkUrl: 'https://www.kpga7330.com',
    viewCount: 980,
    likeCount: 65,
  },
  // 지역 밀착형 뉴스
  {
    id: 'news-3',
    country: 'KR',
    title: '[경북 구미] 동락 파크골프장 A·B코스 잔디 보식 완료, 18일부터 정상 라운딩',
    titleKo: '[경북 구미] 동락 파크골프장 A·B코스 잔디 보식 완료, 18일부터 정상 라운딩',
    titleJa: '[慶北 亀尾] 同楽パークゴルフ場 A・Bコース芝補植完了、18日より通常営業',
    summary: '구미도시공사는 여름철 폭염으로 손상되었던 그린 잔디 보식 작업을 성공적으로 완료하고 전면 개방한다고 밝혔습니다.',
    summaryKo: '구미도시공사는 여름철 폭염으로 손상되었던 그린 잔디 보식 작업을 성공적으로 완료하고 전면 개방한다고 밝혔습니다.',
    summaryJa: '亀尾都市公社は猛暑により損傷したグリーンの芝補植作業を完了し全面開放すると発表しました。',
    source: '구미시청 및 공단 공지',
    sourceKo: '구미시청 및 공단 공지',
    sourceJa: '亀尾市庁および公団公式告示',
    region: '경북',
    regionKo: '경북',
    regionJa: '慶北',
    category: 'LOCAL',
    dateStr: '2026.09.16',
    linkUrl: 'https://www.gumi.go.kr',
    viewCount: 840,
    likeCount: 52,
    lat: 36.10398,
    lng: 128.3756,
  },
  {
    id: 'news-4',
    country: 'KR',
    title: '[대구 수성] 수성 및 달성 파크골프장 가을철 친선 경기 온라인 예약 운영',
    titleKo: '[대구 수성] 수성 및 달성 파크골프장 가을철 친선 경기 온라인 예약 운영',
    titleJa: '[大邱 寿城] 寿城・達城パークゴルフ場 秋季親善大会オンライン予約受付中',
    summary: '대구광역시는 구민 및 동호인 편의를 위해 온라인 실시간 예약 시스템을 통해 주말 경기 접수를 진행합니다.',
    summaryKo: '대구광역시는 구민 및 동호인 편의를 위해 온라인 실시간 예약 시스템을 통해 주말 경기 접수를 진행합니다.',
    summaryJa: '大邱広域市は区民および愛好者の利便性向上のため、リアルタイム予約システムを通じて週末競技受付を実施します。',
    source: '대구광역시 파크골프 포털',
    sourceKo: '대구광역시 파크골프 포털',
    sourceJa: '大邱広域市パークゴルフポータル',
    region: '대구',
    regionKo: '대구',
    regionJa: '大邱',
    category: 'LOCAL',
    dateStr: '2026.09.15',
    linkUrl: 'https://parkgolf.daegu.go.kr',
    viewCount: 610,
    likeCount: 44,
    lat: 35.8583,
    lng: 128.6318,
  },
  {
    id: 'news-5',
    country: 'KR',
    title: '[부산 사상] 낙동강 삼락 파크골프장 36홀 가을철 잔디 생육 및 라운딩 공지',
    titleKo: '[부산 사상] 낙동강 삼락 파크골프장 36홀 가을철 잔디 생육 및 라운딩 공지',
    titleJa: '[釜山 沙上] 洛東江 三楽パークゴルフ場 36ホール秋季芝育成および競技案内',
    summary: '부산광역시는 낙동강 생태공원 내 삼락 파크골프장의 쾌적한 경기 환경을 위한 코스 관리 일정을 안내했습니다.',
    summaryKo: '부산광역시는 낙동강 생태공원 내 삼락 파크골프장의 쾌적한 경기 환경을 위한 코스 관리 일정을 안내했습니다.',
    summaryJa: '釜山広域市は洛東江生態公園内三楽パークゴルフ場の快適なプレー環境整備のためのコース管理日程を案内しました。',
    source: '부산광역시 체육 포털',
    sourceKo: '부산광역시 체육 포털',
    sourceJa: '釜山広域市体育ポータル',
    region: '부산',
    regionKo: '부산',
    regionJa: '釜山',
    category: 'LOCAL',
    dateStr: '2026.09.14',
    linkUrl: 'https://www.busan.go.kr',
    viewCount: 530,
    likeCount: 39,
    lat: 35.1705,
    lng: 128.9745,
  },
  {
    id: 'news-6',
    country: 'KR',
    title: '[서울 여의도] 한강 시민 파크골프 무료 강좌 및 필드 안전 수칙 안내',
    titleKo: '[서울 여의도] 한강 시민 파크골프 무료 강좌 및 필드 안전 수칙 안내',
    titleJa: '[ソウル 汝矣島] 漢江市民パークゴルフ無料講習およびフィールド安全規則案内',
    summary: '서울시 한강사업본부는 시니어 및 초보 골퍼를 위한 공인 지도자 레슨 프로그램을 개설했습니다.',
    summaryKo: '서울시 한강사업본부는 시니어 및 초보 골퍼를 위한 공인 지도자 레슨 프로그램을 개설했습니다.',
    summaryJa: 'ソウル市漢江事業本部はシニアおよび初心者ゴルファー向けに公認指導員レッスンプログラムを開設しました。',
    source: '서울시 미래한강본부',
    sourceKo: '서울시 미래한강본부',
    sourceJa: 'ソウル市未来漢江本部',
    region: '서울',
    regionKo: '서울',
    regionJa: 'ソウル',
    category: 'LOCAL',
    dateStr: '2026.09.13',
    linkUrl: 'https://hangang.seoul.go.kr',
    viewCount: 720,
    likeCount: 58,
    lat: 37.5255,
    lng: 126.9242,
  },
  {
    id: 'news-7',
    country: 'KR',
    title: '[경기 양평] 양평 강상 파크골프장 가을 메이저 대회 준비 및 잔디 정비',
    titleKo: '[경기 양평] 양평 강상 파크골프장 가을 메이저 대회 준비 및 잔디 정비',
    titleJa: '[京畿 楊平] 楊平 江上パークゴルフ場 秋季メジャー大会準備および芝整備',
    summary: '양평군은 전국대회 유치를 위해 강상면 파크골프장 코스 정비 및 부대시설 확충을 완료했습니다.',
    summaryKo: '양평군은 전국대회 유치를 위해 강상면 파크골프장 코스 정비 및 부대시설 확충을 완료했습니다.',
    summaryJa: '楊平郡は全国大会誘致に向け、江上面パークゴルフ場の芝整備と付帯施設拡充を完了しました。',
    source: '양평군청 체육과',
    sourceKo: '양평군청 체육과',
    sourceJa: '楊平郡庁体育課',
    region: '경기',
    regionKo: '경기',
    regionJa: '京畿',
    category: 'LOCAL',
    dateStr: '2026.09.12',
    linkUrl: 'https://www.yp21.go.kr',
    viewCount: 890,
    likeCount: 71,
    lat: 37.4912,
    lng: 127.4875,
  },

  // =================== 🇯🇵 일본 현지 파크골프 뉴스 ===================
  {
    id: 'news-npga-1',
    country: 'JP',
    title: '🇯🇵 【公式】NPGA 日本パークゴルフ協会、2026年度 公認球安全テスト新基準を発表',
    titleKo: '🇯🇵 【공식】NPGA 일본파크골프협회, 2026년도 공인구 안전 검사 신기준 발표',
    titleJa: '🇯🇵 【公式】NPGA 日本パークゴルフ協会、2026年度 公認球安全テスト新基準を発表',
    summary: '(公社)日本パークゴルフ協会は、シニア競技者の安全性向上と飛距離の公平性を保つため、ボールの反発係数および重量規格に関する2026年改正規程を施行しました。公認シール付きのボールのみ公式競技で使用可能です。',
    summaryKo: '(공사)일본파크골프협회는 시니어 경기자의 안전성 향상과 비거리 공정성을 유지하기 위해 볼 반발계수 및 중량 규격에 관한 2026년 개정 규정을 시행했습니다. 공인 스티커가 부착된 볼만 공식 대회에서 사용 가능합니다.',
    summaryJa: '(公社)日本パークゴルフ協会は、シニア競技者の安全性向上と飛距離の公平性を保つため、ボールの反発係数および重量規格に関する2026年改正規程を施行しました。公認シール付きのボールのみ公式競技で使用可能です。',
    source: '(公社)日本パークゴルフ協会 告示',
    sourceKo: '(공사)일본파크골프협회 고시',
    sourceJa: '(公社)日本パークゴルフ協会 告示',
    region: '日本全国',
    regionKo: '일본 전국',
    regionJa: '日本全国',
    category: 'MAJOR',
    dateStr: '2026.09.28',
    linkUrl: 'https://www.parkgolf.or.jp/rules/ball-standard-2026',
    viewCount: 1420,
    likeCount: 188,
  },
  {
    id: 'news-npga-2',
    country: 'JP',
    title: '🇯🇵 홋카이도 마쿠베츠町, 발상지 기념 \'파크골프 그린 페스티벌\' 성황리 개최',
    titleKo: '🇯🇵 홋카이도 마쿠베츠町, 발상지 기념 \'파크골프 그린 페스티벌\' 성황리 개최',
    titleJa: '🇯🇵 北海道 幕別町、発祥の地記念「パークゴルフ グリーンフェスティバル」盛況開催',
    summary: '파크골프의 발상지 홋카이도 마쿠베츠町에서 창시 43주년을 기념하여 전국 애호가 1,000여 명이 참가한 페스티벌이 열렸습니다. 한국 원정 참가자들을 위한 특별 환영 리셉션도 함께 진행되었습니다.',
    summaryKo: '파크골프의 발상지 홋카이도 마쿠베츠町에서 창시 43주년을 기념하여 전국 애호가 1,000여 명이 참가한 페스티벌이 열렸습니다. 한국 원정 참가자들을 위한 특별 환영 리셉션도 함께 진행되었습니다.',
    summaryJa: 'パークゴルフ発祥の地・北海道幕別町にて創始43周年を記念し、全国の愛好者1,000名が参加するフェスティバルが開催されました。韓国からの遠征参加者のための特別歓迎レセプションも実施されました。',
    source: '홋카이도 신문 (北海道新聞)',
    sourceKo: '홋카이도 신문 (北海道新聞)',
    sourceJa: '北海道新聞',
    region: '北海道 幕別',
    regionKo: '홋카이도 마쿠베츠',
    regionJa: '北海道 幕別',
    category: 'LOCAL',
    dateStr: '2026.09.25',
    linkUrl: 'https://www.hokkaido-np.co.jp/makubetsu-parkgolf-2026',
    viewCount: 2150,
    likeCount: 312,
  },
  {
    id: 'news-npga-3',
    country: 'JP',
    title: '🇯🇵 삿포로 모에레누마 공원, 18홀 리뉴얼 확장 오픈 및 외국인 스마트 체크인 도입',
    titleKo: '🇯🇵 삿포로 모에레누마 공원, 18홀 리뉴얼 확장 오픈 및 외국인 스마트 체크인 도입',
    titleJa: '🇯🇵 札幌 モエレ沼公園、18ホールリニューアル拡張オープン＆外国人スマートチェックイン導入',
    summary: '삿포로를 대표하는 모에레누마 공원 파크골프장이 페어웨이 천연잔디 교체 공사를 마치고 재개장했습니다. 한국 등 해외 골퍼를 위해 모바일 QR 다국어 체크인 시스템이 전면 도입되었습니다.',
    summaryKo: '삿포로를 대표하는 모에레누마 공원 파크골프장이 페어웨이 천연잔디 교체 공사를 마치고 재개장했습니다. 한국 등 해외 골퍼를 위해 모바일 QR 다국어 체크인 시스템이 전면 도입되었습니다.',
    summaryJa: '札幌を代表するモエレ沼公園パークゴルフ場がフェアウェイ天然芝の張り替え工事を完了しリニューアルオープン。韓国など海外ゴルファー向けにモバイルQR多言語チェックインが導入されました。',
    source: 'MinPG (みんなのパークゴルフ)',
    sourceKo: 'MinPG (민나노 파크골프)',
    sourceJa: 'MinPG (みんなのパークゴルフ)',
    region: '北海道 札幌',
    regionKo: '홋카이도 삿포로',
    regionJa: '北海道 札幌',
    category: 'LOCAL',
    dateStr: '2026.09.21',
    linkUrl: 'https://min-parkgolf.jp/course/sapporo-moerenuma-2026',
    viewCount: 1890,
    likeCount: 245,
  },
];

export const DEFAULT_VOICES: UserVoiceItem[] = [
  {
    id: 'voice-1',
    authorName: '박골퍼(동락클럽)',
    category: 'FEATURE',
    title: '클럽 대항전 할 때 2개 팀 말고 3개 팀 삼파전도 조편성 지원해 주세요!',
    content: '구미랑 대구랑 칠곡 3개 클럽이 모여서 교류전을 자주 하는데, 3개 팀 크로스 조편성 기능이 생기면 정말 유용하겠습니다.',
    status: 'RESOLVED',
    officialReply: '대표 김대희 & 개발팀: 의견 감사드립니다! 3팀 삼파전 및 4팀 연합전 자동 조편성 기능이 v1.2에 완벽히 반영되었습니다. 적극 활용해 보세요!',
    likeCount: 24,
    createdAt: '2026-09-15',
    likedByMe: true,
  },
  {
    id: 'voice-2',
    authorName: '이프로(부산삼락)',
    category: 'COURSE_INFO',
    title: '전국 구장 찾기 할 때 내 위치에서 가까운 순서로 거리(km) 뜨면 좋겠습니다',
    content: '타 지역 출장 갈 때마다 가까운 구장 찾기가 번거로웠는데 GPS 거리순 정렬이 되면 최고일 것 같습니다.',
    status: 'RESOLVED',
    officialReply: '운영팀: 제안해 주신 GPS 반경 연동 및 내 위치 기준 거리(km) 정렬 기능이 게시판과 구장 찾기 전체에 반영 완료되었습니다!',
    likeCount: 31,
    createdAt: '2026-09-14',
    likedByMe: true,
  },
  {
    id: 'voice-3',
    authorName: '최순자(여의도)',
    category: 'FEATURE',
    title: '라운드 중 스코어 입력 시 어르신들을 위해 글자 크기 더 크게 해 주세요',
    content: '햇빛이 강할 때 폰 화면이 작아서 타수 버튼 누르기가 약간 어려웠습니다. 버튼 크기를 조금 더 키워주실 수 있나요?',
    status: 'IN_REVIEW',
    officialReply: '디자인팀: 접수 완료되었습니다. 시니어 52px+ 대형 터치 버튼 및 고대비 시인성 패치를 다음 업데이트에 반영 예정입니다.',
    likeCount: 19,
    createdAt: '2026-09-15',
    likedByMe: false,
  },
];

export const DEFAULT_POSTS: FreeBoardPost[] = [
  {
    id: 'post-1',
    authorName: '동락 파크사랑',
    region: '경북 구미',
    content: '오늘 동락 구장 잔디 상태 최고입니다! 오후에 시간 되시는 1촌분들 번개 한번 칩시다~ 날씨 정말 쾌청하네요 ☀️',
    likeCount: 15,
    commentCount: 4,
    createdAt: '10분 전',
    likedByMe: false,
  },
  {
    id: 'post-2',
    authorName: '낙동강 홀인원',
    region: '부산',
    content: '삼락 36홀 완주하고 왔습니다. 이번에 새로 산 카본 클럽 손맛이 정말 좋네요. 다들 안전하고 즐거운 매너 라운딩 하세요!',
    likeCount: 12,
    commentCount: 2,
    createdAt: '45분 전',
    likedByMe: true,
  },
  {
    id: 'post-3',
    authorName: '수성 패밀리',
    region: '대구',
    content: '주말에 구미 동락 클럽 분들과의 32인 친선 대항전 너무 즐거웠습니다. 전광판 시스템 덕분에 프로 시합 온 기분이었네요 👍',
    likeCount: 28,
    commentCount: 7,
    createdAt: '2시간 전',
    likedByMe: true,
  },
];

export class BoardStorage {
  private static isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  // 1. 유저 GPS 위치 저장 & 조회
  static getUserLocation(): { lat: number; lng: number; regionName: string } | null {
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setUserLocation(lat: number, lng: number, regionName: string) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify({ lat, lng, regionName }));
  }

  // 2. 전국 대회 시합 공고 목록
  static getNotices(): TournamentNotice[] {
    if (!this.isBrowser()) return DEFAULT_NOTICES;
    const raw = localStorage.getItem(STORAGE_KEYS.NOTICES);
    if (!raw) {
      this.saveNotices(DEFAULT_NOTICES);
      return DEFAULT_NOTICES;
    }
    try {
      const parsed: TournamentNotice[] = JSON.parse(raw);
      // 구버전 캐시, 항목 수 부족, 또는 일본어/한국어 대응 필드 누락 시 최신 데이터로 자동 정화
      if (
        parsed.length < DEFAULT_NOTICES.length ||
        parsed.some(
          (item) =>
            !item.titleJa ||
            !item.country ||
            !item.eventDateStrJa ||
            !item.linkUrl ||
            item.linkUrl === 'https://www.kpga7330.com/competitions' ||
            item.linkUrl === 'https://www.kpga7330.com/competitions/' ||
            item.linkUrl.includes('/club') ||
            item.id === 'notice-1'
        )
      ) {
        this.saveNotices(DEFAULT_NOTICES);
        return DEFAULT_NOTICES;
      }
      return parsed;
    } catch {
      return DEFAULT_NOTICES;
    }
  }

  static saveNotices(list: TournamentNotice[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.NOTICES, JSON.stringify(list));
  }

  static addNotice(notice: Omit<TournamentNotice, 'id' | 'createdAt'>): TournamentNotice {
    const list = this.getNotices();
    const newItem: TournamentNotice = {
      ...notice,
      id: `notice-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    list.unshift(newItem);
    this.saveNotices(list);
    return newItem;
  }

  // 3. 파크골프 뉴스 목록
  static getNews(): ParkGolfNewsItem[] {
    if (!this.isBrowser()) return DEFAULT_NEWS;
    const raw = localStorage.getItem(STORAGE_KEYS.NEWS);
    if (!raw) {
      this.saveNews(DEFAULT_NEWS);
      return DEFAULT_NEWS;
    }
    try {
      const parsed: ParkGolfNewsItem[] = JSON.parse(raw);
      if (
        parsed.length < DEFAULT_NEWS.length ||
        parsed.some(
          (item) =>
            !item.titleJa ||
            !item.country ||
            item.linkUrl?.includes('/courses') ||
            item.linkUrl?.includes('/rules') ||
            item.linkUrl?.includes('/club')
        )
      ) {
        this.saveNews(DEFAULT_NEWS);
        return DEFAULT_NEWS;
      }
      return parsed;
    } catch {
      return DEFAULT_NEWS;
    }
  }

  static saveNews(list: ParkGolfNewsItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(list));
  }

  static addUserReportNews(news: { title: string; summary: string; region: string; authorName: string }): ParkGolfNewsItem {
    const list = this.getNews();
    const newItem: ParkGolfNewsItem = {
      id: `news-user-${Date.now()}`,
      title: news.title.trim(),
      summary: news.summary.trim(),
      source: `회원 제보 (${news.authorName})`,
      region: news.region,
      category: 'USER_REPORT',
      dateStr: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      authorName: news.authorName,
      viewCount: 1,
      likeCount: 0,
    };
    list.unshift(newItem);
    this.saveNews(list);
    return newItem;
  }

  // 4. 열린 신문고 (고객 건의 & 오류 제보)
  static getUserVoices(): UserVoiceItem[] {
    if (!this.isBrowser()) return DEFAULT_VOICES;
    const raw = localStorage.getItem(STORAGE_KEYS.VOICES);
    if (!raw) {
      this.saveUserVoices(DEFAULT_VOICES);
      return DEFAULT_VOICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_VOICES;
    }
  }

  static saveUserVoices(list: UserVoiceItem[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.VOICES, JSON.stringify(list));
  }

  static addUserVoice(item: { authorName: string; category: UserVoiceItem['category']; title: string; content: string }): UserVoiceItem {
    const list = this.getUserVoices();
    const newItem: UserVoiceItem = {
      id: `voice-${Date.now()}`,
      authorName: item.authorName || '파크골프 올인원 동호인',
      category: item.category,
      title: item.title.trim(),
      content: item.content.trim(),
      status: 'RECEIVED',
      likeCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      likedByMe: false,
    };
    list.unshift(newItem);
    this.saveUserVoices(list);
    return newItem;
  }

  static toggleVoiceLike(id: string): UserVoiceItem | null {
    const list = this.getUserVoices();
    const target = list.find((v) => v.id === id);
    if (!target) return null;
    if (target.likedByMe) {
      target.likeCount = Math.max(0, target.likeCount - 1);
      target.likedByMe = false;
    } else {
      target.likeCount += 1;
      target.likedByMe = true;
    }
    this.saveUserVoices(list);
    return target;
  }

  // 5. 동호인 사랑방 자유 토크
  static getPosts(): FreeBoardPost[] {
    if (!this.isBrowser()) return DEFAULT_POSTS;
    const raw = localStorage.getItem(STORAGE_KEYS.POSTS);
    if (!raw) {
      this.savePosts(DEFAULT_POSTS);
      return DEFAULT_POSTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return DEFAULT_POSTS;
    }
  }

  static savePosts(list: FreeBoardPost[]) {
    if (!this.isBrowser()) return;
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(list));
  }

  static addPost(authorName: string, region: string, content: string): FreeBoardPost {
    const list = this.getPosts();
    const newItem: FreeBoardPost = {
      id: `post-${Date.now()}`,
      authorName: authorName || '익명 동호인',
      region: region || '전국',
      content: content.trim(),
      likeCount: 0,
      commentCount: 0,
      createdAt: '방금 전',
      likedByMe: false,
    };
    list.unshift(newItem);
    this.savePosts(list);
    return newItem;
  }
}
