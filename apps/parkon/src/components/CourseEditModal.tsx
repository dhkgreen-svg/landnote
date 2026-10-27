'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Settings, Sparkles, MapPin, Flag, Edit3 } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';

interface CourseEditModalProps {
  isOpen: boolean;
  course: Course | null;
  onClose: () => void;
  onSave: (updatedCourse: Course) => void;
  isJapanese?: boolean;
}

export const CourseEditModal: React.FC<CourseEditModalProps> = ({
  isOpen,
  course,
  onClose,
  onSave,
  isJapanese = false,
}) => {
  const [courseName, setCourseName] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [totalHoles, setTotalHoles] = useState<number>(18);
  const [contributor, setContributor] = useState<string>('');

  useEffect(() => {
    if (course && isOpen) {
      setCourseName(course.name || '');
      setRegion(course.region || '');
      setAddress(course.address || '');
      setTotalHoles(course.totalHoles || 18);
      setContributor(
        course.contributorName ||
        ParkOnStorage.getUserDisplayName() ||
        (isJapanese ? 'PARKY会員' : '파키 정회원')
      );
    }
  }, [course, isOpen, isJapanese]);

  if (!isOpen || !course) return null;

  const coursesCount = Math.max(1, Math.round(totalHoles / 9));
  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const courseLettersStr = COURSE_LETTERS.slice(0, coursesCount).join(', ') + '코스';

  const handleSave = () => {
    const cleanName = courseName.trim() || course.name;
    const cleanShortName = cleanName.replace(/파크골프장|파크골프/g, '').trim();
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedHoles =
      course.holesMetadata && course.holesMetadata.length >= totalHoles
        ? course.holesMetadata.slice(0, totalHoles)
        : generateStandardHoles(totalHoles);

    const updatedCourse: Course = {
      ...course,
      name: cleanName,
      nameKo: cleanShortName,
      region: region.trim() || course.region,
      address: address.trim() || course.address,
      totalCourses: coursesCount,
      totalHoles: totalHoles,
      holesMetadata: updatedHoles,
      contributorName: contributor.trim() || course.contributorName || '파키 정회원',
      contributedAt: todayStr,
    };

    ParkOnStorage.updateCourse(updatedCourse);
    onSave(updatedCourse);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0">
              ✏️
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">
                {isJapanese ? 'コース名・諸元の即時訂正' : '구장명 및 코스 제원 정정'}
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {isJapanese ? '오타(例: 海平)やホール数を直ちに修正します' : '오타(예: 해병 ➔ 해평)나 코스/홀수를 바로 수정합니다'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* 1. 구장명 (골프장 이름) */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isJapanese ? 'ゴルフ場名 (正確な名称)' : '구장명 (정확한 골프장 이름)'}</span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">오타 즉시 수정 가능</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                data-testid="edit-course-name-input"
                placeholder="예: 해평파크골프장"
                className="w-full bg-stone-50 border-2 border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-black text-stone-900 outline-none focus:bg-white focus:border-emerald-600 shadow-inner"
              />
              {courseName && (
                <button
                  type="button"
                  onClick={() => setCourseName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* 2. 총 코스 및 홀 수 */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isJapanese ? '実際の総コース・ホール数' : '실제 총 코스 및 홀수 선택'}</span>
              </span>
              <span className="text-[10px] text-amber-700 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {courseLettersStr}
              </span>
            </label>
            <select
              value={totalHoles}
              onChange={(e) => setTotalHoles(Number(e.target.value))}
              className="w-full bg-stone-50 border-2 border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-black text-stone-900 outline-none cursor-pointer"
            >
              <option value={9}>{isJapanese ? '計 1コース 9ホール (Aコース)' : '총 1코스 9홀 (A코스)'}</option>
              <option value={18}>{isJapanese ? '計 2コース 18ホール (A, B코스)' : '총 2코스 18홀 (A, B코스)'}</option>
              <option value={27}>{isJapanese ? '計 3コース 27ホール (A, B, C코스)' : '총 3코스 27홀 (A, B, C코스)'}</option>
              <option value={36}>{isJapanese ? '計 4コース 36ホール (A, B, C, D코스)' : '총 4코스 36홀 (A, B, C, D코스)'}</option>
              <option value={45}>{isJapanese ? '計 5コース 45ホール (A~E코스)' : '총 5코스 45홀 (A~E코스)'}</option>
              <option value={54}>{isJapanese ? '計 6コース 54ホール (A~F코스)' : '총 6코스 54홀 (A~F코스)'}</option>
              <option value={63}>{isJapanese ? '計 7コース 63ホール (A~G코스)' : '총 7코스 63홀 (A~G코스)'}</option>
              <option value={72}>{isJapanese ? '計 8コース 72ホール (A~H코스)' : '총 8코스 72홀 (A~H코스)'}</option>
              <option value={108}>{isJapanese ? '計 12コース 108ホール (A~L코스)' : '총 12코스 108홀 (A~L코스)'}</option>
            </select>
          </div>

          {/* 3. 지역 및 상세 주소 (선택) */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>지역명 (시·군·구)</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="예: 경북 구미시"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-400" />
                <span>상세 위치/읍면동</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="예: 해평면 낙산리"
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-2.5 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* 4. 정정자 성명 (명예의 전당) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-stone-400" />
              <span>정정 기여자 성명</span>
            </label>
            <input
              type="text"
              value={contributor}
              onChange={(e) => setContributor(e.target.value)}
              placeholder="골퍼 성명"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 outline-none focus:border-emerald-600"
            />
          </div>

          {/* 안내 배너 */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 space-y-1">
            <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>실시간 즉시 반영 안내</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              수정한 구장명과 코스(A, B, C 등)는 홈 화면 및 라운드 설정, 스코어카드에 <b>별도 심사 없이 즉시 적용</b>됩니다.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {isJapanese ? 'キャンセル' : '취소'}
          </button>
          <button
            type="button"
            data-testid="save-course-edit-btn"
            onClick={handleSave}
            className="flex-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1 active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            <span>{isJapanese ? '即時保存・反映 ✓' : '즉시 정정 및 저장하기 ✓'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
