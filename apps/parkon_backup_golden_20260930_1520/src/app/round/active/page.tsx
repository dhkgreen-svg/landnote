'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParkOnStorage } from '@/lib/storage';

import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ActiveRoundRedirect() {
  const router = useRouter();
  const { isJapanese } = useTranslation();

  useEffect(() => {
    const active = ParkOnStorage.getCurrentRound();
    if (active && active.status === 'IN_PROGRESS') {
      router.replace(`/round/${active.id}`);
    } else {
      router.replace('/round/new');
    }
  }, [router]);

  return (
    <div className="p-8 text-center text-stone-500 font-bold">
      {isJapanese ? 'ラウンド確認中...' : '라운드 확인 중...'}
    </div>
  );
}
