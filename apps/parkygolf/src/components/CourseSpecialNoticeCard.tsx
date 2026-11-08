'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, AlertCircle, Clock, Trash2 } from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { CourseSpecialReport } from '@/types/parkon';
import { CourseSpecialNoticeModal } from '@/components/CourseSpecialNoticeModal';

interface CourseSpecialNoticeCardProps {
  courseId: string;
  courseName: string;
}

const ROTATING_PLACEHOLDERS = [
  '공사, 행사, 운영 상태 제보',
  '대회 진행 및 일반 입장 통제 제보',
  '잔디 보수 및 코스 단축 운영 제보',
  '우천·침수 긴급 임시 휴장 제보',
];

export function CourseSpecialNoticeCard({
  courseId,
  courseName,
}: CourseSpecialNoticeCardProps) {
  const [reports, setReports] = useState<CourseSpecialReport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [currentPlaceholderIdx, setCurrentPlaceholderIdx] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadReports = () => {
    const list = ParkOnStorage.getCourseSpecialReports(courseId);
    setReports(list);
  };

  useEffect(() => {
    loadReports();
  }, [courseId]);

  // "사라지는 글자" 부드러운 페이드아웃/페이드인 순환 롤링 (2.8초 주기)
  useEffect(() => {
    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentPlaceholderIdx((prev) => (prev + 1) % ROTATING_PLACEHOLDERS.length);
        setIsFading(false);
      }, 400); // 400ms 동안 서서히 사라졌다가 새 글자로 페이드인
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const handleReportAdded = (newReport: CourseSpecialReport) => {
    loadReports();
    setToastMsg('특이사항이 실시간 전광판에 등록되었습니다!');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDelete = (reportId: string) => {
    if (confirm('이 특이사항 제보를 삭제하시겠습니까?')) {
      ParkOnStorage.deleteCourseSpecialReport(courseId, reportId);
      loadReports();
      setToastMsg('제보가 삭제되었습니다.');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  const latestReport = reports.length > 0 ? reports[0] : null;

  return (
    <>
      <div className="bg-gradient-to-br from-amber-50/90 via-white to-orange-50/80 rounded-2xl p-3.5 sm:p-4 shadow-md border-2 border-amber-400/80 space-y-2.5">
        {/* 상단 헤더: 특이사항 라벨 & 제보하기 버튼 */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-base sm:text-lg shrink-0">📢</span>
            <h3 className="font-black text-xs sm:text-sm text-stone-900 tracking-tight">
              구장 특이사항
            </h3>
            {reports.length > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[9.5px] font-black bg-rose-500 text-white animate-pulse">
                제보 {reports.length}건
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs shadow-sm flex items-center gap-1.5 transition active:scale-95 cursor-pointer border border-amber-300"
          >
            <span>📢</span>
            <span>특이사항 제보하기</span>
            <span className="text-[10px]">✍️</span>
          </button>
        </div>

        {/* 토스트 알림 */}
        {toastMsg && (
          <div className="bg-emerald-100 border border-emerald-400 text-emerald-900 text-[11px] font-black py-1.5 px-3 rounded-xl text-center animate-fadeIn">
            {toastMsg}
          </div>
        )}

        {/* 본문 영역 */}
        {latestReport ? (
          /* 제보가 있을 때: 실시간 특이사항 알림 배너 */
          <div className="bg-white/95 rounded-xl p-3 border-2 border-amber-300/80 shadow-xs space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${latestReport.badgeColor} flex items-center gap-1 shadow-2xs`}>
                  <span>{latestReport.icon}</span>
                  <span>{latestReport.typeName}</span>
                </span>
                <span className="text-[10.5px] text-stone-500 font-bold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-stone-400" />
                  <span>현장 제보 {latestReport.reportedTimeStr}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(latestReport.id)}
                className="text-stone-400 hover:text-rose-600 p-1 transition cursor-pointer"
                title="제보 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs sm:text-[13px] font-black text-stone-900 leading-snug break-keep">
              {latestReport.title}
            </p>

            {reports.length > 1 && (
              <div className="pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-bold">
                <span>이전 제보 {reports.length - 1}건 더 있음</span>
                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="text-amber-700 underline font-black cursor-pointer"
                >
                  제보 추가하기 +
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 제보가 없을 때: "사라지는 글자"로 제보 유도 안내창 (터치 시 바로 제보창 열림) */
          <div
            onClick={() => setShowModal(true)}
            className="bg-white/90 hover:bg-amber-50/60 transition-colors border-2 border-dashed border-amber-300/90 rounded-xl p-3 flex items-center justify-between gap-2 cursor-pointer group select-none shadow-2xs"
            title="터치하여 특이사항 제보하기"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
              <div className="min-w-0">
                <span className="text-[10px] text-stone-500 font-bold block">
                  현재 등록된 특이사항 안내가 없습니다
                </span>
                {/* 사라졌다 나타나는 신비로운 페이드 롤링 텍스트 */}
                <div
                  className={`text-xs sm:text-sm font-black text-amber-900 tracking-tight transition-all duration-400 transform ${
                    isFading
                      ? 'opacity-0 -translate-y-1 scale-95'
                      : 'opacity-100 translate-y-0 scale-100'
                  }`}
                >
                  💡 {ROTATING_PLACEHOLDERS[currentPlaceholderIdx]}
                </div>
              </div>
            </div>

            <div className="shrink-0 bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-1 rounded-lg group-hover:scale-105 transition-transform flex items-center gap-0.5">
              <span>제보</span>
              <span>▶</span>
            </div>
          </div>
        )}
      </div>

      {/* 특이사항 제보 모달 */}
      <CourseSpecialNoticeModal
        courseId={courseId}
        courseName={courseName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onReportAdded={handleReportAdded}
      />
    </>
  );
}
