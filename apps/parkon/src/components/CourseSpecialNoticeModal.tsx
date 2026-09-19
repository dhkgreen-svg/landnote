'use client';

import React, { useState } from 'react';
import { X, Check, AlertTriangle } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { CourseSpecialReport } from '@/types/parkon';

interface CourseSpecialNoticeModalProps {
  courseId: string;
  courseName: string;
  isOpen: boolean;
  onClose: () => void;
  onReportAdded: (report: CourseSpecialReport) => void;
}

export function CourseSpecialNoticeModal({
  courseId,
  courseName,
  isOpen,
  onClose,
  onReportAdded,
}: CourseSpecialNoticeModalProps) {
  const [selectedType, setSelectedType] = useState<'EVENT' | 'CONSTRUCTION' | 'CLOSURE' | 'WAITING' | 'OTHER' | null>(null);
  const [memo, setMemo] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const typeOptions: {
    type: 'EVENT' | 'CONSTRUCTION' | 'CLOSURE' | 'WAITING' | 'OTHER';
    icon: string;
    label: string;
    sub: string;
    badgeBg: string;
  }[] = [
    {
      type: 'EVENT',
      icon: '🏆',
      label: '대회·행사 진행 중',
      sub: '일반 이용 통제 또는 대기 발생',
      badgeBg: 'border-purple-300 bg-purple-50 text-purple-900',
    },
    {
      type: 'CONSTRUCTION',
      icon: '🚧',
      label: '코스 공사·잔디 보수',
      sub: '일부 코스 보식·단축 운영',
      badgeBg: 'border-amber-300 bg-amber-50 text-amber-900',
    },
    {
      type: 'CLOSURE',
      icon: '⛔',
      label: '긴급 임시 휴장',
      sub: '우천·침수·사정상 긴급 휴장',
      badgeBg: 'border-rose-300 bg-rose-50 text-rose-900',
    },
    {
      type: 'WAITING',
      icon: '⏰',
      label: '운영 변동 / 대기 많음',
      sub: '입장 대기시간 길거나 시간 단축',
      badgeBg: 'border-blue-300 bg-blue-50 text-blue-900',
    },
    {
      type: 'OTHER',
      icon: '💬',
      label: '기타 현장 소식',
      sub: '기타 현장 특이사항 제보',
      badgeBg: 'border-emerald-300 bg-emerald-50 text-emerald-900',
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) {
      alert('제보하실 유형(대회, 공사, 휴장 등)을 먼저 선택해 주세요.');
      return;
    }
    setIsSubmitting(true);
    try {
      const profile = ParkOnStorage.getUserProfile?.() || null;
      const reporterName = profile?.userName && profile.userName !== '플레이어' ? profile.userName : '현장 골퍼';

      const newReport = ParkOnStorage.addCourseSpecialReport(courseId, {
        type: selectedType,
        memo: memo.trim(),
        reporterName,
      });

      onReportAdded(newReport);
      onClose();
    } catch (err) {
      console.error('Failed to submit report', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col my-auto max-h-[92vh]">
        {/* 모달 헤더 */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 text-base shrink-0">
              📢
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm text-white tracking-tight truncate">
                {courseName} 특이사항 제보
              </h3>
              <p className="text-[10px] text-emerald-200 truncate">
                행사·공사·휴장 소식을 1초 만에 공유해 주세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 제보 폼 영역 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 overflow-y-auto flex-1 text-stone-900">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>📌</span>
                <span>제보 유형 선택 (네모 박스 체크)</span>
              </span>
              <span className="text-[10px] text-stone-500 font-bold">
                {selectedType ? '1개 선택됨 ✓' : '미선택 (터치하여 선택)'}
              </span>
            </label>
            <div className="space-y-1.5">
              {typeOptions.map((opt) => {
                const isSelected = selectedType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => setSelectedType((prev) => (prev === opt.type ? null : opt.type))}
                    className={`w-full p-2.5 rounded-xl border-2 text-left flex items-center justify-between gap-2.5 transition active:scale-[0.99] cursor-pointer group ${
                      isSelected
                        ? `${opt.badgeBg} border-emerald-600 ring-2 ring-emerald-400/40 shadow-xs font-black`
                        : 'border-stone-200 bg-stone-50/70 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{opt.icon}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-black tracking-tight leading-snug">
                          {opt.label}
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium truncate">
                          {opt.sub}
                        </div>
                      </div>
                    </div>
                    {/* 네모 체크박스 (체크 안 됐을 땐 빈 네모, 체크 시 초록색 체크 네모, 다시 누르면 해제) */}
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                          : 'border-stone-300 bg-white group-hover:border-stone-400'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 한 줄 메모 입력창 */}
          <div className="space-y-1">
            <label className="text-[11px] font-black text-stone-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span>💬</span>
                <span>상세 내용 한 줄 입력 (선택)</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">최대 60자</span>
            </label>
            <textarea
              rows={2}
              maxLength={60}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 오늘 13시까지 구미협회장배 시합 중 / A코스 잔디 보식 중"
              className="w-full bg-stone-50 border-2 border-stone-200 focus:border-emerald-600 rounded-xl p-2.5 text-xs text-stone-900 font-bold focus:outline-none transition resize-none placeholder:text-stone-400"
            />
          </div>

          <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-start gap-2 text-[10.5px] text-amber-900 leading-snug">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
            <span>
              등록된 제보는 파크온 회원 모두에게 24시간 동안 실시간 전광판으로 노출됩니다. 허위 제보는 삼가해 주세요.
            </span>
          </div>

          {/* 버튼 영역 */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black rounded-xl text-xs transition cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!selectedType || isSubmitting}
              className={`flex-1 py-3 rounded-xl text-xs font-black transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 ${
                selectedType
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 text-white'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed border border-stone-300'
              }`}
            >
              <span>✍️</span>
              <span>{selectedType ? '특이사항 등록하기' : '제보 유형을 선택해 주세요'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
