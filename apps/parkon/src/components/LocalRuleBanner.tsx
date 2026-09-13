import React from 'react';
import { AlertTriangle } from 'lucide-react';

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

export function LocalRuleBanner({ hole, localRule }: LocalRuleBannerProps) {
  if (!localRule || typeof localRule !== 'string' || !localRule.trim()) return null;

  const clean = localRule.trim();

  // 더미 로컬룰이거나 컨시드 문구는 노출 차단
  if (DUMMY_LOCAL_RULES.some((dummy) => clean.includes(dummy))) {
    return null;
  }

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 text-amber-950 px-2.5 py-1.5 rounded-r-lg shadow-sm flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div>
        <div className="text-[10px] font-bold text-amber-800 flex items-center gap-1">
          <span>⚠️ {hole}번 홀 로컬룰</span>
        </div>
        <p className="text-xs font-semibold text-amber-950 mt-0.5 leading-snug break-keep">
          {clean}
        </p>
      </div>
    </div>
  );
}
