'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Settings, Sparkles, MapPin, Flag, Edit3, PlusCircle } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { generateStandardHoles } from '@/lib/defaultCourses';
import { useBackHandler } from '@/lib/backNavigation';
import { reportCourseBigDataLog } from '@/lib/courseBigData';

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
  // 모드 분기: 'RENAME' (기존 구장명 오타/정정) | 'NEW_STORE' (신규 신설 매장/구장 등록)
  const [editMode, setEditMode] = useState<'RENAME' | 'NEW_STORE'>('RENAME');
  const [courseName, setCourseName] = useState<string>('');
  const [aliasesText, setAliasesText] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [totalHoles, setTotalHoles] = useState<number>(18);
  const [contributor, setContributor] = useState<string>('');
  const [freshCourse, setFreshCourse] = useState<Course | null>(null);

  useEffect(() => {
    if (course && isOpen) {
      const latest = ParkOnStorage.getAllCourses().find((c) => c.id === course.id) || course;
      setFreshCourse(latest);
      setEditMode('RENAME');
      setCourseName(latest.name || '');
      setAliasesText((latest.aliases || []).join(', '));
      setRegion(latest.region || '');
      setAddress(latest.address || '');
      const latestCourses = latest.totalCourses || Math.max(1, Math.round((latest.totalHoles || 18) / 9));
      setTotalHoles(latest.totalHoles || latestCourses * 9);
      setContributor(
        latest.contributorName ||
        ParkOnStorage.getUserDisplayName() ||
        (isJapanese ? 'PARKY会員' : '파키 정회원')
      );
    }
  }, [course, isOpen, isJapanese]);

  useBackHandler(isOpen, onClose);

  if (!isOpen || !course) return null;
  const activeCourse = freshCourse && freshCourse.id === course.id ? freshCourse : course;

  const coursesCount = Math.max(1, Math.round(totalHoles / 9));
  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  const courseLettersStr = COURSE_LETTERS.slice(0, coursesCount).join(', ') + '코스';

  const handleModeChange = (mode: 'RENAME' | 'NEW_STORE') => {
    setEditMode(mode);
    if (mode === 'NEW_STORE') {
      // 신규 구장 모드로 전환 시 기본 이름 클리어
      setCourseName('');
      setAliasesText('');
      setAddress('');
      setTotalHoles(18);
    } else {
      // 기존 구장 정정 모드 복귀 (최신 동기화 데이터 반영)
      setCourseName(activeCourse.name || '');
      setAliasesText((activeCourse.aliases || []).join(', '));
      setRegion(activeCourse.region || '');
      setAddress(activeCourse.address || '');
      setTotalHoles(activeCourse.totalHoles || 18);
    }
  };

  const handleSave = () => {
    const cleanName = courseName.trim();
    if (!cleanName) {
      alert(isJapanese ? 'コース名を入力してください。' : '구장명을 입력해 주세요.');
      return;
    }

    const cleanShortName = cleanName.replace(/파크골프장|파크골프/g, '').trim() || cleanName;
    const todayStr = new Date().toISOString().split('T')[0];

    const parsedAliases = Array.from(
      new Set(
        aliasesText
          .split(/[,，]/)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s !== cleanName)
      )
    ).slice(0, 10);

    if (editMode === 'NEW_STORE') {
      // [분기 2]: 신규 신설 구장 DB 신규 등록
      const newCourseId = `course_custom_${Date.now()}`;
      const newHoles = generateStandardHoles(totalHoles);

      const newCourse: Course = {
        id: newCourseId,
        name: cleanName,
        nameKo: cleanShortName,
        aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
        region: region.trim() || '신규 등록 구장',
        address: address.trim() || '',
        totalCourses: coursesCount,
        totalHoles: totalHoles,
        holesMetadata: newHoles,
        contributorName: contributor.trim() || ParkOnStorage.getUserDisplayName() || '파키 정회원',
        contributedAt: todayStr,
        isVerified: true,
      };

      // 1. 커스텀 구장 DB 영구 저장
      ParkOnStorage.addCustomCourse(newCourse);
      reportCourseBigDataLog({
        eventType: 'ADD_ZONE_COURSE',
        courseId: newCourse.id,
        courseName: cleanName,
        aliases: parsedAliases,
        region: newCourse.region,
        totalCourses: coursesCount,
        totalHoles,
        contributorName: newCourse.contributorName,
      });
      // 2. 부모 및 현재 화면에 즉시 신규 구장 선택 적용
      onSave(newCourse);
      alert(isJapanese
        ? `🎉 新設コース [${cleanName}] が正常にDBに登録されました！`
        : `🎉 신설 구장 [${cleanName}] (${totalHoles}홀)이 우리 DB에 성공적으로 등록되었습니다!`
      );
      onClose();
    } else {
      // [분기 1]: 기존 구장명 오타/정정 (기존 입력된 홀 제원 보존 + 부족분만 보강)
      const baseHoles = activeCourse.holesMetadata ? [...activeCourse.holesMetadata] : [];
      const updatedHoles =
        baseHoles.length >= totalHoles
          ? baseHoles.slice(0, totalHoles)
          : [
              ...baseHoles,
              ...generateStandardHoles(totalHoles).slice(baseHoles.length),
            ];

      const updatedCourse: Course = {
        ...activeCourse,
        name: cleanName,
        nameKo: cleanShortName,
        aliases: parsedAliases.length > 0 ? parsedAliases : undefined,
        region: region.trim() || activeCourse.region,
        address: address.trim() || activeCourse.address,
        totalCourses: coursesCount,
        totalHoles: totalHoles,
        holesMetadata: updatedHoles,
        contributorName: contributor.trim() || activeCourse.contributorName || '파키 정회원',
        contributedAt: todayStr,
      };

      ParkOnStorage.updateCourse(updatedCourse);
      reportCourseBigDataLog({
        eventType: 'COURSE_INFO_EDIT',
        courseId: updatedCourse.id,
        courseName: cleanName,
        aliases: parsedAliases,
        region: updatedCourse.region,
        totalCourses: coursesCount,
        totalHoles,
        contributorName: updatedCourse.contributorName,
      });
      onSave(updatedCourse);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0">
              {editMode === 'RENAME' ? '✏️' : '🆕'}
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight">
                {isJapanese
                  ? (editMode === 'RENAME' ? 'コース名・諸元の即時訂正' : '新設コースの新規DB登録')
                  : (editMode === 'RENAME' ? '구장명 및 코스 정보 수정' : '신규 신설 구장 DB 등록')}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-200 font-medium">
                {editMode === 'RENAME'
                  ? '기존 구장명의 오타(예: 해평 ➔ 해평파크골프장)를 바르게 정정합니다.'
                  : '새로 개장한 신설 구장 정보를 우리 DB에 영구 등록합니다.'}
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

        {/* 2대 분기 선택 토글 바 (대표님 확정 인터랙션) */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 shrink-0">
          <div className="text-[11px] font-black text-stone-700 mb-1.5 flex items-center justify-between">
            <span>수정 유형을 선택해 주세요:</span>
            <span className="text-[10px] text-emerald-700 font-bold">
              {editMode === 'RENAME' ? '기존 구장 정정 중' : '신설 구장 등록 중'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleModeChange('RENAME')}
              className={`py-2 px-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border ${
                editMode === 'RENAME'
                  ? 'bg-emerald-700 text-white border-emerald-800 ring-2 ring-emerald-300'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span>✏️ 기존 이름 오타/정정</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('NEW_STORE')}
              className={`py-2 px-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs border ${
                editMode === 'NEW_STORE'
                  ? 'bg-amber-500 text-stone-950 border-amber-600 ring-2 ring-amber-300'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-50'
              }`}
            >
              <span>🆕 신규 신설 구장 등록</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto flex-1 text-xs">
          {/* 1. 구장명 (골프장 이름) */}
          <div className="space-y-1">
            <label className="text-xs font-black text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-emerald-600" />
                <span>
                  {editMode === 'RENAME' ? '정정할 구장명' : '신설 구장명 (정확한 공식 명칭)'}
                </span>
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {editMode === 'RENAME' ? '현재 구장명 변경' : '신규 구장으로 저장'}
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                data-testid="edit-course-name-input"
                placeholder={editMode === 'RENAME' ? '예: 해평파크골프장' : '신설 구장명 입력 (예: 선산파크골프장)'}
                className="w-full bg-stone-50 border-2 border-emerald-500 rounded-xl px-3 py-2.5 text-sm font-black text-stone-900 outline-none focus:bg-white focus:border-emerald-600 shadow-inner"
                autoFocus
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

          {/* 1-2. 구장 별칭 (선택 · 검색 연동) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 block">
              구장 별칭 <span className="text-[10px] text-stone-400 font-medium">(선택 · 쉼표로 여러 개)</span>
            </label>
            <input
              type="text"
              data-testid="edit-course-aliases-input"
              value={aliasesText}
              onChange={(e) => setAliasesText(e.target.value)}
              placeholder="예: 삼국유사, 충주호, 강나루"
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs font-bold text-stone-900 placeholder:text-stone-400 outline-none focus:border-emerald-600"
            />
          </div>

          {/* 2. 총 코스 및 홀 수 (좌우 - / + 대형 스텝퍼) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-stone-800 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Settings className="w-3.5 h-3.5 text-emerald-600" />
                <span>총 코스 및 홀수 선택</span>
              </span>
              <span className="text-[10px] text-amber-700 font-black bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                {courseLettersStr}
              </span>
            </label>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                data-testid="btn-course-edit-minus"
                disabled={coursesCount <= 1}
                onClick={() => setTotalHoles(Math.max(1, coursesCount - 1) * 9)}
                className={`w-14 h-14 rounded-2xl border-2 text-3xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                  coursesCount <= 1
                    ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                    : 'bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-800 border-stone-300'
                }`}
                aria-label="코스 수 감소"
              >
                −
              </button>

              <div className="flex-1 bg-emerald-50/80 border-2 border-emerald-600 rounded-2xl py-2 px-3 text-center shadow-inner">
                <div className="flex items-baseline justify-center gap-1">
                  <span
                    data-testid="text-course-edit-count"
                    className="text-3xl font-black text-emerald-950 leading-none"
                  >
                    {coursesCount}
                  </span>
                  <span className="text-base font-black text-emerald-800">코스</span>
                  <span className="text-sm font-black text-emerald-700 ml-1">({totalHoles}홀)</span>
                </div>
                <div className="text-[11px] font-black text-emerald-700 mt-0.5">
                  {coursesCount === 1
                    ? 'A 코스'
                    : `A~${COURSE_LETTERS[coursesCount - 1]} 코스`}
                </div>
              </div>

              <button
                type="button"
                data-testid="btn-course-edit-plus"
                disabled={coursesCount >= 12}
                onClick={() => setTotalHoles(Math.min(12, coursesCount + 1) * 9)}
                className={`w-14 h-14 rounded-2xl border-2 text-3xl font-black flex items-center justify-center shrink-0 transition cursor-pointer ${
                  coursesCount >= 12
                    ? 'bg-stone-100 text-stone-300 border-stone-200 cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-amber-300 border-emerald-800 shadow-md'
                }`}
                aria-label="코스 수 증가"
              >
                +
              </button>
            </div>
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

          {/* 4. 기여자 성명 */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-stone-400" />
              <span>등록/정정 기여자 성명</span>
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
              <span>{editMode === 'RENAME' ? '실시간 구장명 변경 반영' : '신설 구장 우리 DB 영구 등록'}</span>
            </div>
            <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
              {editMode === 'RENAME'
                ? '수정한 구장명과 코스 정보는 현재 라운드 설정 및 스코어카드에 즉시 적용됩니다.'
                : '신규 구장으로 등록하시면 우리 파키 DB에 영구 보관되며, 현재 라운드에서 바로 시작할 수 있습니다.'}
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
            className="flex-2 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs transition cursor-pointer shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            <Check className="w-4 h-4 text-amber-300" />
            <span>
              {editMode === 'RENAME' ? '구장명 정정 및 저장 ✓' : '신규 구장 DB 등록 완료 ✓'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
