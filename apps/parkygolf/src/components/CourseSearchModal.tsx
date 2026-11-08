'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, ChevronRight, Settings, Sparkles, AlertCircle } from 'lucide-react';
import { Course, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { getCourseDualName } from '@/lib/courseLocalization';
import { generateStandardHoles } from '@/lib/defaultCourses';

interface CourseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCourse: (course: Course) => void;
  onEditCourse?: (course: Course) => void;
  isJapanese?: boolean;
}

// 한글 자모 분리 (초성, 중성, 종성)
function decomposeHangul(str: string): string {
  const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  let result = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xAC00 && code <= 0xD7A3) {
      const syllableIndex = code - 0xAC00;
      const cho = Math.floor(syllableIndex / 588);
      const jung = Math.floor((syllableIndex % 588) / 28);
      const jong = syllableIndex % 28;
      result += CHOSUNG[cho] + JUNGSUNG[jung] + JONGSUNG[jong];
    } else {
      result += str[i];
    }
  }
  return result;
}

// 편집 거리(Levenshtein Distance)
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 자모 유사도 기반 오타 구장 추천 탐색기 (예: '해평' 검색 시 '해병' 감지)
function findSimilarCourses(query: string, courses: Course[]): { course: Course; distance: number }[] {
  const cleanQ = query.replace(/\s+/g, '').replace(/파크골프장|파크골프/g, '');
  if (!cleanQ || cleanQ.length < 2) return [];

  const decQ = decomposeHangul(cleanQ);
  const qLen = decQ.length;
  const results: { course: Course; distance: number }[] = [];

  for (const c of courses) {
    const cleanName = (c.name || '').replace(/\s+/g, '').replace(/파크골프장|파크골프/g, '');
    if (!cleanName) continue;
    const decName = decomposeHangul(cleanName);

    let minDistance = 999;
    if (decName.length >= qLen) {
      for (let i = 0; i <= decName.length - qLen; i++) {
        const sub = decName.substring(i, i + qLen);
        const dist = levenshteinDistance(decQ, sub);
        if (dist < minDistance) minDistance = dist;
      }
    } else {
      minDistance = levenshteinDistance(decQ, decName);
    }

    // 자모 거리 2 이하 (받침 1개나 초성 1글자 오타) 감지
    if (minDistance <= 2) {
      results.push({ course: c, distance: minDistance });
    }
  }

  return results.sort((a, b) => a.distance - b.distance).slice(0, 3);
}

export const CourseSearchModal: React.FC<CourseSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectCourse,
  onEditCourse,
  isJapanese = false,
}) => {
  const [query, setQuery] = useState<string>('');

  const courses = useMemo(() => {
    if (!isOpen) return [];
    return ParkOnStorage.getAllCourses();
  }, [isOpen]);

  const trimmedQ = query.trim();

  const searchResults = useMemo(() => {
    if (!trimmedQ || !isOpen) return [];
    return courses.filter((c) => {
      const q = trimmedQ.toLowerCase();
      const noSpaceQ = q.replace(/\s+/g, '');
      const name = (c.name || '').toLowerCase();
      const noSpaceName = name.replace(/\s+/g, '');
      const reg = (c.region || '').toLowerCase();
      const addr = (c.address || '').toLowerCase();
      const isYanghoQuery =
        q.includes('양포') || q.includes('양호') || noSpaceQ.includes('양포') || noSpaceQ.includes('양호');
      const isYanghoCourse = name.includes('양포') || name.includes('양호') || addr.includes('양호');

      return (
        name.includes(q) ||
        noSpaceName.includes(noSpaceQ) ||
        reg.includes(q) ||
        addr.includes(q) ||
        (isYanghoQuery && isYanghoCourse)
      );
    });
  }, [trimmedQ, courses, isOpen]);

  const similarCourses = useMemo(() => {
    if (!isOpen || searchResults.length > 0 || !trimmedQ) return [];
    return findSimilarCourses(trimmedQ, courses);
  }, [isOpen, searchResults.length, trimmedQ, courses]);

  if (!isOpen) return null;

  const getRegionText = (c: Course): string => {
    if (isJapanese) {
      return c.regionJa || c.region || '';
    }
    return c.regionKo || c.region || '';
  };

  const handleStartNewCourse = () => {
    const cleanQuery = trimmedQ;
    const fullName = cleanQuery.endsWith('파크골프장') ? cleanQuery : `${cleanQuery}파크골프장`;
    const shortName = cleanQuery.replace(/파크골프장|파크골프/g, '').trim();

    const newCourse: Course = {
      id: `custom-course-${Date.now()}`,
      name: fullName,
      nameKo: shortName,
      region: '골퍼 직접 등록 구장',
      address: '',
      totalCourses: 2,
      totalHoles: 18,
      holesMetadata: generateStandardHoles(18),
      isVerified: true,
      contributorName: ParkOnStorage.getUserDisplayName() || '파키 정회원',
      contributedAt: new Date().toISOString().split('T')[0],
    };

    if (onEditCourse) {
      onEditCourse(newCourse);
    } else {
      ParkOnStorage.updateCourse(newCourse);
      onSelectCourse(newCourse);
    }
    setQuery('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-300 stroke-[2.5]" />
            <div>
              <h3 className="font-black text-base leading-tight">
                {isJapanese ? 'コース検索 & 変更' : '골프장 검색 & 변경'}
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                {isJapanese ? 'プレーするコースを検索して選択してください' : '플레이할 골프장을 검색하고 선택하세요'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-3.5 bg-stone-100 border-b border-stone-200 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isJapanese ? 'コース名・地名を入力してください' : '지명이나 골프장 이름을 입력하세요 (예: 구미, 해평)'}
              className="w-full bg-white text-stone-900 pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border-2 border-emerald-500/60 focus:outline-hidden focus:border-emerald-600 font-bold placeholder:text-stone-400 shadow-inner"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        {!trimmedQ ? (
          <div className="py-12 px-4 text-center text-xs text-stone-400 font-medium flex flex-col items-center justify-center gap-2">
            <div className="text-3xl">⛳</div>
            <p>
              {isJapanese
                ? 'コース名または地域名を入力してください'
                : '골프장명 또는 지역명을 검색창에 입력해 주세요 (예: 구미, 해평)'}
            </p>
          </div>
        ) : searchResults.length > 0 ? (
          /* 일치 검색 결과 목록 */
          <div className="p-3 space-y-2 overflow-y-auto divide-y divide-stone-100 flex-1">
            <div className="text-xs text-stone-500 font-bold px-1 pb-1 flex items-center justify-between">
              <span>검색 결과 ({searchResults.length}개)</span>
              <span className="text-[11px] text-emerald-700 font-black">터치 시 구장 변경</span>
            </div>
            {searchResults.slice(0, 30).map((sc) => {
              const dual = getCourseDualName(sc, isJapanese);
              const displayRegion = getRegionText(sc);
              const holesText = formatCourseHolesText(sc);

              return (
                <div
                  key={sc.id}
                  onClick={() => {
                    onSelectCourse(sc);
                    setQuery('');
                    onClose();
                  }}
                  className="p-3.5 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between transition cursor-pointer active:scale-[0.99] group bg-white shadow-xs"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="font-black text-stone-900 text-sm sm:text-base flex items-center gap-1.5 group-hover:text-emerald-800 transition">
                      <span>⛳</span>
                      <span>{dual.primary}</span>
                    </div>
                    <div className="text-xs text-stone-500 font-medium mt-0.5">
                      📍 {displayRegion} · {holesText}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {onEditCourse && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditCourse(sc);
                        }}
                        className="p-2 bg-stone-100 hover:bg-emerald-100 text-stone-600 hover:text-emerald-800 border border-stone-200 rounded-xl transition cursor-pointer active:scale-95"
                        title="구장명 및 제원 수정"
                      >
                        <span className="text-xs">✏️</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer pointer-events-none"
                    >
                      <span>{isJapanese ? '選択' : '구장 선택'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* 검색 결과 0건일 때: 대표님 특명 지능형 솔루션 1 + 솔루션 2 가동 */
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            <div className="text-center space-y-1 py-1">
              <div className="text-sm font-black text-stone-800">
                {isJapanese ? `'${trimmedQ}' の検索結果がありません` : `'${trimmedQ}' 검색 결과가 없습니다`}
              </div>
            </div>

            {/* 솔루션 1: 자모 유사도 기반 오타 감지 & 1초 바로잡기 추천 */}
            {similarCourses.length > 0 && (
              <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-3.5 space-y-2.5 text-left shadow-xs animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <span className="text-base">💡</span>
                    <span>혹시 이 구장을 찾으시나요? (유사 구장 감지)</span>
                  </span>
                  <span className="text-[10px] text-amber-900 font-black bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                    오타 감지
                  </span>
                </div>

                <div className="space-y-2">
                  {similarCourses.map(({ course: sc }) => {
                    const dual = getCourseDualName(sc, isJapanese);
                    const displayRegion = getRegionText(sc);
                    const holesText = formatCourseHolesText(sc);

                    return (
                      <div
                        key={sc.id}
                        className="bg-white rounded-xl p-3 border border-amber-200 shadow-2xs space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-black text-stone-900 text-sm flex items-center gap-1">
                              <span>⛳</span>
                              <span>{dual.primary}</span>
                            </div>
                            <div className="text-xs text-stone-500 font-medium mt-0.5">
                              📍 {displayRegion} · {holesText}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              onSelectCourse(sc);
                              setQuery('');
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xs rounded-xl shadow-xs transition shrink-0 active:scale-95 cursor-pointer"
                          >
                            <span>그대로 선택</span>
                          </button>
                        </div>

                        <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-2">
                          <span className="text-[11px] text-stone-600 font-bold truncate">
                            오타가 맞다면 즉시 바로잡을 수 있습니다:
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              const correctedCourse: Course = {
                                ...sc,
                                name: trimmedQ.endsWith('파크골프장') ? trimmedQ : `${trimmedQ}파크골프장`,
                                nameKo: trimmedQ.replace(/파크골프장|파크골프/g, '').trim(),
                              };
                              if (onEditCourse) {
                                onEditCourse(correctedCourse);
                              }
                              setQuery('');
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
                          >
                            <span>✏️ '{trimmedQ}'(으)로 1초 정정</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 솔루션 2: 1초 신규 구장 즉시 등록 버튼 */}
            <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-4 text-center space-y-2.5 shadow-xs">
              <div className="flex items-center justify-center gap-1.5 text-sm font-black text-emerald-950">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>새로 생긴 신규 구장인가요?</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                전국 400여 개 DB에 아직 없는 신규 구장이면 <b>1초 만에 바로 등록</b>하여 즉시 라운드를 시작할 수 있습니다.
              </p>
              <button
                type="button"
                data-testid="create-new-course-btn"
                onClick={handleStartNewCourse}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer"
              >
                <span>➕ '{trimmedQ}' 신규 구장 1초 등록하고 시작</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
          <button
            type="button"
            onClick={() => {
              setQuery('');
              onClose();
            }}
            className="w-full py-3 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition cursor-pointer active:scale-[0.99]"
          >
            {isJapanese ? '閉じる' : '닫기'}
          </button>
        </div>
      </div>
    </div>
  );
};
