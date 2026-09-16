import { TournamentNotice, ParkGolfNewsItem, UserVoiceItem, FreeBoardPost } from '@/types/board';

const STORAGE_KEYS = {
  NOTICES: 'parkon_tournament_notices_v4',
  NEWS: 'parkon_news_items_v2',
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
  {
    id: 'notice-kpga-1',
    title: '🏆 제4회 문화체육관광부장관기 전국 파크골프대회',
    host: '사단법인 대한파크골프협회 / 문화체육관광부',
    region: '경남 창원',
    courseName: '창원 대산면 파크골프장 (72홀 공인구장)',
    courseId: 'course-changwon-daesan',
    status: 'RECRUITING',
    periodStr: '2026.09.15 ~ 10.05 (협회 공고)',
    eventDateStr: '2026년 10월 20일(화) ~ 21일(수)',
    entryFee: '1인 30,000원',
    targetCount: '전국 시·도 대표선수단 총 600명',
    qualification: '대한파크골프협회 2026 등록 정회원 및 시·도 선발 선수',
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
    title: '🏆 제9회 물맑은 양평 전국 파크골프대회',
    host: '양평군 파크골프협회 / 사단법인 대한파크골프협회',
    region: '경기 양평',
    courseName: '양평 강상 파크골프장 (36홀)',
    courseId: 'course-yangpyeong-gangsang',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 09.30',
    eventDateStr: '2026년 10월 24일(토)',
    entryFee: '1인 30,000원',
    targetCount: '전국 동호인 360명 (선착순)',
    qualification: '전국 파크골프 동호인 (대한파크골프협회 등록회원)',
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
    title: '🏆 2026 대구광역시 파크골프협회장기 및 시장배 시니어 대회',
    host: '대구광역시 파크골프협회 / 대구광역시체육회',
    region: '대구 수성',
    courseName: '대구 수성 파크골프장 (18홀) / 달성 구지 레포츠파크',
    courseId: 'course-daegu-suseong',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 09.28',
    eventDateStr: '2026년 10월 10일(토) 09:00',
    entryFee: '1인 20,000원',
    targetCount: '대구 및 영남권 동호인 총 288명',
    qualification: '대구광역시 및 전국 파크골프협회 등록 동호인',
    linkUrl: 'https://parkgolf.daegu.go.kr',
    directNoticeUrl: 'https://parkgolf.daegu.go.kr',
    isAiCurated: true,
    createdAt: '2026-09-13',
    lat: 35.8583,
    lng: 128.6318,
  },
  {
    id: 'notice-kpga-4',
    title: '🏆 제2회 청풍호반배 전국 파크골프대회',
    host: '제천시 파크골프협회 / 사단법인 대한파크골프협회',
    region: '충북 제천',
    courseName: '제천 청풍호 파크골프장 (36홀)',
    courseId: 'course-jecheon-cheongpung',
    status: 'RECRUITING',
    periodStr: '2026.09.12 ~ 10.15',
    eventDateStr: '2026년 10월 24일(토) 09:00',
    entryFee: '1인 25,000원',
    targetCount: '전국 동호인 240명',
    qualification: '대한파크골프협회 등록 동호인 누구나',
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
    title: '🏆 2026 볼빅(Volvik) 전국 파크골프 챔피언십',
    host: '볼빅 / 사단법인 대한파크골프협회 공인',
    region: '인천 서구',
    courseName: '인천 청라 아시아드 파크골프장 (36홀)',
    courseId: 'course-incheon-asiad',
    status: 'RECRUITING',
    periodStr: '2026.09.08 ~ 09.25',
    eventDateStr: '2026년 10월 19일(월) 08:30',
    entryFee: '1인 30,000원',
    targetCount: '전국 320명 (오픈 챔피언십)',
    qualification: '전국 파크골프 동호인 (볼빅 공인구 사용 필수)',
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
    title: '🏆 제2회 달성군·MBN 전국파크골프대회',
    host: '달성군체육회 / MBN 매일방송 / 사단법인 대한파크골프협회',
    region: '대구 달성',
    courseName: '다사세천 파크골프장 (36홀)',
    courseId: 'course-daegu-dasa',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 10.05',
    eventDateStr: '2026년 10월 17일(토) ~ 18일(일)',
    entryFee: '1인 30,000원',
    targetCount: '전국 480명',
    qualification: '전국 파크골프 동호인 누구나',
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
  // 전국 메이저 뉴스
  {
    id: 'news-1',
    title: '전국 파크골프 인구 400만 돌파! 공인 구장 450개소 신설 및 확장 가속화',
    summary: '시니어 레저를 넘어 3040 세대까지 급속히 확산되며 전국 지자체의 파크골프장 인프라 확충 투자가 사상 최대치를 기록하고 있습니다.',
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
    title: '대한파크골프협회, 2026 공인구 반발력 및 그립 규격 개정안 공시',
    summary: '비거리 과열 방지와 필드 안전 강화를 위해 2026년 하반기 공식 시합부터 적용되는 장비 검정 가이드라인을 최종 고시했습니다.',
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
    title: '[경북 구미] 동락 파크골프장 A·B코스 잔디 보식 완료, 18일부터 정상 라운딩',
    summary: '구미도시공사는 여름철 폭염으로 손상되었던 그린 잔디 보식 작업을 성공적으로 완료하고 전면 개방한다고 밝혔습니다.',
    source: '구미시청 및 공단 공지',
    region: '경북',
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
    title: '[대구 수성] 수성 및 달성 파크골프장 가을철 친선 경기 온라인 예약 운영',
    summary: '대구광역시는 구민 및 동호인 편의를 위해 온라인 실시간 예약 시스템을 통해 주말 경기 접수를 진행합니다.',
    source: '대구광역시 파크골프 포털',
    region: '대구',
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
    title: '[부산 사상] 낙동강 삼락 파크골프장 36홀 가을철 잔디 생육 및 라운딩 공지',
    summary: '부산광역시는 낙동강 생태공원 내 삼락 파크골프장의 쾌적한 경기 환경을 위한 코스 관리 일정을 안내했습니다.',
    source: '부산광역시 체육 포털',
    region: '부산',
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
    title: '[서울 여의도] 한강 시민 파크골프 무료 강좌 및 필드 안전 수칙 안내',
    summary: '서울시 한강사업본부는 시니어 및 초보 골퍼를 위한 공인 지도자 레슨 프로그램을 개설했습니다.',
    source: '서울시 미래한강본부',
    region: '서울',
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
    title: '[경기 양평] 양평 강상 파크골프장 가을 메이저 대회 준비 및 잔디 정비',
    summary: '양평군은 전국대회 유치를 위해 강상면 파크골프장 코스 정비 및 부대시설 확충을 완료했습니다.',
    source: '양평군청 체육과',
    region: '경기',
    category: 'LOCAL',
    dateStr: '2026.09.12',
    linkUrl: 'https://www.yp21.go.kr',
    viewCount: 890,
    likeCount: 71,
    lat: 37.4912,
    lng: 127.4875,
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
      // 구버전 범용 목록 링크(/competitions) 또는 가상 링크가 포함된 경우 최신 공식 공고 직통 실데이터로 즉시 자동 정화
      if (
        parsed.some(
          (item) =>
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
      if (parsed.some((item) => item.linkUrl?.includes('/courses') || item.linkUrl?.includes('/rules') || item.linkUrl?.includes('/club'))) {
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
      authorName: item.authorName || '파크온 동호인',
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
