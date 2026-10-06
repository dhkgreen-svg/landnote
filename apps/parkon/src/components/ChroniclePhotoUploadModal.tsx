'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, MapPin, Calendar, Users, Check, Loader2 } from 'lucide-react';
import { RoundSession } from '@/types/parkon';
import { ChroniclePhotoStorage, compressAndProcessImage, ChroniclePhotoItem } from '@/lib/chroniclePhotoStorage';
import { ParkOnStorage } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ChroniclePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSession?: RoundSession | null;
  completedSessions?: RoundSession[];
  onPhotoUploaded?: (photo: ChroniclePhotoItem) => void;
}

export function ChroniclePhotoUploadModal({
  isOpen,
  onClose,
  targetSession,
  completedSessions = [],
  onPhotoUploaded,
}: ChroniclePhotoUploadModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [holeInfo, setHoleInfo] = useState<string>('');
  const [companionsText, setCompanionsText] = useState<string>('');
  const [memo, setMemo] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Auto-fill when opening or when targetSession changes
  useEffect(() => {
    if (isOpen) {
      const activeSession = targetSession || (completedSessions.length > 0 ? completedSessions[0] : null);

      if (activeSession) {
        setSelectedSessionId(activeSession.id);
        setCourseName(activeSession.courseName || '');
        const d = activeSession.completedAt ? activeSession.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
        setDateStr(d);
        const myName = ParkOnStorage.getUserDisplayName();
        const comps = (activeSession.players || []).map((p) => p.name || '').filter(Boolean);
        setCompanionsText(comps.length > 0 ? comps.join(', ') : myName);
      } else {
        setSelectedSessionId('');
        setCourseName('구미 동락 파크골프장');
        setDateStr(new Date().toISOString().slice(0, 10));
        setCompanionsText(ParkOnStorage.getUserDisplayName());
      }

      setHoleInfo(isJapanese ? '18ホール完走記念' : '18홀 완주 기념');
      setMemo('');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsProcessing(false);
    }
  }, [isOpen, targetSession, completedSessions, isJapanese]);

  // Handle session selection dropdown change
  const handleSessionChange = (sessId: string) => {
    setSelectedSessionId(sessId);
    const found = completedSessions.find((s) => s.id === sessId);
    if (found) {
      setCourseName(found.courseName || '');
      const d = found.completedAt ? found.completedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      setDateStr(d);
      const comps = (found.players || []).map((p) => p.name || '').filter(Boolean);
      setCompanionsText(comps.join(', '));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSubmit = async () => {
    if (!selectedFile && !previewUrl) {
      alert(isJapanese ? '写真をアップロードしてください。' : '등록할 사진을 선택해 주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Client-side canvas compression (max 1200px, WebP)
      const { imageUrl, thumbnailUrl } = await compressAndProcessImage(selectedFile || previewUrl!);

      // Calculate score summary if session linked
      let scoreSummary = '';
      const matchedSession = completedSessions.find((s) => s.id === selectedSessionId) || targetSession;
      if (matchedSession && matchedSession.players) {
        const me = matchedSession.players.find((p) => p.isSelf) || matchedSession.players[0];
        if (me) {
          const parDiff = me.totalParDiff ?? 0;
          const parDiffStr = parDiff === 0 ? 'E' : parDiff > 0 ? `+${parDiff}` : `${parDiff}`;
          scoreSummary = `${me.totalStrokes}타 (${parDiffStr})`;
        }
      }

      const companions = companionsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      // 2. Save into IndexedDB storage
      const newItem = await ChroniclePhotoStorage.addPhoto({
        sessionId: selectedSessionId || undefined,
        courseName: courseName.trim() || '파크골프장',
        date: dateStr || new Date().toISOString().slice(0, 10),
        holeInfo: holeInfo.trim() || undefined,
        companions: companions.length > 0 ? companions : [ParkOnStorage.getUserDisplayName()],
        scoreSummary: scoreSummary || undefined,
        memo: memo.trim() || undefined,
        imageUrl,
        thumbnailUrl,
      });

      // 3. Update session's photos field in storage if sessionId exists
      if (selectedSessionId) {
        try {
          const sessions = ParkOnStorage.getCompletedRounds();
          const target = sessions.find((s) => s.id === selectedSessionId);
          if (target) {
            target.photos = target.photos || [];
            target.photos.push(imageUrl);
            ParkOnStorage.saveCompletedRounds(sessions);
          }
        } catch {}
      }

      if (onPhotoUploaded) onPhotoUploaded(newItem);
      onClose();
    } catch (err) {
      console.error('Failed to upload photo:', err);
      alert(isJapanese ? '写真の保存に失敗しました。' : '사진 압축 및 저장 중 오류가 발생했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-stone-200 animate-scaleUp">
        {/* 상단 헤더 */}
        <div className="flex items-center justify-between border-b border-stone-100 p-3.5 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              📷
            </span>
            <div>
              <h3 className="text-base font-black text-stone-900 leading-tight">
                {isJapanese ? '思い出の写真を追加' : '추억의 사진 올리기'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {isJapanese ? 'ラウンドの認証ショットを登録します' : '누가·언제·어디서 찍었는지 함께 기록됩니다'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-900 flex items-center justify-center transition cursor-pointer shrink-0"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 overscroll-contain">
          {/* 숨겨진 파일 인풋 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* 사진 선택 / 미리보기 영역 */}
          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-300 aspect-video flex items-center justify-center group">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 text-white font-black text-xs flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition cursor-pointer backdrop-blur-xs"
              >
                <Camera className="w-4 h-4" />
                <span>{isJapanese ? '写真を変更する' : '사진 변경하기'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-50/60 hover:bg-emerald-100/60 flex flex-col items-center justify-center gap-2 transition cursor-pointer text-emerald-800 p-4"
            >
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
                <Camera className="w-6 h-6" />
              </div>
              <div className="text-center">
                <span className="font-black text-xs block">
                  {isJapanese ? '写真を選択または撮影' : '사진 선택 또는 바로 촬영'}
                </span>
                <span className="text-[11px] text-emerald-700/80 mt-0.5 block">
                  {isJapanese ? 'ギャラリーから選択できます' : '카메라 또는 앨범에서 사진을 불러옵니다'}
                </span>
              </div>
            </button>
          )}

          {/* 라운드 경기 연동 선택 */}
          {completedSessions.length > 0 && !targetSession && (
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                {isJapanese ? '連動するラウンド選択' : '연결할 라운드 기록 선택'}
              </label>
              <select
                value={selectedSessionId}
                onChange={(e) => handleSessionChange(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 bg-stone-50 font-bold focus:outline-none focus:border-emerald-500"
              >
                {completedSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.completedAt ? s.completedAt.slice(0, 10) : ''} · {s.courseName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 구장명 & 촬영일자 */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                {isJapanese ? '場所 (コース名)' : '구장명'}
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder={isJapanese ? 'コース名' : '구장명'}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
            <div>
              <label className="text-[11px] font-bold text-stone-600 block mb-1">
                {isJapanese ? '日時 (日付)' : '날짜'}
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500 font-semibold"
              />
            </div>
          </div>

          {/* 홀 정보 & 빠른 태그 선택 */}
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              {isJapanese ? 'ホール/シーン情報' : '홀 / 장면 정보'}
            </label>
            <input
              type="text"
              value={holeInfo}
              onChange={(e) => setHoleInfo(e.target.value)}
              placeholder={isJapanese ? '例: 18ホール完走、Aコース3番ホールなど' : '예: 18홀 완주, A코스 3번홀 등'}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500 font-medium"
            />
            {/* 빠른 추천 칩 */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {(isJapanese
                ? ['18ホール完走', '初バーディー', 'ホールインワン記念', 'ティーショット直前', '同伴者集合写真']
                : ['18홀 완주', '첫 버디 샷', '홀인원 기념', '티샷 직전', '동반자 단체샷']
              ).map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setHoleInfo(chip)}
                  className="text-[10px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 px-2 py-0.5 rounded-md cursor-pointer transition"
                >
                  #{chip}
                </button>
              ))}
            </div>
          </div>

          {/* 동반자 태그 */}
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              {isJapanese ? '同伴者 (カンマ区切り)' : '함께한 동반자 (쉼표로 구분)'}
            </label>
            <input
              type="text"
              value={companionsText}
              onChange={(e) => setCompanionsText(e.target.value)}
              placeholder={isJapanese ? '例: 私、佐藤、田中' : '예: 나, 홍길동, 김파크'}
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* 한줄 소감/메모 */}
          <div>
            <label className="text-[11px] font-bold text-stone-600 block mb-1">
              {isJapanese ? '思い出の一言メモ (選択)' : '추억의 한줄 소감 (선택)'}
            </label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder={
                isJapanese
                  ? '今日のラウンドで一番思い出に残る瞬間を記録してみてください'
                  : '오늘 라운드에서 가장 기억에 남는 순간을 기록해 보세요'
              }
              className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500 min-h-[50px] resize-none"
              maxLength={150}
            />
          </div>
        </div>

        {/* 하단 버튼 바 */}
        <div className="p-3.5 bg-stone-50 border-t border-stone-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl bg-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-300 transition cursor-pointer"
          >
            {isJapanese ? 'キャンセル' : '취소'}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isProcessing || (!previewUrl && !selectedFile)}
            className="flex-2 py-2.5 rounded-2xl bg-emerald-600 text-white font-black text-xs hover:bg-emerald-700 transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isJapanese ? '最適化中...' : '스마트 압축 저장 중...'}</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isJapanese ? 'アルバムに保存' : '포토 앨범에 저장'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
