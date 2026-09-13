/**
 * (사)대한파크골프협회 공인 정규 경기 규정집 (Official Korea Park Golf Association Rules)
 * 일반 골프와의 혼동을 완벽히 방지하고 파크골프 공인 규정 100%를 보장하는 규정집 엔진
 */

export interface OfficialRuleArticle {
  article: string;
  category: 'ob' | 'hazard' | 'facility' | 'swing' | 'general';
  title: string;
  verdict: string;
  penalty: string;
  procedure: string;
  voiceAnswer: string;
  keywords: string[];
  officialRuleText?: string;
}

export const OFFICIAL_PARK_GOLF_RULES: OfficialRuleArticle[] = [
  // 1-1. 하얀 말뚝을 지나 그물망(네트)/나무를 맞고 코스 안으로 들어온 공 (협회 제33조 제2항: 최종 정지 위치 기준 무벌 세이프)
  {
    article: '제33조(아웃 오브 바운즈: OB 및 처치) 제2항',
    category: 'ob',
    title: '하얀 말뚝/그물망(네트)을 맞고 코스 안으로 들어온 공',
    verdict: '【세이프(IN)】 벌타 없음 (무벌)',
    penalty: '벌타 없음 (무벌)',
    procedure: '대한파크골프협회 공인 규정 제33조 제2항에 따라, 공이 하얀 OB 말뚝을 지나서 외곽의 그물망(네트, 안전망)이나 나무, 물체를 맞고 튕겨서 최종적으로 코스 안(인플레이 구역)으로 다시 들어와 멈췄다면, 공의 최종 정지 위치가 코스 안이므로 무조건 세이프(무벌)입니다. 마지막에 어떤 형태로든 간에 OB선 밖으로 있지만 않으면 OB가 아닙니다. 멈춘 자리에서 그대로 다음 타를 진행합니다.',
    voiceAnswer: '하얀 말뚝을 지나 그물망이나 바깥을 맞고 다시 코스 안으로 들어와 멈췄다면 벌타 없이 세이프입니다. 마지막 정지 위치가 코스 안이므로 멈춘 자리에서 그대로 치시면 됩니다.',
    officialRuleText: '공이 OB 말뚝 또는 코스 밖의 장애물(안전망, 그물망, 펜스, 수목 등)을 맞고 다시 코스 안(인플레이 구역)으로 들어와 정지한 때에는 인플레이 볼로 본다(무벌).',
    keywords: [
      '그물망 맞고', '네트 맞고', '너트 맞고', '망 맞고', '말뚝 맞고', '말뚝 지나서',
      '말뚝 넘어서', '선을 지나서', '선을 넘어서', '코스 안으로 들어', '안으로 들어', '들어왔'
    ],
  },
  // 1-2. OB 선/말뚝 경계 판정 (선에 걸친 공)
  {
    article: '제33조(아웃 오브 바운즈: OB 및 처치) 제1항',
    category: 'ob',
    title: 'OB(아웃오브바운즈) 선/말뚝 경계 판정',
    verdict: '【세이프(IN)】 벌타 없음 (무벌)',
    penalty: '벌타 없음 (무벌)',
    procedure: '공의 직경 중 단 1mm라도 안쪽 잔디 경계선에 닿아 있거나 걸쳐 있으면 정상 인플레이 볼(세이프)입니다. 공 전체가 흰 선을 완전히 넘어가야만 OB 판정입니다.',
    voiceAnswer: '공의 일부라도 OB 선 안쪽에 닿아 있으면 벌타 없이 세이프입니다. 공의 직경 중 단 1mm라도 걸쳐있으면 정상 플레이 볼입니다.',
    officialRuleText: '공 전체가 OB 선(또는 말뚝을 잇는 가상선)을 완전히 벗어나 정지했을 때 OB로 판정한다. 공의 직경 중 일부라도 코스 경계선 내에 접촉되어 있는 때에는 인플레이 구역의 공(세이프)으로 간주한다.',
    keywords: ['선에 걸쳐', '선에 걸친', '경계선', '말뚝 선상', '선상에', '1mm', '반쯤 걸'],
  },
  {
    article: '제33조(아웃 오브 바운즈: OB 및 처치) 제3항',
    category: 'ob',
    title: 'OB 발생 시 벌타 및 처리 절차 (파크골프 절대원칙: 2벌타, 2클럽)',
    verdict: '【2벌타 가산 후 2클럽 이내 처치】',
    penalty: '2벌타 (파크골프는 1벌타 OB가 절대 없습니다)',
    procedure: '파크골프 규정상 OB는 무조건 2벌타입니다. 티잉그라운드로 돌아가지 않으며, 공이 OB 라인을 최종 통과한 지점에서 홀컵에 가깝지 않게 코스 내로 2클럽 헤드 이내에 공을 놓고 다음 타를 칩니다.',
    voiceAnswer: '파크골프에서 OB는 무조건 2벌타입니다. 티로 돌아가지 않고, OB가 난 지점에서 2클럽 이내 잔디에 놓고 다음 타를 칩니다.',
    officialRuleText: '공이 OB가 되었을 때에는 2벌타를 가산한다. 공이 OB 라인을 최종 통과한 지점을 기점으로 하여, 홀컵에 가깝지 않게 코스 안쪽으로 2클럽 이내에 공을 놓고 다음 타를 진행한다.',
    keywords: ['ob 났', '오비 났', 'ob가 났', '나갔는데', 'ob 처리', 'ob 지역', '흰색 말뚝 밖'],
  },

  // 2. 해저드 관련 공식 규정 (협회 제34조)
  {
    article: '제34조(워터 해저드 및 수리지) 제1항',
    category: 'hazard',
    title: '워터 해저드(연못 / 하천 / 수로) 침수',
    verdict: '【2벌타 가산 후 2클럽 이내 처치】',
    penalty: '2벌타',
    procedure: '공이 물이나 깊은 수로에 빠진 경우 2벌타가 부과됩니다. 공이 해저드 경계를 최종 통과한 지점에서 홀에 가깝지 않게 2클럽 이내 잔디에 공을 놓고 플레이합니다.',
    voiceAnswer: '물이나 해저드에 빠진 경우 2벌타입니다. 빠진 경계 지점에서 2클럽 이내에 공을 놓고 치시면 됩니다.',
    officialRuleText: '공이 워터 해저드에 들어간 때에는 2벌타를 가산하고, 공이 해저드 경계선을 최종 통과한 지점에서 홀에 가깝지 않게 코스 내로 2클럽 이내에 놓고 플레이한다.',
    keywords: ['물에 빠', '연못', '해저드', '개천', '수로에'],
  },
  {
    article: '제34조(워터 해저드 및 수리지) 제2항',
    category: 'hazard',
    title: '캐주얼 워터(일시적 빗물 웅덩이) 및 수리지',
    verdict: '【무벌 구제(1클럽 이내)】',
    penalty: '벌타 없음 (무벌 구제)',
    procedure: '비 온 뒤 일시적으로 고인 물웅덩이나 잔디 보수 구역에 공이 멈추거나 스탠스에 걸리면, 홀에 가깝지 않은 가장 가까운 완전 구제 지점으로부터 1클럽 이내 잔디에 공을 놓고 무벌로 칩니다.',
    voiceAnswer: '일시적인 물웅덩이나 수리지는 벌타가 없습니다. 물을 피하여 홀에 가깝지 않게 1클럽 이내에 공을 놓고 치시면 됩니다.',
    officialRuleText: '캐주얼 워터(일시적으로 고인 물) 또는 수리지 내에 공이 정지하거나 스탠스에 방해가 되는 경우, 홀에 가깝지 않은 구제 지점으로부터 1클럽 이내에 무벌로 공을 놓고 진행한다.',
    keywords: ['물웅덩이', '웅덩이', '수리지', '비 온 뒤', '캐주얼'],
  },
  {
    article: '제38조(벙커 플레이)',
    category: 'hazard',
    title: '벙커 모래 및 클럽 터치 규정',
    verdict: '【단순 어드레스 터치는 무벌 / 모래 누르거나 다듬으면 2벌타】',
    penalty: '고의 라이 개선 시 2벌타 (가벼운 어드레스 터치는 무벌)',
    procedure: '벙커에서 공을 치기 위해 어드레스할 때 클럽 헤드를 모래에 가볍게 대는 것은 허용되나, 모래의 단단함을 테스트하거나 발/클럽으로 모래를 누르고 다듬으면 라이 개선으로 2벌타가 부과됩니다.',
    voiceAnswer: '어드레스 시 모래에 가볍게 대는 것은 괜찮으나, 모래를 누르거나 파헤쳐서 다듬으면 2벌타입니다.',
    officialRuleText: '벙커 안에서 어드레스 시 모래에 클럽 헤드를 가볍게 대는 행위는 허용된다. 단, 모래의 상태를 시험하거나 발 또는 클럽으로 모래를 누르거나 평탄하게 고르는 등 라이를 개선하는 행위는 2벌타를 부과한다.',
    keywords: ['벙커', '모래', '모래에 닿', '모래 바닥'],
  },

  // 3. 장해물 및 시설물 규정 (협회 제35조)
  {
    article: '제35조(장해물) 제1항',
    category: 'facility',
    title: '인공 장해물(배수구, 안전망, 스프링클러, 쇠말뚝, 카트도로)',
    verdict: '【무벌 구제(1클럽 이내 잔디 드롭/플레이스)】',
    penalty: '벌타 없음 (무벌 구제)',
    procedure: '배수구 쇠창살, 안전 그물망, 스프링클러, 아스팔트/보도블록 카트 도로 등 인공 시설물 위에 공이 멈추거나 스윙에 걸리면, 홀에 가깝지 않은 방향으로 1클럽 이내 잔디에 공을 놓고 무벌로 진행합니다.',
    voiceAnswer: '배수구나 안전망, 카트도로는 인공 장해물이므로 벌타 없이 1클럽 이내 잔디에 놓고 치실 수 있습니다.',
    officialRuleText: '움직일 수 없는 인공 장해물(스프링클러, 배수구, 안전망, 고정된 말뚝, 카트도로 등)이 스윙이나 스탠스에 방해를 줄 경우, 홀에 가깝지 않은 방향으로 1클럽 이내에 무벌로 공을 놓고 플레이한다.',
    keywords: ['배수구', '쇠창살', '안전망', '카트도로', '도로 위', '아스팔트', '스프링클러', '철망', '그물망'],
  },
  {
    article: '제35조(장해물) 제2항',
    category: 'facility',
    title: '루스 임페디먼트 (마른 나뭇가지, 낙엽, 돌멩이)',
    verdict: '【자연물 제거 무벌 / 공이 움직이면 1벌타】',
    penalty: '벌타 없음 (단, 치우다 공이 움직이면 1벌타 및 원위치)',
    procedure: '공 주변의 부러진 나뭇가지나 마른 잎, 자갈은 벌타 없이 손으로 치울 수 있습니다. 단, 치우는 도중 공이 건드려져 움직이면 1벌타가 가산되고 공은 원래 자리로 되돌려놓아야 합니다.',
    voiceAnswer: '마른 나뭇가지나 돌멩이는 벌타 없이 치울 수 있습니다. 단, 공이 움직이면 1벌타가 붙으니 조심해서 치우세요.',
    officialRuleText: '고정되지 않은 자연 장애물(낙엽, 떨어진 나뭇가지, 돌멩이 등)은 무벌로 치울 수 있다. 단, 이를 치우는 과정에서 정지된 공을 움직인 때에는 1벌타를 가산하고 원래 위치에 리플레이스한다.',
    keywords: ['나뭇가지', '돌멩이', '낙엽', '마른가지', '치우고'],
  },
  {
    article: '제35조(장해물) 제3항',
    category: 'facility',
    title: '고정된 자연물 훼손 및 라이 개선 금지',
    verdict: '【2벌타 부여】',
    penalty: '2벌타',
    procedure: '살아있는 나무나 식물, 나뭇가지를 꺾거나 발로 밟아 눌러 스윙 공간을 확보하는 행위는 라이 및 스윙 구역 개선 위반으로 2벌타가 부과됩니다. 있는 그대로 플레이해야 합니다.',
    voiceAnswer: '살아있는 나뭇가지를 꺾거나 발로 밟고 치면 라이 개선 위반으로 2벌타입니다.',
    officialRuleText: '플레이어가 공의 상태나 스윙 구역, 플레이 선을 개선하기 위하여 살아있는 수목, 풀, 고정물을 꺾거나 구부리거나 발로 밟아 변형시키는 행위는 2벌타를 부과한다.',
    keywords: ['나무 꺾', '풀 밟', '가지 꺾', '발로 밟'],
  },

  // 4. 스윙 및 타수 규정 (협회 제30조, 제36조, 제37조)
  {
    article: '제30조(스트로크의 정의) 제2항',
    category: 'swing',
    title: '헛스윙 시 타수 계산 규정',
    verdict: '【스윙 의도가 있었다면 1타 가산 / 단순 연습스윙은 무벌】',
    penalty: '1타 가산 (정상 스트로크 1회 인정)',
    procedure: '공을 치려는 의사(다운스윙)를 가지고 스윙을 시작했다면, 공을 맞추지 못하고 바람만 갈랐더라도 1타를 친 것으로 계산합니다. 단순 연습스윙이나 어드레스 풀기는 무벌입니다.',
    voiceAnswer: '공을 치려는 의도로 스윙했다면 맞지 않았어도 1타로 계산합니다. 다음 타수를 이어 치시면 됩니다.',
    officialRuleText: '공을 타격하려는 의사를 가지고 다운스윙을 개시한 행위는 공을 헛맞추거나 맞추지 못하였더라도 1타의 스트로크로 간주한다. 단, 타격 의사가 없는 단순한 연습 스윙은 스트로크로 보지 않는다.',
    keywords: ['헛스윙', '바람만', '못 맞', '스윙했는데 안 맞'],
  },
  {
    article: '제36조(공의 충돌 및 오구) 제1항',
    category: 'swing',
    title: '동반자의 정지된 공을 맞춘 경우 (공 충돌)',
    verdict: '【치는 사람 무벌 / 맞은 동반자 공은 원위치 리플레이스】',
    penalty: '벌타 없음 (무벌)',
    procedure: '내가 친 공이 코스나 그린에 멈춰 있던 동반자의 공을 맞춘 경우, 친 사람에게는 벌타가 없으며 멈춘 자리에 그대로 둡니다. 맞아서 튕겨 나간 동반자의 공은 원래 있던 위치로 다시 옮겨놓아야 합니다.',
    voiceAnswer: '동반자의 공을 맞췄을 때 친 사람에게는 벌타가 없습니다. 맞아서 움직인 동반자 공만 원래 자리로 되돌려 놓으세요.',
    officialRuleText: '인플레이 볼이 코스 내에 정지되어 있는 다른 플레이어의 공을 맞힌 경우, 친 플레이어는 벌타가 없으며 공이 정지한 위치에서 플레이한다. 충돌로 움직인 다른 플레이어의 공은 원래 위치에 리플레이스한다.',
    keywords: ['남의 공 맞', '동반자 공 맞', '다른 사람 공 맞', '상대방 공 맞', '공끼리 부딪'],
  },
  {
    article: '제36조(공의 충돌 및 오구) 제2항',
    category: 'swing',
    title: '오구 플레이 (동반자의 공을 잘못 친 경우)',
    verdict: '【2벌타 가산 후 처치】',
    penalty: '2벌타',
    procedure: '자신의 공이 아닌 동반자의 공을 잘못 쳤다면 오구 플레이로 2벌타가 부과됩니다. 잘못 친 공은 즉시 원래 위치로 되돌려놓고, 자신의 공을 찾아 원래 자리에서 다음 타를 칩니다.',
    voiceAnswer: '남의 공을 잘못 친 오구 플레이는 2벌타입니다. 친 공은 원위치하고 내 공으로 다시 치셔야 합니다.',
    officialRuleText: '자신의 공이 아닌 동반자의 공(오구)을 잘못 스트로크한 플레이어에게는 2벌타를 부과한다. 오구로 스트로크된 공은 즉시 원래 위치로 리플레이스하고, 본인의 공을 확인하여 원래 자리에서 플레이한다.',
    keywords: ['남의 공 쳤', '동반자 공 쳤', '다른 사람 공 쳤', '남의 공을', '오구'],
  },
  {
    article: '제37조(홀아웃) 제2항',
    category: 'swing',
    title: '깃대(깃발)를 맞고 홀컵 밖으로 튕겨 나온 공',
    verdict: '【홀아웃 불인정(무벌), 멈춘 위치에서 다음 타 진행】',
    penalty: '벌타 없음',
    procedure: '파크골프 규정상 깃대는 뽑지 않고 꽂힌 상태로 플레이합니다. 퍼팅한 공이 깃대를 때리고 밖으로 튕겨 나왔다면 홀에 들어간 것이 아니므로 멈춘 위치에서 다음 스트로크를 해야 합니다.',
    voiceAnswer: '깃대를 맞고 밖으로 튕겨 나온 공은 들어간 것이 아닙니다. 벌타 없이 멈춘 곳에서 다음 퍼팅을 하세요.',
    officialRuleText: '공 전체가 홀컵 바닥에 정지하였을 때 홀아웃으로 인정한다. 깃대를 맞고 튕겨 나와 홀컵 밖에 멈춘 공은 홀아웃으로 인정하지 않으며, 정지한 위치에서 무벌로 다음 스트로크를 진행한다.',
    keywords: ['깃대 맞고', '깃발 맞고', '홀컵 맞고 튕겨'],
  },
  {
    article: '제30조(스트로크의 정의) 제4항',
    category: 'swing',
    title: '티샷 전 티에서 공이 저절로 굴러떨어진 경우',
    verdict: '【벌타 없이 다시 티업】',
    penalty: '벌타 없음 (무벌)',
    procedure: '스트로크(다운스윙)를 시작하기 전에 바람이나 클럽 터치 등으로 티에서 공이 떨어졌다면 타수로 인정되지 않으며, 벌타 없이 다시 티 위에 공을 올려놓고 칩니다.',
    voiceAnswer: '스윙 시작 전 공이 떨어진 것은 벌타가 아닙니다. 다시 티에 올려놓고 치시면 됩니다.',
    officialRuleText: '티잉그라운드에서 티업된 공이 스트로크(타격 의사 다운스윙)를 개시하기 전에 바람, 지면 흔들림, 가벼운 어드레스 터치 등으로 떨어진 때에는 스트로크로 보지 아니하며, 무벌로 다시 티업한다.',
    keywords: ['티에서 떨어', '티에서 굴러', '티업'],
  },
];

/**
 * 사용자 질문과 정규 규정집의 핵심 조항을 매칭하는 파크골프 공식 룰 매처
 */
export function matchOfficialParkGolfRule(query: string): OfficialRuleArticle | null {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();

  // ★ 1순위: 하얀 말뚝/그물망(네트)/나무 등을 맞고 최종적으로 코스 안으로 들어온 경우 -> 무조건 세이프(무벌)
  const isReturningToCourse =
    (clean.includes('들어왔') || clean.includes('코스 안') || clean.includes('안으로') || clean.includes('들어와') || clean.includes('들어가')) &&
    (clean.includes('말뚝') || clean.includes('그물') || clean.includes('네트') || clean.includes('너트') || clean.includes('망') || clean.includes('나무') || clean.includes('지나'));

  if (isReturningToCourse) {
    return OFFICIAL_PARK_GOLF_RULES[0]; // 하얀 말뚝/그물망 맞고 코스 안으로 들어온 공 (세이프 무벌)
  }

  // ★ 3순위: 규정집 키워드 정밀 매칭
  for (const rule of OFFICIAL_PARK_GOLF_RULES) {
    for (const kw of rule.keywords) {
      if (clean.includes(kw.toLowerCase())) {
        return rule;
      }
    }
  }

  return null;
}

/**
 * 파크골프 vs 일반 골프 혼동 원천 차단 - 최소 안전 가드 (Safety Guard)
 * AI가 생성한 문맥적 판정을 존중하되, 일반 골프의 오류(1벌타 OB, 티샷 복귀, 골프 클럽 명칭)만 안전하게 정화
 */
export function enforceParkGolfRules(
  question: string,
  verdict: {
    title: string;
    verdict: string;
    penalty: string;
    procedure: string;
    voiceAnswer: string;
    officialArticle?: string;
    officialRuleText?: string;
  }
) {
  let {
    title,
    verdict: v,
    penalty: p,
    procedure: proc,
    voiceAnswer: va,
    officialArticle: oa,
    officialRuleText: ort,
  } = verdict;

  // 안전 가드 1: OB인데 AI가 일반 골프 1벌타 또는 티 복귀를 언급한 경우 -> 2벌타 / 2클럽 처치로 정화
  if (v.includes('OB') || v.includes('오비') || p.includes('OB') || p.includes('오비')) {
    if (p.includes('1벌타') || proc.includes('1벌타') || proc.includes('티잉') || proc.includes('원래 자리') || proc.includes('티샷을 했던')) {
      p = p.replace(/1벌타/g, '2벌타');
      proc = proc.replace(/1벌타/g, '2벌타 (파크골프 규정)');
      proc = proc.replace(/티잉그라운드로 돌아가.*?(합니다|플레이합니다|칩니다)/g, '공이 OB 라인을 최종 통과한 지점에서 코스 내로 2클럽 이내에 공을 놓고 칩니다.');
      va = va.replace(/1벌타/g, '2벌타');
      va = va.replace(/티로 돌아가.*?(합니다|칩니다)/g, 'OB 지점 2클럽 이내에서 칩니다.');
    }
  }

  // 안전 가드 2: 워터 해저드인데 1벌타 언급이 있는 경우 -> 2벌타로 정화
  if (p.includes('1벌타') && (v.includes('해저드') || proc.includes('해저드') || proc.includes('연못') || proc.includes('물에'))) {
    p = '2벌타 (파크골프 규정)';
    proc = proc.replace(/1벌타/g, '2벌타');
    va = va.replace(/1벌타/g, '2벌타');
  }

  // 안전 가드 3: 일반 골프 장비 용어 정화 (아이언, 드라이버, 우드, 웨지 -> 파크골프 클럽)
  proc = proc.replace(/아이언|드라이버|우드|웨지/g, '파크골프 클럽');
  va = va.replace(/아이언|드라이버|우드|웨지/g, '파크골프 클럽');

  // 안전 가드 4: 공식 규정 조항 및 원문 보완 (AI 응답에 없거나 부족할 경우 공인 규정집에서 자동 매핑)
  if (!oa || !ort) {
    const matched = matchOfficialParkGolfRule(question);
    if (matched) {
      if (!oa) oa = matched.article;
      if (!ort) ort = matched.officialRuleText;
    } else {
      if (!oa && (v.includes('OB') || v.includes('오비') || v.includes('세이프'))) {
        oa = '제33조(아웃 오브 바운즈: OB 및 처치)';
        ort = '공 전체가 코스 경계선(OB선)을 벗어나지 않고 코스 안에 최종 정지한 경우에는 세이프이며, 완전히 벗어난 때에는 2벌타를 가산하고 2클럽 이내에서 플레이한다.';
      }
    }
  }

  return {
    title,
    verdict: v,
    penalty: p,
    procedure: proc,
    voiceAnswer: va,
    officialArticle: oa,
    officialRuleText: ort,
  };
}
