import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface LocalRuleBannerProps {
  hole: number;
  localRule?: string;
}

// 과거에 자동 생성되었던 더미/가짜 로컬룰 필터 목록 (실제 코스 마스터 등록 규칙만 표시)
const DUMMY_LOCAL_RULES = [
  '홀컵 20cm 이내 퍼팅 시 컨시드 가능',
  '좌측 안전망 넘어가면 OB 처리 (2벌타)',
  '안전망 준수',
  '컨시드 가능',
];

function localizeLocalRule(rule: string, isJapanese: boolean): string {
  if (!isJapanese) return rule;

  const exactMap: Record<string, string> = {
    '좌측 안전망 OB 주의': '左側 安全ネット OB 注意',
    '우측 러프 주의': '右側 ラフ 注意',
    '페어웨이 중앙 티샷': 'フェアウェイ中央 ティーショット',
    '우측 벙커 주의': '右側 バンカー 注意',
    '동락 최장 롱홀, 3온 전략': '同楽 最長ロングホール (3オン戦略)',
    '좌측 OB 라인 주의': '左側 OBライン 注意',
    '우측 둔치 조심': '右側 法面に注意',
    '2온 시도 가능한 미들 롱홀': '2オン狙い可能なミドル・ロングホール',
    '배수구 1클럽 무벌 구제': '排水口 1クラブ無罰救済',
    '언덕 오르막 경사': '上り坂の傾斜に注意',
    '긴 미들홀, 강한 롱퍼팅 요구': 'ロングミドルホール (強めのロングパット推奨)',
    '공인 최대 150m 롱홀': '公認最大 150m ロングホール',
    '중앙 티샷 안전': '中央ティーショットが安全',
    '우 도그레그 홀': '右ドッグレッグホール',
    '1번 홀부터 롱홀 시작': '1番ホールからロングホール開始',
    '안전망 2벌타 주의': '安全ネット 2罰打 注意',
    '좌측 페어웨이 유지': '左側 フェアウェイキープ',
    '최종 36홀 피날레 롱홀': '最終36ホール フィナーレロングホール',
    '금호강 둔치 좌측 바람 주의': '琴湖江 堤防左側の風に注意',
    '수성구장 피날레 140m 롱홀': '寿城コース フィナーレ 140m ロングホール',
  };

  if (exactMap[rule.trim()]) {
    return exactMap[rule.trim()];
  }

  let res = rule;
  res = res.replace(/좌측/g, '左側');
  res = res.replace(/우측/g, '右側');
  res = res.replace(/안전망/g, '安全ネット');
  res = res.replace(/주의/g, '注意');
  res = res.replace(/조심/g, '注意');
  res = res.replace(/벙커/g, 'バンカー');
  res = res.replace(/러프/g, 'ラフ');
  res = res.replace(/페어웨이/g, 'フェアウェイ');
  res = res.replace(/티샷/g, 'ティーショット');
  res = res.replace(/롱홀/g, 'ロングホール');
  res = res.replace(/미들홀/g, 'ミドルホール');
  res = res.replace(/숏홀/g, 'ショートホール');
  res = res.replace(/무벌 구제/g, '無罰救済');
  res = res.replace(/경사/g, '傾斜');
  res = res.replace(/내리막/g, '下り');
  res = res.replace(/오르막/g, '上り');
  res = res.replace(/도그레그/g, 'ドッグレッグ');
  res = res.replace(/바람/g, '風');
  res = res.replace(/피날레/g, 'フィナーレ');
  res = res.replace(/홀/g, 'H');
  return res;
}

export function LocalRuleBanner({ hole, localRule }: LocalRuleBannerProps) {
  const { isJapanese } = useTranslation();
  if (!localRule || typeof localRule !== 'string' || !localRule.trim()) return null;

  const clean = localRule.trim();

  // 더미 로컬룰이거나 컨시드 문구는 노출 차단
  if (DUMMY_LOCAL_RULES.some((dummy) => clean.includes(dummy))) {
    return null;
  }

  const localizedText = localizeLocalRule(clean, isJapanese);

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-950 px-2.5 py-1.5 rounded-r-lg shadow-sm flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <div className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
          <span>{isJapanese ? `${hole}番ホール ローカルルール` : `${hole}번 홀 로컬룰`}</span>
        </div>
        <p className="text-xs font-semibold text-amber-950 mt-0.5 leading-snug break-keep">
          {localizedText}
        </p>
      </div>
    </div>
  );
}
