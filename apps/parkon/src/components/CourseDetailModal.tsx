'use client';
import { useBackHandler } from '@/lib/backNavigation';
import { reportCourseBigDataLog } from '@/lib/courseBigData';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Award, CheckCircle2, Camera, Edit2, Lock, Unlock, Save, ShieldCheck, History, Play, AlertTriangle, Trophy } from 'lucide-react';
import { Course, HoleMetadata, CourseContribution } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';
import { YardageBookModal } from '@/components/YardageBookModal';
import { YardageBookStorage, buildYardageNoteId } from '@/lib/yardageBookStorage';
import { CourseHallOfFameModal } from '@/components/CourseHallOfFameModal';
import { CourseTodayContent } from '@/components/CourseTodayModal';
import { CourseRestaurantList } from '@/components/CourseRestaurantList';
import { RestaurantStorage } from '@/lib/restaurantStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  getCourseDualName,
  getLocalizedCourseDescription,
  getLocalizedCourseAddress,
  getLocalizedCourseFee,
  getLocalizedCourseOpenHours,
  getLocalizedCourseClosedDay,
  getLocalizedCourseParking,
} from '@/lib/courseLocalization';

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onSaved: (updated: Course) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function CourseDetailModal({ course, onClose, onSaved }: CourseDetailModalProps) {
  const { isJapanese } = useTranslation();
  // 초기 코스 수 산정 (저장된 totalCourses 우선, 없으면 totalHoles 기준)
  const isDongrakOr36 = course.name.includes('동락') || (course.totalHoles && course.totalHoles >= 36);
  const initialCourseCount = Math.max(
    1,
    Math.min(
      12,
      course.totalCourses ||
        (course.totalHoles && course.totalHoles >= 9 ? Math.round(course.totalHoles / 9) : isDongrakOr36 ? 4 : 4)
    )
  );

  const [editedCourseName, setEditedCourseName] = useState<string>(course.name);
  const [editedAliases, setEditedAliases] = useState<string[]>(course.aliases || []);
  const [draftAliasesText, setDraftAliasesText] = useState<string>((course.aliases || []).join(', '));
  const [editedCourseCount, setEditedCourseCount] = useState<number>(initialCourseCount);
  const [showCourseInfoPopup, setShowCourseInfoPopup] = useState<boolean>(false);
  const [draftCourseName, setDraftCourseName] = useState<string>(course.name);
  const [draftCourseCount, setDraftCourseCount] = useState<number>(initialCourseCount);
  const [courseInfoFlash, setCourseInfoFlash] = useState<boolean>(false);
  const [showAddZonePopup, setShowAddZonePopup] = useState<boolean>(false);
  const [zoneDraftName, setZoneDraftName] = useState<string>('');
  const [zoneDraftCount, setZoneDraftCount] = useState<number>(initialCourseCount);

  const availableCourses = COURSE_LETTERS.slice(0, Math.max(1, Math.min(12, editedCourseCount)));
  const totalRequiredHoles = availableCourses.length * 9;

  // 전체 홀 데이터가 부족할 경우 표준 홀로 자동 보강
  const initialHoles: HoleMetadata[] = [...(course.holesMetadata || [])];
  if (initialHoles.length < totalRequiredHoles) {
    const std = generateStandardHoles(totalRequiredHoles);
    for (let i = initialHoles.length; i < totalRequiredHoles; i++) {
      initialHoles.push(std[i] || { hole: i + 1, par: 3, distanceMeter: 0, isVerified: false });
    }
  }

  const [currentCourseIdx, setCurrentCourseIdx] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingHoleNum, setEditingHoleNum] = useState<number | null>(null);
  const [holePopupDraft, setHolePopupDraft] = useState<{
    holeNumber: number;
    courseLetter: string;
    holeInCourse: number;
    par: 3 | 4 | 5;
    distanceMeter: number;
  } | null>(null);
  const [holeConfirmFlash, setHoleConfirmFlash] = useState<number | null>(null);
  const [editedHoles, setEditedHoles] = useState<HoleMetadata[]>(initialHoles);
  const [editorName, setEditorName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(course.imageUrl || '');
  const [isLocked, setIsLocked] = useState<boolean>(course.isLocked || false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showPhotoSection, setShowPhotoSection] = useState<boolean>(false);
  const [yardageTargetHole, setYardageTargetHole] = useState<{
    courseLetter: string;
    holeInCourse: number;
    holeNumber: number;
    par: 3 | 4 | 5;
    officialDistance: number;
  } | null>(null);
  const [yardageNotesMap, setYardageNotesMap] = useState<Record<string, any>>({});

  // 스마트폰 뒤로가기 시 팝업부터 순서대로 닫기 (파수·거리 수정 팝업 -> 상세 모달)
  useBackHandler(true, onClose);
  useBackHandler(Boolean(holePopupDraft), () => setHolePopupDraft(null));
  useBackHandler(showCourseInfoPopup, () => setShowCourseInfoPopup(false));
  useBackHandler(showAddZonePopup, () => setShowAddZonePopup(false));

  // 새 구역(2구장 등) 생성 직후 또는 다른 화면(구장명 수정)에서 수정 후 열릴 때 최신 데이터 동기화
  useEffect(() => {
    const latest = ParkOnStorage.getAllCourses().find((c) => c.id === course.id) || course;
    const nextCnt = Math.max(
      1,
      Math.min(
        12,
        latest.totalCourses ||
          (latest.totalHoles && latest.totalHoles >= 9 ? Math.round(latest.totalHoles / 9) : 4)
      )
    );
    const reqHoles = nextCnt * 9;
    const syncedHoles: HoleMetadata[] = [...(latest.holesMetadata || [])];
    if (syncedHoles.length < reqHoles) {
      const std = generateStandardHoles(reqHoles);
      for (let i = syncedHoles.length; i < reqHoles; i++) {
        syncedHoles.push(std[i] || { hole: i + 1, par: 3, distanceMeter: 60, isVerified: false });
      }
    }
    setEditedCourseName(latest.name);
    setEditedAliases(latest.aliases || []);
    setDraftAliasesText((latest.aliases || []).join(', '));
    setEditedCourseCount(nextCnt);
    setEditedHoles(syncedHoles);
    setCurrentCourseIdx(0);
  }, [course.id]);

  useEffect(() => {
    const syncYardage = () => {
      setYardageNotesMap(YardageBookStorage.getAllNotes());
    };
    syncYardage();
    try {
      const profile = ParkOnStorage.getUserProfile();
      const kakao = ParkOnStorage.getKakaoUser();
      const rawName = (kakao?.nickname || profile?.userName || localStorage.getItem('parkon_player_name') || '').trim();
      const isPlaceholder = !rawName || ['파크골퍼', '손오공', '홍길동', '게스트'].includes(rawName);
      if (!isPlaceholder) {
        setEditorName((prev) => (prev ? prev : rawName));
      }
    } catch {}
    window.addEventListener('parkon_yardage_updated', syncYardage);
    return () => window.removeEventListener('parkon_yardage_updated', syncYardage);
  }, []);
  const [showHallOfFameModal, setShowHallOfFameModal] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'YARDAGE' | 'TODAY' | 'RESTAURANTS'>('YARDAGE');
  const openHoleYardage = (courseLetter: string, holeInCourse: number) => {
    const cIdx = Math.max(0, availableCourses.indexOf(courseLetter));
    const holeNumber = cIdx * 9 + holeInCourse;
    const hMeta = editedHoles.find((h) => h.hole === holeNumber);
    setCurrentCourseIdx(cIdx);
    setYardageTargetHole({
      courseLetter,
      holeInCourse,
      holeNumber,
      par: (hMeta?.par === 4 || hMeta?.par === 5 ? hMeta.par : 3) as 3 | 4 | 5,
      officialDistance: hMeta?.distanceMeter || 60,
    });
  };

  const courseRestaurants = RestaurantStorage.getRestaurantsByCourse(course.name || course.id);

  const currentCourseLetter = availableCourses[currentCourseIdx] || 'A';
  const startHoleNum = currentCourseIdx * 9 + 1;
  const endHoleNum = (currentCourseIdx + 1) * 9;

  // 현재 선택된 코스의 9개 홀 필터링
  const currentHoles = editedHoles.filter(
    (h) => h.hole >= startHoleNum && h.hole <= endHoleNum
  );

  // 현재 9홀 합계 Par 및 거리
  const totalParCurrent = currentHoles.reduce((sum, h) => sum + h.par, 0);
  const totalDistCurrent = currentHoles.reduce((sum, h) => sum + h.distanceMeter, 0);

  // 개별 홀 제원 수정 핸들러
  const handleHoleChange = (holeNumber: number, field: 'par' | 'distanceMeter' | 'localRule' | 'tip', value: any) => {
    setEditedHoles((prev) =>
      prev.map((h) => (h.hole === holeNumber ? { ...h, [field]: value } : h))
    );
  };

  // 이미지 업로드 핸들러
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const persistCourseChanges = (
    actionLabel: string,
    authorName: string,
    holesOverride?: HoleMetadata[],
    metaOverride?: { name?: string; courseCount?: number; aliases?: string[] }
  ) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newHistoryEntry: CourseContribution = {
      author: authorName,
      date: todayStr,
      action: actionLabel,
    };
    const existingHistory = course.contributionHistory || [];
    const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 15);
    const finalName = (metaOverride?.name ?? editedCourseName).trim() || course.name;
    const finalAliases = metaOverride?.aliases ?? editedAliases;
    const finalCourseCount = Math.max(1, Math.min(12, metaOverride?.courseCount ?? editedCourseCount));
    const finalTotalHoles = finalCourseCount * 9;
    const updatedCourse: Course = {
      ...course,
      name: finalName,
      nameKo: isJapanese ? course.nameKo : finalName,
      nameJa: isJapanese ? finalName : course.nameJa,
      aliases: finalAliases.length > 0 ? finalAliases : undefined,
      totalCourses: finalCourseCount,
      totalHoles: finalTotalHoles,
      holesMetadata: holesOverride || editedHoles,
      imageUrl: imageUrl.trim() || undefined,
      isLocked: isLocked,
      courseMaster: course.courseMaster || authorName,
      contributorName: authorName,
      contributedAt: todayStr,
      contributionHistory: updatedHistory,
    };
    ParkOnStorage.updateCourse(updatedCourse);
    onSaved(updatedCourse);
    return updatedCourse;
  };

  const handleCourseInfoConfirm = () => {
    const cleanName = draftCourseName.trim();
    if (!cleanName) {
      alert('골프장 이름을 입력해 주세요.');
      return;
    }
    const nextCount = Math.max(1, Math.min(12, draftCourseCount));
    const requiredHoles = nextCount * 9;
    const nextHoles = [...editedHoles];
    if (nextHoles.length < requiredHoles) {
      const std = generateStandardHoles(requiredHoles);
      for (let i = nextHoles.length; i < requiredHoles; i++) {
        nextHoles.push(std[i] || { hole: i + 1, par: 3, distanceMeter: 60, isVerified: false });
      }
    }
    const parsedAliases = Array.from(
      new Set(
        draftAliasesText
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s !== cleanName)
      )
    ).slice(0, 10);
    setEditedCourseName(cleanName);
    setEditedAliases(parsedAliases);
    setEditedCourseCount(nextCount);
    setEditedHoles(nextHoles);
    if (currentCourseIdx >= nextCount) {
      setCurrentCourseIdx(nextCount - 1);
    }
    const authorName = editorName.trim() || '현장 골퍼';
    persistCourseChanges(`구장 정보 수정 (${cleanName} · ${nextCount}코스 ${requiredHoles}홀)`, authorName, nextHoles, {
      name: cleanName,
      courseCount: nextCount,
      aliases: parsedAliases,
    });
    reportCourseBigDataLog({
      eventType: 'COURSE_INFO_EDIT',
      courseId: course.id,
      courseName: cleanName,
      aliases: parsedAliases,
      region: course.region,
      totalCourses: nextCount,
      totalHoles: requiredHoles,
      contributorName: authorName,
    });
    setShowCourseInfoPopup(false);
    setCourseInfoFlash(true);
    setTimeout(() => setCourseInfoFlash(false), 1400);
  };

  const handleOpenAddZone = () => {
    const baseName = (draftCourseName || editedCourseName)
      .replace(/\s*\(?\d+구장\)?\s*$/g, '')
      .replace(/\s*제?\d+구장\s*$/g, '')
      .trim() || editedCourseName;
    const all = ParkOnStorage.getAllCourses();
    let nextZoneNum = 2;
    while (
      all.some((c) => {
        const norm = c.name.replace(/\s+/g, '');
        return (
          norm === `${baseName}(${nextZoneNum}구장)`.replace(/\s+/g, '') ||
          norm === `${baseName}${nextZoneNum}구장`.replace(/\s+/g, '')
        );
      })
    ) {
      nextZoneNum += 1;
    }
    setZoneDraftName(`${baseName} (${nextZoneNum}구장)`);
    setZoneDraftCount(Math.max(1, Math.min(12, draftCourseCount)));
    setShowAddZonePopup(true);
  };

  const handleAddZoneConfirm = () => {
    const cleanName = zoneDraftName.trim();
    if (!cleanName) {
      alert('새 구역(구장) 이름을 입력해 주세요.');
      return;
    }
    const nextCount = Math.max(1, Math.min(12, zoneDraftCount));
    const totalHoles = nextCount * 9;
    const todayStr = new Date().toISOString().split('T')[0];
    const authorName = editorName.trim() || '현장 골퍼';
    const newZoneCourse: Course = {
      ...course,
      id: `course-zone-${Date.now()}`,
      name: cleanName,
      nameKo: isJapanese ? course.nameKo : cleanName,
      nameJa: isJapanese ? cleanName : course.nameJa,
      totalCourses: nextCount,
      totalHoles,
      holesMetadata: generateStandardHoles(totalHoles),
      isVerified: false,
      isSpecsVerified: false,
      isLocked: false,
      courseMaster: authorName,
      contributorName: authorName,
      contributedAt: todayStr,
      createdAt: new Date().toISOString(),
      contributionHistory: [
        {
          author: authorName,
          date: todayStr,
          action: `별도 구역 새 구장 생성 (${cleanName} · ${nextCount}코스 ${totalHoles}홀)`,
        },
      ],
    };
    ParkOnStorage.updateCourse(newZoneCourse);
    reportCourseBigDataLog({
      eventType: 'ADD_ZONE_COURSE',
      courseId: newZoneCourse.id,
      courseName: cleanName,
      region: course.region,
      totalCourses: nextCount,
      totalHoles,
      contributorName: authorName,
    });
    onSaved(newZoneCourse);
    setShowAddZonePopup(false);
    setShowCourseInfoPopup(false);
    setCourseInfoFlash(true);
    setTimeout(() => setCourseInfoFlash(false), 1600);
  };

  const handleSingleHoleConfirm = (holeNumber: number, holeLabel: string) => {
    const authorName = editorName.trim() || '현장 골퍼';
    persistCourseChanges(`${holeLabel} 제원 현장 확인·수정`, authorName);
    setEditingHoleNum(null);
    setHoleConfirmFlash(holeNumber);
    setTimeout(() => setHoleConfirmFlash(null), 1200);
  };

  const handlePopupHoleConfirm = () => {
    if (!holePopupDraft) return;
    const nextHoles = editedHoles.map((h) =>
      h.hole === holePopupDraft.holeNumber
        ? { ...h, par: holePopupDraft.par, distanceMeter: holePopupDraft.distanceMeter, isVerified: true }
        : h
    );
    setEditedHoles(nextHoles);
    const authorName = editorName.trim() || '현장 골퍼';
    const holeLabel = `${holePopupDraft.courseLetter}-${holePopupDraft.holeInCourse}홀`;
    persistCourseChanges(`${holeLabel} 제원 현장 확인·수정`, authorName, nextHoles);
    reportCourseBigDataLog({
      eventType: 'HOLE_SPEC_EDIT',
      courseId: course.id,
      courseName: editedCourseName,
      region: course.region,
      holeNumber: holePopupDraft.holeNumber,
      courseLetter: holePopupDraft.courseLetter,
      holeInCourse: holePopupDraft.holeInCourse,
      par: holePopupDraft.par,
      distanceMeter: holePopupDraft.distanceMeter,
      contributorName: authorName,
    });
    const savedHole = holePopupDraft.holeNumber;
    setHolePopupDraft(null);
    setHoleConfirmFlash(savedHole);
    setTimeout(() => setHoleConfirmFlash(null), 1200);
  };

  // 제원 정정 저장
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName.trim()) {
      alert('실측 제원 검증 및 명예의 전당 등록을 위해 기여자 성함(또는 닉네임)을 입력해 주세요.');
      return;
    }
    persistCourseChanges(`${currentCourseLetter}코스 홀별 거리(m) 및 기준타수(Par) 현장 실측 정정`, editorName.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setIsEditing(false);
      setEditingHoleNum(null);
      setSavedSuccess(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header (초슬림 구장 실측 정보 제목만 노출) */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 px-4 py-3 text-white flex items-center justify-between shrink-0 shadow-sm">
          {(() => {
            const dual = getCourseDualName(
              {
                ...course,
                name: editedCourseName,
                nameKo: isJapanese ? course.nameKo : editedCourseName,
                nameJa: isJapanese ? editedCourseName : course.nameJa,
              },
              isJapanese
            );
            return (
              <div className="min-w-0 flex-1 pr-2">
                <span
                  data-testid="course-detail-header-name"
                  className="font-black text-base sm:text-lg text-white tracking-tight truncate flex items-center gap-1.5"
                >
                  {dual.flag && <span>{dual.flag}</span>}
                  <span>{dual.primary}</span>
                </span>
              </div>
            );
          })()}

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              data-testid="btn-course-info-edit"
              onClick={() => {
                setDraftCourseName(editedCourseName);
                setDraftAliasesText(editedAliases.join(', '));
                setDraftCourseCount(editedCourseCount);
                setShowCourseInfoPopup(true);
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                courseInfoFlash
                  ? 'bg-emerald-500 text-white border border-emerald-300'
                  : 'bg-white/20 hover:bg-white/30 text-amber-300 border border-white/20'
              }`}
            >
              <Edit2 className="w-3 h-3" />
              <span>{courseInfoFlash ? '✓ 수정됨' : '구장 수정'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
              title="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* 최상단 2단 보조 탭: [📓 홀별 공략집 (미리보기·편집)] vs [🌱 오늘의 구장 상태] */}
        <div className="px-3 pt-2.5 pb-2 bg-stone-100 border-b border-stone-200 shrink-0 space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-200/90 rounded-2xl">
            <button
              type="button"
              data-testid="tab-course-detail-yardage"
              onClick={() => setActiveDetailTab('YARDAGE')}
              className={`py-2 px-2 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer ${
                activeDetailTab === 'YARDAGE'
                  ? 'bg-emerald-800 text-amber-300 shadow-sm'
                  : 'text-stone-700 hover:text-stone-950 font-bold'
              }`}
            >
              <span>📓 홀별 공략집</span>
            </button>
            <button
              type="button"
              data-testid="tab-course-detail-today"
              onClick={() => setActiveDetailTab('TODAY')}
              className={`py-2 px-2 rounded-xl font-black text-[11px] sm:text-xs transition flex items-center justify-center gap-1 cursor-pointer ${
                activeDetailTab === 'TODAY'
                  ? 'bg-emerald-800 text-amber-300 shadow-sm'
                  : 'text-stone-700 hover:text-stone-950 font-bold'
              }`}
            >
              <span>🌱 오늘의 구장 상태</span>
            </button>
          </div>
        </div>

        {activeDetailTab === 'TODAY' ? (
          <div className="flex-1 overflow-y-auto p-3.5">
            <CourseTodayContent course={course} isActive={true} />
          </div>
        ) : (
          <>

            {/* 2. [핵심] A, B, C, D 코스 대형 탭 버튼 (상단 고정 노출) */}
            <div className="p-3 bg-stone-100 border-b border-stone-200 shrink-0 space-y-2">
              <div className={`grid gap-1.5 ${
                availableCourses.length === 1
                  ? 'grid-cols-1'
                  : availableCourses.length === 2
                  ? 'grid-cols-2'
                  : availableCourses.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-4'
              }`}>
                {availableCourses.map((letter, idx) => {
                  const isActive = currentCourseIdx === idx;

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setCurrentCourseIdx(idx)}
                      className={`py-2 px-1 rounded-2xl text-center transition cursor-pointer active:scale-97 border ${
                        isActive
                          ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-500'
                          : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200/80 shadow-2xs'
                      }`}
                    >
                      <div className={`text-sm sm:text-base font-black leading-tight ${isActive ? 'text-amber-300' : 'text-stone-900'}`}>
                        {letter} 코스
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

        {/* 3. 본문 스크롤: 9개 홀 카드 리스트 */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5">
          {/* 정정 모드 안내 배너 */}
          {isEditing && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 text-xs text-amber-950 font-bold space-y-1">
              <div className="flex items-center gap-1 text-amber-800 font-black">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>[실측 제원 정정 모드]가 활성화되었습니다.</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-snug">
                현장 티박스 공식 팻말에 적힌 거리(m)와 Par를 정확히 입력해 주시면 전체 골퍼에게 공유됩니다.
              </p>
            </div>
          )}

          {/* 9개 홀 상세 카드 (오직 C-1, C-2... 스타일로 표기) */}
          <div className="space-y-2">
            {currentHoles.map((h) => {
              const holeInCourse = ((h.hole - 1) % 9) + 1;
              const isHoleEditing = isEditing || editingHoleNum === h.hole;
              const yId = buildYardageNoteId(course.id, currentCourseLetter, holeInCourse);
              const hasY = Boolean(yardageNotesMap[yId]);
              const openHoleYardage = () =>
                setYardageTargetHole({
                  courseLetter: currentCourseLetter,
                  holeInCourse,
                  holeNumber: h.hole,
                  par: (h.par as 3 | 4 | 5) || 3,
                  officialDistance: h.distanceMeter || 60,
                });

              return (
                <div
                  key={h.hole}
                  onClick={() => {
                    if (!isHoleEditing) openHoleYardage();
                  }}
                  className={`rounded-2xl px-3 py-2.5 border transition flex flex-col gap-1.5 shadow-2xs ${
                    isHoleEditing
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white hover:bg-stone-50/80 border-stone-200 cursor-pointer active:scale-[0.99]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* 홀 번호 + 공략메모 탭 (작성 및 보기) */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-11 h-10 rounded-xl bg-emerald-800 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {currentCourseLetter}-{holeInCourse}
                      </span>
                      <button
                        type="button"
                        data-testid={`btn-course-yardage-${currentCourseLetter}-${holeInCourse}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openHoleYardage();
                        }}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border cursor-pointer transition active:scale-95 shrink-0 ${
                          hasY
                            ? 'bg-amber-100 text-amber-950 border-amber-400 shadow-2xs'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span>공략메모</span>
                        {hasY && (
                          <span
                            data-testid={`yardage-badge-dot-${currentCourseLetter}-${holeInCourse}`}
                            className="w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-amber-400"
                          />
                        )}
                      </button>
                    </div>

                    {/* Par & 거리 + 홀별 수정 탭 */}
                    <div
                      className="flex items-center gap-1.5 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isHoleEditing ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={h.par}
                            onChange={(e) => handleHoleChange(h.hole, 'par', Number(e.target.value))}
                            className="bg-white border-2 border-emerald-600 rounded-lg px-2 py-1 font-black text-xs text-stone-900 outline-none"
                          >
                            <option value={3}>Par 3</option>
                            <option value={4}>Par 4</option>
                            <option value={5}>Par 5</option>
                          </select>
                          <div className="flex items-center gap-0.5">
                            <input
                              type="text"
                              inputMode="numeric"
                              data-testid={`input-hole-dist-${currentCourseLetter}-${holeInCourse}`}
                              value={h.distanceMeter === 0 ? '' : String(h.distanceMeter)}
                              placeholder="0"
                              onChange={(e) => {
                                const digits = e.target.value.replace(/[^0-9]/g, '');
                                handleHoleChange(h.hole, 'distanceMeter', digits === '' ? 0 : Number(digits));
                              }}
                              className="w-14 bg-white border-2 border-emerald-600 rounded-lg px-1 py-1 font-black text-xs text-center text-stone-900 outline-none"
                            />
                            <span className="text-xs font-black text-stone-600">m</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 justify-end">
                          <span className="bg-stone-100 text-stone-800 text-xs font-black px-2 py-0.5 rounded-lg border border-stone-200">
                            Par {h.par}
                          </span>
                          <span className="text-sm font-black text-emerald-800">
                            {h.distanceMeter}m
                          </span>
                          <button
                            type="button"
                            data-testid={`btn-hole-edit-${currentCourseLetter}-${holeInCourse}`}
                            onClick={() =>
                              setHolePopupDraft({
                                holeNumber: h.hole,
                                courseLetter: currentCourseLetter,
                                holeInCourse,
                                par: h.par === 3 || h.par === 4 || h.par === 5 ? h.par : 3,
                                distanceMeter: h.distanceMeter || 0,
                              })
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-black border cursor-pointer transition ${
                              holeConfirmFlash === h.hole
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-stone-100 hover:bg-amber-100 text-stone-700 border-stone-300'
                            }`}
                          >
                            {holeConfirmFlash === h.hole ? '✓ 저장됨' : '✏️ 거리수정'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 정정 모드 시 로컬룰/공략팁 직접 편집 + 홀별 즉시 확인 버튼 */}
                  {isHoleEditing && (
                    <div className="pt-1.5 border-t border-amber-200/60 mt-0.5 flex items-center gap-1.5">
                      <input
                        type="text"
                        placeholder="현장 로컬룰 또는 공략 팁 (예: 좌측 OB 주의, 1클럽 구제 등)"
                        value={h.localRule || h.tip || ''}
                        onChange={(e) => handleHoleChange(h.hole, 'localRule', e.target.value)}
                        className="flex-1 min-w-0 bg-white border border-stone-300 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-emerald-600"
                      />
                      {editingHoleNum === h.hole && !isEditing && (
                        <button
                          type="button"
                          onClick={() => setEditingHoleNum(null)}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-700 font-black text-xs cursor-pointer shrink-0"
                        >
                          취소
                        </button>
                      )}
                      <button
                        type="button"
                        data-testid={`btn-hole-confirm-${currentCourseLetter}-${holeInCourse}`}
                        onClick={() => handleSingleHoleConfirm(h.hole, `${currentCourseLetter}-${holeInCourse}홀`)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs cursor-pointer shrink-0 shadow-xs active:scale-95 transition"
                      >
                        ✓ 확인
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 제원 정정 저장 폼 */}
          {isEditing && (
            <form onSubmit={handleSave} className="bg-stone-50 rounded-2xl p-3.5 border-2 border-amber-400 space-y-2.5 mt-3">
              <div>
                <label className="text-xs font-black text-stone-800 block mb-1">
                  👑 기여자 성함 또는 닉네임 (명예의 전당 등록)
                </label>
                <input
                  type="text"
                  placeholder="예: 김프로, 구미파크클럽 대장"
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black py-2.5 rounded-xl text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{currentCourseLetter}코스 실측 제원 확정 저장 ✍️</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 성공 메시지 */}
          {savedSuccess && (
            <div className="bg-emerald-600 text-white font-black text-xs p-3 rounded-xl text-center shadow animate-pulse">
              🎉 {currentCourseLetter}코스 실측 제원이 성공적으로 저장되었습니다!
            </div>
          )}

          {/* 보조: 안내도 사진 및 명예의 전당 (접기/펼치기) */}
          <div className="pt-2 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setShowPhotoSection(!showPhotoSection)}
              className="text-xs font-bold text-stone-500 hover:text-stone-800 flex items-center justify-between w-full py-1 cursor-pointer"
            >
              <span>📷 구장 안내도 사진 및 명예의 전당 히스토리</span>
              <span>{showPhotoSection ? '▲ 닫기' : '▼ 보기'}</span>
            </button>

            {showPhotoSection && (
              <div className="space-y-3 pt-2">
                {/* 사진 */}
                <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-stone-700 flex items-center gap-1">
                      <Camera className="w-3.5 h-3.5 text-emerald-700" />
                      <span>구장 코스 안내도 &amp; 스코어카드 사진</span>
                    </span>
                    <label className="text-[10px] bg-emerald-700 hover:bg-emerald-600 text-white font-black px-2 py-1 rounded-lg cursor-pointer transition">
                      <span>+ 사진 업로드</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                  </div>
                  {imageUrl ? (
                    <div className="rounded-xl overflow-hidden border border-stone-200 max-h-48 bg-black/5 flex items-center justify-center">
                      <img src={imageUrl} alt="구장 안내도" className="w-full h-auto object-cover" />
                    </div>
                  ) : (
                    <div className="border border-dashed border-stone-300 rounded-xl p-3 text-center text-stone-400 text-xs">
                      등록된 안내도 사진이 없습니다.
                    </div>
                  )}
                </div>

                {/* 명예의 전당 */}
                {course.contributionHistory && course.contributionHistory.length > 0 && (
                  <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-1.5">
                    <div className="text-xs font-black text-stone-700 flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-amber-600" />
                      <span>명예의 전당 제원 기여 히스토리</span>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {course.contributionHistory.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-lg border border-stone-100">
                          <span className="font-bold text-stone-900">👑 {h.author} ({h.action})</span>
                          <span className="text-[10px] text-stone-400">{h.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    )}

        {/* 4. Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black rounded-xl text-xs transition cursor-pointer"
          >
            창 닫기
          </button>
          <Link
            href={`/round/new?courseId=${course.id}`}
            onClick={onClose}
            className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>이 구장서 라운딩 시작</span>
          </Link>
        </div>
      </div>

      {/* 대형 구장 수정 전용 팝업창 (골프장명 + 코스 수) */}
      {showCourseInfoPopup && (
        <div
          data-testid="course-info-edit-popup"
          className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowCourseInfoPopup(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-700/30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-amber-300" />
                <span className="font-black text-lg tracking-tight text-white">
                  구장 수정
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowCourseInfoPopup(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-base font-black transition cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 팝업 본문: 골프장명 입력 + 코스 수 선택 */}
            <div className="p-5 space-y-6">
              {/* 1. 골프장명 수정 */}
              <div>
                <label className="text-sm font-black text-stone-700 block mb-2">
                  골프장명
                </label>
                <input
                  type="text"
                  data-testid="input-popup-course-name"
                  value={draftCourseName}
                  onChange={(e) => setDraftCourseName(e.target.value)}
                  placeholder="골프장 이름을 입력하세요"
                  className="w-full bg-emerald-50/70 border-2 border-emerald-600 rounded-2xl px-4 py-3.5 text-xl font-black text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* 1-2. 구장 별칭 입력 (검색 연동 · 빅데이터 수집) */}
              <div>
                <label className="text-sm font-black text-stone-700 block mb-1.5">
                  구장 별칭 <span className="text-xs font-bold text-stone-400">(선택 · 쉼표로 여러 개)</span>
                </label>
                <input
                  type="text"
                  data-testid="input-popup-course-aliases"
                  value={draftAliasesText}
                  onChange={(e) => setDraftAliasesText(e.target.value)}
                  placeholder="예: 삼국유사, 충주호, 강나루"
                  className="w-full bg-stone-50 border-2 border-stone-300 focus:border-emerald-600 rounded-2xl px-4 py-2.5 text-base font-bold text-stone-900 placeholder:text-stone-400 outline-none transition"
                />
              </div>

              {/* 2. 코스 수 선택 (좌우 - / + 스텝퍼) */}
              <div>
                <label className="text-sm font-black text-stone-700 block mb-2.5">
                  코스 수 선택
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="btn-popup-course-count-minus"
                    disabled={draftCourseCount <= 1}
                    onClick={() => setDraftCourseCount((prev) => Math.max(1, prev - 1))}
                    className={`w-16 h-16 rounded-2xl border-2 text-4xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                      draftCourseCount <= 1
                        ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 border-stone-300 shadow-xs'
                    }`}
                    aria-label="코스 수 감소"
                  >
                    −
                  </button>

                  <div className="flex-1 bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl py-2.5 px-3 text-center shadow-inner">
                    <div className="flex items-baseline justify-center gap-1">
                      <span
                        data-testid="text-popup-course-count"
                        className="text-4xl font-black text-emerald-950 leading-none"
                      >
                        {draftCourseCount}
                      </span>
                      <span className="text-xl font-black text-emerald-800">코스</span>
                    </div>
                    <div className="text-xs font-black text-emerald-700 mt-1">
                      {draftCourseCount === 1
                        ? 'A 코스 · 총 9홀'
                        : `A~${COURSE_LETTERS[draftCourseCount - 1]} 코스 · 총 ${draftCourseCount * 9}홀`}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="btn-popup-course-count-plus"
                    disabled={draftCourseCount >= 12}
                    onClick={() => setDraftCourseCount((prev) => Math.min(12, prev + 1))}
                    className={`w-16 h-16 rounded-2xl border-2 text-4xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                      draftCourseCount >= 12
                        ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-amber-300 border-emerald-800 shadow-md'
                    }`}
                    aria-label="코스 수 증가"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 3. 별도 구역 (2구장 등) 새 구장 추가 */}
              <button
                type="button"
                data-testid="btn-open-add-zone"
                onClick={handleOpenAddZone}
                className="w-full border-2 border-dashed border-emerald-500 bg-emerald-50 hover:bg-emerald-100/80 active:scale-[0.99] rounded-2xl p-3.5 flex items-center justify-between gap-2.5 text-left transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-sm font-black text-emerald-900">
                    + 별도 구역 (2구장 등) 추가
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700 leading-snug mt-0.5">
                    A코스부터 다시 시작하는 구역이 있을 때 새 구장으로 1초 분리
                  </div>
                </div>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-700 text-amber-300 text-xs font-black shrink-0 shadow-xs">
                  구역 추가
                </span>
              </button>
            </div>

            {/* 팝업 하단 버튼 */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowCourseInfoPopup(false)}
                className="py-4 rounded-2xl bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black text-lg cursor-pointer transition"
              >
                취소
              </button>
              <button
                type="button"
                data-testid="btn-popup-course-info-confirm"
                onClick={handleCourseInfoConfirm}
                className="py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-black text-lg shadow-md cursor-pointer transition"
              >
                ✓ 수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 별도 구역(2구장 등) 새 구장 생성 팝업창 */}
      {showAddZonePopup && (
        <div
          data-testid="add-zone-course-popup"
          className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowAddZonePopup(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-600/40 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 text-xl font-black leading-none">+</span>
                <span className="font-black text-lg tracking-tight text-white">
                  별도 구역 (새 구장) 추가
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddZonePopup(false)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-base font-black transition cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <label className="text-sm font-black text-stone-700 block mb-2">
                  새 구장명 (예: 구장명 2구장)
                </label>
                <input
                  type="text"
                  data-testid="input-add-zone-name"
                  value={zoneDraftName}
                  onChange={(e) => setZoneDraftName(e.target.value)}
                  placeholder="예: 한림술뫼 (2구장)"
                  className="w-full bg-emerald-50/70 border-2 border-emerald-600 rounded-2xl px-4 py-3.5 text-xl font-black text-emerald-950 outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="text-sm font-black text-stone-700 block mb-2.5">
                  새 구역 코스 수 선택
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="btn-add-zone-minus"
                    disabled={zoneDraftCount <= 1}
                    onClick={() => setZoneDraftCount((prev) => Math.max(1, prev - 1))}
                    className={`w-16 h-16 rounded-2xl border-2 text-4xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                      zoneDraftCount <= 1
                        ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 border-stone-300 shadow-xs'
                    }`}
                    aria-label="새 구역 코스 수 감소"
                  >
                    −
                  </button>

                  <div className="flex-1 bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl py-2.5 px-3 text-center shadow-inner">
                    <div className="flex items-baseline justify-center gap-1">
                      <span
                        data-testid="text-add-zone-count"
                        className="text-4xl font-black text-emerald-950 leading-none"
                      >
                        {zoneDraftCount}
                      </span>
                      <span className="text-xl font-black text-emerald-800">코스</span>
                    </div>
                    <div className="text-xs font-black text-emerald-700 mt-1">
                      {zoneDraftCount === 1
                        ? 'A 코스 · 총 9홀'
                        : `A~${COURSE_LETTERS[zoneDraftCount - 1]} 코스 · 총 ${zoneDraftCount * 9}홀`}
                    </div>
                  </div>

                  <button
                    type="button"
                    data-testid="btn-add-zone-plus"
                    disabled={zoneDraftCount >= 12}
                    onClick={() => setZoneDraftCount((prev) => Math.min(12, prev + 1))}
                    className={`w-16 h-16 rounded-2xl border-2 text-4xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                      zoneDraftCount >= 12
                        ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                        : 'bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-amber-300 border-emerald-800 shadow-md'
                    }`}
                    aria-label="새 구역 코스 수 증가"
                  >
                    +
                  </button>
                </div>
              </div>

              <p className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 leading-relaxed">
                기존 구장의 지역·주소·위치 정보가 자동 복사되어 <b>A코스부터 시작하는 별개 구장</b>으로 바로 등록됩니다.
              </p>
            </div>

            <div className="p-4 bg-stone-50 border-t border-stone-200 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setShowAddZonePopup(false)}
                className="py-4 rounded-2xl bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black text-lg cursor-pointer transition"
              >
                취소
              </button>
              <button
                type="button"
                data-testid="btn-confirm-add-zone"
                onClick={handleAddZoneConfirm}
                className="py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-black text-lg shadow-md cursor-pointer transition"
              >
                ✓ 새 구장 생성
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 대형 파수 · 거리 수정 전용 팝업창 */}
      {holePopupDraft && (
        <div
          data-testid="hole-spec-edit-popup"
          className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHolePopupDraft(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border-2 border-emerald-700/30 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="bg-amber-300 text-emerald-950 font-black text-lg px-3 py-1 rounded-xl shadow-xs">
                  {holePopupDraft.courseLetter}-{holePopupDraft.holeInCourse}홀
                </span>
                <span className="font-black text-lg tracking-tight text-white">
                  파수 · 거리 수정
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHolePopupDraft(null)}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center text-base font-black transition cursor-pointer"
                title="닫기"
              >
                ✕
              </button>
            </div>

            {/* 팝업 본문: 대형 파수(Par) 선택 + 대형 거리(m) 입력 */}
            <div className="p-5 space-y-6">
              {/* 1. 파수 (Par) 선택 */}
              <div>
                <label className="text-sm font-black text-stone-700 block mb-2.5">
                  기준타수 (Par) 선택
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {([3, 4, 5] as const).map((parVal) => {
                    const active = holePopupDraft.par === parVal;
                    return (
                      <button
                        key={parVal}
                        type="button"
                        data-testid={`btn-popup-par-${parVal}`}
                        onClick={() => setHolePopupDraft((prev) => (prev ? { ...prev, par: parVal } : prev))}
                        className={`py-4 rounded-2xl text-2xl font-black border-2 transition active:scale-95 cursor-pointer ${
                          active
                            ? 'bg-emerald-700 text-amber-300 border-emerald-800 shadow-lg ring-2 ring-emerald-400'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                        }`}
                      >
                        Par {parVal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 홀 거리 (m) 입력 */}
              <div>
                <label className="text-sm font-black text-stone-700 block mb-2.5">
                  홀 거리 (m) 입력
                </label>
                <div className="flex items-center justify-center gap-2 bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl px-4 py-3.5 shadow-inner">
                  <input
                    type="text"
                    inputMode="numeric"
                    data-testid="input-popup-hole-dist"
                    value={holePopupDraft.distanceMeter === 0 ? '' : String(holePopupDraft.distanceMeter)}
                    placeholder="0"
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, '');
                      setHolePopupDraft((prev) =>
                        prev ? { ...prev, distanceMeter: digits === '' ? 0 : Math.min(999, Number(digits)) } : prev
                      );
                    }}
                    className="w-40 bg-transparent text-center text-5xl font-black text-emerald-950 outline-none tracking-tight"
                  />
                  <span className="text-3xl font-black text-emerald-700">m</span>
                </div>

                {/* 빠른 거리 조절 버튼 */}
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[-10, -1, 1, 10].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() =>
                        setHolePopupDraft((prev) =>
                          prev
                            ? { ...prev, distanceMeter: Math.max(0, Math.min(999, (prev.distanceMeter || 0) + delta)) }
                            : prev
                        )
                      }
                      className="py-3 rounded-xl bg-stone-100 hover:bg-stone-200 active:scale-95 border border-stone-300 text-base font-black text-stone-800 cursor-pointer transition"
                    >
                      {delta > 0 ? `+${delta}m` : `${delta}m`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 팝업 하단 버튼 */}
            <div className="p-4 bg-stone-50 border-t border-stone-200 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setHolePopupDraft(null)}
                className="py-4 rounded-2xl bg-stone-200 hover:bg-stone-300 active:scale-98 text-stone-800 font-black text-lg cursor-pointer transition"
              >
                취소
              </button>
              <button
                type="button"
                data-testid="btn-popup-hole-confirm"
                onClick={handlePopupHoleConfirm}
                className="py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 active:scale-98 text-white font-black text-lg shadow-md cursor-pointer transition"
              >
                ✓ 수정 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 대표님 원칙 2단계: 구장별 실시간 명예의 전당 (최다 완주 TOP 10) */}
      <CourseHallOfFameModal
        isOpen={showHallOfFameModal}
        onClose={() => setShowHallOfFameModal(false)}
        courseId={course.id}
        courseName={course.name}
      />

      {yardageTargetHole && (() => {
        const cIdx = Math.max(0, availableCourses.indexOf(yardageTargetHole.courseLetter));
        const hasPrev = !(cIdx === 0 && yardageTargetHole.holeInCourse === 1);
        const hasNext = !(cIdx === availableCourses.length - 1 && yardageTargetHole.holeInCourse === 9);
        const goPrev = () => {
          if (yardageTargetHole.holeInCourse > 1) {
            openHoleYardage(yardageTargetHole.courseLetter, yardageTargetHole.holeInCourse - 1);
          } else if (cIdx > 0) {
            openHoleYardage(availableCourses[cIdx - 1], 9);
          }
        };
        const goNext = () => {
          if (yardageTargetHole.holeInCourse < 9) {
            openHoleYardage(yardageTargetHole.courseLetter, yardageTargetHole.holeInCourse + 1);
          } else if (cIdx < availableCourses.length - 1) {
            openHoleYardage(availableCourses[cIdx + 1], 1);
          }
        };
        return (
          <YardageBookModal
            isOpen={true}
            onClose={() => setYardageTargetHole(null)}
            courseId={course.id}
            courseName={course.name}
            courseLetter={yardageTargetHole.courseLetter}
            holeInCourse={yardageTargetHole.holeInCourse}
            holeNumber={yardageTargetHole.holeNumber}
            par={yardageTargetHole.par}
            officialDistance={yardageTargetHole.officialDistance}
            availableCourses={availableCourses}
            savedHoleIds={new Set(Object.keys(yardageNotesMap))}
            onSelectHole={(letter, hInC) => openHoleYardage(letter, hInC)}
            onPrevHole={hasPrev ? goPrev : undefined}
            onNextHole={hasNext ? goNext : undefined}
          />
        );
      })()}
    </div>
  );
}
