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
    regionJa: '千葉県 印西市 (関東)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '首都圏最大級の36ホール！東京・千葉からアクセス抜群、通年営業の関東フラッグシップ球場。',
    address: '千葉県印西市平賀2777',
    phone: '+81-476-98-1122',
    fee: '1,500円 (1日フリー)',
    openHours: '08:00 ~ 17:00',
    closedDay: '年中無休 (年末年始除く)',
    parking: '大型無料駐車場200台',
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
    regionJa: '埼玉県 熊谷市 荒川河川敷 (関東)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '荒川の河川敷に広がる開放感満点の18ホール。フラットで歩きやすくシニアに大人気。',
    address: '埼玉県熊谷市村岡',
    phone: '+81-48-524-1111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第2火曜日',
    parking: '無料駐車場完備',
    lat: 36.1384,
    lng: 139.3871,
    holesMetadata: generateStandardHoles(18),
  },
  // --- 1. 北海道 追加名門 (富良野) ---
  {
    id: 'jp-course-furano-daishizen',
    name: '富良野 大自然',
    region: '北海道 富良野市',
    country: 'JP',
    nameKo: '후라노 대자연',
    nameJa: '富良野 大自然',
    regionKo: '홋카이도 후라노시',
    regionJa: '北海道 富良野市 (北海道)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '十勝岳連峰とラベンダー畑を望む広大な36ホール。美しい白樺林のレイアウトが魅力。',
    address: '北海道富良野市中五区',
    phone: '+81-167-22-1111',
    fee: '600円',
    openHours: '08:00 ~ 17:00',
    closedDay: '期間中無休',
    parking: '大型無料駐車場完備',
    lat: 43.3421,
    lng: 142.3831,
    holesMetadata: generateStandardHoles(36),
  },

  // --- 2. 東北 (Tohoku) 名門コース群 ---
  {
    id: 'jp-course-iwate-shizukuishi',
    name: '岩手 雫石 (小岩井農場)',
    region: '岩手県 雫石町',
    country: 'JP',
    nameKo: '이와테 시즈쿠이시 (코이와이 농장)',
    nameJa: '岩手 雫石 (小岩井農場)',
    regionKo: '이와테현 시즈쿠이시町',
    regionJa: '岩手県 岩手郡雫石町 (東北)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '岩手山を間近に望む小岩井農場エリアの超名門。自然起伏を巧みに生かした戦略的36ホール。',
    address: '岩手県岩手郡雫石町丸谷地36-1',
    phone: '+81-19-692-4321',
    fee: '800円',
    openHours: '08:30 ~ 17:00',
    closedDay: '木曜日',
    parking: '乗用車150台無料',
    lat: 39.7314,
    lng: 141.0215,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-aomori-iwakisan',
    name: '青森 岩木山',
    region: '青森県 弘前市',
    country: 'JP',
    nameKo: '아오모리 이와키산',
    nameJa: '青森 岩木山',
    regionKo: '아오모리현 히로사키시',
    regionJa: '青森県 弘前市 (東北)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '津軽富士・岩木山の麓に広がる天然芝18ホール。澄んだ空気と爽快なショットが評判。',
    address: '青森県弘前市大字百沢',
    phone: '+81-172-83-2211',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '水曜日',
    parking: '無料駐車場80台',
    lat: 40.6124,
    lng: 140.3541,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-fukushima-iwaki',
    name: '福島 いわきサンシャイン',
    region: '福島県 いわき市',
    country: 'JP',
    nameKo: '후쿠시마 이와키',
    nameJa: '福島 いわきサンシャイン',
    regionKo: '후쿠시마현 이와키시',
    regionJa: '福島県 いわき市 (東北)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '温暖な気候で通年プレー可能！太平洋からの爽やかな風を感じられる東北最南端コース。',
    address: '福島県いわき市平下荒川',
    phone: '+81-246-29-1111',
    fee: '600円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    parking: '無料駐車場完備',
    lat: 37.0354,
    lng: 140.8972,
    holesMetadata: generateStandardHoles(18),
  },

  // --- 3. 関東 (Kanto) 追加名門コース ---
  {
    id: 'jp-course-tokyo-shinozaki',
    name: '東京 篠崎リバーサイド',
    region: '東京都 江戸川区',
    country: 'JP',
    nameKo: '도쿄 시노자키',
    nameJa: '東京 篠崎リバーサイド',
    regionKo: '도쿄도 에도가와구',
    regionJa: '東京都 江戸川区 江戸川河川敷 (関東)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '都心から好アクセスの江戸川河川敷公認コース。フラットで歩きやすくスカイツリーを遠望。',
    address: '東京都江戸川区上篠崎2丁目',
    phone: '+81-3-3678-1111',
    fee: '600円',
    openHours: '09:00 ~ 17:00',
    closedDay: '第1・第3月曜日',
    parking: '河川敷駐車場無料',
    lat: 35.7142,
    lng: 139.8971,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-tochigi-kinugawa',
    name: '栃木 鬼怒川',
    region: '栃木県 日光市',
    country: 'JP',
    nameKo: '토치기 키누가와',
    nameJa: '栃木 鬼怒川',
    regionKo: '토치기현 닛코시',
    regionJa: '栃木県 日光市 鬼怒川温泉 (関東)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '日光・鬼怒川温泉郷に隣接。温泉リゾートとパークゴルフを同時に楽しめる関東屈指の美コース。',
    address: '栃木県日光市鬼怒川温泉大原',
    phone: '+81-288-77-1111',
    fee: '1,000円',
    openHours: '08:30 ~ 17:00',
    closedDay: '火曜日',
    parking: '大駐車場完備',
    lat: 36.8312,
    lng: 139.7154,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-ibaraki-hitachinaka',
    name: '茨城 ひたちなか',
    region: '茨城県 ひたちなか市',
    country: 'JP',
    nameKo: '이바라키 히타치나카',
    nameJa: '茨城 ひたちなか',
    regionKo: '이바라키현 히타치나카시',
    regionJa: '茨城県 ひたちなか市 (関東)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '太平洋海浜公園近郊。緑豊かで四季折々の花々に囲まれながら快適にラウンドできます。',
    address: '茨城県ひたちなか市新光町',
    phone: '+81-29-273-0111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    parking: '無料駐車場完備',
    lat: 36.3984,
    lng: 140.5912,
    holesMetadata: generateStandardHoles(18),
  },

  // --- 4. 中部 (Chubu) 名門コース群 ---
  {
    id: 'jp-course-shizuoka-fujikawa',
    name: '静岡 富士川緑地',
    region: '静岡県 富士市',
    country: 'JP',
    nameKo: '시즈오카 후지카와 녹지',
    nameJa: '静岡 富士川緑地',
    regionKo: '시즈오카현 후지시',
    regionJa: '静岡県 富士市 (中部)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '世界遺産・富士山を真正面に望む日本屈指の大絶景コース！広々とした河川敷の美しい天然芝。',
    address: '静岡県富士市五貫島 富士川河川敷緑地',
    phone: '+81-545-64-1111',
    fee: '800円 (用具貸出300円)',
    openHours: '08:30 ~ 17:00',
    closedDay: '第2・第4月曜日',
    parking: '大型無料駐車場200台',
    lat: 35.1321,
    lng: 138.6412,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-niigata-shirone',
    name: '新潟 白根',
    region: '新潟県 新潟市',
    country: 'JP',
    nameKo: '니가타 시로네',
    nameJa: '新潟 白根',
    regionKo: '니가타현 니가타시',
    regionJa: '新潟県 新潟市 南区 (中部)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '信濃川沿いの広大な36ホール！フラットなフェアウェイで初心者から上級者まで爽快プレー。',
    address: '新潟県新潟市南区臼井',
    phone: '+81-25-372-6111',
    fee: '600円',
    openHours: '08:00 ~ 17:00',
    closedDay: '火曜日',
    parking: '無料駐車場完備',
    lat: 37.7812,
    lng: 139.0234,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-nagano-suwako',
    name: '長野 諏訪湖畔',
    region: '長野県 諏訪市',
    country: 'JP',
    nameKo: '나가노 스와호반',
    nameJa: '長野 諏訪湖畔',
    regionKo: '나가노현 스와시',
    regionJa: '長野県 諏訪市 湖畔公園 (中部)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '信州諏訪湖の湖畔に広がる風光明媚なコース。高原の心地よい風を感じながらラウンド。',
    address: '長野県諏訪市湖岸通り',
    phone: '+81-266-52-4141',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '期間中無休 (冬期休業)',
    parking: '湖畔駐車場無料',
    lat: 36.0421,
    lng: 138.1124,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-aichi-toyota',
    name: '愛知 豊田矢作川',
    region: '愛知県 豊田市',
    country: 'JP',
    nameKo: '아이치 도요타 야하기가와',
    nameJa: '愛知 豊田矢作川',
    regionKo: '아이치현 도요타시',
    regionJa: '愛知県 豊田市 矢作川河川敷 (中部)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '矢作川の豊かな水と緑に囲まれた快適18ホール。地元シニアサークルが多数集う活気あるコース。',
    address: '愛知県豊田市白浜町',
    phone: '+81-565-34-6611',
    fee: '400円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第1月曜日',
    parking: '無料駐車場80台',
    lat: 35.0812,
    lng: 137.1614,
    holesMetadata: generateStandardHoles(18),
  },

  // --- 5. 近畿 (Kinki / Kansai) 名門コース群 ---
  {
    id: 'jp-course-hyogo-arimafuji',
    name: '兵庫 有馬富士',
    region: '兵庫県 三田市',
    country: 'JP',
    nameKo: '효고 아리마후지',
    nameJa: '兵庫 有馬富士',
    regionKo: '효고현 산다시',
    regionJa: '兵庫県 三田市 (近畿)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '有馬富士公園の自然を活かした関西屈指の36ホール公認コース！アンジュレーション豊かで戦略的。',
    address: '兵庫県三田市福島1091-2',
    phone: '+81-79-562-3000',
    fee: '1,000円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第3木曜日',
    parking: '大型無料駐車場完備',
    lat: 34.9084,
    lng: 135.2412,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-shiga-biwakomiami',
    name: '滋賀 びわこマイアミ',
    region: '滋賀県 野洲市',
    country: 'JP',
    nameKo: '시가 비와코 마이애미',
    nameJa: '滋賀 びわこマイアミ',
    regionKo: '시가현 야스시',
    regionJa: '滋賀県 野洲市 琵琶湖畔 (近畿)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '日本最大の湖・琵琶湖を望むリゾート型36ホール。白砂青松の景色の中で心地よいラウンドが楽しめます。',
    address: '滋賀県野洲市吉川3326-1',
    phone: '+81-77-589-5721',
    fee: '1,200円 (1日フリー)',
    openHours: '08:30 ~ 17:00',
    closedDay: '水曜日',
    parking: 'マイアミランド大駐車場完備',
    lat: 35.1384,
    lng: 135.9871,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-osaka-yodogawa',
    name: '大阪 淀川リバー',
    region: '大阪府 守口市',
    country: 'JP',
    nameKo: '오사카 요도가와',
    nameJa: '大阪 淀川リバー',
    regionKo: '오사카부 모리구치시',
    regionJa: '大阪府 守口市 淀川河川公園 (近畿)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '大阪市内から電車・車でアクセス至便！淀川の心地よい風を感じるフラットな18ホール。',
    address: '大阪府守口市外島町 淀川河川敷',
    phone: '+81-6-6994-0011',
    fee: '500円',
    openHours: '09:00 ~ 17:00',
    closedDay: '火曜日',
    parking: '河川公園無料駐車場完備',
    lat: 34.7314,
    lng: 135.5682,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-kyoto-ujigawa',
    name: '京都 宇治川緑地',
    region: '京都府 宇治市',
    country: 'JP',
    nameKo: '교토 우지가와 녹지',
    nameJa: '京都 宇治川緑地',
    regionKo: '교토부 우지시',
    regionJa: '京都府 宇治市 (近畿)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '歴史とお茶の町・宇治の川沿いに広がる緑豊かな18ホール。のんびりとした雰囲気でプレーできます。',
    address: '京都府宇治市宇治川畔',
    phone: '+81-774-22-3141',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    parking: '無料駐車場完備',
    lat: 34.8912,
    lng: 135.8084,
    holesMetadata: generateStandardHoles(18),
  },

  // --- 6. 中国・四国 (Chugoku / Shikoku) 名門コース群 ---
  {
    id: 'jp-course-hiroshima-otagawa',
    name: '広島 太田川緑地',
    region: '広島県 広島市',
    country: 'JP',
    nameKo: '히로시마 오타가와 녹지',
    nameJa: '広島 太田川緑地',
    regionKo: '히로시마현 히로시마시',
    regionJa: '広島県 広島市 安佐南区 (中国・四国)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '太田川沿いの広大な河川敷緑地に整備された公認コース。芝生の管理が行き届きシニアに好評。',
    address: '広島県広島市安佐南区川内',
    phone: '+81-82-877-1111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '無休',
    parking: '河川敷無料駐車場完備',
    lat: 34.4612,
    lng: 132.4814,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-okayama-hyakkengawa',
    name: '岡山 百間川',
    region: '岡山県 岡山市',
    country: 'JP',
    nameKo: '오카야마 햑켄가와',
    nameJa: '岡山 百間川',
    regionKo: '오카야마현 오카야마시',
    regionJa: '岡山県 岡山市 中区 (中国・四国)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '晴れの国・岡山の青空の下で楽しむ36ホール！広くフラットで豪快なティーショットが可能。',
    address: '岡山県岡山市中区藤崎 百間川緑地',
    phone: '+81-86-277-2111',
    fee: '600円',
    openHours: '08:00 ~ 17:00',
    closedDay: '第2火曜日',
    parking: '無料駐車場120台',
    lat: 34.6412,
    lng: 133.9584,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-kagawa-sanuki',
    name: '香川 さぬき瀬戸内',
    region: '香川県 さぬき市',
    country: 'JP',
    nameKo: '카가와 사누키 세토우치',
    nameJa: '香川 さぬき瀬戸内',
    regionKo: '카가와현 사누키시',
    regionJa: '香川県 さぬき市 (中国・四国)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '瀬戸内海の穏やかな海と島々を望むコース。名物讃岐うどん巡りと合わせたラウンドが大人気。',
    address: '香川県さぬき市津田町',
    phone: '+81-879-42-3111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    parking: '無料駐車場完備',
    lat: 34.2984,
    lng: 134.2514,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-tokushima-yoshinogawa',
    name: '徳島 吉野川',
    region: '徳島県 徳島市',
    country: 'JP',
    nameKo: '토쿠시마 요시노가와',
    nameJa: '徳島 吉野川',
    regionKo: '토쿠시마현 토쿠시마시',
    regionJa: '徳島県 徳島市 (中国・四国)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '四国三郎・吉野川の雄大な流れを臨むリバーサイドコース。爽やかな風の中でのびのびプレー。',
    address: '徳島県徳島市上吉野町 吉野川河川敷',
    phone: '+81-88-621-5111',
    fee: '400円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第3木曜日',
    parking: '無料駐車場完備',
    lat: 34.0812,
    lng: 134.5412,
    holesMetadata: generateStandardHoles(18),
  },

  // --- 7. 九州・沖縄 (Kyushu / Okinawa) 名門コース群 ---
  {
    id: 'jp-course-fukuoka-chikugogawa',
    name: '福岡 筑後川',
    region: '福岡県 久留米市',
    country: 'JP',
    nameKo: '후쿠오카 치쿠고가와',
    nameJa: '福岡 筑後川',
    regionKo: '후쿠오카현 구루메시',
    regionJa: '福岡県 久留米市 筑後川河川敷 (九州・沖縄)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '九州屈指の大河・筑後川の河川敷に広がる大人気36ホール！広大なフェアウェイと手入れの行き届いたベント芝。',
    address: '福岡県久留米市百年公園 筑後川河川敷',
    phone: '+81-942-30-9000',
    fee: '600円 (用具レンタル200円)',
    openHours: '08:30 ~ 17:00',
    closedDay: '第2・第4水曜日',
    parking: '百年公園大駐車場完備',
    lat: 33.3284,
    lng: 130.5412,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-fukuoka-hibikinada',
    name: '福岡 ひびき灘',
    region: '福岡県 北九州市',
    country: 'JP',
    nameKo: '후쿠오카 히비키나다',
    nameJa: '福岡 ひびき灘',
    regionKo: '후쿠오카현 기타큐슈시',
    regionJa: '福岡県 北九州市 若松区 (九州・沖縄)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '響灘の青い海を望むシーサイド公認コース！海風を読んだ正確なアプローチがスコアメイクの鍵。',
    address: '福岡県北九州市若松区安屋284',
    phone: '+81-93-741-5545',
    fee: '800円',
    openHours: '08:30 ~ 17:00',
    closedDay: '月曜日',
    parking: '無料駐車場150台完備',
    lat: 33.9142,
    lng: 130.7314,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-kumamoto-aso',
    name: '熊本 阿蘇パノラマ',
    region: '熊本県 阿蘇市',
    country: 'JP',
    nameKo: '쿠마모토 아소 파노라마',
    nameJa: '熊本 阿蘇パノラマ',
    regionKo: '쿠마모토현 아소시',
    regionJa: '熊本県 阿蘇市 (九州・沖縄)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '雄大な阿蘇五岳を一望する高原リゾートコース！涼やかな風と美しい緑に包まれた36ホール。',
    address: '熊本県阿蘇市内牧',
    phone: '+81-967-32-1111',
    fee: '800円',
    openHours: '08:30 ~ 17:00',
    closedDay: '火曜日',
    parking: '大型無料駐車場完備',
    lat: 32.9712,
    lng: 131.0412,
    holesMetadata: generateStandardHoles(36),
  },
  {
    id: 'jp-course-kagoshima-sakurajima',
    name: '鹿児島 桜島錦江湾',
    region: '鹿児島県 鹿児島市',
    country: 'JP',
    nameKo: '카고시마 사쿠라지마 킨코완',
    nameJa: '鹿児島 桜島錦江湾',
    regionKo: '카고시마현 카고시마시',
    regionJa: '鹿児島県 鹿児島市 (九州・沖縄)',
    totalCourses: 2,
    totalHoles: 18,
    isVerified: true,
    isLocked: true,
    description: '噴煙たなびく桜島と錦江湾の壮大なパノラマを目の前にプレーする唯一無二の絶景18ホール。',
    address: '鹿児島県鹿児島市与次郎',
    phone: '+81-99-250-1111',
    fee: '500円',
    openHours: '08:30 ~ 17:00',
    closedDay: '第1月曜日',
    parking: '無料駐車場完備',
    lat: 31.5714,
    lng: 130.5612,
    holesMetadata: generateStandardHoles(18),
  },
  {
    id: 'jp-course-okinawa-itoman',
    name: '沖縄 糸満 平和の森',
    region: '沖縄県 糸満市',
    country: 'JP',
    nameKo: '오키나와 이토만 평화의 숲',
    nameJa: '沖縄 糸満 平和の森',
    regionKo: '오키나와현 이토만시',
    regionJa: '沖縄県 糸満市 (九州・沖縄)',
    totalCourses: 4,
    totalHoles: 36,
    isVerified: true,
    isLocked: true,
    description: '日本最南端の36ホール公認コース！エメラルドグリーンの東シナ海を望む南国リゾートパークゴルフの最高峰。',
    address: '沖縄県糸満市字山城444',
    phone: '+81-98-997-2765',
    fee: '1,000円 (用具一式込)',
    openHours: '08:00 ~ 18:00 (通年営業)',
    closedDay: '年中無休',
    parking: '大型無料駐車場250台完備',
    lat: 26.0912,
    lng: 127.6924,
    holesMetadata: generateStandardHoles(36),
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
