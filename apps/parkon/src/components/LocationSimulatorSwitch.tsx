'use client';

import React, { useState, useEffect } from 'react';
import { Compass, Check, X, RefreshCw, ChevronUp, ChevronDown, Globe, MapPin, Sparkles } from 'lucide-react';
import { GeoCountryService, GeoCountryResult, MOCK_LOCATION_PRESETS, ServiceCountry, ServiceLanguage } from '@/lib/geoCountryService';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export function LocationSimulatorSwitch() {
  const { language, setLanguage } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [geoState, setGeoState] = useState<GeoCountryResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 초기 로딩 시 현재 상태 조회
    const initial = GeoCountryService.getCurrentState();
    setGeoState(initial);

    // 실제 위치 감지도 백그라운드로 1회 실행
    GeoCountryService.detectLocationAndCountry().then((res) => {
      setGeoState(res);
    });

    const handleUpdate = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setGeoState(GeoCountryService.getCurrentState());
      }
    };

    window.addEventListener('parky_geo_updated', handleUpdate);
    window.addEventListener('parkon_country_changed', handleUpdate);

    return () => {
      window.removeEventListener('parky_geo_updated', handleUpdate);
      window.removeEventListener('parkon_country_changed', handleUpdate);
    };
  }, []);

  if (!mounted) return null;

  const currentCountry = geoState?.country || 'KR';
  const isMock = geoState?.source === 'MOCK_GPS';
  const mockId = geoState?.mockPresetId;

  const handleSelectMock = (presetKey: keyof typeof MOCK_LOCATION_PRESETS | 'CLEAR') => {
    const updated = GeoCountryService.setMockLocation(presetKey);
    setGeoState(updated);
    setLanguage(updated.language);
  };

  return (
    <div className="fixed bottom-20 left-3 z-45 font-sans animate-in fade-in">
      {/* 1. 축소 상태 (미니 플로팅 뱃지) */}
      {!isOpen ? (
        <button
          type="button"
          data-testid="location-sim-toggle"
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black shadow-lg border backdrop-blur-md transition active:scale-95 cursor-pointer ${
            isMock
              ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 ring-2 ring-amber-400/30'
              : 'bg-stone-900/85 hover:bg-stone-900 text-white border-stone-700'
          }`}
          title="위치(GPS) 시뮬레이터 및 국가 전환 테스트 스위치"
        >
          <Compass className={`w-3.5 h-3.5 ${isMock ? 'text-stone-950 animate-spin-slow' : 'text-emerald-400'}`} />
          <span>
            {isMock ? `🛰️ [모의] ${currentCountry}` : `📍 ${currentCountry}`}
          </span>
          <span className="text-[10px] opacity-75">({geoState?.language || language})</span>
          <ChevronUp className="w-3 h-3 opacity-60" />
        </button>
      ) : (
        /* 2. 확장 상태 (모의 위치 선택 팝업 컨트롤러) */
        <div className="bg-stone-950/95 text-white rounded-2xl p-3.5 w-72 shadow-2xl border border-stone-800 backdrop-blur-md space-y-3 animate-in zoom-in-95">
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black text-stone-100">위치(GPS) 시뮬레이터</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-5 h-5 rounded-full hover:bg-stone-800 flex items-center justify-center text-stone-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 현재 감지 상태 안내 */}
          <div className="bg-stone-900 rounded-xl p-2.5 text-[11px] space-y-1 border border-stone-800">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">감지 상태:</span>
              <span className={`font-black ${isMock ? 'text-amber-400' : 'text-emerald-400'}`}>
                {isMock ? '🛰️ 모의(Mock) GPS 활성' : '📡 실제 GPS / 브라우저'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">현재 국가 / 언어:</span>
              <span className="font-bold text-stone-200">
                {currentCountry === 'KR' ? '🇰🇷 한국' : currentCountry === 'JP' ? '🇯🇵 일본' : '🇺🇸 글로벌'} ({geoState?.language || language})
              </span>
            </div>
            {geoState?.coords && (
              <div className="text-[10px] text-stone-500 font-mono truncate">
                좌표: {geoState.coords.lat.toFixed(4)}, {geoState.coords.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* 모의 위치 프리셋 선택 버튼 목록 */}
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-stone-400 px-0.5">테스트 위치 강제 선택:</div>

            {/* 한국(구미) */}
            <button
              type="button"
              data-testid="mock-kr-gumi"
              onClick={() => handleSelectMock('KR_GUMI')}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                isMock && mockId === 'KR_GUMI'
                  ? 'bg-emerald-600 text-white shadow-xs font-black'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇰🇷</span>
                <span className="truncate">한국 (경북 구미 동락)</span>
              </div>
              {isMock && mockId === 'KR_GUMI' && <Check className="w-3.5 h-3.5 text-white" />}
            </button>

            {/* 일본(삿포로) */}
            <button
              type="button"
              data-testid="mock-jp-sapporo"
              onClick={() => handleSelectMock('JP_SAPPORO')}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                isMock && mockId === 'JP_SAPPORO'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇯🇵</span>
                <span className="truncate">일본 (홋카이도 삿포로)</span>
              </div>
              {isMock && mockId === 'JP_SAPPORO' && <Check className="w-3.5 h-3.5 text-stone-950" />}
            </button>

            {/* 일본(도쿄) */}
            <button
              type="button"
              onClick={() => handleSelectMock('JP_TOKYO')}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                isMock && mockId === 'JP_TOKYO'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-black'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇯🇵</span>
                <span className="truncate">일본 (도쿄/관동)</span>
              </div>
              {isMock && mockId === 'JP_TOKYO' && <Check className="w-3.5 h-3.5 text-stone-950" />}
            </button>

            {/* 미국/해외 (Global) */}
            <button
              type="button"
              onClick={() => handleSelectMock('GLOBAL_US')}
              className={`w-full py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                isMock && mockId === 'GLOBAL_US'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>🇺🇸</span>
                <span className="truncate">미국/해외 (글로벌 EN)</span>
              </div>
              {isMock && mockId === 'GLOBAL_US' && <Check className="w-3.5 h-3.5 text-white" />}
            </button>

            {/* 실제 GPS 자동 감지로 복귀 */}
            <button
              type="button"
              onClick={() => handleSelectMock('CLEAR')}
              className="w-full mt-2 py-2 px-2.5 rounded-xl text-xs font-black text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>실제 GPS 자동감지 (Mock 해제)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
