'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Camera,
  Check,
  Coins,
  Copy,
  Download,
  Edit3,
  Image as ImageIcon,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import { ClubChronicleTournament, ParkGolfClub } from '@/types/club';
import { ClubStorage } from '@/lib/clubStorage';
import { useBackHandler } from '@/lib/backNavigation';

interface EventPhotoItem {
  id: string;
  url: string;
  caption?: string;
}

interface EventAccountingItem {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  title: string;
  amount: number;
  memo?: string;
}

interface ClubChronicleManageModalProps {
  isOpen: boolean;
  club: ParkGolfClub | null;
  chronicle: ClubChronicleTournament | null;
  initialTab?: 'EDIT' | 'MAGAZINE' | 'DELETE';
  onClose: () => void;
  onOpenScoreEditor?: (chronicle: ClubChronicleTournament) => void;
  onClubUpdated?: (updatedClub: ParkGolfClub) => void;
  onShowToast?: (msg: string) => void;
}

function compressPhotoFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1080;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w >= h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function createSampleEventPhotoSvg(title: string, label: string, bg1: string, bg2: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${bg1}"/><stop offset="100%" stop-color="${bg2}"/></linearGradient></defs>
    <rect width="900" height="560" fill="url(#g)"/>
    <circle cx="760" cy="110" r="70" fill="rgba(253,224,71,0.28)"/>
    <rect x="44" y="380" width="812" height="136" rx="20" fill="rgba(0,0,0,0.45)"/>
    <text x="72" y="432" fill="#fde047" font-family="sans-serif" font-size="24" font-weight="bold">PARKY CLUB MAGAZINE · ${label}</text>
    <text x="72" y="480" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="900">${title}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function ClubChronicleManageModal({
  isOpen,
  club,
  chronicle,
  initialTab = 'EDIT',
  onClose,
  onOpenScoreEditor,
  onClubUpdated,
  onShowToast,
}: ClubChronicleManageModalProps) {
  const [activeTab, setActiveTab] = useState<'EDIT' | 'MAGAZINE' | 'DELETE'>(initialTab);
  const [title, setTitle] = useState('');
  const [heldAt, setHeldAt] = useState('');
  const [courseName, setCourseName] = useState('');
  const [magazineStory, setMagazineStory] = useState('');
  const [eventPhotos, setEventPhotos] = useState<EventPhotoItem[]>([]);
  const [accountingItems, setAccountingItems] = useState<EventAccountingItem[]>([]);
  const [syncToLedger, setSyncToLedger] = useState(true);

  // New accounting row inputs
  const [accType, setAccType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [accTitle, setAccTitle] = useState('');
  const [accAmount, setAccAmount] = useState('');
  const [accMemo, setAccMemo] = useState('');

  // Magazine export & feedback
  const [magazinePngUrl, setMagazinePngUrl] = useState<string | null>(null);
  const [isExportingPng, setIsExportingPng] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [confirmDeleteArmed, setConfirmDeleteArmed] = useState(false);

  const cameraPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen && chronicle) {
      setActiveTab(initialTab);
      setTitle(chronicle.title || '');
      setHeldAt(chronicle.heldAt || new Date().toISOString().split('T')[0]);
      setCourseName(chronicle.courseName || club?.homeCourseName || '');
      setMagazineStory(chronicle.magazineStory || chronicle.notes || '');
      const initialPhotos: EventPhotoItem[] = Array.isArray(chronicle.eventPhotos)
        ? chronicle.eventPhotos
        : chronicle.groupPhotoUrl
        ? [{ id: 'grp_photo_0', url: chronicle.groupPhotoUrl, caption: '단체 기념사진' }]
        : [];
      setEventPhotos(initialPhotos);
      setAccountingItems(Array.isArray(chronicle.accountingItems) ? chronicle.accountingItems : []);
      setAccTitle('');
      setAccAmount('');
      setAccMemo('');
      setMagazinePngUrl(null);
      setConfirmDeleteArmed(false);
    }
  }, [isOpen, chronicle?.id, initialTab]);

  // 3-Layer Back Navigation
  useBackHandler(Boolean(isOpen && club && chronicle), onClose);
  useBackHandler(Boolean(isOpen && magazinePngUrl), () => setMagazinePngUrl(null));

  const accountingSummary = useMemo(() => {
    const income = accountingItems
      .filter((i) => i.type === 'INCOME')
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    const expense = accountingItems
      .filter((i) => i.type === 'EXPENSE')
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return { income, expense, balance: income - expense };
  }, [accountingItems]);

  if (!isOpen || !club || !chronicle) return null;

  const buildUpdatedChronicle = (): ClubChronicleTournament => ({
    ...chronicle,
    title: title.trim() || chronicle.title,
    heldAt: heldAt || chronicle.heldAt,
    courseName: courseName.trim() || chronicle.courseName,
    magazineStory: magazineStory.trim(),
    notes: magazineStory.trim() || chronicle.notes,
    eventPhotos,
    groupPhotoUrl: eventPhotos[0]?.url || chronicle.groupPhotoUrl,
    accountingItems,
  });

  const handleSaveChanges = (switchToMagazine = false) => {
    const nextChronicle = buildUpdatedChronicle();
    const updatedClub = ClubStorage.updateClubChronicle(club.id, nextChronicle, syncToLedger);
    if (updatedClub && onClubUpdated) {
      onClubUpdated(updatedClub);
    }
    onShowToast?.(
      syncToLedger && accountingItems.length > 0
        ? '✅ 연대기 수정(사진·회계장부 동시 연동)이 저장되었습니다!'
        : '✅ 연대기 수정 내용이 저장되었습니다!'
    );
    if (switchToMagazine) {
      setActiveTab('MAGAZINE');
    }
  };

  const handleAddPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    try {
      const urls = await Promise.all(files.map((f) => compressPhotoFile(f)));
      const newItems: EventPhotoItem[] = urls.map((u, i) => ({
        id: `ep_${Date.now()}_${i}`,
        url: u,
        caption: '',
      }));
      setEventPhotos((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error('Photo upload failed:', err);
      onShowToast?.('사진 첨부 중 오류가 발생했습니다.');
    } finally {
      if (cameraPhotoInputRef.current) cameraPhotoInputRef.current.value = '';
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleAddAccounting = () => {
    const cleanTitle = accTitle.trim();
    const num = parseInt(accAmount.replace(/\D/g, ''), 10) || 0;
    if (!cleanTitle || num <= 0) {
      onShowToast?.('⚠️ 항목명과 금액을 모두 입력해 주세요.');
      return;
    }
    setAccountingItems((prev) => [
      ...prev,
      {
        id: `acc_${Date.now()}`,
        type: accType,
        title: cleanTitle,
        amount: num,
        memo: accMemo.trim() || undefined,
      },
    ]);
    setAccTitle('');
    setAccAmount('');
    setAccMemo('');
  };

  const handleExportMagazinePng = async () => {
    setIsExportingPng(true);
    try {
      const canvas = document.createElement('canvas');
      const W = 1080;
      const hasPhoto = eventPhotos.length > 0;
      const hasAcc = accountingItems.length > 0;
      const topRows = (chronicle.rankings || []).slice(0, 8);
      const H = (hasPhoto ? 1620 : 1220) + (hasAcc ? 210 : 0);
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Editorial cream paper background
      ctx.fillStyle = '#faf8f3';
      ctx.fillRect(0, 0, W, H);

      // Top Magazine Masthead
      const mastGrad = ctx.createLinearGradient(0, 0, W, 220);
      mastGrad.addColorStop(0, '#064e3b');
      mastGrad.addColorStop(1, '#0f766e');
      ctx.fillStyle = mastGrad;
      ctx.fillRect(0, 0, W, 220);

      ctx.fillStyle = '#fde047';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PARKY CLUB MAGAZINE · 파키 앱 공식 행사 리포트', W / 2, 62);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 46px sans-serif';
      ctx.fillText(title || chronicle.title, W / 2, 128);

      ctx.fillStyle = '#d1fae5';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(
        `${club.name}   |   📅 ${heldAt}   |   📍 ${courseName}   |   🏌️ ${chronicle.totalParticipants}명 참가`,
        W / 2,
        182
      );

      let cursorY = 255;

      // Hero Photo if attached
      if (hasPhoto) {
        try {
          const heroImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const im = new Image();
            im.onload = () => resolve(im);
            im.onerror = reject;
            im.src = eventPhotos[0].url;
          });
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(54, cursorY, W - 108, 430, 24);
          ctx.clip();
          const scale = Math.max((W - 108) / heroImg.width, 430 / heroImg.height);
          const dw = heroImg.width * scale;
          const dh = heroImg.height * scale;
          ctx.drawImage(heroImg, 54 + (W - 108 - dw) / 2, cursorY + (430 - dh) / 2, dw, dh);
          ctx.restore();

          if (eventPhotos[0].caption) {
            ctx.fillStyle = 'rgba(0,0,0,0.58)';
            ctx.beginPath();
            ctx.roundRect(54, cursorY + 370, W - 108, 60, [0, 0, 24, 24]);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`📸 ${eventPhotos[0].caption}`, 80, cursorY + 409);
          }
          cursorY += 465;
        } catch {
          cursorY += 20;
        }
      }

      // Editorial Story Card
      if (magazineStory.trim()) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(54, cursorY, W - 108, 150, 20);
        ctx.fill();
        ctx.strokeStyle = '#d6d3d1';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#065f46';
        ctx.font = '900 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('✍️ 행사 스케치 & 리포트', 82, cursorY + 44);

        ctx.fillStyle = '#292524';
        ctx.font = 'bold 22px sans-serif';
        const storyText = magazineStory.trim().slice(0, 110);
        ctx.fillText(storyText.slice(0, 38), 82, cursorY + 86);
        if (storyText.length > 38) {
          ctx.fillText(storyText.slice(38, 76), 82, cursorY + 120);
        }
        cursorY += 178;
      }

      // Traditional Stroke Results Box
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(54, cursorY, W - 108, 110 + topRows.length * 46, 22);
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#065f46';
      ctx.font = '900 26px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🏆 전통 스트로크 공식 결과 (우승: ${chronicle.winnerName} ${chronicle.winnerScore}타)`, 82, cursorY + 48);

      topRows.forEach((r, idx) => {
        const ry = cursorY + 95 + idx * 46;
        ctx.fillStyle = idx === 0 ? '#b45309' : '#1c1917';
        ctx.font = idx < 3 ? '900 23px sans-serif' : 'bold 21px sans-serif';
        ctx.textAlign = 'left';
        const rankStr = r.isGuest ? '번외(게스트)' : `${r.rank}위`;
        ctx.fillText(`${rankStr}  ${r.playerName}`, 86, ry);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#047857';
        ctx.fillText(`${r.totalStrokes}타`, W - 86, ry);
      });

      cursorY += 135 + topRows.length * 46;

      // Accounting Summary Box (if present)
      if (hasAcc) {
        ctx.fillStyle = '#fffbeb';
        ctx.beginPath();
        ctx.roundRect(54, cursorY, W - 108, 140, 20);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = '#92400e';
        ctx.font = '900 24px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('💰 행사 회계 정산 요약', 82, cursorY + 46);

        ctx.fillStyle = '#1c1917';
        ctx.font = '900 26px sans-serif';
        ctx.fillText(
          `수입 +${accountingSummary.income.toLocaleString()}원   |   지출 -${accountingSummary.expense.toLocaleString()}원   |   잔액 ${accountingSummary.balance.toLocaleString()}원`,
          82,
          cursorY + 102
        );
      }

      // Footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#78716c';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('파키 앱 (PARKY APP) · 대한민국 No.1 스마트 파크골프 클럽 매거진', W / 2, H - 36);

      setMagazinePngUrl(canvas.toDataURL('image/png'));
      onShowToast?.('📰 매거진 리포트 고화질 이미지가 생성되었습니다!');
    } catch (e) {
      console.error('Magazine PNG export failed:', e);
      onShowToast?.('매거진 이미지 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleCopyMagazineText = async () => {
    const lines: string[] = [];
    lines.push(`📰 [PARKY 매거진 리포트] ${title || chronicle.title}`);
    lines.push(`🏛️ ${club.name} · 📅 ${heldAt} · 📍 ${courseName}`);
    lines.push(`🏌️ 참가 ${chronicle.totalParticipants}명 · 👑 우승 ${chronicle.winnerName} (${chronicle.winnerScore}타)`);
    if (magazineStory.trim()) {
      lines.push('');
      lines.push(`✍️ ${magazineStory.trim()}`);
    }
    if (accountingItems.length > 0) {
      lines.push('');
      lines.push(
        `💰 행사 회계 정산: 수입 +${accountingSummary.income.toLocaleString()}원 / 지출 -${accountingSummary.expense.toLocaleString()}원 / 잔액 ${accountingSummary.balance.toLocaleString()}원`
      );
    }
    if (eventPhotos.length > 0) {
      lines.push(`📸 첨부 현장 사진: ${eventPhotos.length}장`);
    }
    lines.push('\n✨ 파키 앱 (PARKY APP) 클럽 매거진');
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopiedText(true);
      onShowToast?.('📋 매거진 리포트 요약문이 복사되었습니다!');
      setTimeout(() => setCopiedText(false), 2500);
    } catch {}
  };

  return (
    <div
      data-testid="club-chronicle-manage-modal"
      className="fixed inset-0 z-[98] bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn"
    >
      <div className="bg-white w-full max-w-xl max-h-[93vh] rounded-3xl shadow-2xl border-2 border-emerald-500 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <h3 className="font-black text-sm sm:text-base truncate">⚙️ 연대기 기록 관리 · 매거진 리포트</h3>
            <p className="text-[11px] text-emerald-200 font-bold truncate">
              {club.name} · {title || chronicle.title}
            </p>
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

        {/* 3 Clean Tabs inside Manage Modal */}
        <div className="px-3 py-2 bg-stone-100 border-b border-stone-200 grid grid-cols-3 gap-1.5 shrink-0">
          <button
            type="button"
            data-testid="tab-chronicle-manage-edit"
            onClick={() => setActiveTab('EDIT')}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'EDIT'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 shrink-0" />
            <span>수정 · 보완</span>
          </button>
          <button
            type="button"
            data-testid="tab-chronicle-manage-magazine"
            onClick={() => setActiveTab('MAGAZINE')}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'MAGAZINE'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>매거진 리포트</span>
          </button>
          <button
            type="button"
            data-testid="tab-chronicle-manage-delete"
            onClick={() => setActiveTab('DELETE')}
            className={`py-2 px-1.5 rounded-xl text-[11px] sm:text-xs font-black whitespace-nowrap transition cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'DELETE'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-white text-rose-600 border border-rose-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>삭제</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-4 overscroll-contain">
          {/* =============================================================== */}
          {/* TAB 1: 수정 · 보완 (정보 · 타수수정 · 사진첨부 · 회계등록)        */}
          {/* =============================================================== */}
          {activeTab === 'EDIT' && (
            <div className="space-y-4">
              {/* 1. 기본 정보 & 매거진 스토리 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-900">📝 행사 정보 &amp; 매거진 후기</span>
                  {onOpenScoreEditor && (
                    <button
                      type="button"
                      data-testid="btn-open-score-editor-from-manage"
                      onClick={() => {
                        const updated = buildUpdatedChronicle();
                        ClubStorage.updateClubChronicle(club.id, updated, syncToLedger);
                        onOpenScoreEditor(updated);
                      }}
                      className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black cursor-pointer flex items-center gap-1"
                    >
                      <Trophy className="w-3 h-3 text-amber-300" />
                      <span>타수 · 등수표 수정</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  data-testid="input-manage-chronicle-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="행사 / 시합 제목"
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-black text-stone-900"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="구장명"
                    className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                  />
                  <input
                    type="date"
                    value={heldAt}
                    onChange={(e) => setHeldAt(e.target.value)}
                    className="px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                  />
                </div>
                <textarea
                  data-testid="textarea-manage-magazine-story"
                  rows={3}
                  value={magazineStory}
                  onChange={(e) => setMagazineStory(e.target.value)}
                  placeholder="행사 분위기, 날씨, 특별 에피소드 등 매거진 리포트에 실릴 소감·스케치를 적어주세요."
                  className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl text-xs font-medium text-stone-800 resize-none"
                />
              </div>

              {/* 2. 📸 행사 사진 첨부 (다중 + 캡션) */}
              <div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
                    <Camera className="w-4 h-4 text-emerald-700" />
                    <span>📸 행사 현장 사진 첨부 ({eventPhotos.length}장)</span>
                  </span>
                  <div className="flex gap-1.5">
                    <input
                      ref={cameraPhotoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleAddPhotos}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => cameraPhotoInputRef.current?.click()}
                      className="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3 h-3" />
                      <span>카메라</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="px-2 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-[11px] font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      <span>갤러리</span>
                    </button>
                    <button
                      type="button"
                      data-testid="btn-add-sample-event-photo"
                      onClick={() => {
                        const idx = eventPhotos.length + 1;
                        setEventPhotos((prev) => [
                          ...prev,
                          {
                            id: `ep_sample_${Date.now()}_${idx}`,
                            url: createSampleEventPhotoSvg(
                              title || chronicle.title,
                              idx === 1 ? '출발 단체 기념사진' : `시상식 현장 #${idx}`,
                              idx % 2 === 1 ? '#065f46' : '#92400e',
                              idx % 2 === 1 ? '#0f766e' : '#b45309'
                            ),
                            caption: idx === 1 ? '출발 전 단체 기념촬영' : `시상식 및 뒤풀이 #${idx}`,
                          },
                        ]);
                      }}
                      className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-[11px] font-black cursor-pointer"
                    >
                      + 샘플 사진
                    </button>
                  </div>
                </div>

                {eventPhotos.length === 0 ? (
                  <p className="text-[11px] text-emerald-800/80 font-bold text-center py-3">
                    단체사진 · 시상식 · 홀인원 인증샷을 첨부하면 매거진 리포트에 화보처럼 자동 배치됩니다.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {eventPhotos.map((ph, idx) => (
                      <div key={ph.id} className="bg-white rounded-xl border border-emerald-300 overflow-hidden shadow-2xs">
                        <div className="relative aspect-[16/10] bg-stone-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={ph.url} alt={`사진 ${idx + 1}`} className="w-full h-full object-cover" />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 px-1.5 py-0.5 bg-amber-400 text-stone-950 text-[9px] font-black rounded">
                              대표 표지
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => setEventPhotos((prev) => prev.filter((x) => x.id !== ph.id))}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                        <input
                          type="text"
                          value={ph.caption || ''}
                          onChange={(e) =>
                            setEventPhotos((prev) =>
                              prev.map((x) => (x.id === ph.id ? { ...x, caption: e.target.value } : x))
                            )
                          }
                          placeholder="사진 설명 (예: 단체사진)"
                          className="w-full px-2 py-1.5 text-[11px] font-bold text-stone-800 border-t border-stone-200 outline-hidden"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. 💰 행사 회계 등록 (수입 · 지출 정산 + 회계장부 연동) */}
              <div className="bg-amber-50/70 border-2 border-amber-300 rounded-2xl p-3 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <Coins className="w-4 h-4 text-amber-700" />
                    <span>💰 행사 회계 등록 (수입 · 지출)</span>
                  </span>
                  <span className="text-[11px] font-black text-emerald-800">
                    잔액 {accountingSummary.balance >= 0 ? '+' : ''}
                    {accountingSummary.balance.toLocaleString()}원
                  </span>
                </div>

                {/* Add Row */}
                <div className="grid grid-cols-12 gap-1.5">
                  <div className="col-span-4 flex rounded-xl overflow-hidden border border-stone-300 bg-white">
                    <button
                      type="button"
                      data-testid="btn-acc-type-income"
                      onClick={() => setAccType('INCOME')}
                      className={`flex-1 py-1.5 text-[11px] font-black cursor-pointer ${
                        accType === 'INCOME' ? 'bg-emerald-700 text-white' : 'text-stone-600'
                      }`}
                    >
                      수입
                    </button>
                    <button
                      type="button"
                      data-testid="btn-acc-type-expense"
                      onClick={() => setAccType('EXPENSE')}
                      className={`flex-1 py-1.5 text-[11px] font-black cursor-pointer ${
                        accType === 'EXPENSE' ? 'bg-rose-600 text-white' : 'text-stone-600'
                      }`}
                    >
                      지출
                    </button>
                  </div>
                  <input
                    type="text"
                    data-testid="input-acc-title"
                    value={accTitle}
                    onChange={(e) => setAccTitle(e.target.value)}
                    placeholder="항목 (예: 참가비, 식대)"
                    className="col-span-4 px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-[11px] font-bold"
                  />
                  <input
                    type="number"
                    data-testid="input-acc-amount"
                    value={accAmount}
                    onChange={(e) => setAccAmount(e.target.value)}
                    placeholder="금액(원)"
                    className="col-span-3 px-2 py-1.5 bg-white border border-stone-300 rounded-xl text-[11px] font-black text-right"
                  />
                  <button
                    type="button"
                    data-testid="btn-add-acc-item"
                    onClick={handleAddAccounting}
                    className="col-span-1 bg-stone-900 hover:bg-black text-white rounded-xl flex items-center justify-center cursor-pointer"
                    title="회계 항목 추가"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Items List */}
                {accountingItems.length > 0 && (
                  <div className="bg-white rounded-xl border border-amber-200 divide-y divide-stone-100">
                    {accountingItems.map((it) => (
                      <div key={it.id} className="px-2.5 py-2 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                              it.type === 'INCOME'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {it.type === 'INCOME' ? '수입' : '지출'}
                          </span>
                          <span className="font-bold text-stone-900 truncate">{it.title}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`font-black ${
                              it.type === 'INCOME' ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {it.type === 'INCOME' ? '+' : '-'}
                            {it.amount.toLocaleString()}원
                          </span>
                          <button
                            type="button"
                            onClick={() => setAccountingItems((prev) => prev.filter((x) => x.id !== it.id))}
                            className="text-stone-400 hover:text-rose-600 text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="px-2.5 py-2 bg-amber-50/80 flex items-center justify-between text-[11px] font-black">
                      <span className="text-emerald-800">수입 +{accountingSummary.income.toLocaleString()}원</span>
                      <span className="text-rose-700">지출 -{accountingSummary.expense.toLocaleString()}원</span>
                      <span className="text-stone-900">잔액 {accountingSummary.balance.toLocaleString()}원</span>
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToLedger}
                    onChange={(e) => setSyncToLedger(e.target.checked)}
                    className="w-3.5 h-3.5 accent-emerald-700"
                  />
                  <span>저장 시 클럽 공식 [회계관리] 장부에도 자동 동시 반영</span>
                </label>
              </div>

              {/* Save Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="btn-save-chronicle-manage"
                  onClick={() => handleSaveChanges(false)}
                  className="py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>수정 내용 저장</span>
                </button>
                <button
                  type="button"
                  data-testid="btn-save-and-open-magazine"
                  onClick={() => handleSaveChanges(true)}
                  className="py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs sm:text-sm rounded-xl shadow-md border border-amber-500 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>저장 후 매거진 보기 ▶</span>
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 2: 📰 매거진 리포트 (사진 + 스토리 + 순위 + 회계 화보 뷰)     */}
          {/* =============================================================== */}
          {activeTab === 'MAGAZINE' && (
            <div data-testid="magazine-report-view" className="space-y-4">
              <div className="rounded-3xl overflow-hidden border-2 border-emerald-700 bg-[#faf8f3] shadow-lg">
                {/* Editorial Masthead */}
                <div className="p-4 bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-900 text-white text-center space-y-1">
                  <div className="text-[10px] font-black tracking-[0.2em] text-amber-300 uppercase">
                    PARKY CLUB MAGAZINE · OFFICIAL REPORT
                  </div>
                  <h4 className="text-lg sm:text-xl font-black leading-tight">{title || chronicle.title}</h4>
                  <p className="text-[11px] text-emerald-200 font-bold">
                    🏛️ {club.name} · 📅 {heldAt} · 📍 {courseName} · 🏌️ {chronicle.totalParticipants}명 참가
                  </p>
                </div>

                {/* Photo Collage */}
                {eventPhotos.length > 0 && (
                  <div className="p-3 space-y-2">
                    <div className="rounded-2xl overflow-hidden border-2 border-amber-300/80 shadow-sm bg-stone-900 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={eventPhotos[0].url}
                        alt="대표 사진"
                        className="w-full max-h-56 object-cover"
                      />
                      {eventPhotos[0].caption && (
                        <div className="px-3 py-1.5 bg-black/70 text-white text-[11px] font-bold">
                          📸 {eventPhotos[0].caption}
                        </div>
                      )}
                    </div>
                    {eventPhotos.length > 1 && (
                      <div className="grid grid-cols-2 gap-2">
                        {eventPhotos.slice(1).map((ph) => (
                          <div key={ph.id} className="rounded-xl overflow-hidden border border-stone-300 bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={ph.url} alt="현장 사진" className="w-full h-28 object-cover" />
                            {ph.caption && (
                              <div className="px-2 py-1 text-[10px] font-bold text-stone-700 truncate">
                                {ph.caption}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Editorial Story */}
                {magazineStory.trim() && (
                  <div className="px-4 py-3 mx-3 mb-3 bg-white rounded-2xl border border-stone-200 shadow-2xs space-y-1">
                    <div className="text-[11px] font-black text-emerald-800">✍️ 행사 스케치 &amp; 리포트</div>
                    <p className="text-xs text-stone-800 font-medium leading-relaxed whitespace-pre-line">
                      {magazineStory}
                    </p>
                  </div>
                )}

                {/* Traditional Stroke Highlight */}
                <div className="px-4 py-3 mx-3 mb-3 bg-white rounded-2xl border border-emerald-200 space-y-2">
                  <div className="text-xs font-black text-emerald-950 flex items-center justify-between">
                    <span>🏆 전통 스트로크 공식 입상</span>
                    <span className="text-[10px] text-stone-500">{chronicle.totalHoles}홀 기준</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="p-2 bg-amber-50 border border-amber-300 rounded-xl">
                      <div className="text-[10px] font-black text-amber-800">🏆 1위 우승</div>
                      <div className="text-xs font-black text-stone-900 truncate">{chronicle.winnerName}</div>
                      <div className="text-[11px] font-black text-emerald-800">{chronicle.winnerScore}타</div>
                    </div>
                    {chronicle.runnerUpName && (
                      <div className="p-2 bg-stone-50 border border-stone-200 rounded-xl">
                        <div className="text-[10px] font-black text-stone-600">🥈 2위</div>
                        <div className="text-xs font-black text-stone-900 truncate">{chronicle.runnerUpName}</div>
                        <div className="text-[11px] font-black text-emerald-800">
                          {chronicle.runnerUpScore || '-'}타
                        </div>
                      </div>
                    )}
                    {chronicle.thirdPlaceName && (
                      <div className="p-2 bg-orange-50/70 border border-orange-200 rounded-xl">
                        <div className="text-[10px] font-black text-orange-800">🥉 3위</div>
                        <div className="text-xs font-black text-stone-900 truncate">{chronicle.thirdPlaceName}</div>
                        <div className="text-[11px] font-black text-emerald-800">
                          {chronicle.thirdPlaceScore || '-'}타
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Accounting Transparency Box */}
                {accountingItems.length > 0 && (
                  <div className="px-4 py-3 mx-3 mb-3 bg-amber-50/90 rounded-2xl border border-amber-300 space-y-1.5">
                    <div className="text-xs font-black text-amber-950">💰 행사 회계 투명 정산</div>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-black">
                      <div className="p-1.5 bg-white rounded-lg text-emerald-800">
                        수입 +{accountingSummary.income.toLocaleString()}원
                      </div>
                      <div className="p-1.5 bg-white rounded-lg text-rose-700">
                        지출 -{accountingSummary.expense.toLocaleString()}원
                      </div>
                      <div className="p-1.5 bg-white rounded-lg text-stone-900">
                        잔액 {accountingSummary.balance.toLocaleString()}원
                      </div>
                    </div>
                  </div>
                )}

                <div className="py-2 bg-stone-900 text-center text-[10px] font-bold text-amber-300">
                  파키 앱 (PARKY APP) · 공식 클럽 연대기 매거진
                </div>
              </div>

              {/* Magazine Export Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  data-testid="btn-export-magazine-png"
                  disabled={isExportingPng}
                  onClick={handleExportMagazinePng}
                  className="py-3 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ImageIcon className="w-4 h-4 text-amber-300" />
                  <span>{isExportingPng ? '매거진 생성 중...' : '🖼️ 매거진 리포트 이미지 저장'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyMagazineText}
                  className="py-3 px-3 bg-[#FEE500] hover:bg-[#FDD835] text-stone-950 font-black text-xs rounded-xl shadow-sm border border-[#E6CF00] flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copiedText ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedText ? '복사 완료!' : '📋 카톡 · 밴드 리포트 복사'}</span>
                </button>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* TAB 3: 🗑️ 삭제                                                   */}
          {/* =============================================================== */}
          {activeTab === 'DELETE' && (
            <div className="p-4 bg-rose-50 border-2 border-rose-200 rounded-2xl text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-rose-950">이 연대기 기록을 삭제하시겠습니까?</h4>
                <p className="text-xs text-rose-800 font-bold leading-relaxed">
                  &lsquo;{chronicle.title}&rsquo; ({chronicle.heldAt})의 순위표 · 첨부 사진 · 행사 기록이 클럽 연대기에서 영구 삭제됩니다.
                </p>
              </div>
              {!confirmDeleteArmed ? (
                <button
                  type="button"
                  data-testid="btn-arm-delete-chronicle"
                  onClick={() => setConfirmDeleteArmed(true)}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl shadow-md cursor-pointer"
                >
                  🗑️ 연대기 기록 삭제 진행
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteArmed(false)}
                    className="flex-1 py-3 bg-stone-200 text-stone-800 font-black text-xs rounded-xl cursor-pointer"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    data-testid="btn-final-delete-chronicle"
                    onClick={() => {
                      const updated = ClubStorage.deleteClubChronicle(club.id, chronicle.id);
                      if (updated && onClubUpdated) onClubUpdated(updated);
                      onShowToast?.(`🗑️ '${chronicle.title}' 연대기 기록이 삭제되었습니다.`);
                      onClose();
                    }}
                    className="flex-1 py-3 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    ✓ 영구 삭제 확정
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Magazine PNG Preview Modal */}
      {magazinePngUrl && (
        <div
          data-testid="magazine-png-preview-modal"
          className="fixed inset-0 z-[115] bg-black/85 flex items-center justify-center p-3"
        >
          <div className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400 flex flex-col max-h-[92vh]">
            <div className="px-4 py-3 bg-emerald-900 text-white flex items-center justify-between">
              <span className="font-black text-sm">📰 PARKY 매거진 리포트 이미지</span>
              <button
                type="button"
                onClick={() => setMagazinePngUrl(null)}
                className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="p-3 overflow-y-auto bg-stone-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={magazinePngUrl} alt="매거진 리포트" className="w-full rounded-xl shadow-md" />
            </div>
            <div className="p-3 bg-white border-t border-stone-200 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = magazinePngUrl;
                  a.download = `${club.name}_매거진리포트_${heldAt}.png`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>PNG 이미지 저장</span>
              </button>
              <button
                type="button"
                onClick={() => setMagazinePngUrl(null)}
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
