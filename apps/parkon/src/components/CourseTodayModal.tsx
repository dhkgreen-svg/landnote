'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, MapPin, Navigation, Phone, Search, Play, Check, Copy } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ConditionStatus } from '@/components/ConditionStatus';
import { CourseSpecialNoticeCard } from '@/components/CourseSpecialNoticeCard';

interface CourseTodayModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onOpenCourseDetail?: () => void;
  onStartRound?: () => void;
}

export function CourseTodayModal({
  isOpen,
  onClose,
  course,
  onOpenCourseDetail,
  onStartRound,
}: CourseTodayModalProps) {
  const [copied, setCopied] = useState(false);
  const [weatherData, setWeatherData] = useState<{
    temp: number;
    weatherText: string;
    weatherIcon: string;
    windSpeed: number;
    windText: string;
    precipitation: number;
    rainText: string;
  }>({
    temp: 21,
    weatherText: '맑음',
    weatherIcon: '☀️',
    windSpeed: 1.5,
    windText: '선선함',
    precipitation: 0,
    rainText: '비 걱정 없음',
  });

  useEffect(() => {
    if (!isOpen || !course) return;

    const lat = course.lat || 36.0947;
    const lng = course.lng || 128.4013;
    let isMounted = true;

    const fetchWeather = async () => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,precipitation&timezone=Asia%2FTokyo`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data?.current) return;

        const cur = data.current;
        const temp = Math.round(cur.temperature_2m ?? 21);
        const wCode = cur.weather_code ?? 0;
        const windKmH = cur.wind_speed_10m ?? 5;
        const windMs = Number((windKmH / 3.6).toFixed(1));
        const precip = Number((cur.precipitation ?? 0).toFixed(1));

        let wText = '맑음';
        let wIcon = '☀️';
        if (wCode >= 1 && wCode <= 3) {
          wText = '구름조금';
          wIcon = '⛅';
        } else if (wCode >= 45 && wCode <= 48) {
          wText = '안개주의';
          wIcon = '🌫️';
        } else if (wCode >= 51 && wCode <= 67) {
          wText = '비 예보';
          wIcon = '🌧️';
        } else if (wCode >= 71) {
          wText = '눈 예보';
          wIcon = '❄️';
        }

        let windDesc = '선선함';
        if (windMs < 2.0) windDesc = '선선함';
        else if (windMs < 4.0) windDesc = '적당한 바람';
        else windDesc = '바람주의';

        let rainDesc = '비 걱정 없음';
        if (precip > 5.0) rainDesc = '우천 통제 주의';
        else if (precip > 0.5) rainDesc = '가벼운 비';

        setWeatherData({
          temp,
          weatherText: wText,
          weatherIcon: wIcon,
          windSpeed: windMs,
          windText: windDesc,
          precipitation: precip,
          rainText: rainDesc,
        });
      } catch (err) {
        // Fallback safely
      }
    };

    fetchWeather();
    return () => {
      isMounted = false;
    };
  }, [isOpen, course?.id]);

  if (!isOpen || !course) return null;

  // 오늘 요일 계산 및 휴장일 판별
  const todayDayIdx = new Date().getDay();
  const todayDayName = ['일', '월', '화', '수', '목', '금', '토'][todayDayIdx];
  const closedDayStr = course.closedDay || '';
  let isClosedToday = false;
  let closedReasonText = '';

  if (closedDayStr && !closedDayStr.includes('연중무휴') && !closedDayStr.includes('상시')) {
    if (closedDayStr.includes(todayDayName)) {
      isClosedToday = true;
      closedReasonText = `매주 ${todayDayName}요일 잔디 보호 정기 휴장`;
    } else if (todayDayIdx === 1 && (closedDayStr.includes('월') || closedDayStr.includes('정기'))) {
      isClosedToday = true;
      closedReasonText = '매주 월요일 잔디 정비 정기 휴장일';
    }
  }

  const cName = course.name;
  const cAddr = course.address || course.region || '구장 주소 미등록';
  const cPhone = course.phone || '';
  const searchKeyword = encodeURIComponent(`${cName} 주차장`);
  const kakaoNaviUrl = `https://map.kakao.com/link/search/${searchKeyword}`;
  const naverMapUrl = `https://map.naver.com/v5/search/${searchKeyword}`;
  const tmapWebUrl = `https://tmap.life/search?q=${searchKeyword}`;

  const handleCopyAddr = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(cAddr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-stone-100 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-stone-200 flex flex-col my-auto max-h-[92vh]">
        {/* 모달 상단 헤더 바 */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-teal-950 p-4 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-amber-300 text-lg shrink-0">
              🌿
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-black text-base text-white tracking-tight truncate">
                  {cName}
                </h3>
                <span className="text-[10px] bg-emerald-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                  {course.totalHoles ? `정규 ${course.totalHoles}홀` : '정규 36홀'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-200 truncate mt-0.5">
                오늘의 실시간 구장 종합 정보 &amp; 컨디션 리포트
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white text-sm font-bold transition shrink-0 cursor-pointer"
            title="닫기"
          >
            ✕
          </button>
        </div>

        {/* 모달 본문 스크롤 영역 */}
        <div className="p-3.5 sm:p-4 space-y-3.5 overflow-y-auto flex-1">
          {/* 1. 운영 상태 & 실시간 날씨 전광판 */}
          <div className="bg-gradient-to-br from-amber-50/90 via-white to-sky-50/90 rounded-2xl p-4 border-2 border-emerald-500/80 shadow-md space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                {isClosedToday ? (
                  <span className="inline-flex items-center gap-1.5 bg-rose-500 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    오늘({todayDayName}) 휴장일
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 rounded-full shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    오늘({todayDayName}) 정상 운영
                  </span>
                )}
                <span className="text-xs font-bold text-stone-700">
                  {isClosedToday ? closedReasonText : `이용: ${course.openHours || '08:30 ~ 17:30'}`}
                </span>
              </div>
              <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                기상청 실시간
              </span>
            </div>

            {/* 실시간 날씨 3열 칩 (밝고 선명한 화이트 카드 디자인) */}
            <div className="grid grid-cols-3 gap-2 text-center">
              {/* 기온/날씨 */}
              <div className="bg-white/95 rounded-xl p-2.5 border-2 border-amber-200/90 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1">
                  <span>{weatherData.weatherIcon}</span> 기온·날씨
                </span>
                <span className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                  {weatherData.temp}°C
                </span>
                <span className="text-[10px] text-amber-800 font-black">
                  {weatherData.weatherText}
                </span>
              </div>

              {/* 바람 */}
              <div className="bg-white/95 rounded-xl p-2.5 border-2 border-teal-200/90 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-teal-700 font-bold flex items-center gap-1">
                  <span>🍃</span> 바람세기
                </span>
                <span className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                  {weatherData.windSpeed}m/s
                </span>
                <span className="text-[10px] text-teal-800 font-black">
                  {weatherData.windText}
                </span>
              </div>

              {/* 강수확률 */}
              <div className="bg-white/95 rounded-xl p-2.5 border-2 border-sky-200/90 shadow-2xs flex flex-col items-center justify-center">
                <span className="text-[10px] text-sky-700 font-bold flex items-center gap-1">
                  <span>💧</span> 강수확률
                </span>
                <span className="text-base sm:text-lg font-black text-stone-900 mt-0.5">
                  {weatherData.precipitation > 0 ? `${weatherData.precipitation}mm` : '0%'}
                </span>
                <span className={`text-[10px] font-black ${weatherData.precipitation > 0 ? 'text-rose-600' : 'text-sky-800'}`}>
                  {weatherData.rainText}
                </span>
              </div>
            </div>
          </div>

          {/* 2. 실시간 잔디 상태 리포트 (ConditionStatus) */}
          <div className="space-y-1">
            <ConditionStatus courseId={course.id} courseName={course.name} />
          </div>

          {/* 3. 실시간 구장 특이사항 & 현장 제보 카드 (공사, 행사, 운영 상태 제보) */}
          <CourseSpecialNoticeCard courseId={course.id} courseName={course.name} />
        </div>

        {/* 하단 푸터 바: 닫기 & 바로 시작하기 */}
        <div className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
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
