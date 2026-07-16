'use client';

import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

interface QrEntry {
  url: string;
  label: string;
  category: string | null;
}

function QrCard({ entry, index }: { entry: QrEntry; index: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, entry.url, {
      width: 240,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(() => {
      setDataUrl(canvasRef.current!.toDataURL('image/png'));
    });
  }, [entry.url]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    const suffix = entry.category ?? 'all';
    link.download = `landnote-qr-${suffix}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{entry.label}</CardTitle>
        <p className="text-xs text-muted-foreground">{entry.category ? `${entry.label} 전용 홍보용` : '범용 접수용'}</p>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <canvas ref={canvasRef} className="rounded-lg border" />
        <div className="flex w-full gap-2">
          <Input value={entry.url} readOnly className="text-xs" />
          <Button variant="outline" size="sm" onClick={handleCopy} className="shrink-0">
            {copied ? '복사됨' : '복사'}
          </Button>
        </div>
        <Button size="sm" variant="outline" onClick={handleDownload} className="w-full">
          다운로드
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LinksPage() {
  const [qrEntries, setQrEntries] = useState<QrEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const entries = await apiFetch<QrEntry[]>('/agents/me/qr');
        setQrEntries(entries);
      } catch {
        // 에러 시 빈 상태 유지
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (qrEntries.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">QR 코드를 생성할 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">접수 링크 / QR코드</h1>

      <p className="mb-4 text-sm text-muted-foreground">
        {qrEntries.length === 1
          ? '범용 접수용으로 명함과 사무실에 함께 사용할 수 있습니다'
          : '기본 범용 QR과 함께, 분야별 홍보에 바로 사용할 수 있는 전용 QR이 제공됩니다'}
      </p>

      <div className={`grid gap-4 ${qrEntries.length > 1 ? 'sm:grid-cols-2' : 'max-w-sm mx-auto'}`}>
        {qrEntries.map((entry, i) => (
          <QrCard key={entry.category ?? 'all'} entry={entry} index={i} />
        ))}
      </div>
    </div>
  );
}
