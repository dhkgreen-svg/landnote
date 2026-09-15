import { TournamentNotice, ParkGolfNewsItem, UserVoiceItem, FreeBoardPost } from '@/types/board';

const STORAGE_KEYS = {
  NOTICES: 'parkon_tournament_notices_v1',
  NEWS: 'parkon_news_items_v1',
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
    id: 'notice-1',
    title: '🏆 2026 제1회 구미시장배 전국 파크골프 오픈 챔피언십',
    host: '구미시 파크골프협회 / 구미시체육회',
    region: '경북 구미',
    courseName: '구미 동락 파크골프장 (A·B·C·D 36홀)',
    courseId: 'course-gumi-dongrak',
    status: 'RECRUITING',
    periodStr: '2026.09.15 ~ 09.28 (선착순 마감)',
    eventDateStr: '2026년 10월 17일(토) 08:30 샷건',
    entryFee: '1인 30,000원 (중식, 기념품, 참가상 포함)',
    targetCount: '남녀 각 144명 (총 288명 72개 조)',
    qualification: '전국 파크골프 동호인 누구나 (공인구 및 공인클럽 소지자)',
    linkUrl: 'https://www.parkongolf.com/club',
    isAiCurated: true,
    createdAt: '2026-09-15',
    lat: 36.10398,
    lng: 128.3756,
  },
  {
    id: 'notice-2',
    title: '🏆 2026 대구광역시장배 영남권 시·도 친선 초청대회',
    host: '대구광역시 파크골프협회',
    region: '대구 수성',
    courseName: '대구 수성 파크골프장 (18홀)',
    courseId: 'course-daegu-suseong',
    status: 'RECRUITING',
    periodStr: '2026.09.10 ~ 09.25',
    eventDateStr: '2026년 10월 10일(토) 09:00',
    entryFee: '1인 20,000원',
    targetCount: '총 144명',
    qualification: '영남권 및 전국 클럽 등록 회원',
    linkUrl: 'https://www.parkongolf.com/club',
    isAiCurated: true,
    createdAt: '2026-09-14',
    lat: 35.8583,
    lng: 128.6318,
  },
  {
    id: 'notice-3',
    title: '🏆 제5회 부산 낙동강 에코 파크골프 페스티벌 & 전국 오픈전',
    host: '부산시 파크골프연합회',
    region: '부산 사상',
    courseName: '부산 삼락 생태공원 파크골프장 (36홀)',
    courseId: 'course-busan-samnak',
    status: 'UPCOMING',
    periodStr: '2026.10.01 접수 오픈 예정',
    eventDateStr: '2026년 10월 24일(토)',
    entryFee: '1인 25,000원',
    targetCount: '총 240명',
    qualification: '전국 파크골프 동호인',
    linkUrl: 'https://www.parkongolf.com/club',
    isAiCurated: true,
    createdAt: '2026-09-13',
    lat: 35.1705,
    lng: 128.9745,
  },
  {
    id: 'notice-4',
    title: '🏆 2026 수도권 한강변 파크골프 친선 최강전',
    host: '서울시·경기도 파크골프협회 공동 주관',
    region: '서울 영등포',
    courseName: '여의도 파크골프장 (18홀)',
    courseId: 'course-seoul-yeouido',
    status: 'RECRUITING',
    periodStr: '2026.09.12 ~ 09.22',
    eventDateStr: '2026년 10월 3일(개천절) 08:30',
    entryFee: '1인 20,000원',
    targetCount: '16개 조 64명',
    qualification: '수도권 및 전국 파크골프 동호인',
    linkUrl: 'https://www.parkongolf.com/club',
    isAiCurated: true,
    createdAt: '2026-09-12',
    lat: 37.5255,
    lng: 126.9242,
  },
  {
    id: 'notice-5',
    title: '🏆 2026 양평 남한강 물맑은 파크골프 전국 선수권대회',
    host: '양평군 체육회 / 군 협회',
    region: '경기 양평',
    courseName: '양평 강상 파크골프장 (36홀)',
    courseId: 'course-yangpyeong-gangsang',
    status: 'CLOSED',
    periodStr: '접수 마감 (대기자 신청 가능)',
    eventDateStr: '2026년 9월 26일(토)',
    entryFee: '1인 30,000원',
    targetCount: '360명 (마감 완료)',
    qualification: '전국 공인 3급 이상 지도자 및 동호인',
    linkUrl: 'https://www.parkongolf.com/club',
    isAiCurated: true,
    createdAt: '2026-09-08',
    lat: 37.4912,
    lng: 127.4875,
  },
];

export const DEFAULT_NEWS: ParkGolfNewsItem[] = [
  // 전국 메이저 뉴스
  {
    id: 'news-1',
    title: '전국 파크골프 인구 400만 돌파! 공인 구장 450개소 신설 및 확장 가속화',
    summary: '시니어 레저를 넘어 3040 세대까지 급속히 확산되며 전국 지자체의 파크골프장 인프라 확충 투자가 사상 최대치를 기록하고 있습니다.',
    source: '한국레저산업연구원 / 파크골프뉴스',
    region: '전국',
    category: 'MAJOR',
    dateStr: '2026.09.16',
    linkUrl: 'https://www.parkongolf.com',
    viewCount: 1420,
    likeCount: 98,
  },
  {
    id: 'news-2',
    title: '대한파크골프협회, 2026 공인구 반발력 및 그립 규격 개정안 공시',
    summary: '비거리 과열 방지와 필드 안전 강화를 위해 2026년 하반기 공식 시합부터 적용되는 장비 검정 가이드라인을 최종 고시했습니다.',
    source: '협회 공인 기술위원회',
    region: '전국',
    category: 'MAJOR',
    dateStr: '2026.09.15',
    linkUrl: 'https://www.parkongolf.com/rules',
    viewCount: 980,
    likeCount: 65,
  },
  // 지역 밀착형 뉴스
  {
    id: 'news-3',
    title: '[경북 구미] 동락 파크골프장 A·B코스 잔디 보식 완료, 18일부터 정상 라운딩',
    summary: '구미도시공사는 여름철 폭염으로 손상되었던 그린 잔디 보식 작업을 성공적으로 완료하고 전면 개방한다고 밝혔습니다.',
    source: '구미시민신문',
    region: '경북',
    category: 'LOCAL',
    dateStr: '2026.09.16',
    linkUrl: 'https://www.parkongolf.com/courses',
    viewCount: 840,
    likeCount: 52,
    lat: 36.10398,
    lng: 128.3756,
  },
  {
    id: 'news-4',
    title: '[대구 수성] 범어·만촌 동호인 연합, 매주 토요일 클럽 친선 샷건전 정례화',
    summary: '수성구 파크골프 클럽 연합회는 구민 건강 증진과 매너 골프 확산을 위해 주말 정기 친선 리그를 발족했습니다.',
    source: '대구일보 체육부',
    region: '대구',
    category: 'LOCAL',
    dateStr: '2026.09.15',
    linkUrl: 'https://www.parkongolf.com/club',
    viewCount: 610,
    likeCount: 44,
    lat: 35.8583,
    lng: 128.6318,
  },
  {
    id: 'news-5',
    title: '[부산 삼락] 가을철 낙동강 갈대밭 뷰 36홀 라운딩 예약 동호인 급증',
    summary: '선선한 가을 날씨 속에 삼락 생태공원 파크골프장을 찾는 전국 원정 라운딩 팀이 주말마다 조기 마감 행진을 이어가고 있습니다.',
    source: '부산시보',
    region: '부산',
    category: 'LOCAL',
    dateStr: '2026.09.14',
    linkUrl: 'https://www.parkongolf.com/courses',
    viewCount: 530,
    likeCount: 39,
    lat: 35.1705,
    lng: 128.9745,
  },
  {
    id: 'news-6',
    title: '[서울 여의도] 한강 시민 파크골프 교실 개설... 60세 이상 무료 레슨 운영',
    summary: '서울시 한강사업본부는 초보 동호인들의 안전 수칙과 기본자세 지도를 위한 전문 프로 강사진을 배치 운영합니다.',
    source: '서울신문',
    region: '서울',
    category: 'LOCAL',
    dateStr: '2026.09.13',
    linkUrl: 'https://www.parkongolf.com/courses',
    viewCount: 720,
    likeCount: 58,
    lat: 37.5255,
    lng: 126.9242,
  },
  {
    id: 'news-7',
    title: '[경기 양평] 전국 최대 108홀 규모 파크골프 테마파크 조성 2단계 착공',
    summary: '양평군은 수도권 동호인 유치와 전국 메이저 대회 유치를 위해 강상면 일대에 종합 휴게 시설과 숙박 연계 단지를 확충합니다.',
    source: '경기일보',
    region: '경기',
    category: 'LOCAL',
    dateStr: '2026.09.12',
    linkUrl: 'https://www.parkongolf.com/courses',
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
      return JSON.parse(raw);
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
      return JSON.parse(raw);
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
