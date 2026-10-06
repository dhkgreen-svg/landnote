'use client';

import React, { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle2, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { ChroniclePhotoStorage } from '@/lib/chroniclePhotoStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface ChronicleBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataRestored?: () => void;
}

export function ChronicleBackupModal({
  isOpen,
  onClose,
  onDataRestored,
}: ChronicleBackupModalProps) {
  const { isJapanese } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setFeedbackMsg(null);
    try {
      const res = await ChroniclePhotoStorage.exportBackupFile();
      setFeedbackMsg({
        type: 'success',
        text: isJapanese
          ? `写真${res.photosCount}枚と競技記録${res.roundsCount}件が [${res.fileName}] としてダウンロードされました！`
          : `사진 ${res.photosCount}장과 경기 기록 ${res.roundsCount}건이 [${res.fileName}] 파일로 다운로드되었습니다!`,
      });
    } catch (err) {
      console.error('Export error:', err);
      setFeedbackMsg({
        type: 'error',
        text: isJapanese
          ? 'バックアップファイルの保存に失敗しました。'
          : '백업 파일 생성 중 오류가 발생했습니다.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setFeedbackMsg(null);
    try {
      const res = await ChroniclePhotoStorage.importBackupFile(file);
      setFeedbackMsg({
        type: 'success',
        text: isJapanese
          ? `復元完了！写真${res.photosCount}枚と競技記録${res.roundsCount}件を安全に統合しました。`
          : `복원 성공! 사진 ${res.photosCount}장과 경기 기록 ${res.roundsCount}건을 안전하게 병합 복원했습니다.`,
      });
      if (onDataRestored) {
        onDataRestored();
      }
    } catch (err) {
      console.error('Import error:', err);
      setFeedbackMsg({
        type: 'error',
        text: isJapanese
          ? 'ファイルの読み込みに失敗しました。正しいJSONバックアップファイルか確認してください。'
          : '백업 파일 형식이 올바르지 않거나 복원에 실패했습니다. (.json 파일 확인)',
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] border border-stone-200 animate-scaleUp">
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-stone-100 p-3.5 sm:p-4 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              💾
            </span>
            <div>
              <h3 className="text-base font-black text-stone-900 leading-tight">
                {isJapanese ? '写真・年代記 バックアップ ＆ 復元' : '사진·연대기 안전 백업 & 복원'}
              </h3>
              <p className="text-[11px] text-stone-500 font-medium">
                {isJapanese ? '端末変更・キャッシュ削除に備える安全網' : '스마트폰 교체 대비 원터치 로컬 보관'}
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

        {/* 본문 */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* 안심 안내 배너 */}
          <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/80 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-950 leading-relaxed">
              <span className="font-black block mb-0.5">
                {isJapanese ? '大切な記録を安全に手元に保管' : '소중한 사진과 전적을 내 폰에 안전 보관'}
              </span>
              <p className="text-[11px] text-emerald-800 font-medium">
                {isJapanese
                  ? 'ブラウザの履歴削除やスマホ機種変更の前にバックアップファイル（JSON）を保存しておくと、いつでも100%元通りに復元できます。'
                  : '스마트폰을 바꾸시거나 브라우저 캐시를 청소하시기 전에 백업 파일을 다운로드해 두시면 언제든 원래대로 100% 복원됩니다.'}
              </p>
            </div>
          </div>

          {/* 피드백 알림 메시지 */}
          {feedbackMsg && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-fadeIn ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border border-rose-300'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <span className="leading-tight flex-1">{feedbackMsg.text}</span>
            </div>
          )}

          {/* 1. 백업 파일 저장 (다운로드) */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
              <span>📥</span>
              <span>{isJapanese ? '1. 年代記・写真のバックアップ保存' : '1. 내 연대기 사진 백업 파일 저장'}</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
              {isJapanese
                ? 'IndexedDBに保存された全写真と年代記ラウンド記録を1つのファイル（parkon_chronicle_backup.json）として端末に保存します。'
                : 'IndexedDB에 저장된 모든 사진과 라운드 기록을 하나의 파일(parkon_chronicle_backup.json)로 다운로드 폴더에 즉시 저장합니다.'}
            </p>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isJapanese ? 'ファイル作成中...' : '백업 파일 생성 중...'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>{isJapanese ? '📥 年代記写真バックアップ保存' : '📥 내 연대기 사진 백업 파일 저장'}</span>
                </>
              )}
            </button>
          </div>

          {/* 2. 백업 파일 불러오기 (복원) */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-stone-800">
              <span>📤</span>
              <span>{isJapanese ? '2. バックアップファイルの読み込み（復元）' : '2. 백업 파일 불러오기 (복원)'}</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed font-medium">
              {isJapanese
                ? '以前保存したバックアップJSONファイルを選択すると、既存データと安全に結合して即座に復元します。'
                : '기존에 다운로드해 둔 백업 JSON 파일을 선택하시면 현재 데이터와 자동 병합하여 즉시 100% 복원합니다.'}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="w-full py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-black text-xs flex items-center justify-center gap-2 shadow-xs transition cursor-pointer active:scale-98 disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isJapanese ? '復元・統合中...' : '데이터 병합 복원 중...'}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{isJapanese ? '📤 バックアップファイル読込' : '📤 백업 파일 불러오기'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="p-3 bg-stone-50 border-t border-stone-100 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-stone-200 text-stone-700 font-bold text-xs hover:bg-stone-300 transition cursor-pointer"
          >
            {isJapanese ? '閉じる' : '닫기'}
          </button>
        </div>
      </div>
    </div>
  );
}
