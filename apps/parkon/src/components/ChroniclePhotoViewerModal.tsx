'use client';

import React, { useState } from 'react';
import { X, Calendar, MapPin, Users, Award, Trash2, Share2, Edit2, Check, Sparkles } from 'lucide-react';
import { ChroniclePhotoItem, ChroniclePhotoStorage } from '@/lib/chroniclePhotoStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ChroniclePhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photo: ChroniclePhotoItem | null;
  onPhotoDeleted?: (photoId: string) => void;
  onOpenWatermarkCard?: (photo: ChroniclePhotoItem) => void;
}

export function ChroniclePhotoViewerModal({
  isOpen,
  onClose,
  photo,
  onPhotoDeleted,
  onOpenWatermarkCard,
}: ChroniclePhotoViewerModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [isEditingMemo, setIsEditingMemo] = useState(false);
  const [memoText, setMemoText] = useState('');
  const [isSavingMemo, setIsSavingMemo] = useState(false);

  // Sync memo text when photo changes
  React.useEffect(() => {
    if (photo) {
      setMemoText(photo.memo || '');
      setIsEditingMemo(false);
    }
  }, [photo]);

  if (!isOpen || !photo) return null;

  const handleSaveMemo = async () => {
    setIsSavingMemo(true);
    try {
      await ChroniclePhotoStorage.updatePhotoMemo(photo.id, memoText.trim());
      photo.memo = memoText.trim();
      setIsEditingMemo(false);
    } catch (err) {
      console.error('Failed to save memo:', err);
    } finally {
      setIsSavingMemo(false);
    }
  };

  const handleDelete = async () => {
    const confirmMsg = isJapanese
      ? 'この写真を削除しますか？'
      : '이 사진을 앨범과 타임라인에서 삭제하시겠습니까?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await ChroniclePhotoStorage.deletePhoto(photo.id);
      if (onPhotoDeleted) onPhotoDeleted(photo.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete photo:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-stone-200 animate-scaleUp">
        {/* 상단 고정 헤더 */}
        <div className="flex items-center justify-between border-b border-stone-100 p-3 sm:p-4 bg-white shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
              📸
            </span>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-black text-stone-900 truncate">
                {photo.courseName}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {photo.holeInfo || (isJapanese ? 'ラウンド認証ショット' : '라운드 인증샷')}
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
        <div className="overflow-y-auto flex-1 overscroll-contain">
          {/* 1. 고화질 사진 메인 뷰어 */}
          <div className="relative bg-stone-950 flex items-center justify-center min-h-[260px] max-h-[420px] overflow-hidden select-none">
            <img
              src={photo.imageUrl || photo.thumbnailUrl}
              alt={photo.courseName}
              className="w-full h-auto max-h-[420px] object-contain"
            />
            {photo.scoreSummary && (
              <div className="absolute bottom-2.5 right-2.5 bg-black/75 backdrop-blur-md text-amber-300 font-black text-xs px-2.5 py-1 rounded-xl shadow-md border border-amber-400/30 flex items-center gap-1">
                <span>🏆</span>
                <span>{photo.scoreSummary}</span>
              </div>
            )}
          </div>

          <div className="p-4 space-y-3.5 bg-stone-50">
            {/* 2. 누가 · 언제 · 어디서 · 타수 메타데이터 카드 */}
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-2.5 text-xs">
              {/* 어디서 (구장 & 홀) */}
              <div className="flex items-start gap-2 text-stone-800">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-stone-400 font-bold block">
                    {isJapanese ? '場所 (コース)' : '어디서'}
                  </span>
                  <div className="font-bold text-stone-900">{photo.courseName}</div>
                  {photo.holeInfo && (
                    <div className="text-[11px] text-stone-500">{photo.holeInfo}</div>
                  )}
                </div>
              </div>

              {/* 언제 (일시) */}
              <div className="flex items-center gap-2 text-stone-700 border-t border-stone-100 pt-2">
                <Calendar className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-stone-400 font-bold">
                    {isJapanese ? '日時' : '언제'}
                  </span>
                  <span className="font-semibold text-stone-900">{photo.date}</span>
                </div>
              </div>

              {/* 누가 (동반자) */}
              <div className="flex items-start gap-2 text-stone-700 border-t border-stone-100 pt-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1 flex flex-wrap gap-1 items-center">
                  <span className="text-stone-400 font-bold text-[10px] mr-1">
                    {isJapanese ? '同伴者' : '누가'}
                  </span>
                  {photo.companions && photo.companions.length > 0 ? (
                    photo.companions.map((comp, idx) => (
                      <span
                        key={idx}
                        className="bg-blue-50 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-lg border border-blue-100"
                      >
                        {comp}
                      </span>
                    ))
                  ) : (
                    <span className="text-stone-400 text-[11px]">
                      {isJapanese ? '同伴者なし' : '동반자 정보 없음'}
                    </span>
                  )}
                </div>
              </div>

              {/* 타수/스코어 (기록이 있을 경우) */}
              {photo.scoreSummary && (
                <div className="flex items-center gap-2 text-stone-700 border-t border-stone-100 pt-2">
                  <Award className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold">
                      {isJapanese ? 'スコア' : '타수/스코어'}
                    </span>
                    <span className="font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                      {photo.scoreSummary}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 3. 사진 한줄 메모 (작성 및 수정) */}
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
                  <span>📝</span>
                  <span>{isJapanese ? '思い出の一言メモ' : '추억의 한줄 소감'}</span>
                </div>
                {!isEditingMemo && (
                  <button
                    type="button"
                    onClick={() => setIsEditingMemo(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>{isJapanese ? '編集' : '수정'}</span>
                  </button>
                )}
              </div>

              {isEditingMemo ? (
                <div className="space-y-2 mt-2">
                  <textarea
                    value={memoText}
                    onChange={(e) => setMemoText(e.target.value)}
                    placeholder={
                      isJapanese
                        ? 'ラウンドの思い出や感想を入力してください...'
                        : '오늘 라운드의 즐거웠던 기억이나 소감을 남겨보세요...'
                    }
                    className="w-full text-xs p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none min-h-[64px]"
                    maxLength={150}
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setMemoText(photo.memo || '');
                        setIsEditingMemo(false);
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-stone-600 bg-stone-100 rounded-xl hover:bg-stone-200 transition cursor-pointer"
                    >
                      {isJapanese ? 'キャンセル' : '취소'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveMemo}
                      disabled={isSavingMemo}
                      className="px-3.5 py-1.5 text-xs font-black text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isJapanese ? (isSavingMemo ? '保存中...' : '保存') : (isSavingMemo ? '저장 중...' : '저장')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-stone-600 leading-relaxed min-h-[20px] italic">
                  {photo.memo ? (
                    `"${photo.memo}"`
                  ) : (
                    <span className="text-stone-400 not-italic">
                      {isJapanese ? '登録されたメモがありません。[編集]を押して感想を残してください。' : '아직 등록된 메모가 없습니다. [수정]을 눌러 소감을 적어보세요.'}
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 하단 고정 액션 버튼 바 */}
        <div className="p-3 sm:p-4 bg-white border-t border-stone-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2.5 rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-red-200/60 shrink-0"
            title={isJapanese ? '削除' : '삭제'}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">{isJapanese ? '削除' : '사진 삭제'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onOpenWatermarkCard) {
                onOpenWatermarkCard(photo);
              }
            }}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
          >
            <Share2 className="w-4 h-4 text-emerald-200" />
            <span>{isJapanese ? '📤 記念カード作成' : '📤 자랑 카드 만들기'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
