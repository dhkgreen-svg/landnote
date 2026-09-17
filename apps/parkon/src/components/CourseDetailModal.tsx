'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Award, CheckCircle2, Camera, Edit2, Lock, Unlock, Save, ShieldCheck, History, Play, AlertTriangle } from 'lucide-react';
import { Course, HoleMetadata, CourseContribution } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onSaved: (updated: Course) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function CourseDetailModal({ course, onClose, onSaved }: CourseDetailModalProps) {
  // 동락파크골프장 또는 36홀 이상인 경우 최소 4코스(A, B, C, D) 보장
  const isDongrakOr36 = course.name.includes('동락') || (course.totalHoles && course.totalHoles >= 36);
  const totalCoursesCount = Math.max(
    course.totalCourses || 0,
    Math.round((course.totalHoles || 0) / 9),
    isDongrakOr36 ? 4 : 1
  );
  const availableCourses = COURSE_LETTERS.slice(0, Math.max(totalCoursesCount, 4));
  const totalRequiredHoles = availableCourses.length * 9;

  // 전체 홀 데이터가 부족할 경우 36홀 표준 홀로 자동 보강
  const initialHoles: HoleMetadata[] = [...(course.holesMetadata || [])];
  if (initialHoles.length < totalRequiredHoles) {
    const std = generateStandardHoles(totalRequiredHoles);
    for (let i = initialHoles.length; i < totalRequiredHoles; i++) {
      initialHoles.push(std[i] || { hole: i + 1, par: 4, distanceMeter: 70 });
    }
  }

  const [currentCourseIdx, setCurrentCourseIdx] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedHoles, setEditedHoles] = useState<HoleMetadata[]>(initialHoles);
  const [editorName, setEditorName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(course.imageUrl || '');
  const [isLocked, setIsLocked] = useState<boolean>(course.isLocked || false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showPhotoSection, setShowPhotoSection] = useState<boolean>(false);

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

  // 제원 정정 저장
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName.trim()) {
      alert('실측 제원 검증 및 명예의 전당 등록을 위해 기여자 성함(또는 닉네임)을 입력해 주세요.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newHistoryEntry: CourseContribution = {
      author: editorName.trim(),
      date: todayStr,
      action: `${currentCourseLetter}코스 홀별 거리(m) 및 기준타수(Par) 현장 실측 정정`,
    };

    const existingHistory = course.contributionHistory || [];
    const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 15);

    const updatedCourse: Course = {
      ...course,
      totalCourses: availableCourses.length,
      totalHoles: Math.max(course.totalHoles || 0, totalRequiredHoles),
      holesMetadata: editedHoles,
      imageUrl: imageUrl.trim() || undefined,
      isLocked: isLocked,
      courseMaster: course.courseMaster || editorName.trim(),
      contributorName: editorName.trim(),
      contributedAt: todayStr,
      contributionHistory: updatedHistory,
    };

    ParkOnStorage.updateCourse(updatedCourse);
    setSavedSuccess(true);
    setTimeout(() => {
      onSaved(updatedCourse);
      setIsEditing(false);
      setSavedSuccess(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-stone-200 animate-in fade-in zoom-in-95 duration-200">
        {/* 1. Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="min-w-0 flex-1 pr-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                {course.name} 실측 정보
              </h3>
              <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                공식 제원
              </span>
            </div>
            <p className="text-[11px] text-emerald-200 mt-0.5 truncate">
              {course.region} · 총 {availableCourses.length}코스 {course.totalHoles || 36}홀 실측 제원표
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95 ${
                isEditing
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-amber-300 border border-white/20'
              }`}
            >
              <Edit2 className="w-3 h-3" />
              <span>{isEditing ? '정정 취소' : '제원 정정'}</span>
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

        {/* 2. [핵심] A, B, C, D 코스 대형 탭 버튼 (상단 고정 노출) */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 shrink-0 space-y-2">
          <div className="grid grid-cols-4 gap-1.5">
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
                  <div className={`text-[10px] font-bold mt-0.5 ${isActive ? 'text-emerald-200' : 'text-stone-500'}`}>
                    1~9홀 (9홀)
                  </div>
                </button>
              );
            })}
          </div>

          {/* 현재 코스 요약 띠 */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-black text-stone-800 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>{currentCourseLetter}코스 상세 제원 (1~9번 홀)</span>
            </span>
            <div className="font-black text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-lg border border-emerald-200">
              Par {totalParCurrent} · 총 {totalDistCurrent}m
            </div>
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
            {currentHoles.map((h, i) => {
              const holeInCourse = ((h.hole - 1) % 9) + 1;

              return (
                <div
                  key={h.hole}
                  className={`rounded-2xl p-3 border transition flex flex-col gap-1.5 shadow-2xs ${
                    isEditing
                      ? 'bg-amber-50/40 border-amber-300 ring-1 ring-amber-300'
                      : 'bg-white hover:bg-stone-50/80 border-stone-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    {/* 홀 번호: 오직 C-1, C-2 형태로만 표기 */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-10 h-10 rounded-xl bg-emerald-800 text-amber-300 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {currentCourseLetter}-{holeInCourse}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-base text-stone-900 tracking-tight">
                            {currentCourseLetter}-{holeInCourse}홀
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-bold leading-tight mt-0.5 truncate">
                          {h.localRule ? `⚠️ ${h.localRule}` : h.tip ? `💡 ${h.tip}` : '중앙 페어웨이 안전 공략'}
                        </p>
                      </div>
                    </div>

                    {/* Par & 거리 */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isEditing ? (
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
                              type="number"
                              value={h.distanceMeter}
                              onChange={(e) => handleHoleChange(h.hole, 'distanceMeter', Number(e.target.value))}
                              className="w-14 bg-white border-2 border-emerald-600 rounded-lg px-1 py-1 font-black text-xs text-center text-stone-900 outline-none"
                            />
                            <span className="text-xs font-black text-stone-600">m</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="bg-stone-100 text-stone-800 text-xs font-black px-2 py-0.5 rounded-lg border border-stone-200">
                              Par {h.par}
                            </span>
                            <span className="text-sm font-black text-emerald-800">
                              {h.distanceMeter}m
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 정정 모드 시 로컬룰/공략팁 직접 편집 */}
                  {isEditing && (
                    <div className="pt-1 border-t border-amber-200/60 mt-0.5">
                      <input
                        type="text"
                        placeholder="현장 로컬룰 또는 공략 팁 (예: 좌측 OB 주의, 1클럽 구제 등)"
                        value={h.localRule || h.tip || ''}
                        onChange={(e) => handleHoleChange(h.hole, 'localRule', e.target.value)}
                        className="w-full bg-white border border-stone-300 rounded-lg px-2.5 py-1 text-xs text-stone-800 placeholder:text-stone-400 outline-none focus:border-emerald-600"
                      />
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
    </div>
  );
}
