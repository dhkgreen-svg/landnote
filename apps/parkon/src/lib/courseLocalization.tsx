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
export const JAPAN_DEFAULT_COURSES: Course[] = [
  {
    id: 'jp-course-makubetsu-tsutsujigaoka',
    name: 'まくべつ つつじが丘',
    region: '北海道 幕別町',
    country: 'JP',
    nameKo: '마쿠베츠 쓰쓰지가오카',
    nameJa: 'まくべつ つつじが丘',
    regionKo: '홋카이도 마쿠베츠町 (발상지)',
    regionJa: '北海道 幕別町 (発祥の地)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '1983年 パークゴルフ発祥の地・幕別町を代表する聖地球場。白樺とつつじに囲まれた美しい36ホール。',
    address: '北海道中川郡幕別町字新町183',
    phone: '+81-155-54-2111',
    fee: '無料 (誰でも自由に利用可)',
    openHours: '07:00 ~ 日没',
    closedDay: '冬期間閉鎖 (4月下旬~11月中旬営業)',
    parking: '大型無料駐車場完備',
    lat: 42.9064,
    lng: 143.3528,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-sapporo-kokusai',
    name: '札幌国際',
    region: '北海道 札幌市',
    country: 'JP',
    nameKo: '삿포로 국제',
    nameJa: '札幌国際',
    regionKo: '홋카이도 삿포로시',
    regionJa: '北海道 札幌市 南区',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '北海道最大都市・札幌を代表する公式トーナメント認定公認コース。アンジュレーションに富んだ戦略的設計。',
    address: '北海道札幌市南区定山渓937',
    phone: '+81-11-598-4511',
    fee: '1日券 1,200円 (用具レンタル有)',
    openHours: '08:30 ~ 17:00',
    closedDay: '期間中無休',
    lat: 42.9812,
    lng: 141.1683,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-churui-parkgolf',
    name: '忠類 (ナウマン)',
    region: '北海道 幕別町',
    country: 'JP',
    nameKo: '추루이 (나우만)',
    nameJa: '忠類 (ナウマン)',
    regionKo: '홋카이도 마쿠베츠町 츄루이',
    regionJa: '北海道 幕別町 忠類',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: 'ナウマン象化石発掘の地。温泉施設が隣接し、ラウンド後にモール温泉を満喫できる人気コース。',
    address: '北海道中川郡幕別町忠類白銀町383',
    phone: '+81-1558-8-2111',
    fee: '500円',
    openHours: '08:00 ~ 17:00',
    closedDay: '火曜日',
    lat: 42.5714,
    lng: 143.2981,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-obihiro-nozomino',
    name: '帯広 のぞみ野',
    region: '北海道 帯広市',
    country: 'JP',
    nameKo: '오비히로 노조미노',
    nameJa: '帯広 のぞみ野',
    regionKo: '홋카이도 오비히로시',
    regionJa: '北海道 帯広市',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '十勝平野の広大なパノラマを望むフラットで快適なベント芝公認コース。シニアに優しい高評価コース。',
    address: '北海道帯広市西19条南39丁目',
    phone: '+81-155-48-8311',
    fee: '600円',
    openHours: '08:00 ~ 17:00',
    closedDay: '月曜日',
    lat: 42.8872,
    lng: 143.1654,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-tomakomai-midorigaoka',
    name: '苫小牧 緑ヶ丘',
    region: '北海道 苫小牧市',
    country: 'JP',
    nameKo: '토마코마이 미도리가오카',
    nameJa: '苫小牧 緑ヶ丘',
    regionKo: '홋카이도 토마코마이시',
    regionJa: '北海道 苫小牧市',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    description: '緑豊かな自然林を生かした丘陵コース。海風の影響を受けながらショットの正確性を競う名コース。',
    address: '北海道苫小牧市高丘41',
    phone: '+81-144-36-1181',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第3月曜日',
    lat: 42.6512,
    lng: 141.6023,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-asahikawa-kaguraoka',
    name: '旭川 神楽岡',
    region: '北海道 旭川市',
    country: 'JP',
    nameKo: '아사히카와 카구라오카',
    nameJa: '旭川 神楽岡',
    regionKo: '홋카이도 아사히카와시',
    regionJa: '北海道 旭川市',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    description: '大雪山連峰を背景にした絶景コース。道北エリアのパークゴルファーが集う伝統ある球場。',
    address: '北海道旭川市神楽岡公園',
    phone: '+81-166-65-5553',
    fee: '無料',
    openHours: '08:00 ~ 17:00',
    closedDay: '無休',
    lat: 43.7461,
    lng: 142.3712,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-ebetsu-kakuyama',
    name: '江別 角山',
    region: '北海道 江別市',
    country: 'JP',
    nameKo: '에베쓰 카쿠야마',
    nameJa: '江別 角山',
    regionKo: '홋카이도 에베쓰시',
    regionJa: '北海道 江別市 角山',
    totalCourses: 6,
    totalHoles: 54,
    isVerified: true,
    description: '道内屈指のビッグスケール54ホール！初心者から上級トーナメントまで対応する北海道最高峰コース。',
    address: '北海道江別市角山199-1',
    phone: '+81-11-384-5511',
    fee: '1日フリー 1,000円',
    openHours: '07:30 ~ 17:00',
    closedDay: '期間中無休',
    lat: 43.1251,
    lng: 141.5213,
    holesMetadata: generateStandardHoles(54),
  },
  {
    id: 'jp-course-kitahiroshima-elfin',
    name: '北広島 エルフィン',
    region: '北海道 北広島市',
    country: 'JP',
    nameKo: '기타히로시마 엘핀',
    nameJa: '北広島 エルフィン',
    regionKo: '홋카이도 기타히로시마시',
    regionJa: '北海道 北広島市',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    description: 'エスコンフィールド北海道(Fビレッジ)近郊の人気コース。起伏に富んだグリーンが特徴。',
    address: '北海道北広島市中の沢',
    phone: '+81-11-372-3311',
    fee: '800円',
    openHours: '08:00 ~ 17:00',
    closedDay: '水曜日',
    lat: 42.9854,
    lng: 141.5621,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-hakodate-kikyo',
    name: '函館 桔梗',
    region: '北海道 函館市',
    country: 'JP',
    nameKo: '하코다테 키쿄',
    nameJa: '函館 桔梗',
    regionKo: '홋카이도 하코다테시',
    regionJa: '北海道 函館市',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    description: '函館山と津軽海峡を望む風光明媚な南北海道の名門コース。',
    address: '北海道函館市桔梗町',
    phone: '+81-138-47-1111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    lat: 41.8312,
    lng: 140.7321,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-miyagi-matsushima',
    name: '宮城 松島',
    region: '宮城県 松島町',
    country: 'JP',
    nameKo: '미야기 마츠시마',
    nameJa: '宮城 松島',
    regionKo: '미야기현 마츠시마町',
    regionJa: '宮城県 松島町',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    description: '日本三景・松島にほど近い本州・東北屈指の公認コース。松林を抜ける心地よい潮風。',
    address: '宮城県宮城郡松島町高城',
    phone: '+81-22-354-5701',
    fee: '700円',
    openHours: '08:30 ~ 17:00',
    closedDay: '火曜日',
    lat: 38.3751,
    lng: 141.0652,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-chiba-inzai',
    name: '千葉 印西',
    region: '千葉県 印西市',
    country: 'JP',
    nameKo: '치바 인자이',
    nameJa: '千葉 印西',
    regionKo: '지바현 인자이시',
    regionJa: '千葉県 印西市',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    description: '首都圏最大級の36ホール！東京・千葉からアクセス抜群、通年営業の関東フラッグシップ球場。',
    address: '千葉県印西市平賀2777',
    phone: '+81-476-98-1122',
    fee: '1,500円 (1日フリー)',
    openHours: '08:00 ~ 17:00',
    closedDay: '年中無休 (年末年始除く)',
    lat: 35.7921,
    lng: 140.2134,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-saitama-kumagaya',
    name: '埼玉 熊谷リバーサイド',
    region: '埼玉県 熊谷市',
    country: 'JP',
    nameKo: '사이타마 구마가야',
    nameJa: '埼玉 熊谷リバーサイド',
    regionKo: '사이타마현 구마가야시',
    regionJa: '埼玉県 熊谷市 荒川河川敷',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    description: '荒川の河川敷に広がる開放感満点の18ホール。フラットで歩きやすくシニアに大人気。',
    address: '埼玉県熊谷市村岡',
    phone: '+81-48-524-1111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第2火曜日',
    lat: 36.1384,
    lng: 139.3871,
    holesMetadata: generateStandardHoles(18),
  },
];

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
    // [Case 2] 일본 사람이 한국 구장에 왔을 때: 한글 1줄(현장 간판 원문) + 밑에 일본어 번역/음독 2줄
    return {
      primary: cleanKo,
      secondary: `(${translatedJa})`,
      showSecondary: true,
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
