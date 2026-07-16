'use client';

import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePush } from '@/lib/hooks/use-push';

export function PushPrompt() {
  const { permission, subscribe } = usePush();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // permission이 default이고 이전에 닫지 않았을 때만 표시
    const wasDismissed = localStorage.getItem('push-prompt-dismissed');
    setDismissed(permission !== 'default' || wasDismissed === 'true');
  }, [permission]);

  if (dismissed) return null;

  const handleAllow = async () => {
    await subscribe();
    setDismissed(true);
  };

  const handleClose = () => {
    localStorage.setItem('push-prompt-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="mx-4 mt-3 flex items-center gap-3 rounded-lg border bg-blue-50 p-3 lg:mx-6">
      <Bell className="h-5 w-5 shrink-0 text-blue-600" />
      <p className="flex-1 text-sm text-blue-800">
        새 문의 알림을 받으시겠습니까?
      </p>
      <Button size="sm" onClick={handleAllow}>
        알림 허용
      </Button>
      <button
        onClick={handleClose}
        className="shrink-0 text-blue-400 hover:text-blue-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
