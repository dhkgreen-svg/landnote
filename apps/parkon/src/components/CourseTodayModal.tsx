'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, MapPin, Navigation, Phone, Search, Play, Check, Copy } from 'lucide-react';
import { Course } from '@/types/parkon';
import { ConditionStatus } from '@/components/ConditionStatus';

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
  const [showNavModal, setShowNavModal] = useState(false);
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

          {/* 3. 주차장 직행 내비게이션 & 주소 원터치 탭 (화이트/소프트 톤으로 상단보다 정돈된 디자인) */}
          <button
            type="button"
            onClick={() => setShowNavModal(true)}
            className="w-full bg-white hover:bg-emerald-50/70 text-emerald-950 font-black py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer group border-2 border-emerald-600/70 text-center"
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shrink-0">
              🧭
            </div>
            <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight">
              주차장 직행 내비게이션 &amp; 주소
            </span>
          </button>

          {/* 4. 동락파크골프장 코스 정보 보기 및 정정하기 (화이트/소프트 톤으로 정돈) */}
          {onOpenCourseDetail && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCourseDetail();
              }}
              className="w-full bg-white hover:bg-emerald-50/70 text-emerald-950 font-black py-3 px-4 rounded-2xl shadow-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer group border-2 border-emerald-600/70 text-center"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm group-hover:scale-110 transition-transform shrink-0">
                📐
              </div>
              <span className="text-xs sm:text-sm font-black text-emerald-950 tracking-tight">
                {cName} 코스 정보 보기 및 정정하기
              </span>
            </button>
          )}
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

      {/* 주차장 직행 내비게이션 & 주소 전용 팝업창 모달 */}
      {showNavModal && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-stone-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* 팝업 헤더 */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-4 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-amber-300">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm">{cName}</h3>
                  <p className="text-[10.5px] text-emerald-200">주차장 직행 내비게이션 &amp; 주소 안내</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 팝업 내용 */}
            <div className="p-4 space-y-3">
              {/* 주차장 시설 배지 */}
              {course.parking && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-600">주차 시설</span>
                  <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                    🅿️ {course.parking}
                  </span>
                </div>
              )}

              {/* 주소 및 원클릭 복사 */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-stone-500 block">구장 공식 주소</span>
                  <span className="text-xs font-black text-stone-800 break-keep leading-snug">{cAddr}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyAddr}
                  className="shrink-0 bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 text-[10px] font-black px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                >
                  {copied ? '복사됨 ✓' : '주소 복사'}
                </button>
              </div>

              {/* 3대 내비 앱 원클릭 길안내 버튼 */}
              <div className="space-y-2 pt-1">
                {/* 카카오내비 */}
                <a
                  href={kakaoNaviUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black py-3 px-4 rounded-xl flex items-center justify-between transition shadow-xs cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-[#191919] text-[#FEE500] font-black text-xs flex items-center justify-center">K</span>
                    <span className="text-xs font-black">카카오내비 / 카카오맵</span>
                  </div>
                  <span className="text-[11px] font-bold text-stone-700">길안내 ▶</span>
                </a>

                {/* 티맵 */}
                <a
                  href={tmapWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-4 rounded-xl flex items-center justify-between transition shadow-xs cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-blue-600 font-black text-xs flex items-center justify-center">T</span>
                    <span className="text-xs font-black">티맵(TMAP) 내비</span>
                  </div>
                  <span className="text-[11px] font-bold text-blue-100">길안내 ▶</span>
                </a>

                {/* 네이버 지도 */}
                <a
                  href={naverMapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#03C75A] hover:bg-[#02b351] text-white font-black py-3 px-4 rounded-xl flex items-center justify-between transition shadow-xs cursor-pointer active:scale-98"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-white text-[#03C75A] font-black text-xs flex items-center justify-center">N</span>
                    <span className="text-xs font-black">네이버 지도</span>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-100">길안내 ▶</span>
                </a>
              </div>

              {/* 관리사무소 직통 전화 */}
              {cPhone && (
                <a
                  href={`tel:${cPhone.replace(/[^0-9]/g, '')}`}
                  className="w-full bg-stone-100 hover:bg-stone-200 text-stone-800 font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition text-xs border border-stone-200 mt-2 cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>관리사무소 통화 문의 ({cPhone})</span>
                </a>
              )}
            </div>

            {/* 팝업 닫기 버튼 */}
            <div className="p-3 bg-stone-50 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setShowNavModal(false)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 active:scale-98 text-white font-black rounded-xl text-xs transition cursor-pointer"
              >
                창 닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
