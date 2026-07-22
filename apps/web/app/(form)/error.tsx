'use client';

import { useEffect } from 'react';
import { useFormStore } from '@/lib/stores/form-store';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[FormError]', error);
  }, [error]);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('landnote-form');
      sessionStorage.clear();
      useFormStore.getState().reset();
    }
    reset();
    window.location.href = '/';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg border border-red-100">
        <h2 className="mb-4 text-xl font-bold text-red-600">오류가 발생했습니다</h2>
        <p className="mb-2 text-sm text-slate-600">
          오래된 데이터로 인해 문제가 발생했을 수 있습니다.<br/>
          아래 버튼을 눌러 데이터를 초기화하고 다시 시도해주세요.
        </p>
        <div className="mb-6 p-3 bg-slate-50 rounded-lg overflow-auto max-h-32 text-xs text-slate-500 font-mono">
          {error.message}
        </div>
        <button
          onClick={handleReset}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          초기화하고 처음으로 가기
        </button>
      </div>
    </div>
  );
}
