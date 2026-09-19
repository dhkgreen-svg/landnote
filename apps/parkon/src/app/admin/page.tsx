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
  Flag,
  Search
} from 'lucide-react';

export interface ProvinceUserItem {
  id: string;
  name: string;
  isNamedUser?: boolean;
  isKakaoUser?: boolean;
  city: string;
  homeCourse: string;
  lastPath: string;
  lastActiveTime: string;
  firstActiveTime?: string;
  visitCount?: number;
  deviceType?: string;
  trafficSource?: string;
  timestamp: number;
  isLive: boolean;
}

export interface CityClubDetail {
  id: string;
  name: string;
  province: string;
  city: string;
  homeCourseName: string;
  memberCount: number;
  managerName: string;
  presidentName: string;
  contactPhone: string;
  createdAt: string;
  description: string;
  isActualParticipated: boolean;
  actualRoundsCount: number;
  totalPlayersCount: number;
  lastPlayedAtStr: string;
  recentActivities: {
    date: string;
    courseName: string;
    playerCount: number;
    leaderName: string;
    status: string;
  }[];
}

interface CityDetailStat {
  cityName: string;
  userCount: number;
  liveUsers: number;
  clubCount: number;
  clubs: string[];
  clubDetails?: CityClubDetail[];
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
  users?: ProvinceUserItem[];
  liveUserList?: ProvinceUserItem[];
  clubDetails?: CityClubDetail[];
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

export interface UserRoundStatProfile {
  id: string;
  name: string;
  isNamedUser: boolean;
  isKakaoUser?: boolean;
  city: string;
  deviceType: string;
  trafficSource: string;
  firstActiveTime: string;
  lastActiveTime: string;
  visitCount: number;
  actualRoundsCount: number;
  totalHolesCompleted: number;
  isGpsVerified: boolean;
  avgDurationMinutes: number;
  lastCourseName: string;
  tier: 'HEAVY' | 'REGULAR' | 'STARTER' | 'BROWSER';
  tierLabel: string;
}

export interface UserRoundAnalyticsSummary {
  totalUsers: number;
  namedUsersCount?: number;
  anonymousUsersCount?: number;
  kakaoUsersCount?: number;
  playedUsersCount: number;
  playedUsersPercentage: number;
  browserUsersCount: number;
  browserUsersPercentage: number;
  tierCounts: {
    heavy: number;
    regular: number;
    starter: number;
    browser: number;
  };
  tierPercentages: {
    heavy: number;
    regular: number;
    starter: number;
    browser: number;
  };
  userProfiles: UserRoundStatProfile[];
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
  namedUsersCount?: number;
  anonymousUsersCount?: number;
  kakaoUsersCount?: number;
  totalAppDownloads: number;
  provinceStats: ProvinceStat[];
  courseRankings?: CourseRoundRanking[];
  liveRounds?: LiveRoundInfo[];
  userRoundAnalytics?: UserRoundAnalyticsSummary;
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
  // 시·도 상세 팝업 내 활성 탭 ('CITIES': 시·군 인프라 | 'USERS': 총 유저 가나다순 | 'LIVE': 실시간 접속 | 'CLUBS': 등록 클럽)
  const [provSubTab, setProvSubTab] = useState<'CITIES' | 'USERS' | 'LIVE' | 'CLUBS'>('CITIES');
  // 100명 단위 페이지네이션 인덱스 (0 = 1~100, 1 = 101~200, ...)
  const [userPageChunk, setUserPageChunk] = useState(0);
  // 유저 검색 필터어
  const [userSearchTerm, setUserSearchTerm] = useState('');
  // 추이 상세 팝업 모달 상태 (일별, 주별, 월별, 연별)
  const [selectedTrendModal, setSelectedTrendModal] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | null>(null);
  // 클럽 상세 관제 팝업 모달 상태 (관리자 뷰어 모드)
  const [selectedClubDetailModal, setSelectedClubDetailModal] = useState<CityClubDetail | null>(null);
  // 총 가입자 실제 라운딩 참여율 및 골퍼 등급 분석 모달 상태
  const [showUserRoundStatsModal, setShowUserRoundStatsModal] = useState(false);
  const [userRoundTierFilter, setUserRoundTierFilter] = useState<'ALL' | 'NAMED' | 'KAKAO' | 'ANON' | 'PLAYED' | 'HEAVY' | 'REGULAR' | 'STARTER' | 'BROWSER'>('ALL');
  const [userRoundSearchTerm, setUserRoundSearchTerm] = useState('');
  const [userRoundPageChunk, setUserRoundPageChunk] = useState(0);

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
        {/* 1. 총 누적 이용자 (클릭 시 실명 회원 & 일반 방문자 상세 팝업) */}
        <button
          type="button"
          onClick={() => {
            setShowUserRoundStatsModal(true);
            setUserRoundTierFilter('ALL');
            setUserRoundSearchTerm('');
            setUserRoundPageChunk(0);
          }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-98 group flex flex-col justify-between"
        >
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors whitespace-nowrap">
            총 누적 이용자
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              {metrics?.totalAllTimeUsers ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
          <div className="mt-1.5 flex items-center justify-center gap-1 text-[10px] font-bold whitespace-nowrap flex-wrap">
            <span className="px-1.5 py-0.5 rounded bg-yellow-400 text-yellow-950 border border-yellow-500/50">
              💬 카카오 {metrics?.kakaoUsersCount ?? (metrics?.userRoundAnalytics?.kakaoUsersCount ?? 0)}명
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60">
              ✨ 실명 {metrics?.namedUsersCount ?? 8}명
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              방문 {metrics?.anonymousUsersCount ?? Math.max(0, (metrics?.totalAllTimeUsers ?? 0) - (metrics?.namedUsersCount ?? 8))}명
            </span>
          </div>
        </button>

        {/* 2. 오늘 이용자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-xs hover:border-blue-400 transition-colors flex flex-col justify-between">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
            오늘 이용자
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
              {metrics?.todayDAU ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
          <div className="mt-1.5 text-[10px] text-zinc-400 font-medium">
            KST 00시 기준
          </div>
        </div>

        {/* 3. 현재 접속자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-xs hover:border-amber-400 transition-colors flex flex-col justify-between">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
            현재 접속자
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {metrics?.liveUsers ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
          <div className="mt-1.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
            실시간 10분내
          </div>
        </div>

        {/* 4. 주간 이용자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl p-2.5 sm:p-4 text-center shadow-xs hover:border-purple-400 transition-colors flex flex-col justify-between">
          <div className="text-xs sm:text-sm font-bold text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
            주간 이용자
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1">
            <span className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.weeklyWAU ?? 0}
            </span>
            <span className="text-xs sm:text-sm font-bold text-zinc-500">명</span>
          </div>
          <div className="mt-1.5 text-[10px] text-purple-600 dark:text-purple-400 font-medium">
            최근 7일 순방문
          </div>
        </div>
      </div>

      {/* 1. 실시간 필드 라운딩 관제 센터 (간결한 작은 카드: 클릭 시 경기 진행 상세 팝업) */}
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

      {/* 2. 전국 16개 시·도별 현황 열기 (간결한 작은 카드) */}
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

            {/* Core Summary Cards -> 3 Interactive Clickable Tabs */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              {/* Tab 1: 총 유저 수 */}
              <button
                type="button"
                onClick={() => {
                  setProvSubTab(provSubTab === 'USERS' ? 'CITIES' : 'USERS');
                  setUserPageChunk(0);
                  setUserSearchTerm('');
                }}
                className={`p-3 rounded-2xl border transition-all text-center cursor-pointer active:scale-97 group ${
                  provSubTab === 'USERS'
                    ? 'bg-emerald-100/90 dark:bg-emerald-950/90 border-emerald-500 shadow-md ring-2 ring-emerald-400/50'
                    : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100/60'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                  <Users className="w-3.5 h-3.5" />
                  총 유저 수
                </div>
                <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedProvinceModal.userCount}명
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <span>전국 대비 {selectedProvinceModal.userPercentage}%</span>
                  <span className="text-emerald-600 font-bold">▶ 가나다순</span>
                </div>
              </button>

              {/* Tab 2: 현재 실시간 접속 */}
              <button
                type="button"
                onClick={() => setProvSubTab(provSubTab === 'LIVE' ? 'CITIES' : 'LIVE')}
                className={`p-3 rounded-2xl border transition-all text-center cursor-pointer active:scale-97 group ${
                  provSubTab === 'LIVE'
                    ? 'bg-amber-100/90 dark:bg-amber-950/90 border-amber-500 shadow-md ring-2 ring-amber-400/50'
                    : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/60'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  현재 실시간 접속
                </div>
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {selectedProvinceModal.liveUsers}명
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <span>동시 활동 중</span>
                  <span className="text-amber-600 font-bold">▶ 실시간</span>
                </div>
              </button>

              {/* Tab 3: 등록 클럽 수 */}
              <button
                type="button"
                onClick={() => setProvSubTab(provSubTab === 'CLUBS' ? 'CITIES' : 'CLUBS')}
                className={`p-3 rounded-2xl border transition-all text-center cursor-pointer active:scale-97 group ${
                  provSubTab === 'CLUBS'
                    ? 'bg-purple-100/90 dark:bg-purple-950/90 border-purple-500 shadow-md ring-2 ring-purple-400/50'
                    : 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 hover:bg-purple-100/60'
                }`}
              >
                <div className="flex items-center justify-center gap-1 text-xs font-bold text-purple-800 dark:text-purple-300">
                  <Trophy className="w-3.5 h-3.5" />
                  등록 클럽 수
                </div>
                <div className="text-xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                  {selectedProvinceModal.clubCount}개
                </div>
                <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1 mt-0.5">
                  <span>정규 클럽</span>
                  <span className="text-purple-600 font-bold">▶ 목록 보기</span>
                </div>
              </button>
            </div>

            {/* Sub-view Navigation Pills */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
              <div className="flex items-center gap-1 text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setProvSubTab('CITIES')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    provSubTab === 'CITIES'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  🏛️ 시·군별 인프라 ({selectedProvinceModal.cities.length}개)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProvSubTab('USERS');
                    setUserPageChunk(0);
                    setUserSearchTerm('');
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    provSubTab === 'USERS'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  👥 전체 유저 ({selectedProvinceModal.users?.length || selectedProvinceModal.userCount}명 · 가나다순)
                </button>
                <button
                  type="button"
                  onClick={() => setProvSubTab('LIVE')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    provSubTab === 'LIVE'
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  🟢 실시간 접속 ({selectedProvinceModal.liveUsers}명)
                </button>
                <button
                  type="button"
                  onClick={() => setProvSubTab('CLUBS')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                    provSubTab === 'CLUBS'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                  }`}
                >
                  🏆 등록 클럽 ({selectedProvinceModal.clubCount}개)
                </button>
              </div>
            </div>

            {/* Sub-view Content: USERS (가나다순 전체 유저 100명 단위 끊기) */}
            {provSubTab === 'USERS' && (() => {
              const allUsers = selectedProvinceModal.users || [];
              const filteredUsers = allUsers.filter((u) => {
                if (!userSearchTerm.trim()) return true;
                const term = userSearchTerm.toLowerCase();
                return (
                  u.name.toLowerCase().includes(term) ||
                  u.city.toLowerCase().includes(term) ||
                  u.homeCourse.toLowerCase().includes(term)
                );
              });
              const chunkSize = 100;
              const totalChunks = Math.ceil(filteredUsers.length / chunkSize);
              const startIdx = userPageChunk * chunkSize;
              const currentUsers = filteredUsers.slice(startIdx, startIdx + chunkSize);

              return (
                <div className="space-y-3 animate-in fade-in duration-150">
                  {/* Search and Pagination Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={userSearchTerm}
                        onChange={(e) => {
                          setUserSearchTerm(e.target.value);
                          setUserPageChunk(0);
                        }}
                        placeholder="이름, 시·군(구미, 포항 등), 구장명 검색..."
                        className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                      총 {filteredUsers.length}명 (가나다순 정렬)
                    </span>
                  </div>

                  {/* 100명 단위 페이지네이션 버튼 (100명 이상일 경우) */}
                  {totalChunks > 1 && (
                    <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                      <span className="text-[10px] text-zinc-400 font-semibold mr-1">100명 단위 이동:</span>
                      {Array.from({ length: totalChunks }, (_, idx) => {
                        const start = idx * chunkSize + 1;
                        const end = Math.min((idx + 1) * chunkSize, filteredUsers.length);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setUserPageChunk(idx)}
                            className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                              userPageChunk === idx
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                            }`}
                          >
                            {start} ~ {end}번
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* User List Items */}
                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {currentUsers.length > 0 ? (
                      currentUsers.map((u, idx) => (
                        <div
                          key={u.id || idx}
                          className={`p-2.5 rounded-xl border transition-colors text-xs flex items-center justify-between gap-2 ${
                            u.isNamedUser
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400'
                              : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-400'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-7 text-[11px] font-mono text-zinc-400 text-center shrink-0">
                              #{startIdx + idx + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`font-bold truncate ${u.isNamedUser ? 'text-amber-950 dark:text-amber-200 font-black' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {u.name}
                                </span>
                                {u.isKakaoUser ? (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-yellow-400 text-yellow-950 text-[10px] font-black rounded-md border border-yellow-500/50 shadow-2xs">
                                    💬 카카오
                                  </span>
                                ) : u.isNamedUser ? (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-black rounded-md border border-amber-300 dark:border-amber-700">
                                    ✨ 닉네임 회원
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-medium rounded-md">
                                    일반 방문
                                  </span>
                                )}
                                {u.isLive && (
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    접속 중
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span>📍 {u.city}</span>
                                <span>·</span>
                                <span>{u.deviceType || '📱 모바일'}</span>
                                <span>·</span>
                                <span className="text-zinc-500 font-medium">{u.trafficSource || '직접 접속'}</span>
                                {u.visitCount && u.visitCount > 1 && (
                                  <>
                                    <span>·</span>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">누적 {u.visitCount}회</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block font-mono">
                              최근: {u.lastActiveTime}
                            </span>
                            {u.firstActiveTime && u.firstActiveTime !== u.lastActiveTime && (
                              <span className="text-[9px] text-zinc-400 block font-mono">
                                최초: {u.firstActiveTime.split(' ')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        {userSearchTerm ? '검색된 유저가 없습니다.' : '등록된 유저 목록이 없습니다.'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sub-view Content: LIVE (현재 실시간 접속 유저) */}
            {provSubTab === 'LIVE' && (() => {
              const liveUsers = selectedProvinceModal.liveUserList || [];

              return (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      실시간 동시 활동 골퍼 ({liveUsers.length}명)
                    </span>
                    <span className="text-[10px] text-zinc-400">최근 10분 내 활동</span>
                  </div>

                  <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                    {liveUsers.length > 0 ? (
                      liveUsers.map((u, idx) => (
                        <div
                          key={u.id || idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs gap-2 ${
                            u.isNamedUser
                              ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-2xs'
                              : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-bold truncate ${u.isNamedUser ? 'text-amber-950 dark:text-amber-200 font-black' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                  {u.name}
                                </span>
                                {u.isKakaoUser && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-yellow-400 text-yellow-950 text-[10px] font-black rounded-md border border-yellow-500/50 shadow-2xs">
                                    💬 카카오
                                  </span>
                                )}
                                {u.isNamedUser && !u.isKakaoUser && (
                                  <span className="inline-flex items-center px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-black rounded-md border border-amber-300 dark:border-amber-700">
                                    ✨ 닉네임 회원
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                                <span>📍 {u.city}</span>
                                <span>·</span>
                                <span>{u.deviceType || '📱 모바일'}</span>
                                <span>·</span>
                                <span>{u.trafficSource || '직접 접속'}</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold shrink-0">
                            {u.lastActiveTime.split(' ')[1] || '활동 중'}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-zinc-400">
                        현재 해당 시·도에서 실시간 접속 중인 유저가 없습니다.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sub-view Content: CLUBS (등록 클럽 목록) */}
            {provSubTab === 'CLUBS' && (() => {
              const clubs = selectedProvinceModal.clubDetails || [];

              return (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs border-b border-zinc-100 dark:border-zinc-800 pb-2">
                    <span className="font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-purple-600" />
                      공식 등록 클럽 목록 ({selectedProvinceModal.clubCount}개)
                    </span>
                    <span className="text-[10px] text-zinc-400">정규 클럽 및 동호회</span>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {clubs.length > 0 ? (
                      clubs.map((c) => (
                        <div
                          key={c.id}
                          className="p-3 bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/80 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <span>🏆</span> {c.name}
                            </div>
                            <div className="text-[11px] text-zinc-400 mt-0.5">
                              {c.city} · 홈: {c.homeCourseName} · 회원 {c.memberCount}명
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setSelectedClubDetailModal(c)}
                            className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 cursor-pointer"
                          >
                            상세 내역 ↗
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 space-y-1">
                        <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          현재 공식 등록된 클럽이 없습니다. (0개)
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          실제 사용자가 클럽을 창단하고 활동할 때만 실명 데이터가 정직하게 등록됩니다.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Sub-view Content: CITIES (시·군별 상세 내역) */}
            {provSubTab === 'CITIES' && (
              <div className="space-y-3 animate-in fade-in duration-150">
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
                          <span className="text-zinc-400 text-[10px] mr-1">방문</span>
                          <strong className={city.userCount > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-zinc-400 dark:text-zinc-500 font-medium"}>
                            {city.userCount}명
                          </strong>
                        </div>
                        <div>
                          <span className="text-zinc-400 text-[10px] mr-1">실시간</span>
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
                      {city.clubDetails && city.clubDetails.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {city.clubDetails.map((club) => (
                            <button
                              key={club.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClubDetailModal(club);
                              }}
                              className="px-2.5 py-1 bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/80 dark:hover:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-97 group"
                              title="클릭하여 클럽 상세 내역 보기"
                            >
                              <span>🏆</span>
                              <span className="group-hover:underline">{club.name}</span>
                              <span className="text-[10px] px-1.5 py-0.2 bg-purple-600 text-white rounded font-bold">내역 보기 ↗</span>
                            </button>
                          ))}
                        </div>
                      ) : city.clubs.length > 0 ? (
                        <span className="text-purple-600 dark:text-purple-400 font-bold">
                          {city.clubs.join(' · ')}
                        </span>
                      ) : (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          등록 클럽 없음 (0개)
                        </span>
                      )}
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
          )}

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

      {/* 클럽 상세 실태 관제 팝업 (최고 관리자 전용 실태 조사 뷰어) */}
      {selectedClubDetailModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-purple-200 dark:border-purple-800/80 rounded-3xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                  🏆
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-black text-zinc-900 dark:text-zinc-100">
                      {selectedClubDetailModal.name}
                    </h3>
                    {selectedClubDetailModal.isActualParticipated ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-black rounded-full border border-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        실제 필드 활동 인증
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 text-xs font-bold rounded-full">
                        활동 이력 확인 중
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex items-center gap-2">
                    <span>📍 {selectedClubDetailModal.province} {selectedClubDetailModal.city}</span>
                    <span>·</span>
                    <span>⛳ 홈: {selectedClubDetailModal.homeCourseName}</span>
                    <span>·</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">관리자 실태 관제(Read-Only)</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClubDetailModal(null)}
                className="w-8 h-8 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                title="팝업 닫기"
              >
                ✕
              </button>
            </div>

            {/* 4대 실태 요약 통계 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-purple-50/60 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400">소속 회원수</div>
                <div className="text-xl font-black text-purple-950 dark:text-purple-100 mt-0.5">
                  {selectedClubDetailModal.memberCount}명
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">실명 인증 회원</div>
              </div>

              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">실제 누적 라운드</div>
                <div className="text-xl font-black text-emerald-950 dark:text-emerald-100 mt-0.5">
                  {selectedClubDetailModal.actualRoundsCount}회
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">정상 필드 완주</div>
              </div>

              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400">총 참가 골퍼</div>
                <div className="text-xl font-black text-blue-950 dark:text-blue-100 mt-0.5">
                  {selectedClubDetailModal.totalPlayersCount}명
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">동반 플레이어 누적</div>
              </div>

              <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-3 text-center">
                <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400">클럽 등록일</div>
                <div className="text-sm font-black text-amber-950 dark:text-amber-100 mt-1 truncate">
                  {selectedClubDetailModal.createdAt}
                </div>
                <div className="text-[10px] text-zinc-400 mt-0.5">최초 창립 등록</div>
              </div>
            </div>

            {/* 클럽 조직 및 공식 제원 정보 */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-200/60 dark:border-zinc-700 pb-2">
                <span>📋</span> 클럽 공식 조직 및 제원
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">총괄 매니저</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedClubDetailModal.managerName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">클럽 대표/회장</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedClubDetailModal.presidentName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">지정 공식 홈구장</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedClubDetailModal.homeCourseName}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-500 font-medium">사무국 연락처</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{selectedClubDetailModal.contactPhone}</span>
                </div>
              </div>
              {selectedClubDetailModal.description && (
                <div className="p-2.5 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs">
                  <span className="text-zinc-400 text-[11px] block mb-1">클럽 소개</span>
                  <p className="text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
                    {selectedClubDetailModal.description}
                  </p>
                </div>
              )}
            </div>

            {/* 최근 실제 필드 라운딩 내역 (언제, 몇 명, 어떻게) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <span>⛳</span> 최근 실제 필드 라운딩 내역
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold rounded">
                    {selectedClubDetailModal.recentActivities.length}건
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400">GPS 기반 실시간 필드 완주 기록</span>
              </div>

              {selectedClubDetailModal.recentActivities && selectedClubDetailModal.recentActivities.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {selectedClubDetailModal.recentActivities.map((act, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <span>{act.courseName}</span>
                          <span className="text-[10px] font-normal text-zinc-400">{act.date}</span>
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          참여 골퍼: <strong className="text-blue-600 dark:text-blue-400 font-bold">{act.playerCount}명</strong> (진행 조장: {act.leaderName})
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] rounded-lg shrink-0">
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-zinc-50 dark:bg-zinc-800/40 rounded-2xl text-center text-xs text-zinc-400">
                  아직 기록된 필드 라운딩 내역이 없습니다.
                </div>
              )}
            </div>

            {/* 안내 및 닫기 버튼 */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <div className="text-[11px] text-zinc-400 text-center">
                ※ 본 화면은 최고 관리자 전용 실태 관제 뷰어입니다. 수정/참여 버튼 없이 실시간 서버 데이터만 조회됩니다.
              </div>
              <button
                onClick={() => setSelectedClubDetailModal(null)}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-99 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
              >
                확인 완료 (닫기)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 접속 및 이용 추이: 일별, 주별, 월별, 연별 4대 정사각형 버튼 타일 */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-sm space-y-4">
        <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            접속 및 이용 추이
          </h2>
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

      {/* 총 가입자 실제 라운딩 참여율 & 골퍼 등급 분석 팝업 모달 */}
      {showUserRoundStatsModal && (() => {
        const stats = metrics?.userRoundAnalytics || {
          totalUsers: metrics?.totalAllTimeUsers || 0,
          playedUsersCount: 0,
          playedUsersPercentage: 0,
          browserUsersCount: metrics?.totalAllTimeUsers || 0,
          browserUsersPercentage: 100,
          tierCounts: { heavy: 0, regular: 0, starter: 0, browser: metrics?.totalAllTimeUsers || 0 },
          tierPercentages: { heavy: 0, regular: 0, starter: 0, browser: 100 },
          userProfiles: [],
        };

        const profiles = stats.userProfiles || [];
        const namedCount = stats.namedUsersCount ?? profiles.filter((p) => p.isNamedUser).length;
        const anonCount = stats.anonymousUsersCount ?? profiles.filter((p) => !p.isNamedUser).length;
        const kakaoCount = stats.kakaoUsersCount ?? profiles.filter((p) => p.isKakaoUser).length;

        const filteredProfiles = profiles.filter((p) => {
          // Role & Tier filter
          if (userRoundTierFilter === 'NAMED' && !p.isNamedUser) return false;
          if (userRoundTierFilter === 'KAKAO' && !p.isKakaoUser) return false;
          if (userRoundTierFilter === 'ANON' && p.isNamedUser) return false;
          if (userRoundTierFilter === 'PLAYED' && p.actualRoundsCount === 0) return false;
          if (userRoundTierFilter === 'HEAVY' && p.tier !== 'HEAVY') return false;
          if (userRoundTierFilter === 'REGULAR' && p.tier !== 'REGULAR') return false;
          if (userRoundTierFilter === 'STARTER' && p.tier !== 'STARTER') return false;
          if (userRoundTierFilter === 'BROWSER' && p.tier !== 'BROWSER') return false;

          // Search term filter
          if (userRoundSearchTerm.trim()) {
            const term = userRoundSearchTerm.toLowerCase();
            return (
              p.name.toLowerCase().includes(term) ||
              p.city.toLowerCase().includes(term) ||
              p.lastCourseName.toLowerCase().includes(term) ||
              p.tierLabel.toLowerCase().includes(term)
            );
          }
          return true;
        });

        const chunkSize = 100;
        const totalChunks = Math.ceil(filteredProfiles.length / chunkSize);
        const startIdx = userRoundPageChunk * chunkSize;
        const currentProfiles = filteredProfiles.slice(startIdx, startIdx + chunkSize);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <span>총 누적 이용자 및 필드 라운딩 팩트 분석</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-800">
                        5단계 팩트 검증
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      가상·테스트 100% 필터링 | 카카오 회원 · 실명 등록 회원 · 일반 방문자 투명 분리 표출
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowUserRoundStatsModal(false)}
                  className="w-8 h-8 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Top Summary KPI Cards (5분할) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <button
                  type="button"
                  onClick={() => { setUserRoundTierFilter('ALL'); setUserRoundPageChunk(0); }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'ALL'
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200/80 dark:border-zinc-700/80 hover:border-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold block opacity-80">총 누적 이용자</span>
                  <div className="text-lg font-black mt-0.5">
                    {stats.totalUsers}명
                  </div>
                  <span className="text-[9px] opacity-70 block">전체 고유 유저</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoundTierFilter('KAKAO'); setUserRoundPageChunk(0); }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'KAKAO'
                      ? 'bg-yellow-400 text-yellow-950 border-yellow-500 shadow-xs'
                      : 'bg-yellow-50/80 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800/80 hover:border-yellow-500'
                  }`}
                >
                  <span className="text-[10px] font-bold text-yellow-800 dark:text-yellow-300 block">💬 카카오 회원</span>
                  <div className="text-lg font-black text-yellow-950 dark:text-yellow-200 mt-0.5">
                    {kakaoCount}명
                  </div>
                  <span className="text-[9px] text-yellow-700 dark:text-yellow-400 block">카카오톡 인증</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoundTierFilter('NAMED'); setUserRoundPageChunk(0); }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'NAMED'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/80 hover:border-amber-500'
                  }`}
                >
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">✨ 실명 회원</span>
                  <div className="text-lg font-black text-amber-800 dark:text-amber-200 mt-0.5">
                    {namedCount}명
                  </div>
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 block">닉네임/회원</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoundTierFilter('ANON'); setUserRoundPageChunk(0); }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'ANON'
                      ? 'bg-zinc-700 text-white border-zinc-800 shadow-xs'
                      : 'bg-zinc-50 dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 block">🔍 일반 방문자</span>
                  <div className="text-lg font-black text-zinc-700 dark:text-zinc-300 mt-0.5">
                    {anonCount}명
                  </div>
                  <span className="text-[9px] text-zinc-400 block">지역 IP 탐색</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setUserRoundTierFilter('PLAYED'); setUserRoundPageChunk(0); }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'PLAYED'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-500'
                  }`}
                >
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">⛳ 필드 완주</span>
                  <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {stats.playedUsersCount}명
                  </div>
                  <span className="text-[9px] text-emerald-600/80 dark:text-emerald-400/80 block">9·18홀 완주</span>
                </button>
              </div>

              {/* Visual Ratio Progress Bar */}
              <div className="space-y-1.5 bg-zinc-50 dark:bg-zinc-800/40 p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span>⛳ 실제 라운딩 참여율:</span>
                    <strong>{stats.playedUsersPercentage}% ({stats.playedUsersCount}명)</strong>
                  </span>
                  <span className="text-zinc-500 flex items-center gap-1">
                    <span>🔍 둘러보기/대기율:</span>
                    <strong>{stats.browserUsersPercentage}% ({stats.browserUsersCount}명)</strong>
                  </span>
                </div>
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${Math.max(stats.playedUsersPercentage, 2)}%` }}
                    title={`실제 라운딩: ${stats.playedUsersPercentage}%`}
                  />
                  <div
                    className="bg-amber-400/80 h-full transition-all duration-500"
                    style={{ width: `${stats.browserUsersPercentage}%` }}
                    title={`필드 대기자: ${stats.browserUsersPercentage}%`}
                  />
                </div>
              </div>

              {/* 4-Tier Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. 헤비 골퍼 */}
                <button
                  type="button"
                  onClick={() => {
                    setUserRoundTierFilter('HEAVY');
                    setUserRoundPageChunk(0);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'HEAVY'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-purple-200 dark:border-purple-800/70 hover:border-purple-500'
                  }`}
                >
                  <div className={`text-xs font-black ${userRoundTierFilter === 'HEAVY' ? 'text-purple-100' : 'text-purple-700 dark:text-purple-300'}`}>
                    👑 열성 헤비 골퍼
                  </div>
                  <div className={`text-xl font-black mt-1 ${userRoundTierFilter === 'HEAVY' ? 'text-white' : 'text-purple-600 dark:text-purple-400'}`}>
                    {stats.tierCounts.heavy}명
                  </div>
                  <div className={`text-[10px] mt-0.5 ${userRoundTierFilter === 'HEAVY' ? 'text-purple-200' : 'text-zinc-400'}`}>
                    5회 이상 ({stats.tierPercentages.heavy}%)
                  </div>
                </button>

                {/* 2. 정기 라운딩 골퍼 */}
                <button
                  type="button"
                  onClick={() => {
                    setUserRoundTierFilter('REGULAR');
                    setUserRoundPageChunk(0);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'REGULAR'
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-blue-200 dark:border-blue-800/70 hover:border-blue-500'
                  }`}
                >
                  <div className={`text-xs font-black ${userRoundTierFilter === 'REGULAR' ? 'text-blue-100' : 'text-blue-700 dark:text-blue-300'}`}>
                    ⛳ 꾸준한 정기 골퍼
                  </div>
                  <div className={`text-xl font-black mt-1 ${userRoundTierFilter === 'REGULAR' ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                    {stats.tierCounts.regular}명
                  </div>
                  <div className={`text-[10px] mt-0.5 ${userRoundTierFilter === 'REGULAR' ? 'text-blue-200' : 'text-zinc-400'}`}>
                    2~4회 완주 ({stats.tierPercentages.regular}%)
                  </div>
                </button>

                {/* 3. 1회 입문 골퍼 */}
                <button
                  type="button"
                  onClick={() => {
                    setUserRoundTierFilter('STARTER');
                    setUserRoundPageChunk(0);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'STARTER'
                      ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-emerald-200 dark:border-emerald-800/70 hover:border-emerald-500'
                  }`}
                >
                  <div className={`text-xs font-black ${userRoundTierFilter === 'STARTER' ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-300'}`}>
                    🌱 1회 입문/체험
                  </div>
                  <div className={`text-xl font-black mt-1 ${userRoundTierFilter === 'STARTER' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {stats.tierCounts.starter}명
                  </div>
                  <div className={`text-[10px] mt-0.5 ${userRoundTierFilter === 'STARTER' ? 'text-emerald-200' : 'text-zinc-400'}`}>
                    첫 완주 달성 ({stats.tierPercentages.starter}%)
                  </div>
                </button>

                {/* 4. 필드 대기자 */}
                <button
                  type="button"
                  onClick={() => {
                    setUserRoundTierFilter('BROWSER');
                    setUserRoundPageChunk(0);
                  }}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    userRoundTierFilter === 'BROWSER'
                      ? 'bg-zinc-800 text-white border-zinc-900 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  <div className={`text-xs font-black ${userRoundTierFilter === 'BROWSER' ? 'text-zinc-200' : 'text-zinc-600 dark:text-zinc-400'}`}>
                    🔍 필드 출격 대기
                  </div>
                  <div className={`text-xl font-black mt-1 ${userRoundTierFilter === 'BROWSER' ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                    {stats.tierCounts.browser}명
                  </div>
                  <div className={`text-[10px] mt-0.5 ${userRoundTierFilter === 'BROWSER' ? 'text-zinc-300' : 'text-zinc-400'}`}>
                    0회 / 탐색 중 ({stats.tierPercentages.browser}%)
                  </div>
                </button>
              </div>

              {/* 5단계 엄격 검증 안내 박스 */}
              <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                <strong className="text-zinc-800 dark:text-zinc-200 font-bold block mb-1">
                  🛡️ 파크온 5단계 '진짜 필드 라운딩' 팩트 검증 원칙
                </strong>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                  <span>• ① GPS 구장 반경 내 현장 실시간 인증</span>
                  <span>• ② 가상 라운딩 및 집에서의 단순 테스트 100% 배제</span>
                  <span>• ③ 최소 9홀 또는 18홀 정식 홀아웃 검증</span>
                  <span>• ④ 5분 컷 등 비정상 초단기 클릭 배제 (정상 보행 경기 시간 충족)</span>
                  <span className="sm:col-span-2">• ⑤ 동반 조원 4인 스코어보드 확정 기록 매칭</span>
                </div>
              </div>

              {/* Filter Tabs & Search Header */}
              <div className="space-y-2 pt-1 border-t border-zinc-100 dark:border-zinc-800">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('ALL');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'ALL'
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    전체 보기 ({stats.totalUsers}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('NAMED');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'NAMED'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 hover:bg-amber-100'
                    }`}
                  >
                    ✨ 실명 회원 ({namedCount}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('KAKAO');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'KAKAO'
                        ? 'bg-yellow-400 text-yellow-950 shadow-xs'
                        : 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-800/60 hover:bg-yellow-100'
                    }`}
                  >
                    💬 카카오 회원 ({kakaoCount}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('ANON');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'ANON'
                        ? 'bg-zinc-700 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    🔍 방문 골퍼 ({anonCount}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('PLAYED');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'PLAYED'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    ⛳ 실제 완주자 ({stats.playedUsersCount}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('HEAVY');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'HEAVY'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    👑 헤비 ({stats.tierCounts.heavy}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('REGULAR');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'REGULAR'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    ⛳ 정기 ({stats.tierCounts.regular}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('STARTER');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'STARTER'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    🌱 1회 입문 ({stats.tierCounts.starter}명)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setUserRoundTierFilter('BROWSER');
                      setUserRoundPageChunk(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs cursor-pointer ${
                      userRoundTierFilter === 'BROWSER'
                        ? 'bg-zinc-800 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                    }`}
                  >
                    🔍 대기자 ({stats.tierCounts.browser}명)
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      value={userRoundSearchTerm}
                      onChange={(e) => {
                        setUserRoundSearchTerm(e.target.value);
                        setUserRoundPageChunk(0);
                      }}
                      placeholder="이름, 닉네임, 지역(구미 등), 구장명 검색..."
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium shrink-0">
                    필터링 결과: {filteredProfiles.length}명
                  </span>
                </div>
              </div>

              {/* 100명 단위 페이지네이션 */}
              {totalChunks > 1 && (
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] text-zinc-400 font-semibold mr-1">페이지 이동:</span>
                  {Array.from({ length: totalChunks }, (_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setUserRoundPageChunk(idx)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors cursor-pointer ${
                        userRoundPageChunk === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100'
                      }`}
                    >
                      {idx * chunkSize + 1} ~ {Math.min((idx + 1) * chunkSize, filteredProfiles.length)}번
                    </button>
                  ))}
                </div>
              )}

              {/* 골퍼 목록 아이템 */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {currentProfiles.length > 0 ? (
                  currentProfiles.map((u, idx) => (
                    <div
                      key={u.id || idx}
                      className={`p-3 rounded-xl border transition-colors text-xs flex items-center justify-between gap-2.5 ${
                        u.tier === 'HEAVY'
                          ? 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800 shadow-2xs'
                          : u.tier === 'REGULAR'
                          ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 shadow-2xs'
                          : u.tier === 'STARTER'
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 text-[11px] font-mono text-zinc-400 text-center shrink-0">
                          #{startIdx + idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                              {u.name}
                            </span>
                            {u.isKakaoUser && (
                              <span className="inline-flex items-center px-1.5 py-0.2 bg-yellow-400 text-yellow-950 text-[10px] font-black rounded-md border border-yellow-500/50 shadow-2xs">
                                💬 카카오
                              </span>
                            )}
                            {u.isNamedUser && !u.isKakaoUser && (
                              <span className="inline-flex items-center px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[10px] font-black rounded-md border border-amber-300 dark:border-amber-700">
                                ✨ 회원
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black ${
                                u.tier === 'HEAVY'
                                  ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                                  : u.tier === 'REGULAR'
                                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                  : u.tier === 'STARTER'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                              }`}
                            >
                              {u.tierLabel}
                            </span>
                            {u.isGpsVerified && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded border border-emerald-300 dark:border-emerald-800">
                                ☑️ GPS 현장 인증 통과
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-2 mt-1 flex-wrap">
                            <span>📍 {u.city}</span>
                            <span>·</span>
                            <span>{u.deviceType}</span>
                            <span>·</span>
                            <span>{u.trafficSource}</span>
                            {u.lastCourseName && (
                              <>
                                <span>·</span>
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                  ⛳ {u.lastCourseName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        {u.actualRoundsCount > 0 ? (
                          <>
                            <div className="font-mono text-sm font-black text-emerald-600 dark:text-emerald-400">
                              완주 {u.actualRoundsCount}회 <span className="text-xs text-zinc-400 font-normal">({u.totalHolesCompleted}홀)</span>
                            </div>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              평균 {u.avgDurationMinutes}분 소요
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-[11px] font-bold text-zinc-400 block">
                              필드 미출격 (0회)
                            </span>
                            <span className="text-[10px] text-zinc-400 block font-mono">
                              최근: {u.lastActiveTime.split(' ')[0]}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-10 text-center text-xs text-zinc-400">
                    선택하신 등급에 해당하는 유저가 없습니다.
                  </div>
                )}
              </div>

              {/* Close Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowUserRoundStatsModal(false)}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        );
      })()}



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
