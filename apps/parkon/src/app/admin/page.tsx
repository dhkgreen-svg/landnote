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
  Award, 
  MapPin, 
  Building2, 
  Calendar, 
  Flame, 
  Trophy, 
  Activity,
  Search,
  Zap,
  Target,
  ChevronRight,
  Filter
} from 'lucide-react';

interface ProvinceStat {
  code: string;
  name: string;
  regionGroup: string;
  userCount: number;
  userPercentage: number;
  clubCount: number;
  majorCourses: string[];
  topClubs: Array<{ name: string; memberCount: number; homeCourse: string }>;
}

interface CityStat {
  cityName: string;
  province: string;
  userCount: number;
  clubCount: number;
  clubs: string[];
  courses: string[];
}

interface UserCohorts {
  heavyUsers: { count: number; percentage: number; label: string; description: string };
  regularUsers: { count: number; percentage: number; label: string; description: string };
  lightUsers: { count: number; percentage: number; label: string; description: string };
}

interface Metrics {
  liveUsers: number;
  todayDAU: number;
  weeklyWAU: number;
  monthlyMAU: number;
  totalPageviews: number;
  todayPageviews: number;
  totalUniqueVisitors: number;
  provinceStats: ProvinceStat[];
  cityDirectory: CityStat[];
  userCohorts: UserCohorts;
  dailyTrend: Record<string, { pageviews: number; uniqueVisitors: number }>;
  activeRoomsCount: number;
  activeRoomsList: Array<{
    roomId: string;
    courseName: string;
    leaderName: string;
    playerCount: number;
    status: string;
    updatedAt: number;
  }>;
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

  // Search & Filter States
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [selectedRegionGroup, setSelectedRegionGroup] = useState('ALL');

  // Check saved session PIN on load
  useEffect(() => {
    const savedPin = sessionStorage.getItem('parkon_admin_pin');
    if (savedPin === '3304') {
      setPin('3304');
      fetchMetrics('3304');
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

  // Auto-refresh interval when authenticated (10s)
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(() => {
      fetchMetrics(pin || '3304');
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, pin, fetchMetrics]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('PIN 4자리를 입력해주세요.');
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
    if (p.startsWith('/rules')) return '경기 규정집 (왕글씨)';
    if (p.startsWith('/courses')) return '전국 구장 검색';
    if (p.startsWith('/club')) return '파크온 클럽 커뮤니티';
    if (p.startsWith('/round')) return '멀티플레이 실시간 라운드';
    if (p.startsWith('/admin')) return '관리자 대시보드';
    return p;
  };

  // Filtered Province Stats
  const filteredProvinces = useMemo(() => {
    if (!metrics?.provinceStats) return [];
    if (selectedRegionGroup === 'ALL') return metrics.provinceStats;
    return metrics.provinceStats.filter((p) => p.regionGroup === selectedRegionGroup);
  }, [metrics?.provinceStats, selectedRegionGroup]);

  // Filtered City Directory based on Search Query
  const filteredCities = useMemo(() => {
    if (!metrics?.cityDirectory) return [];
    const query = citySearchQuery.trim().toLowerCase();
    if (!query) return metrics.cityDirectory;
    return metrics.cityDirectory.filter((city) => {
      const matchCity = city.cityName.toLowerCase().includes(query);
      const matchProv = city.province.toLowerCase().includes(query);
      const matchClubs = city.clubs.some((c) => c.toLowerCase().includes(query));
      const matchCourses = city.courses.some((c) => c.toLowerCase().includes(query));
      return matchCity || matchProv || matchClubs || matchCourses;
    });
  }, [metrics?.cityDirectory, citySearchQuery]);

  // --- PIN Locked Screen ---
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
              관리자 전용 마스터 PIN(암호)을 입력하세요.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2">
                마스터 PIN 암호
              </label>
              <input
                type="password"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN 4자리 입력"
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

  // Calculate maximum values for daily trend
  const maxPvInTrend = metrics?.dailyTrend 
    ? Math.max(...Object.values(metrics.dailyTrend).map(d => d.pageviews), 1)
    : 1;

  // --- Authenticated Dashboard ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Master Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> 최고관리자 통합관제
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                마스터: 김대희 (총괄)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1.5 flex items-center gap-2">
              ParkOn 실시간 & 누적 통합 관제센터
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              현재 접속자, 오늘 DAU, 주간 WAU, 월간 MAU 및 전국 8도 클럽·유저 분포를 정밀 분석합니다.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={() => fetchMetrics(pin)}
              disabled={isLoading}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors backdrop-blur-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로고침</span>
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                autoRefresh
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse' : ''}`} />
              <span>실시간(10초) {autoRefresh ? 'ON' : 'OFF'}</span>
            </button>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-red-500/80 hover:bg-red-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>로그아웃</span>
            </button>
          </div>
        </div>

        {lastRefreshed && (
          <div className="mt-4 pt-3 border-t border-emerald-600/50 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-emerald-200/80">
            <span>마지막 데이터 갱신: {lastRefreshed} (10초 주기 실시간 자동 동기화)</span>
            <span className="flex items-center gap-1 text-amber-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              실제 고유 사용자(IP & 프로필) 기반 정밀 집계 가동 중
            </span>
          </div>
        )}
      </div>

      {/* 4 Major Core Cumulative Metric Cards (Live, DAU, WAU, MAU) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. 현재 실시간 접속자 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">현재 실시간 접속자</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse text-emerald-500" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics?.liveUsers ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 활동 중</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            최근 10분 내 실시간 동시 접속자
          </p>
        </div>

        {/* 2. 일일 총 누적 (Today DAU) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">일일 총 누적 (Today DAU)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics?.todayDAU ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 방문</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            오늘 총 페이지뷰: <strong className="text-blue-600">{metrics?.todayPageviews ?? 0}회</strong>
          </p>
        </div>

        {/* 3. 일주일 7일 총 누적 (7-Day WAU) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">일주일 7일 총 누적 (WAU)</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.weeklyWAU ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 이용</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            최근 7일간 실사용 고유 인원
          </p>
        </div>

        {/* 4. 한 달 30일 총 누적 (30-Day MAU) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">한 달 30일 총 누적 (MAU)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics?.monthlyMAU ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 이용</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            총 누적 유저: <strong className="text-amber-600">{metrics?.totalUniqueVisitors ?? 0}명</strong>
          </p>
        </div>
      </div>

      {/* SECTION 1: Interactive City/District Search Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-600" />
              시·군·구 실시간 지역 검색 및 유저/클럽 조회
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              원하는 시·군·구를 검색하시면 해당 지역의 유저 수, 개설 클럽, 주요 활동 구장이 즉시 표출됩니다.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-lg self-start sm:self-auto">
            총 {metrics?.cityDirectory?.length ?? 0}개 핵심 거점 등록
          </span>
        </div>

        {/* Search Input Box */}
        <div className="relative">
          <input
            type="text"
            value={citySearchQuery}
            onChange={(e) => setCitySearchQuery(e.target.value)}
            placeholder="지역명을 검색하세요 (예: 구미, 포항, 달서, 수성, 사상, 영등포, 창원, 수원...)"
            className="w-full py-3.5 pl-11 pr-24 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          {citySearchQuery && (
            <button
              onClick={() => setCitySearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700"
            >
              초기화
            </button>
          )}
        </div>

        {/* Quick Tag Recommendations */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <span className="text-zinc-400 font-medium">빠른 검색:</span>
          {['구미시', '포항시', '달서구', '수성구', '사상구', '영등포구', '창원시', '수원시', '화천군', '제주시'].map((tag) => (
            <button
              key={tag}
              onClick={() => setCitySearchQuery(tag)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                citySearchQuery === tag
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* City Directory Search Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredCities.map((city) => {
            const isGumi = city.cityName.includes('구미');
            return (
              <div
                key={city.cityName}
                className={`p-4 rounded-xl border transition-all ${
                  isGumi
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{city.cityName}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium">
                      {city.province}
                    </span>
                    {isGumi && (
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded">
                        홈 거점 1위
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{city.userCount}</span>
                    <span className="text-xs text-zinc-500 font-medium">명 유저</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 border-t border-zinc-200/60 dark:border-zinc-800 pt-2">
                  <div className="flex items-start gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">클럽 ({city.clubCount}개): </span>
                      <span>{city.clubs.join(', ')}</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-zinc-700 dark:text-zinc-300">주요 구장: </span>
                      <span>{city.courses.join(' · ')}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCities.length === 0 && (
            <div className="col-span-full text-center py-8 text-zinc-400 text-xs">
              &apos;{citySearchQuery}&apos;에 해당하는 지역 검색 결과가 없습니다. 시·군·구 명칭을 다시 확인해주세요.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: User Activity & Loyalty Cohort Distribution */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              유저 활동 빈도 및 충성도 분포도 (헤비 vs 레귤러 vs 라이트)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              실제 이용 주기를 기반으로 한 유저 세분화 분석입니다. (최근 실사용자 기준)
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800/60 self-start sm:self-auto">
            주간 실사용자 충성도 지수
          </span>
        </div>

        {/* Visual Segmented Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-amber-600">🔥 헤비 유저 {metrics?.userCohorts?.heavyUsers?.percentage ?? 0}%</span>
            <span className="text-emerald-600">⛳ 레귤러 유저 {metrics?.userCohorts?.regularUsers?.percentage ?? 0}%</span>
            <span className="text-blue-600">📱 라이트 유저 {metrics?.userCohorts?.lightUsers?.percentage ?? 0}%</span>
          </div>
          <div className="w-full h-4 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${metrics?.userCohorts?.heavyUsers?.percentage ?? 45}%` }}
              title="헤비 유저"
            />
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${metrics?.userCohorts?.regularUsers?.percentage ?? 35}%` }}
              title="레귤러 유저"
            />
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${metrics?.userCohorts?.lightUsers?.percentage ?? 20}%` }}
              title="라이트 유저"
            />
          </div>
        </div>

        {/* Cohorts 3-Column Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          {/* Heavy Users */}
          <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" />
                헤비 유저 (매일 1회 이상)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-md">
                {metrics?.userCohorts?.heavyUsers?.percentage ?? 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-amber-700 dark:text-amber-400">
              {metrics?.userCohorts?.heavyUsers?.count ?? 0}<span className="text-xs font-medium text-zinc-500 ml-1">명</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              스코어카드 실시간 기록, 멀티플레이 라운드 주도, 클럽 월례회 상시 참석 핵심 고객
            </p>
          </div>

          {/* Regular Users */}
          <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-emerald-600" />
                레귤러 유저 (주 1~3회)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-md">
                {metrics?.userCohorts?.regularUsers?.percentage ?? 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {metrics?.userCohorts?.regularUsers?.count ?? 0}<span className="text-xs font-medium text-zinc-500 ml-1">명</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              주간 정기 라운드 참여, 번개 모임 조인, 구장 실시간 잔디 상태 점검 동호인
            </p>
          </div>

          {/* Light Users */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-blue-600" />
                라이트 유저 (가끔/탐색)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 bg-blue-200/60 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md">
                {metrics?.userCohorts?.lightUsers?.percentage ?? 0}%
              </span>
            </div>
            <div className="mt-2 text-2xl font-black text-blue-700 dark:text-blue-400">
              {metrics?.userCohorts?.lightUsers?.count ?? 0}<span className="text-xs font-medium text-zinc-500 ml-1">명</span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
              경기 규정집 검색, 신규 구장 정보 탐색, 어쩌다 라운드 시 가볍게 확인하는 유저
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: Nationwide 8-Province & 17-City/Province Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-emerald-600" />
              전국 8도 및 17개 광역시·도 유저 & 클럽 통합 누계
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              전국 17개 시·도별 유저 수, 클럽 수, 대표 활동 구장 및 클럽 랭킹 일람입니다.
            </p>
          </div>

          {/* Region Group Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs font-semibold">
            {['ALL', '영남권', '수도권', '충청권', '호남권', '강원/제주'].map((grp) => (
              <button
                key={grp}
                onClick={() => setSelectedRegionGroup(grp)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  selectedRegionGroup === grp
                    ? 'bg-emerald-600 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200'
                }`}
              >
                {grp === 'ALL' ? '전체 시·도' : grp}
              </button>
            ))}
          </div>
        </div>

        {/* 17 Provinces Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3 font-semibold">순위</th>
                <th className="py-2.5 px-3 font-semibold">광역시·도</th>
                <th className="py-2.5 px-3 font-semibold">권역</th>
                <th className="py-2.5 px-3 font-semibold">유저 수 (점유율)</th>
                <th className="py-2.5 px-3 font-semibold">클럽 수</th>
                <th className="py-2.5 px-3 font-semibold">대표 활동 구장</th>
                <th className="py-2.5 px-3 font-semibold">주요 활동 클럽</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filteredProvinces.map((prov, idx) => {
                const isTop1 = idx === 0 && selectedRegionGroup === 'ALL';
                return (
                  <tr key={prov.code} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-zinc-700 dark:text-zinc-300">
                      <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${
                        isTop1 ? 'bg-amber-100 text-amber-700 font-black' : 'text-zinc-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                      {prov.name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                        {prov.regionGroup}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <strong className="text-emerald-600 font-bold text-sm">{prov.userCount}명</strong>
                        <span className="text-zinc-400">({prov.userPercentage}%)</span>
                      </div>
                      <div className="w-24 bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.max(8, prov.userPercentage)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-purple-600 dark:text-purple-400 text-sm">
                      {prov.clubCount}개
                    </td>
                    <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400 max-w-xs">
                      {prov.majorCourses.join(', ')}
                    </td>
                    <td className="py-3 px-3 text-zinc-500 max-w-xs">
                      {prov.topClubs.map(c => `${c.name}(${c.memberCount}명)`).join(', ') || '동호회 모집 중'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4: 2-Column: Popular Pages & Daily Trend */}
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

        {/* Daily Trend (Last 7 days) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-600" />
            최근 7일간 일별 접속 추이 (페이지뷰 & 순방문자)
          </h2>
          <div className="space-y-3">
            {metrics?.dailyTrend && Object.keys(metrics.dailyTrend).length > 0 ? (
              Object.entries(metrics.dailyTrend).map(([date, data]) => {
                const isToday = date === new Date().toISOString().split('T')[0];
                const pct = Math.max(6, Math.round((data.pageviews / maxPvInTrend) * 100));

                return (
                  <div key={date} className="flex items-center gap-3 text-xs">
                    <span className={`w-28 font-mono ${isToday ? 'font-bold text-emerald-600' : 'text-zinc-500'}`}>
                      {date} {isToday && '(오늘)'}
                    </span>
                    <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-4 overflow-hidden flex items-center">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isToday ? 'bg-emerald-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-24 text-right flex items-center justify-end gap-1.5 font-mono">
                      <strong className="text-zinc-900 dark:text-zinc-100">{data.pageviews}PV</strong>
                      <span className="text-zinc-400">({data.uniqueVisitors}명)</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-zinc-400 py-6 text-center">추이 데이터 없음</p>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 5: Real-time Visitor Stream (Recent 30 visits) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              실시간 방문자 로그 (최근 30건 상세)
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              개인정보 보호법에 따라 IP 뒷자리는 안전하게 마스킹 처리되며, 접속 지역 및 디바이스를 표기합니다.
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
                  const isGumi = v.userRegion?.includes('구미');
                  return (
                    <tr key={v.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-zinc-500 whitespace-nowrap">
                        {v.dateStr} {v.timeStr}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded font-medium text-[11px] ${
                          isGumi 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}>
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

      {/* SECTION 6: Quick Admin Actions & Operations */}
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
              <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200">어르신 왕글씨 규정집</div>
              <div className="text-[11px] text-zinc-400">규정집 글자 크기 3단계 점검</div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400" />
          </Link>
        </div>
      </div>
    </div>
  );
}
