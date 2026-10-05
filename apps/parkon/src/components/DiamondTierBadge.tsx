'use client';

import React from 'react';
import { UserDiamondTier } from '../lib/courseBlockTier';

interface DiamondTierBadgeProps {
  tier: UserDiamondTier;
  completedCount?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showCount?: boolean;
  className?: string;
  enableAura?: boolean;
}

export const DiamondTierBadge: React.FC<DiamondTierBadgeProps> = ({
  tier,
  completedCount,
  size = 'sm',
  showLabel = true,
  showCount = false,
  className = '',
  enableAura = true,
}) => {
  const isHighTier = ['BLUE_DIA', 'PINK_DIA', 'BLACK_DIA', 'GOLDEN_HALL'].includes(tier.code);

  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  const iconSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-black border tracking-tight shadow-2xs transition-all select-none relative ${sizeClasses} ${tier.bgGradient ? `bg-gradient-to-r ${tier.bgGradient}` : 'bg-stone-100'} ${tier.borderClass} ${tier.textColor} ${
        isHighTier && enableAura ? 'hover:scale-105 active:scale-95' : ''
      } ${className}`}
      title={`${tier.nameKo} (누적 9홀 완주: ${completedCount ?? tier.minCompleted}회)`}
    >
      {/* 🌟 상위 티어 다이아몬드 은은한 외곽 오라/글로우 효과 */}
      {isHighTier && enableAura && (
        <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-amber-400 via-pink-400 to-sky-400 opacity-30 blur-xs -z-10 animate-pulse pointer-events-none" />
      )}

      {/* 원석 아이콘 */}
      <span className={`${iconSizes} leading-none drop-shadow-xs`}>{tier.icon}</span>

      {/* 티어 텍스트 라벨 */}
      {showLabel && <span>{tier.badgeLabel}</span>}

      {/* 누적 완주 횟수 (옵션) */}
      {showCount && completedCount !== undefined && (
        <span className="opacity-80 font-bold ml-0.5">({completedCount}회)</span>
      )}
    </span>
  );
};
