'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Activity
} from 'lucide-react';

interface Metrics {
  totalPageviews: number;
  todayPageviews: number;
  uniqueVisitors: number;
  todayUniqueVisitors: number;
  weeklyActiveUsers: number;
  dailyTrend: Record<string, { pageviews: number; uniqueVisitors: number }>;
  regionStats: Array<{
    region: string;
    count: number;
    percentage: number;
    sampleCourses: string[];
  }>;
  gumiStats: {
    region: string;
    count: number;
    percentage: number;
    sampleCourses: string[];
  };
  clubStats: {
    totalClubs: number;
    totalClubMembers: number;
    topClubs: Array<{
      id: string;
      name: string;
      region: string;
      homeCourse: string;
      memberCount: number;
      president: string;
      manager: string;
      status: string;
    }>;
    activeGatheringsCount: number;
    flashGatherings: Array<{
      id: string;
      title: string;
      courseName: string;
      time: string;
      host: string;
      target: number;
      current: number;
      status: string;
    }>;
  };
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

  // Calculate maximum values for progress bars
  const maxPvInTrend = metrics?.dailyTrend 
    ? Math.max(...Object.values(metrics.dailyTrend).map(d => d.pageviews), 1)
    : 1;

  // --- Authenticated Dashboard ---
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> 최고관리자 모드
              </span>
              <span className="text-xs text-emerald-200 font-mono">
                마스터: 김대희 (총괄)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black mt-1.5 flex items-center gap-2">
              ParkOn 실시간 & 누적 통합 관제센터
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
              www.parkongolf.com 의 누적 방문자, 7일 활성 이용자(WAU), 구미 거점 분포 및 전국 클럽 현황을 총괄 모니터링합니다.
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
              누적 데이터베이스 및 IP 마스킹 보안 암호화 가동 중
            </span>
          </div>
        )}
      </div>

      {/* 4 Core Cumulative Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Today UV (오늘 총 방문자) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-blue-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">오늘 총 방문자 (DAU)</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics?.todayUniqueVisitors ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 방문</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            오늘 총 페이지뷰: <strong className="text-blue-600">{metrics?.todayPageviews ?? 0}회</strong>
          </p>
        </div>

        {/* 2. 7-Day Active Users (WAU) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-emerald-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">주간 실사용자 (7일 WAU)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {metrics?.weeklyActiveUsers ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 이용</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            최근 7일간 실접속 순인원
          </p>
        </div>

        {/* 3. Clubs & Community Stats */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-purple-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">전국 개설 클럽 & 회원</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400">
              {metrics?.clubStats?.totalClubs ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">개 클럽</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            총 회원 <strong className="text-purple-600">{metrics?.clubStats?.totalClubMembers ?? 0}명</strong> (번개 {metrics?.clubStats?.activeGatheringsCount ?? 0}건)
          </p>
        </div>

        {/* 4. Total Cumulative Users & PV */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-sm hover:border-amber-400 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-500">누적 총 순방문자</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
              {metrics?.uniqueVisitors ?? 0}
            </span>
            <span className="text-xs font-semibold text-zinc-500">명 누적</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            누적 총 페이지뷰: <strong className="text-amber-600">{metrics?.totalPageviews ?? 0}회</strong>
          </p>
        </div>
      </div>

      {/* SECTION 1: Regional User Distribution (Gumi Focus) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              지역별 파크온 유저 분포도 및 거점 현황
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              회원 프로필, 선호 홈구장, 방문 경로를 종합 분석한 전국 시·도별 실시간 유저 점유율입니다.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800/60 self-start sm:self-auto">
            파크골프 메카 구미 거점 집중 집계
          </span>
        </div>

        {/* Gumi Highlight Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-emerald-900/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-md">핵심 거점 1위</span>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  경북 구미시 파크온 유저 현황
                </h3>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                거점 구장: <strong>구미 동락(36홀)</strong> · <strong>구미 양호(36홀)</strong> · <strong>구미 지산(63홀)</strong> 중심 활동
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-4 bg-white dark:bg-zinc-900 px-5 py-3 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm self-start md:self-auto">
            <div>
              <div className="text-[11px] text-zinc-400 font-medium">구미 등록 유저 수</div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics?.gumiStats?.count ?? 0}<span className="text-xs font-normal text-zinc-500 ml-0.5">명</span>
              </div>
            </div>
            <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800" />
            <div>
              <div className="text-[11px] text-zinc-400 font-medium">전체 대비 점유율</div>
              <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                {metrics?.gumiStats?.percentage ?? 0}<span className="text-xs font-normal text-zinc-500 ml-0.5">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Distribution List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {metrics?.regionStats && metrics.regionStats.map((reg, idx) => {
            const isGumi = reg.region.includes('구미');
            return (
              <div
                key={reg.region}
                className={`p-3.5 rounded-xl border transition-all ${
                  isGumi
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850/50'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${
                      idx === 0 ? 'bg-emerald-600 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200">{reg.region}</span>
                    {isGumi && (
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300 text-[10px] font-bold rounded">
                        홈 거점
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">{reg.count}명</span>
                    <span className="font-semibold text-xs text-emerald-600">({reg.percentage}%)</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isGumi ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.max(5, reg.percentage)}%` }}
                  />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <span>활동 구장:</span>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    {reg.sampleCourses.join(', ') || '전국 코스'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Nationwide Club & Community Intelligence */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              전국 파크골프 클럽 현황 및 활동 랭킹
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              전국 개설 클럽: <strong>{metrics?.clubStats?.totalClubs ?? 0}개</strong> · 총 등록 회원: <strong>{metrics?.clubStats?.totalClubMembers ?? 0}명</strong>
            </p>
          </div>
          <Link
            href="/club"
            className="text-xs font-semibold px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors flex items-center gap-1 self-start sm:self-auto"
          >
            <span>클럽 허브 바로가기</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Clubs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-400">
                <th className="py-2.5 px-3 font-semibold">순위</th>
                <th className="py-2.5 px-3 font-semibold">클럽명</th>
                <th className="py-2.5 px-3 font-semibold">지역</th>
                <th className="py-2.5 px-3 font-semibold">홈구장</th>
                <th className="py-2.5 px-3 font-semibold">회원 수</th>
                <th className="py-2.5 px-3 font-semibold">임원진</th>
                <th className="py-2.5 px-3 font-semibold">운영 현황</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {metrics?.clubStats?.topClubs?.map((club, idx) => (
                <tr key={club.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                  <td className="py-3 px-3 font-bold text-zinc-700 dark:text-zinc-300">
                    <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px] ${
                      idx === 0 ? 'bg-amber-100 text-amber-700 font-black' : 'text-zinc-500'
                    }`}>
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                    {club.name}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">
                      {club.region}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-zinc-600 dark:text-zinc-400">
                    {club.homeCourse}
                  </td>
                  <td className="py-3 px-3">
                    <strong className="text-emerald-600 font-bold text-sm">{club.memberCount}명</strong>
                  </td>
                  <td className="py-3 px-3 text-zinc-500">
                    회장: {club.president} / 총무: {club.manager}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
                      {club.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Real-time Flash Gatherings List */}
        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <h3 className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 mb-3">
            <Flame className="w-4 h-4 text-amber-500" />
            현재 실시간 모집 중인 번개 라운드 ({metrics?.clubStats?.activeGatheringsCount ?? 0}건)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {metrics?.clubStats?.flashGatherings?.map((flash) => (
              <div key={flash.id} className="p-3 bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 font-bold rounded">
                    {flash.time}
                  </span>
                  <span className="font-bold text-emerald-600">{flash.current} / {flash.target}명</span>
                </div>
                <div className="font-bold text-xs text-zinc-800 dark:text-zinc-200 line-clamp-1">{flash.title}</div>
                <div className="text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>📍 {flash.courseName}</span>
                  <span>개설: {flash.host}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: 2-Column: Popular Pages & Daily Trend */}
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

      {/* SECTION 4: Real-time Visitor Stream (Recent 30 visits) */}
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
                          {v.userRegion || '경북 구미'}
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

      {/* SECTION 5: Quick Admin Actions & Operations */}
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
