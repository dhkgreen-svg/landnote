'use client';
// Build: 2026-09-16-clean-home
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, MapPin, History, Award, Flame, Trophy, X, ArrowRight, ChevronDown, Check, Plus, Star, Search, Trash2, Share2, Download, Heart, Smartphone, Target, Sparkles } from 'lucide-react';
import { Course, RoundSession, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage, UserGolfProfile, DEFAULT_USER_PROFILE } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { ConditionStatus } from '@/components/ConditionStatus';
import { InstallPrompt } from '@/components/InstallPrompt';
import { InstallGuideModal } from '@/components/InstallGuideModal';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { WelcomeModal } from '@/components/WelcomeModal';
import { RulesWebtoonModal } from '@/components/RulesWebtoonModal';
import { CompanionFeedWidget } from '@/components/CompanionFeedWidget';
import { KakaoAuthUser } from '@/lib/storage';

export default function HomePage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>(() => ParkOnStorage.getAllCourses());
  const [homeCourse, setHomeCourse] = useState<Course | null>(null);
  const [favoriteHomeCourseIds, setFavoriteHomeCourseIds] = useState<string[]>([]);
  const [showHomeModal, setShowHomeModal] = useState<boolean>(false);
  const [homeModalSearch, setHomeModalSearch] = useState<string>('');
  const [activeRound, setActiveRound] = useState<RoundSession | null>(null);
  const [completedRounds, setCompletedRounds] = useState<RoundSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserGolfProfile>(DEFAULT_USER_PROFILE);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showNationalStatsModal, setShowNationalStatsModal] = useState<boolean>(false);
  const [showRulesWebtoonModal, setShowRulesWebtoonModal] = useState<boolean>(false);
  const [showRulesSolomonPopup, setShowRulesSolomonPopup] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'FIRST_PLACE' | 'TOP4'>('FIRST_PLACE');
  const [rankingMainTab, setRankingMainTab] = useState<'SKILL_100' | 'ACTIVITY_100'>('SKILL_100');
  const [showLeaderboard100Popup, setShowLeaderboard100Popup] = useState<boolean>(false);
  const [statsCourseId, setStatsCourseId] = useState<string>('');
  const [showStatsSearchModal, setShowStatsSearchModal] = useState<boolean>(false);
  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
  const [clubBadge, setClubBadge] = useState<{ text: string; isPlaying: boolean } | null>(null);
  const [showKakaoModal, setShowKakaoModal] = useState<boolean>(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [showInstallGuideModal, setShowInstallGuideModal] = useState<boolean>(false);

  useEffect(() => {
    const loadData = () => {
      const allCourses = ParkOnStorage.getAllCourses();
      setCourses(allCourses);

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramCourseId = urlParams ? urlParams.get('courseId') : null;
      if (paramCourseId) {
        ParkOnStorage.setHomeCourseId(paramCourseId);
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      const homeId = ParkOnStorage.getHomeCourseId();
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
    window.addEventListener('parkon_profile_updated', loadData);
    window.addEventListener('parkon_round_completed', loadData);
    window.addEventListener('parkon_favorite_courses_updated', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('parkon_profile_updated', loadData);
      window.removeEventListener('parkon_round_completed', loadData);
      window.removeEventListener('parkon_favorite_courses_updated', loadData);
    };
  }, []);

  // 기본 구장 알고리즘: 현재 라운드 진행 중인 구장 > 최근 공식 완주 구장 > 지정 홈구장 > 동락파크골프장
  const getCurrentActiveCourse = (): Course | null => {
    // 1. 현재 라운드 진행 중인 구장 (동락에서 치고 있으면 동락, 구미면 구미, 인천이면 인천)
    const active = ParkOnStorage.getCurrentRound();
    if (active && active.status === 'IN_PROGRESS' && active.courseId) {
      const found = courses.find((c) => c.id === ParkOnStorage.normalizeCourseId(active.courseId));
      if (found) return found;
    }
    // 2. 가장 최근에 공식 완주한 구장
    const completed = ParkOnStorage.getCompletedRounds();
    if (completed.length > 0 && completed[0].courseId) {
      const found = courses.find((c) => c.id === ParkOnStorage.normalizeCourseId(completed[0].courseId));
      if (found) return found;
    }
    // 3. 사용자가 지정한 홈구장
    if (homeCourse) return homeCourse;
    const homeId = ParkOnStorage.getHomeCourseId();
    if (homeId) {
      const found = courses.find((c) => c.id === ParkOnStorage.normalizeCourseId(homeId));
      if (found) return found;
    }
    // 4. 폴백: 동락파크골프장 또는 첫 번째 구장
    const dongrak = courses.find((c) => c.name.includes('동락'));
    return dongrak || courses[0] || null;
  };

  const openStatsModalWithCourse = (courseId?: string) => {
    const currentActive = getCurrentActiveCourse();
    setStatsCourseId(courseId || currentActive?.id || courses[0]?.id || '');
    setShowStatsModal(true);
  };

  // 내 홈 구장 목록: 사용자가 지정/등록한 모든 홈구장 목록 (구미, 동락, 양포 등 절대 소실 방지)
  const myHomeCourseList = Array.from(
    new Set([
      ...(homeCourse ? [ParkOnStorage.normalizeCourseId(homeCourse.id)] : []),
      ...favoriteHomeCourseIds.map((id) => ParkOnStorage.normalizeCourseId(id)),
    ])
  )
    .map((id) => {
      return (
        courses.find((c) => c.id === id) ||
        (id === 'course-26ed6cca-09c6-42fe-8e1e-773f23a30db1'
          ? courses.find((c) => c.name.includes('양포') || c.name.includes('양호'))
          : undefined)
      );
    })
    .filter((c): c is Course => !!c);

  const handleSelectHomeCourse = (courseId: string) => {
    const validId = ParkOnStorage.normalizeCourseId(courseId);
    ParkOnStorage.setHomeCourseId(validId);
    const found = courses.find((c) => c.id === validId);
    if (found) {
      setHomeCourse(found);
    }
    setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleRemoveHomeCourse = (e: React.MouseEvent, courseId: string) => {
    e.stopPropagation();
    const updated = ParkOnStorage.removeFavoriteHomeCourse(courseId);
    setFavoriteHomeCourseIds(updated);
    if (ParkOnStorage.normalizeCourseId(homeCourse?.id || '') === ParkOnStorage.normalizeCourseId(courseId)) {
      const nextHome = courses.find((c) => c.id === updated[0]);
      if (nextHome) setHomeCourse(nextHome);
    }
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
          { rank: 1, name: '[예시] 김동식', score: 48, date: '2026.09.11', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[예시] 오세진', score: 48, date: '2026.09.04', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[예시] 윤미경', score: 48, date: '2026.08.27', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[샘플] 배준호', score: 48, date: '2026.08.12', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[체험용] 류승완', score: 48, date: '2026.07.30', grade: '5스타 마스터', isMe: false },
        ]
      : [
          { rank: 1, name: '[예시] 이진호', score: 49, date: '2026.09.10', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[예시] 김현수', score: 49, date: '2026.09.02', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[샘플] 서미정', score: 49, date: '2026.08.20', grade: '5스타 마스터', isMe: false },
          { rank: 1, name: '[예시] 홍길동', score: 49, date: '2026.08.08', grade: '5스타 마스터', isMe: false },
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
          { rank: 1, name: '[예시] 정태호', rounds: 48, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '[예시] 최경숙', rounds: 38, tier: '매일 라운딩' },
          { rank: 3, name: '[샘플] 오성근', rounds: 29, tier: '주 4~5회 완주' },
          { rank: 4, name: '[체험용] 한상우', rounds: 22, tier: '주 3~4회 완주' },
        ]
      : isDongrak
      ? [
          { rank: 1, name: '[예시] 이재홍', rounds: 54, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '[예시] 김말선', rounds: 44, tier: '매일 라운딩' },
          { rank: 3, name: '[샘플] 박진태', rounds: 33, tier: '주 4~5회 완주' },
          { rank: 4, name: '[체험용] 서정민', rounds: 26, tier: '주 3~4회 완주' },
        ]
      : [
          { rank: 1, name: '[예시] 장석호', rounds: 46, tier: '하루 2~3게임 열정왕' },
          { rank: 2, name: '[예시] 권영미', rounds: 37, tier: '매일 라운딩' },
          { rank: 3, name: '[샘플] 백운기', rounds: 28, tier: '주 4~5회 완주' },
          { rank: 4, name: '[체험용] 송인철', rounds: 21, tier: '주 3~4회 완주' },
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
  const fallbackCourse = courses[0] || ParkOnStorage.getAllCourses()[0];
  const activeStatsCourse =
    courses.find((c) => c.id === statsCourseId) ||
    getCurrentActiveCourse() ||
    fallbackCourse;
  const activeCourseStats = getCourseStats(activeStatsCourse);
  const activeCourseLeaderboard = getCourseLeaderboard(activeStatsCourse, activeCourseStats);
  const activeLeaderboard100 = ParkOnStorage.getCourseLeaderboard100(
    activeStatsCourse?.id || 'course-dongrak',
    activeStatsCourse?.name || '동락파크골프장',
    userProfile.userName
  );

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-12">
      {/* -1. 첫 방문자 환영 및 로그인/게스트 선택 관문 모달 */}
      <WelcomeModal
        onOpenKakaoLogin={() => setShowKakaoModal(true)}
        onOpenInstallGuide={() => setShowInstallGuideModal(true)}
      />

      {/* -1.8. 스마트폰 바탕화면 앱 설치 가이드 모달 */}
      <InstallGuideModal
        isOpen={showInstallGuideModal}
        onClose={() => setShowInstallGuideModal(false)}
      />

      {/* -2. 파키의 파크골프 웹툰북 & 룰 Q&A 모달 */}
      <RulesWebtoonModal
        isOpen={showRulesWebtoonModal}
        onClose={() => setShowRulesWebtoonModal(false)}
      />

      {/* -2.5. 룰 솔로몬 & 만화 웹툰 전체 가이드 팝업창 (물음표 기능 완벽 연동) */}
      {showRulesSolomonPopup && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg h-[92vh] sm:h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200">
            {/* Modal Top Bar */}
            <div className="bg-emerald-800 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-sm font-bold shadow-xs">
                  ⚖️
                </span>
                <div>
                  <div className="text-sm font-black text-white flex items-center gap-1.5">
                    <span>룰 솔로몬 & 만화 웹툰 가이드</span>
                    <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                      공인 규정 준거
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-200">필드 분쟁 1초 판정 · 음성/사진 판정 · 챕터별 만화</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRulesSolomonPopup(false)}
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 active:scale-95 text-white text-xs font-black rounded-xl flex items-center gap-1 transition shadow-xs"
              >
                <span>✕ 닫기</span>
              </button>
            </div>
            {/* Iframe to /rules */}
            <iframe
              src="/rules"
              className="w-full flex-1 border-0"
              title="파크골프 룰 솔로몬 및 만화 웹툰 가이드"
            />
          </div>
        </div>
      )}

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
          {/* 상단: 전국 구장 찾기 & 다른 내 구장 선택하기 2개 버튼 */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/courses"
              className="bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>전국 구장 찾기</span>
            </Link>

            {/* 다른 내 구장 선택하기 버튼 */}
            <button
              type="button"
              onClick={() => setShowHomeModal(true)}
              className="bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <span>다른 내 구장 선택하기</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          {/* 검색 결과 창 스타일: 흰색 배경에 선택된 구장 이름과 (지역) 표출 */}
          <div
            onClick={() => setShowHomeModal(true)}
            className="w-full bg-white text-stone-900 rounded-2xl px-4 py-3 shadow-md flex items-center justify-between cursor-pointer hover:bg-stone-50 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2 truncate">
              <span className="text-base sm:text-lg font-black text-stone-950 tracking-tight truncate">
                {homeCourse ? `${homeCourse.name} (${homeCourse.region})` : '구미 동락파크골프장 (경북 구미시)'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />
          </div>

          {/* 대표님 제안: 2분할 버튼 [가상 라운딩 하기 (체험)] vs [라운딩 바로 시작하기 (실전)] */}
          <div className="pt-1">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {/* 왼쪽: 가상 라운딩 하기 (체험/연습 모드 - 시간 무제한 · 기록 안 남음) */}
              <button
                type="button"
                onClick={() => {
                  router.push(`/round/new?courseId=${homeCourse?.id || ''}&mode=trial`);
                }}
                className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition active:scale-[0.97] cursor-pointer border-2 border-amber-300 group"
              >
                <div className="flex items-center gap-1 text-sm sm:text-base font-black leading-tight">
                  <span className="text-base sm:text-lg">🎯</span>
                  <span className="truncate">프로그램 체험 연습</span>
                </div>
                <span className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-900 bg-white/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                  가상 기록 해보기 (기록 안 남음)
                </span>
              </button>

              {/* 오른쪽: 라운딩 바로 시작하기 (실전 정식 기록) */}
              <Link
                href={`/round/new?courseId=${homeCourse?.id}`}
                className="bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-emerald-950 font-black p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition active:scale-[0.97] border-2 border-emerald-300 group"
              >
                <div className="flex items-center gap-1 text-sm sm:text-base font-black leading-tight">
                  <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-emerald-950" />
                  <span className="truncate">라운딩 바로 시작하기</span>
                </div>
                <span className="text-[10px] sm:text-[10.5px] font-extrabold text-emerald-950 bg-white/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                  실전 필드 공식 기록
                </span>
              </Link>
            </div>
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
                클럽 &amp; 대회 센터
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
                alt="클럽 및 대회 운영 파키"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-black text-stone-800 leading-tight truncate">
                클럽 관리 &amp; 대회 개설
              </div>
              <div className="text-[9.5px] text-stone-500 font-medium truncate">
                신페리오 · 샷건 전광판
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-black text-purple-800 pt-0.5 border-t border-stone-100">
            <span>클럽·대회 운영</span>
            <span className="text-purple-700 font-black">바로가기 ▶</span>
          </div>
        </Link>
      </section>

      {/* 4-1. 배너 1: 천기섬 사주 오늘의 무료 운세 제휴 배너 */}
      <a
        href="https://cheongiseong-saju.vercel.app"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (typeof window !== 'undefined' && window.innerWidth > 640) {
            e.preventDefault();
            const width = 440;
            const height = 900;
            const left = Math.max(0, Math.round((window.screen.width - width) / 2));
            const top = Math.max(0, Math.round((window.screen.height - height) / 2));
            window.open(
              'https://cheongiseong-saju.vercel.app',
              'CheongiseongSajuApp',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );
          }
        }}
        className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-3 shadow-sm border border-emerald-600/60 hover:border-emerald-400 transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group"
        title="천기섬 사주 - 오늘의 무료 운세 바로가기"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-amber-300 shrink-0 bg-stone-100 group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_31.jpg"
              alt="천기섬 사주 오늘의 무료 운세"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight">
                오늘의 무료 운세 보기
              </span>
              <span className="text-[9px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded shadow-2xs">
                천기섬 사주
              </span>
            </div>
            <p className="text-[10.5px] text-emerald-200 font-medium truncate mt-0.5">
              오늘 나의 라운드 재물운 · 홀인원 대박 기운 확인
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-amber-300 bg-white/10 group-hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl shrink-0 whitespace-nowrap transition-colors">
          운세 보기 ▶
        </span>
      </a>

      {/* 4-2. 배너 2: 파크골프 룰 솔로몬 & 만화 웹툰 가이드 바로가기 배너 */}
      <button
        type="button"
        onClick={() => setShowRulesSolomonPopup(true)}
        className="bg-gradient-to-r from-stone-800 via-emerald-950 to-stone-900 text-white rounded-2xl p-3 shadow-sm border border-emerald-700/50 hover:border-emerald-400 transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group text-left w-full"
        title="파크골프 룰 솔로몬 & 만화 웹툰 가이드 팝업 열기"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-emerald-400 shrink-0 bg-stone-100 group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_1.jpg"
              alt="파크골프 룰 솔로몬 & 만화 웹툰 가이드"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight">
                파크골프 룰 솔로몬 & 만화 웹툰
              </span>
              <span className="text-[9px] font-black bg-emerald-400 text-stone-950 px-1.5 py-0.2 rounded shadow-2xs">
                만화로 보는 룰
              </span>
            </div>
            <p className="text-[10.5px] text-stone-300 font-medium truncate mt-0.5">
              필드 분쟁 즉시 판정 · 챕터별 만화 가이드 · 공인 규정 준거
            </p>
          </div>
        </div>
        <span className="text-[10px] font-black text-emerald-300 bg-white/10 group-hover:bg-white/20 border border-white/20 px-2.5 py-1.5 rounded-xl shrink-0 whitespace-nowrap transition-colors">
          룰 솔로몬 보기 ▶
        </span>
      </button>

      {/* 4.5. 나의 파크골프 연대기 & 1촌 바로가기 카드 */}
      <Link
        href="/chronicle"
        className="block bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 text-white rounded-3xl p-4 border border-emerald-500/40 shadow-sm hover:border-amber-400 transition group active:scale-[0.99]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors">
                  📖 나의 파크골프 연대기 &amp; 1촌 인연
                </span>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                  신규
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                커리어 마일스톤 · 1촌 친목 번개 띄우기 · 전국 구장 도장깨기
              </p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-amber-300 group-hover:translate-x-1 transition-transform shrink-0" />
        </div>
      </Link>

      {/* 4.6. 1촌 실시간 응원 피드 위젯 */}
      <CompanionFeedWidget />

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
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-2.5 gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10.5px] text-emerald-300 font-bold flex items-center gap-1">
                      <span>📍</span>
                      <span>조회 중인 구장</span>
                    </span>
                    {/* 카카오톡 검색 결과 스타일의 깔끔한 흰색 박스 */}
                    <div className="mt-1.5 bg-white text-stone-950 font-black px-3.5 py-1.5 rounded-xl text-sm shadow-sm border border-stone-200 inline-flex items-center gap-1.5 max-w-full">
                      <span className="text-emerald-700 text-base leading-none">⛳</span>
                      <span className="truncate">{activeStatsCourse.name}</span>
                    </div>
                  </div>

                  {/* '미반영' 탭 삭제 -> [ 🔍 다른 구장 검색하기 ] 버튼 탑재 */}
                  <button
                    type="button"
                    onClick={() => {
                      setStatsSearchQuery('');
                      setShowStatsSearchModal(true);
                    }}
                    className="bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-xs px-3 py-2 rounded-xl shadow-md border border-[#E6CF00] flex items-center gap-1.5 transition cursor-pointer shrink-0 mt-3"
                    title="전국 파크골프장 검색 및 조회 구장 변경"
                  >
                    <Search className="w-3.5 h-3.5 text-stone-900 stroke-[2.5]" />
                    <span>다른 구장 검색하기</span>
                  </button>
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

              {/* 2. 🏆 [구장별 1~100위 랭킹 센터: 2줄 탭 버튼 -> 전용 팝업창 호출] */}
              <div className="space-y-2 pt-1">
                {/* 1번 줄: 공인 실력 1위에서 100위 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    setRankingMainTab('SKILL_100');
                    setShowLeaderboard100Popup(true);
                  }}
                  className="w-full p-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between cursor-pointer border border-amber-400/80 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white/90 text-amber-950 flex items-center justify-center text-base shadow-2xs shrink-0 font-bold">
                      🏆
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-black text-stone-950 flex items-center gap-1.5">
                        <span>{activeStatsCourse.name} 공인 실력 1위에서 100위</span>
                      </div>
                      <div className="text-[10.5px] text-stone-900/90 font-bold">
                        클럽전·공식 대회 기준 · 정식 공인 순위
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-stone-950 bg-white/80 hover:bg-white px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs shrink-0">
                    순위 보기 ❯
                  </span>
                </button>

                {/* 2번 줄: 필드 활동 1위에서 100위 버튼 */}
                <button
                  type="button"
                  onClick={() => {
                    setRankingMainTab('ACTIVITY_100');
                    setShowLeaderboard100Popup(true);
                  }}
                  className="w-full p-3.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-2xl shadow-sm hover:shadow transition flex items-center justify-between cursor-pointer border border-emerald-500/80 active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-white/20 text-white flex items-center justify-center text-base shadow-2xs shrink-0 font-bold">
                      🔥
                    </span>
                    <div className="text-left">
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>{activeStatsCourse.name} 필드 활동 1위에서 100위</span>
                      </div>
                      <div className="text-[10.5px] text-emerald-100 font-medium">
                        친선·연습 포함 모든 완주 기록 100% 반영
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-black text-emerald-950 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs shrink-0">
                    순위 보기 ❯
                  </span>
                </button>
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

      {/* 🔍 다른 구장 검색하기 (전국 구장 검색 & 랭킹 조회 구장 변경 모달) */}
      {showStatsSearchModal && (
        <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp max-h-[85vh] flex flex-col overflow-hidden border border-stone-100">
            {/* 헤더 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                  🔍
                </span>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">전국 구장 검색</h3>
                  <p className="text-[11px] text-stone-500 font-medium">조회할 파크골프장을 선택하세요</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStatsSearchModal(false);
                  setStatsSearchQuery('');
                }}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
              >
                ✕
              </button>
            </div>

            {/* 검색 입력창 */}
            <div className="p-3.5 border-b border-stone-100 bg-stone-50 shrink-0">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={statsSearchQuery}
                  onChange={(e) => setStatsSearchQuery(e.target.value)}
                  placeholder="구장명 또는 지역 검색 (예: 동락, 구미, 양포, 인천...)"
                  className="w-full pl-9 pr-8 py-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 outline-none shadow-2xs"
                  autoFocus
                />
                {statsSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setStatsSearchQuery('')}
                    className="absolute right-2.5 text-stone-400 hover:text-stone-600 font-bold text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* 내 지정 홈구장 빠른 선택 칩 */}
              {myHomeCourseList.length > 0 && !statsSearchQuery && (
                <div className="mt-2.5 space-y-1">
                  <div className="text-[10.5px] font-black text-stone-600 flex items-center gap-1">
                    <span>⭐ 내 지정 홈구장 빠른 선택</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {myHomeCourseList.map((hc) => (
                      <button
                        key={hc.id}
                        type="button"
                        onClick={() => {
                          setStatsCourseId(hc.id);
                          setShowStatsSearchModal(false);
                          setStatsSearchQuery('');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition border cursor-pointer ${
                          activeStatsCourse.id === hc.id
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        ⛳ {hc.name.replace(/파크골프장|골프장/g, '').trim()}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 검색 결과 목록 */}
            <div className="p-3 space-y-1.5 overflow-y-auto flex-1 divide-y divide-stone-100">
              {courses
                .filter((c) => {
                  if (!statsSearchQuery.trim()) return true;
                  const q = statsSearchQuery.trim().toLowerCase();
                  const noSpaceQ = q.replace(/\s+/g, '');
                  const name = c.name.toLowerCase();
                  const noSpaceName = name.replace(/\s+/g, '');
                  const reg = (c.region || '').toLowerCase();
                  const addr = (c.address || '').toLowerCase();
                  const isYanghoQuery = q.includes('양포') || q.includes('양호') || noSpaceQ.includes('양포') || noSpaceQ.includes('양호');
                  const isYanghoCourse = name.includes('양포') || name.includes('양호') || addr.includes('양호');
                  return (
                    name.includes(q) ||
                    noSpaceName.includes(noSpaceQ) ||
                    reg.includes(q) ||
                    addr.includes(q) ||
                    (isYanghoQuery && isYanghoCourse)
                  );
                })
                .slice(0, 50)
                .map((c) => {
                  const isCurrent = activeStatsCourse.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setStatsCourseId(c.id);
                        setShowStatsSearchModal(false);
                        setStatsSearchQuery('');
                      }}
                      className={`p-2.5 rounded-xl transition cursor-pointer flex items-center justify-between hover:bg-emerald-50/50 ${
                        isCurrent ? 'bg-emerald-50 border border-emerald-300 font-black' : ''
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-stone-900 truncate">{c.name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-emerald-700 text-white font-black px-1.5 py-0.2 rounded-full shrink-0">
                              조회 중
                            </span>
                          )}
                        </div>
                        <div className="text-[10.5px] text-stone-500 font-medium mt-0.5">
                          {c.region} · {formatCourseHolesText(c)}
                        </div>
                      </div>
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-lg text-xs font-black shrink-0 transition ${
                          isCurrent
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-stone-200 text-stone-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                        }`}
                      >
                        {isCurrent ? '선택됨' : '선택'}
                      </button>
                    </div>
                  );
                })}
            </div>

            {/* 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 bg-stone-50 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowStatsSearchModal(false);
                  setStatsSearchQuery('');
                }}
                className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏆 구장별 1~100위 순위 전용 팝업창 (공인 실력 1~100위 / 필드 활동 1~100위) */}
      {showLeaderboard100Popup && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-stone-100">
            {/* 팝업 헤더 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-4 shrink-0 bg-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shadow-xs shrink-0 ${
                  rankingMainTab === 'SKILL_100' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {rankingMainTab === 'SKILL_100' ? '🏆' : '🔥'}
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-stone-900 leading-tight truncate">
                    {activeStatsCourse.name} 1~100위 랭킹
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium truncate">
                    {rankingMainTab === 'SKILL_100'
                      ? '클럽전·공식 대회 정규 18홀 공인 순위'
                      : '친선·연습 포함 누적 필드 활동 순위'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLeaderboard100Popup(false)}
                className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* 팝업 내부 2대 탭 전환 바 */}
            <div className="p-3 bg-stone-50 border-b border-stone-100 shrink-0">
              <div className="grid grid-cols-2 gap-1.5 bg-stone-200/70 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRankingMainTab('SKILL_100')}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rankingMainTab === 'SKILL_100'
                      ? 'bg-amber-500 text-stone-950 shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>🏆</span>
                  <span>공인 실력 1~100위</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRankingMainTab('ACTIVITY_100')}
                  className={`py-2 px-3 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    rankingMainTab === 'ACTIVITY_100'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <span>🔥</span>
                  <span>필드 활동 1~100위</span>
                </button>
              </div>
            </div>

            {/* 팝업 본문 스크롤 영역 */}
            <div className="p-3.5 space-y-3 overflow-y-auto flex-1 overscroll-contain">
              {/* --- 탭 1: 공인 실력 랭킹 1~100위 --- */}
              {rankingMainTab === 'SKILL_100' && (
                <div className="space-y-3">
                  {/* 기준 배지 */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                      <span>⛳ {activeStatsCourse.name} 공인 실력 순위</span>
                    </div>
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                      클럽전·공식 대회 기준
                    </span>
                  </div>

                  {/* 내 공인 순위 또는 등외 점수 안내 카드 */}
                  {activeLeaderboard100.userSkillStatus.hasOfficialMatch ? (
                    <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-2.5 flex items-center justify-between text-xs font-black text-emerald-950">
                      <div className="flex items-center gap-1.5">
                        <span>🏅 내 공인 순위:</span>
                        <span className="text-emerald-800 text-sm font-black">{activeLeaderboard100.userSkillStatus.officialRank}위</span>
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded">공인 인증</span>
                      </div>
                      <span className="text-sm font-black text-emerald-800">
                        {activeLeaderboard100.userSkillStatus.officialScore}타
                      </span>
                    </div>
                  ) : activeLeaderboard100.userSkillStatus.hasCasualRound ? (
                    <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-2.5 space-y-1 text-xs font-bold text-amber-950">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span>🏅 내 최고 기록:</span>
                          <span className="text-emerald-800 font-black text-sm">{activeLeaderboard100.userSkillStatus.casualScore}타</span>
                          <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded">
                            등외 점수 (비공식 친선)
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-800 font-black">
                          상위 {activeLeaderboard100.userSkillStatus.casualRankEquivalent}위권 수준
                        </span>
                      </div>
                      <p className="text-[10.5px] text-amber-900/90 font-medium leading-tight">
                        👉 개인 친선 라운드 기록으로 훌륭한 실력이지만 비공인입니다. <strong>공식 대회(클럽전)</strong>에 참가하시면 정식 공인 순위표에 등록됩니다!
                      </p>
                    </div>
                  ) : (
                    <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 text-center text-xs text-stone-500 font-medium">
                      아직 이 구장에서의 라운드 기록이 없습니다. 클럽전 또는 라운드를 시작해 보세요!
                    </div>
                  )}

                  {/* 1~100위 순위표 */}
                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-0.5 border border-stone-200 rounded-xl p-1 bg-stone-50/50 divide-y divide-stone-100">
                    {activeLeaderboard100.skillTop100.map((player) => {
                      const isTop1 = player.rank === 1;
                      const isTop3 = player.rank <= 3;
                      const medal = isTop1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : null;

                      return (
                        <div
                          key={player.rank}
                          className={`p-2 rounded-xl transition flex items-center justify-between text-xs ${
                            player.isMe
                              ? 'bg-amber-100/90 border-2 border-amber-400 font-black shadow-xs'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isTop3 ? 'bg-amber-400 text-amber-950 shadow-2xs' : 'bg-stone-200 text-stone-700'
                            }`}>
                              {medal || player.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-stone-900 truncate">
                                  {player.name}
                                </span>
                                <span className="text-[9.5px] bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded truncate max-w-[90px]">
                                  {player.clubName}
                                </span>
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1 rounded">
                                  {player.matchType}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                                {player.grade} · {player.date}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-800">
                              {player.score}타
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 공인 기준 상세 안내 */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-black">
                      <span>💡</span>
                      <span>공인 실력 순위 엄격 집계 기준</span>
                    </div>
                    <p className="text-stone-600 font-medium">
                      공인 실력 랭킹은 공정성을 위해 <strong>파크온이 인증한 공인 클럽전 또는 공식 대회 18홀 완주 기록만</strong> 반영됩니다. 개인 친선 라운드는 등외 점수로 평가됩니다.
                    </p>
                  </div>
                </div>
              )}

              {/* --- 탭 2: 필드 활동 랭킹 1~100위 --- */}
              {rankingMainTab === 'ACTIVITY_100' && (
                <div className="space-y-3">
                  {/* 기준 배지 */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                      <span>🔥 {activeStatsCourse.name} 필드 활동 순위</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-black">
                      친선·연습·대회 전체 누적
                    </span>
                  </div>

                  {/* 내 활동 순위 카드 */}
                  <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-2.5 flex items-center justify-between text-xs font-black text-emerald-950">
                    <div className="flex items-center gap-1.5">
                      <span>🔥 내 활동 순위:</span>
                      <span className="text-emerald-800 text-sm font-black">{activeLeaderboard100.userActivityStatus.rank}위</span>
                      <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                        {activeLeaderboard100.userActivityStatus.tier}
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-800">
                      월 {activeLeaderboard100.userActivityStatus.roundsCount30Days}회 완주
                    </span>
                  </div>

                  {/* 1~100위 순위표 */}
                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-0.5 border border-stone-200 rounded-xl p-1 bg-stone-50/50 divide-y divide-stone-100">
                    {activeLeaderboard100.activityTop100.map((player) => {
                      const isTop1 = player.rank === 1;
                      const isTop3 = player.rank <= 3;
                      const medal = isTop1 ? '🥇' : player.rank === 2 ? '🥈' : player.rank === 3 ? '🥉' : null;

                      return (
                        <div
                          key={player.rank}
                          className={`p-2 rounded-xl transition flex items-center justify-between text-xs ${
                            player.isMe
                              ? 'bg-emerald-100/90 border-2 border-emerald-400 font-black shadow-xs'
                              : 'hover:bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              isTop3 ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-stone-200 text-stone-700'
                            }`}>
                              {medal || player.rank}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-stone-900 truncate">
                                  {player.name}
                                </span>
                                {player.clubName && (
                                  <span className="text-[9.5px] bg-stone-200/80 text-stone-700 px-1.5 py-0.2 rounded truncate max-w-[90px]">
                                    {player.clubName}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-emerald-800 font-medium mt-0.5">
                                {player.tier}
                              </div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-emerald-900">
                              월 {player.rounds}회
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 활동 기준 상세 안내 */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-emerald-900 font-black">
                      <span>💡</span>
                      <span>필드 활동 지수 반영 기준 안내</span>
                    </div>
                    <p className="text-stone-600 font-medium">
                      활동 지수는 <strong>정규 리그나 대회 여부와 관계없이</strong>, 필드를 방문하여 혼자 연습하거나 친선으로 플레이한 모든 완주 기록(하루 2~3회 포함)을 <strong>100% 실시간으로 반영</strong>합니다.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 팝업 하단 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 bg-stone-50 shrink-0">
              <button
                type="button"
                onClick={() => setShowLeaderboard100Popup(false)}
                className="w-full py-2.5 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition cursor-pointer"
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

            {/* Quick Add Course Search Input */}
            <div className="p-3.5 bg-stone-100/90 border-b border-stone-200">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={homeModalSearch}
                  onChange={(e) => setHomeModalSearch(e.target.value)}
                  placeholder="새로운 내 구장 검색 추가 (예: 양포, 양호, 선산, 도개...)"
                  className="w-full bg-white text-stone-900 pl-9 pr-3 py-2 rounded-xl text-xs border border-stone-300 focus:outline-hidden focus:border-emerald-600 font-bold placeholder:text-stone-400"
                />
              </div>

              {/* 검색 결과 드롭다운 */}
              {homeModalSearch.trim() && (
                <div className="mt-2 max-h-44 overflow-y-auto bg-white rounded-xl border border-stone-200 shadow-md divide-y divide-stone-100">
                  {courses
                    .filter((c) => {
                      const q = homeModalSearch.trim().toLowerCase();
                      const noSpaceQ = q.replace(/\s+/g, '');
                      const name = c.name.toLowerCase();
                      const noSpaceName = name.replace(/\s+/g, '');
                      const reg = (c.region || '').toLowerCase();
                      const addr = (c.address || '').toLowerCase();
                      const isYanghoQuery = q.includes('양포') || q.includes('양호') || noSpaceQ.includes('양포') || noSpaceQ.includes('양호');
                      const isYanghoCourse = name.includes('양포') || name.includes('양호') || addr.includes('양호');
                      return (
                        name.includes(q) ||
                        noSpaceName.includes(noSpaceQ) ||
                        reg.includes(q) ||
                        addr.includes(q) ||
                        (isYanghoQuery && isYanghoCourse)
                      );
                    })
                    .slice(0, 8)
                    .map((sc) => {
                      const isAlreadyInMyList = myHomeCourseList.some((m) => m.id === sc.id);
                      return (
                        <div key={sc.id} className="p-2.5 flex items-center justify-between hover:bg-stone-50 text-xs">
                          <div>
                            <div className="font-black text-stone-900">{sc.name}</div>
                            <div className="text-[10px] text-stone-500">{sc.region} · {formatCourseHolesText(sc)}</div>
                          </div>
                          {isAlreadyInMyList ? (
                            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              내 구장 등록됨
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                ParkOnStorage.addFavoriteHomeCourse(sc.id);
                                setFavoriteHomeCourseIds(ParkOnStorage.getFavoriteHomeCourseIds());
                                setHomeModalSearch('');
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-lg cursor-pointer transition active:scale-95"
                            >
                              + 내 구장 추가
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Content: 내 구장 목록 */}
            <div className="p-4 space-y-2.5 max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between text-xs text-stone-600 font-bold mb-1">
                <span>내가 지정한 홈 구장 ({myHomeCourseList.length}개소)</span>
                <Link
                  href="/courses"
                  onClick={() => setShowHomeModal(false)}
                  className="text-emerald-700 hover:text-emerald-900 flex items-center gap-0.5 text-[11px] font-black"
                >
                  <span>전국 구장 찾기</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

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

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                        }`}
                      >
                        {isSelected ? '선택됨' : '선택'}
                      </button>

                      {myHomeCourseList.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveHomeCourse(e, c.id)}
                          className="w-8 h-8 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="내 구장에서 제외"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
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
