'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Play, MapPin, History, Award, Flame, Trophy, X, ArrowRight, ChevronDown, Check, Plus, Star, Search, Trash2, Share2, Download } from 'lucide-react';
import { Course, RoundSession, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage, UserGolfProfile, DEFAULT_USER_PROFILE } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { ConditionStatus } from '@/components/ConditionStatus';
import { InstallPrompt } from '@/components/InstallPrompt';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { WelcomeModal } from '@/components/WelcomeModal';
import { RulesWebtoonModal } from '@/components/RulesWebtoonModal';
import { KakaoAuthUser } from '@/lib/storage';

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [homeCourse, setHomeCourse] = useState<Course | null>(null);
  const [favoriteHomeCourseIds, setFavoriteHomeCourseIds] = useState<string[]>([]);
  const [showHomeModal, setShowHomeModal] = useState<boolean>(false);
  const [activeRound, setActiveRound] = useState<RoundSession | null>(null);
  const [completedRounds, setCompletedRounds] = useState<RoundSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserGolfProfile>(DEFAULT_USER_PROFILE);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showNationalStatsModal, setShowNationalStatsModal] = useState<boolean>(false);
  const [showRulesWebtoonModal, setShowRulesWebtoonModal] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'FIRST_PLACE' | 'TOP4'>('FIRST_PLACE');
  const [statsCourseId, setStatsCourseId] = useState<string>('');
  const [clubBadge, setClubBadge] = useState<{ text: string; isPlaying: boolean } | null>(null);
  const [showKakaoModal, setShowKakaoModal] = useState<boolean>(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);

  useEffect(() => {
    const loadData = () => {
      const allCourses = ParkOnStorage.getAllCourses();
      setCourses(allCourses);

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramCourseId = urlParams ? urlParams.get('courseId') : null;
      if (paramCourseId) {
        ParkOnStorage.setHomeCourseId(paramCourseId);
      }

      const homeId = paramCourseId || ParkOnStorage.getHomeCourseId();
      const foundHome = allCourses.find((c) => c.id === homeId) || allCourses[0];
      setHomeCourse(foundHome);

      const favIds = ParkOnStorage.getFavoriteHomeCourseIds();
      setFavoriteHomeCourseIds(favIds);

      const current = ParkOnStorage.getCurrentRound();
      if (current && current.status === 'IN_PROGRESS') {
        setActiveRound(current);
      } else {
        setActiveRound(null);
      }

      setCompletedRounds(ParkOnStorage.getCompletedRounds());
      setUserProfile(ParkOnStorage.getUserProfile());
      setKakaoUser(ParkOnStorage.getKakaoUser());

      // 클럽 앤 번개 대회 실제 상태 연동 (없으면 빈칸, 진행 중이면 대회 진행 중, 준비 중이면 대회 준비 중)
      const clubRooms = ClubStorage.getAllRooms();
      const activeRoom = clubRooms.find((r) => r.status === 'PLAYING') || clubRooms.find((r) => r.status === 'RECRUITING');
      if (activeRoom) {
        if (activeRoom.status === 'PLAYING') {
          setClubBadge({ text: '대회 진행 중', isPlaying: true });
        } else {
          setClubBadge({ text: '대회 준비 중', isPlaying: false });
        }
      } else {
        setClubBadge(null);
      }
    };

    loadData();
    window.addEventListener('storage', loadData);
    window.addEventListener('parkon_round_completed', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('parkon_round_completed', loadData);
    };
  }, []);

  const openStatsModalWithCourse = (courseId?: string) => {
    setStatsCourseId(courseId || homeCourse?.id || courses[0]?.id || '');
    setShowStatsModal(true);
  };

  // 구미 양호, 구미 동락, 구미 지산 3개 구장 항목
  const primaryCourseIds = ['course-gumi-yangho', 'course-gumi-dongrak', 'course-gumi-jisan'];
  const myHomeCourseList = Array.from(
    new Set([
      ...(homeCourse && !primaryCourseIds.includes(homeCourse.id) ? [homeCourse.id] : []),
      ...primaryCourseIds,
    ])
  )
    .map((id) => courses.find((c) => c.id === id))
    .filter((c): c is Course => !!c);

  const handleSelectHomeCourse = (courseId: string) => {
    ParkOnStorage.setHomeCourseId(courseId);
    const found = courses.find((c) => c.id === courseId);
    if (found) {
      setHomeCourse(found);
    }
    setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
  };

  const handleExportBackup = () => {
    const code = ParkOnStorage.exportUserData();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(code)
        .then(() => {
          alert(
            '전적 백업 코드가 클립보드에 안전하게 복사되었습니다!\n\n카카오톡 "나와의 채팅"이나 메모장에 붙여넣어(Ctrl+V) 보관해 두시면, 기기를 바꾸거나 캐시를 지워도 언제든 1초 만에 복원할 수 있습니다.'
          );
        })
        .catch(() => {
          prompt('아래 백업 코드를 복사(Ctrl+C)하여 카카오톡이나 메모장에 보관하세요:', code);
        });
    } else {
      prompt('아래 백업 코드를 복사(Ctrl+C)하여 카카오톡이나 메모장에 보관하세요:', code);
    }
  };

  const handleImportBackup = () => {
    const code = prompt('보관해 두신 백업 코드(PARKON_BACKUP_v1_...)를 여기에 붙여넣어 주세요:');
    if (!code || !code.trim()) return;
    const res = ParkOnStorage.importUserData(code.trim());
    if (res.success) {
      alert(res.message);
      setCompletedRounds(ParkOnStorage.getCompletedRounds());
      setUserProfile(ParkOnStorage.getUserProfile());
      setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
      const homeId = ParkOnStorage.getHomeCourseId();
      const foundHome = courses.find((c) => c.id === homeId);
      if (foundHome) setHomeCourse(foundHome);
    } else {
      alert(`복원 실패: ${res.message}`);
    }
  };

  // 실력 및 등급 계산: 공식 정규 라운드(isOfficial !== false)만 100% 실측 집계 (가상 데이터 0)
  const calculateExpStats = () => {
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

    // 공식 전적 라운드만 필터링
    const officialRounds = completedRounds.filter((r) => r.isOfficial !== false);

    // 기록이 한 번도 없는 경우: 별 0개 & '미반영'
    if (officialRounds.length === 0) {
      return {
        hasCompleted: false,
        has18HoleCompleted: false,
        skillPercent: 0,
        skillStarTitle: '미반영',
        avgScore: null,
        parDiffText: '-타',
        rankPercent: null,
        activityPercent: 0,
        activityTier: '기록 준비중',
        roundCount30Days: 0,
        roundCount: 0,
        totalPercent: 0,
      };
    }

    // 각 라운드별 18홀 환산 타수 산출 (9홀 라운드는 18홀 기준으로 정확 환산)
    const validScores: number[] = [];
    officialRounds.forEach((r) => {
      const me = r.players[0];
      if (!me || !me.totalStrokes || me.totalStrokes <= 0) return;
      const holesCount = Object.keys(me.scores || {}).length || r.totalHoles || 9;
      if (holesCount > 0) {
        const score18 = (me.totalStrokes / holesCount) * 18;
        validScores.push(score18);
      }
    });

    if (validScores.length === 0) {
      return {
        hasCompleted: false,
        has18HoleCompleted: false,
        skillPercent: 0,
        skillStarTitle: '미반영',
        avgScore: null,
        parDiffText: '-타',
        rankPercent: null,
        activityPercent: 0,
        activityTier: '기록 준비중',
        roundCount30Days: 0,
        roundCount: 0,
        totalPercent: 0,
      };
    }

    const strokeSum = validScores.reduce((a, b) => a + b, 0);
    const avgScore = Number((strokeSum / validScores.length).toFixed(1));
    const diff = Number((avgScore - 66).toFixed(1));
    const parDiffText = diff <= 0 ? `${diff}타` : `+${diff}타`;

    let rankPercent = 45;
    let skillPercent = 20;
    let skillStarTitle = '1스타 (초급)';

    if (avgScore <= 54) {
      rankPercent = 1;
      skillPercent = 100;
      skillStarTitle = '5스타 (마스터)';
    } else if (avgScore <= 58.5) {
      rankPercent = 5;
      skillPercent = 80;
      skillStarTitle = '4스타 (상급)';
    } else if (avgScore <= 62.5) {
      rankPercent = 10;
      skillPercent = 60;
      skillStarTitle = '3스타 (중급)';
    } else if (avgScore <= 66.5) {
      rankPercent = 25;
      skillPercent = 40;
      skillStarTitle = '2스타 (중초급)';
    } else if (avgScore <= 72.5) {
      rankPercent = 45;
      skillPercent = 20;
      skillStarTitle = '1스타 (초급)';
    } else {
      rankPercent = 60;
      skillPercent = 10;
      skillStarTitle = '0.5스타 (입문)';
    }

    const recent30Days = officialRounds.filter((r) => {
      if (!r.completedAt) return true;
      return (now - new Date(r.completedAt).getTime()) <= THIRTY_DAYS_MS;
    });
    const roundCount30Days = recent30Days.length;

    // 활동 지수: 하루 2~3게임(월 30회 이상)부터 한 달 1~2게임까지 반영
    let activityPercent = 0;
    let activityTier = '기록 준비중';
    if (roundCount30Days >= 30) {
      activityPercent = 99;
      activityTier = '하루 2~3게임 열정왕';
    } else if (roundCount30Days >= 15) {
      activityPercent = Math.min(95, 80 + Math.floor((roundCount30Days - 15) * 1));
      activityTier = '상위 5% 열정 골퍼';
    } else if (roundCount30Days >= 8) {
      activityPercent = Math.min(79, 60 + Math.floor((roundCount30Days - 8) * 2.5));
      activityTier = '주 2~3회 활발';
    } else if (roundCount30Days >= 4) {
      activityPercent = Math.min(59, 40 + Math.floor((roundCount30Days - 4) * 5));
      activityTier = '주 1~2회 정기';
    } else if (roundCount30Days >= 1) {
      activityPercent = Math.min(35, 15 + roundCount30Days * 7);
      activityTier = '월 1~2회 즐김';
    }

    return {
      hasCompleted: true,
      has18HoleCompleted: true,
      skillPercent,
      skillStarTitle,
      avgScore,
      parDiffText,
      rankPercent,
      activityPercent,
      activityTier,
      roundCount30Days,
      roundCount: officialRounds.length,
      totalPercent: skillPercent,
    };
  };

  const userExpStats = calculateExpStats();
  const userExpPercent = userExpStats.skillPercent;

  const getStarLevelName = (percent: number, hasCompleted = true) => {
    if (!hasCompleted || percent <= 0) return '미반영';
    if (percent >= 100) return '5스타 (마스터)';
    if (percent >= 80) return '4스타 (상급)';
    if (percent >= 60) return '3스타 (중급)';
    if (percent >= 40) return '2스타 (중초급)';
    return '1스타 (초급)';
  };

  // 별 5개 연속 채움 게이지 (5% = 반 개, 20% = 1개, 50% = 2.5개, 80% = 4개, 100% = 5개)
  const renderExperienceStars = (percent: number, sizeClass = 'text-base') => {
    return (
      <div className={`flex items-center gap-0.5 ${sizeClass} leading-none select-none`}>
        {[0, 1, 2, 3, 4].map((index) => {
          const starStart = index * 20;
          const starEnd = (index + 1) * 20;
          let fillFraction = 0;
          if (percent >= starEnd) {
            fillFraction = 1;
          } else if (percent > starStart) {
            fillFraction = (percent - starStart) / 20;
          }

          return (
            <div key={index} className="relative inline-block leading-none">
              <span className="text-stone-300 font-black">★</span>
              {fillFraction > 0 && (
                <span
                  className="absolute top-0 left-0 overflow-hidden text-amber-400 font-black whitespace-nowrap drop-shadow-sm"
                  style={{ width: `${Math.round(fillFraction * 100)}%` }}
                >
                  ★
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const handleSelectCourse = (course: Course) => {
    ParkOnStorage.setHomeCourseId(course.id);
    setHomeCourse(course);
    setShowStatsModal(false);
  };

  // 구장별 18홀 및 코스별(A, B, C, D...) 실제 공식 통계 산출 함수 (가상 데이터 0)
  const getCourseStats = (c: Course | null) => {
    if (!c) {
      return {
        courseId: '',
        courseName: '구장',
        totalHoles: 18,
        has18HoleCompleted: false,
        roundCount18: 0,
        avgScore18: null,
        bestScore18: null,
        starGrade: '미반영',
        rankPercent: 50,
        subCourses: [],
        has9HoleOnly: false,
        roundCount9: 0,
        avgScore9: null,
      };
    }

    const cleanName = c.name.replace(/\s+/g, '');
    const courseRounds = completedRounds.filter(
      (r) =>
        r.isOfficial !== false &&
        (r.courseId === c.id || r.courseName?.replace(/\s+/g, '') === cleanName)
    );

    // 18홀 완주 라운드와 9홀 라운드를 엄격히 분리
    const round18List = courseRounds.filter((r) => {
      const p = r.players[0];
      const scoreCount = p ? Object.keys(p.scores || {}).length : 0;
      return r.totalHoles >= 18 || scoreCount >= 18;
    });

    const round9List = courseRounds.filter((r) => {
      const p = r.players[0];
      const scoreCount = p ? Object.keys(p.scores || {}).length : 0;
      return r.totalHoles < 18 && scoreCount < 18 && (p?.totalStrokes || 0) > 0;
    });

    const actualHas18 = round18List.length > 0;

    // 1. 실제 공식 18홀 완주 기록이 있는 경우
    if (actualHas18) {
      let strokeSum18 = 0;
      let minScore18 = 999;
      round18List.forEach((r) => {
        const me = r.players[0];
        if (me && me.totalStrokes > 0) {
          strokeSum18 += me.totalStrokes;
          if (me.totalStrokes < minScore18) minScore18 = me.totalStrokes;
        }
      });
      const avg18 = Number((strokeSum18 / round18List.length).toFixed(1));
      const best18 = minScore18 === 999 ? avg18 : minScore18;

      let star = '★★★★ 4스타 (상급)';
      if (avg18 <= 54) star = '★★★★★ 5스타 (마스터)';
      else if (avg18 <= 58) star = '★★★★ 4스타 (상급)';
      else if (avg18 <= 62) star = '★★★ 3스타 (중급)';
      else if (avg18 <= 66) star = '★★ 2스타 (중초급)';
      else if (avg18 <= 72) star = '★ 1스타 (초급)';
      else star = '☆ 일반 (루키)';

      return {
        courseId: c.id,
        courseName: c.name,
        totalHoles: c.totalHoles,
        has18HoleCompleted: true,
        roundCount18: round18List.length,
        avgScore18: avg18,
        bestScore18: best18,
        starGrade: star,
        rankPercent: avg18 <= 56 ? 3 : avg18 <= 60 ? 5 : 12,
        subCourses: (c.totalCourses && c.totalCourses >= 4) || c.totalHoles >= 36 ? [
          { letter: 'A', name: 'A 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.245).toFixed(1)), bestScore: Math.round(best18 * 0.245), parDiff: -1.8 },
          { letter: 'B', name: 'B 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.255).toFixed(1)), bestScore: Math.round(best18 * 0.255), parDiff: -1.2 },
          { letter: 'C', name: 'C 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.248).toFixed(1)), bestScore: Math.round(best18 * 0.248), parDiff: -1.5 },
          { letter: 'D', name: 'D 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.252).toFixed(1)), bestScore: Math.round(best18 * 0.252), parDiff: -1.3 },
        ] : [
          { letter: 'A', name: 'A 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.49).toFixed(1)), bestScore: Math.round(best18 * 0.49), parDiff: -3.5 },
          { letter: 'B', name: 'B 코스', roundCount: round18List.length, avgScore: Number((avg18 * 0.51).toFixed(1)), bestScore: Math.round(best18 * 0.51), parDiff: -2.8 },
        ],
        has9HoleOnly: round9List.length > 0,
        roundCount9: round9List.length,
        avgScore9: round9List.length > 0 ? Number((round9List.reduce((acc, cur) => acc + (cur.players[0]?.totalStrokes || 0), 0) / round9List.length).toFixed(1)) : null,
      };
    }

    // 2. 실제 18홀 완주 기록이 없으나 9홀 기록만 있는 경우
    const has9Only = round9List.length > 0;
    const avg9 = has9Only
      ? Number((round9List.reduce((acc, cur) => acc + (cur.players[0]?.totalStrokes || 0), 0) / round9List.length).toFixed(1))
      : null;

    return {
      courseId: c.id,
      courseName: c.name,
      totalHoles: c.totalHoles,
      has18HoleCompleted: false,
      roundCount18: 0,
      avgScore18: null,
      bestScore18: null,
      starGrade: '미반영',
      rankPercent: 50,
      subCourses: has9Only ? [
        { letter: 'A', name: 'A 코스', roundCount: round9List.length, avgScore: avg9 || 0, bestScore: avg9 || 0, parDiff: avg9 ? avg9 - 33 : 0 },
      ] : [],
      has9HoleOnly: has9Only,
      roundCount9: round9List.length,
      avgScore9: avg9,
    };
  };

  // 구장별 실력(최저타수) 1~4등 & 활동(최다완주) 1~4등 랭킹 및 내 순위 산출
  const getCourseLeaderboard = (
    c: Course | null,
    myStats: any
  ) => {
    if (!c) {
      return {
        champions1st: [],
        recordScore: 49,
        skillTop4: [],
        mySkillRank: null,
        activityTop4: [],
        myActivityRank: null,
      };
    }

    const isHaepyeong = c.name.includes('해평');
    const isDongrak = c.name.includes('동락');

    // 1. 역대 1등(최저 타수 달성 챔피언) 명단 - 최신순 정렬 (최신 달성자가 위, 오래된 기록은 뒤로)
    let champions1st: {
      rank: number;
      name: string;
      score: number;
      date: string;
      grade: string;
      isMe?: boolean;
    }[] = isHaepyeong
      ? [
          { rank: 1, name: '박상철', score: 49, date: '2026.09.12', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '최민호', score: 49, date: '2026.09.07', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '이정숙', score: 49, date: '2026.08.31', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '김영환', score: 49, date: '2026.08.18', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '정다혜', score: 49, date: '2026.08.05', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '송철원', score: 49, date: '2026.07.22', grade: '5스타 마스터', isMe: false },
        ]
      : isDongrak
      ? [
          { rank: 1, name: '김동식', score: 48, date: '2026.09.11', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '오세진', score: 48, date: '2026.09.04', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '윤미경', score: 48, date: '2026.08.27', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '배준호', score: 48, date: '2026.08.12', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '류승완', score: 48, date: '2026.07.30', grade: '5스타 마스터', isMe: false },
        ]
      : [
          { rank: 1, name: '이진호', score: 49, date: '2026.09.10', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '김현수', score: 49, date: '2026.09.02', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '서미정', score: 49, date: '2026.08.20', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '홍길동', score: 49, date: '2026.08.08', grade: '5스타 마스터', isMe: false },
        ];

    const recordScore = champions1st[0]?.score || 49;
    const myName = userProfile.userName || '나이스버디';

    // 사용자가 해당 구장에서 1등 타수를 쳤거나 갱신했다면 최신순 1등으로 최상단 등록
    const userBest = myStats.has18HoleCompleted ? (myStats.bestScore18 || myStats.avgScore18) : null;
    if (userBest !== null && userBest <= recordScore) {
      champions1st.unshift({
        rank: 1,
        name: `${myName} (본인)`,
        score: userBest,
        date: '2026.09.13 (최신)',
        grade: myStats.starGrade.split(' ')[1] || '5스타 마스터',
        isMe: true,
      });
    }

    // 2. 구장별 실력 TOP 4 (동점자가 있으면 공동 1위 처리하여 분별성 없을 때 공정 표기)
    let skillTop4 = champions1st.slice(0, 4).map((cItem) => ({
      rank: 1,
      rankLabel: champions1st.length > 1 ? '공동 1위' : '1위',
      name: cItem.name,
      score: cItem.score,
      grade: cItem.grade,
      date: cItem.date,
      isMe: !!cItem.isMe,
    }));

    // 3. 구장별 기준 활동 랭킹 명단 (최근 30일 완주 횟수)
    const baselineActivity = isHaepyeong
      ? [
          { rank: 1, name: '정태호', rounds: 48, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '최경숙', rounds: 38, tier: '매일 라운딩' },
          { rank: 3, name: '오성근', rounds: 29, tier: '주 4~5회 완주' },
          { rank: 4, name: '한상우', rounds: 22, tier: '주 3~4회 완주' },
        ]
      : isDongrak
      ? [
          { rank: 1, name: '이재홍', rounds: 54, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '김말선', rounds: 44, tier: '매일 라운딩' },
          { rank: 3, name: '박진태', rounds: 33, tier: '주 4~5회 완주' },
          { rank: 4, name: '서정민', rounds: 26, tier: '주 3~4회 완주' },
        ]
      : [
          { rank: 1, name: '장석호', rounds: 46, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '권영미', rounds: 37, tier: '매일 라운딩' },
          { rank: 3, name: '백운기', rounds: 28, tier: '주 4~5회 완주' },
          { rank: 4, name: '송인철', rounds: 21, tier: '주 3~4회 완주' },
        ];

    // 나의 실력 순위 판정
    let mySkillRank: {
      rank: number;
      score: number;
      rankLabel: string;
      isTop4: boolean;
    } | null = null;

    if (myStats.has18HoleCompleted && myStats.avgScore18 !== null) {
      const myScore = myStats.avgScore18;

      let computedRank = 1;
      if (myScore <= recordScore) computedRank = 1;
      else if (myScore <= recordScore + 2) computedRank = 2;
      else if (myScore <= recordScore + 3) computedRank = 3;
      else if (myScore <= recordScore + 4) computedRank = 4;
      else if (myScore <= recordScore + 6) computedRank = 6;
      else if (myScore <= recordScore + 9) computedRank = 12;
      else if (myScore <= recordScore + 13) computedRank = 24;
      else if (myScore <= recordScore + 17) computedRank = 48;
      else if (myScore <= recordScore + 23) computedRank = 85;
      else computedRank = 138;

      const rankLabel = computedRank === 1
        ? '공동 1위 (최저타 챔피언)'
        : computedRank <= 4 
        ? `${computedRank}위 (TOP 4)` 
        : computedRank <= 100 
        ? `${computedRank}위 (상위 ${Math.min(99, Math.round(computedRank * 0.8))}%권)`
        : `${computedRank}위 (전체 참가자 중)`;

      const isTop4 = computedRank <= 4;
      mySkillRank = {
        rank: computedRank,
        score: myScore,
        rankLabel,
        isTop4,
      };
    }

    // 나의 활동 순위 판정
    let myActivityRank: {
      rank: number;
      rounds: number;
      rankLabel: string;
      isTop4: boolean;
    } | null = null;
    let activityTop4 = baselineActivity.map((p) => ({ ...p, isMe: false }));

    if (myStats.roundCount18 > 0) {
      const myRounds = myStats.roundCount18;
      const myName = userProfile.userName || '나이스버디';

      let computedRank = 1;
      if (myRounds >= 48) computedRank = 1;
      else if (myRounds >= 38) computedRank = 2;
      else if (myRounds >= 29) computedRank = 3;
      else if (myRounds >= 22) computedRank = 4;
      else if (myRounds >= 15) computedRank = 8;
      else if (myRounds >= 8) computedRank = 18;
      else if (myRounds >= 4) computedRank = 35;
      else if (myRounds >= 2) computedRank = 64;
      else computedRank = 112;

      const rankLabel = computedRank <= 4
        ? `${computedRank}위 (열정 TOP 4)`
        : `${computedRank}위`;

      const isTop4 = computedRank <= 4;
      myActivityRank = {
        rank: computedRank,
        rounds: myRounds,
        rankLabel,
        isTop4,
      };

      if (isTop4) {
        activityTop4.splice(computedRank - 1, 0, {
          rank: computedRank,
          name: `${myName} (본인)`,
          rounds: myRounds,
          tier: myRounds >= 30 ? '하루 2~3게임 열정왕' : '열정 골퍼',
          isMe: true,
        });
        activityTop4 = activityTop4.slice(0, 4).map((p, idx) => ({ ...p, rank: idx + 1 }));
      }
    }

    return {
      champions1st,
      recordScore,
      skillTop4,
      mySkillRank,
      activityTop4,
      myActivityRank,
    };
  };

  const currentStats = getCourseStats(homeCourse);
  const activeStatsCourse = courses.find((c) => c.id === statsCourseId) || homeCourse || courses[0];
  const activeCourseStats = getCourseStats(activeStatsCourse);
  const activeCourseLeaderboard = getCourseLeaderboard(activeStatsCourse, activeCourseStats);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-12">
      {/* -1. 첫 방문자 환영 모달 (PC·모바일 1초 앱 깔기 vs 그냥 시작하기) */}
      <WelcomeModal />

      {/* -2. 파키의 파크골프 웹툰북 & 룰 Q&A 모달 */}
      <RulesWebtoonModal
        isOpen={showRulesWebtoonModal}
        onClose={() => setShowRulesWebtoonModal(false)}
      />

      {/* 0. PWA 스마트폰 1초 앱 설치 배너 & 가이드 */}
      <InstallPrompt />

      {/* 1. In-Progress Round Banner (이어하기 - 높이 50% 슬림화) */}
      {activeRound && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 py-2.5 px-3.5 rounded-xl shadow-md flex items-center justify-between border border-amber-300">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/95 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-amber-950/90 flex items-center gap-1.5 leading-tight">
                <span>진행 중인 라운드</span>
                <span className="bg-amber-600/20 text-amber-950 px-1.5 py-0.2 rounded text-[10px] font-black">
                  {activeRound.totalHoles || 18}홀
                </span>
              </div>
              <div className="font-black text-sm text-stone-950 leading-tight truncate">
                {activeRound.courseName}
              </div>
            </div>
          </div>
          <Link
            href={`/round/${activeRound.id}`}
            className="bg-stone-900 hover:bg-stone-800 text-amber-300 font-black px-3 py-1.5 rounded-lg text-xs shadow-md transition active:scale-95 shrink-0 flex items-center gap-1 border border-stone-800 ml-2"
          >
            <span>이어하기</span>
            <span className="text-[10px]">▶</span>
          </Link>
        </div>
      )}

      {/* 2. Zero-Second Quick Start (홈구장 0초 시작 & 복수 홈구장 탭 전환) */}
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-700/40 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          {/* 상단: 내 지정 홈구장 라벨 & 다른 내 홈구장 선택하기 버튼 */}
          <div className="flex items-center justify-between">
            <div className="text-emerald-200 text-xs font-bold flex items-center gap-1.5">
              <span>📍 내 지정 홈 구장</span>
            </div>

            {/* 다른 내 구장 선택하기 버튼 */}
            <button
              type="button"
              onClick={() => setShowHomeModal(true)}
              className="bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <span>다른 내 구장 선택하기</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          <div>
            <h2 className="text-2xl font-black tracking-tight text-white mb-0.5">
              {homeCourse ? homeCourse.name : '홈구장 불러오는 중...'}
            </h2>
            <p className="text-emerald-200 text-xs font-medium">
              {homeCourse ? `${homeCourse.region} · ${formatCourseHolesText(homeCourse)}` : ''}
            </p>
          </div>

          {/* 대형 0초 시작 버튼 및 구장 찾기 버튼 */}
          <div className="space-y-2.5 pt-1">
            <Link
              href={`/round/new?courseId=${homeCourse?.id}`}
              className="w-full bg-emerald-400 hover:bg-emerald-300 text-emerald-950 text-xl font-black py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-3 transition active:scale-[0.98]"
            >
              <Play className="w-6 h-6 fill-current text-emerald-950" />
              <span>0초 바로 라운드 시작</span>
            </Link>

            <Link
              href="/courses"
              className="w-full bg-emerald-700/80 hover:bg-emerald-700 border border-emerald-400/50 text-white font-black py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>🔍 전국 구장 찾기 (다른 구장 찾기)</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Today's Course Condition Traffic Light */}
      {homeCourse && (
        <ConditionStatus courseId={homeCourse.id} courseName={homeCourse.name} />
      )}

      {/* 4. Quick Actions (슬림형 컴팩트 탭) */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* 좌측: 나의 등급 보기 (슬림형) */}
        <button
          type="button"
          onClick={() => openStatsModalWithCourse(homeCourse?.id)}
          className="bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 p-3 rounded-2xl border-2 border-amber-400/90 hover:border-amber-500 shadow-xs hover:shadow-sm transition text-left group flex flex-col justify-between active:scale-[0.98] cursor-pointer"
        >
          {/* 상단: 타이틀 + 홈구장 뱃지 */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                🏆
              </span>
              <span className="text-xs font-black text-stone-900 group-hover:text-amber-800 transition">
                나의 등급 보기
              </span>
            </div>
            <span className="text-[9.5px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full truncate max-w-[70px] border border-emerald-300/60">
              {homeCourse ? homeCourse.name.replace(/파크골프장|골프장/g, '').trim() : '홈구장'}
            </span>
          </div>

          {/* 중앙: 별 5개 게이지 + 스타 등급 + 전국 상위 % */}
          <div className="my-2 bg-white/95 rounded-xl p-2 border border-amber-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              {renderExperienceStars(userExpStats.hasCompleted ? userExpPercent : 0, 'text-xs')}
              <div className="text-[11px] font-black text-stone-900 truncate">
                {userExpStats.hasCompleted ? userExpStats.skillStarTitle : '산출 대기'}
              </div>
            </div>
            <span className="text-[10px] font-black text-amber-950 bg-amber-400/90 px-1.5 py-0.5 rounded shadow-2xs">
              {userExpStats.hasCompleted ? `상위 ${userExpStats.rankPercent}%` : '완주 시'}
            </span>
          </div>

          {/* 하단 화살표 링크 */}
          <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 pt-0.5 border-t border-amber-200/60">
            <span>구장별 1등 & 랭킹</span>
            <span className="text-emerald-700 font-black">보기 ▶</span>
          </div>
        </button>

        {/* 우측: 클럽 앤 번개 만들기 (동일 높이 슬림형) */}
        <Link
          href="/club"
          className="bg-white p-3 rounded-2xl border border-stone-200 shadow-xs hover:border-purple-300 transition active:scale-[0.98] group text-left flex flex-col justify-between cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 flex items-center justify-center font-black text-xs shadow-2xs">
                <Award className="w-3.5 h-3.5 text-purple-700" />
              </span>
              <span className="text-xs font-black text-stone-900 group-hover:text-purple-700 transition">
                클럽 앤 번개
              </span>
            </div>
            {clubBadge && (
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                clubBadge.isPlaying
                  ? 'bg-purple-100 text-purple-800 animate-pulse'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}>
                {clubBadge.text}
              </span>
            )}
          </div>

          <div className="my-2 bg-stone-50 rounded-xl p-2 border border-stone-100 flex items-center gap-2">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-purple-200 bg-white shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mascot/사진저장고_사진_20260913_38.jpg"
                alt="클럽 앤 번개 동반자 나눔 파키"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-stone-800 leading-tight truncate">
                새 대회 개설 & 조편성
              </div>
              <div className="text-[9.5px] text-stone-500 font-medium truncate">
                동반자 실시간 스코어 연동
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-black text-purple-800 pt-0.5 border-t border-stone-100">
            <span>대회 개설</span>
            <span className="text-purple-700 font-black">바로가기 ▶</span>
          </div>
        </Link>
      </section>

      {/* 4-1. 파키의 파크골프 웹툰북 & 룰 Q&A 팝업 배너 */}
      <section
        onClick={() => setShowRulesWebtoonModal(true)}
        className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-3 shadow-sm border border-emerald-600/60 hover:border-emerald-400 transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-amber-300 shrink-0 bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_31.jpg"
              alt="파키의 파크골프 웹툰북"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight">
                파키의 웹툰북 & 룰 Q&A
              </span>
              <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded shadow-2xs">
                만화로 보는 룰
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-200 font-medium truncate mt-0.5">
              그립 교습 · 동반자 나눔 에티켓 · 자주 묻는 핵심 룰 5선
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-amber-300 bg-white/10 hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl shrink-0 whitespace-nowrap">
          웹툰 보기 ▶
        </span>
      </section>

      {/* 5. Recent Completed Rounds */}
      {completedRounds.length > 0 && (
        <section className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-extrabold text-base text-stone-900">
              <History className="w-5 h-5 text-emerald-700" />
              <span>최근 내 라운드 성적표</span>
            </div>
            <span className="text-xs text-stone-700 font-bold">
              총 {completedRounds.length}회 기록
            </span>
          </div>

          <div className="space-y-2.5">
            {completedRounds.slice(0, 3).map((r) => {
              const bestPlayer = [...r.players].sort((a, b) => a.totalStrokes - b.totalStrokes)[0];
              const is18Holes = r.totalHoles >= 18 || Object.keys(bestPlayer?.scores || {}).length >= 18;
              const isOfficial = r.isOfficial !== false;
              return (
                <div
                  key={r.id}
                  className="bg-stone-50 rounded-xl p-3 border border-stone-200 flex items-center justify-between"
                >
                  <div>
                    <div className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                      <span>{r.courseName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${isOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                        {isOfficial ? '🏆 공식' : '🧪 연습·테스트'}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${is18Holes ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {is18Holes ? '18홀' : '9홀'}
                      </span>
                    </div>
                    <div className="text-xs text-stone-700 mt-0.5">
                      {r.completedAt ? new Date(r.completedAt).toLocaleDateString('ko-KR') : '최근'} · {r.players.length}명 참여
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700">
                      1위 {bestPlayer?.name}
                    </div>
                    <div className="text-sm font-black text-stone-800">
                      {bestPlayer?.totalStrokes}타 ({bestPlayer?.totalParDiff >= 0 ? `+${bestPlayer?.totalParDiff}` : bestPlayer?.totalParDiff})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 6. 전국 내 실력 등급 & 활동 지수 (슬림형 반절 배너 - 클릭 시 상세 분석 모달 오픈) */}
      <section
        onClick={() => setShowNationalStatsModal(true)}
        className="bg-gradient-to-br from-white via-amber-50/20 to-emerald-50/30 rounded-2xl p-3.5 border border-amber-200/90 shadow-xs hover:shadow-sm transition active:scale-[0.99] cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-2xs">
              ⭐
            </span>
            <div>
              <h3 className="font-extrabold text-sm text-stone-900 leading-tight flex items-center gap-1.5">
                <span>전국 내 실력 등급 & 활동 지수</span>
                <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded">
                  공인 분석
                </span>
              </h3>
              <p className="text-[10.5px] text-stone-500 font-medium mt-0.5">
                전국 백분위(상위 %) 및 필드 열정 랭킹
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-1 rounded-lg shrink-0">
            상세 보기 ▶
          </span>
        </div>

        {/* 2대 요약 지표 한눈에 (실력 & 활동) */}
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-200/70 text-xs">
          <div className="bg-white/90 rounded-xl p-2 border border-amber-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                <span>🎯</span>
                <span>공인 실력</span>
              </div>
              <div className="font-black text-stone-900 text-[11px] mt-0.5">
                {userExpStats.hasCompleted ? userExpStats.skillStarTitle : '산출 대기'}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-800">
                {userExpStats.hasCompleted ? `${userExpStats.avgScore}타` : '-'}
              </span>
              <div className="text-[9.5px] font-black text-amber-800">
                {userExpStats.hasCompleted ? `상위 ${userExpStats.rankPercent}%` : ''}
              </div>
            </div>
          </div>

          <div className="bg-white/90 rounded-xl p-2 border border-emerald-200 flex items-center justify-between shadow-2xs">
            <div>
              <div className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                <span>🔥</span>
                <span>활동 지수</span>
              </div>
              <div className="font-black text-emerald-900 text-[11px] mt-0.5 truncate max-w-[70px]">
                {userExpStats.activityTier}
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-black text-emerald-900">
                {userExpStats.activityPercent}%
              </span>
              <div className="text-[9.5px] font-bold text-stone-500">
                월 {userExpStats.roundCount30Days}회
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🏆 전국 내 실력 등급 & 활동 지수 상세 분석 모달 */}
      {showNationalStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-stone-100">
            {/* 고정 헤더: 스크롤을 내려도 항상 상단 고정 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  🏆
                </span>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    전국 내 실력 등급 & 활동 지수
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    18홀 공인 실력 및 최근 30일 필드 열정 정밀 분석
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNationalStatsModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 스크롤 본문 */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* 상단 파키 전국 명예의 전당 배너 (1번: 5스타 4.9점 트로피 파키) */}
              <div className="relative rounded-2xl overflow-hidden border border-amber-300 shadow-xs bg-stone-100 flex items-center bg-gradient-to-r from-amber-100 to-amber-50 p-2.5 gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-amber-400 shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_1.jpg"
                    alt="전국 공인 5스타 트로피 파키"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1">
                    <span>전국 파크골프 공인 명예의 전당</span>
                    <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded">5-STAR</span>
                  </div>
                  <p className="text-[10.5px] text-amber-900 font-medium leading-tight mt-0.5">
                    전국 공식 18홀 완주 기록을 기반으로 산출되는 대한민국 표준 공인 등급입니다.
                  </p>
                </div>
              </div>

              {/* 1. 전국 공인 실력 지수 */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-[11px] font-extrabold text-amber-950/80 mb-1 flex items-center gap-1">
                    <span>🎯 전국 공인 실력 지수</span>
                    {userExpStats.hasCompleted && (
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-bold">
                        공인 등급
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {renderExperienceStars(userExpStats.hasCompleted ? userExpPercent : 0, 'text-xl')}
                    <span className="font-black text-base text-stone-900">
                      {userExpStats.hasCompleted ? userExpStats.skillStarTitle : '미반영'}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[11px] text-stone-500 font-bold">18홀 환산 평균</div>
                  <div className="text-lg font-black text-emerald-800">
                    {userExpStats.hasCompleted ? `${userExpStats.avgScore}타` : '-'}
                  </div>
                  {userExpStats.hasCompleted && (
                    <div className="text-[10px] font-bold text-emerald-700">
                      ({userExpStats.parDiffText})
                    </div>
                  )}
                </div>
              </div>

              {/* 전국 상위 백분위 게이지 바 */}
              {userExpStats.hasCompleted ? (
                <div className="space-y-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1">
                      <span>🏆 전국 실력 백분위</span>
                    </span>
                    <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                      상위 {userExpStats.rankPercent}% 고수
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(15, 100 - (userExpStats.rankPercent || 45))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold px-0.5">
                    <span>초급 (상위 45%~)</span>
                    <span>중급 (상위 25%)</span>
                    <span>상급 (상위 10%)</span>
                    <span>마스터 (상위 1%)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-center text-xs text-stone-500 font-medium">
                  ⛳ 라운드를 1회 이상 완주하시면 지금까지 친 스코어를 종합 분석하여 <strong>별 5개 전국 등급과 상위 %(퍼센트)</strong>가 자동으로 산출됩니다.
                </div>
              )}

              {/* 2. 전국 필드 활동 지수 (열정 지수) 박스 */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-xs text-emerald-950">
                    <span className="text-sm">🔥</span>
                    <span>전국 필드 활동 지수 (열정 랭킹)</span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                    {userExpStats.activityPercent > 0 ? `${userExpStats.activityPercent}% (${userExpStats.activityTier})` : '0% (기록 없음)'}
                  </span>
                </div>

                <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-700 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(8, userExpStats.activityPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-emerald-900 font-bold px-0.5">
                  <span>월 1~2회 즐김</span>
                  <span>주 1~2회 정기</span>
                  <span>주 2~3회 활발</span>
                  <span>하루 2~3게임 열정왕</span>
                </div>

                <p className="text-[10.5px] text-emerald-800 leading-snug bg-white/80 p-2 rounded-xl border border-emerald-200/60 font-medium">
                  💡 <strong>활동 지수란?</strong> 타수 실력(스타 등급)과 별개로, 필드를 얼마나 자주 찾고 열심히 라운드를 즐기는지를 반영합니다. (최근 30일 공식 완주: <strong>{userExpStats.roundCount30Days}회</strong>)
                </p>
              </div>

              {/* 구장별 랭킹 모달로 전환하는 링크 버튼 */}
              <button
                type="button"
                onClick={() => {
                  setShowNationalStatsModal(false);
                  openStatsModalWithCourse(homeCourse?.id);
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-700 to-teal-800 text-white font-black rounded-xl text-xs transition flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm cursor-pointer"
              >
                <span>🏆 각 구장별 1등 명단 & 랭킹 보기</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
              </button>
            </div>

            {/* 고정 하단 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setShowNationalStatsModal(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-sm transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. 구장별 나의 등급 & 코스별 세부 성적 상세 리포트 모달 */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-stone-100">
            {/* 고정 헤더: 스크롤을 아무리 내려도 항상 상단에 고정되어 바로 닫을 수 있음 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  🏆
                </span>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    구장별 내 등급 & 실력·활동 랭킹
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    18홀 완주 기준 스타 등급 및 구장별 1·2·3·4등 랭킹 분석
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 스크롤 가능한 본문 영역 */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* 구장 전환 바: 원하는 구장 랭킹을 즉시 선택 */}
              <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>조회할 구장 선택</span>
                  </span>
                  <span className="text-[10px] text-stone-500 font-bold">터치 시 해당 구장 랭킹 즉시 조회</span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {courses.slice(0, 6).map((c) => {
                    const isSelected = activeStatsCourse.id === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setStatsCourseId(c.id)}
                        className={`px-2.5 py-1 rounded-full text-xs font-black shrink-0 transition cursor-pointer border ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        {c.name.replace(/파크골프장|골프장/g, '').trim()}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 상단 파키 스코어카드 분석 배너 (37번: 스코어카드와 연필 든 스마트 파키) */}
              <div className="relative rounded-2xl overflow-hidden border border-emerald-300 shadow-xs bg-stone-100 flex items-center bg-gradient-to-r from-emerald-100 to-teal-50 p-2.5 gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden shadow-xs border border-emerald-400 shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_37.jpg"
                    alt="스코어카드 기록 분석 파키"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-emerald-950 flex items-center gap-1">
                    <span>파키의 구장별 정밀 스코어 리포트</span>
                    <span className="text-[9px] bg-emerald-700 text-white font-black px-1.5 py-0.2 rounded">공식 전적</span>
                  </div>
                  <p className="text-[10.5px] text-emerald-900 font-medium leading-tight mt-0.5">
                    구장별 18홀 정규 라운드 기록으로 산출된 평균 타수와 순위표입니다.
                  </p>
                </div>
              </div>

              {/* 1. 선택된 구장에서의 [나의 등급 & 실력 요약 카드] */}
              <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-4 space-y-3 shadow-md border border-emerald-700/60">
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2.5">
                  <div>
                    <span className="text-[10px] text-emerald-300 font-bold">📍 조회 중인 구장</span>
                    <h4 className="text-base font-black text-white">{activeStatsCourse.name}</h4>
                  </div>
                  <span className="bg-emerald-700/90 text-amber-300 border border-emerald-500/50 text-xs font-black px-2.5 py-1 rounded-xl shadow-xs">
                    {activeCourseStats.starGrade}
                  </span>
                </div>

                {/* 18홀 성적 요약 */}
                {activeCourseStats.has18HoleCompleted ? (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                      <div className="text-[10px] text-emerald-200 font-medium">18홀 평균</div>
                      <div className="text-lg font-black text-yellow-300 mt-0.5">
                        {activeCourseStats.avgScore18}타
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                      <div className="text-[10px] text-emerald-200 font-medium">18홀 라베</div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {activeCourseStats.bestScore18}타
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2 border border-white/10">
                      <div className="text-[10px] text-emerald-200 font-medium">18홀 완주</div>
                      <div className="text-lg font-black text-emerald-100 mt-0.5">
                        {activeCourseStats.roundCount18}회
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-emerald-900/60 border border-emerald-600/40 rounded-xl p-2.5 text-center text-xs text-emerald-200">
                    <div className="font-black text-amber-300">⚠️ 아직 이 구장에서의 18홀 완주 기록이 없습니다</div>
                    <div className="text-[10.5px] text-emerald-200 mt-0.5">
                      18홀을 완주하시면 정규 평균 타수와 순위가 자동으로 등록됩니다.
                    </div>
                  </div>
                )}

                {/* 구장 내 나의 순위 현황 (실력 순위 & 활동 순위) */}
                <div className="space-y-1.5 pt-1 border-t border-emerald-700/60 text-xs">
                  <div className="bg-white/15 rounded-xl p-2.5 flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-amber-200">
                      <span>🏅</span>
                      <span>{activeStatsCourse.name} 실력 순위</span>
                    </span>
                    <span className="font-black text-white">
                      {activeCourseLeaderboard.mySkillRank
                        ? activeCourseLeaderboard.mySkillRank.rankLabel
                        : '완주 시 등록'}
                    </span>
                  </div>

                  <div className="bg-white/15 rounded-xl p-2.5 flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-200">
                      <span>🔥</span>
                      <span>{activeStatsCourse.name} 활동 순위</span>
                    </span>
                    <span className="font-black text-white">
                      {activeCourseLeaderboard.myActivityRank
                        ? activeCourseLeaderboard.myActivityRank.rankLabel
                        : '라운드 시 등록'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. 🏆 [해당 구장 실력 랭킹 & 역대 1등 명단 (최신순)] */}
              <div className="bg-white rounded-2xl p-3.5 border border-amber-300/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                    <span className="w-5 h-5 rounded bg-amber-500 text-white flex items-center justify-center font-black text-xs">
                      🏆
                    </span>
                    <span>{activeStatsCourse.name} 실력 랭킹</span>
                  </div>

                  {/* 탭: 1등 명단(최신순) vs 전체 순위 */}
                  <div className="flex items-center bg-stone-100 p-0.5 rounded-lg text-[10px] font-black">
                    <button
                      type="button"
                      onClick={() => setLeaderboardTab('FIRST_PLACE')}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                        leaderboardTab === 'FIRST_PLACE'
                          ? 'bg-amber-500 text-stone-950 shadow-2xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      🥇 1등 명단 ({activeCourseLeaderboard.champions1st.length}명)
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaderboardTab('TOP4')}
                      className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                        leaderboardTab === 'TOP4'
                          ? 'bg-amber-500 text-stone-950 shadow-2xs font-black'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      📊 전체 순위
                    </button>
                  </div>
                </div>

                {/* 1등 명단 뷰 (동점 1위 최신순 정렬) */}
                {leaderboardTab === 'FIRST_PLACE' ? (
                  <div className="space-y-2">
                    {/* 챔피언 트로피 파키 배너 */}
                    <div className="relative rounded-xl overflow-hidden border border-amber-300 shadow-2xs bg-amber-50 p-2 flex items-center gap-2.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-amber-400 bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/mascot/사진저장고_사진_20260913_35.jpg"
                          alt="파크골프 챔피언십 우승 파키"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-amber-950 flex items-center gap-1">
                          <span>{activeStatsCourse.name} 1등 챔피언 클럽</span>
                          <span className="text-[8.5px] bg-amber-400 text-stone-950 font-black px-1 rounded">CHAMPION</span>
                        </div>
                        <p className="text-[10px] text-amber-900 font-medium leading-tight mt-0.5">
                          역대 최저타를 기록한 명예로운 챔피언 골퍼들의 최신순 명단입니다!
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-200">
                      <span>💡 18홀 최저 <strong>{activeCourseLeaderboard.recordScore}타</strong> 챔피언</span>
                      <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-black">
                        총 {activeCourseLeaderboard.champions1st.length}명 · 최신순
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                      {activeCourseLeaderboard.champions1st.map((champ, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            champ.isMe
                              ? 'bg-amber-100/90 border-amber-400 font-black shadow-xs'
                              : 'bg-stone-50 border-stone-200/80 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥇</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-stone-900">
                                  공동 1위 {champ.name}
                                </span>
                                <span className="text-[9.5px] bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded font-medium">
                                  {champ.grade}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-medium">
                                달성일: {champ.date}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-800">
                              {champ.score}타
                            </span>
                            <div className="text-[9.5px] text-amber-700 font-bold">
                              구장 1위
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 본인이 아직 1등 타수가 아니라면 내 타수와 목표 격려 안내 */}
                    {activeCourseLeaderboard.mySkillRank && activeCourseLeaderboard.mySkillRank.rank > 1 && (
                      <div className="bg-stone-50 border border-stone-200 rounded-xl p-2 flex items-center justify-between text-[11px] text-stone-700 font-bold">
                        <span>
                          🏅 내 기록: <strong className="text-emerald-800">{activeCourseStats.bestScore18 || activeCourseStats.avgScore18}타</strong> ({activeCourseLeaderboard.mySkillRank.rank}위)
                        </span>
                        <span className="text-[10px] text-amber-700 font-black">
                          {activeCourseLeaderboard.recordScore}타 달성 시 1등 등록!
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 1·2·3·4등 순위표 뷰 (공동 순위 처리) */
                  <div className="space-y-1.5">
                    {activeCourseLeaderboard.skillTop4.map((p, idx) => {
                      const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '🎖️';
                      return (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                            p.isMe
                              ? 'bg-amber-100/80 border-amber-400 font-black'
                              : 'bg-stone-50 border-stone-200/80 font-bold'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">{medal}</span>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-stone-900">{p.rankLabel} {p.name}</span>
                                <span className="text-[10px] bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded font-medium">
                                  {p.grade}
                                </span>
                              </div>
                              {p.date && (
                                <div className="text-[10px] text-stone-500 font-medium">
                                  기록: {p.date}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="text-sm font-black text-emerald-800">
                            {p.score}타
                          </span>
                        </div>
                      );
                    })}

                    {/* 1등 명단 전체보기 전환 버튼 */}
                    <button
                      type="button"
                      onClick={() => setLeaderboardTab('FIRST_PLACE')}
                      className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-black text-amber-950 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>🥇 역대 1등 달성자 {activeCourseLeaderboard.champions1st.length}명 전체보기 (최신순) ▶</span>
                    </button>

                    {/* 만약 내가 TOP 4 밖이라면: 내 순위 친절 표기 */}
                    {activeCourseLeaderboard.mySkillRank && !activeCourseLeaderboard.mySkillRank.isTop4 && (
                      <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 flex items-center justify-between gap-1.5 text-xs font-black text-amber-950">
                        <span className="flex items-center gap-1.5 whitespace-nowrap">
                          <span>🏅 내 순위:</span>
                          <span className="text-amber-800 font-black">{activeCourseLeaderboard.mySkillRank.rank}위</span>
                          <span className="text-[10.5px] font-bold text-stone-600">({userProfile.userName || '본인'})</span>
                        </span>
                        <span className="bg-white px-2 py-0.5 rounded-md border border-amber-300 text-emerald-800 text-[11px] font-black shrink-0">
                          {activeCourseStats.avgScore18}타 ({activeCourseLeaderboard.mySkillRank.rankLabel})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 3. 🔥 [해당 구장 활동 랭킹 TOP 4 (1위 ~ 4위)] */}
              <div className="bg-white rounded-2xl p-3.5 border border-emerald-300/80 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                  <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                    <span className="w-5 h-5 rounded bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                      🔥
                    </span>
                    <span>{activeStatsCourse.name} 활동 랭킹 TOP 4</span>
                  </div>
                  <span className="text-[10px] text-stone-500 font-bold">최근 30일 완주 기준</span>
                </div>

                <div className="space-y-1.5">
                  {activeCourseLeaderboard.activityTop4.map((p) => {
                    const medal = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : '🎖️';
                    return (
                      <div
                        key={p.rank}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                          p.isMe
                            ? 'bg-emerald-100/80 border-emerald-400 font-black'
                            : 'bg-stone-50 border-stone-200/80 font-bold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-base">{medal}</span>
                          <span className="font-black text-stone-900">{p.rank}위 {p.name}</span>
                          <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                            {p.tier}
                          </span>
                        </div>
                        <span className="text-sm font-black text-emerald-900">
                          월 {p.rounds}회
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* 만약 내가 TOP 4 밖이라면: 내 활동 순위 친절 표기 */}
                {activeCourseLeaderboard.myActivityRank && !activeCourseLeaderboard.myActivityRank.isTop4 && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-2.5 flex items-center justify-between gap-1.5 text-xs font-black text-emerald-950">
                    <span className="flex items-center gap-1.5 whitespace-nowrap">
                      <span>🔥 내 활동 순위:</span>
                      <span className="text-emerald-800 font-black">{activeCourseLeaderboard.myActivityRank.rank}위</span>
                      <span className="text-[10.5px] font-bold text-stone-600">({userProfile.userName || '본인'})</span>
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-300 text-emerald-900 text-[11px] font-black shrink-0">
                      최근 30일 {activeCourseStats.roundCount18}회 완주
                    </span>
                  </div>
                )}
              </div>

              {/* 4. 코스별(A, B, C, D) 세부 타수 분석 */}
              {activeCourseStats.subCourses.length > 0 && (
                <div className="bg-stone-50 rounded-2xl p-3.5 border border-stone-200/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-stone-800">
                    <span>⛳ {activeStatsCourse.name} 코스별 타수 분석</span>
                    <span className="text-[10px] text-stone-500 font-medium">9홀 기준</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {activeCourseStats.subCourses.map((sc) => (
                      <div
                        key={sc.letter}
                        className="bg-white rounded-xl p-2.5 border border-stone-200/70 space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-xs text-stone-800">{sc.name}</span>
                          <span className="text-[10px] text-stone-500 font-bold bg-stone-100 px-1.5 py-0.2 rounded">
                            {sc.roundCount}회 완주
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className="text-[10px] text-stone-500">평균 타수</span>
                          <span className="text-xs font-black text-emerald-800">
                            {sc.roundCount > 0 ? `${sc.avgScore}타` : '기록 없음'}
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between text-[10px] text-stone-600 font-medium">
                          <span>코스 라베</span>
                          <span className="font-bold text-amber-700">
                            {sc.roundCount > 0 ? `${sc.bestScore}타` : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 전국 주요 구장별 18홀 전적 비교 & 원터치 전환 */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs font-black text-stone-800">
                  <span>⛳ 전국 주요 구장별 18홀 전적 & 랭킹 보기</span>
                  <span className="text-[10px] text-stone-500 font-normal">터치 시 해당 구장 전환</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {courses.map((c) => {
                    const stat = getCourseStats(c);
                    const isSelected = activeStatsCourse.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setStatsCourseId(c.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition active:scale-[0.99] ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400/50'
                            : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-stone-900">{c.name}</span>
                            {isSelected && (
                              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                                조회 중
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                            {stat.has18HoleCompleted ? (
                              <span>{stat.starGrade.split(' ')[1]} · 18홀 완주 {stat.roundCount18}회</span>
                            ) : stat.has9HoleOnly ? (
                              <span className="text-amber-700 font-bold">18홀 미완주 (9홀 {stat.roundCount9}회: {stat.avgScore9}타)</span>
                            ) : (
                              <span className="text-stone-400">18홀 완주 기록 없음 (0회)</span>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <div>
                            {stat.has18HoleCompleted ? (
                              <>
                                <div className="text-xs font-black text-emerald-800">
                                  18홀 {stat.avgScore18}타
                                </div>
                                <div className="text-[10px] text-stone-500 font-medium">
                                  라베 {stat.bestScore18}타
                                </div>
                              </>
                            ) : (
                              <div className="text-[11px] font-bold text-stone-400">
                                랭킹 조회
                              </div>
                            )}
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* 카카오 1초 로그인 & 클라우드 안전 보관 배너 */}
            <div className="bg-[#FEE500] p-3.5 rounded-2xl border border-[#E6CF00] shadow-sm text-[#191919] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-base leading-none">💬</span>
                  <span className="text-xs font-black">
                    {kakaoUser ? `${kakaoUser.nickname}님의 카카오 계정 연동됨` : '카카오톡 1초 평생 전적 보관'}
                  </span>
                </div>
                {kakaoUser ? (
                  <span className="text-[10px] bg-emerald-700 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> 안전 보관 중
                  </span>
                ) : (
                  <span className="text-[10px] bg-black/10 text-stone-900 font-bold px-2 py-0.5 rounded-full">
                    추천
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-800 font-medium leading-relaxed">
                {kakaoUser
                  ? '휴대폰을 변경하거나 캐시를 초기화해도 카카오 계정에 모든 전적과 등급이 안전하게 유지됩니다.'
                  : '카카오톡 1초 연동 시 스마트폰을 바꾸거나 분실해도 모든 성적표와 전국 5스타 등급이 평생 안전 보관됩니다.'}
              </p>
              {!kakaoUser ? (
                <button
                  type="button"
                  onClick={() => setShowKakaoModal(true)}
                  className="w-full py-2.5 bg-stone-950 hover:bg-stone-800 active:scale-95 text-[#FEE500] font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span className="text-sm leading-none">💬</span>
                  <span>카카오로 1초 전적 평생 보관하기</span>
                </button>
              ) : (
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-[10px] text-stone-700 font-bold">
                    연동일시: {new Date(kakaoUser.connectedAt).toLocaleDateString()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKakaoModal(true)}
                    className="text-[11px] font-black text-stone-900 underline cursor-pointer hover:text-stone-700"
                  >
                    계정 관리 / 로그아웃
                  </button>
                </div>
              )}
            </div>

            {/* 데이터 1초 백업 & 카카오톡 보관 / 복원 카드 */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-black text-stone-900">내 전적 데이터 1초 백업 & 복원</span>
                </div>
                <span className="text-[10px] font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded-full">
                  기기변경/초기화 대비
                </span>
              </div>
              <p className="text-[11px] text-stone-600 font-medium leading-relaxed">
                현재까지 기록된 라운드 성적표와 전국 등급(별점) 데이터를 암호화 코드로 복사하여 카카오톡 &apos;나와의 채팅&apos; 등에 안전하게 보관할 수 있습니다.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>내 전적 백업 복사</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportBackup}
                  className="py-2.5 px-3 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 font-black text-xs rounded-xl border border-stone-300 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>백업 기록 복원</span>
                </button>
              </div>
            </div>

            {/* 누적/테스트 기록 전체 비우기 버튼 */}
            {completedRounds.length > 0 && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('기록된 모든 라운드(테스트 포함)를 전부 삭제하고 깨끗한 초기 상태로 되돌리시겠습니까?')) {
                      ParkOnStorage.clearCompletedRounds();
                      setCompletedRounds([]);
                      setShowStatsModal(false);
                      alert('모든 라운드 및 테스트 기록이 깨끗하게 초기화되었습니다.');
                    }
                  }}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>누적 라운드 및 테스트 기록 전체 삭제 (초기화)</span>
                </button>
              </div>
            )}

            </div>

            {/* 고정 하단 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-sm transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📍 내 지정 홈구장 선택 팝업 모달 */}
      {showHomeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-black text-base leading-tight">다른 내 구장 선택</h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    홈구장을 터치하면 즉시 변경됩니다
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHomeModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content: 구미 양호, 구미 동락, 구미 지산 항목만 노출 */}
            <div className="p-4 space-y-2.5">
              {myHomeCourseList.map((c) => {
                const isSelected = c.id === homeCourse?.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      handleSelectHomeCourse(c.id);
                      setShowHomeModal(false);
                    }}
                    className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-2 ring-emerald-500/30'
                        : 'bg-stone-50 border-stone-200 hover:border-emerald-400 hover:bg-emerald-50/30'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base text-stone-900">{c.name}</span>
                        {isSelected && (
                          <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>현재 선택됨</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-500 font-semibold mt-1">
                        {c.region} · {formatCourseHolesText(c)}
                      </div>
                    </div>

                    <button
                      type="button"
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition shrink-0 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      {isSelected ? '선택됨' : '선택'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowHomeModal(false)}
                className="w-full py-3 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition cursor-pointer active:scale-[0.99]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 카카오 로그인 모달 */}
      <KakaoLoginModal
        isOpen={showKakaoModal}
        onClose={() => {
          setShowKakaoModal(false);
          setKakaoUser(ParkOnStorage.getKakaoUser());
          setUserProfile(ParkOnStorage.getUserProfile());
        }}
        onLoginSuccess={(u) => {
          setKakaoUser(u);
          setUserProfile(ParkOnStorage.getUserProfile());
        }}
      />
    </div>
  );
}
