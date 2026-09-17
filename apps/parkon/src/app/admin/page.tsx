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
  Download,
  Trophy,
  Flag
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

export interface CourseRoundRanking {
  rank: number;
  courseId: string;
  courseName: string;
  region: string;
  totalRounds: number;
  totalPlayers: number;
  isCurrentlyActive: boolean;
  activeRoomsCount: number;
  lastPlayedAtStr: string;
}

export interface LiveRoundInfo {
  roomId: string;
  courseId: string;
  courseName: string;
  courseLetter: string;
  leaderName: string;
  playerCount: number;
  players: { id: string; name: string; isLeader?: boolean }[];
  currentHole: number;
  totalHoles: number;
  status: 'WAITING' | 'STARTED';
  startedAtStr: string;
  elapsedMinutes: number;
  updatedAt: number;
}

interface Metrics {
  liveUsers: number;
  todayDAU: number;
  weeklyWAU: number;
  monthlyMAU: number;
  yearlyYAU?: number;
  totalPageviews: number;
  todayPageviews: number;
  totalAllTimeUsers: number;
  totalAppDownloads: number;
  provinceStats: ProvinceStat[];
  courseRankings?: CourseRoundRanking[];
  liveRounds?: LiveRoundInfo[];
  hourlyTrend?: Array<{ key: string; label: string; pageviews: number; uniqueVisitors: number }>;
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

  // 전국 시·도별 전체 모달 상태
  const [showAllProvincesModal, setShowAllProvincesModal] = useState(false);
  // 실시간 필드 라운딩 라이브 관제 팝업 모달 상태
  const [showLiveRoundsModal, setShowLiveRoundsModal] = useState(false);
  // 전국 구장별 실제 라운딩 랭킹 팝업 모달 상태
  const [showCourseRankingsModal, setShowCourseRankingsModal] = useState(false);
  // 시·도 상세 드릴다운 팝업 모달 상태
  const [selectedProvinceModal, setSelectedProvinceModal] = useState<ProvinceStat | null>(null);
  // 추이 상세 팝업 모달 상태 (일별, 주별, 월별, 연별)
  const [selectedTrendModal, setSelectedTrendModal] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null>(null);

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

      {/* 전국 시·도별 현황 열기 (간결한 작은 카드) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs">
        <button
          onClick={() => setShowAllProvincesModal(true)}
          className="w-full py-2.5 px-3 sm:px-4 bg-emerald-50/60 hover:bg-emerald-100/70 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-500 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer active:scale-99"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  전국 16개 시·도별 현황
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-200/70 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded font-bold shrink-0">
                  100% 팩트
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                클릭하시면 16개 시·도별 실제 유저 수, 접속자 및 클럽 현황이 팝업됩니다.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-emerald-600 group-hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs">
            <span>전국 시·도별 현황 열기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* 전국 16개 시·도 전체 카드 팝업 모달 */}
      {showAllProvincesModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    전국 16개 시·도별 실제 현황
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold rounded">100% 팩트</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    원하시는 지역 카드를 클릭하시면 해당 시·도의 <strong>세부 시·군·구별 유저 수, 접속자, 클럽</strong> 정보가 열립니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAllProvincesModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
              {provinces.map((prov) => (
                <button
                  key={prov.code}
                  onClick={() => {
                    setShowAllProvincesModal(false);
                    setSelectedProvinceModal(prov);
                  }}
                  className="aspect-square p-2.5 sm:p-3 bg-zinc-50 dark:bg-zinc-800/70 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40 border border-zinc-200 dark:border-zinc-700 hover:border-emerald-500 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
                >
                  <span className="text-sm sm:text-base font-black text-zinc-800 dark:text-zinc-100 group-hover:text-emerald-600 transition-colors">
                    {prov.name}
                  </span>
                  <div className="my-auto py-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                      {prov.userCount}
                    </span>
                  </div>
                  <div className="w-full pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60 text-[10px] sm:text-xs text-zinc-500 flex flex-col sm:flex-row items-center justify-center sm:gap-1.5 leading-tight">
                    <span>접속 <strong className="text-amber-600 dark:text-amber-400 font-bold">{prov.liveUsers}명</strong></span>
                    <span className="hidden sm:inline text-zinc-300 dark:text-zinc-600">·</span>
                    <span>클럽 {prov.clubCount}개</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowAllProvincesModal(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

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
                          <strong className={city.userCount > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500 font-medium"}>
                            {city.userCount}명
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">접속</span>
                          <strong className={city.liveUsers > 0 ? "text-amber-600 dark:text-amber-400 font-bold" : "text-zinc-400 dark:text-zinc-500 font-medium"}>
                            {city.liveUsers}명
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">클럽</span>
                          <strong className={city.clubCount > 0 ? "text-purple-600 dark:text-purple-400 font-bold" : "text-zinc-400 dark:text-zinc-500 font-medium"}>
                            {city.clubCount}개
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Clubs */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5 border-t border-zinc-200/50 dark:border-zinc-700/50 pt-2">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">소속 클럽:</span>
                      <span className={city.clubs.length > 0 ? "text-purple-600 dark:text-purple-400 font-bold" : "text-zinc-400 dark:text-zinc-500"}>
                        {city.clubs.length > 0 ? city.clubs.join(' · ') : '등록 클럽 없음 (0개)'}
                      </span>
                    </div>

                    {/* Courses */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 flex items-start gap-1.5">
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">주요 구장:</span>
                      <span className="text-emerald-700 dark:text-emerald-300">
                        {city.majorCourses && city.majorCourses.length > 0 ? city.majorCourses.join(' · ') : '인근 구장 정보 수집 중'}
                      </span>
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

      {/* 접속 및 이용 추이: 일별, 주별, 월별, 연별 4대 정사각형 버튼 타일 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              접속 및 이용 추이
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              각 버튼을 클릭하시면 시간별·일별·주별·월별 세부 추이 팝업이 열립니다.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg">
            버튼 클릭 시 상세 팝업
          </span>
        </div>

        {/* 4대 기간별 정사각형 버튼 */}
        <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. 일별 */}
          <button
            onClick={() => setSelectedTrendModal('DAILY')}
            className="aspect-square p-2 sm:p-3.5 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
          >
            <span className="text-xs sm:text-sm font-black text-blue-700 dark:text-blue-300 group-hover:scale-105 transition-transform">
              일별
            </span>
            <div className="my-auto py-0.5">
              <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {metrics?.todayDAU ?? 0}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              오늘 0시 기준
            </span>
          </button>

          {/* 2. 주별 */}
          <button
            onClick={() => setSelectedTrendModal('WEEKLY')}
            className="aspect-square p-2 sm:p-3.5 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
          >
            <span className="text-xs sm:text-sm font-black text-purple-700 dark:text-purple-300 group-hover:scale-105 transition-transform">
              주별
            </span>
            <div className="my-auto py-0.5">
              <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
                {metrics?.weeklyWAU ?? 0}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              최근 7일 누계
            </span>
          </button>

          {/* 3. 월별 */}
          <button
            onClick={() => setSelectedTrendModal('MONTHLY')}
            className="aspect-square p-2 sm:p-3.5 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
          >
            <span className="text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-300 group-hover:scale-105 transition-transform">
              월별
            </span>
            <div className="my-auto py-0.5">
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics?.monthlyMAU ?? 0}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              이번달 누계
            </span>
          </button>

          {/* 4. 연별 */}
          <button
            onClick={() => setSelectedTrendModal('YEARLY')}
            className="aspect-square p-2 sm:p-3.5 bg-amber-50/50 dark:bg-amber-950/30 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-xl sm:rounded-2xl text-center shadow-xs transition-all flex flex-col justify-between items-center group cursor-pointer active:scale-98"
          >
            <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-300 group-hover:scale-105 transition-transform">
              연별
            </span>
            <div className="my-auto py-0.5">
              <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {metrics?.yearlyYAU ?? metrics?.totalAllTimeUsers ?? 0}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium">
              올해 누계
            </span>
          </button>
        </div>
      </div>

      {/* 접속 및 이용 추이 상세 팝업 모달 */}
      {selectedTrendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                    {selectedTrendModal === 'DAILY' && '일별 접속 현황 (오늘 00시 기준 시간대별 추이)'}
                    {selectedTrendModal === 'WEEKLY' && '주간 접속 현황 (최근 7일간 일자별 추이)'}
                    {selectedTrendModal === 'MONTHLY' && '월간 접속 현황 (이번 달 포함 최근 8주 주간별 추이)'}
                    {selectedTrendModal === 'YEARLY' && '연간 접속 현황 (올해 포함 최근 12개월 월별 누계 추이)'}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    {selectedTrendModal === 'DAILY' && '한국 표준시(KST) 오늘 00:00부터 발생한 시간대별 실시간 방문 현황입니다.'}
                    {selectedTrendModal === 'WEEKLY' && '최근 7일(일주일) 동안 발생한 일자별 순방문자 및 페이지뷰 현황입니다.'}
                    {selectedTrendModal === 'MONTHLY' && '이번 달(1일 00시 기준)을 포함한 최근 8주간의 주간별 이용자 누계 현황입니다.'}
                    {selectedTrendModal === 'YEARLY' && '올해(1월 1일 기준)를 포함한 최근 12개월간의 월별 이용자 누계 현황입니다.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrendModal(null)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Summary KPI */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-xl">
              <div>
                <div className="text-xs text-zinc-400 font-medium">
                  {selectedTrendModal === 'DAILY' && '오늘 순방문자 (0시 기준 DAU)'}
                  {selectedTrendModal === 'WEEKLY' && '최근 7일 순방문자 (WAU)'}
                  {selectedTrendModal === 'MONTHLY' && '이번 달 순방문자 (MAU)'}
                  {selectedTrendModal === 'YEARLY' && '올해 누적 순방문자 (YAU)'}
                </div>
                <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {selectedTrendModal === 'DAILY' && `${metrics?.todayDAU ?? 0}명`}
                  {selectedTrendModal === 'WEEKLY' && `${metrics?.weeklyWAU ?? 0}명`}
                  {selectedTrendModal === 'MONTHLY' && `${metrics?.monthlyMAU ?? 0}명`}
                  {selectedTrendModal === 'YEARLY' && `${metrics?.yearlyYAU ?? metrics?.totalAllTimeUsers ?? 0}명`}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-400 font-medium">총 페이지 조회수</div>
                <div className="text-xl font-black text-zinc-800 dark:text-zinc-100 mt-0.5">
                  {selectedTrendModal === 'DAILY' && `${metrics?.todayPageviews ?? 0}회 (오늘)`}
                  {selectedTrendModal !== 'DAILY' && `${metrics?.totalPageviews ?? 0}회 누적`}
                </div>
              </div>
            </div>

            {/* Bar List */}
            {(() => {
              const activeList =
                selectedTrendModal === 'DAILY' ? (metrics?.hourlyTrend || []) :
                selectedTrendModal === 'WEEKLY' ? (metrics?.dailyTrend || []) :
                selectedTrendModal === 'MONTHLY' ? (metrics?.weeklyTrend || []) :
                (metrics?.monthlyTrend || []);

              const maxPv = Math.max(...activeList.map(item => item.pageviews), 1);
              const barColor =
                selectedTrendModal === 'DAILY' ? 'bg-blue-500' :
                selectedTrendModal === 'WEEKLY' ? 'bg-purple-500' :
                selectedTrendModal === 'MONTHLY' ? 'bg-emerald-500' :
                'bg-amber-500';

              return (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {activeList.length > 0 ? (
                    activeList.map((item) => {
                      const pct = Math.max(item.pageviews > 0 ? 8 : 0, Math.round((item.pageviews / maxPv) * 100));
                      const isHighlight = item.label.includes('오늘') || item.label.includes('이번') || item.label.includes('올해') || item.pageviews > 0;

                      return (
                        <div key={item.key} className="flex items-center gap-3 text-xs p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <span className={`w-28 sm:w-36 truncate font-mono ${isHighlight ? 'font-bold text-blue-600 dark:text-blue-400' : 'text-zinc-500'}`}>
                            {item.label}
                          </span>
                          <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-3 overflow-hidden flex items-center">
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
                    <p className="text-xs text-zinc-400 py-8 text-center">집계된 데이터가 없습니다.</p>
                  )}
                </div>
              );
            })()}

            {/* Close Button */}
            <div className="pt-2">
              <button
                onClick={() => setSelectedTrendModal(null)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 실시간 라운딩 관제 센터 (간결한 작은 카드: 클릭 시 경기 진행 상세 팝업) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs">
        <button
          onClick={() => setShowLiveRoundsModal(true)}
          className="w-full py-2.5 px-3 sm:px-4 bg-red-50/60 hover:bg-red-100/70 dark:bg-red-950/30 dark:hover:bg-red-950/60 border border-red-200/80 dark:border-red-800/60 hover:border-red-500 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer active:scale-99"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  실시간 필드 라운딩 관제 센터
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded font-bold shrink-0">
                  {metrics?.liveRounds && metrics.liveRounds.length > 0 ? `${metrics.liveRounds.length}개 팀 활동 중` : '대기'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                클릭하시면 현재 필드에서 누가 어떻게 경기 중인지 상세 팝업이 열립니다.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-red-600 group-hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs">
            <span>실시간 경기 현황 열기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* 3. 전국 구장별 실시간 라운딩 랭킹 (동일한 크기의 작은 카드: 클릭 시 1위~ 순위표 팝업) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 sm:p-3.5 shadow-xs">
        <button
          onClick={() => setShowCourseRankingsModal(true)}
          className="w-full py-2.5 px-3 sm:px-4 bg-amber-50/60 hover:bg-amber-100/70 dark:bg-amber-950/30 dark:hover:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 hover:border-amber-500 rounded-xl transition-all flex items-center justify-between gap-3 text-left group cursor-pointer active:scale-99"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100">
                  전국 구장별 실시간 라운딩 랭킹
                </span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 rounded font-bold shrink-0">
                  1위~ 순위표
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap overflow-hidden text-ellipsis mt-0.5">
                클릭하시면 전국 구장별 실제 라운딩 순위 집계표(1위부터)가 팝업됩니다.
              </p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-amber-600 group-hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap shadow-xs">
            <span>전국 구장 랭킹 열기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* 4. 전국 구장 라이브 랭킹 롤링 전광판 (글자가 나오고 이동하는 코너) */}
      <div className="bg-zinc-900 text-zinc-100 rounded-2xl p-3 sm:p-3.5 shadow-md border border-zinc-800 flex items-center gap-3 overflow-hidden">
        <div className="flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 animate-pulse shadow-xs">
          <Radio className="w-3.5 h-3.5" />
          <span className="whitespace-nowrap">LIVE 속보</span>
        </div>
        <div
          className="flex-1 overflow-hidden relative cursor-pointer"
          onClick={() => setShowCourseRankingsModal(true)}
          title="클릭 시 전체 랭킹 및 현황 팝업"
        >
          <div className="whitespace-nowrap flex items-center gap-8 text-xs sm:text-sm font-medium text-zinc-200 animate-marquee">
            <span className="text-amber-400 font-bold">🏆 [전국 구장 누적 랭킹]</span>
            {metrics?.courseRankings && metrics.courseRankings.length > 0 ? (
              metrics.courseRankings.slice(0, 6).map((c) => (
                <span key={c.courseId} className="inline-flex items-center gap-1 shrink-0">
                  <strong className="text-amber-300 font-black">{c.rank}위</strong>
                  <span>{c.courseName}</span>
                  <span className="text-zinc-400 text-[11px]">({c.totalRounds}회 · {c.totalPlayers}명)</span>
                  {c.isCurrentlyActive && <span className="text-red-400 font-black text-[11px] ml-1 animate-pulse">🔴라운딩중</span>}
                </span>
              ))
            ) : (
              <span>구장별 실시간 집계 중...</span>
            )}
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-bold">⚡ [필드 라이브]</span>
            {metrics?.liveRounds && metrics.liveRounds.length > 0 ? (
              metrics.liveRounds.map((r) => (
                <span key={r.roomId} className="text-emerald-300 shrink-0">
                  ⛳ {r.courseName} ({r.leaderName}조 {r.playerCount}인 {r.courseLetter}-{r.currentHole}번홀 경기 중)
                </span>
              ))
            ) : (
              <span className="text-zinc-400 shrink-0">새 라운드 시작 시 이곳에 즉시 실시간 연결됩니다</span>
            )}
          </div>
        </div>
      </div>

      {/* 실시간 필드 라운딩 라이브 관제 팝업 모달 */}
      {showLiveRoundsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    실시간 필드 라운딩 라이브 관제
                    <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold rounded">
                      LIVE
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    현재 전국 구장에서 우리 회원 사용자들이 실시간으로 경기 중인 팀 및 플레이어 상세 현황입니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLiveRoundsModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 pt-1">
              {metrics?.liveRounds && metrics.liveRounds.length > 0 ? (
                metrics.liveRounds.map((room) => {
                  const isStarted = room.status === 'STARTED';
                  return (
                    <div
                      key={room.roomId}
                      className={`p-4 rounded-xl border transition-all ${
                        isStarted
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-xs'
                          : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {/* 상단: 구장명 및 상태 배지 */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-black text-sm text-zinc-900 dark:text-zinc-100">
                          <Flag className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{room.courseName}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                            {room.courseLetter}코스
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
                            isStarted
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          {isStarted ? '경기 진행 중' : '티샷 대기 중'}
                        </span>
                      </div>

                      {/* 조원 4인 명단 (누가 참가하고 있는지) */}
                      <div className="mt-2.5 text-xs">
                        <div className="text-zinc-500 text-[11px] mb-1 font-medium">
                          👥 참여 골퍼 ({room.playerCount}인 1조):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {room.players.map((p, pIdx) => (
                            <span
                              key={p.id || pIdx}
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                p.isLeader || pIdx === 0
                                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                  : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                              }`}
                            >
                              {p.isLeader || pIdx === 0 ? `👑 ${p.name}(조장)` : p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 진행 홀 및 시간 정보 (어떻게 진행 중인지) */}
                      <div className="mt-3 pt-2.5 border-t border-zinc-200/70 dark:border-zinc-700/70 flex items-center justify-between text-xs font-medium">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
                          <span>⛳ {room.courseLetter}-{room.currentHole}번홀 진행 중</span>
                          <span className="text-zinc-400 font-normal">/ {room.totalHoles}홀</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500 text-xs">
                          <Clock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{room.startedAtStr} 티샷</span>
                          <strong className="text-amber-600 dark:text-amber-400 font-bold">({room.elapsedMinutes}분 경과)</strong>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 px-4 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    현재 필드에서 진행 중인 실시간 정식 라운드가 없습니다.
                  </div>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    가상/테스트 라운딩 및 25분 이상 방치된 세션은 <strong>5단계 팩트 검증 엔진</strong>에 의해 100% 자동 필터링됩니다. 회원이 필드에서 실제 정식 라운드를 진행하면 즉시 감지되어 표출됩니다.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowLiveRoundsModal(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 전국 구장별 실시간 라운딩 랭킹 팝업 모달 */}
      {showCourseRankingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    전국 구장별 실제 라운딩 랭킹
                    <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold rounded">
                      1위부터 순위표
                    </span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    실제 회원들이 필드에서 개설하고 플레이한 누적 라운드 건수 및 총 플레이어 기준 순위입니다.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCourseRankingsModal(false)}
                className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-x-auto pt-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                    <th className="py-2.5 px-3 font-semibold w-14 text-center">순위</th>
                    <th className="py-2.5 px-3 font-semibold">구장명 및 소재지</th>
                    <th className="py-2.5 px-3 font-semibold text-right">누적 라운딩</th>
                    <th className="py-2.5 px-3 font-semibold text-right">누적 플레이어</th>
                    <th className="py-2.5 px-3 font-semibold text-center">현재 라운딩 상태</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {metrics?.courseRankings && metrics.courseRankings.length > 0 ? (
                    metrics.courseRankings.map((c) => {
                      const isTop1 = c.rank === 1;
                      const isTop2 = c.rank === 2;
                      const isTop3 = c.rank === 3;
                      return (
                        <tr
                          key={c.courseId + c.courseName}
                          className={`hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors ${
                            c.isCurrentlyActive ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isTop1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-sm shadow-xs">
                                🥇
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-slate-900 font-black text-sm">
                                🥈
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-sm">
                                🥉
                              </span>
                            ) : (
                              <span className="font-bold text-zinc-500 font-mono text-sm">
                                {c.rank}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 text-sm">
                              <span>{c.courseName}</span>
                              {c.isCurrentlyActive && (
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-zinc-400 flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                              <span>{c.region}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono text-base">
                              {c.totalRounds}
                            </span>
                            <span className="text-zinc-500 text-xs ml-0.5">회</span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-base">
                              {c.totalPlayers}
                            </span>
                            <span className="text-zinc-500 text-xs ml-0.5">명</span>
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {c.isCurrentlyActive ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 animate-pulse shadow-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                현재 라운딩 중 ({c.activeRoomsCount}개 조)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                                대기
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400">
                        아직 집계된 구장별 라운딩 기록이 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowCourseRankingsModal(false)}
                className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Marquee Animation Style */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 28s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

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
