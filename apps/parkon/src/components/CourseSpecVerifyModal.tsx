'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  Pencil,
  ShieldCheck,
  X,
} from 'lucide-react';
import { Course, HoleMetadata } from '@/types/parkon';
import { generateStandardHoles } from '@/lib/defaultCourses';
import { ParkOnStorage } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { useBackHandler } from '@/lib/backNavigation';
import {
  COURSE_LETTERS_12,
  CourseSpecSource,
  getCourseParBreakdown,
  getCourseSpecBadge,
  resolveCourseSpecStatus,
  validateCourseSpecPayload,
} from '@/lib/courseSpecShared';
import {
  adminActionCourseSpec,
  extractCourseSpecsFromPhoto,
  submitCourseSpecVerification,
} from '@/lib/courseSpecClient';

interface CourseSpecVerifyModalProps {
  isOpen: boolean;
  course: Course | null;
  mode?: 'USER' | 'ADMIN';
  initialSource?: CourseSpecSource;
  initialTotalCourses?: number;
  initialHolesMetadata?: HoleMetadata[];
  initialEvidencePhotoUrl?: string;
  onClose: () => void;
  onUpdated?: (updatedCourse: Course, message: string) => void;
}

async function compressEvidencePhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
      img.onload = () => {
        const maxSide = 1100;
        let w = img.width;
        let h = img.height;
        if (w > maxSide || h > maxSide) {
          const ratio = Math.min(maxSide / w, maxSide / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
}

function buildNormalizedHoles(totalCourses: number, sourceHoles?: HoleMetadata[]): HoleMetadata[] {
  const needed = totalCourses * 9;
  const std = generateStandardHoles(needed);
  return Array.from({ length: needed }, (_, i) => {
    const hNum = i + 1;
    const found = sourceHoles?.find((h) => Number(h.hole) === hNum);
    if (found) {
      return {
        hole: hNum,
        par: found.par === 3 || found.par === 4 || found.par === 5 ? found.par : 3,
        distanceMeter: Number(found.distanceMeter) || 0,
        distanceVerifiedAt: found.distanceVerifiedAt,
        localRule: found.localRule,
        tip: found.tip,
        isVerified: true,
      };
    }
    return {
      ...std[i],
      hole: hNum,
      isVerified: true,
    };
  });
}

export function CourseSpecVerifyModal({
  isOpen,
  course,
  mode = 'USER',
  initialSource = 'BATCH_EDIT',
  initialTotalCourses,
  initialHolesMetadata,
  initialEvidencePhotoUrl,
  onClose,
  onUpdated,
}: CourseSpecVerifyModalProps) {
  const isAdminMode = mode === 'ADMIN';
  const [totalCourses, setTotalCourses] = useState<number>(2);
  const [holes, setHoles] = useState<HoleMetadata[]>([]);
  const [activeCourseIdx, setActiveCourseIdx] = useState<number>(0);
  const [evidencePhotoUrl, setEvidencePhotoUrl] = useState<string>('');
  const [zoomPhoto, setZoomPhoto] = useState<boolean>(false);
  const [source, setSource] = useState<CourseSpecSource>(initialSource);
  const [checkedSignboard, setCheckedSignboard] = useState<boolean>(false);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showReviewPopup, setShowReviewPopup] = useState<boolean>(isAdminMode);
  const [notice, setNotice] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useBackHandler(Boolean(isOpen && course), onClose);
  useBackHandler(Boolean(isOpen && !isAdminMode && showReviewPopup), () => setShowReviewPopup(false));
  useBackHandler(Boolean(isOpen && zoomPhoto), () => setZoomPhoto(false));

  useEffect(() => {
    if (isOpen && course) {
      const baseCount = Math.max(
        1,
        Math.min(12, initialTotalCourses || course.totalCourses || Math.round((course.totalHoles || 18) / 9) || 2)
      );
      setTotalCourses(baseCount);
      setHoles(buildNormalizedHoles(baseCount, initialHolesMetadata || course.holesMetadata));
      setActiveCourseIdx(0);
      setEvidencePhotoUrl(initialEvidencePhotoUrl || '');
      setSource(initialSource);
      setCheckedSignboard(isAdminMode);
      setShowReviewPopup(isAdminMode);
      setNotice(null);
      setZoomPhoto(false);
    }
  }, [isOpen, course?.id, initialTotalCourses, initialSource, isAdminMode]);

  const parBreakdown = useMemo(
    () => getCourseParBreakdown(totalCourses, holes),
    [totalCourses, holes]
  );

  const changedHoleCount = useMemo(() => {
    if (!course) return 0;
    let diff = 0;
    const origMap = new Map((course.holesMetadata || []).map((h) => [Number(h.hole), h]));
    for (const h of holes) {
      const orig = origMap.get(Number(h.hole));
      if (!orig || Number(orig.par) !== Number(h.par) || Number(orig.distanceMeter || 0) !== Number(h.distanceMeter || 0)) {
        diff++;
      }
    }
    return diff;
  }, [course, holes]);

  const userIsClubExecutive = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const selfName = (ParkOnStorage.getUserDisplayName() || '').trim();
      if (!selfName) return false;
      const myClubs = ClubStorage.getAllClubs();
      return myClubs.some(
        (cl) =>
          cl.managerName?.includes(selfName) ||
          cl.presidentName?.includes(selfName) ||
          cl.members?.some((m) => m.name.trim() === selfName && (m.role === 'MANAGER' || m.role === 'PRESIDENT'))
      );
    } catch {
      return false;
    }
  }, [isOpen]);

  if (!isOpen || !course) return null;

  const specStatus = resolveCourseSpecStatus(course);
  const badge = getCourseSpecBadge(specStatus);

  const handleChangeCourseCount = (nextCount: number) => {
    const safe = Math.max(1, Math.min(12, nextCount));
    setTotalCourses(safe);
    setHoles((prev) => buildNormalizedHoles(safe, prev));
    if (activeCourseIdx >= safe) setActiveCourseIdx(safe - 1);
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtracting(true);
    setNotice({ type: 'info', text: 'AI 분석 중...' });
    try {
      const compressed = await compressEvidencePhoto(file);
      setEvidencePhotoUrl(compressed);
      const res = await extractCourseSpecsFromPhoto({
        image: compressed,
        courseNameHint: course.name,
      });
      if (res.success && res.totalCourses && Array.isArray(res.holesMetadata)) {
        const nowIso = new Date().toISOString();
        const stamped = res.holesMetadata.map((h) => ({
          ...h,
          distanceVerifiedAt: Number(h.distanceMeter) > 0 ? nowIso : undefined,
        }));
        setTotalCourses(res.totalCourses);
        setHoles(buildNormalizedHoles(res.totalCourses, stamped));
        setActiveCourseIdx(0);
        setSource('PHOTO_OCR');
        setNotice(null);
        setShowReviewPopup(true);
      } else {
        setNotice({
          type: 'error',
          text: res.message || '사진 자동 판독에 실패했습니다.',
        });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err?.message || '사진 처리 중 오류가 발생했습니다.' });
    } finally {
      setIsExtracting(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  const updateHoleSpec = (holeNum: number, patch: Partial<HoleMetadata>) => {
    setHoles((prev) =>
      prev.map((h) => {
        if (Number(h.hole) !== holeNum) return h;
        const next: HoleMetadata = { ...h, ...patch, isVerified: true };
        if (patch.distanceMeter !== undefined) {
          next.distanceVerifiedAt = patch.distanceMeter > 0 ? new Date().toISOString() : undefined;
        }
        return next;
      })
    );
  };

  const handleSubmit = async () => {
    if (!isAdminMode && !checkedSignboard) {
      setNotice({ type: 'error', text: '⚠️ 상단/하단의 [현장 안내판 확인] 체크박스에 체크해 주세요.' });
      return;
    }

    const check = validateCourseSpecPayload({ totalCourses, holesMetadata: holes });
    if (!check.valid) {
      setNotice({ type: 'error', text: `⚠️ ${check.error}` });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const contributorName = ParkOnStorage.getUserDisplayName() || '현장 골퍼';
      const totalHoles = totalCourses * 9;

      if (isAdminMode) {
        const res = await adminActionCourseSpec({
          action: 'DIRECT_SAVE',
          adminName: contributorName,
          courseId: course.id,
          courseName: course.name,
          region: course.region,
          totalCourses,
          holesMetadata: check.normalizedHoles,
          evidencePhotoUrl: evidencePhotoUrl || undefined,
        });
        if (!res.success) {
          setNotice({ type: 'error', text: res.message || '공식 확정 저장 실패' });
          return;
        }
        const updatedCourse: Course = {
          ...course,
          totalCourses,
          totalHoles,
          holesMetadata: check.normalizedHoles,
          isVerified: true,
          isSpecsVerified: true,
          specStatus: 'OFFICIAL_ADMIN',
          specContributorName: `${contributorName} (공식 확정)`,
          specUpdatedAt: new Date().toISOString(),
        };
        ParkOnStorage.updateCourse(updatedCourse);
        const msg = `✅ '${course.name}' (${totalCourses}코스 ${totalHoles}홀) 관리자 공식 제원으로 전국 즉시 반영 완료!`;
        onUpdated?.(updatedCourse, msg);
        onClose();
        return;
      }

      // USER mode: submit to central queue + 2-Strike / Executive+Photo auto-promotion
      const res = await submitCourseSpecVerification({
        courseId: course.id,
        courseName: course.name,
        region: course.region,
        prevTotalCourses: course.totalCourses || Math.round((course.totalHoles || 18) / 9),
        prevHolesMetadata: course.holesMetadata,
        totalCourses,
        holesMetadata: check.normalizedHoles,
        evidencePhotoUrl: evidencePhotoUrl || undefined,
        source,
        contributorName,
        isExecutive: userIsClubExecutive,
      });

      if (!res.success) {
        setNotice({ type: 'error', text: res.message || '제보 접수 중 오류가 발생했습니다.' });
        return;
      }

      const promoted = Boolean(res.promotedReason);
      const updatedCourse: Course = {
        ...course,
        totalCourses,
        totalHoles,
        holesMetadata: check.normalizedHoles,
        isVerified: true,
        isSpecsVerified: true,
        specStatus: promoted ? 'CROWD_VERIFIED' : course.specStatus,
        specContributorName: contributorName,
        specUpdatedAt: new Date().toISOString(),
      };
      ParkOnStorage.updateCourse(updatedCourse);

      const msg = `✅ 현장 실입력 최우선! '${course.name}' (${totalCourses}코스 ${totalHoles}홀) 제원이 전국 파키 앱에 즉시 자동 반영되었습니다!`;

      onUpdated?.(updatedCourse, msg);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStartHole = activeCourseIdx * 9 + 1;
  const activeCourseHoles = holes.slice(activeStartHole - 1, activeStartHole + 8);
  const origHoleMap = new Map((course.holesMetadata || []).map((h) => [Number(h.hole), h]));

  return (
    <>
      {/* Hidden file inputs shared across steps */}
      <input
        ref={cameraInputRef}
        data-testid="input-spec-ocr-camera"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelected}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        data-testid="input-spec-ocr-gallery"
        type="file"
        accept="image/*"
        onChange={handlePhotoSelected}
        className="hidden"
      />

      {/* 1단계 팝업: 사진 촬영 / 갤러리 선택 (불필요한 사전 코스·홀 표 노출 제거) */}
      {!isAdminMode && !showReviewPopup && (
        <div
          data-testid="modal-course-spec-verify"
          onClick={onClose}
          className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-4 flex items-center justify-between gap-2 shrink-0">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base">⛳</span>
                  <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                    구장 제원 점검 · 사진 AI 추출
                  </h3>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                      badge.tone === 'emerald'
                        ? 'bg-emerald-400 text-stone-950'
                        : badge.tone === 'blue'
                          ? 'bg-sky-300 text-stone-950'
                          : 'bg-amber-400 text-stone-950'
                    }`}
                  >
                    {badge.shortLabel}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/90 mt-0.5 truncate">
                  {course.name} · {course.region}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body: 오직 카메라 촬영 / 갤러리 선택 (+ 직접 입력 버튼) */}
            <div className="p-4 space-y-3">
              <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-400 rounded-2xl p-3.5 space-y-2.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    data-testid="btn-spec-ocr-camera"
                    disabled={isExtracting}
                    onClick={() => cameraInputRef.current?.click()}
                    className="py-3.5 px-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Camera className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>카메라로 촬영</span>
                  </button>
                  <button
                    type="button"
                    data-testid="btn-spec-ocr-gallery"
                    disabled={isExtracting}
                    onClick={() => galleryInputRef.current?.click()}
                    className="py-3.5 px-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <ImageIcon className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>갤러리에서 선택</span>
                  </button>
                </div>

                {evidencePhotoUrl && (
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> 사진 첨부됨
                    </span>
                    <button
                      type="button"
                      onClick={() => setZoomPhoto(true)}
                      className="text-[11px] font-black text-emerald-800 underline cursor-pointer whitespace-nowrap"
                    >
                      사진 보기
                    </button>
                  </div>
                )}
              </div>

              {notice && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-bold border ${
                    notice.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : notice.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              <button
                type="button"
                data-testid="btn-spec-manual-entry"
                disabled={isExtracting}
                onClick={() => {
                  setSource('BATCH_EDIT');
                  setNotice(null);
                  setShowReviewPopup(true);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 text-stone-700 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                <Pencil className="w-3.5 h-3.5 text-stone-600" />
                <span>직접 입력하기</span>
              </button>
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex justify-end shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl bg-white border border-stone-300 text-stone-700 font-black text-xs cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2단계 팝업: AI 분석 결과 검수 / 직접 입력 (사진 분석 완료 또는 직접 입력 클릭 시 오픈) */}
      {(isAdminMode || showReviewPopup) && (
        <div
          data-testid="modal-course-spec-review"
          onClick={() => (isAdminMode ? onClose() : setShowReviewPopup(false))}
          className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-4 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                {!isAdminMode && (
                  <button
                    type="button"
                    data-testid="btn-spec-review-back"
                    onClick={() => setShowReviewPopup(false)}
                    className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-black flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>이전</span>
                  </button>
                )}
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                    {isAdminMode
                      ? '관리자 구장 제원 공식 확정'
                      : source === 'PHOTO_OCR'
                        ? 'AI 추출 결과 검수 · 반영'
                        : '구장 제원 직접 입력'}
                  </h3>
                  <p className="text-[11px] text-emerald-100/90 mt-0.5 truncate">
                    {course.name} · {course.region}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain">
              {/* 관리자 모드용 사진 촬영/갤러리 + 첨부 사진 확인 */}
              {(isAdminMode || evidencePhotoUrl) && (
                <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-2.5 space-y-2">
                  {isAdminMode && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        data-testid="btn-spec-ocr-camera"
                        disabled={isExtracting}
                        onClick={() => cameraInputRef.current?.click()}
                        className="py-2 px-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>카메라로 촬영</span>
                      </button>
                      <button
                        type="button"
                        data-testid="btn-spec-ocr-gallery"
                        disabled={isExtracting}
                        onClick={() => galleryInputRef.current?.click()}
                        className="py-2 px-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span>갤러리에서 선택</span>
                      </button>
                    </div>
                  )}
                  {evidencePhotoUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 사진 첨부됨
                      </span>
                      <button
                        type="button"
                        onClick={() => setZoomPhoto(true)}
                        className="text-[11px] font-black text-emerald-800 underline cursor-pointer whitespace-nowrap"
                      >
                        사진 보기
                      </button>
                    </div>
                  )}
                </div>
              )}

              {notice && (
                <div
                  className={`rounded-xl p-2.5 text-xs font-bold border ${
                    notice.type === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : notice.type === 'success'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-amber-50 border-amber-300 text-amber-900'
                  }`}
                >
                  {notice.text}
                </div>
              )}

              {/* ① 코스 수 (총 홀 수) 선택 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-800">
                    ① 실제 구장 코스 수 ({totalCourses}코스 · 총 {totalCourses * 9}홀)
                  </span>
                  <span className="text-[10.5px] font-bold text-stone-500">
                    변경 홀 {changedHoleCount}개
                  </span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      data-testid={`btn-spec-courses-${cnt}`}
                      onClick={() => handleChangeCourseCount(cnt)}
                      className={`py-2 rounded-xl text-xs font-black border-2 cursor-pointer transition ${
                        totalCourses === cnt
                          ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                          : 'bg-white border-stone-200 text-stone-700 hover:border-emerald-300'
                      }`}
                    >
                      {cnt}코스
                      <div className={`text-[9.5px] font-bold ${totalCourses === cnt ? 'text-emerald-200' : 'text-stone-400'}`}>
                        {cnt * 9}홀
                      </div>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-stone-500">대형 구장(7~12코스):</span>
                  <button
                    type="button"
                    onClick={() => handleChangeCourseCount(totalCourses - 1)}
                    disabled={totalCourses <= 1}
                    className="px-2 py-0.5 rounded bg-white border border-stone-300 text-xs font-black disabled:opacity-40 cursor-pointer"
                  >
                    −
                  </button>
                  <span className="text-xs font-black text-stone-800 min-w-[46px] text-center">
                    {totalCourses}코스
                  </span>
                  <button
                    type="button"
                    onClick={() => handleChangeCourseCount(totalCourses + 1)}
                    disabled={totalCourses >= 12}
                    className="px-2 py-0.5 rounded bg-white border border-stone-300 text-xs font-black disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* ② 코스 탭 + 9홀 Par 합계 33타 실시간 검산 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-stone-800">② 코스별 홀별 파수(Par) · 거리(m) 일괄 검수</span>
                  <span className="text-[10.5px] font-bold text-emerald-700">표준 9홀 = 33타</span>
                </div>

                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {parBreakdown.map((b) => {
                    const active = activeCourseIdx === b.courseIndex;
                    return (
                      <button
                        key={b.courseLetter}
                        type="button"
                        data-testid={`btn-spec-course-tab-${b.courseLetter}`}
                        onClick={() => setActiveCourseIdx(b.courseIndex)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 shrink-0 cursor-pointer transition flex items-center gap-1 ${
                          active
                            ? 'bg-emerald-700 border-emerald-700 text-white'
                            : 'bg-white border-stone-200 text-stone-700'
                        }`}
                      >
                        <span>{b.courseLetter}코스</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            b.isStandard33
                              ? active
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-400 text-stone-950'
                          }`}
                        >
                          {b.parSum}타{b.isStandard33 ? '✓' : '!'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* 9-hole compact rows */}
                <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white">
                  {activeCourseHoles.map((h, idx) => {
                    const courseLetter = COURSE_LETTERS_12[activeCourseIdx] || `${activeCourseIdx + 1}`;
                    const holeInCourse = idx + 1;
                    const orig = origHoleMap.get(Number(h.hole));
                    const parChanged = Boolean(orig && Number(orig.par) !== Number(h.par));
                    return (
                      <div
                        key={h.hole}
                        className={`px-3 py-2 flex items-center justify-between gap-2 ${
                          parChanged ? 'bg-amber-50/70' : 'bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-[68px]">
                          <span className="text-xs font-black text-emerald-900">
                            {courseLetter}-{holeInCourse}
                          </span>
                          <span className="text-[10px] text-stone-400 font-bold">({h.hole}H)</span>
                        </div>

                        {/* 1-Tap Par 3 / 4 / 5 Selector */}
                        <div className="flex items-center gap-1">
                          {([3, 4, 5] as const).map((pVal) => (
                            <button
                              key={pVal}
                              type="button"
                              data-testid={`btn-hole-${h.hole}-par-${pVal}`}
                              onClick={() => updateHoleSpec(h.hole, { par: pVal })}
                              className={`w-11 py-1.5 rounded-lg text-xs font-black border cursor-pointer transition ${
                                Number(h.par) === pVal
                                  ? pVal === 5
                                    ? 'bg-amber-500 border-amber-600 text-stone-950 shadow-2xs'
                                    : pVal === 4
                                      ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                                      : 'bg-teal-600 border-teal-700 text-white shadow-2xs'
                                  : 'bg-stone-50 border-stone-200 text-stone-500 hover:border-emerald-300'
                              }`}
                            >
                              P{pVal}
                            </button>
                          ))}
                        </div>

                        {/* Distance (m) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={250}
                            value={h.distanceMeter && h.distanceMeter > 0 ? h.distanceMeter : ''}
                            placeholder="__"
                            onChange={(e) =>
                              updateHoleSpec(h.hole, {
                                distanceMeter: Math.max(0, Math.min(250, parseInt(e.target.value || '0', 10) || 0)),
                              })
                            }
                            className="w-14 px-1.5 py-1 bg-stone-50 border border-stone-300 rounded-lg text-xs font-black text-right text-stone-900"
                          />
                          <span className="text-[10.5px] font-bold text-stone-500">m</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 현장 안내판 확인 체크 (필수 가드) */}
              {!isAdminMode && (
                <label
                  data-testid="label-spec-confirm-signboard"
                  className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition ${
                    checkedSignboard
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-amber-50/80 border-amber-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    data-testid="checkbox-spec-confirm-signboard"
                    checked={checkedSignboard}
                    onChange={(e) => setCheckedSignboard(e.target.checked)}
                    className="w-4 h-4 accent-emerald-700 shrink-0 cursor-pointer"
                  />
                  <div className="text-xs font-black text-stone-900 leading-snug">
                    현장 안내판(또는 공식 스코어카드)을 확인했습니다 (필수)
                  </div>
                </label>
              )}
            </div>

            {/* Footer */}
            <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => (isAdminMode ? onClose() : setShowReviewPopup(false))}
                className="px-4 py-3 rounded-xl bg-white border border-stone-300 text-stone-700 font-black text-xs cursor-pointer"
              >
                {isAdminMode ? '취소' : '← 이전'}
              </button>
              <button
                type="button"
                data-testid="btn-submit-course-spec"
                disabled={isSubmitting || (!isAdminMode && !checkedSignboard)}
                onClick={handleSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-45 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition"
              >
                {isAdminMode ? <ShieldCheck className="w-4 h-4 text-amber-300" /> : <Check className="w-4 h-4 text-amber-300" />}
                <span>
                  {isSubmitting
                    ? '저장 · 반영 중...'
                    : isAdminMode
                      ? '✅ 관리자 공식 확정 · 전국 즉시 반영'
                      : '✓ 제원 점검 반영 · 중앙 제보하기'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 증빙 사진 확대 보기 서브 팝업 */}
      {zoomPhoto && evidencePhotoUrl && (
        <div
          onClick={() => setZoomPhoto(false)}
          className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setZoomPhoto(false)}
                className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-black cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={evidencePhotoUrl} alt="구장 안내판 증빙" className="w-full rounded-2xl border-2 border-white/30" />
          </div>
        </div>
      )}
    </>
  );
}
