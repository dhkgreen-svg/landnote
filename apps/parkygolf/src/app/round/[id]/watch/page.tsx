'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { RoundWatchView } from '@/components/RoundWatchView';

export default function RoundWatchPage() {
  const params = useParams();
  const router = useRouter();
  const roundId = params?.id as string;

  if (!roundId) {
    return (
      <div className="w-full h-screen bg-black text-white flex items-center justify-center p-4 text-center">
        <p className="text-xs text-stone-400 font-bold">라운드 세션 정보가 없습니다.</p>
      </div>
    );
  }

  return (
    <main className="w-full h-screen bg-black overflow-hidden select-none">
      <RoundWatchView
        roundId={roundId}
        onExit={() => {
          router.push(`/round/${roundId}`);
        }}
      />
    </main>
  );
}
