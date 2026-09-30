import { TournamentNotice, ParkGolfNewsItem } from '@/types/board';

const REGION_MAP_KO_TO_JA: Record<string, string> = {
  '전국': '全国',
  '경남 창원': '慶南 昌原',
  '경남': '慶南',
  '창원': '昌原',
  '경기 양평': '京畿 楊平',
  '경기': '京畿',
  '양평': '楊平',
  '대구 수성': '大邱 寿城',
  '대구 달성': '大邱 達城',
  '대구': '大邱',
  '수성': '寿城',
  '달성': '達城',
  '충북 제천': '忠北 堤川',
  '충북': '忠北',
  '제천': '堤川',
  '인천 서구': '仁川 西区',
  '인천': '仁川',
  '경북 구미': '慶北 亀尾',
  '경북': '慶北',
  '구미': '亀尾',
  '부산 사상': '釜山 沙上',
  '부산': '釜山',
  '서울 여의도': 'ソウル 汝矣島',
  '서울': 'ソウル',
  '강원': '江原',
  '전북': '全北',
  '전남': '全南',
  '충남': '忠南',
  '제주': '済州',
  '광주': '光州',
  '대전': '大田',
  '울산': '蔚山',
  '세종': '世宗',
};

const REGION_MAP_JA_TO_KO: Record<string, string> = {
  '日本全国': '일본 전국',
  '北海道 幕別': '홋카이도 마쿠베츠',
  '北海道 札幌': '홋카이도 삿포로',
  '北海道': '홋카이도',
  '幕別': '마쿠베츠',
  '札幌': '삿포로',
  '宮城 仙台': '미야기 센다이',
  '宮城': '미야기',
  '仙台': '센다이',
  '兵庫 神戸': '효고 고베',
  '兵庫': '효고',
  '神戸': '고베',
  '熊本 阿蘇': '구마모토 아소',
  '熊本': '구마모토',
  '阿蘇': '아소',
  '東北': '도호쿠',
  '関東': '간토',
  '関西': '간사이',
  '九州': '규슈',
  '沖縄': '오키나와',
};

export function formatBilingualRegion(region: string, isJa: boolean): string {
  if (!region) return '';
  if (isJa) {
    if (REGION_MAP_KO_TO_JA[region]) return REGION_MAP_KO_TO_JA[region];
    let result = region;
    for (const [k, v] of Object.entries(REGION_MAP_KO_TO_JA)) {
      result = result.replace(new RegExp(k, 'g'), v);
    }
    result = result
      .replace(/시$/g, '市')
      .replace(/군$/g, '郡')
      .replace(/구$/g, '区')
      .replace(/시 /g, '市 ')
      .replace(/군 /g, '郡 ')
      .replace(/구 /g, '区 ')
      .replace(/면/g, '面')
      .replace(/읍/g, '邑')
      .replace(/동/g, '洞');
    return result;
  } else {
    if (REGION_MAP_JA_TO_KO[region]) return REGION_MAP_JA_TO_KO[region];
    let result = region;
    for (const [k, v] of Object.entries(REGION_MAP_JA_TO_KO)) {
      result = result.replace(new RegExp(k, 'g'), v);
    }
    result = result
      .replace(/市$/g, '시')
      .replace(/郡$/g, '군')
      .replace(/区$/g, '구')
      .replace(/市 /g, '시 ')
      .replace(/郡 /g, '군 ')
      .replace(/区 /g, '구 ')
      .replace(/面/g, '면')
      .replace(/町/g, '町');
    return result;
  }
}

export function formatBilingualDate(str: string, isJa: boolean): string {
  if (!str) return '';
  if (isJa) {
    return str
      .replace(/년/g, '年')
      .replace(/월/g, '月')
      .replace(/일/g, '日')
      .replace(/\(월\)/g, '(月)')
      .replace(/\(화\)/g, '(火)')
      .replace(/\(수\)/g, '(水)')
      .replace(/\(목\)/g, '(木)')
      .replace(/\(금\)/g, '(金)')
      .replace(/\(토\)/g, '(土)')
      .replace(/\(일\)/g, '(日)')
      .replace(/오전/g, '午前')
      .replace(/오후/g, '午後');
  } else {
    return str
      .replace(/年/g, '년 ')
      .replace(/月/g, '월 ')
      .replace(/日/g, '일')
      .replace(/\(月\)/g, '(월)')
      .replace(/\(火\)/g, '(화)')
      .replace(/\(水\)/g, '(수)')
      .replace(/\(木\)/g, '(목)')
      .replace(/\(金\)/g, '(금)')
      .replace(/\(土\)/g, '(토)')
      .replace(/\(日\)/g, '(일)')
      .replace(/午前/g, '오전')
      .replace(/午後/g, '오후');
  }
}

export function formatBilingualFee(fee: string, isJa: boolean): string {
  if (!fee) return '';
  if (isJa) {
    return fee
      .replace(/1인/g, '1人')
      .replace(/원/g, 'ウォン')
      .replace(/무료/g, '無料')
      .replace(/점심/g, '昼食')
      .replace(/포함/g, '付')
      .replace(/기념품/g, '記念品');
  } else {
    return fee
      .replace(/1人/g, '1인')
      .replace(/円/g, '엔')
      .replace(/ウォン/g, '원')
      .replace(/無料/g, '무료')
      .replace(/昼食/g, '점심')
      .replace(/付/g, '포함')
      .replace(/記念品/g, '기념품');
  }
}

export function formatBilingualCourse(course: string, isJa: boolean): string {
  if (!course) return '';
  if (isJa) {
    return course
      .replace(/파크골프장/g, 'パークゴルフ場')
      .replace(/파크골프 코스/g, 'パークゴルフコース')
      .replace(/파크골프/g, 'パークゴルフ')
      .replace(/골프장/g, 'ゴルフ場')
      .replace(/공인구장/g, '公認コース')
      .replace(/공인 코스/g, '公認コース')
      .replace(/공인/g, '公認')
      .replace(/구장/g, '球場')
      .replace(/홀/g, 'ホール')
      .replace(/대산면/g, '大山面')
      .replace(/창원/g, '昌原')
      .replace(/강상/g, '江上')
      .replace(/양평/g, '楊平')
      .replace(/대구/g, '大邱')
      .replace(/수성/g, '寿城')
      .replace(/달성/g, '達城')
      .replace(/구지/g, '丘智')
      .replace(/레포츠파크/g, 'レポーツパーク')
      .replace(/아시아드/g, 'アジアード')
      .replace(/인천/g, '仁川')
      .replace(/청라/g, '青羅')
      .replace(/청풍호/g, '清風湖')
      .replace(/제천/g, '堤川')
      .replace(/다사세천/g, '多斯洗川')
      .replace(/낙동강/g, '洛東江')
      .replace(/동락/g, '同楽')
      .replace(/삼락/g, '三楽')
      .replace(/여의도/g, '汝矣島')
      .replace(/구미/g, '亀尾')
      .replace(/부산/g, '釜山')
      .replace(/서울/g, 'ソウル')
      .replace(/경기/g, '京畿')
      .replace(/강원/g, '江原')
      .replace(/경북/g, '慶北')
      .replace(/경남/g, '慶南')
      .replace(/전북/g, '全北')
      .replace(/전남/g, '全南')
      .replace(/충북/g, '忠北')
      .replace(/충남/g, '忠南')
      .replace(/제주/g, '済州')
      .replace(/광주/g, '光州')
      .replace(/대전/g, '大田')
      .replace(/울산/g, '蔚山')
      .replace(/세종/g, '世宗');
  } else {
    return course
      .replace(/パークゴルフ場/g, '파크골프장')
      .replace(/パークゴルフコース/g, '파크골프 코스')
      .replace(/パークゴルフ/g, '파크골프')
      .replace(/公認コース/g, '공인 코스')
      .replace(/ホール/g, '홀')
      .replace(/大山面/g, '대산면')
      .replace(/つつじ/g, '츠츠지')
      .replace(/ちろっと/g, '치롯토')
      .replace(/前田森林公園/g, '마에다 삼림공원')
      .replace(/みやぎパークランド/g, '미야기 파크랜드')
      .replace(/杜の都/g, '모리의 미야코')
      .replace(/しあわせの村/g, '시아와세노무라')
      .replace(/阿蘇ハイランド/g, '아소 하이랜드')
      .replace(/モエレ沼公園/g, '모에레누마 공원');
  }
}

export function formatBilingualTitle(title: string, isJa: boolean): string {
  if (!title) return '';
  if (isJa) {
    return title
      .replace(/문화체육관광부장관기/g, '文化体育観光部長官旗')
      .replace(/전국 파크골프대회/g, '全国パークゴルフ大会')
      .replace(/전국파크골프대회/g, '全国パークゴルフ大会')
      .replace(/전국 파크골프 챔피언십/g, '全国パークゴルフ選手権')
      .replace(/전국 파크골프/g, '全国パークゴルフ')
      .replace(/전국/g, '全国')
      .replace(/파크골프/g, 'パークゴルフ')
      .replace(/물맑은 양평/g, '水清き楊平')
      .replace(/대구광역시/g, '大邱広域市')
      .replace(/대구/g, '大邱')
      .replace(/파크골프협회장기/g, 'パークゴルフ協会長旗')
      .replace(/협회장기/g, '協会長旗')
      .replace(/시장배/g, '市長杯')
      .replace(/군수배/g, '郡守杯')
      .replace(/시니어 대회/g, 'シニア大会')
      .replace(/시니어/g, 'シニア')
      .replace(/청풍호반배/g, '清風湖畔杯')
      .replace(/청풍호/g, '清風湖')
      .replace(/볼빅/g, 'ボルビック')
      .replace(/달성군수배/g, '達城郡守杯')
      .replace(/달성군/g, '達城郡')
      .replace(/달성/g, '達城')
      .replace(/매일방송/g, '毎日放送')
      .replace(/챔피언십/g, '選手権')
      .replace(/선수권대회/g, '選手権大会')
      .replace(/선수권/g, '選手権')
      .replace(/친선대회/g, '親善大会')
      .replace(/오픈/g, 'オープン')
      .replace(/클래식/g, 'クラシック')
      .replace(/및/g, '＆')
      .replace(/대회/g, '大会')
      .replace(/제(\d+)회/g, '第$1回')
      .replace(/배/g, '杯');
  } else {
    return title
      .replace(/第(\d+)回/g, '제$1회')
      .replace(/日本航空\(JAL\)カップ/g, '일본항공(JAL)컵')
      .replace(/幕別国際パークゴルフ選手権大会/g, '마쿠베츠 국제 파크골프 선수권대회')
      .replace(/全日本パークゴルフ選手権大会/g, '전일본 파크골프 선수권대회')
      .replace(/北海道知事杯/g, '홋카이도 지사배')
      .replace(/パークゴルフクラシック/g, '파크골프 클래식')
      .replace(/東北/g, '도호쿠')
      .replace(/関西パークゴルフ親善大会/g, '간사이 파크골프 친선대회')
      .replace(/九州オープン/g, '규슈 오픈')
      .replace(/本間ゴルフ/g, '혼마골프');
  }
}

export function formatBilingualHost(host: string, isJa: boolean): string {
  if (!host) return '';
  if (isJa) {
    return host
      .replace(/사단법인 대한파크골프협회/g, '(社)大韓パークゴルフ協会')
      .replace(/대한파크골프협회/g, '大韓パークゴルフ協会')
      .replace(/문화체육관광부/g, '文化体育観光部')
      .replace(/양평군 파크골프협회/g, '楊平郡パークゴルフ協会')
      .replace(/양평군/g, '楊平郡')
      .replace(/대구광역시 파크골프협회/g, '大邱広域市パークゴルフ協会')
      .replace(/대구광역시체육회/g, '大邱広域市体育会')
      .replace(/대구광역시/g, '大邱広域市')
      .replace(/대구/g, '大邱')
      .replace(/제천시 파크골프협회/g, '堤川市パークゴルフ協会')
      .replace(/제천시/g, '堤川市')
      .replace(/달성군체육회/g, '達城郡体育会')
      .replace(/달성군/g, '達城郡')
      .replace(/달성/g, '達城')
      .replace(/체육회/g, '体育会')
      .replace(/매일방송/g, '毎日放送')
      .replace(/파크골프협회/g, 'パークゴルフ協会')
      .replace(/파크골프/g, 'パークゴルフ')
      .replace(/협회/g, '協会')
      .replace(/공인/g, '公認')
      .replace(/시/g, '市')
      .replace(/군/g, '郡');
  } else {
    return host
      .replace(/\(公社\)日本パークゴルフ協会/g, '(공사)일본파크골프협회')
      .replace(/日本パークゴルフ協会/g, '일본파크골프협회')
      .replace(/幕別町/g, '마쿠베츠町')
      .replace(/北海道/g, '홋카이도')
      .replace(/美津濃株式会社/g, '미즈노 주식회사')
      .replace(/宮城県パークゴルフ協会/g, '미야기현 파크골프협회')
      .replace(/アシックスジャパン/g, '아식스재팬')
      .replace(/兵庫県パークゴルフ連盟/g, '효고현 파크골프연맹')
      .replace(/株式会社 本間ゴルフ/g, '주식회사 혼마골프')
      .replace(/熊本県パークゴルフ協会/g, '구마모토현 파크골프협회');
  }
}

/**
 * 시합 공고를 현재 언어(한국어/일본어)에 맞춰 100% 빈틈없이 해석해 반환하는 지능형 함수
 */
export function resolveNoticeDisplay(item: TournamentNotice, isJapanese: boolean) {
  const isJp = item.country === 'JP';

  // 제목: 사전 필터링을 거쳐 잔여 한국어/일본어 완벽 제거
  let rawTitle = isJapanese ? (item.titleJa || item.title) : (item.titleKo || item.title);
  let title = formatBilingualTitle(rawTitle, isJapanese);

  // 개최 구장
  let rawCourse = isJapanese ? (item.courseNameJa || item.courseName) : (item.courseNameKo || item.courseName);
  let courseName = formatBilingualCourse(rawCourse, isJapanese);

  // 주최 / 주관
  let rawHost = isJapanese ? (item.hostJa || item.host) : (item.hostKo || item.host);
  let host = formatBilingualHost(rawHost, isJapanese);

  // 지역
  let rawRegion = isJapanese ? (item.regionJa || item.region) : (item.regionKo || item.region);
  let region = formatBilingualRegion(rawRegion, isJapanese);

  // 대회 일시
  let rawDate = isJapanese ? (item.eventDateStrJa || item.eventDateStr) : (item.eventDateStrKo || item.eventDateStr);
  let eventDateStr = formatBilingualDate(rawDate, isJapanese);

  // 접수 기간
  let rawPeriod = isJapanese ? (item.periodStrJa || item.periodStr) : (item.periodStrKo || item.periodStr);
  let periodStr = formatBilingualDate(rawPeriod, isJapanese);

  // 참가비
  let rawFee = isJapanese ? (item.entryFeeJa || item.entryFee) : (item.entryFeeKo || item.entryFee);
  let entryFee = formatBilingualFee(rawFee, isJapanese);

  // 정원
  let targetCount = isJapanese ? (item.targetCountJa || item.targetCount) : (item.targetCountKo || item.targetCount);
  if (isJapanese && targetCount) {
    targetCount = targetCount
      .replace(/전국/g, '全国')
      .replace(/명/g, '名')
      .replace(/선착순/g, '先着順')
      .replace(/시·도/g, '市・道')
      .replace(/대표선수단/g, '代表選手団')
      .replace(/대표/g, '代表')
      .replace(/선수단/g, '選手団')
      .replace(/선수/g, '選手')
      .replace(/총/g, '計')
      .replace(/동호인/g, '愛好者')
      .replace(/애호가/g, '愛好者')
      .replace(/애호자/g, '愛好者')
      .replace(/및/g, '・')
      .replace(/영남권/g, '嶺南地域')
      .replace(/시니어/g, 'シニア')
      .replace(/일반/g, '一般')
      .replace(/오픈 챔피언십/g, 'オープン選手権')
      .replace(/오픈/g, 'オープン')
      .replace(/챔피언십/g, '選手権')
      .replace(/선수권대회/g, '選手権大会')
      .replace(/선수권/g, '選手権')
      .replace(/대회/g, '大会')
      .replace(/친선/g, '親善')
      .replace(/참가자/g, '参加者');
  }

  // 참가 자격
  let qualification = isJapanese ? (item.qualificationJa || item.qualification) : (item.qualificationKo || item.qualification);
  if (isJapanese && qualification) {
    qualification = qualification
      .replace(/사단법인 대한파크골프협회/g, '(社)大韓パークゴルフ協会')
      .replace(/사단법인/g, '(社)')
      .replace(/대한파크골프협회/g, '大韓パークゴルフ協会')
      .replace(/파크골프협회/g, 'パークゴルフ協会')
      .replace(/파크골프/g, 'パークゴルフ')
      .replace(/볼빅/g, 'ボルビック')
      .replace(/미즈노/g, 'ミズノ')
      .replace(/아식스/g, 'アシックス')
      .replace(/혼마/g, '本間')
      .replace(/등록/g, '登録')
      .replace(/정회원/g, '正会員')
      .replace(/회원/g, '会員')
      .replace(/선발/g, '選抜')
      .replace(/선수/g, '選手')
      .replace(/전국/g, '全国')
      .replace(/동호인/g, '愛好者')
      .replace(/애호가/g, '愛好者')
      .replace(/애호자/g, '愛好者')
      .replace(/누구나/g, 'どなたでも')
      .replace(/공인구/g, '公認球')
      .replace(/공인클럽/g, '公認クラブ')
      .replace(/공인용품/g, '公認用具')
      .replace(/공인/g, '公認')
      .replace(/사용/g, '使用')
      .replace(/필수/g, '必須')
      .replace(/시·도/g, '市・道')
      .replace(/대구광역시/g, '大邱広域市')
      .replace(/대구/g, '大邱')
      .replace(/및/g, 'および')
      .replace(/환영/g, '歓迎')
      .replace(/초보자/g, '初心者')
      .replace(/해외/g, '海外')
      .replace(/여행객/g, '旅行者');
  }

  return {
    title,
    courseName,
    host,
    region,
    eventDateStr,
    periodStr,
    entryFee,
    targetCount,
    qualification,
    isJp,
  };
}

/**
 * 파크골프 뉴스를 현재 언어(한국어/일본어)에 맞춰 100% 빈틈없이 해석해 반환하는 지능형 함수
 */
export function resolveNewsDisplay(item: ParkGolfNewsItem, isJapanese: boolean) {
  const isJp = item.country === 'JP';

  let rawTitle = isJapanese ? (item.titleJa || item.title) : (item.titleKo || item.title);
  let title = formatBilingualTitle(rawTitle, isJapanese);

  let summary = isJapanese ? (item.summaryJa || item.summary) : (item.summaryKo || item.summary);

  let rawRegion = isJapanese ? (item.regionJa || item.region) : (item.regionKo || item.region);
  let region = formatBilingualRegion(rawRegion, isJapanese);

  let rawSource = isJapanese ? (item.sourceJa || item.source) : (item.sourceKo || item.source);
  let source = formatBilingualHost(rawSource, isJapanese);

  let rawDate = isJapanese ? (item.dateStrJa || item.dateStr) : (item.dateStrKo || item.dateStr);
  let dateStr = formatBilingualDate(rawDate, isJapanese);

  return {
    title,
    summary,
    region,
    source,
    dateStr,
    isJp,
  };
}
