'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
    reset();
    window.location.href = '/';
  };

  return (
    <html lang="ko">
      <body>
        <div style={{ padding: '2rem', fontFamily: 'system-ui', maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ color: '#dc2626' }}>오류가 발생했습니다</h2>
          <p style={{ color: '#666' }}>앱 데이터에 오류가 발생했습니다. 초기화 후 다시 시도해주세요.</p>
          <div style={{ background: '#f5f5f5', padding: '1rem', borderRadius: 8, fontSize: 12, overflow: 'auto', marginBottom: '1rem', maxHeight: 200 }}>
            {error.message || String(error)}
          </div>
          <button
            onClick={handleReset}
            style={{ background: '#2563eb', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 6, border: 'none', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
          >
            초기화하고 처음으로 가기
          </button>
        </div>
      </body>
    </html>
  );
}
