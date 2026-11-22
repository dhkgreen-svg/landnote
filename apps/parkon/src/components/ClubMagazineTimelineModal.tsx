'use client';

import React, { useMemo, useState } from 'react';
import { BookOpen, Check, Copy, Download, Image as ImageIcon, Trophy, X } from 'lucide-react';
import { ClubChronicleTournament, ParkGolfClub } from '@/types/club';
import { useBackHandler } from '@/lib/backNavigation';

interface ClubMagazineTimelineModalProps {
  isOpen: boolean;
  club: ParkGolfClub | null;
  chronicles: ClubChronicleTournament[];
  onClose: () => void;
  onOpenManageChronicle?: (chronicle: ClubChronicleTournament) => void;
  onShowToast?: (msg: string) => void;
}

export function ClubMagazineTimelineModal({
  isOpen,
  club,
  chronicles,
  onClose,
  onOpenManageChronicle,
  onShowToast,
}: ClubMagazineTimelineModalProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [timelinePngUrl, setTimelinePngUrl] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useBackHandler(Boolean(isOpen && club), onClose);
  useBackHandler(Boolean(isOpen && timelinePngUrl), () => setTimelinePngUrl(null));

  const sortedChronicles = useMemo(
    () => [...(chronicles || [])].sort((a, b) => (b.heldAt || '').localeCompare(a.heldAt || '')),
    [chronicles]
  );

  const totalPhotosCount = useMemo(
    () =>
      sortedChronicles.reduce(
        (sum, c) => sum + (c.eventPhotos?.length || (c.groupPhotoUrl ? 1 : 0)),
        0
      ),
    [sortedChronicles]
  );

  if (!isOpen || !club) return null;

  const handleCopyTimelineMagazine = async () => {
    const lines: string[] = [];
    lines.push(`📰 [PARKY CLUB MAGAZINE] ${club.name} 공식 행사 타임라인 리포트`);
    lines.push(`🏛️ 총 ${sortedChronicles.length}회 행사 · 📸 현장 사진 ${totalPhotosCount}장`);
    lines.push('');
    sortedChronicles.slice(0, 15).forEach((ch, idx) => {
      lines.push(`📌 ${idx + 1}. [${ch.heldAt}] ${ch.title}`);
      lines.push(
        `   📍 ${ch.courseName} · 🏌️ ${ch.totalParticipants}명 · 👑 우승 ${ch.winnerName}${
          ch.winnerScore > 0 ? ` (${ch.winnerScore}타)` : ''
        }`
      );
      if (ch.magazineStory || ch.notes) {
        lines.push(`   ✍️ ${(ch.magazineStory || ch.notes || '').slice(0, 80)}`);
      }
      if (ch.accountingItems && ch.accountingItems.length > 0) {
        const inc = ch.accountingItems.filter((a) => a.type === 'INCOME').reduce((s, a) => s + a.amount, 0);
        const exp = ch.accountingItems.filter((a) => a.type === 'EXPENSE').reduce((s, a) => s + a.amount, 0);
        lines.push(`   💰 회계: 수입 +${inc.toLocaleString()}원 / 지출 -${exp.toLocaleString()}원 / 잔액 ${(inc - exp).toLocaleString()}원`);
      }
    });
    lines.push('\n✨ 파키 앱 (PARKY APP) 클럽 매거진 리포트');
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedAll(true);
      onShowToast?.('📋 클럽 타임라인 매거진 리포트가 복사되었습니다!');
      setTimeout(() => setCopiedAll(false), 2500);
    } catch {}
  };

  const handleExportTimelinePng = async () => {
    setIsExporting(true);
    try {
      const items = sortedChronicles.slice(0, 6);
      const canvas = document.createElement('canvas');
      const W = 1080;
      const H = Math.max(1200, 320 + items.length * 220 + 100);
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.fillStyle = '#faf8f3';
      ctx.fillRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, W, 240);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(1, '#115e59');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, 240);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fde047';
      ctx.font = '900 24px sans-serif';
      ctx.fillText('PARKY CLUB MAGAZINE · TIMELINE EDITION', W / 2, 68);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 48px sans-serif';
      ctx.fillText(`${club.name} 행사 타임라인`, W / 2, 138);

      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`총 ${sortedChronicles.length}회 공식 기록   |   📸 현장 사진 ${totalPhotosCount}장 수록`, W / 2, 194);

      let y = 278;
      for (const ch of items) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(52, y, W - 104, 194, 22);
        ctx.fill();
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 2;
        ctx.stroke();

        const coverUrl = ch.eventPhotos?.[0]?.url || ch.groupPhotoUrl;
        let textX = 82;
        if (coverUrl) {
          try {
            const img = await new Promise<HTMLImageElement>((resolve, reject) => {
              const im = new Image();
              im.onload = () => resolve(im);
              im.onerror = reject;
              im.src = coverUrl;
            });
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(72, y + 20, 210, 154, 14);
            ctx.clip();
            const sc = Math.max(210 / img.width, 154 / img.height);
            ctx.drawImage(
              img,
              72 + (210 - img.width * sc) / 2,
              y + 20 + (154 - img.height * sc) / 2,
              img.width * sc,
              img.height * sc
            );
            ctx.restore();
            textX = 304;
          } catch {}
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#047857';
        ctx.font = '900 20px sans-serif';
        ctx.fillText(`📅 ${ch.heldAt}  ·  📍 ${ch.courseName}`, textX, y + 48);

        ctx.fillStyle = '#1c1917';
        ctx.font = '900 28px sans-serif';
        ctx.fillText(ch.title.slice(0, 26), textX, y + 90);

        ctx.fillStyle = '#b45309';
        ctx.font = '900 22px sans-serif';
        ctx.fillText(
          `👑 우승 ${ch.winnerName}${ch.winnerScore > 0 ? ` (${ch.winnerScore}타)` : ''}  ·  참가 ${ch.totalParticipants}명`,
          textX,
          y + 130
        );

        const snippet = (ch.magazineStory || ch.notes || '').slice(0, 36);
        if (snippet) {
          ctx.fillStyle = '#57534e';
          ctx.font = 'bold 19px sans-serif';
          ctx.fillText(snippet, textX, y + 168);
        }

        y += 216;
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('파키 앱 (PARKY APP) · 스마트 파크골프 클럽 공식 매거진', W / 2, H - 34);

      setTimelinePngUrl(canvas.toDataURL('image/png'));
      onShowToast?.('📰 전체 타임라인 매거진 이미지가 생성되었습니다!');
    } catch (e) {
      console.error('Timeline magazine export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      data-testid="club-magazine-timeline-modal"
      className="fixed inset-0 z-[97] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      <div className="bg-[#faf8f3] w-full max-w-2xl max-h-[94vh] rounded-3xl shadow-2xl border-2 border-amber-400 overflow-hidden flex flex-col">
        {/* Magazine Cover Masthead */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <div className="text-[10px] font-black tracking-[0.2em] text-amber-300 uppercase">
              PARKY CLUB MAGAZINE · TIMELINE REPORT
            </div>
            <h3 className="font-black text-base sm:text-lg truncate">
              📰 {club.name} 행사 타임라인 매거진
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary & Export Bar */}
        <div className="px-3.5 py-2.5 bg-white border-b border-stone-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
          <div className="text-xs font-black text-stone-700">
            총 <span className="text-emerald-800">{sortedChronicles.length}회</span> 행사 · 📸 사진{' '}
            <span className="text-amber-700">{totalPhotosCount}장</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              data-testid="btn-export-timeline-magazine-png"
              disabled={isExporting || sortedChronicles.length === 0}
              onClick={handleExportTimelinePng}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-300" />
              <span>{isExporting ? '생성 중...' : '매거진 이미지 저장'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyTimelineMagazine}
              className="px-2.5 py-1.5 bg-[#FEE500] hover:bg-[#FDD835] text-stone-950 rounded-lg text-[11px] font-black border border-[#E6CF00] flex items-center gap-1 cursor-pointer"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedAll ? '복사됨' : '카톡 공유 복사'}</span>
            </button>
          </div>
        </div>

        {/* Editorial Timeline Feed */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 overscroll-contain">
          {sortedChronicles.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BookOpen className="w-10 h-10 text-stone-300 mx-auto" />
              <p className="text-sm font-black text-stone-600">등록된 행사 연대기 기록이 아직 없습니다.</p>
              <p className="text-xs text-stone-400 font-bold">
                스코어카드 채점을 마치면 자동으로 타임라인 매거진에 기록됩니다.
              </p>
            </div>
          ) : (
            sortedChronicles.map((ch, idx) => {
              const photos =
                ch.eventPhotos && ch.eventPhotos.length > 0
                  ? ch.eventPhotos
                  : ch.groupPhotoUrl
                  ? [{ id: 'g0', url: ch.groupPhotoUrl, caption: '단체사진' }]
                  : [];
              const acc = ch.accountingItems || [];
              const inc = acc.filter((a) => a.type === 'INCOME').reduce((s, a) => s + a.amount, 0);
              const exp = acc.filter((a) => a.type === 'EXPENSE').reduce((s, a) => s + a.amount, 0);

              return (
                <article
                  key={ch.id}
                  data-testid={`magazine-article-${ch.id}`}
                  className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden"
                >
                  {/* Article Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-stone-900 via-emerald-950 to-stone-900 text-white flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[10px] font-black text-amber-300">
                        ISSUE #{sortedChronicles.length - idx} · 📅 {ch.heldAt} · 📍 {ch.courseName}
                      </div>
                      <h4 className="font-black text-sm sm:text-base truncate mt-0.5">{ch.title}</h4>
                    </div>
                    {onOpenManageChronicle && (
                      <button
                        type="button"
                        onClick={() => onOpenManageChronicle(ch)}
                        className="px-2.5 py-1 bg-white/15 hover:bg-white/25 text-white rounded-lg text-[11px] font-black shrink-0 cursor-pointer"
                      >
                        ⚙️ 관리
                      </button>
                    )}
                  </div>

                  {/* Attached Event Photos */}
                  {photos.length > 0 && (
                    <div className="p-3 pb-1 space-y-2">
                      <div className="rounded-2xl overflow-hidden border border-stone-200 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photos[0].url} alt={ch.title} className="w-full max-h-56 object-cover" />
                        {photos[0].caption && (
                          <div className="px-3 py-1 bg-black/65 text-white text-[11px] font-bold">
                            📸 {photos[0].caption}
                          </div>
                        )}
                      </div>
                      {photos.length > 1 && (
                        <div className="grid grid-cols-3 gap-1.5">
                          {photos.slice(1, 4).map((ph) => (
                            <div key={ph.id} className="rounded-xl overflow-hidden border border-stone-200">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={ph.url} alt="" className="w-full h-20 object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Editorial Content */}
                  <div className="p-4 space-y-2.5">
                    {(ch.magazineStory || ch.notes) && (
                      <p className="text-xs text-stone-700 font-medium leading-relaxed whitespace-pre-line">
                        {ch.magazineStory || ch.notes}
                      </p>
                    )}

                    {/* Winner Strip */}
                    <div className="flex items-center gap-2 flex-wrap p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="font-black text-emerald-950">
                        우승 {ch.winnerName}
                        {ch.winnerScore > 0 ? ` (${ch.winnerScore}타)` : ''}
                      </span>
                      {ch.runnerUpName && (
                        <span className="text-stone-600 font-bold">
                          · 2위 {ch.runnerUpName}
                          {ch.runnerUpScore ? ` (${ch.runnerUpScore}타)` : ''}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] font-bold text-stone-500">
                        🏌️ {ch.totalParticipants}명
                      </span>
                    </div>

                    {/* Accounting Strip */}
                    {acc.length > 0 && (
                      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-black">
                        <span className="text-amber-950">💰 행사 정산</span>
                        <span className="text-emerald-800">수입 +{inc.toLocaleString()}원</span>
                        <span className="text-rose-700">지출 -{exp.toLocaleString()}원</span>
                        <span className="text-stone-900">잔액 {(inc - exp).toLocaleString()}원</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      {/* Exported PNG Preview */}
      {timelinePngUrl && (
        <div
          data-testid="timeline-magazine-png-modal"
          className="fixed inset-0 z-[115] bg-black/85 flex items-center justify-center p-3"
        >
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400 flex flex-col max-h-[92vh]">
            <div className="px-4 py-3 bg-emerald-900 text-white flex items-center justify-between">
              <span className="font-black text-sm">📰 클럽 타임라인 매거진 이미지</span>
              <button
                type="button"
                onClick={() => setTimelinePngUrl(null)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={timelinePngUrl} alt="타임라인 매거진" className="w-full rounded-xl shadow-md" />
            </div>
            <div className="p-3 bg-white border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = timelinePngUrl;
                  a.download = `${club.name}_타임라인매거진.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex-1 py-3 bg-emerald-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PNG 이미지 저장</span>
              </button>
              <button
                type="button"
                onClick={() => setTimelinePngUrl(null)}
                className="px-4 py-3 bg-stone-200 text-stone-800 font-black text-xs rounded-xl cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
