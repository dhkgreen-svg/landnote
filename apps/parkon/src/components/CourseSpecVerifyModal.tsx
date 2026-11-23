'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  CheckCircle2,
  Image as ImageIcon,
  ShieldCheck,
  Sparkles,
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
  const [notice, setNotice] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  useBackHandler(Boolean(isOpen && course), onClose);
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
    setNotice({ type: 'info', text: '📸 AI가 안내판/스코어카드 사진에서 코스 수와 홀별 파·거리를 추출 중입니다...' });
    try {
      const compressed = await compressEvidencePhoto(file);
      setEvidencePhotoUrl(compressed);
      const res = await extractCourseSpecsFromPhoto({
        image: compressed,
        courseNameHint: course.name,
      });
      if (res.success && res.totalCourses && Array.isArray(res.holesMetadata)) {
        setTotalCourses(res.totalCourses);
        setHoles(buildNormalizedHoles(res.totalCourses, res.holesMetadata));
        setActiveCourseIdx(0);
        setSource('PHOTO_OCR');
        setNotice({ type: 'success', text: res.note || '✅ 사진에서 코스 제원을 추출했습니다!' });
      } else {
        setNotice({
          type: 'error',
          text: res.message || '사진 자동 판독에 실패했습니다. 증빙 사진은 첨부되었으니 아래 표에서 직접 파수를 선택해 주세요.',
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

  const handleLoadSampleSignboard = async () => {
    setIsExtracting(true);
    setNotice(null);
    try {
      const res = await extractCourseSpecsFromPhoto({
        courseNameHint: course.name,
        sampleMode: true,
      });
      if (res.success && res.totalCourses && Array.isArray(res.holesMetadata)) {
        setTotalCourses(res.totalCourses);
        setHoles(buildNormalizedHoles(res.totalCourses, res.holesMetadata));
        setActiveCourseIdx(0);
        setSource('PHOTO_OCR');
        // Attach lightweight sample signboard SVG thumbnail as proof preview
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="320" viewBox="0 0 600 320">
          <rect width="600" height="320" rx="18" fill="#064e3b"/>
          <rect x="16" y="16" width="568" height="288" rx="12" fill="#ecfdf5" stroke="#10b981" stroke-width="3"/>
          <text x="36" y="64" fill="#065f46" font-family="sans-serif" font-size="24" font-weight="bold">⛳ ${course.name} 코스 안내판 (샘플)</text>
          <text x="36" y="114" fill="#047857" font-family="sans-serif" font-size="18" font-weight="bold">총 3코스 27홀 · A코스 33타 · B코스 33타 · C코스 33타</text>
          <text x="36" y="162" fill="#334155" font-family="sans-serif" font-size="15">A: 4-3-4-3-5-3-4-3-4 (683m)</text>
          <text x="36" y="196" fill="#334155" font-family="sans-serif" font-size="15">B: 3-4-3-4-3-4-5-3-4 (681m)</text>
          <text x="36" y="230" fill="#334155" font-family="sans-serif" font-size="15">C: 4-3-3-4-4-3-4-3-5 (691m)</text>
          <text x="36" y="280" fill="#b45309" font-family="sans-serif" font-size="14" font-weight="bold">PARKY APP · 사진 1장 36홀 통째 제원 추출 체험</text>
        </svg>`;
        setEvidencePhotoUrl(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
        setNotice({ type: 'success', text: res.note || '샘플 안내판 제원을 불러왔습니다.' });
      }
    } finally {
      setIsExtracting(false);
    }
  };

  const updateHoleSpec = (holeNum: number, patch: Partial<HoleMetadata>) => {
    setHoles((prev) =>
      prev.map((h) => (Number(h.hole) === holeNum ? { ...h, ...patch, isVerified: true } : h))
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
    <div
      data-testid="modal-course-spec-verify"
      onClick={onClose}
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-lg max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-4 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-base">⛳</span>
              <h3 className="font-black text-sm sm:text-base tracking-tight truncate">
                {isAdminMode ? '관리자 구장 제원 공식 확정' : '구장 제원 점검 · 사진 AI 추출'}
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5 overscroll-contain">
          {/* 1. 사진 1장 = 전 코스 AI 자동 추출 (카메라 + 갤러리 듀얼 분리) */}
          <div className="bg-emerald-50/80 border-2 border-dashed border-emerald-400 rounded-2xl p-3 space-y-2.5">
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

            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>사진 1장으로 전 코스(9~36홀) 자동 추출</span>
              </div>
              {evidencePhotoUrl && (
                <button
                  type="button"
                  onClick={() => setZoomPhoto(true)}
                  className="text-[10.5px] font-black text-emerald-800 underline cursor-pointer whitespace-nowrap"
                >
                  증빙 사진 보기
                </button>
              )}
            </div>
            <p className="text-[11px] text-emerald-800/90 font-medium leading-snug">
              티박스 코스 안내판이나 구장 종이 스코어카드 사진을 올리면 AI가 코스 수와 홀별 Par·거리를 통째로 읽어옵니다.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="btn-spec-ocr-camera"
                disabled={isExtracting}
                onClick={() => cameraInputRef.current?.click()}
                className="py-2.5 px-2 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Camera className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>카메라로 촬영</span>
              </button>
              <button
                type="button"
                data-testid="btn-spec-ocr-gallery"
                disabled={isExtracting}
                onClick={() => galleryInputRef.current?.click()}
                className="py-2.5 px-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>갤러리에서 선택</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                data-testid="btn-spec-ocr-sample"
                disabled={isExtracting}
                onClick={handleLoadSampleSignboard}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-[11px] rounded-lg border border-amber-500 cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>✨ 안내판 3코스(27홀) 샘플 체험</span>
              </button>
              {evidencePhotoUrl && (
                <span className="text-[10.5px] font-black text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 증빙 사진 첨부됨
                </span>
              )}
            </div>
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

          {/* 2. 코스 수 (총 홀 수) 선택 */}
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
            {totalCourses > 6 || true ? (
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
            ) : null}
          </div>

          {/* 3. 코스 탭 + 9홀 Par 합계 33타 실시간 검산 */}
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

          {/* 4. 현장 안내판 확인 체크 (필수 가드) */}
          {!isAdminMode && (
            <label
              data-testid="label-spec-confirm-signboard"
              className={`flex items-start gap-2.5 p-3 rounded-2xl border-2 cursor-pointer transition ${
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
                className="mt-0.5 w-4 h-4 accent-emerald-700 shrink-0 cursor-pointer"
              />
              <div className="text-[11px] leading-snug">
                <div className="font-black text-stone-900">
                  ☑️ 현장 안내판(또는 공식 스코어카드)을 직접 확인했습니다 (필수)
                </div>
                <div className="text-stone-600 font-medium mt-0.5">
                  🥇 유저 현장 실입력 최우선 원칙에 따라 제출 즉시 전국 모든 파키 앱에 자동 반영됩니다.
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-stone-200 bg-stone-50 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl bg-white border border-stone-300 text-stone-700 font-black text-xs cursor-pointer"
          >
            취소
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
    </div>
  );
}
