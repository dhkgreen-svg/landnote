'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Users, 
  Eye, 
  TrendingUp, 
  Radio, 
  Clock, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  ExternalLink, 
  Smartphone, 
  Monitor, 
  Globe, 
  LogOut, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Activity,
  Building2,
  ChevronRight,
  Flame,
  Award,
  Download
} from 'lucide-react';

interface CityDetailStat {
  cityName: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  clubs: string[];
  majorCourses: string[];
  activityIndex: string;
}

interface ProvinceStat {
  code: string;
  name: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  userPercentage: number;
  activityLabel: string;
  cities: CityDetailStat[];
}

interface Metrics {
  liveUsers: number;
  todayDAU: number;
  weeklyWAU: number;
  monthlyMAU: number;
  totalPageviews: number;
  todayPageviews: number;
  totalAllTimeUsers: number;
  totalAppDownloads: number;
  provinceStats: ProvinceStat[];
  dailyTrend: Array<{ key: string; label: string; pageviews: number; uniqueVisitors: number }>;
  weeklyTrend: Array<{ key: string; label: string; pageviews: number; uniqueVisitors: number }>;
  monthlyTrend: Array<{ key: string; label: string; pageviews: number; uniqueVisitors: number }>;
  yearlyTrend: Array<{ key: string; label: string; pageviews: number; uniqueVisitors: number }>;
  popularPages: Record<string, number>;
  recentVisitors: Array<{
    id: string;
    ip: string;
    userAgent: string;
    path: string;
    referrer: string;
    timestamp: number;
    dateStr: string;
    timeStr: string;
    userRegion?: string;
    homeCourse?: string;
    userName?: string;
  }>;
}

export default function AdminDashboardPage() {
  const [pin, setPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // 시·도 상세 드릴다운 팝업 모달 상태
  const [selectedProvinceModal, setSelectedProvinceModal] = useState<ProvinceStat | null>(null);
  const [trendPeriod, setTrendPeriod] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'>('DAILY');

  // Check saved session PIN on load (6자리 768517)
  useEffect(() => {
    const savedPin = sessionStorage.getItem('parkon_admin_pin');
    if (savedPin === '768517') {
      setPin('768517');
      fetchMetrics('768517');
    }
  }, []);

  const fetchMetrics = useCallback(async (authPin: string) => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/admin/analytics?pin=${authPin}`, {
        headers: { 'Cache-Control': 'no-cache' },
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('마스터 보안암호(PIN)가 일치하지 않습니다.');
        }
        throw new Error('데이터를 불러오는 중 오류가 발생했습니다.');
      }
      const data = await res.json();
      setMetrics(data.metrics);
      setIsAuthenticated(true);
      sessionStorage.setItem('parkon_admin_pin', authPin);
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      setErrorMsg(err.message || '인증 실패');
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-refresh interval when authenticated (60s / 1 minute to save traffic)
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(pin || '768517');
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, pin, fetchMetrics]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('PIN 6자리를 입력해주세요.');
      return;
    }
    fetchMetrics(pin.trim());
  };

  const handleLogout = () => {
    sessionStorage.removeItem('parkon_admin_pin');
    setIsAuthenticated(false);
    setPin('');
    setMetrics(null);
  };

  const parseDevice = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('android') || ua.includes('iphone') || ua.includes('mobile')) {
      return { type: '모바일', icon: Smartphone, color: 'text-amber-500' };
    }
    return { type: '데스크톱', icon: Monitor, color: 'text-blue-500' };
  };

  const getPageTitle = (p: string) => {
    if (p === '/') return '메인 홈 (스코어카드/구장)';
    if (p.startsWith('/rules')) return '경기 규정집 & 웹툰';
    if (p.startsWith('/courses')) return '전국 구장 검색';
    if (p.startsWith('/club')) return '파크온 클럽 커뮤니티';
    if (p.startsWith('/round')) return '멀티플레이 실시간 라운드';
    if (p.startsWith('/admin')) return '관리자 대시보드';
    return p;
  };

  const provinces = useMemo(() => {
    return metrics?.provinceStats ?? [];
  }, [metrics?.provinceStats]);

  // --- PIN Locked Screen (6자리 암호) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 mb-3 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              ParkOn 마스터 관리자
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              관리자 전용 마스터 PIN(6자리)을 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                마스터 PIN 암호 (6자리)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN 6자리 입력"
                autoFocus
                className="w-full text-center tracking-widest text-2xl font-mono py-3.5 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>관리자 대시보드 입장</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300">
              ← 일반 사용자 메인화면으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const maxPvInTrend = metrics?.dailyTrend 
    ? Math.max(...Object.values(metrics.dailyTrend).map(d => d.pageviews), 1)
    : 1;

  // --- Authenticated Dashboard ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Master Header (Single Slim Row) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl p-3 sm:p-4 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          {/* Brand Logo & Subtitle in one inline group */}
          <div className="flex items-baseline gap-1.5 sm:gap-2 shrink-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white whitespace-nowrap">
              ParkOn
            </h1>
            <span className="text-xs sm:text-sm font-bold text-emerald-200 tracking-tight whitespace-nowrap">
              전국 통합 관제센터
            </span>
          </div>

          {/* Action Buttons right aligned on the same row */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={() => fetchMetrics(pin)}
              disabled={isLoading}
              className="py-1 px-2 sm:px-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-colors backdrop-blur-sm whitespace-nowrap"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`py-1 px-2 sm:px-2.5 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap ${
                autoRefresh
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Radio className={`w-3 h-3 ${autoRefresh ? 'animate-pulse' : ''}`} />
              <span>실시간(1분) {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="py-1 px-2 sm:px-2.5 bg-red-500/80 hover:bg-red-600 rounded-xl text-[11px] sm:text-xs font-semibold flex items-center justify-center gap-1 transition-colors whitespace-nowrap"
            >
              <LogOut className="w-3 h-3" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {lastRefreshed && (
          <div className="mt-2.5 pt-2 border-t border-emerald-600/40 flex items-center justify-between text-[11px] sm:text-xs text-emerald-200/80">
            <span>갱신: {lastRefreshed} (1분 자동)</span>
            <span className="flex items-center gap-1 text-amber-200 font-semibold">
              <Sparkles className="w-3 h-3 text-amber-300" />
              마스터 : 김대희 (총괄)
            </span>
          </div>
        )}
      </div>

      {/* 4대 핵심 집계 카드: 아이콘 제거 및 완전 중앙 정렬 미니멀 구조 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* 1. 총 가입자 수 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-xs hover:border-emerald-400 transition-colors">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
            총 가입자 수
          </div>
          <div className="mt-1.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics?.totalAllTimeUsers ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
        </div>

        {/* 2. 오늘 이용자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-xs hover:border-blue-400 transition-colors">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
            오늘 이용자
          </div>
          <div className="mt-1.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {metrics?.todayDAU ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
        </div>

        {/* 3. 현재 접속자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-xs hover:border-amber-400 transition-colors">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
            현재 접속자
          </div>
          <div className="mt-1.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {metrics?.liveUsers ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
        </div>

        {/* 4. 주간 이용자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center shadow-xs hover:border-purple-400 transition-colors">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300">
            주간 이용자
          </div>
          <div className="mt-1.5 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.weeklyWAU ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
        </div>
      </div>

      {/* 전국 시·도별 실제 현황 (유저 수 1순위, 현재 접속자 2순위, 클릭 시 상세 시·군 조회) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              전국 시·도별 실제 현황
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              각 지역 카드를 클릭하시면 해당 시·도의 <strong>세부 시·군·구별 유저 수, 실시간 접속자, 클럽 및 주요 구장</strong> 상세 정보가 열립니다.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg self-start sm:self-auto">
            클릭하여 세부 시·군 조회
          </span>
        </div>

        {/* 한 줄에 4개씩 4줄 배치 (총 16개 시·도 정사각형 미니멀 카드) */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3.5">
          {provinces.map((prov) => (
            <button
              key={prov.code}
              onClick={() => setSelectedProvinceModal(prov)}
              className="aspect-square p-2 sm:p-3 bg-zinc-50 dark:bg-zinc-800/70 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
            >
              {/* 상단: 지역명 */}
              <span className="text-sm sm:text-base font-black text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                {prov.name}
              </span>

              {/* 중앙: 유저 수 (단위/글자 없이 굵은 숫자만) */}
              <div className="my-auto py-0.5">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {prov.userCount}
                </span>
              </div>

              {/* 하단: 접속자 및 클럽 수 */}
              <div className="w-full pt-1 sm:pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[10px] sm:text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-center sm:gap-1.5 leading-tight">
                <span>접속 <strong className="text-amber-600 dark:text-amber-400 font-bold">{prov.liveUsers}명</strong></span>
                <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">·</span>
                <span>클럽 {prov.clubCount}개</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 시·도 상세 드릴다운 팝업 모달 (예: 경북 클릭 시 구미, 포항, 경주, 김천, 안동 등 세부 현황) */}
      {selectedProvinceModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                      {selectedProvinceModal.name} 지역 세부 인프라 현황
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                      {selectedProvinceModal.activityLabel}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    해당 시·도 내 주요 시·군별 유저 수, 실시간 접속자, 클럽 및 활동 구장
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedProvinceModal(null)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Core Summary Cards */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
                <div className="text-xs text-zinc-500 font-medium">총 유저 수</div>
                <div className="text-xl font-black text-emerald-600 mt-0.5">{selectedProvinceModal.userCount}명</div>
                <div className="text-[10px] text-zinc-400">전국 대비 {selectedProvinceModal.userPercentage}%</div>
              </div>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                <div className="text-xs text-zinc-500 font-medium">현재 실시간 접속</div>
                <div className="text-xl font-black text-amber-600 mt-0.5">{selectedProvinceModal.liveUsers}명</div>
                <div className="text-[10px] text-zinc-400">동시 활동 골퍼</div>
              </div>
              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl">
                <div className="text-xs text-zinc-500 font-medium">등록 클럽 수</div>
                <div className="text-xl font-black text-purple-600 mt-0.5">{selectedProvinceModal.clubCount}개</div>
                <div className="text-[10px] text-zinc-400">정규 클럽/동호회</div>
              </div>
            </div>

            {/* Detailed Cities/Districts Breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  {selectedProvinceModal.name} 소속 시·군별 상세 내역 ({selectedProvinceModal.cities.length}개 거점)
                </span>
                <span className="text-[11px] text-zinc-400 font-normal">유저 순 정렬</span>
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {selectedProvinceModal.cities.map((city) => (
                  <div
                    key={city.cityName}
                    className="p-3.5 bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-2 hover:border-emerald-400 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{city.cityName}</span>
                        <span className="text-[10px] px-2 py-0.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium rounded">
                          {city.activityIndex}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">유저</span>
                          <strong className="text-emerald-600 font-bold">{city.userCount}명</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">접속</span>
                          <strong className="text-amber-600 font-bold">{city.liveUsers}명</strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">클럽</span>
                          <strong className="text-purple-600 font-bold">{city.clubCount}개</strong>
                        </div>
                      </div>
                    </div>

                    {/* Clubs */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-2">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">소속 클럽:</span>
                      <span className="text-zinc-600 dark:text-zinc-300">{city.clubs.join(' · ')}</span>
                    </div>

                    {/* Courses */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">주요 구장:</span>
                      <span className="text-emerald-700 dark:text-emerald-300">{city.majorCourses.join(' · ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedProvinceModal(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column: 인기 페이지 TOP 6 & 최근 7일간 일별 접속 추이 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Pages */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            가장 많이 찾는 인기 페이지 TOP 6
          </h2>
          <div className="space-y-3">
            {metrics?.popularPages && Object.keys(metrics.popularPages).length > 0 ? (
              Object.entries(metrics.popularPages)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 6)
                .map(([path, count], idx) => {
                  const maxVal = Math.max(...Object.values(metrics.popularPages));
                  const pct = Math.max(8, Math.round((count / (maxVal || 1)) * 100));
                  return (
                    <div key={path} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-center text-xs font-bold leading-5">
                            {idx + 1}
                          </span>
                          <span>{getPageTitle(path)}</span>
                          <span className="text-zinc-400 text-[11px] font-mono">({path})</span>
                        </span>
                        <strong className="text-emerald-600 font-bold">{count}회</strong>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">아직 집계된 페이지 뷰가 없습니다.</p>
            )}
          </div>
        </div>

{/* Multi-Period Trend Chart (일별 / 주별 / 월별 / 연별) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  접속 및 이용 추이 (일별 · 주별 · 월별 · 연별)
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  데이터가 누적 보존되어 장기적인 성장세를 정밀 분석할 수 있습니다.
                </p>
              </div>

              {/* 4 Period Toggle Buttons */}
              <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl self-start sm:self-auto">
                <button
                  onClick={() => setTrendPeriod('DAILY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    trendPeriod === 'DAILY'
                      ? 'bg-white dark:bg-zinc-900 text-blue-600 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  일별(7일)
                </button>
                <button
                  onClick={() => setTrendPeriod('WEEKLY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    trendPeriod === 'WEEKLY'
                      ? 'bg-white dark:bg-zinc-900 text-purple-600 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  주별(8주)
                </button>
                <button
                  onClick={() => setTrendPeriod('MONTHLY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    trendPeriod === 'MONTHLY'
                      ? 'bg-white dark:bg-zinc-900 text-emerald-600 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  월별(1년)
                </button>
                <button
                  onClick={() => setTrendPeriod('YEARLY')}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                    trendPeriod === 'YEARLY'
                      ? 'bg-white dark:bg-zinc-900 text-amber-600 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  연별(누계)
                </button>
              </div>
            </div>

            {/* Render Active Trend List */}
            {(() => {
              const activeList = 
                trendPeriod === 'DAILY' ? (metrics?.dailyTrend || []) :
                trendPeriod === 'WEEKLY' ? (metrics?.weeklyTrend || []) :
                trendPeriod === 'MONTHLY' ? (metrics?.monthlyTrend || []) :
                (metrics?.yearlyTrend || []);

              const maxPv = Math.max(...activeList.map(item => item.pageviews), 1);

              const barColor = 
                trendPeriod === 'DAILY' ? 'bg-blue-500' :
                trendPeriod === 'WEEKLY' ? 'bg-purple-500' :
                trendPeriod === 'MONTHLY' ? 'bg-emerald-500' :
                'bg-amber-500';

              return (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {activeList.length > 0 ? (
                    activeList.map((item) => {
                      const pct = Math.max(6, Math.round((item.pageviews / maxPv) * 100));
                      const isCurrent = item.label.includes('오늘') || item.label.includes('이번') || item.label.includes('올해');

                      return (
                        <div key={item.key} className="flex items-center gap-3 text-xs">
                          <span className={`w-36 truncate font-mono ${isCurrent ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}>
                            {item.label}
                          </span>
                          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3.5 overflow-hidden flex items-center">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="w-24 text-right flex items-center justify-end gap-1.5 font-mono">
                            <strong className="text-zinc-900 dark:text-zinc-100">{item.pageviews}PV</strong>
                            <span className="text-zinc-400 text-[11px]">({item.uniqueVisitors}명)</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-zinc-400 py-6 text-center">추이 데이터 집계 중</p>
                  )}
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
            <span>• PV: 총 조회 페이지수</span>
            <span>• 괄호 (명): 중복 제외 순수 방문 골퍼수</span>
          </div>
        </div>
      </div>

            {/* 실시간 방문자 로그 (최근 30건 상세 기록) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              실시간 방문자 로그 (최근 30건 상세)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              개인정보 보호법에 따라 IP 뒷자리는 안전하게 마스킹 처리되며, 실제 접속 지역 및 기기를 표기합니다.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg">
            총 {metrics?.recentVisitors?.length ?? 0}개 기록
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3 font-semibold">방문 일시</th>
                <th className="py-2.5 px-3 font-semibold">지역 거점</th>
                <th className="py-2.5 px-3 font-semibold">접속 경로</th>
                <th className="py-2.5 px-3 font-semibold">마스킹 IP</th>
                <th className="py-2.5 px-3 font-semibold">기기 / 브라우저</th>
                <th className="py-2.5 px-3 font-semibold">유입 경로</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {metrics?.recentVisitors && metrics.recentVisitors.length > 0 ? (
                metrics.recentVisitors.map((v) => {
                  const dev = parseDevice(v.userAgent);
                  const DevIcon = dev.icon;
                  return (
                    <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500 whitespace-nowrap">
                        {v.dateStr} {v.timeStr}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-medium text-[11px] bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                          {v.userRegion || '경북 구미시'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-zinc-800 dark:text-zinc-200">
                        {getPageTitle(v.path)}
                        <span className="text-[11px] text-zinc-400 font-mono ml-1">({v.path})</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-zinc-500">
                        {v.ip}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-400">
                          <DevIcon className={`w-3.5 h-3.5 ${dev.color}`} />
                          <span>{dev.type}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-zinc-500 max-w-xs truncate">
                        {v.referrer}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-zinc-400">
                    아직 기록된 방문 로그가 없습니다. 새 창에서 www.parkongolf.com 을 탐색하면 실시간으로 나타납니다!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 관리자 빠른 링크 */}
      <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-3 flex items-center gap-2">
          <span>⚙️</span> 파크온 마스터 관리 센터 빠른 링크
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">구글 플레이 콘솔</div>
              <div className="text-[11px] text-zinc-400">앱 출시 및 본인인증 심사 현황</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>

          <a
            href="https://band.us"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">네이버 밴드 홍보센터</div>
              <div className="text-[11px] text-zinc-400">#파크골프뉴스밴드 포스팅 관리</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </a>

          <Link
            href="/rules"
            className="p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:border-emerald-500 transition-colors flex items-center justify-between"
          >
            <div>
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">어르신 왕글씨 규정집 & 웹툰</div>
              <div className="text-[11px] text-zinc-400">규정집 글자 크기 3단계 점검</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
