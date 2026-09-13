'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ParkOnStorage } from '@/lib/storage';

export default function ActiveRoundRedirect() {
  const router = useRouter();

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
      라운드 확인 중...
    </div>
  );
}
