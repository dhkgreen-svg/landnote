'use client';

import { RoundSession } from '@/types/parkon';
import { ParkOnStorage } from './storage';

export type PilgrimageCategory = 'HERITAGE' | 'KOREA_MASTERPIECE' | 'JAPAN_MASTERPIECE' | 'GLOBAL_PIONEER';

export interface PilgrimageCourse {
  id: string;
  courseId: string; // Course ID in DEFAULT_COURSES or JAPAN_COURSES_DB
  nameKo: string;
  nameJa: string;
  regionKo: string;
  regionJa: string;
  country: 'KR' | 'JP';
  category: PilgrimageCategory;
  categoryLabelKo: string;
  categoryLabelJa: string;
  badgeEmoji: string;
  taglineKo: string;
  taglineJa: string;
  historicTitleKo: string;
  historicTitleJa: string;
  descriptionKo: string;
  descriptionJa: string;
  highlightsKo: string[];
  highlightsJa: string[];
  // 빅데이터 승격 지표
  outOfTownRatio: number; // e.g. 82%
  ratingScore: number; // e.g. 4.95
  globalVisitorCount: number; // e.g. 1420
  petitionVotes: number; // e.g. 3840
}

export const PILGRIMAGE_COURSES: PilgrimageCourse[] = [
  // ==========================================
  // [Track A] 불멸의 역사 헤리티지 4대 성지 (Heritage Classic)
  // ==========================================
  {
    id: 'pilgrim-jp-makubetsu',
    courseId: 'jp-course-makubetsu-tsutsujigaoka',
    nameKo: '홋카이도 마쿠베츠 츠츠지가오카',
    nameJa: '北海道 幕別町 つつじが丘',
    regionKo: '일본 홋카이도 토카치 (발상지)',
    regionJa: '日本 北海道 十勝 (発祥の地)',
    country: 'JP',
    category: 'HERITAGE',
    categoryLabelKo: '불멸의 역사 성지',
    categoryLabelJa: '不滅の歴史聖地',
    badgeEmoji: '🏛️',
    taglineKo: '1983년 파크골프가 전 세계 최초로 탄생한 성지 중의 성지',
    taglineJa: '1983年 パークゴルフが全世界で初めて誕生した不滅の原点聖地',
    historicTitleKo: '전 세계 파크골프 발상지 1호 (World Birthplace)',
    historicTitleJa: '全世界パークゴルフ発祥の地 1号',
    descriptionKo: '1983년 마쿠베츠초 교육위원회 마에하라 츠요시 씨가 하천 둔치에 7개 홀을 만들어 시작된 전 세계 파크골프의 고향입니다. 발상지 기념비와 역사관이 자리하며, 자작나무와 진달래가 만개하는 전 세계 골퍼들의 버킷리스트 1호입니다.',
    descriptionJa: '1983年幕別町教育委員会によって誕生した全世界パークゴルフの原点です。発祥の地記念碑と歴史資料館が佇み、白樺とツツジに囲まれた世界中の愛好者が訪れる巡礼地です。',
    highlightsKo: ['1983년 세계 최초 파크골프 발상지 기념비', '전 세계 골퍼 평생 순례 1순위', '원형 코스 그대로 보존된 36홀 명문'],
    highlightsJa: ['1983年世界初パークゴルフ発祥の地記念碑', '世界中の愛好者の生涯巡礼地', '原型コースを保存した名門36ホール'],
    outOfTownRatio: 94,
    ratingScore: 4.98,
    globalVisitorCount: 4200,
    petitionVotes: 8900,
  },
  {
    id: 'pilgrim-kr-sangnakwon',
    courseId: 'course-jinju-sangnakwon',
    nameKo: '경남 진주 상락원 파크골프장',
    nameJa: '韓国 慶南 晋州 上楽園コース',
    regionKo: '경남 진주시 판문동',
    regionJa: '韓国 慶南 晋州市 板門洞',
    country: 'KR',
    category: 'HERITAGE',
    categoryLabelKo: '불멸의 역사 성지',
    categoryLabelJa: '不滅の歴史聖地',
    badgeEmoji: '🌱',
    taglineKo: '2000년 6월 1일 대한민국 최초 도입 및 시발지 공인 표지석 구장',
    taglineJa: '2000年6月1日 韓国で初めて導入された始発地公認記念碑コース',
    historicTitleKo: '대한민국 파크골프 최초 시발지 (Korea Origin)',
    historicTitleJa: '韓国パークゴルフ最初の始発地',
    descriptionKo: '1999년 진주시 공무원들이 일본 파크골프장을 견학 후 어르신 복지를 위해 조성하여 2000년 6월 1일 정식 개장한 대한민국 파크골프의 뿌리입니다. 대한파크골프협회에서 공식 지정한 "대한민국 파크골프 시발지" 표지석이 보존되어 있습니다.',
    descriptionJa: '1999年に晋州市が日本を視察後に造成し、2000年6月1日に正式開場した韓国パークゴルフの発祥地です。大韓パークゴルフ協会公認の「始発地記念碑」が建立されています。',
    highlightsKo: ['대한파크골프협회 공인 대한민국 시발지 표지석', '한국 파크골프 26년 역사의 태동지', '노인복지에서 생활체육으로 도약한 상징'],
    highlightsJa: ['大韓パークゴルフ協会公認 始発地記念碑', '韓国パークゴルフ26年の歴史の原点', '福祉から国民スポーツへ昇華した象徴'],
    outOfTownRatio: 78,
    ratingScore: 4.88,
    globalVisitorCount: 1650,
    petitionVotes: 5120,
  },
  {
    id: 'pilgrim-kr-yeouido',
    courseId: 'course-seoul-yeouido',
    nameKo: '서울 여의도 한강 파크골프장',
    nameJa: 'ソウル 汝矣島 漢江コース',
    regionKo: '서울특별시 영등포구 여의도동',
    regionJa: 'ソウル特別市 永登浦区 汝矣島',
    country: 'KR',
    category: 'HERITAGE',
    categoryLabelKo: '불멸의 역사 성지',
    categoryLabelJa: '不滅の歴史聖地',
    badgeEmoji: '🏙️',
    taglineKo: '2004년 5월 15일 국내 최초 정식 규격 대중 공인 1호 구장',
    taglineJa: '2004年5月15日 国内初の正規規格大衆公認1号コース',
    historicTitleKo: '대한민국 정식 규격 대중 1호 (Standard Course No.1)',
    historicTitleJa: '大韓民国 正規規格 大衆公認1号',
    descriptionKo: '2003년 10월 한국파크골프협회 창립 후, 고(故) 전우석 초대 회장의 사재 기부와 서울시의 지원으로 63빌딩 앞 한강 둔치에 조성된 최초의 정식 규격 구장입니다. 전국적인 파크골프 대중화 붐의 도화선이 된 역사적 랜드마크입니다.',
    descriptionJa: '2003年協会設立後、ソウル市と寄付によって漢江河川敷に造成された国内初の9ホール正規規格コースです。全国普及の起爆剤となった歴史的聖地です。',
    highlightsKo: ['대한민국 최초 정식 규격 대중 공인 구장', '한강과 63빌딩을 마주보는 수도권 관문', '전국 파크골프 대중화의 역사적 진원지'],
    highlightsJa: ['韓国初の正規規格大衆公認コース', '漢江と超高層ビルを望む首都圏ランドマーク', '全国普及の起爆剤となった歴史的現場'],
    outOfTownRatio: 72,
    ratingScore: 4.85,
    globalVisitorCount: 2890,
    petitionVotes: 6400,
  },
  {
    id: 'pilgrim-kr-gumi-dongrak',
    courseId: 'course-gumi-dongrak',
    nameKo: '경북 구미 동락 파크골프장',
    nameJa: '韓国 慶北 亀尾 同楽公園コース',
    regionKo: '경북 구미시 진평동',
    regionJa: '韓国 慶尚北道 亀尾市',
    country: 'KR',
    category: 'HERITAGE',
    categoryLabelKo: '불멸의 역사 성지',
    categoryLabelJa: '不滅の歴史聖地',
    badgeEmoji: '👑',
    taglineKo: '2019년 대한파크골프협회 공인 제1호 & 대통령기 대회의 심장',
    taglineJa: '2019年 大韓パークゴルフ協会公認第1号 ＆ 大統領杯の心臓',
    historicTitleKo: '대한민국 협회 공인 제1호 (KPGA Certified No.1)',
    historicTitleJa: '大韓パークゴルフ協会公認 第1号',
    descriptionKo: '대한파크골프협회로부터 국내 역사상 최초로 ‘공인 1호’ 지정을 받은 대한민국 챔피언십 대회의 메카입니다. 낙동강 수변을 따라 완벽하게 관리된 36홀 명품 코스로, 대통령기 전국대회 등 최고 권위 대회가 치러지는 표준 규격의 전당입니다.',
    descriptionJa: '大韓パークゴルフ協会から歴史上初めて「公認第1号」指定を受けた韓国最高峰トーナメントの聖地です。洛東江沿いの36ホール名門で、大統領杯など最高峰大会が毎年開催されます。',
    highlightsKo: ['대한파크골프협회 전국 공인 1호 구장 (2019)', '대통령기 전국 파크골프대회 주개최지', '낙동강 수변 36홀 매머드 챔피언십 코스'],
    highlightsJa: ['韓国初・大韓パークゴルフ協会公認第1号', '大統領杯全国大会公式開催地', '洛東江沿いの36ホール名門コース'],
    outOfTownRatio: 86,
    ratingScore: 4.96,
    globalVisitorCount: 3100,
    petitionVotes: 9800,
  },

  // ==========================================
  // [Track B] 대한민국 5대 명품 성지 (Korea Masterpiece)
  // ==========================================
  {
    id: 'pilgrim-kr-hwacheon',
    courseId: 'course-hwacheon-sancheoneo',
    nameKo: '강원 화천 산천어 파크골프장',
    nameJa: '江原 華川 ヤマメ名門コース',
    regionKo: '강원특별자치도 화천군 하남면',
    regionJa: '韓国 江原特別自治道 華川郡',
    country: 'KR',
    category: 'KOREA_MASTERPIECE',
    categoryLabelKo: '대한민국 5대 명품 성지',
    categoryLabelJa: '大韓民国 5大名門聖地',
    badgeEmoji: '🐟',
    taglineKo: '대한민국 파크골프의 수도 & 국내 최초 명예의 전당 보유지',
    taglineJa: '大韓民国パークゴルフの首都 ＆ 国内初・名誉の殿堂保有地',
    historicTitleKo: '대한민국 파크골프 수도 (Capital of ParkGolf)',
    historicTitleJa: '大韓民国パークゴルフの首都',
    descriptionKo: '북한강변을 따라 펼쳐진 수려한 자연경관과 1,500m 최장 전장을 갖춘 전국 동호인 워너비 1위 구장입니다. 총상금 1억 원이 넘는 전국 페스티벌과 아시아 최초의 파크골프 명예의 전당이 조성된 현대 명품 파크골프의 정점입니다.',
    descriptionJa: '北漢江の絶景に沿って広がる1,500m最長コースを備えた全国人気No.1コースです。賞金1億ウォンを超える全国大会や名誉の殿堂が設置されています。',
    highlightsKo: ['국내 최초 파크골프 명예의 전당 조성', '북한강변 천혜의 36홀 천연잔디 절경', '전국 최대 상금 전국 페스티벌 개최지'],
    highlightsJa: ['国内初の名誉の殿堂設置', '北漢江の絶景36ホール天然芝', '全国最大規模賞金大会開催地'],
    outOfTownRatio: 91,
    ratingScore: 4.97,
    globalVisitorCount: 3800,
    petitionVotes: 11200,
  },
  {
    id: 'pilgrim-kr-yangpyeong',
    courseId: 'course-yangpyeong-gangsang',
    nameKo: '경기 양평 강상 파크골프장',
    nameJa: '京畿 楊平 江上メガコース',
    regionKo: '경기도 양평군 강상면',
    regionJa: '韓国 京畿道 楊平郡',
    country: 'KR',
    category: 'KOREA_MASTERPIECE',
    categoryLabelKo: '대한민국 5대 명품 성지',
    categoryLabelJa: '大韓民国 5大名門聖地',
    badgeEmoji: '🌊',
    taglineKo: '남한강 둔치 81홀 매머드 규모 & 수도권 최다 내장객 메카',
    taglineJa: '南漢江河川敷 81ホール超大型 ＆ 首都圏最多来場メッカ',
    historicTitleKo: '국내 최대 81홀 매머드 메카 (Mammoth 81 Holes)',
    historicTitleJa: '韓国最大 81ホールメガメッカ',
    descriptionKo: '남한강변을 따라 조성된 81홀 매머드급 코스로 수도권 1세대의 자존심입니다. 서울과의 뛰어난 접근성과 완벽하게 다듬어진 페어웨이로 연간 수만 명이 방문하는 전국 최대 인프라 구장입니다.',
    descriptionJa: '南漢江沿いに造成された81ホールの超大型コースで、ソウルからのアクセスも抜群の首都圏最大の来場者を誇る名門です。',
    highlightsKo: ['국내 최대 규모 81홀(제1·2구장) 인프라', '남한강변 시원한 강바람과 수변 생태 조경', '수도권 최다 동호인 방문 성지'],
    highlightsJa: ['韓国最大規模81ホールインフラ', '南漢江の川風と水辺景観', '首都圏最多来場者数を記録'],
    outOfTownRatio: 88,
    ratingScore: 4.92,
    globalVisitorCount: 2900,
    petitionVotes: 8700,
  },
  {
    id: 'pilgrim-kr-miryang',
    courseId: 'course-miryang-arirang',
    nameKo: '경남 밀양 아리랑 파크골프장',
    nameJa: '慶南 密陽 アリラン名門コース',
    regionKo: '경남 밀양시 삼문동',
    regionJa: '韓国 慶尚南道 密陽市',
    country: 'KR',
    category: 'KOREA_MASTERPIECE',
    categoryLabelKo: '대한민국 5대 명품 성지',
    categoryLabelJa: '大韓民国 5大名門聖地',
    badgeEmoji: '🌾',
    taglineKo: '밀양강 수변 45홀 & 전국 최고 수준의 천연 잔디 관리',
    taglineJa: '密陽江水辺45ホール ＆ 最高水準の天然芝管理',
    historicTitleKo: '영남권 최고 잔디 명품 성지 (Top Turf Masterpiece)',
    historicTitleJa: '嶺南圏最高の天然芝名門聖地',
    descriptionKo: '밀양강 둔치를 따라 부드러운 양탄자처럼 관리된 45홀 코스입니다. 최근 대형 전국대회를 성공적으로 유치하며 전국 골퍼들이 "잔디 상태로는 국내 최고"라 극찬하는 신흥 명품 성지입니다.',
    descriptionJa: '密陽江河川敷に広がる45ホールコースで、「芝生の管理状態は韓国トップ」と称賛される新興名門聖地です。',
    highlightsKo: ['골프장급 최고 수준의 잔디 평탄도', '밀양강 수변 45홀 여유로운 레이아웃', '전국대회 연쇄 유치로 급부상한 명소'],
    highlightsJa: ['ゴルフ場級の最高水準の芝生管理', '密陽江沿いの開放感あふれる45ホール', '全国大会連続開催で人気急上昇'],
    outOfTownRatio: 81,
    ratingScore: 4.94,
    globalVisitorCount: 2100,
    petitionVotes: 7300,
  },
  {
    id: 'pilgrim-kr-jeju-gangchanghak',
    courseId: 'course-jeju-gangchanghak',
    nameKo: '제주 서귀포 강창학 파크골프장',
    nameJa: '済州 西帰浦 姜昌鶴リゾートコース',
    regionKo: '제주특별자치도 서귀포시 강정동',
    regionJa: '韓国 済州特別自治道 西帰浦市',
    country: 'KR',
    category: 'KOREA_MASTERPIECE',
    categoryLabelKo: '대한민국 5대 명품 성지',
    categoryLabelJa: '大韓民国 5大名門聖地',
    badgeEmoji: '🏝️',
    taglineKo: '한라산과 서귀포 바다를 품은 사계절 에메랄드 힐링 투어 1순위',
    taglineJa: '漢拏山と西帰浦の海を望む四季エメラルド癒しツアーNo.1',
    historicTitleKo: '천혜의 사계절 힐링 성지 (Four-Season Resort)',
    historicTitleJa: '四季エメラルド癒しの聖地',
    descriptionKo: '서귀포 바다의 온화한 기후와 한라산의 절경 속에서 겨울철에도 푸른 양잔디에서 라운드를 즐길 수 있는 대한민국 최고의 체류형 스포츠 관광 성지입니다.',
    descriptionJa: '西帰浦の温暖な気候と漢拏山の絶景に恵まれ、冬でも緑の洋芝でプレーが楽しめる韓国最高の滞在型ツアー聖地です。',
    highlightsKo: ['한라산과 범섬 바다 조망의 파노라마 뷰', '겨울에도 휴장 없는 사계절 푸른 양잔디', '전국 골퍼 평생 원정 버킷리스트 1위'],
    highlightsJa: ['漢拏山と海のパノラマビュー', '冬でも休場なしの四季プレー可能な洋芝', '韓国愛好者の遠征バケットリストNo.1'],
    outOfTownRatio: 95,
    ratingScore: 4.96,
    globalVisitorCount: 3400,
    petitionVotes: 8900,
  },

  // ==========================================
  // [Track C] 일본 열도 5대 명품 성지 (Japan Masterpiece)
  // ==========================================
  {
    id: 'pilgrim-jp-sapporo-elk',
    courseId: 'jp-course-sapporo-elk',
    nameKo: '홋카이도 삿포로 엘크의 숲',
    nameJa: '北海道 札幌 エルクの森 パークゴルフ場',
    regionKo: '일본 홋카이도 삿포로시 미나미구',
    regionJa: '日本 北海道 札幌市 南区',
    country: 'JP',
    category: 'JAPAN_MASTERPIECE',
    categoryLabelKo: '일본 열도 5대 명품 성지',
    categoryLabelJa: '日本列島 5大名門聖地',
    badgeEmoji: '🌲',
    taglineKo: '자작나무 숲과 구릉 지형을 살린 홋카이도 36홀 명문',
    taglineJa: '白樺林と丘陵地形を生かした北海道36ホール名門',
    historicTitleKo: '대자연 침엽수림 명문 (Northern Forest Classic)',
    historicTitleJa: '北の大自然 針葉樹林名門',
    descriptionKo: '삿포로 교외의 울창한 자작나무 숲속에 조성된 36홀 코스로, 월드 코스와 가든 코스 등 골프장 못지않은 완벽한 언듈레이션과 벤트글라스를 자랑합니다.',
    descriptionJa: '札幌郊外の雄大な自然の中に広がる36ホールコース。完璧なアンジュレーションと最高峰の芝生を誇る名門コースです。',
    highlightsKo: ['자작나무 숲속 36홀 최고급 천연잔디', '홋카이도 대자연 피톤치드 힐링 라운드', 'NPGA 공인 국제 규격 토너먼트 코스'],
    highlightsJa: ['白樺林の中の36ホール最高級天然芝', '北海道の大自然フィトンチッド癒しプレー', 'NPGA公認 国際トーナメントコース'],
    outOfTownRatio: 89,
    ratingScore: 4.95,
    globalVisitorCount: 3600,
    petitionVotes: 7800,
  },
  {
    id: 'pilgrim-jp-saga-kasegawa',
    courseId: 'jp-course-saga-kasegawa',
    nameKo: '규슈 사가현 가세가와 댐',
    nameJa: '九州 佐賀 嘉瀬川ダム パークゴルフ場',
    regionKo: '일본 규슈 사가현 후지초',
    regionJa: '日本 九州 佐賀県 富士町',
    country: 'JP',
    category: 'JAPAN_MASTERPIECE',
    categoryLabelKo: '일본 열도 5대 명품 성지',
    categoryLabelJa: '日本列島 5大名門聖地',
    badgeEmoji: '♨️',
    taglineKo: '규슈 최대 45홀 NPGA 공인 & 후루유 온천 관광 메카',
    taglineJa: '九州最大45ホールNPGA公認 ＆ 古湯温泉リゾートメッカ',
    historicTitleKo: '규슈 최대 45홀 온천 메카 (Kyushu 45 Holes Resort)',
    historicTitleJa: '九州最大45ホール温泉リゾートメッカ',
    descriptionKo: '가세가와 댐 호수 기슭에 펼쳐진 규슈 북부 최대 45홀 구장으로, 후쿠오카 공항에서 접근성이 뛰어나고 인근 온천 마을과 연계되어 한국인 골퍼들의 발길이 끊이지 않는 곳입니다.',
    descriptionJa: '嘉瀬川ダム湖畔に広がる九州最大45ホールコース。福岡空港からのアクセスも良く、古湯温泉と連動した人気No.1ツアー拠点です。',
    highlightsKo: ['규슈 북부 최대 45홀(5개 코스) NPGA 공인', '댐 호수를 바라보는 수려한 호반 뷰', '후루유 온천 힐링과 연계된 관광 명소'],
    highlightsJa: ['九州北部最大45ホール NPGA公認コース', 'ダム湖を望む雄大なレイクビュー', '古湯温泉と連動した人気観光拠点'],
    outOfTownRatio: 92,
    ratingScore: 4.93,
    globalVisitorCount: 4100,
    petitionVotes: 8100,
  },
  {
    id: 'pilgrim-jp-kumamoto-choyou',
    courseId: 'jp-course-kumamoto-choyou',
    nameKo: '규슈 구마모토 초요 코스',
    nameJa: '九州 熊本 CHOYOU パークゴルフ場',
    regionKo: '일본 규슈 구마모토현 미나미아소촌',
    regionJa: '日本 九州 熊本県 南阿蘇村',
    country: 'JP',
    category: 'JAPAN_MASTERPIECE',
    categoryLabelKo: '일본 열도 5대 명품 성지',
    categoryLabelJa: '日本列島 5大名門聖地',
    badgeEmoji: '🌋',
    taglineKo: '웅장한 아소산 대자연의 파노라마 뷰를 품은 36홀 명문',
    taglineJa: '壮大な阿蘇山の大パノラマビューを抱く36ホール名門',
    historicTitleKo: '아소산 파노라마 절경 성지 (Aso Panorama Classic)',
    historicTitleJa: '阿蘇山大パノラマ絶景聖地',
    descriptionKo: '세계 최대 칼데라 아소산의 웅장한 능선 아래 펼쳐진 36홀 NPGA 공식 인증 구장으로, 맑은 화산 암반수와 이국적인 초원에서 즐기는 규슈 최고의 명품 코스입니다.',
    descriptionJa: '世界最大級のカルデラ・阿蘇山の麓に広がる36ホールNPGA公認コース。大パノラマの絶景の中で爽快なプレーが楽しめます。',
    highlightsKo: ['아소산 국립공원 파노라마 뷰', 'NPGA 공식 인증 36홀 다이내믹 코스', '한국 골퍼들이 극찬하는 이국적 조경'],
    highlightsJa: ['阿蘇山国立公園の大パノラマビュー', 'NPGA公式認証 36ホールダイナミックコース', '異国情緒あふれる大自然レイアウト'],
    outOfTownRatio: 87,
    ratingScore: 4.91,
    globalVisitorCount: 2600,
    petitionVotes: 6900,
  },
  {
    id: 'pilgrim-jp-tokyo-edogawa',
    courseId: 'jp-course-tokyo-edogawa',
    nameKo: '도쿄 에도가와 라인 파크골프장',
    nameJa: '東京 江戸川ライン パークゴルフ場',
    regionKo: '일본 도쿄도 카츠시카구',
    regionJa: '日本 東京都 葛飾区',
    country: 'JP',
    category: 'JAPAN_MASTERPIECE',
    categoryLabelKo: '일본 열도 5대 명품 성지',
    categoryLabelJa: '日本列島 5大名門聖地',
    badgeEmoji: '🗼',
    taglineKo: '일본 수도 도쿄 한복판 에도가와 강변의 대표 랜드마크',
    taglineJa: '日本首都・東京の真ん中、江戸川河川敷の代表ランドマーク',
    historicTitleKo: '도쿄 수도권 랜드마크 (Tokyo Capital Landmark)',
    historicTitleJa: '東京首都圏代表ランドマーク',
    descriptionKo: '도쿄 스카이트리를 조망할 수 있는 에도가와 강변 둔치에 위치한 일본 수도권 파크골프의 관문 구장입니다. 도쿄 도심 관광과 연계하여 양국 골퍼들의 친선 교류가 가장 활발합니다.',
    descriptionJa: '東京スカイツリーを望む江戸川河川敷に位置する首都圏パークゴルフの玄関口です。観光と連動した国際交流の拠点です。',
    highlightsKo: ['도쿄 도심과 스카이트리 조망', '수도권 최대 규모 강변 천연잔디 코스', '한일 비즈니스 및 친선 라운드 관문'],
    highlightsJa: ['東京スカイツリーを望むリバーサイドビュー', '首都圏最大規模の河川敷天然芝コース', '日韓親善交流の主要拠点'],
    outOfTownRatio: 76,
    ratingScore: 4.88,
    globalVisitorCount: 3900,
    petitionVotes: 7200,
  },
  {
    id: 'pilgrim-global-pioneer',
    courseId: 'pioneer-cross-strait',
    nameKo: '현해탄을 건넌 한·일 글로벌 개척자',
    nameJa: '玄界灘を渡った日韓グローバルフロンティア',
    regionKo: '대한민국 ⇄ 일본 전역',
    regionJa: '大韓民国 ⇄ 日本 全域',
    country: 'JP',
    category: 'GLOBAL_PIONEER',
    categoryLabelKo: '글로벌 개척자 특별 훈장',
    categoryLabelJa: 'グローバルフロンティア特別勲章',
    badgeEmoji: '✈️',
    taglineKo: '현해탄을 건너 양국의 파크골프장을 누빈 위대한 개척자 공식 트로피',
    taglineJa: '玄界灘を渡り両国のパークゴルフ場を巡礼した偉大なる開拓者トロフィー',
    historicTitleKo: '한·일 글로벌 개척자 훈장 (Bilateral Pioneer)',
    historicTitleJa: '日韓グローバルフロンティア勲章',
    descriptionKo: '대한민국과 일본의 국경을 넘어 상대국의 공식 파크골프장에서 1회 이상 라운드를 완주한 골퍼에게 수여되는 최고 권위의 양국 친선 훈장입니다. 양국 협회 및 파크골프 올인원 공식 인증서가 함께 발급됩니다.',
    descriptionJa: '国境を越えて相手国の公式パークゴルフ場で1回以上ラウンドを完走したゴルファーに授与される最高権威の親善勲章です。両国親善の象徴として公式認証証書が授与されます。',
    highlightsKo: ['해외 원정 공식 라운드 1회 완주 시 자동 영구 수여', '한일 글로벌 민간 외교관 공인 지위 부여', '황금 모바일 개척자 완주 인증서 평생 보존'],
    highlightsJa: ['海外遠征公式ラウンド1回完走で自動永久授与', '日韓民間親善大使としての公認ステータス付与', '黄金の開拓者公認証書の永久保存'],
    outOfTownRatio: 100,
    ratingScore: 5.0,
    globalVisitorCount: 9999,
    petitionVotes: 12500,
  },
];

// 성지순례 달성 현황 통계 인터페이스
export interface UserPilgrimageStatus {
  totalHeritageCount: number;
  visitedHeritageCount: number;
  totalKoreaMasterpieceCount: number;
  visitedKoreaMasterpieceCount: number;
  totalJapanMasterpieceCount: number;
  visitedJapanMasterpieceCount: number;
  hasGlobalPioneer: boolean; // 해외 1회 완주 달성 여부
  hasHeritageGrandSlam: boolean; // 역사 4대 성지 전수 완주
  hasKoreaGrandSlam: boolean; // 한국 5대 명품 성지 전수 완주
  hasJapanGrandSlam: boolean; // 일본 5대 명품 성지 전수 완주
  hasAsiaLegend: boolean; // 한일 10대 성지 전수 제패
  visitedCourseIds: string[];
}

export const PilgrimageStorage = {
  // 사용자의 완주 라운드 목록을 분석하여 성지순례 달성 통계 반환
  getUserStatus(completedRounds: RoundSession[]): UserPilgrimageStatus {
    const visitedCourseIds = new Set<string>();

    completedRounds.forEach((r) => {
      if (r.courseId) visitedCourseIds.add(r.courseId);
      // 코스 이름 매칭 백업
      if (r.courseName) {
        if (r.courseName.includes('동락')) visitedCourseIds.add('course-gumi-dongrak');
        if (r.courseName.includes('화천') || r.courseName.includes('산천어')) visitedCourseIds.add('course-hwacheon-sancheoneo');
        if (r.courseName.includes('양평') || r.courseName.includes('강상')) visitedCourseIds.add('course-yangpyeong-gangsang');
        if (r.courseName.includes('밀양') || r.courseName.includes('아리랑')) visitedCourseIds.add('course-miryang-arirang');
        if (r.courseName.includes('강창학') || r.courseName.includes('회천')) visitedCourseIds.add('course-jeju-gangchanghak');
        if (r.courseName.includes('상락원') || r.courseName.includes('진주')) visitedCourseIds.add('course-jinju-sangnakwon');
        if (r.courseName.includes('여의도')) visitedCourseIds.add('course-seoul-yeouido');
        if (r.courseName.includes('まくべつ') || r.courseName.includes('幕別') || r.courseName.includes('마쿠베츠')) visitedCourseIds.add('jp-course-makubetsu-tsutsujigaoka');
        if (r.courseName.includes('エルク') || r.courseName.includes('엘크') || r.courseName.includes('札幌')) visitedCourseIds.add('jp-course-sapporo-elk');
        if (r.courseName.includes('嘉瀬川') || r.courseName.includes('가세가와') || r.courseName.includes('佐賀')) visitedCourseIds.add('jp-course-saga-kasegawa');
        if (r.courseName.includes('CHOYOU') || r.courseName.includes('초요') || r.courseName.includes('阿蘇')) visitedCourseIds.add('jp-course-kumamoto-choyou');
        if (r.courseName.includes('江戸川') || r.courseName.includes('에도가와')) visitedCourseIds.add('jp-course-tokyo-edogawa');
      }
    });

    const isVisited = (c: PilgrimageCourse) => visitedCourseIds.has(c.courseId);

    const heritageList = PILGRIMAGE_COURSES.filter((c) => c.category === 'HERITAGE');
    const krList = PILGRIMAGE_COURSES.filter((c) => c.category === 'KOREA_MASTERPIECE');
    const jpList = PILGRIMAGE_COURSES.filter((c) => c.category === 'JAPAN_MASTERPIECE');

    const visitedHeritage = heritageList.filter(isVisited).length;
    const visitedKr = krList.filter(isVisited).length;
    const visitedJp = jpList.filter(isVisited).length;

    // 해외 구장 1곳이라도 방문했는지 (한국 사용자가 일본 구장, 또는 일본 사용자가 한국 구장)
    const hasJpVisit = completedRounds.some((r) => r.courseId?.startsWith('jp-') || r.courseName?.includes('幕別') || r.courseName?.includes('北海道') || r.courseName?.includes('日本'));
    const hasKrVisit = completedRounds.some((r) => !r.courseId?.startsWith('jp-') && r.courseName && !r.courseName.includes('日本'));
    const hasGlobalPioneer = hasJpVisit && hasKrVisit;

    return {
      totalHeritageCount: heritageList.length,
      visitedHeritageCount: visitedHeritage,
      totalKoreaMasterpieceCount: krList.length,
      visitedKoreaMasterpieceCount: visitedKr,
      totalJapanMasterpieceCount: jpList.length,
      visitedJapanMasterpieceCount: visitedJp,
      hasGlobalPioneer: hasGlobalPioneer || hasJpVisit,
      hasHeritageGrandSlam: visitedHeritage >= heritageList.length,
      hasKoreaGrandSlam: visitedKr >= krList.length,
      hasJapanGrandSlam: visitedJp >= jpList.length,
      hasAsiaLegend: visitedKr >= krList.length && visitedJp >= jpList.length,
      visitedCourseIds: Array.from(visitedCourseIds),
    };
  },

  // 특정 성지 구장에 대한 나의 연대기 실측 기록 조회
  getUserCourseRecord(courseId: string, completedRounds: RoundSession[]) {
    if (courseId === 'pioneer-cross-strait') {
      const hasJpVisit = completedRounds.some((r) => r.courseId?.startsWith('jp-') || r.courseName?.includes('幕別') || r.courseName?.includes('北海道') || r.courseName?.includes('日本'));
      const hasKrVisit = completedRounds.some((r) => !r.courseId?.startsWith('jp-') && r.courseName && !r.courseName.includes('日本'));
      const isPioneer = hasJpVisit && (hasKrVisit || completedRounds.length > 0);
      const foreignRounds = completedRounds.filter((r) => r.courseId?.startsWith('jp-') || r.courseName?.includes('幕別') || r.courseName?.includes('北海道') || r.courseName?.includes('日本'));
      return {
        isVisited: isPioneer,
        roundCount: foreignRounds.length,
        bestScore: null as number | null,
        firstDate: foreignRounds[0]?.completedAt || null,
        lastDate: foreignRounds[foreignRounds.length - 1]?.completedAt || null,
      };
    }

    const matched = completedRounds.filter((r) => {
      if (r.courseId === courseId) return true;
      if (courseId === 'course-gumi-dongrak' && r.courseName?.includes('동락')) return true;
      if (courseId === 'course-hwacheon-sancheoneo' && (r.courseName?.includes('화천') || r.courseName?.includes('산천어'))) return true;
      if (courseId === 'course-yangpyeong-gangsang' && (r.courseName?.includes('양평') || r.courseName?.includes('강상'))) return true;
      if (courseId === 'course-miryang-arirang' && (r.courseName?.includes('밀양') || r.courseName?.includes('아리랑'))) return true;
      if (courseId === 'course-jeju-gangchanghak' && (r.courseName?.includes('강창학') || r.courseName?.includes('회천'))) return true;
      if (courseId === 'course-jinju-sangnakwon' && (r.courseName?.includes('상락원') || r.courseName?.includes('진주'))) return true;
      if (courseId === 'course-seoul-yeouido' && r.courseName?.includes('여의도')) return true;
      if (courseId === 'jp-course-makubetsu-tsutsujigaoka' && (r.courseName?.includes('まくべつ') || r.courseName?.includes('幕別') || r.courseName?.includes('마쿠베츠'))) return true;
      if (courseId === 'jp-course-sapporo-elk' && (r.courseName?.includes('エルク') || r.courseName?.includes('엘크') || r.courseName?.includes('札幌'))) return true;
      if (courseId === 'jp-course-saga-kasegawa' && (r.courseName?.includes('嘉瀬川') || r.courseName?.includes('가세가와'))) return true;
      if (courseId === 'jp-course-kumamoto-choyou' && (r.courseName?.includes('CHOYOU') || r.courseName?.includes('초요'))) return true;
      if (courseId === 'jp-course-tokyo-edogawa' && (r.courseName?.includes('江戸川') || r.courseName?.includes('에도가와'))) return true;
      return false;
    });

    if (matched.length === 0) {
      return {
        isVisited: false,
        roundCount: 0,
        bestScore: null as number | null,
        firstDate: null as string | null,
        lastDate: null as string | null,
      };
    }

    const scores: number[] = [];
    matched.forEach((r) => {
      const p = r.players.find((pl) => pl.isSelf || pl.isLeader);
      if (p && p.totalStrokes > 0) scores.push(p.totalStrokes);
    });

    const dates = matched
      .map((r) => r.completedAt || r.startedAt)
      .filter(Boolean)
      .sort();

    return {
      isVisited: true,
      roundCount: matched.length,
      bestScore: scores.length > 0 ? Math.min(...scores) : null,
      firstDate: dates[0] || null,
      lastDate: dates[dates.length - 1] || null,
    };
  },
};
