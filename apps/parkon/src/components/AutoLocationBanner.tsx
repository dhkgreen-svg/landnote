'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Play, Home, ChevronRight, Sparkles, Navigation } from 'lucide-react';
import { Course } from '@/types/parkon';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName } from '@/lib/courseLocalization';

import { ParkOnStorage } from '@/lib/storage';
import { GeoCountryService } from '@/lib/geoCountryService';

// 두 위경도 좌표 간 거리 계산 (단위: 미터)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // 지구 반경 (m)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

interface AutoLocationBannerProps {
  courses: Course[];
  onStartGame: (courseId: string) => void;
}

export function AutoLocationBanner({ courses, onStartGame }: AutoLocationBannerProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [detectedCourse, setDetectedCourse] = useState<{ course: Course; distance: number; isVirtualGps?: boolean } | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // 대표님 원칙: 불필요하게 넓히지 않고 정확히 현장 100m 이내만 감지
  const MAX_RADIUS_METERS = 100;

  useEffect(() => {
    // 세션 중 이미 "홈으로 돌아가기"를 눌렀다면 다시 띄우지 않음 (혼선 원천 차단)
    const dismissedSession = sessionStorage.getItem('parkon_auto_location_dismissed');
    if (dismissedSession === 'true') {
      setIsDismissed(true);
      return;
    }

    const checkLocation = () => {
      // 1. 모의(Mock) GPS가 설정된 경우 해당 좌표 기준으로 최근접 구장 즉시 매칭
      const mock = GeoCountryService.getMockLocation();
      if (mock) {
        let closestCourse: Course | null = null;
        let minDistance = Infinity;
        courses.forEach((c) => {
          if (typeof c.lat === 'number' && typeof c.lng === 'number') {
            const dist = getDistanceMeters(mock.lat, mock.lng, c.lat, c.lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestCourse = c;
            }
          }
        });
        if (closestCourse) {
          setDetectedCourse({ course: closestCourse, distance: Math.min(minDistance, 50), isVirtualGps: true });
        }
        return;
      }

      const country = ParkOnStorage.getServiceCountry();

      if (!navigator.geolocation) {
        if (country === 'JP') {
          const jpCourse = courses.find((c) => c.id === 'jp-course-makubetsu-tsutsujigaoka') || courses.find((c) => c.country === 'JP');
          if (jpCourse) {
            setDetectedCourse({ course: jpCourse, distance: 0, isVirtualGps: true });
          }
        }
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });

          // 실제 GPS가 일본 영토 내인 경우
          const isInJapan = ParkOnStorage.isCoordsInJapan(latitude, longitude);

          if (country === 'JP') {
            if (isInJapan) {
              // 일본 현지 실제 GPS: 가장 가까운 일본 코스 100m 정밀 탐색
              let closestCourse: Course | null = null;
              let minDistance = Infinity;
              courses.forEach((c) => {
                if (c.country === 'JP' && typeof c.lat === 'number' && typeof c.lng === 'number') {
                  const dist = getDistanceMeters(latitude, longitude, c.lat, c.lng);
                  if (dist < minDistance) {
                    minDistance = dist;
                    closestCourse = c;
                  }
                }
              });
              if (closestCourse && minDistance <= MAX_RADIUS_METERS) {
                setDetectedCourse({ course: closestCourse, distance: minDistance, isVirtualGps: false });
              }
            } else {
              // 한국에서 일본 모드 테스트 시: 발상지 마쿠베츠 구장 가상 GPS 0m 자동 시뮬레이션
              const jpCourse = courses.find((c) => c.id === 'jp-course-makubetsu-tsutsujigaoka') || courses.find((c) => c.country === 'JP');
              if (jpCourse) {
                setDetectedCourse({ course: jpCourse, distance: 0, isVirtualGps: true });
              }
            }
          } else {
            // 한국 모드: 한국 코스 100m 탐색
            let closestCourse: Course | null = null;
            let minDistance = Infinity;

            courses.forEach((c) => {
              if (c.country !== 'JP' && typeof c.lat === 'number' && typeof c.lng === 'number') {
                const dist = getDistanceMeters(latitude, longitude, c.lat, c.lng);
                if (dist < minDistance) {
                  minDistance = dist;
                  closestCourse = c;
                }
              }
            });

            if (closestCourse && minDistance <= MAX_RADIUS_METERS) {
              setDetectedCourse({ course: closestCourse, distance: minDistance, isVirtualGps: false });
            }
          }
        },
        (error) => {
          // GPS 권한 거부 시, 일본 모드라면 가상 발상지 코스 제공
          if (country === 'JP') {
            const jpCourse = courses.find((c) => c.id === 'jp-course-makubetsu-tsutsujigaoka') || courses.find((c) => c.country === 'JP');
            if (jpCourse) {
              setDetectedCourse({ course: jpCourse, distance: 0, isVirtualGps: true });
            }
          }
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    };

    checkLocation();

    const handleCountryChange = () => {
      checkLocation();
    };

    window.addEventListener('parkon_country_changed', handleCountryChange);
    window.addEventListener('parky_geo_updated', handleCountryChange);
    return () => {
      window.removeEventListener('parkon_country_changed', handleCountryChange);
      window.removeEventListener('parky_geo_updated', handleCountryChange);
    };
  }, [courses]);

  if (isDismissed || !detectedCourse) return null;

  const { course, distance } = detectedCourse;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('parkon_auto_location_dismissed', 'true');
  };

  const dual = getCourseDualName(course, isJapanese);

  return (
    <div className="mx-3 sm:mx-4 my-3 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-950 via-stone-900 to-slate-950 border-2 border-emerald-400 shadow-2xl text-white animate-in fade-in slide-in-from-top-4 duration-300">
      {/* 상단 뱃지 */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        {detectedCourse.isVirtualGps ? (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400/50 text-rose-300 text-xs font-black tracking-tight">
              <span>🇯🇵</span>
              <span>{isJapanese ? '日本発祥地 仮想GPS連動' : '일본 발상지 가상 GPS 연동'}</span>
            </div>
            <span className="text-[11px] font-extrabold text-amber-300 bg-black/40 px-2.5 py-0.5 rounded-full border border-amber-300/40 animate-pulse">
              {isJapanese ? '現場 0m (発祥地)' : '현장 0m (발상지)'}
            </span>
          </>
        ) : (
          <>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black tracking-tight">
              <MapPin className="w-3.5 h-3.5 fill-current text-emerald-400 animate-pulse" />
              <span>{isJapanese ? '現場100m自動検知' : isEnglish ? '100m Auto Detected' : '현장 100m 정밀 자동 감지'}</span>
            </div>
            <span className="text-[11px] font-extrabold text-stone-400 bg-white/10 px-2 py-0.5 rounded-full">
              {isJapanese ? `現在地から約 ${distance}m` : isEnglish ? `Approx. ${distance}m away` : `현 위치에서 약 ${distance}m`}
            </span>
          </>
        )}
      </div>

      {/* 구장 타이틀 */}
      <div className="mb-4">
        <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
          {dual.flag && <span>{dual.flag}</span>}
          <span>{dual.primary}</span>
          <span className="text-xs sm:text-sm font-bold text-emerald-400">
            {isJapanese ? '到着！' : isEnglish ? 'Arrived!' : '도착!'}
          </span>
        </h3>
        {dual.showSecondary && dual.secondary && (
          <div className="text-xs font-bold text-emerald-300/80 truncate mt-0.5">
            {dual.secondary}
          </div>
        )}
        <p className="text-xs text-stone-300 mt-1 font-medium">
          {isJapanese
            ? `${course.regionJa || course.region} · 計 ${course.totalHoles || 18}ホール公認コース`
            : isEnglish
            ? `${course.region} · Total ${course.totalHoles || 18} Holes`
            : `${course.region} · 총 ${course.totalHoles || 18}홀 공인 구장`}
        </p>
      </div>

      {/* 대표님 원칙 2버튼 체계: [바로 라운드 시작] vs [홈으로 돌아가기] */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 버튼 1: 바로 라운드 시작 (A-1홀 실전 직행) */}
        <button
          type="button"
          onClick={() => onStartGame(course.id)}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-emerald-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.98] border border-emerald-200 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current text-emerald-950" />
          <span>{isJapanese ? 'このコースですぐラウンド開始' : isEnglish ? 'Start Round at this Course' : '이 구장에서 바로 라운드 시작'}</span>
        </button>

        {/* 버튼 2: 홈(초기 화면)으로 돌아가기 (감지 닫고 모든 기존 메뉴 자유 이용) */}
        <button
          type="button"
          onClick={handleDismiss}
          className="w-full py-3.5 px-4 rounded-2xl bg-stone-800/90 hover:bg-stone-700/90 text-stone-200 font-bold text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] border border-stone-600 cursor-pointer"
        >
          <Home className="w-4 h-4 text-stone-400" />
          <span>{isJapanese ? 'ホーム画面へ戻る' : isEnglish ? 'Back to Home' : '홈(초기 화면)으로 돌아가기'}</span>
        </button>
      </div>

      <div className="mt-2.5 text-center">
        <span className="text-[10px] text-stone-400">
          {isJapanese
            ? '💡 ホームに戻ると、クラブ、大会、練習など全機能をご利用いただけます。'
            : isEnglish
            ? '💡 Returning home allows you to use all other features like clubs and practice.'
            : '💡 홈으로 돌아가시면 시합 모드, 클럽, 가상 연습 등 기존 메뉴를 자유롭게 이용하실 수 있습니다.'}
        </span>
      </div>
    </div>
  );
}
