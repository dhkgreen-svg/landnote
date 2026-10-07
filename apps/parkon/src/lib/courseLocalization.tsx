import { JAPAN_COURSES_DB } from './japanCoursesDb';
import React from 'react';
import { Course, HoleMetadata } from '@/types/parkon';
import { generateStandardHoles } from '@/lib/defaultCourses';

/**
 * 1. 구장명 뒤 사족('파크골프장', 'パークゴルフ場', '파크골프', '골프장' 등) 완전 제거 함수
 * 예: "구미 동락파크골프장" -> "구미 동락"
 * 예: "구미 양포파크골프장" -> "구미 양포"
 * 예: "つつじが丘パークゴルフ場" -> "つつじが丘"
 */
export function stripParkGolfSuffix(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/파크골프장/g, '')
    .replace(/パークゴルフ場/g, '')
    .replace(/パークゴルフ/g, '')
    .replace(/파크골프/g, '')
    .replace(/골프장/g, '')
    .replace(/ゴルフ場/g, '')
    .replace(/Park Golf/gi, '')
    .trim();
}

/**
 * 주요 한국 지역 및 구장명의 고유명사 한자 / 가타카나 매핑 사전
 */
const KOREAN_TO_JAPANESE_MAP: Record<string, { kanji: string; kana: string }> = {
  // 경북 / 대구
  '구미': { kanji: '亀尾', kana: 'クミ' },
  '동락': { kanji: '同楽', kana: 'ドンラク' },
  '양포': { kanji: '陽浦', kana: 'ヤンポ' },
  '양호': { kanji: '陽湖', kana: 'ヤンホ' },
  '선산': { kanji: '善山', kana: 'ソンサン' },
  '도개': { kanji: '桃開', kana: 'ドゲ' },
  '군위': { kanji: '軍威', kana: 'グンウィ' },
  '효령': { kanji: '孝令', kana: 'ヒョリョン' },
  '고로': { kanji: '古老', kana: 'ゴロ' },
  '의흥': { kanji: '義興', kana: 'ウィフン' },
  '삼국유사': { kanji: '三国遺事', kana: 'サムグギュサ' },
  '대구': { kanji: '大邱', kana: 'テグ' },
  '달성': { kanji: '達城', kana: 'ダルソン' },
  '강창': { kanji: '江倉', kana: 'カンチャン' },
  '수성': { kanji: '寿城', kana: 'スソン' },
  '팔현': { kanji: '八賢', kana: 'パルヒョン' },
  '불로': { kanji: '不老', kana: 'ブルロ' },
  '강변': { kanji: '江辺', kana: 'カンビョン' },
  '낙동강': { kanji: '洛東江', kana: 'ナクトンガン' },
  '금호강': { kanji: '琴湖江', kana: 'クムホガン' },
  '화원': { kanji: '花園', kana: 'ファウォン' },
  '성서': { kanji: '城西', kana: 'ソンソ' },
  '안동': { kanji: '安東', kana: 'アンドン' },
  '포항': { kanji: '浦項', kana: 'ポハン' },
  '경주': { kanji: '慶州', kana: 'キョンジュ' },
  '영천': { kanji: '永川', kana: 'ヨンチョン' },
  '경산': { kanji: '慶山', kana: 'キョンサン' },
  '상주': { kanji: '尚州', kana: 'サンジュ' },
  '문경': { kanji: '聞慶', kana: 'ムンギョン' },
  '칠곡': { kanji: '漆谷', kana: 'チルゴク' },
  '청도': { kanji: '清道', kana: 'チョンド' },

  // 부산 / 경남 / 울산
  '부산': { kanji: '釜山', kana: 'プサン' },
  '삼락': { kanji: '三楽', kana: 'サムナク' },
  '화명': { kanji: '華明', kana: 'ファミョン' },
  '대저': { kanji: '大渚', kana: 'テジョ' },
  '을숙도': { kanji: '乙淑島', kana: 'ウルスクト' },
  '울산': { kanji: '蔚山', kana: 'ウルサン' },
  '태화강': { kanji: '太和江', kana: 'テファガン' },
  '창원': { kanji: '昌原', kana: 'チャンウォン' },
  '김해': { kanji: '金海', kana: 'キムヘ' },
  '진주': { kanji: '晋州', kana: 'チンジュ' },
  '양산': { kanji: '梁山', kana: 'ヤンサン' },
  '밀양': { kanji: '密陽', kana: 'ミリャン' },

  // 서울 / 경기 / 인천
  '서울': { kanji: 'ソウル', kana: 'ソウル' },
  '잠실': { kanji: '蚕室', kana: 'チャムシル' },
  '여의도': { kanji: '汝矣島', kana: 'ヨイド' },
  '난지도': { kanji: '蘭芝島', kana: 'ナンジド' },
  '월드컵': { kanji: 'ワールドカップ', kana: 'ワールドカップ' },
  '노을': { kanji: '夕焼け', kana: 'ノウル' },
  '중랑천': { kanji: '中浪川', kana: 'チュンランチョン' },
  '안양천': { kanji: '安養川', kana: 'アニャンチョン' },
  '탄천': { kanji: '炭川', kana: 'タンチョン' },
  '양평': { kanji: '楊平', kana: 'ヤンピョン' },
  '강상': { kanji: '江上', kana: 'カンサン' },
  '가평': { kanji: '加平', kana: 'カピョン' },
  '하남': { kanji: '河南', kana: 'ハナム' },
  '남양주': { kanji: '南楊州', kana: 'ナミャンジュ' },
  '화성': { kanji: '華城', kana: 'ファソン' },
  '수원': { kanji: '水原', kana: 'スウォン' },
  '인천': { kanji: '仁川', kana: 'インチョン' },
  '송도': { kanji: '松島', kana: 'ソンド' },
  '청라': { kanji: '青羅', kana: 'チョンラ' },

  // 강원
  '양양': { kanji: '襄陽', kana: 'ヤンヤン' },
  '송이': { kanji: '松茸', kana: 'ソンイ' },
  '춘천': { kanji: '春川', kana: 'チュンチョン' },
  '원주': { kanji: '原州', kana: 'ウォンジュ' },
  '강릉': { kanji: '江陵', kana: 'カンヌン' },
  '화천': { kanji: '華川', kana: 'ファチョン' },
  '산천어': { kanji: '山川魚', kana: 'サンチョノ' },

  // 충청 / 대전 / 세종
  '대전': { kanji: '大田', kana: 'テジョン' },
  '갑천': { kanji: '甲川', kana: 'カプチョン' },
  '세종': { kanji: '世宗', kana: 'セジョン' },
  '청주': { kanji: '清州', kana: 'チョンジュ' },
  '충주': { kanji: '忠州', kana: 'チュンジュ' },
  '천안': { kanji: '天安', kana: 'チョナン' },
  '아산': { kanji: '牙山', kana: 'アサン' },

  // 전라 / 광주 / 제주
  '광주': { kanji: '光州', kana: 'クァンジュ' },
  '전주': { kanji: '全州', kana: 'チョンジュ' },
  '군산': { kanji: '群山', kana: 'クンサン' },
  '익산': { kanji: '益山', kana: 'イクサン' },
  '목포': { kanji: '木浦', kana: 'モクポ' },
  '여수': { kanji: '麗水', kana: 'ヨス' },
  '순천': { kanji: '順天', kana: 'スンチョン' },
  '제주': { kanji: '済州', kana: 'チェジュ' },
};

/**
 * 한국 구장명의 클린 텍스트로부터 일본어 표기(한자/가타카나) 자동 산출
 * 예: "구미 동락" -> "亀尾 同楽 (クミ ドンラク)"
 * 예: "구미 양포" -> "亀尾 陽浦 (クミ ヤンポ)"
 * 예: "군위 효령" -> "軍威 孝令 (グンウィ ヒョリョン)"
 */
export function translateKoreanCourseNameToJapanese(cleanKoName: string): string {
  if (!cleanKoName) return '';

  const words = cleanKoName.split(/\s+/);
  const kanjiParts: string[] = [];
  const kanaParts: string[] = [];

  for (const word of words) {
    if (KOREAN_TO_JAPANESE_MAP[word]) {
      kanjiParts.push(KOREAN_TO_JAPANESE_MAP[word].kanji);
      kanaParts.push(KOREAN_TO_JAPANESE_MAP[word].kana);
    } else {
      // 복합어 부분 매칭 시도
      let matched = false;
      for (const [k, v] of Object.entries(KOREAN_TO_JAPANESE_MAP)) {
        if (word.startsWith(k)) {
          const rest = word.slice(k.length);
          kanjiParts.push(v.kanji + (KOREAN_TO_JAPANESE_MAP[rest]?.kanji || rest));
          kanaParts.push(v.kana + (KOREAN_TO_JAPANESE_MAP[rest]?.kana || rest));
          matched = true;
          break;
        }
      }
      if (!matched) {
        kanjiParts.push(word);
      }
    }
  }

  const kanjiStr = kanjiParts.join(' ');
  const kanaStr = kanaParts.length > 0 ? kanaParts.join(' ') : '';

  if (kanaStr && kanaStr !== kanjiStr) {
    return `${kanjiStr} (${kanaStr})`;
  }
  return kanjiStr;
}

/**
 * 🇯🇵 일본 본토 실제 유명 명문 파크골프장 25곳 공식 DB 프리셋
 * (홋카이도 마쿠베츠 발상지 코스, 삿포로, 오비히로, 토마코마이, 도호쿠, 간토 등)
 */
/**
 * 🇯🇵 일본 전역 공인 및 명문 파크골프장 공식 통합 데이터베이스 (총 675개 구장)
 * - NPGA(공익사단법인 일본파크골프협회) 공식 공인 336개 코스 (GPS 위도·경도 좌표 100% 탑재)
 * - 전국 47개 도도부현 지자체 및 시민 코스 전수 통합
 */
export const JAPAN_DEFAULT_COURSES: Course[] = JAPAN_COURSES_DB;

export interface CourseDualNameResult {
  primary: string;       // 상단 메인 (큰 글씨)
  secondary?: string;    // 하단 서브 괄호 (작은 글씨, 2줄 필요시에만 노출)
  showSecondary: boolean;// 2줄 표시 여부 (자국 구장은 false)
  flag?: string;         // 타국 구장 방문 시 🇰🇷 또는 🇯🇵 (자국 구장은 '')
  cleanKo: string;       // 사족 없는 한국어 순수명칭
  cleanJa: string;       // 사족 없는 일본어 순수명칭
}

/**
 * 👑 대표님 표준 4-Quadrant 한/일 구장명 표출 원칙:
 *
 * 1. [한국인 + 한국 구장]:
 *    - 한국 사람이 한국에서 칠 때는 깔끔하게 한국어 1줄만 표출! (일본어 전혀 불필요)
 *    - 1줄: "구미 동락" (사족 제거)
 *    - 2줄: 없음
 *
 * 2. [일본인 + 한국 구장]:
 *    - 일본 사람이 한국 구장에 오면 현장 간판을 찾아야 하므로 한글이 1줄, 밑에 일본어 번역 2줄!
 *    - 1줄: "구미 동락"
 *    - 2줄: "(亀尾 同楽 · クミ ドンラク)"
 *
 * 3. [일본인 + 일본 구장]:
 *    - 일본 사람이 일본에서 칠 때는 당연히 일본어 1줄만 표출! (한국어 전혀 불필요)
 *    - 1줄: "まくべつ つつじが丘"
 *    - 2줄: 없음
 *
 * 4. [한국인 + 일본 구장]:
 *    - 한국 사람이 일본에 가면 현장 팻말이 일본어이므로 일본어가 1줄, 밑에 한국어 발음 2줄!
 *    - 1줄: "まくべつ つつじが丘"
 *    - 2줄: "(마쿠베츠 쓰쓰지가오카)"
 */
export function getCourseDualName(
  courseOrName: Course | string | null | undefined,
  isJapanese: boolean
): CourseDualNameResult {
  if (!courseOrName) {
    if (isJapanese) {
      return {
        primary: 'まくべつ つつじが丘',
        secondary: '',
        showSecondary: false,
        flag: '',
        cleanKo: '마쿠베츠 쓰쓰지가오카',
        cleanJa: 'まくべつ つつじが丘',
      };
    }
    return {
      primary: '구미 동락',
      secondary: '',
      showSecondary: false,
      flag: '',
      cleanKo: '구미 동락',
      cleanJa: '亀尾 同楽',
    };
  }

  // 1. 객체 또는 문자열 파싱
  const isObj = typeof courseOrName === 'object';
  const rawName = isObj ? (courseOrName as Course).name : (courseOrName as string);
  const courseId = isObj ? (courseOrName as Course).id || '' : '';
  const isJapanCourse =
    (isObj && (courseOrName as Course).country === 'JP') ||
    courseId.startsWith('jp-') ||
    rawName.includes('つつじ') ||
    rawName.includes('まくべつ') ||
    rawName.includes('幕別') ||
    rawName.includes('札幌') ||
    rawName.includes('忠類') ||
    rawName.includes('帯広');

  // 2. 사족 제거
  const cleanName = stripParkGolfSuffix(rawName);

  // 3. 일본 구장 처리
  if (isJapanCourse) {
    const cleanJa = (isObj && (courseOrName as Course).nameJa)
      ? stripParkGolfSuffix((courseOrName as Course).nameJa!)
      : cleanName;
    const cleanKo = (isObj && (courseOrName as Course).nameKo)
      ? stripParkGolfSuffix((courseOrName as Course).nameKo!)
      : cleanJa;

    if (isJapanese) {
      // [Case 3] 일본 사람이 일본 구장에서 칠 때: 일본어 1줄 단독
      return {
        primary: cleanJa,
        secondary: '',
        showSecondary: false,
        flag: '',
        cleanKo,
        cleanJa,
      };
    } else {
      // [Case 4] 한국 사람이 일본 구장에서 칠 때: 일본어 1줄(현장 팻말 원문) + 밑에 한글 발음 2줄
      return {
        primary: cleanJa,
        secondary: `(${cleanKo})`,
        showSecondary: true,
        flag: '🇯🇵',
        cleanKo,
        cleanJa,
      };
    }
  }

  // 4. 한국 구장 처리
  const cleanKo = cleanName;
  const translatedJa = (isObj && (courseOrName as Course).nameJa)
    ? stripParkGolfSuffix((courseOrName as Course).nameJa!)
    : translateKoreanCourseNameToJapanese(cleanKo);

  if (isJapanese) {
    // [Case 2] 일본 모드: 일본 사용자 기준에 맞추어 일본어 표기(한자/가나)를 최우선 1순위(primary)로 표출
    return {
      primary: translatedJa,
      secondary: cleanKo !== translatedJa ? `(${cleanKo})` : '',
      showSecondary: cleanKo !== translatedJa,
      flag: '🇰🇷',
      cleanKo,
      cleanJa: translatedJa,
    };
  } else {
    // [Case 1] 한국 사람이 한국 구장에서 칠 때: 깔끔한 한국어 1줄 단독
    return {
      primary: cleanKo,
      secondary: '',
      showSecondary: false,
      flag: '',
      cleanKo,
      cleanJa: translatedJa,
    };
  }
}

/**
 * 🎨 대표님 표준 리액트 렌더러 컴포넌트
 */
export function CourseDualBadge({
  course,
  isJapanese,
  className = '',
  primaryClassName = 'font-black text-sm text-stone-900 leading-tight',
  secondaryClassName = 'text-[11px] font-bold text-stone-500 leading-tight mt-0.5',
}: {
  course: Course | string | null | undefined;
  isJapanese: boolean;
  className?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  const dual = getCourseDualName(course, isJapanese);

  return (
    <div className={`flex flex-col text-left ${className}`}>
      <span className={primaryClassName}>
        {dual.flag ? `${dual.flag} ` : ''}{dual.primary}
      </span>
      {dual.showSecondary && dual.secondary && (
        <span className={secondaryClassName}>
          {dual.secondary}
        </span>
      )}
    </div>
  );
}

/**
 * 🌐 한국어 텍스트를 자연스러운 일본어로 자동 변환하는 사전 및 헬퍼
 */
const KO_TO_JA_DICT: [RegExp, string][] = [
  [/대구광역시/g, '大邱広域市'],
  [/대구/g, '大邱'],
  [/군위군/g, '軍威郡'],
  [/군위/g, '軍威'],
  [/구미시/g, '亀尾市'],
  [/구미/g, '亀尾'],
  [/경북/g, '慶北'],
  [/경남/g, '慶南'],
  [/서울특별시/g, 'ソウル特別市'],
  [/서울/g, 'ソウル'],
  [/부산/g, '釜山'],
  [/인천/g, '仁川'],
  [/광주/g, '光州'],
  [/대전/g, '大田'],
  [/울산/g, '蔚山'],
  [/세종/g, '世宗'],
  [/강원/g, '江原'],
  [/충북/g, '忠北'],
  [/충남/g, '忠南'],
  [/전북/g, '全北'],
  [/전남/g, '全南'],
  [/제주/g, '済州'],
  [/에 위치한/g, 'に位置する'],
  [/총\s*([0-9]+)코스/g, '全$1コース'],
  [/([0-9]+)홀/g, '$1ホール'],
  [/공인\s*검증/g, '公認検証'],
  [/파크골프장입니다/g, 'パークゴルフ場です'],
  [/파크골프장/g, 'パークゴルフ場'],
  [/운영:/g, '運営:'],
  [/([0-9]{1,2})시\s*~\s*([0-9]{1,2})시/g, '$1:00〜$2:00'],
  [/관내/g, '管内'],
  [/관외/g, '管外'],
  [/([0-9]+)천원/g, '$1,000ウォン'],
  [/([0-9]+)만원/g, '$10,000ウォン'],
  [/([0-9]+)원/g, '$1ウォン'],
  [/문의/g, '要問い合わせ'],
  [/연중무휴/g, '年中無休'],
  [/매주\s*/g, '毎週 '],
  [/매월\s*/g, '毎月 '],
  [/첫째\s*주/g, '第1週'],
  [/둘째\s*주/g, '第2週'],
  [/셋째\s*주/g, '第3週'],
  [/넷째\s*주/g, '第4週'],
  [/월요일/g, '月曜日'],
  [/화요일/g, '火曜日'],
  [/수요일/g, '水曜日'],
  [/목요일/g, '木曜日'],
  [/금요일/g, '金曜日'],
  [/토요일/g, '土曜日'],
  [/일요일/g, '日曜日'],
  [/공휴일/g, '祝日'],
  [/정기\s*휴장/g, '定期休場'],
  [/정기\s*휴무/g, '定期休館'],
  [/휴장/g, '休場'],
  [/휴무/g, '休館'],
  [/정상\s*운영/g, '通常営業'],
  [/무료\s*주차장/g, '無料駐車場'],
  [/유료\s*주차장/g, '有料駐車場'],
  [/주차\s*완비/g, '駐車場完備'],
  [/주차장/g, '駐車場'],
  [/주차/g, '駐車'],
  [/무료/g, '無料'],
  [/유료/g, '有料'],
  [/완비/g, '完備'],
  [/위천/g, '渭川'],
  [/낙동강/g, '洛東江'],
  [/금호강/g, '琴湖江'],
  [/형산강/g, '兄山江'],
  [/한강/g, '漢江'],
  [/수변/g, '水辺'],
  [/테마파크/g, 'テーマパーク'],
  [/체육공원/g, '体育公園'],
  [/생태공원/g, '生態公園'],
  [/공원/g, '公園'],
  [/사전\s*예약/g, '事前予約'],
  [/현장\s*접수/g, '現地受付'],
  [/예약/g, '予約'],
  [/접수/g, '受付'],
  [/회원/g, '会員'],
  [/비회원/g, '非会員'],
  [/단체/g, '団体'],
  [/개인/g, '個人'],
  [/잔디\s*보호/g, '芝保護'],
  [/동절기/g, '冬季'],
  [/하절기/g, '夏季'],
  [/우천\s*시/g, '雨天時'],
];

// Hangul to Katakana syllable converter
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const KANA_TABLE: Record<string, Record<string, string>> = {
  'ㄱ': { 'ㅏ':'カ', 'ㅐ':'ケ', 'ㅑ':'キャ', 'ㅓ':'コ', 'ㅔ':'ケ', 'ㅕ':'キョ', 'ㅗ':'コ', 'ㅜ':'ク', 'ㅠ':'キュ', 'ㅡ':'ク', 'ㅣ':'キ' },
  'ㄴ': { 'ㅏ':'ナ', 'ㅐ':'ネ', 'ㅑ':'ニャ', 'ㅓ':'ノ', 'ㅔ':'ネ', 'ㅕ':'ニョ', 'ㅗ':'ノ', 'ㅜ':'ヌ', 'ㅠ':'ニュ', 'ㅡ':'ヌ', 'ㅣ':'ニ' },
  'ㄷ': { 'ㅏ':'タ', 'ㅐ':'テ', 'ㅑ':'チャ', 'ㅓ':'ト', 'ㅔ':'テ', 'ㅕ':'チョ', 'ㅗ':'ト', 'ㅜ':'トゥ', 'ㅠ':'テュ', 'ㅡ':'トゥ', 'ㅣ':'ティ' },
  'ㄹ': { 'ㅏ':'ラ', 'ㅐ':'レ', 'ㅑ':'リャ', 'ㅓ':'ロ', 'ㅔ':'レ', 'ㅕ':'リョ', 'ㅗ':'ロ', 'ㅜ':'ル', 'ㅠ':'リュ', 'ㅡ':'ル', 'ㅣ':'リ' },
  'ㅁ': { 'ㅏ':'マ', 'ㅐ':'メ', 'ㅑ':'ミャ', 'ㅓ':'モ', 'ㅔ':'メ', 'ㅕ':'ミョ', 'ㅗ':'モ', 'ㅜ':'ム', 'ㅠ':'ミュ', 'ㅡ':'ム', 'ㅣ':'ミ' },
  'ㅂ': { 'ㅏ':'パ', 'ㅐ':'ペ', 'ㅑ':'ピャ', 'ㅓ':'ポ', 'ㅔ':'ペ', 'ㅕ':'ピョ', 'ㅗ':'ポ', 'ㅜ':'プ', 'ㅠ':'ピュ', 'ㅡ':'プ', 'ㅣ':'ピ' },
  'ㅅ': { 'ㅏ':'サ', 'ㅐ':'セ', 'ㅑ':'シャ', 'ㅓ':'ソ', 'ㅔ':'セ', 'ㅕ':'ショ', 'ㅗ':'ソ', 'ㅜ':'ス', 'ㅠ':'シュ', 'ㅡ':'ス', 'ㅣ':'シ' },
  'ㅇ': { 'ㅏ':'ア', 'ㅐ':'エ', 'ㅑ':'ヤ', 'ㅓ':'オ', 'ㅔ':'エ', 'ㅕ':'ヨ', 'ㅗ':'オ', 'ㅜ':'ウ', 'ㅠ':'ユ', 'ㅡ':'ウ', 'ㅣ':'イ' },
  'ㅈ': { 'ㅏ':'チャ', 'ㅐ':'チェ', 'ㅑ':'チャ', 'ㅓ':'チョ', 'ㅔ':'チェ', 'ㅕ':'チョ', 'ㅗ':'チョ', 'ㅜ':'チュ', 'ㅠ':'チュ', 'ㅡ':'チュ', 'ㅣ':'チ' },
  'ㅊ': { 'ㅏ':'チャ', 'ㅐ':'チェ', 'ㅑ':'チャ', 'ㅓ':'チョ', 'ㅔ':'チェ', 'ㅕ':'チョ', 'ㅗ':'チョ', 'ㅜ':'チュ', 'ㅠ':'チュ', 'ㅡ':'チュ', 'ㅣ':'チ' },
  'ㅋ': { 'ㅏ':'カ', 'ㅐ':'ケ', 'ㅑ':'キャ', 'ㅓ':'コ', 'ㅔ':'ケ', 'ㅕ':'キョ', 'ㅗ':'コ', 'ㅜ':'ク', 'ㅠ':'キュ', 'ㅡ':'ク', 'ㅣ':'キ' },
  'ㅌ': { 'ㅏ':'タ', 'ㅐ':'テ', 'ㅑ':'チャ', 'ㅓ':'ト', 'ㅔ':'テ', 'ㅕ':'チョ', 'ㅗ':'ト', 'ㅜ':'トゥ', 'ㅠ':'テュ', 'ㅡ':'トゥ', 'ㅣ':'ティ' },
  'ㅍ': { 'ㅏ':'パ', 'ㅐ':'ペ', 'ㅑ':'ピャ', 'ㅓ':'ポ', 'ㅔ':'ペ', 'ㅕ':'ピョ', 'ㅗ':'ポ', 'ㅜ':'プ', 'ㅠ':'ピュ', 'ㅡ':'プ', 'ㅣ':'ピ' },
  'ㅎ': { 'ㅏ':'ハ', 'ㅐ':'ヘ', 'ㅑ':'ヒャ', 'ㅓ':'ホ', 'ㅔ':'ヘ', 'ㅕ':'ヒョ', 'ㅗ':'ホ', 'ㅜ':'フ', 'ㅠ':'ヒュ', 'ㅡ':'フ', 'ㅣ':'ヒ' }
};

function hangulCharToKana(ch: string): string {
  const code = ch.charCodeAt(0) - 44032;
  if (code < 0 || code > 11171) return ch;
  const cho = CHOSUNG[Math.floor(code / 588)];
  const jung = JUNGSUNG[Math.floor((code % 588) / 28)];
  const jong = JONGSUNG[code % 28];

  const choMap = KANA_TABLE[cho] || KANA_TABLE['ㅇ'];
  let base = choMap[jung] || 'ア';
  if (jong === 'ㄴ' || jong === 'ㅁ' || jong === 'ㅇ') base += 'ン';
  else if (jong === 'ㄹ') base += 'ル';
  else if (jong === 'ㄱ' || jong === 'ㅂ' || jong === 'ㅅ') base += 'ッ';
  return base;
}

function hangulToKana(text: string): string {
  return text.split('').map(c => /[가-힣]/.test(c) ? hangulCharToKana(c) : c).join('');
}

const KOREAN_ADDRESS_HANJA: [string, string][] = [
  // Special Regions & Towns
  ['삼국유사면', '三国遺事面'],
  ['삼국유사', '三国遺事'],
  ['석산리', '石山里'],
  ['효령면', '孝令面'],
  ['효령', '孝令'],
  ['장기리', '長基里'],
  ['군위읍', '軍威邑'],
  ['내량길', '内良通り'],
  ['봉황리', '鳳凰里'],
  ['봉덕동', '鳳徳洞'],
  ['파호동', '把好洞'],

  // Metropolitan Cities / Provinces
  ['대구광역시', '大邱広域市'],
  ['서울특별시', 'ソウル特別市'],
  ['부산광역시', '釜山広域市'],
  ['인천광역시', '仁川広域市'],
  ['광주광역시', '光州広域市'],
  ['대전광역시', '大田広域市'],
  ['울산광역시', '蔚山広域市'],
  ['세종특별자치시', '世宗特別自治市'],
  ['경기도', '京畿道'],
  ['강원특별자치도', '江原特別自治道'],
  ['강원도', '江原道'],
  ['충청북도', '忠清北道'],
  ['충청남도', '忠清南道'],
  ['전라북도', '全羅北道'],
  ['전북특별자치도', '全北特別自治道'],
  ['전라남도', '全羅南道'],
  ['경상북도', '慶尚北道'],
  ['경상남도', '慶尚南道'],
  ['제주특별자치도', '済州特別自治道'],

  // Short forms
  ['대구', '大邱'],
  ['서울', 'ソウル'],
  ['부산', '釜山'],
  ['인천', '仁川'],
  ['광주', '光州'],
  ['대전', '大田'],
  ['울산', '蔚山'],
  ['세종', '世宗'],
  ['경기', '京畿'],
  ['강원', '江原'],
  ['충북', '忠北'],
  ['충남', '忠南'],
  ['전북', '全北'],
  ['전남', '全南'],
  ['경북', '慶北'],
  ['경남', '慶南'],
  ['제주', '済州'],

  // Cities & Counties (시/군/구)
  ['구미시', '亀尾市'], ['구미', '亀尾'],
  ['군위군', '軍威郡'], ['군위', '軍威'],
  ['포항시', '浦項市'], ['포항', '浦項'],
  ['경주시', '慶州市'], ['경주', '慶州'],
  ['김천시', '金泉市'], ['김천', '金泉'],
  ['안동시', '安東市'], ['안동', '安東'],
  ['영주시', '栄州市'], ['영주', '栄州'],
  ['영천시', '永川市'], ['영천', '永川'],
  ['상주시', '尚州市'], ['상주', '尚州'],
  ['문경시', '聞慶市'], ['문경', '聞慶'],
  ['경산시', '慶山市'], ['경산', '慶山'],
  ['의성군', '義城郡'], ['의성', '義城'],
  ['청송군', '青松郡'], ['청송', '青松'],
  ['영양군', '英陽郡'], ['영양', '英陽'],
  ['영덕군', '盈徳郡'], ['영덕', '盈徳'],
  ['청도군', '清道郡'], ['청도', '清道'],
  ['고령군', '高霊郡'], ['고령', '高霊'],
  ['성주군', '星州郡'], ['성주', '星州'],
  ['칠곡군', '漆谷郡'], ['칠곡', '漆谷'],
  ['예천군', '醴泉郡'], ['예천', '醴泉'],
  ['봉화군', '奉化郡'], ['봉화', '奉化'],
  ['울진군', '蔚珍郡'], ['울진', '蔚珍'],
  ['울릉군', '鬱陵郡'], ['울릉', '鬱陵'],

  ['창원시', '昌原市'], ['진주시', '晋州市'], ['통영시', '統営市'],
  ['사천시', '泗川市'], ['김해시', '金海市'], ['밀양시', '密陽市'],
  ['거제시', '巨済市'], ['양산시', '梁山市'], ['의령군', '宜寧郡'],
  ['함안군', '咸安郡'], ['창녕군', '昌寧郡'], ['고성군', '固城郡'],
  ['남해군', '南海郡'], ['하동군', '河東郡'], ['산청군', '山清郡'],
  ['함양군', '咸陽郡'], ['거창군', '居昌郡'], ['합천군', '陜川郡'],

  ['수원시', '水原市'], ['성남시', '城南市'], ['고양시', '高陽市'],
  ['용인시', '龍仁市'], ['부천시', '富川市'], ['안산시', '安山市'],
  ['안양시', '安養市'], ['남양주시', '南楊州市'], ['화성시', '華城市'],
  ['평택시', '平沢市'], ['의정부시', '議政府市'], ['시흥시', '始興市'],
  ['파주시', '坡州市'], ['김포시', '金浦市'], ['광명시', '光明市'],
  ['이천시', '利川市'], ['양주시', '楊州市'], ['오산시', '烏山市'],
  ['구리시', '九里市'], ['안성시', '安城市'], ['포천시', '抱川市'],
  ['의왕시', '義王市'], ['하남시', '河南市'], ['여주시', '驪州市'],
  ['양평군', '楊平郡'], ['동두천시', '東豆川市'], ['과천시', '果川市'],
  ['가평군', '加平郡'], ['연천군', '漣川郡'],

  ['춘천시', '春川市'], ['원주시', '原州市'], ['강릉시', '江陵市'],
  ['동해시', '東海市'], ['태백시', '太白市'], ['속초시', '束草市'],
  ['삼척시', '三陟市'], ['홍천군', '洪川郡'], ['횡성군', '横城郡'],
  ['영월군', '寧越郡'], ['평창군', '平昌郡'], ['정선군', '旌善郡'],
  ['철원군', '鉄原郡'], ['화천군', '華川郡'], ['양구군', '楊口郡'],
  ['인제군', '麟蹄郡'], ['양양군', '襄陽郡'],

  ['청주시', '清州市'], ['충주시', '忠州市'], ['제천시', '堤川市'],
  ['보은군', '報恩郡'], ['옥천군', '沃川郡'], ['영동군', '永同郡'],
  ['증평군', '曾坪郡'], ['진천군', '鎮川郡'], ['괴산군', '槐山郡'],
  ['음성군', '陰城郡'], ['단양군', '丹陽郡'],

  ['천안시', '天安市'], ['공주시', '公州市'], ['보령시', '保寧市'],
  ['아산시', '牙山市'], ['서산시', '瑞山市'], ['논산시', '論山市'],
  ['계룡시', '鶏龍市'], ['당진시', '唐津市'], ['금산군', '錦山郡'],
  ['부여군', '扶余郡'], ['서천군', '舒川郡'], ['청양군', '青陽郡'],
  ['홍성군', '洪城郡'], ['예산군', '礼山郡'], ['태안군', '泰安郡'],

  ['전주시', '全州市'], ['군산시', '群山市'], ['익산시', '益山市'],
  ['정읍시', '井邑市'], ['남원시', '南原市'], ['김제시', '金堤市'],
  ['완주군', '完州郡'], ['진안군', '鎮安郡'], ['무주군', '茂朱郡'],
  ['장수군', '長水郡'], ['임실군', '任実郡'], ['순창군', '淳昌郡'],
  ['고창군', '高敞郡'], ['부안군', '扶安郡'],

  ['목포시', '木浦市'], ['여수시', '麗水市'], ['순천시', '順天市'],
  ['나주시', '羅州市'], ['광양시', '光陽市'], ['담양군', '潭陽郡'],
  ['곡성군', '谷城郡'], ['구례군', '求礼郡'], ['고흥군', '高興郡'],
  ['보성군', '宝城郡'], ['화순군', '和順郡'], ['장흥군', '長興郡'],
  ['강진군', '康津郡'], ['해남군', '海南郡'], ['영암군', '霊岩郡'],
  ['무안군', '務安郡'], ['함평군', '咸平郡'], ['영광군', '霊光郡'],
  ['장성군', '長城郡'], ['완도군', '莞島郡'], ['진도군', '珍島郡'],
  ['신안군', '新安郡'],

  ['제주시', '済州市'], ['서귀포시', '西帰浦市'],

  // Wards (구) - long names first
  ['해운대구', '海雲台区'], ['수영구', '水営区'], ['부산진구', '釜山鎮区'], ['동래구', '東莱区'],
  ['수성구', '寿城区'], ['달서구', '達西区'], ['달성군', '達城郡'],
  ['강남구', '江南区'], ['서초구', '瑞草区'], ['송파구', '松坡区'], ['강동구', '江東区'],
  ['마포구', '麻浦区'], ['용산구', '龍山区'], ['성동구', '城東区'], ['광진구', '広津区'],
  ['종로구', '鍾路区'], ['영등포구', '永登浦区'], ['양천구', '陽川区'], ['강서구', '江西区'],
  ['구로구', '九老区'], ['금천구', '衿川区'], ['동작구', '銅雀区'], ['관악구', '冠岳区'],
  ['서대문구', '西大門区'], ['은평구', '恩平区'], ['동대문구', '東大門区'], ['중랑구', '中浪区'],
  ['성북구', '城北区'], ['강북구', '江北区'], ['도봉구', '道峰区'], ['노원구', '蘆原区'],
  ['중구', '中区'], ['동구', '東区'], ['서구', '西区'], ['남구', '남区'], ['북구', '北区'],

  // Administrative Division Suffixes
  ['특별자치도', '特別自治道'],
  ['특별자치시', '特別自治市'],
  ['광역시', '広域市'],
  ['특별시', '特別市'],
  ['길', '通り '],
  ['로', '路 '],
  ['읍', '邑 '],
  ['면', '面 '],
  ['동', '洞 '],
  ['리', '里 '],
  ['구', '区 '],
  ['군', '郡 '],
  ['시', '市 '],
  ['산', '山']
];

export function translateKoreanAddressToJapanese(addrKo?: string | null): string {
  if (!addrKo) return '';
  let res = addrKo;

  for (const [k, v] of KOREAN_ADDRESS_HANJA) {
    res = res.replace(new RegExp(k, 'g'), v);
  }

  // Any remaining Hangul words are converted to Katakana phonetics!
  res = res.replace(/[가-힣]+/g, (match) => hangulToKana(match));

  // Clean double spaces
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

/**
 * 🌐 한국어 텍스트 필드를 일본어로 자동 변환
 */
export function translateKoreanFieldToJapanese(text?: string | null): string {
  if (!text) return '';
  let res = text;
  for (const [regex, replacement] of KO_TO_JA_DICT) {
    res = res.replace(regex, replacement);
  }
  // 한글 잔재가 남아있을 경우 가타카나 음역기로 100% 변환
  res = res.replace(/[가-힣]+/g, (match) => hangulToKana(match));
  res = res.replace(/\s+/g, ' ').trim();
  return res;
}

/**
 * 🌐 구장 소개/설명 로컬라이즈 반환 함수
 */
export function getLocalizedCourseDescription(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.descriptionJa) return c.descriptionJa;
    if (c.description) return translateKoreanFieldToJapanese(c.description);
    return '';
  }
  return c.descriptionKo || c.description || '';
}

/**
 * 🌐 구장 상세 주소 로컬라이즈 반환 함수
 */
export function getLocalizedCourseAddress(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.addressJa) return c.addressJa;
    if (c.address) return translateKoreanAddressToJapanese(c.address);
    return '';
  }
  return c.addressKo || c.address || '';
}

/**
 * 🌐 구장 이용료 로컬라이즈 반환 함수
 */
export function getLocalizedCourseFee(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.feeJa) return c.feeJa;
    if (c.fee) return translateKoreanFieldToJapanese(c.fee);
    return '';
  }
  return c.feeKo || c.fee || '';
}

/**
 * 🌐 구장 운영 시간 로컬라이즈 반환 함수
 */
export function getLocalizedCourseOpenHours(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.openHoursJa) return c.openHoursJa;
    if (c.openHours) return translateKoreanFieldToJapanese(c.openHours);
    return '';
  }
  return c.openHoursKo || c.openHours || '';
}

/**
 * 🌐 구장 정기 휴무일 로컬라이즈 반환 함수
 */
export function getLocalizedCourseClosedDay(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.closedDayJa) return c.closedDayJa;
    if (c.closedDay) return translateKoreanFieldToJapanese(c.closedDay);
    return '';
  }
  return c.closedDayKo || c.closedDay || '';
}

/**
 * 🌐 구장 주차 안내 로컬라이즈 반환 함수
 */
export function getLocalizedCourseParking(c?: Course | null, isJapanese?: boolean): string {
  if (!c) return '';
  if (isJapanese) {
    if (c.parkingJa) return c.parkingJa;
    if (c.parking) return translateKoreanFieldToJapanese(c.parking);
    return '';
  }
  return c.parkingKo || c.parking || '';
}
