'use client';

import React, { useState } from 'react';
import { X, Award, CheckCircle2, Camera, Edit2, Lock, Unlock, Save, ShieldCheck, History, ChevronRight, AlertTriangle } from 'lucide-react';
import { Course, HoleMetadata, CourseContribution } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';

interface CourseDetailModalProps {
  course: Course;
  onClose: () => void;
  onSaved: (updated: Course) => void;
}

const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export function CourseDetailModal({ course, onClose, onSaved }: CourseDetailModalProps) {
  const totalCoursesCount = course.totalCourses || Math.max(1, Math.round(course.totalHoles / 9));
  const availableCourses = COURSE_LETTERS.slice(0, totalCoursesCount);

  const [currentCourseIdx, setCurrentCourseIdx] = useState<number>(0);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedHoles, setEditedHoles] = useState<HoleMetadata[]>(course.holesMetadata);
  const [editorName, setEditorName] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(course.imageUrl || '');
  const [isLocked, setIsLocked] = useState<boolean>(course.isLocked || false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const currentCourseLetter = availableCourses[currentCourseIdx] || 'A';
  const startHoleNum = currentCourseIdx * 9 + 1;
  const endHoleNum = Math.min(course.totalHoles, (currentCourseIdx + 1) * 9);

  // Filter 9 holes for active course
  const currentHoles = editedHoles.filter(
    (h) => h.hole >= startHoleNum && h.hole <= endHoleNum
  );

  // Total par and distance for current 9-hole course
  const totalParCurrent = currentHoles.reduce((sum, h) => sum + h.par, 0);
  const totalDistCurrent = currentHoles.reduce((sum, h) => sum + h.distanceMeter, 0);

  // Handle single hole field changes in edit mode
  const handleHoleChange = (holeNumber: number, field: 'par' | 'distanceMeter' | 'localRule', value: any) => {
    setEditedHoles((prev) =>
      prev.map((h) => (h.hole === holeNumber ? { ...h, [field]: value } : h))
    );
  };

  // Image Upload Handler (Convert to Base64)
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

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editorName.trim()) {
      alert('명예의 전당 등록을 위해 기여자 성함(닉네임)을 입력해 주세요.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newHistoryEntry: CourseContribution = {
      author: editorName.trim(),
      date: todayStr,
      action: `${currentCourseLetter}코스 홀별 거리 및 타수(Par) 실측 제원 정정`,
    };

    const existingHistory = course.contributionHistory || [];
    const updatedHistory = [newHistoryEntry, ...existingHistory].slice(0, 15);

    const updatedCourse: Course = {
      ...course,
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
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl p-5 shadow-2xl space-y-4 my-auto animate-scaleUp max-h-[92vh] flex flex-col">
        {/* 1. Header */}
        <div className="flex items-start justify-between border-b border-stone-100 pb-3 shrink-0">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-black text-xl text-stone-900 leading-tight">
                {course.name}
              </h3>
              {course.isLocked ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-700" />
                  <span>공식 제원 확정됨</span>
                </span>
              ) : (
                <span className="text-[10px] bg-amber-100 text-amber-800 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-amber-700" />
                  <span>실측 제원 정정 가능</span>
                </span>
              )}
            </div>
            <p className="text-xs text-stone-600 font-medium mt-0.5">
              {course.region} · 총 {totalCoursesCount}코스 {course.totalHoles}홀 코스
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 shrink-0"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* 2. 👑 Course Master & Hall of Fame Banner */}
          <div className="bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-full bg-amber-400 text-amber-950 font-black flex items-center justify-center text-lg shadow-sm">
                👑
              </span>
              <div>
                <div className="text-[11px] font-black text-amber-900">
                  구장 마스터 명예의 전당
                </div>
                <div className="text-sm font-black text-stone-900">
                  {course.courseMaster || course.contributorName || '구미파크골프협회 (검증 대기)'}
                </div>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] bg-white border border-amber-300 text-amber-950 font-black px-2 py-1 rounded-lg">
                기여도 Karma +50
              </span>
            </div>
          </div>

          {/* 3. Course Map Photo Section */}
          <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>구장 코스 안내도 & 현장 스코어카드 사진</span>
              </label>
              {isEditing && (
                <label className="text-[11px] bg-emerald-600 text-white font-black px-2 py-1 rounded-lg cursor-pointer hover:bg-emerald-500 transition">
                  <span>+ 사진 등록/변경</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {imageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-stone-200 max-h-44 bg-black/5 flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={`${course.name} 안내도`}
                  className="w-full h-auto object-cover"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-stone-300 rounded-xl p-4 text-center text-stone-500 text-xs">
                {isEditing ? (
                  <label className="cursor-pointer font-bold text-emerald-700 hover:underline">
                    여기를 눌러 현장 스코어카드 사진이나 구장 안내판 사진을 업로드하세요.
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <span>등록된 현장 안내도 사진이 없습니다. [제원 정정 모드]에서 사진을 등록할 수 있습니다.</span>
                )}
              </div>
            )}
          </div>

          {/* 4. Course Letter Tabs (A, B, C, D, E, F, G ...) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>코스 선택 (각 코스 9홀)</span>
              <span className="text-emerald-800 font-black">
                {currentCourseLetter}코스 ({startHoleNum}~{endHoleNum}번 홀)
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {availableCourses.map((letter, idx) => (
                <button
                  key={letter}
                  type="button"
                  onClick={() => setCurrentCourseIdx(idx)}
                  className={`px-3.5 py-1.5 rounded-xl font-black text-xs transition border ${
                    currentCourseIdx === idx
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow'
                      : 'bg-stone-100 text-stone-700 border-stone-200 hover:bg-stone-200'
                  }`}
                >
                  {letter}코스
                </button>
              ))}
            </div>
          </div>

          {/* 5. Holes Metadata Table (Par, Distance, Local Rule) */}
          <div className="bg-white rounded-2xl border-2 border-stone-200 overflow-hidden shadow-sm">
            <div className="bg-stone-100 px-3 py-2 border-b border-stone-200 flex items-center justify-between">
              <span className="font-extrabold text-xs text-stone-800">
                {currentCourseLetter}코스 홀별 상세 제원표
              </span>
              <div className="text-xs font-black text-emerald-900 flex items-center gap-2">
                <span>합계: Par {totalParCurrent}</span>
                <span>·</span>
                <span>총 {totalDistCurrent}m</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold">
                    <th className="py-2 px-1.5">홀</th>
                    <th className="py-2 px-1.5">기준타수(Par)</th>
                    <th className="py-2 px-1.5">거리(m)</th>
                    <th className="py-2 px-2 text-left">현장 로컬룰 및 공략</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-semibold text-stone-900">
                  {currentHoles.map((h, i) => (
                    <tr key={h.hole} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                      {/* Hole number */}
                      <td className="py-2.5 px-1.5 font-black text-emerald-800">
                        {h.hole}홀 ({i + 1})
                      </td>

                      {/* Par */}
                      <td className="py-2.5 px-1.5">
                        {isEditing ? (
                          <select
                            value={h.par}
                            onChange={(e) =>
                              handleHoleChange(h.hole, 'par', Number(e.target.value))
                            }
                            className="bg-white border-2 border-emerald-500 rounded-lg px-1.5 py-1 font-black text-xs outline-none"
                          >
                            <option value={3}>Par 3</option>
                            <option value={4}>Par 4</option>
                            <option value={5}>Par 5</option>
                          </select>
                        ) : (
                          <span className="font-black bg-stone-100 px-2 py-0.5 rounded text-stone-800">
                            Par {h.par}
                          </span>
                        )}
                      </td>

                      {/* Distance Meter */}
                      <td className="py-2.5 px-1.5">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-0.5">
                            <input
                              type="number"
                              value={h.distanceMeter}
                              onChange={(e) =>
                                handleHoleChange(h.hole, 'distanceMeter', Number(e.target.value))
                              }
                              className="w-14 bg-white border-2 border-emerald-500 rounded-lg px-1 py-1 font-black text-xs text-center outline-none"
                            />
                            <span className="text-[10px] text-stone-500">m</span>
                          </div>
                        ) : (
                          <span className="font-black text-stone-800">{h.distanceMeter}m</span>
                        )}
                      </td>

                      {/* Local Rule / Tip */}
                      <td className="py-2.5 px-2 text-left">
                        {isEditing ? (
                          <input
                            type="text"
                            value={h.localRule || ''}
                            onChange={(e) =>
                              handleHoleChange(h.hole, 'localRule', e.target.value)
                            }
                            placeholder="예: 우측 안전망 2벌타 OB"
                            className="w-full bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-medium outline-none focus:border-emerald-500"
                          />
                        ) : (
                          <span className="text-[11px] text-stone-700 truncate max-w-[140px] block">
                            {h.localRule || '정상 플레이'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 6. Edit & Save Section */}
          {!isEditing ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div>
                <div className="text-xs font-black text-emerald-950">
                  실제 구장과 타수나 거리가 다른가요?
                </div>
                <div className="text-[11px] text-emerald-800 mt-0.5">
                  누구나 터치 한 번으로 실제 스코어카드 제원으로 정정할 수 있습니다.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditorName(course.contributorName || '');
                  setIsEditing(true);
                }}
                className="bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs px-3 py-2 rounded-xl shadow flex items-center gap-1 shrink-0"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>제원 정정하기</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSave} className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                  <Edit2 className="w-4 h-4 text-amber-700" />
                  <span>실측 제원 수정 및 명예의 전당 기여</span>
                </span>
                <label className="flex items-center gap-1 text-[11px] font-bold text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isLocked}
                    onChange={(e) => setIsLocked(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>검증 완료 후 제원 잠금</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  기여자 성함 또는 닉네임 *
                </label>
                <input
                  type="text"
                  required
                  value={editorName}
                  onChange={(e) => setEditorName(e.target.value)}
                  placeholder="예: 구미지산총무, 홍길동 (명예의 전당 영구 기록)"
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 rounded-xl text-sm shadow flex items-center justify-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  <span>제원 확정 저장 및 명예 등록 👑</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {/* 7. Contribution History Timeline */}
          {course.contributionHistory && course.contributionHistory.length > 0 && (
            <div className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2">
              <div className="text-xs font-black text-stone-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-emerald-700" />
                <span>명예의 전당 기여 히스토리</span>
              </div>
              <div className="space-y-1.5 text-[11px]">
                {course.contributionHistory.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-stone-50 p-2 rounded-lg text-stone-700">
                    <div className="flex items-center gap-1.5 font-bold text-stone-900">
                      <span>👑 {h.author}</span>
                      <span className="text-stone-500 font-medium">({h.action})</span>
                    </div>
                    <span className="text-[10px] text-stone-600 shrink-0">{h.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 8. Footer Close Button */}
        <div className="pt-2 border-t border-stone-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full bg-stone-800 hover:bg-stone-700 text-white font-black py-3 rounded-xl text-sm shadow transition"
          >
            확인 완료 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
