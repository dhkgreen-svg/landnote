'use client';
// Build: 2026-10-03-field-ux-analytics-baseline-160
import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Play, MapPin, History, Award, Flame, Trophy, X, ArrowRight, ChevronDown, ChevronRight, Check, Plus, Star, Search, Trash2, Share2, Download, Heart, Smartphone, Target, Sparkles, Camera } from 'lucide-react';
import { Course, RoundSession, formatCourseHolesText } from '@/types/parkon';
import { ParkOnStorage, UserGolfProfile, DEFAULT_USER_PROFILE, ALL_BASE_COURSES } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { ConditionStatus } from '@/components/ConditionStatus';
import { CourseTodayModal } from '@/components/CourseTodayModal';
import { CourseDetailModal } from '@/components/CourseDetailModal';
import { InstallPrompt } from '@/components/InstallPrompt';
import { autoEscapeIfKakao, isKakaoTalkWebView, escapeKakaoTalk, isIOS } from '@/lib/kakaoEscape';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { WelcomeModal } from '@/components/WelcomeModal';
import { RulesWebtoonModal } from '@/components/RulesWebtoonModal';
import { CompanionFeedWidget } from '@/components/CompanionFeedWidget';
import { AutoLocationBanner } from '@/components/AutoLocationBanner';
import { NationalTourMapModal } from '@/components/NationalTourMapModal';
import { QuickGuideModal } from '@/components/QuickGuideModal';
import { RoundScoreboardModal } from '@/components/RoundScoreboardModal';
import { BadgeStorage } from '@/lib/badgeStorage';
import { AppShareModal } from '@/components/AppShareModal';
import { WatermarkPhotoCardModal } from '@/components/WatermarkPhotoCardModal';
import { ChroniclePhotoViewerModal } from '@/components/ChroniclePhotoViewerModal';
import { ChroniclePhotoUploadModal } from '@/components/ChroniclePhotoUploadModal';
import { ChronicleBackupModal } from '@/components/ChronicleBackupModal';
import { NationalRankingDetailModal } from '@/components/NationalRankingDetailModal';
import { ChroniclePhotoStorage, ChroniclePhotoItem } from '@/lib/chroniclePhotoStorage';
import { KakaoAuthUser } from '@/lib/storage';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName, stripParkGolfSuffix, translateKoreanAddressToJapanese } from '@/lib/courseLocalization';
import { getSavedMemberCode, syncMemberDataToCloud, fetchAndRestoreMemberData, normalizeMemberCode, MEMBER_CODE_STORAGE_KEY } from '@/lib/memberCodeUtils';

export default function HomePage() {
  const router = useRouter();
  const { language, setLanguage, t, isJapanese, isEnglish } = useTranslation();
  const [mounted, setMounted] = useState<boolean>(false);
  const [serviceCountry, setServiceCountryState] = useState<'KR' | 'JP'>('KR');
  const [courses, setCourses] = useState<Course[]>(ALL_BASE_COURSES);
  const [homeCourse, setHomeCourse] = useState<Course | null>(null);
  const [showNationalTourModal, setShowNationalTourModal] = useState<boolean>(false);
  const [favoriteHomeCourseIds, setFavoriteHomeCourseIds] = useState<string[]>([]);
  const [showHomeModal, setShowHomeModal] = useState<boolean>(false);
  const [homeModalSearch, setHomeModalSearch] = useState<string>('');
  const [activeRound, setActiveRound] = useState<RoundSession | null>(null);
  const [completedRounds, setCompletedRounds] = useState<RoundSession[]>([]);
  const [userProfile, setUserProfile] = useState<UserGolfProfile>(DEFAULT_USER_PROFILE);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [statsSubTab, setStatsSubTab] = useState<'TIMELINE_RANK' | 'PHOTO_ALBUM' | 'MEDALS_COURSES'>('TIMELINE_RANK');
  const [chroniclePhotos, setChroniclePhotos] = useState<ChroniclePhotoItem[]>([]);
  const [photoAlbumFilterCourse, setPhotoAlbumFilterCourse] = useState<string>('ALL');
  const [photoAlbumFilterCompanion, setPhotoAlbumFilterCompanion] = useState<string>('ALL');
  const [showChronicleBackupModal, setShowChronicleBackupModal] = useState<boolean>(false);
  const [selectedPhotoForViewer, setSelectedPhotoForViewer] = useState<ChroniclePhotoItem | null>(null);
  const [showPhotoViewerModal, setShowPhotoViewerModal] = useState<boolean>(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState<boolean>(false);
  const [uploadTargetSession, setUploadTargetSession] = useState<RoundSession | null>(null);
  const [showWatermarkCardModal, setShowWatermarkCardModal] = useState<boolean>(false);
  const [watermarkCardSession, setWatermarkCardSession] = useState<RoundSession | null>(null);
  const [watermarkCardInitialImage, setWatermarkCardInitialImage] = useState<string | null>(null);
  const [showGradePopup, setShowGradePopup] = useState<boolean>(false);
  const [selectedRoundForPopup, setSelectedRoundForPopup] = useState<RoundSession | null>(null);
  const [medalsViewSubTab, setMedalsViewSubTab] = useState<'COURSES_TOUR' | 'MEDALS_RANK'>('COURSES_TOUR');
  const [courseRegionFilter, setCourseRegionFilter] = useState<'ALL' | 'KR' | 'OVERSEAS'>('ALL');
  const [showNationalStatsModal, setShowNationalStatsModal] = useState<boolean>(false);
  const [showRulesWebtoonModal, setShowRulesWebtoonModal] = useState<boolean>(false);
  const [showRulesSolomonPopup, setShowRulesSolomonPopup] = useState<boolean>(false);
  const [leaderboardTab, setLeaderboardTab] = useState<'FIRST_PLACE' | 'TOP4'>('FIRST_PLACE');
  const [rankingMainTab, setRankingMainTab] = useState<'SKILL_100' | 'ACTIVITY_100'>('SKILL_100');
  const [showLeaderboard100Popup, setShowLeaderboard100Popup] = useState<boolean>(false);
  const [showRankingDetailPopup, setShowRankingDetailPopup] = useState<'SKILL' | 'ACTIVITY' | null>(null);
  const [timelineSort, setTimelineSort] = useState<'LATEST' | 'BEST_SCORE'>('LATEST');
  const [timelineCourseFilter, setTimelineCourseFilter] = useState<string>('ALL');
  const [selectedHistogramScore, setSelectedHistogramScore] = useState<number | string | null>(null);
  const [statsCourseId, setStatsCourseId] = useState<string>('');
  const [showStatsSearchModal, setShowStatsSearchModal] = useState<boolean>(false);
  const [statsSearchQuery, setStatsSearchQuery] = useState<string>('');
  const [clubBadge, setClubBadge] = useState<{ text: string; isPlaying: boolean } | null>(null);
  const [hasNewClubNotice, setHasNewClubNotice] = useState<boolean>(false);
  const [showKakaoModal, setShowKakaoModal] = useState<boolean>(false);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showCourseTodayModal, setShowCourseTodayModal] = useState<boolean>(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [showQuickGuideModal, setShowQuickGuideModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showShareToast, setShowShareToast] = useState<boolean>(false);
  const [shareToastMessage, setShareToastMessage] = useState<string>('✓ 파크골프 올인원 주소(https://www.parkgolfallinone.com)가 복사되었습니다!');

  const getLocalizedCourseName = (c: Course | null | undefined): string => {
    if (!c) return isJapanese ? 'まくべつ つつじが丘' : '구미 동락';
    const dual = getCourseDualName(c, isJapanese);
    return dual.primary;
  };

  const getLocalizedCourseRegion = (c: Course | null | undefined): string => {
    if (!c) return isJapanese ? '北海道 幕別町' : '경북 구미시';
    if (isJapanese) {
      return c.regionJa || c.region || '日本';
    }
    return c.regionKo || c.region || '';
  };

  const handleShareParkon = async () => {
    const rawUser = ParkOnStorage.getUserDisplayName();
    const cleanUser = rawUser && rawUser !== '파크골퍼' && rawUser !== 'パークゴルファー' ? rawUser : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
    const shareUrl = isJapanese
      ? `${origin}/?lang=ja&ref=share`
      : `${origin}/?lang=ko&ref=share`;

    const shareTitle = isJapanese
      ? 'パークゴルフ・オールインワン (ParkGolf All-in-One)'
      : '파크골프 올인원 (ParkGolf All-in-One)';
    const shareText = isJapanese
      ? `全国のパークゴルフ場案内、リアルタイム天気、1秒スコア記録、公認ルールAIまで！パークゴルフ・オールインワンで一緒にプレーしましょう。\n\n${shareUrl}`
      : `전국 400개 파크골프장 실시간 날씨, 1초 스코어카드, 공인 룰 AI까지! 파크골프 올인원에서 함께 라운드해요.\n\n${shareUrl}`;

    // 1. 클립보드에 우선 복사 (문자, 밴드, 카톡 등 어디서든 바로 붙여넣기 가능)
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setShareToastMessage(
        isJapanese
          ? '招待リンクがコピーされました！'
          : '초대 링크가 복사되었습니다!'
      );
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3000);
    } catch {
      setShareToastMessage(
        isJapanese
          ? 'URLコピーに失敗しました。'
          : 'URL 복사에 실패했습니다. 브라우저 권한을 확인해주세요.'
      );
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2500);
    }

    // 2. 모바일 환경: 문자·카톡·밴드 등 원하는 앱으로 바로 보낼 수 있는 시스템 공유창 호출 (선택)
    if (typeof navigator !== 'undefined' && navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
  };

  useEffect(() => {
    // Phase 1: 카카오톡 인앱 브라우저 감지 시 최초 1회 안전 자동 탈출 시도
    autoEscapeIfKakao();

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      try {
        localStorage.setItem('parkon_app_installed', 'true');
      } catch {}
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleAppInstallClick = async () => {
    // 1. 카카오톡 내부 브라우저인 경우: 스마트폰 기본 인터넷(크롬)으로 즉시 열기
    if (isKakaoTalkWebView()) {
      escapeKakaoTalk();
      setShareToastMessage('스마트폰 기본 인터넷(크롬)으로 열어 바로 설치합니다...');
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 3500);
      return;
    }

    // 2. 안드로이드 / 크롬 / 삼성인터넷: PWA 자동 설치창이 준비되어 있으면 즉시 시스템 설치창 호출!
    if (deferredPrompt && deferredPrompt.prompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
        }
        setDeferredPrompt(null);
        return;
      } catch (err) {
        console.warn('Direct prompt error', err);
      }
    }

    // 3. 심플 1줄 토스트 안내 (어르신 눈높이)
    setShareToastMessage('스마트폰 화면의 [설치]를 눌러주세요.');
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 3500);
  };

  const hasRestoredMemberRef = useRef(false);

  // 1. 최초 마운트 시 1회만 클라우드 연동 복원 수행 (무한 루프 방지)
  useEffect(() => {
    if (hasRestoredMemberRef.current) return;
    hasRestoredMemberRef.current = true;

    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const queryCode = urlParams?.get('code') || urlParams?.get('memberCode');
    if (queryCode) {
      const norm = normalizeMemberCode(queryCode);
      if (norm) {
        localStorage.setItem(MEMBER_CODE_STORAGE_KEY, norm);
      }
    }

    const savedCode = getSavedMemberCode();
    const activeCode = savedCode;

    if (activeCode) {
      fetchAndRestoreMemberData(activeCode).then((res) => {
        if (res.success) {
          setCompletedRounds(ParkOnStorage.getCompletedRounds());
          setUserProfile(ParkOnStorage.getUserProfile());
          setKakaoUser(ParkOnStorage.getKakaoUser());
        }
      }).catch(() => {});
    }
  }, []);

  // 2. 로컬 스토리지 및 이벤트 감청 (순수 로컬 상태 갱신만 수행, 재귀 API 호출 차단)
  useEffect(() => {
    setMounted(true);
    const loadData = () => {
      const allCourses = ParkOnStorage.getAllCourses();
      setCourses(allCourses);
      const country = ParkOnStorage.getServiceCountry();
      setServiceCountryState(country);

      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const paramCourseId = urlParams ? urlParams.get('courseId') : null;
      if (paramCourseId) {
        ParkOnStorage.setHomeCourseId(paramCourseId);
        if (typeof window !== 'undefined' && window.location.search) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }

      const homeId = ParkOnStorage.getHomeCourseId();
      const isGoro = homeId?.toLowerCase().includes('goro') || homeId?.includes('고로');
      if (isGoro && typeof window !== 'undefined') {
        try {
          localStorage.removeItem('parkon_home_course_id_v1');
          localStorage.removeItem('parkon_home_course_id');
        } catch {}
      }
      const foundHome = (homeId && !isGoro) ? allCourses.find((c) => c.id === homeId) || null : null;
      setHomeCourse(foundHome);

      // 대표님 절대 지침: 과거 더미 4개 즐겨찾기(고로, 구미, 동락, 양포) 캐시 완전 삭제
      if (typeof window !== 'undefined') {
        try {
          const rawFavs = localStorage.getItem('parkon_favorite_home_courses_v1') || localStorage.getItem('parkon_favorite_home_courses');
          if (rawFavs && (rawFavs.includes('goro') || rawFavs.includes('고로') || rawFavs.includes('course-gumi-dongrak'))) {
            localStorage.removeItem('parkon_favorite_home_courses_v1');
            localStorage.removeItem('parkon_favorite_home_courses');
          }
        } catch {}
      }

      const favIds = ParkOnStorage.getFavoriteHomeCourseIds();
      setFavoriteHomeCourseIds(favIds);

      const current = ParkOnStorage.getCurrentRound();
      // 가상 연습(virtual_) 세션이나 찌꺼기 라운드는 홈 메인에 배너로 남기지 않고 즉시 정리
      if (current && (current.id?.startsWith('virtual_') || current.courseName === '고로')) {
        ParkOnStorage.clearCurrentRound();
        setActiveRound(null);
      } else if (current && current.status === 'IN_PROGRESS') {
        setActiveRound(current);
      } else {
        setActiveRound(null);
      }

      const completed = ParkOnStorage.getCompletedRounds();
      setCompletedRounds(completed);
      const kUser = ParkOnStorage.getKakaoUser();
      setKakaoUser(kUser);

      ChroniclePhotoStorage.getAllPhotos().then((photos) => {
        setChroniclePhotos(photos);
      }).catch(() => {});

      // 클럽 앤 번개 대회 실제 상태 연동 및 신규 공지/번개 알림 체크
      const clubRooms = ClubStorage.getAllRooms();
      const activeRoom = clubRooms.find((r) => r.status === 'PLAYING') || clubRooms.find((r) => r.status === 'RECRUITING');

      const flashGatherings = ClubStorage.getAllFlashGatherings();
      const activeFlash = flashGatherings.find((f) => f.status !== 'CLOSED');

      const invitations = ClubStorage.getClubInvitations();
      const hasPendingInvites = Boolean(invitations && invitations.length > 0);

      // 클럽에 공지사항이나 번개, 대회, 초대장이 있으면 'N' 깜빡임 활성화
      const hasNoticeOrActivity = Boolean(activeRoom || activeFlash || hasPendingInvites);
      setHasNewClubNotice(hasNoticeOrActivity);

      if (activeRoom) {
        if (activeRoom.status === 'PLAYING') {
          setClubBadge({ text: '대회 진행 중', isPlaying: true });
        } else {
          setClubBadge({ text: '대회 준비 중', isPlaying: false });
        }
      } else if (activeFlash) {
        if (activeFlash.status === 'FULL') {
          setClubBadge({ text: '번개 마감', isPlaying: false });
        } else {
          setClubBadge({ text: '⚡ 번개 모집 중', isPlaying: false });
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
    window.addEventListener('parkon_club_updated', loadData);
    window.addEventListener('parkon_country_changed', loadData);
    window.addEventListener('parkon_member_synced', loadData);
    return () => {
      window.removeEventListener('storage', loadData);
      window.removeEventListener('parkon_profile_updated', loadData);
      window.removeEventListener('parkon_round_completed', loadData);
      window.removeEventListener('parkon_favorite_courses_updated', loadData);
      window.removeEventListener('parkon_club_updated', loadData);
      window.removeEventListener('parkon_country_changed', loadData);
      window.removeEventListener('parkon_member_synced', loadData);
    };
  }, []);

  const handleCountryToggle = (newCountry: 'KR' | 'JP') => {
    ParkOnStorage.setServiceCountry(newCountry);
    setServiceCountryState(newCountry);
    // 사용자가 영어를 선택한 상태라면 언어는 영어로 그대로 유지 (데이터와 언어의 독립성 보장)
    if (language !== 'en') {
      if (newCountry === 'JP') {
        setLanguage('ja');
      } else {
        setLanguage('ko');
      }
    }
  };

  const handleEndActiveRound = () => {
    if (!activeRound) return;
    const courseName = activeRound.courseName || '진행 중인 라운드';
    const confirmMsg = isJapanese
      ? `「${courseName}」ラウンドを終了しますか？\n終了すると進行中バナーが非表示になります。`
      : isEnglish
      ? `End round for "${courseName}"?\nThis will dismiss the ongoing banner.`
      : `「${courseName}」 라운드를 지금 종료(끝내기)하시겠습니까?\n종료 후 홈 화면의 진행 중 배너가 사라집니다.`;

    if (window.confirm(confirmMsg)) {
      const me = (activeRound.players || []).find((p) => p.isSelf) || activeRound.players?.[0];
      const hasScores = Boolean(me && me.scores && Object.keys(me.scores).length > 0 && (me.totalStrokes || 0) > 0);

      if (hasScores && !activeRound.isVirtual) {
        const finishedSession: RoundSession = {
          ...activeRound,
          status: 'COMPLETED',
          completedAt: activeRound.completedAt || new Date().toISOString(),
        };
        ParkOnStorage.saveCompletedRound(finishedSession);
        setCompletedRounds(ParkOnStorage.getCompletedRounds());
      } else {
        ParkOnStorage.clearCurrentRound();
      }

      setActiveRound(null);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('parkon_round_completed'));
    }
  };

  // 기본 구장 알고리즘: 현재 라운드 진행 중인 구장 > 최근 공식 완주 구장 > 지정 홈구장 > 일본/한국 기본 구장
  const getCurrentActiveCourse = (): Course | null => {
    // 1. 현재 라운드 진행 중인 구장
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
    // 4. 폴백: 일본 모드면 홋카이도 마쿠베츠 쓰쓰지가오카, 한국 모드면 동락파크골프장
    const isJp = serviceCountry === 'JP' || isJapanese;
    if (isJp) {
      const jpCourse = courses.find((c) => c.id === 'jp-course-makubetsu-tsutsujigaoka') || courses.find((c) => c.country === 'JP');
      if (jpCourse) return jpCourse;
    }
    const dongrak = courses.find((c) => c.name.includes('동락'));
    return dongrak || courses[0] || null;
  };

  const openStatsModalWithCourse = (
    courseId?: string,
    defaultTab: 'TIMELINE_RANK' | 'PHOTO_ALBUM' | 'MEDALS_COURSES' = 'TIMELINE_RANK'
  ) => {
    const currentActive = getCurrentActiveCourse();
    setStatsCourseId(courseId || currentActive?.id || courses[0]?.id || '');
    setStatsSubTab(defaultTab);
    setShowStatsModal(true);
  };

  const handleOpenWatermarkCardFromPhoto = (photo: ChroniclePhotoItem) => {
    let matched = completedRounds.find((r) => r.id === photo.sessionId) || null;
    if (!matched) {
      matched = {
        id: photo.id,
        courseId: photo.courseId || 'custom',
        courseName: photo.courseName,
        startedAt: photo.date,
        completedAt: photo.date,
        currentHole: 18,
        totalHoles: 18,
        players: [
          {
            id: 'me',
            name: ParkOnStorage.getUserDisplayName(),
            isSelf: true,
            scores: {},
            obCount: {},
            totalStrokes: photo.scoreSummary ? parseInt(photo.scoreSummary) || 58 : 58,
            totalParDiff: -2,
          },
          ...photo.companions
            .filter((c) => c !== ParkOnStorage.getUserDisplayName())
            .map((c, i) => ({
              id: `comp_${i}`,
              name: c,
              scores: {},
              obCount: {},
              totalStrokes: 60,
              totalParDiff: 0,
            })),
        ],
        status: 'COMPLETED',
      };
    }
    setWatermarkCardSession(matched);
    setWatermarkCardInitialImage(photo.imageUrl);
    setShowWatermarkCardModal(true);
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
      const me = (r.players && r.players[0]) || { totalStrokes: (r as any).totalScore || 0, scores: {} };
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
    let skillStarTitle = isJapanese ? '1スター (初級)' : '1스타 (초급)';

    if (avgScore <= 54) {
      rankPercent = 1;
      skillPercent = 100;
      skillStarTitle = isJapanese ? '5スター (マスター)' : '5스타 (마스터)';
    } else if (avgScore <= 58.5) {
      rankPercent = 5;
      skillPercent = 80;
      skillStarTitle = isJapanese ? '4スター (上級)' : '4스타 (상급)';
    } else if (avgScore <= 62.5) {
      rankPercent = 10;
      skillPercent = 60;
      skillStarTitle = isJapanese ? '3スター (中級)' : '3스타 (중급)';
    } else if (avgScore <= 66.5) {
      rankPercent = 25;
      skillPercent = 40;
      skillStarTitle = isJapanese ? '2スター (中初級)' : '2스타 (중초급)';
    } else if (avgScore <= 72.5) {
      rankPercent = 45;
      skillPercent = 20;
      skillStarTitle = isJapanese ? '1スター (初級)' : '1스타 (초급)';
    } else {
      rankPercent = 60;
      skillPercent = 10;
      skillStarTitle = isJapanese ? '0.5スター (入門)' : '0.5스타 (입문)';
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
    if (!hasCompleted || percent <= 0) return isJapanese ? '未反映' : '미반영';
    if (percent >= 100) return isJapanese ? '5スター (マスター)' : '5스타 (마스터)';
    if (percent >= 80) return isJapanese ? '4スター (上級)' : '4스타 (상급)';
    if (percent >= 60) return isJapanese ? '3スター (中級)' : '3스타 (중급)';
    if (percent >= 40) return isJapanese ? '2スター (中初級)' : '2스타 (중초급)';
    return isJapanese ? '1スター (初級)' : '1스타 (초급)';
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
      const p = r.players?.[0] || { totalStrokes: (r as any).totalScore || 0, scores: {} };
      const scoreCount = p ? Object.keys(p.scores || {}).length : 0;
      return (r.totalHoles && r.totalHoles >= 18) || scoreCount >= 18 || (r as any).holes >= 18;
    });

    const round9List = courseRounds.filter((r) => {
      const p = r.players?.[0] || { totalStrokes: (r as any).totalScore || 0, scores: {} };
      const scoreCount = p ? Object.keys(p.scores || {}).length : 0;
      return (r.totalHoles || 9) < 18 && scoreCount < 18 && (p?.totalStrokes || 0) > 0;
    });

    const actualHas18 = round18List.length > 0;

    // 1. 실제 공식 18홀 완주 기록이 있는 경우
    if (actualHas18) {
      let strokeSum18 = 0;
      let minScore18 = 999;
      round18List.forEach((r) => {
        const me = r.players?.[0] || { totalStrokes: (r as any).totalScore || 0 };
        if (me && me.totalStrokes > 0) {
          strokeSum18 += me.totalStrokes;
          if (me.totalStrokes < minScore18) minScore18 = me.totalStrokes;
        }
      });
      const avg18 = Number((strokeSum18 / round18List.length).toFixed(1));
      const best18 = minScore18 === 999 ? avg18 : minScore18;

      let star = isJapanese ? '★★★★ 4スター (上級)' : '★★★★ 4스타 (상급)';
      if (avg18 <= 54) star = isJapanese ? '★★★★★ 5スター (マスター)' : '★★★★★ 5스타 (마스터)';
      else if (avg18 <= 58) star = isJapanese ? '★★★★ 4スター (上級)' : '★★★★ 4스타 (상급)';
      else if (avg18 <= 62) star = isJapanese ? '★★★ 3スター (中級)' : '★★★ 3스타 (중급)';
      else if (avg18 <= 66) star = isJapanese ? '★★ 2スター (中初級)' : '★★ 2스타 (중초급)';
      else if (avg18 <= 72) star = isJapanese ? '★ 1スター (初級)' : '★ 1스타 (초급)';
      else star = isJapanese ? '☆ 一般 (ルーキー)' : '☆ 일반 (루키)';

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
        avgScore9: round9List.length > 0 ? Number((round9List.reduce((acc, cur) => acc + (cur.players?.[0]?.totalStrokes || (cur as any).totalScore || 0), 0) / round9List.length).toFixed(1)) : null,
      };
    }

    // 2. 실제 18홀 완주 기록이 없으나 9홀 기록만 있는 경우
    const has9Only = round9List.length > 0;
    const avg9 = has9Only
      ? Number((round9List.reduce((acc, cur) => acc + (cur.players?.[0]?.totalStrokes || (cur as any).totalScore || 0), 0) / round9List.length).toFixed(1))
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

  // 구장별 실력(최저타수) 1~4등 & 활동(최다완주) 1~4등 랭킹 및 내 순위 산출 (100% 팩트 기반)
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

    // 100% 팩트 기반 Leaderboard100 조회
    const lb = ParkOnStorage.getCourseLeaderboard100(c.id, c.name, userProfile.userName);
    const skillList = lb.skillTop100 || [];
    const actList = lb.activityTop100 || [];

    // 1. 역대 1등(최저 타수 달성 챔피언) 명단 - 100% 실제 데이터
    const bestScore = skillList[0]?.score || (myStats.has18HoleCompleted && myStats.bestScore18 ? myStats.bestScore18 : null);
    const champions1st = bestScore !== null
      ? skillList.filter((it) => it.score === bestScore)
      : [];

    const recordScore = bestScore || 49;

    // 2. 구장별 실력 TOP 4
    const skillTop4 = skillList.slice(0, 4).map((cItem) => ({
      rank: cItem.rank,
      rankLabel: cItem.rankLabel,
      name: cItem.name,
      score: cItem.score,
      grade: cItem.grade,
      date: cItem.date,
      isMe: !!cItem.isMe,
    }));

    // 나의 실력 순위 판정
    let mySkillRank: {
      rank: number;
      score: number;
      rankLabel: string;
      isTop4: boolean;
    } | null = null;

    if (lb.userSkillStatus.hasOfficialMatch && lb.userSkillStatus.officialRank !== null && lb.userSkillStatus.officialScore !== null) {
      mySkillRank = {
        rank: lb.userSkillStatus.officialRank,
        score: lb.userSkillStatus.officialScore,
        rankLabel: `${lb.userSkillStatus.officialRank}위 (공인)`,
        isTop4: lb.userSkillStatus.officialRank <= 4,
      };
    } else if (lb.userSkillStatus.hasCasualRound && lb.userSkillStatus.casualScore !== null) {
      mySkillRank = {
        rank: lb.userSkillStatus.casualRankEquivalent || 1,
        score: lb.userSkillStatus.casualScore,
        rankLabel: `등외 (친선 ${lb.userSkillStatus.casualScore}타)`,
        isTop4: false,
      };
    }

    // 3. 구장별 활동 TOP 4
    const activityTop4 = actList.slice(0, 4).map((p) => ({
      rank: p.rank,
      name: p.name,
      rounds: p.rounds,
      tier: p.tier,
      isMe: !!p.isMe,
    }));

    // 나의 활동 순위 판정
    let myActivityRank: {
      rank: number;
      rounds: number;
      rankLabel: string;
      isTop4: boolean;
    } | null = null;

    if (lb.userActivityStatus.roundsCount30Days > 0) {
      myActivityRank = {
        rank: lb.userActivityStatus.rank,
        rounds: lb.userActivityStatus.roundsCount30Days,
        rankLabel: `${lb.userActivityStatus.rank}위`,
        isTop4: lb.userActivityStatus.rank <= 4,
      };
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
        onOpenInstallGuide={handleAppInstallClick}
      />

      {/* -2. 파키의 파크골프 웹툰북 & 룰 Q&A 모달 */}
      <RulesWebtoonModal
        isOpen={showRulesWebtoonModal}
        onClose={() => setShowRulesWebtoonModal(false)}
        isJp={isJapanese}
      />

      {/* -2.3. 파키(PARKY) 앱 3대 채널(카톡, 라인, URL) 추천 공유 모달 */}
      <AppShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
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

      {/* 0-1. 대표님 지침: 현장 100m 정밀 GPS 2버튼 웰컴 배너 (바로 라운드 시작 vs 홈으로 돌아가기) */}
      <AutoLocationBanner
        courses={courses}
        onStartGame={(courseId) => {
          router.push(`/round/new?courseId=${courseId}`);
        }}
      />


      {/* 1. In-Progress Round Banner (이어하기 & 끝내기) */}
      {mounted && activeRound && (() => {
        const activeCourse = courses.find((c) => c.id === activeRound.courseId) || activeRound.courseName;
        const dual = getCourseDualName(activeCourse, isJapanese);

        return (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-stone-950 py-2.5 px-3.5 rounded-xl shadow-md flex items-center justify-between border border-amber-300">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/95 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
                <Flame className="w-4 h-4 fill-amber-500 text-amber-600" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-black text-amber-950/90 flex items-center gap-1.5 leading-tight">
                  <span>{isJapanese ? '進行中のラウンド' : isEnglish ? 'Ongoing Round' : '진행 중인 라운드'}</span>
                </div>
                <div className="font-black text-sm text-stone-950 leading-tight truncate flex items-center gap-1">
                  {dual.flag && <span>{dual.flag}</span>}
                  <span className="truncate">{dual.primary}</span>
                </div>
                {dual.showSecondary && dual.secondary && (
                  <div className="text-[10px] font-bold text-amber-950/80 leading-none truncate mt-0.5">
                    {dual.secondary}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 ml-2">
              <button
                type="button"
                onClick={handleEndActiveRound}
                className="bg-white/95 hover:bg-white text-stone-800 hover:text-rose-700 font-black px-2.5 py-1.5 rounded-lg text-xs shadow-xs transition active:scale-95 flex items-center gap-1 border border-amber-300/80 cursor-pointer"
                title={isJapanese ? 'ラウンドを終了する' : '라운드 끝내기'}
              >
                <span>{isJapanese ? '終了' : isEnglish ? 'End' : '끝내기'}</span>
              </button>
              <Link
                href={`/round/${activeRound.id}`}
                className="bg-stone-900 hover:bg-stone-800 text-amber-300 font-black px-3 py-1.5 rounded-lg text-xs shadow-md transition active:scale-95 flex items-center gap-1 border border-stone-800 cursor-pointer"
              >
                <span>{isJapanese ? '再開' : isEnglish ? 'Resume' : '이어하기'}</span>
                <span className="text-[10px]">▶</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* 2. Zero-Second Quick Start (홈구장 0초 시작 & 복수 홈구장 탭 전환) */}
      <section className="bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-3xl p-5 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-emerald-700/40 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          {/* 상단: 전국 구장 검색 & 내 홈구장 선택 2개 버튼 */}
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/courses"
              className="bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-amber-300" />
              <span>{isJapanese ? '全国コース検索' : isEnglish ? 'Search Courses' : '전국 구장 검색'}</span>
            </Link>

            {/* 내 홈구장 선택 버튼 */}
            <button
              type="button"
              onClick={() => setShowHomeModal(true)}
              className="bg-emerald-700/90 hover:bg-emerald-600 border border-emerald-400/50 text-white text-xs font-black px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
            >
              <span>{isJapanese ? 'マイホームコース選択' : isEnglish ? 'Select Home' : '내 홈구장 선택'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-amber-300" />
            </button>
          </div>

          {/* 대표님 지침 UX: 군더더기 예시 제거 및 '검색' 심플 버튼 */}
          {!homeCourse ? (
            <div
              onClick={() => setShowHomeModal(true)}
              className="w-full bg-white text-stone-900 rounded-2xl px-3.5 py-3 shadow-md flex items-center justify-between cursor-pointer hover:bg-stone-50 border-2 border-amber-400 transition active:scale-[0.99] group"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <Search className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
                </div>
                <div className="flex items-center text-left min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-black text-stone-700 group-hover:text-emerald-700 transition truncate">
                    {isJapanese
                      ? 'コース名・地名を入力してください'
                      : '지명이나 골프장 이름을 입력하세요'}
                  </span>
                </div>
              </div>
              <span className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3.5 py-1.5 rounded-xl shadow-xs shrink-0 ml-2">
                {isJapanese ? '検索' : '검색'}
              </span>
            </div>
          ) : (
            (() => {
              const dual = getCourseDualName(homeCourse, isJapanese);
              return (
                <div
                  onClick={() => setShowHomeModal(true)}
                  className="w-full bg-white text-stone-900 rounded-2xl px-4 py-2.5 shadow-md flex items-center justify-between cursor-pointer hover:bg-stone-50 transition active:scale-[0.99] border border-stone-200"
                >
                  <div className="flex flex-col min-w-0 pr-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-base sm:text-lg font-black text-stone-950 tracking-tight truncate flex items-center gap-1.5" suppressHydrationWarning>
                        {dual.flag && <span>{dual.flag}</span>}
                        <span>{dual.primary}</span>
                      </span>
                    </div>
                    {dual.showSecondary && dual.secondary && (
                      <div className="text-xs font-bold text-stone-500 truncate mt-0.5" suppressHydrationWarning>
                        {dual.secondary}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-700 text-xs font-black shrink-0">
                    <span>{isJapanese ? '変更' : '변경'}</span>
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              );
            })()
          )}

          {/* 대표님 지침 UX: 2분할 버튼 [오늘 구장 상태 확인] vs [스코어 기록 시작하기] */}
          <div className="pt-1">
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
              {/* 왼쪽: 🌿 오늘 구장 상태 확인 (실시간 잔디·날씨·휴장) */}
              {(() => {
                const targetCourse = homeCourse || getCurrentActiveCourse() || courses[0];
                const rawName = targetCourse?.name || '골프장';
                const shortName = rawName.replace('파크골프장', '').replace('파크골프', '').trim();
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (!homeCourse) {
                        setShowHomeModal(true);
                      } else {
                        setShowCourseTodayModal(true);
                      }
                    }}
                    className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-stone-950 font-black p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition active:scale-[0.97] cursor-pointer border-2 border-amber-300 group"
                  >
                    <div className="flex items-center gap-1.5 text-sm sm:text-base font-black leading-tight">
                      <span className="text-base sm:text-lg">🌿</span>
                      <span className="truncate">
                        {isJapanese
                          ? (homeCourse ? `本日 ${shortName} 状況` : '本日コース状況')
                          : (homeCourse ? `오늘 ${shortName} 상태` : '오늘 구장 상태')}
                      </span>
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] font-extrabold text-stone-900 bg-white/40 px-2 py-0.5 rounded-full whitespace-nowrap truncate max-w-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                      <span>{isJapanese ? 'リアルタイム天気·芝生' : '실시간 잔디·날씨 확인'}</span>
                    </span>
                  </button>
                );
              })()}

              {/* 오른쪽: 라운딩 바로 시작하기 (실전 정식 기록) */}
              {(() => {
                const targetCourse = homeCourse || getCurrentActiveCourse() || courses[0];
                const courseId = targetCourse?.id || 'course_1';
                const courseShortName = (targetCourse?.name || '구미 동락').replace('파크골프장', '').replace('파크골프', '').trim();
                return (
                  <Link
                    href={`/round/new?courseId=${courseId}`}
                    className="bg-gradient-to-br from-emerald-400 to-emerald-500 hover:from-emerald-300 hover:to-emerald-400 text-emerald-950 font-black p-3 sm:p-4 rounded-2xl shadow-lg flex flex-col items-center justify-center gap-1 transition active:scale-[0.97] border-2 border-emerald-300 group cursor-pointer"
                  >
                    <div className="flex items-center gap-1 text-sm sm:text-base font-black leading-tight">
                      <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-emerald-950" />
                      <span className="truncate">{isJapanese ? 'スコア記録スタート' : isEnglish ? 'Start Score Record' : '스코어 기록 시작하기'}</span>
                    </div>
                    <span className="text-[10px] sm:text-[10.5px] font-extrabold text-emerald-950 bg-white/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {homeCourse
                        ? (isJapanese ? '公式スコアボード保存' : isEnglish ? 'Official Scoreboard' : '공식 스코어보드 저장')
                        : (isJapanese ? `${courseShortName} で即開始` : `${courseShortName} 바로 시작`)}
                    </span>
                  </Link>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Quick Actions (슬림형 컴팩트 탭) */}
      <section className="grid grid-cols-2 gap-2.5">
        {/* 좌측: 나의 파크골프 연대기 (슬림형) */}
        <button
          type="button"
          onClick={() => openStatsModalWithCourse(homeCourse?.id)}
          className="bg-gradient-to-br from-white via-amber-50/40 to-amber-100/50 p-3 rounded-2xl border-2 border-amber-400/90 hover:border-amber-500 shadow-xs hover:shadow-sm transition text-left group flex flex-col justify-between active:scale-[0.98] cursor-pointer"
        >
          {/* 상단: 타이틀 */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-md bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-2xs">
                🏆
              </span>
              <span className="text-[11px] sm:text-xs font-black text-stone-900 group-hover:text-amber-800 transition whitespace-nowrap">
                {isJapanese ? 'マイ パークゴルフ年代記' : isEnglish ? 'My Golf Chronicle' : '나의 파크골프 연대기'}
              </span>
            </div>
          </div>

          {/* 중앙: 별 5개 게이지 + 스타 등급 + 전국 상위 % */}
          <div className="my-2 bg-white/95 rounded-xl p-2 border border-amber-200/90 shadow-2xs flex items-center justify-between">
            <div className="space-y-0.5">
              {renderExperienceStars(userExpStats.hasCompleted ? userExpPercent : 0, 'text-xs')}
              <div className="text-[11px] font-black text-stone-900 truncate">
                {userExpStats.hasCompleted
                  ? userExpStats.skillStarTitle
                  : (isJapanese ? '算出待ち' : isEnglish ? 'Pending' : '산출 대기')}
              </div>
            </div>
            <span className="text-[10px] font-black text-amber-950 bg-amber-400/90 px-1.5 py-0.5 rounded shadow-2xs">
              {userExpStats.hasCompleted
                ? (isJapanese ? `上位 ${userExpStats.rankPercent}%` : `상위 ${userExpStats.rankPercent}%`)
                : (isJapanese ? '完走時' : isEnglish ? 'After Round' : '완주 시')}
            </span>
          </div>

          {/* 하단 화살표 링크 */}
          <div className="flex items-center justify-between text-[10px] font-black text-emerald-800 pt-0.5 border-t border-amber-200/60">
            <span>{isJapanese ? 'ランキング・全国制覇' : isEnglish ? 'Rankings · Tour' : '랭킹 · 전국도장깨기'}</span>
            <span className="text-emerald-700 font-black">{isJapanese ? '見る ▶' : isEnglish ? 'View ▶' : '보기 ▶'}</span>
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
              <span className="text-xs font-black text-stone-900 group-hover:text-purple-700 transition whitespace-nowrap">
                {isJapanese ? 'クラブ＆大会センター' : isEnglish ? 'Club & Tournaments' : '클럽 & 대회 센터'}
              </span>
            </div>
            {hasNewClubNotice && (
              <span
                className="inline-flex items-center justify-center w-4 h-4 text-[9px] font-black text-white bg-red-600 rounded-full shadow-xs animate-pulse ring-2 ring-red-200 shrink-0"
                title="새로운 번개·대회·공지 등록됨"
              >
                N
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
                {isJapanese ? 'クラブ管理＆大会開設' : isEnglish ? 'Clubs & Tournaments' : '클럽 관리 & 대회 개설'}
              </div>
              <div className="text-[9.5px] text-stone-500 font-medium truncate">
                {isJapanese ? '新ペリア・ショットガン' : isEnglish ? 'Peoria & Shotgun' : '신페리오 · 샷건 전광판'}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] font-black text-purple-800 pt-0.5 border-t border-stone-100">
            <span>{isJapanese ? 'クラブ・大会運営' : isEnglish ? 'Club Operations' : '클럽·대회 운영'}</span>
            <span className="text-purple-700 font-black">{isJapanese ? '移動 ▶' : isEnglish ? 'Go ▶' : '바로가기 ▶'}</span>
          </div>
        </Link>
      </section>

      {/* 🍲 [대표님 신규 기능]: 전국 400개 구장 동호인 찐 맛집 총람 섹션 */}
      <Link
        href="/restaurants"
        className="block bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white rounded-3xl p-4 shadow-md border-2 border-amber-300 hover:border-yellow-200 transition active:scale-[0.99] cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-2xl bg-white text-stone-950 flex items-center justify-center text-2xl shadow-md shrink-0 group-hover:scale-105 transition-transform">
              🍲
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-stone-950 text-amber-300 px-2 py-0.5 rounded-full">
                  동호인 검증 100%
                </span>
                <span className="text-xs text-amber-100 font-bold">뒤풀이 · 반주</span>
              </div>
              <h3 className="font-black text-base sm:text-lg text-white leading-tight mt-0.5">
                {isJapanese ? '全国パークゴルフ場 厳選グルメ' : '전국 400개 구장 동호인 찐 맛집 총람'}
              </h3>
              <p className="text-[11.5px] text-amber-100 font-semibold mt-0.5">
                {isJapanese
                  ? '大型駐車場・個室・スピード提供・マッコリ反省会グルメ'
                  : '대형주차 · 단체룸 · 5분컷 · 막걸리 반주 맛집 모아보기'}
              </p>
            </div>
          </div>
          <span className="shrink-0 bg-stone-950 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-black shadow-sm group-hover:bg-stone-900 transition flex items-center gap-1">
            <span>{isJapanese ? '一覧' : '피드 보기'}</span>
            <span>▶</span>
          </span>
        </div>
      </Link>

      {/* 4-1. 배너 1: 천기성 사주 오늘의 무료 사주 보러 가기 제휴 배너 */}
      <a
        href={isJapanese ? "https://cheongiseong.com?lang=ja" : "https://cheongiseong.com"}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (typeof window !== 'undefined' && window.innerWidth > 640) {
            e.preventDefault();
            const width = 440;
            const height = 900;
            const left = Math.max(0, Math.round((window.screen.width - width) / 2));
            const top = Math.max(0, Math.round((window.screen.height - height) / 2));
            const targetUrl = isJapanese ? 'https://cheongiseong.com?lang=ja' : 'https://cheongiseong.com';
            window.open(
              targetUrl,
              'CheongiseongSajuApp',
              `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
            );
          }
        }}
        className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white rounded-2xl p-3 shadow-sm border border-emerald-600/60 hover:border-emerald-400 transition active:scale-[0.99] cursor-pointer flex items-center justify-between gap-3 group"
        title={isJapanese ? "本日のゴルフ開運・無料運勢を見る" : "천기성 사주 - 오늘의 무료 운세 보러 가기"}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-xs border border-amber-300 shrink-0 bg-stone-100 group-hover:scale-105 transition-transform">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_31.jpg"
              alt={isJapanese ? "本日のゴルフ運勢" : "천기성 사주 오늘의 무료 운세"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9.5px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 px-2 py-0.5 rounded shadow-2xs tracking-tight">
                {isJapanese ? '開運・運勢' : isEnglish ? 'Daily Fortune' : '천기성 사주'}
              </span>
            </div>
            <div className="text-[12.5px] sm:text-[13.5px] font-black text-white tracking-tight flex items-center gap-1 mt-0.5">
              <span>{isJapanese ? '本日の' : '오늘의'}</span>
              <span className="animate-free-sparkle px-0.5 text-yellow-300 font-black text-[13px] sm:text-[14px]">
                {isJapanese ? '無料' : isEnglish ? 'Free' : '무료'}
              </span>
              <span>{isJapanese ? '運勢・相性チェック' : isEnglish ? 'Fortune & Match' : '운세 보기'}</span>
            </div>
          </div>
        </div>
        <span className="flex items-center gap-1.5 shrink-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-stone-950 px-3 py-1.5 rounded-xl text-[11px] font-black border border-yellow-200 shadow-md animate-pulse-glow whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
          </span>
          <span>{isJapanese ? '運勢を見る' : isEnglish ? 'Check' : '운세 보기'}</span>
          <span className="text-[11px] font-black animate-arrow-slide">▶</span>
        </span>
      </a>

      {/* 4-2. 파크골프 올인원 소개하기 & 바탕화면 추가 2대 핵심 액션 버튼 세트 */}
      <div className="pt-0.5 space-y-2">
        {/* ① 파키(PARKY) 앱 추천하기 (카톡·라인·URL 공유 모달 연동) */}
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="w-full py-3 px-4 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.99] border-2 border-amber-500 text-stone-950 rounded-2xl text-xs sm:text-sm font-black shadow-md flex items-center justify-between gap-2 transition cursor-pointer group"
          title={isJapanese ? 'PARKY アプリを推薦する' : isEnglish ? 'Recommend PARKY App' : '파키(PARKY) 앱 추천하기'}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-xl bg-white/90 text-stone-950 flex items-center justify-center text-xs sm:text-sm font-black shrink-0 shadow-2xs border border-amber-400">
              📢
            </span>
            <span className="text-xs sm:text-sm font-black text-stone-950 truncate">
              {isJapanese ? (
                <>PARKY アプリを推薦する</>
              ) : isEnglish ? (
                <>Recommend PARKY App</>
              ) : (
                <>파키(PARKY) 앱 추천하기</>
              )}
            </span>
          </div>
          <span className="shrink-0 flex items-center gap-1 text-[11px] sm:text-xs font-black text-amber-950 bg-white/80 group-hover:bg-white px-2.5 py-1 rounded-xl border border-amber-400/80 transition">
            <span>{isJapanese ? '推薦' : '추천'}</span>
            <span>▶</span>
          </span>
        </button>

        {/* ② 글로벌 언어 선택 바 (한국어 / 日本語 / English) */}
        <div className="w-full bg-stone-100 p-1 rounded-2xl border-2 border-stone-800 grid grid-cols-3 gap-1 shadow-xs">
          <button
            type="button"
            onClick={() => setLanguage('ko')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              language === 'ko'
                ? 'bg-stone-900 text-amber-300 shadow-md scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-stone-700'
            }`}
          >
            <span>🇰🇷</span>
            <span>한국어</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('ja')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              language === 'ja'
                ? 'bg-stone-900 text-amber-300 shadow-md scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-stone-700'
            }`}
          >
            <span>🇯🇵</span>
            <span>日本語</span>
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`py-2 px-1 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              language === 'en'
                ? 'bg-stone-900 text-amber-300 shadow-md scale-[1.02]'
                : 'bg-white/80 hover:bg-white text-stone-700'
            }`}
          >
            <span>🇺🇸</span>
            <span>English</span>
          </button>
        </div>

        {/* 서비스 대상 지역 / 구장 모드 선택 (🇰🇷 한국 구장 vs 🇯🇵 日本 コース & 仮想GPS) */}
        <div className="bg-stone-50 border-2 border-stone-200 rounded-2xl p-2.5 flex items-center justify-between gap-2 shadow-xs mt-2">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm">🌏</span>
            <span className="text-xs font-black text-stone-800 whitespace-nowrap">
              {isJapanese ? 'コース対象地域' : '서비스 대상 구장'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 w-full max-w-[210px]">
            <button
              type="button"
              onClick={() => handleCountryToggle('KR')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 border ${
                serviceCountry === 'KR'
                  ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>🇰🇷</span>
              <span>{isJapanese ? '韓国' : '한국'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleCountryToggle('JP')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1 border ${
                serviceCountry === 'JP'
                  ? 'bg-rose-700 text-white border-rose-800 shadow-xs ring-2 ring-rose-400'
                  : 'bg-white text-stone-700 border-stone-300 hover:bg-stone-100'
              }`}
            >
              <span>🇯🇵</span>
              <span>日本</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4.6. 1촌 실시간 응원 피드 위젯 */}
      <CompanionFeedWidget />



      {/* 7. [통합] 나의 파크골프 연대기 & 성적 종합 리포트 모달 (2대 서브 탭 탑재) */}
      {showStatsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-stone-100">
            {/* 고정 헤더: 스크롤을 아무리 내려도 항상 상단에 고정되어 바로 닫을 수 있음 */}
            <div className="flex items-center justify-between border-b border-stone-100 p-3.5 sm:p-4 shrink-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shadow-sm shrink-0">
                  🏆
                </span>
                <div>
                  <h3 className="text-base font-black text-stone-900 leading-tight">
                    {isJapanese ? 'マイ パークゴルフ年代記' : isEnglish ? 'My Golf Chronicle' : '나의 파크골프 연대기'}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {isJapanese
                      ? '競技タイムライン・フォトアルバム・獲得メダル・訪問コース'
                      : '경기 타임라인 · 포토 앨범 · 기념 메달 · 방문 구장'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowChronicleBackupModal(true)}
                  className="px-2.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center gap-1 text-xs font-bold transition cursor-pointer border border-stone-200 shadow-2xs"
                  title={isJapanese ? 'バックアップ / 復元' : '백업 / 복원'}
                >
                  <span className="text-xs">💾</span>
                  <span className="text-[11px] font-bold">{isJapanese ? 'バックアップ' : '백업/복원'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowStatsModal(false)}
                  className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-800 flex items-center justify-center font-bold text-sm cursor-pointer shrink-0 transition"
                  aria-label={isJapanese ? '閉じる' : '닫기'}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 고대비 3대 서브 탭 바 */}
            <div className="flex items-center bg-stone-100 p-1.5 border-b border-stone-200 shrink-0 gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={() => setStatsSubTab('TIMELINE_RANK')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                  statsSubTab === 'TIMELINE_RANK'
                    ? 'bg-white text-emerald-950 shadow-xs border border-emerald-500/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm">⏱️</span>
                <span>{isJapanese ? 'タイムライン' : '타임라인'}</span>
              </button>
              <button
                type="button"
                onClick={() => setStatsSubTab('PHOTO_ALBUM')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                  statsSubTab === 'PHOTO_ALBUM'
                    ? 'bg-white text-emerald-950 shadow-xs border border-emerald-500/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm">📷</span>
                <span>{isJapanese ? 'アルバム' : '포토 앨범'}</span>
                {chroniclePhotos.length > 0 && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">
                    {chroniclePhotos.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStatsSubTab('MEDALS_COURSES')}
                className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer ${
                  statsSubTab === 'MEDALS_COURSES'
                    ? 'bg-white text-amber-950 shadow-xs border border-amber-500/40'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/60'
                }`}
              >
                <span className="text-sm">🏅</span>
                <span>{isJapanese ? 'コース＆メダル' : '구장 & 메달'}</span>
              </button>
            </div>

            {/* 스크롤 가능한 본문 영역 */}
            <div className="p-4 space-y-4 overflow-y-auto flex-1 overscroll-contain">
              {/* ======================= [탭 1: ⏱️ 나의 경기 타임라인 & 등급] ======================= */}
              {statsSubTab === 'TIMELINE_RANK' && (
                <div className="space-y-3">
                  {/* 1. 컴팩트 나의 공인 등급 & 실력 요약 바 (클릭 시 전용 팝업창 호출, 대표님 지침) */}
                  <div className="bg-gradient-to-r from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setShowGradePopup(true)}
                      className="w-full p-3 flex items-center justify-between transition cursor-pointer text-left active:bg-amber-100/90"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xl shrink-0">🎯</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-amber-950">
                              {userExpStats.hasCompleted ? userExpStats.skillStarTitle : (isJapanese ? '未判定' : '공인 등급')}
                            </span>
                            <span className="text-amber-500 font-bold text-xs inline-flex">
                              {renderExperienceStars(userExpStats.hasCompleted ? userExpPercent : 0, 'text-xs')}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-900/80 font-bold mt-0.5 truncate">
                            {userExpStats.hasCompleted
                              ? `${isJapanese ? '18H平均' : '18홀 평균'} ${userExpStats.avgScore}${isJapanese ? '打' : '타'} (${userExpStats.parDiffText}) · ${isJapanese ? `上位 ${userExpStats.rankPercent}%` : `상위 ${userExpStats.rankPercent}%`}`
                              : (isJapanese ? 'ラウンド完走時に等級・打数が自動反映されます' : '라운드 완주 시 공인 등급과 평균 타수가 자동 반영됩니다')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-black text-amber-900 bg-white/90 px-2.5 py-1 rounded-xl shrink-0 border border-amber-300/80 shadow-2xs ml-1">
                        <span>{isJapanese ? '等級詳細 ❯' : '나의 등급 상세 ❯'}</span>
                      </div>
                    </button>
                  </div>

                  {/* 2. 타수별 달성 횟수 히스토그램 (내 타수 분포 실록) */}
                  {completedRounds.length > 0 && (() => {
                    const meOf = (r: RoundSession) => {
                      return (r.players && r.players.length > 0)
                        ? (r.players.find((p) => p.isSelf) || r.players[0])
                        : ({ id: 'me', name: '나', totalStrokes: (r as any).totalScore || 54, totalParDiff: 0, scores: {}, obCount: {} } as any);
                    };

                    const buckets = [
                      { id: '40s', name: isJapanese ? '40台 (奇跡)' : '45~49타 (기적)', range: '45~49', min: 40, max: 49, color: 'bg-amber-500' },
                      { id: '54', name: isJapanese ? '54打 (不滅ラベ)' : '54타 (라베)', range: '54', min: 54, max: 54, color: 'bg-emerald-600' },
                      { id: '55', name: isJapanese ? '55打' : '55타', range: '55', min: 55, max: 55, color: 'bg-emerald-500' },
                      { id: '56', name: isJapanese ? '56打' : '56타', range: '56', min: 56, max: 56, color: 'bg-teal-500' },
                      { id: '57', name: isJapanese ? '57打' : '57타', range: '57', min: 57, max: 57, color: 'bg-teal-600' },
                      { id: '58', name: isJapanese ? '58打' : '58타', range: '58', min: 58, max: 58, color: 'bg-blue-500' },
                      { id: '59', name: isJapanese ? '59打' : '59타', range: '59', min: 59, max: 59, color: 'bg-indigo-500' },
                      { id: '60_62', name: isJapanese ? '60~62打 (主力)' : '60~62타 (주력)', range: '60~62', min: 60, max: 62, color: 'bg-stone-500' },
                      { id: '63_65', name: isJapanese ? '63~65打' : '63~65타', range: '63~65', min: 63, max: 65, color: 'bg-stone-400' },
                      { id: '66_plus', name: isJapanese ? '66打〜' : '66타 이상', range: '66+', min: 66, max: 999, color: 'bg-stone-300' },
                    ].map((b) => {
                      const matches = completedRounds.filter((r) => {
                        const s = meOf(r).totalStrokes || 0;
                        return s >= b.min && s <= b.max;
                      });
                      return {
                        ...b,
                        count: matches.length,
                        rounds: matches,
                      };
                    });

                    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
                    const selectedBucket = buckets.find((b) => b.id === selectedHistogramScore);

                    return (
                      <div className="bg-white border border-stone-200/90 rounded-2xl p-3 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm">📊</span>
                            <span className="text-xs font-black text-stone-900">
                              {isJapanese ? '打数別 達成回数ヒストグラム (分布実録)' : '타수별 달성 횟수 히스토그램 (내 타수 실록)'}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 font-bold">
                            {isJapanese ? '棒タップで記録展開' : '막대 터치 시 해당 경기 펼침'}
                          </span>
                        </div>

                        {/* 막대 그래프 수평/수직 스크롤 뷰 */}
                        <div className="flex items-end gap-1.5 h-24 pt-4 px-1 overflow-x-auto">
                          {buckets.map((b) => {
                            const isSelected = selectedHistogramScore === b.id;
                            const heightPercent = Math.max(12, Math.round((b.count / maxCount) * 100));
                            return (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => setSelectedHistogramScore(isSelected ? null : b.id)}
                                className={`flex-1 min-w-[28px] max-w-[42px] flex flex-col items-center justify-end h-full group cursor-pointer transition select-none ${
                                  isSelected ? 'scale-105' : 'hover:opacity-90'
                                }`}
                                title={`${b.name}: ${b.count}회`}
                              >
                                <span className={`text-[9.5px] font-black mb-1 leading-none ${
                                  isSelected ? 'text-amber-600 scale-110 font-black' : b.count > 0 ? 'text-stone-700' : 'text-stone-300'
                                }`}>
                                  {b.count}
                                </span>
                                <div
                                  className={`w-full rounded-t-lg transition-all duration-300 ${b.color} ${
                                    isSelected
                                      ? 'ring-2 ring-amber-400 shadow-md brightness-110'
                                      : b.count === 0 ? 'opacity-25' : 'shadow-2xs'
                                  }`}
                                  style={{ height: `${heightPercent}%` }}
                                />
                                <span className={`text-[8.5px] font-bold mt-1 leading-none truncate w-full text-center ${
                                  isSelected ? 'text-amber-900 font-black' : 'text-stone-500'
                                }`}>
                                  {b.range}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* 선택된 타수대의 라운드 목록 펼침 아코디언 */}
                        {selectedBucket && (
                          <div className="pt-2 border-t border-stone-100 animate-in fade-in space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-black text-stone-800">
                              <span className="flex items-center gap-1 text-emerald-800">
                                <span>🎯</span>
                                <span>{selectedBucket.name} ({selectedBucket.count}회 기록)</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setSelectedHistogramScore(null)}
                                className="text-[10px] text-stone-400 hover:text-stone-600 font-bold"
                              >
                                ✕ {isJapanese ? '閉じる' : '접기'}
                              </button>
                            </div>
                            {selectedBucket.rounds.length > 0 ? (
                              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-0.5">
                                {selectedBucket.rounds.map((r, idx) => {
                                  const me = meOf(r);
                                  const dStr = r.completedAt ? r.completedAt.slice(0, 10) : '';
                                  return (
                                    <div
                                      key={r.id || idx}
                                      onClick={() => setSelectedRoundForPopup(r)}
                                      className="p-2 bg-stone-50 hover:bg-emerald-50 rounded-xl border border-stone-200/80 flex items-center justify-between cursor-pointer transition text-xs shadow-2xs"
                                    >
                                      <div className="min-w-0">
                                        <div className="font-black text-stone-900 truncate">
                                          ⛳ {r.courseName}
                                        </div>
                                        <div className="text-[10.5px] text-stone-500 font-medium">
                                          {dStr} · {r.totalHoles || 18}H
                                        </div>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <div className="font-black text-emerald-700">
                                          {me.totalStrokes}타
                                        </div>
                                        <div className="text-[9.5px] text-stone-400 font-bold">
                                          {isJapanese ? 'スコア詳細 ❯' : '스코어카드 ❯'}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-[11px] text-stone-400 text-center py-2">
                                {isJapanese ? '該当する打数の競技がありません' : '해당 타수의 경기 기록이 없습니다'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 3. 타임라인 정렬 칩 [최신순 vs 라베순] & 구장 필터 드롭다운 */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex bg-stone-100 p-0.5 rounded-xl border border-stone-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setTimelineSort('LATEST')}
                        className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 ${
                          timelineSort === 'LATEST'
                            ? 'bg-white text-stone-900 shadow-2xs border border-stone-300'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span>⏱️</span>
                        <span>{isJapanese ? '最新順' : '최신 경기순'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineSort('BEST_SCORE')}
                        className={`px-2.5 py-1 rounded-lg font-black transition cursor-pointer flex items-center gap-1 ${
                          timelineSort === 'BEST_SCORE'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-2xs font-black'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span>🏆</span>
                        <span>{isJapanese ? '生涯ベスト(ラベ)順' : '역대 최저타수순 (라베순)'}</span>
                      </button>
                    </div>

                    {/* 구장 필터 드롭다운 */}
                    {completedRounds.length > 0 && (() => {
                      const uniqueCourses = Array.from(new Set(completedRounds.map((r) => r.courseName).filter(Boolean)));
                      return (
                        <div className="relative">
                          <select
                            value={timelineCourseFilter}
                            onChange={(e) => setTimelineCourseFilter(e.target.value)}
                            className="text-[11px] font-bold bg-white border border-stone-200 rounded-xl px-2.5 py-1.5 pr-6 text-stone-800 shadow-2xs focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer truncate max-w-[140px]"
                          >
                            <option value="ALL">
                              {isJapanese ? '⛳ 全コース' : '⛳ 전체 구장'}
                            </option>
                            {uniqueCourses.map((cName) => (
                              <option key={cName} value={cName}>
                                ⛳ {cName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-3 h-3 text-stone-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      );
                    })()}
                  </div>

                  {/* 4. 날짜별 한 줄 카드 목록 */}
                  {(() => {
                    const meOf = (r: RoundSession) => {
                      return (r.players && r.players.length > 0)
                        ? (r.players.find((p) => p.isSelf) || r.players[0])
                        : ({ id: 'me', name: '나', totalStrokes: (r as any).totalScore || 54, totalParDiff: 0, scores: {}, obCount: {} } as any);
                    };

                    let displayedRounds = [...completedRounds];
                    if (timelineCourseFilter !== 'ALL') {
                      displayedRounds = displayedRounds.filter((r) => r.courseName === timelineCourseFilter);
                    }

                    if (timelineSort === 'BEST_SCORE') {
                      displayedRounds.sort((a, b) => {
                        const aScore = meOf(a).totalStrokes || 999;
                        const bScore = meOf(b).totalStrokes || 999;
                        if (aScore !== bScore) return aScore - bScore;
                        return new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime();
                      });
                    } else {
                      displayedRounds.sort((a, b) => new Date(b.completedAt || 0).getTime() - new Date(a.completedAt || 0).getTime());
                    }

                    if (displayedRounds.length === 0) {
                      return (
                        <div className="bg-stone-50 rounded-2xl p-6 text-center border border-stone-200 space-y-2">
                          <div className="text-3xl">⛳</div>
                          <div className="font-black text-sm text-stone-800">
                            {completedRounds.length > 0
                              ? (isJapanese ? '該当するコースの記録がありません' : '해당 구장의 경기 타임라인이 없습니다')
                              : (isJapanese ? 'まだ完了した競技記録がありません' : '아직 기록된 경기 타임라인이 없습니다')}
                          </div>
                          <p className="text-xs text-stone-500 leading-relaxed">
                            {isJapanese
                              ? 'ラウンドを完了すると、あなたの全競技記録がタイムライン順に1行ずつ自動保存されます。'
                              : '라운드를 완료하시면 내가 플레이한 경기 기록이 시간 순서대로 한 줄씩 타임라인에 안전하게 보관됩니다.'}
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2">
                        {displayedRounds.map((r, rIdx) => {
                          const me = (r.players && r.players.length > 0)
                            ? (r.players.find((p) => p.isSelf) || r.players[0])
                            : ({ id: 'me', name: '나', totalStrokes: (r as any).totalScore || 54, totalParDiff: 0, scores: {}, obCount: {} } as any);
                          const sortedPlayers = [...(r.players || [])].sort((a, b) => (a.totalStrokes || 0) - (b.totalStrokes || 0));
                          const myRank = sortedPlayers.findIndex((p) => p.id === me?.id || p.name === me?.name) + 1 || 1;
                          const is18Holes = (r.totalHoles && r.totalHoles >= 18) || Object.keys(me?.scores || {}).length >= 18 || (r as any).holes >= 18;
                          const isOfficial = r.isOfficial !== false;
                          const sessionPhotos = chroniclePhotos.filter((p) => p.sessionId === r.id);
                          const combinedPhotosCount = Math.max(sessionPhotos.length, r.photos?.length || 0);
                          const hasPhotos = combinedPhotosCount > 0;

                          // 날짜 포맷 (한 줄에 최적화: 2026.10.02 (금))
                          const dObj = r.completedAt ? new Date(r.completedAt) : new Date();

                          // 코스별 점수 요약 문자열 (A 35 · B 35)
                          const pScores = me?.scores || {};
                          let aSum = 0; let aCnt = 0;
                          let bSum = 0; let bCnt = 0;
                          for (const [kStr, v] of Object.entries(pScores)) {
                            const baseH = ((Number(kStr) - 1) % 1000) + 1;
                            if (baseH >= 1 && baseH <= 9 && Number(v) > 0) { aSum += Number(v); aCnt++; }
                            if (baseH >= 10 && baseH <= 18 && Number(v) > 0) { bSum += Number(v); bCnt++; }
                          }
                          const courseSummary = (aCnt > 0 && bCnt > 0)
                            ? `A ${aSum} · B ${bSum}`
                            : `${me.totalStrokes}타 완주`;

                          // Par 기준 타수 차이 계산 (+undefined 버그 완벽 방어)
                          const basePar = is18Holes ? 66 : (r.totalHoles && r.totalHoles <= 9 ? 33 : 66);
                          const computedParDiff = me.totalParDiff !== undefined && !isNaN(Number(me.totalParDiff))
                            ? Number(me.totalParDiff)
                            : (me.totalStrokes - basePar);
                          const parDiffText = computedParDiff === 0 ? '+0' : computedParDiff > 0 ? `+${computedParDiff}` : `${computedParDiff}`;

                          // 라베순 정렬 시 상위 3위 특별 시각화
                          const isBestScoreMode = timelineSort === 'BEST_SCORE';
                          const isFirstBest = isBestScoreMode && rIdx === 0;
                          const isSecondBest = isBestScoreMode && rIdx === 1;
                          const isThirdBest = isBestScoreMode && rIdx === 2;

                          return (
                            <div
                              key={r.id || rIdx}
                              className={`w-full bg-white hover:bg-stone-50/70 p-3 rounded-2xl border transition select-none ${
                                isFirstBest
                                  ? 'border-2 border-amber-400 bg-gradient-to-br from-amber-50/60 via-white to-amber-100/30 shadow-sm ring-1 ring-amber-300/50'
                                  : isSecondBest
                                  ? 'border-slate-300 shadow-2xs'
                                  : isThirdBest
                                  ? 'border-amber-700/30 shadow-2xs'
                                  : 'border-stone-200/90 shadow-2xs'
                              }`}
                            >
                              {/* 라베 순위 뱃지 */}
                              {isFirstBest && (
                                <div className="mb-2 py-0.5 px-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-[10px] rounded-lg inline-flex items-center gap-1 shadow-2xs">
                                  <span>👑</span>
                                  <span>{isEnglish ? 'Life-Best Legend #1' : isJapanese ? '生涯不滅のラベ 1位' : '👑 평생 불멸의 라베 1위'}</span>
                                </div>
                              )}
                              {isSecondBest && (
                                <div className="mb-2 py-0.5 px-2 bg-slate-200 text-slate-800 font-black text-[10px] rounded-lg inline-flex items-center gap-1">
                                  <span>🥈</span>
                                  <span>{isEnglish ? 'All-Time 2nd Best' : isJapanese ? '歴代 2位 記録' : '🥈 역대 2위 기록'}</span>
                                </div>
                              )}
                              {isThirdBest && (
                                <div className="mb-2 py-0.5 px-2 bg-amber-100 text-amber-900 font-black text-[10px] rounded-lg inline-flex items-center gap-1">
                                  <span>🥉</span>
                                  <span>{isJapanese ? '歴代 3位 記録' : '🥉 역대 3위 기록'}</span>
                                </div>
                              )}

                              {/* 상단: 경기 제원 및 스코어 (클릭 시 스코어보드 팝업) */}
                              <div
                                onClick={() => setSelectedRoundForPopup(r)}
                                className="flex items-center justify-between gap-2.5 cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  {/* 대표 사진 또는 날짜 박스 */}
                                  {hasPhotos ? (
                                    <div className="w-12 h-12 rounded-2xl border-2 border-amber-400 overflow-hidden relative shrink-0 shadow-xs bg-gradient-to-br from-emerald-700 to-teal-800 flex items-center justify-center">
                                      {/* eslint-disable-next-line @next/next/no-img-element */}
                                      <img
                                        src={sessionPhotos[0]?.thumbnailUrl || sessionPhotos[0]?.imageUrl || r.photos![0]}
                                        alt="인증샷"
                                        className="w-full h-full object-cover absolute inset-0"
                                        onError={(e) => {
                                          (e.currentTarget as HTMLElement).style.display = 'none';
                                        }}
                                      />
                                      <span className="text-lg select-none">📸</span>
                                      <div className="absolute top-0.5 right-0.5 bg-black/70 text-white text-[8px] font-black px-1 rounded-sm z-10">
                                        📸
                                      </div>
                                      <div className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-2xs text-white text-[8px] font-black text-center py-0.2 z-10">
                                        {String(dObj.getMonth() + 1).padStart(2, '0')}.{String(dObj.getDate()).padStart(2, '0')}
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="w-12 h-12 rounded-2xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0">
                                      <span className="text-[10px] text-stone-500 font-bold leading-tight">
                                        {String(dObj.getMonth() + 1).padStart(2, '0')}.{String(dObj.getDate()).padStart(2, '0')}
                                      </span>
                                      <span className="text-xs font-black text-stone-800 leading-tight">
                                        {['일', '월', '화', '수', '목', '금', '토'][dObj.getDay()]}
                                      </span>
                                    </div>
                                  )}

                                  {/* 경기 제원 및 코스 요약 */}
                                  <div className="text-left min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span className="text-xs font-black text-stone-900 truncate">
                                        ⛳ {r.courseName}
                                      </span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-black shrink-0 ${isOfficial ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'}`}>
                                        {is18Holes ? '18H' : `${r.totalHoles || 9}H`}
                                      </span>
                                    </div>
                                    <div className="text-[10.5px] text-stone-500 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                                      <span className="text-stone-700 font-bold">{courseSummary}</span>
                                      {hasPhotos && (
                                        <span className="text-[9.5px] bg-gradient-to-r from-amber-400 to-yellow-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full shadow-2xs flex items-center gap-0.5 border border-amber-300">
                                          <span>📸</span>
                                          <span>사진 {combinedPhotosCount}장</span>
                                        </span>
                                      )}
                                      {sortedPlayers.length > 1 && (
                                        <span>· 👥 {sortedPlayers.length}명</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* 우측 순위 & 최종 타수 & 이동 화살표 */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <div className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                                      {myRank === 1 ? '🥇 1위' : `${myRank}위`}
                                    </div>
                                    <div className="text-sm font-black text-stone-950 leading-tight mt-0.5">
                                      {me.totalStrokes}타
                                      <span className="text-[10px] text-stone-500 font-medium ml-0.5">
                                        ({parDiffText})
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
                                </div>
                              </div>

                              {/* 라베 1위 전용 풀스크린 뷰어 호출 버튼 */}
                              {isFirstBest && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setWatermarkCardSession(r);
                                    setWatermarkCardInitialImage(sessionPhotos[0]?.imageUrl || r.photos?.[0] || null);
                                    setShowWatermarkCardModal(true);
                                  }}
                                  className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98 border border-amber-300"
                                >
                                  <span>🏆</span>
                                  <span>{isJapanese ? '生涯ベスト 殿堂カードを見る (共有)' : '인생 라베 명예 전당 카드 보기 (카톡/밴드 공유)'}</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* 하단 미니 포토 영역 (누가·언제·어디서 연계) */}
                              <div className="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                                {sessionPhotos.length > 0 ? (
                                  <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 flex-1 min-w-0">
                                    {sessionPhotos.slice(0, 4).map((p) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedPhotoForViewer(p);
                                          setShowPhotoViewerModal(true);
                                        }}
                                        className="w-10 h-10 rounded-xl overflow-hidden border border-amber-300 shrink-0 hover:scale-105 transition cursor-pointer relative shadow-2xs group"
                                        title={p.holeInfo || '사진 보기'}
                                      >
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                          src={p.thumbnailUrl || p.imageUrl}
                                          alt=""
                                          className="w-full h-full object-cover"
                                        />
                                      </button>
                                    ))}
                                    {sessionPhotos.length > 4 && (
                                      <span className="text-[10px] font-bold text-stone-500 shrink-0">
                                        +{sessionPhotos.length - 4}
                                      </span>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setUploadTargetSession(r);
                                        setShowPhotoUploadModal(true);
                                      }}
                                      className="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center text-xs font-bold transition shrink-0 cursor-pointer"
                                      title={isJapanese ? '写真追加' : '사진 추가'}
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setUploadTargetSession(r);
                                      setShowPhotoUploadModal(true);
                                    }}
                                    className="text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl flex items-center gap-1 transition cursor-pointer border border-emerald-200/60"
                                  >
                                    <span>📷</span>
                                    <span>{isJapanese ? '+ 写真を登録' : '+ 사진 등록'}</span>
                                  </button>
                                )}
                                <span className="text-[10px] text-stone-400 font-medium shrink-0">
                                  {isJapanese ? 'スコア詳細 ➔' : '상세 스코어 ➔'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ======================= [탭 2: 📷 포토 앨범 (추억의 갤러리)] ======================= */}
              {statsSubTab === 'PHOTO_ALBUM' && (() => {
                const uniqueCourseNames = Array.from(
                  new Set([
                    ...chroniclePhotos.map((p) => p.courseName).filter(Boolean),
                    ...completedRounds.map((r) => r.courseName).filter(Boolean),
                  ])
                );

                const uniqueCompanions = Array.from(
                  new Set([
                    ...chroniclePhotos.flatMap((p) => p.companions || []),
                    ...completedRounds.flatMap((r) => (r.players || []).map((pl) => pl.name).filter(Boolean)),
                  ])
                ).map((c) => c.trim()).filter((c) => Boolean(c) && c !== '나' && c !== '본인' && c !== '私');

                const matchCompanion = (photo: ChroniclePhotoItem, targetCompanion: string) => {
                  if (photo.companions && photo.companions.some((c) => c.trim().toLowerCase() === targetCompanion.trim().toLowerCase())) {
                    return true;
                  }
                  if (photo.sessionId) {
                    const round = completedRounds.find((r) => r.id === photo.sessionId);
                    if (round && round.players && round.players.some((pl) => pl.name.trim().toLowerCase() === targetCompanion.trim().toLowerCase())) {
                      return true;
                    }
                  }
                  return false;
                };

                let filteredPhotos = chroniclePhotos;
                if (photoAlbumFilterCourse !== 'ALL') {
                  filteredPhotos = filteredPhotos.filter((p) => p.courseName === photoAlbumFilterCourse);
                }
                if (photoAlbumFilterCompanion !== 'ALL') {
                  filteredPhotos = filteredPhotos.filter((p) => matchCompanion(p, photoAlbumFilterCompanion));
                }

                return (
                  <div className="space-y-3.5">
                    {/* 상단 컨트롤 바: [구장 필터 ▼] + [동반자별 보기 ▼] + [+ 사진 올리기] */}
                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                      {/* 1. 구장 필터 */}
                      <div className="relative flex-1 min-w-[125px]">
                        <select
                          value={photoAlbumFilterCourse}
                          onChange={(e) => setPhotoAlbumFilterCourse(e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl px-2.5 py-2 pr-6 text-stone-800 shadow-2xs focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer truncate"
                        >
                          <option value="ALL">
                            {isJapanese ? '⚡ 全コース写真' : '⚡ 전체 구장 보기'} ({chroniclePhotos.length})
                          </option>
                          {uniqueCourseNames.map((cName) => {
                            const count = chroniclePhotos.filter((p) => p.courseName === cName).length;
                            return (
                              <option key={cName} value={cName}>
                                ⛳ {cName} ({count})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* 2. 동반자 필터 */}
                      <div className="relative flex-1 min-w-[115px]">
                        <select
                          value={photoAlbumFilterCompanion}
                          onChange={(e) => setPhotoAlbumFilterCompanion(e.target.value)}
                          className="w-full text-xs font-bold bg-white border border-stone-200 rounded-xl px-2.5 py-2 pr-6 text-stone-800 shadow-2xs focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer truncate"
                        >
                          <option value="ALL">
                            {isJapanese ? '👥 同伴者別' : '👥 동반자별 보기'}
                          </option>
                          {uniqueCompanions.map((comp) => {
                            const count = chroniclePhotos.filter((p) => matchCompanion(p, comp)).length;
                            return (
                              <option key={comp} value={comp}>
                                👤 {comp} ({count})
                              </option>
                            );
                          })}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>

                      {/* 3. 사진 올리기 버튼 */}
                      <button
                        type="button"
                        onClick={() => {
                          setUploadTargetSession(null);
                          setShowPhotoUploadModal(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-2xs flex items-center gap-1 transition cursor-pointer shrink-0 active:scale-98"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{isJapanese ? '写真追加' : '사진 올리기'}</span>
                      </button>
                    </div>

                    {/* 3열 바둑판 그리드 갤러리 */}
                    {filteredPhotos.length > 0 ? (
                      <div className="grid grid-cols-3 gap-2">
                        {filteredPhotos.map((photo) => (
                          <div
                            key={photo.id}
                            onClick={() => {
                              setSelectedPhotoForViewer(photo);
                              setShowPhotoViewerModal(true);
                            }}
                            className="aspect-square rounded-2xl overflow-hidden relative cursor-pointer group shadow-2xs border border-stone-200/90 hover:border-emerald-400 hover:shadow-md transition bg-stone-900"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.thumbnailUrl || photo.imageUrl}
                              alt={photo.courseName}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                              loading="lazy"
                            />

                            {/* 상단 타수/순위 배지 */}
                            {photo.scoreSummary && (
                              <div className="absolute top-1 left-1 bg-black/70 backdrop-blur-2xs text-amber-300 font-black text-[9px] px-1.5 py-0.2 rounded-md shadow-xs">
                                🏆 {photo.scoreSummary}
                              </div>
                            )}

                            {/* 하단 구장명 미니 배지 */}
                            <div className="absolute bottom-1 right-1 max-w-[90%] bg-black/65 backdrop-blur-2xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded truncate select-none">
                              {photo.courseName}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-stone-50 rounded-2xl p-6 text-center border border-dashed border-stone-300 space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl mx-auto flex items-center justify-center font-bold shadow-inner">
                          📷
                        </div>
                        <div>
                          <div className="font-black text-sm text-stone-800">
                            {isJapanese ? 'まだ登録された写真がありません' : '아직 등록된 사진이 없습니다'}
                          </div>
                          <p className="text-xs text-stone-500 leading-relaxed mt-1">
                            {isJapanese
                              ? '全国コースでの素敵な瞬間や同伴者との認証ショットをアルバムに残してみましょう！'
                              : '전국 구장에서 찍은 멋진 라운드 인증샷이나 동반자와의 추억을 앨범에 보관해 보세요!'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setUploadTargetSession(null);
                            setShowPhotoUploadModal(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md cursor-pointer transition active:scale-98"
                        >
                          <Camera className="w-4 h-4" />
                          <span>{isJapanese ? '最初の写真を登録する' : '첫 사진 올리기'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ======================= [탭 3: 🏅 방문 구장 & 기념 메달] ======================= */}
              {statsSubTab === 'MEDALS_COURSES' && (() => {
                // 1. 방문 구장 집계 (국내 vs 일본/해외 투어 구분)
                const visitedCoursesMap: Record<string, {
                  courseId: string;
                  courseName: string;
                  region: string;
                  isOverseas: boolean;
                  visitCount: number;
                  bestScore: number;
                  bestParDiff: number;
                  lastDate: string;
                }> = {};

                completedRounds.forEach((r) => {
                  const cName = r.courseName || '파크골프장';
                  const cId = r.courseId || cName;
                  const courseObj = courses.find((c) => c.id === cId || c.name === cName);
                  const isOverseas = Boolean(
                    courseObj?.country === 'JP' ||
                    cId.startsWith('jp-') ||
                    cName.includes('일본') ||
                    cName.includes('홋카이도') ||
                    cName.includes('마쿠베츠') ||
                    cName.includes('つつじが丘')
                  );
                  const region = courseObj?.regionKo || (isOverseas ? (courseObj?.regionJa || '일본 홋카이도') : (courseObj?.region || '전국'));
                  const me = (r.players && r.players.length > 0)
                    ? (r.players.find((p) => p.isSelf) || r.players[0])
                    : ({ id: 'me', name: '나', totalStrokes: (r as any).totalScore || 54, totalParDiff: 0, scores: {}, obCount: {} } as any);
                  const strokes = me?.totalStrokes || (r as any).totalScore || 0;
                  const parDiff = me?.totalParDiff || 0;
                  const dateStr = r.completedAt ? r.completedAt.slice(0, 10) : '';

                  if (!visitedCoursesMap[cName]) {
                    visitedCoursesMap[cName] = {
                      courseId: cId,
                      courseName: cName,
                      region,
                      isOverseas,
                      visitCount: 1,
                      bestScore: strokes > 0 ? strokes : 999,
                      bestParDiff: parDiff,
                      lastDate: dateStr,
                    };
                  } else {
                    visitedCoursesMap[cName].visitCount += 1;
                    if (strokes > 0 && strokes < visitedCoursesMap[cName].bestScore) {
                      visitedCoursesMap[cName].bestScore = strokes;
                      visitedCoursesMap[cName].bestParDiff = parDiff;
                    }
                    if (dateStr > visitedCoursesMap[cName].lastDate) {
                      visitedCoursesMap[cName].lastDate = dateStr;
                    }
                  }
                });

                if (typeof window !== 'undefined') {
                  try {
                    const rawBadges = BadgeStorage.getAllBadges();
                    Object.values(rawBadges).forEach((b) => {
                      if (b && b.courseName && !visitedCoursesMap[b.courseName]) {
                        const courseObj = courses.find((c) => c.id === b.courseId || c.name === b.courseName);
                        const isOverseas = Boolean(
                          courseObj?.country === 'JP' ||
                          b.courseId?.startsWith('jp-') ||
                          b.courseName.includes('일본') ||
                          b.courseName.includes('홋카이도') ||
                          b.courseName.includes('마쿠베츠')
                        );
                        const region = courseObj?.regionKo || (isOverseas ? (courseObj?.regionJa || '일본 홋카이도') : (courseObj?.region || '전국'));
                        visitedCoursesMap[b.courseName] = {
                          courseId: b.courseId,
                          courseName: b.courseName,
                          region,
                          isOverseas,
                          visitCount: b.visitCount || 1,
                          bestScore: 999,
                          bestParDiff: 0,
                          lastDate: b.lastDateStr || '',
                        };
                      } else if (b && b.courseName && visitedCoursesMap[b.courseName]) {
                        visitedCoursesMap[b.courseName].visitCount = Math.max(visitedCoursesMap[b.courseName].visitCount, b.visitCount || 1);
                      }
                    });
                  } catch {}
                }

                const visitedCoursesList = Object.values(visitedCoursesMap);
                const koreaCourses = visitedCoursesList.filter((c) => !c.isOverseas);
                const overseasCourses = visitedCoursesList.filter((c) => c.isOverseas);

                // 2. 기념 메달 19종 실전형 판별 (파크골프 규격 반영)
                const meOf = (r: RoundSession) => {
                  return (r.players && r.players.length > 0)
                    ? (r.players.find((p) => p.isSelf) || r.players[0])
                    : ({ id: 'me', name: '나', totalStrokes: (r as any).totalScore || 54, totalParDiff: 0, scores: {}, obCount: {} } as any);
                };

                const total9Holes = completedRounds.reduce((acc, r) => {
                  const me = meOf(r);
                  const is18 = (r.totalHoles && r.totalHoles >= 18) || Object.keys(me?.scores || {}).length >= 18 || (r as any).holes >= 18;
                  return acc + (is18 ? 2 : 1);
                }, 0);

                const totalOb = completedRounds.reduce((acc, r) => {
                  const me = meOf(r);
                  return acc + Object.values(me?.obCount || {}).reduce<number>((s, c) => s + (Number(c) || 0), 0);
                }, 0);
                const avgObPer9Holes = total9Holes > 0 ? (totalOb / total9Holes) : 0;

                const best18Score = Math.min(
                  ...completedRounds.map((r) => {
                    const me = meOf(r);
                    const is18 = (r.totalHoles && r.totalHoles >= 18) || Object.keys(me?.scores || {}).length >= 18 || (r as any).holes >= 18;
                    const s = me?.totalStrokes || (r as any).totalScore || 0;
                    return (is18 && s > 0) ? s : 999;
                  }),
                  999
                );

                const medals = [
                  // 1) 50대 타수 (1타 단위 계단식 칭호)
                  {
                    id: 'stroke_59',
                    icon: '🦅',
                    title: isEnglish ? 'Under-Par Master (50s)' : isJapanese ? '50台突入！アンダーパー名人' : '5자 영접! 언더파 명인',
                    desc: isEnglish ? '18H 59 strokes or below (-7)' : isJapanese ? '18H 59打以下 (-7)' : '18홀 59타 이하 (-7)',
                    unlocked: best18Score <= 59,
                  },
                  {
                    id: 'stroke_58',
                    icon: '🎯',
                    title: isEnglish ? 'Field Strategist' : isJapanese ? 'フィールドの勝負師' : '필드의 승부사',
                    desc: isEnglish ? '18H 58 strokes or below (-8)' : isJapanese ? '18H 58打以下 (-8)' : '18홀 58타 이하 (-8)',
                    unlocked: best18Score <= 58,
                  },
                  {
                    id: 'stroke_57',
                    icon: '⚡',
                    title: isEnglish ? 'Master of Sense' : isJapanese ? '絶対感覚の支配者' : '절대 감각의 지배자',
                    desc: isEnglish ? '18H 57 strokes or below (-9)' : isJapanese ? '18H 57打以下 (-9)' : '18홀 57타 이하 (-9)',
                    unlocked: best18Score <= 57,
                  },
                  {
                    id: 'stroke_56',
                    icon: '🏹',
                    title: isEnglish ? 'Divine Archer' : isJapanese ? '神弓の境地' : '신궁(神弓)의 경지',
                    desc: isEnglish ? '18H 56 strokes or below (-10)' : isJapanese ? '18H 56打以下 (-10)' : '18홀 56타 이하 (-10)',
                    unlocked: best18Score <= 56,
                  },
                  {
                    id: 'stroke_55',
                    icon: '🥇',
                    title: isEnglish ? 'National Champion Grade' : isJapanese ? '全国区チャンピオン級' : '전국구 챔피언급',
                    desc: isEnglish ? '18H 55 strokes or below (-11)' : isJapanese ? '18H 55打以下 (-11)' : '18홀 55타 이하 (-11)',
                    unlocked: best18Score <= 55,
                  },
                  {
                    id: 'stroke_54',
                    icon: '👑',
                    title: isEnglish ? 'Life-Best Legend #1' : isJapanese ? '不滅のラベ' : '불멸의 라베',
                    desc: isEnglish ? '18H 54 strokes or below (-12)' : isJapanese ? '18H 54打以下 (-12)' : '18홀 54타 이하 (-12)',
                    unlocked: best18Score <= 54,
                  },
                  {
                    id: 'stroke_50_53',
                    icon: '✨',
                    title: isEnglish ? 'Legendary Master' : isJapanese ? '名将・ハーフバック伝説' : '명장 & 하프 백 전설',
                    desc: isEnglish ? '18H 53 strokes or below' : isJapanese ? '18H 53打以下神域' : '18홀 53타 이하 신화의 영역',
                    unlocked: best18Score <= 53,
                  },

                  // 2) 40대 타수 (기적과 신화의 영역)
                  {
                    id: 'stroke_49',
                    icon: '🌌',
                    title: isEnglish ? 'Miraculous 40s Realm' : isJapanese ? '奇跡の40台突入' : '기적의 40대 입성',
                    desc: isEnglish ? '18H 49 strokes or below' : isJapanese ? '18H 49打以下超人的大記録' : '18홀 49타 이하 기적의 기록',
                    unlocked: best18Score <= 49,
                  },
                  {
                    id: 'stroke_48_below',
                    icon: '🌟',
                    title: isEnglish ? 'God of Park Golf' : isJapanese ? 'パークゴルフの神 (神域)' : '파크골프의 신(神)',
                    desc: isEnglish ? '18H 48 strokes or below immortal myth' : isJapanese ? '18H 48打以下不滅の神話' : '18홀 48타 이하 전설의 신화',
                    unlocked: best18Score <= 48,
                  },

                  // 3) 9홀 누적 완주제 (마일리지 훈장)
                  {
                    id: 'milestone_9h_10',
                    icon: '🌱',
                    title: isEnglish ? 'Field Sprout (10 Rounds)' : isJapanese ? 'フィールドの新芽 (10回)' : '필드의 새싹',
                    desc: isEnglish ? 'Completed 10 cumulative 9-hole rounds' : isJapanese ? '累計9ホール10回完走' : '누적 9홀 10회 완주',
                    unlocked: total9Holes >= 10,
                  },
                  {
                    id: 'milestone_9h_50',
                    icon: '🏃',
                    title: isEnglish ? 'Passionate Golfer (50 Rounds)' : isJapanese ? '情熱ゴルファー (50回)' : '열정 골퍼',
                    desc: isEnglish ? 'Completed 50 cumulative 9-hole rounds' : isJapanese ? '累計9ホール50回完走' : '누적 9홀 50회 완주',
                    unlocked: total9Holes >= 50,
                  },
                  {
                    id: 'milestone_9h_100',
                    icon: '🎖️',
                    title: isEnglish ? 'Veteran of 100 Rounds' : isJapanese ? '百戦錬磨の巨匠 (100回)' : '백전노장',
                    desc: isEnglish ? 'Completed 100 cumulative 9-hole rounds' : isJapanese ? '累計9ホール100回完走' : '누적 9홀 100회 완주 달성',
                    unlocked: total9Holes >= 100,
                  },
                  {
                    id: 'milestone_9h_500',
                    icon: '🏰',
                    title: isEnglish ? 'Guardian of the Green (500 Rounds)' : isJapanese ? 'フィールドの主 (500回)' : '필드의 터줏대감',
                    desc: isEnglish ? 'Completed 500 cumulative 9-hole rounds' : isJapanese ? '累計9ホール500回完走' : '누적 9홀 500회 완주 달성',
                    unlocked: total9Holes >= 500,
                  },
                  {
                    id: 'milestone_9h_1000',
                    icon: '🗽',
                    title: isEnglish ? 'Immortal Living Legend (1,000 Rounds)' : isJapanese ? '不滅の伝説 (1000回)' : '불멸의 전설',
                    desc: isEnglish ? 'Completed 1,000 cumulative 9-hole rounds' : isJapanese ? '累計9ホール1,000回完走' : '누적 9홀 1,000회 대기록',
                    unlocked: total9Holes >= 1000,
                  },

                  // 4) OB 지수 관리 훈장
                  {
                    id: 'ob_clean',
                    icon: '🛡️',
                    title: isEnglish ? 'Flawless Zero-OB Shield' : isJapanese ? 'ノーOB 無欠点完走' : '무결점 노(No) OB',
                    desc: isEnglish ? '18-hole zero-OB round completed' : isJapanese ? '18HノーOB完走' : '18홀 무결점 0 OB 완주',
                    unlocked: completedRounds.some((r) => {
                      const me = meOf(r);
                      const obTotal = Object.values(me?.obCount || {}).reduce<number>((acc, cur) => acc + (Number(cur) || 0), 0);
                      return obTotal === 0 && Boolean(r.completedAt || (me?.scores && Object.keys(me.scores).length >= 9));
                    }),
                  },
                  {
                    id: 'ob_stability',
                    icon: '💎',
                    title: isEnglish ? 'Shot Precision Gold' : isJapanese ? 'ショット安定マスター' : '샷 안정도 골드 훈장',
                    desc: isEnglish ? 'Under 0.5 avg OB per 9-holes' : isJapanese ? '9H平均OB 0.5個以下の安定度' : '9홀당 평균 OB 0.5개 이하 안정 샷',
                    unlocked: completedRounds.length >= 2 && avgObPer9Holes <= 0.5,
                  },

                  // 5) 타지역 원정 순례 훈장
                  {
                    id: 'tour_3',
                    icon: '🗺️',
                    title: isEnglish ? 'Regional Pilgrim (3 Courses)' : isJapanese ? '三道巡礼者 (3コース)' : '삼도 순례자 (3개 구장)',
                    desc: isEnglish ? 'Completed rounds at 3 different courses' : isJapanese ? '異なる3箇所のコース完走' : '서로 다른 3곳 구장 완주',
                    unlocked: visitedCoursesList.length >= 3,
                  },
                  {
                    id: 'tour_10',
                    icon: '🧭',
                    title: isEnglish ? 'National Expedition Leader (10 Courses)' : isJapanese ? '全国遠征隊長 (10コース)' : '전국 원정대장 (10개 구장)',
                    desc: isEnglish ? 'Completed rounds at 10 different courses' : isJapanese ? '異なる10箇所のコース完走' : '서로 다른 10곳 구장 완주',
                    unlocked: visitedCoursesList.length >= 10,
                  },
                  {
                    id: 'tour_30',
                    icon: '🌏',
                    title: isEnglish ? 'National Course Pioneer (30 Courses)' : isJapanese ? '生ける羅針盤 (30コース)' : '살아있는 나침반 (30개 구장)',
                    desc: isEnglish ? 'Completed rounds at 30 different courses' : isJapanese ? '異なる30箇所のコース完走' : '서로 다른 30곳 구장 정복',
                    unlocked: visitedCoursesList.length >= 30,
                  },
                ];

                const earnedCount = medals.filter((m) => m.unlocked).length;
                const tourSummary = BadgeStorage.getNationalTourSummary();

                return (
                  <div className="space-y-3.5">
                    {/* 상단 파키 전국 명예의 전당 배너 (5스타 마스터 트로피 파키) */}
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
                          <span>{isJapanese ? '全国パークゴルフ公認 殿堂' : '전국 파크골프 공인 명예의 전당'}</span>
                          <span className="text-[9px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded">5-STAR</span>
                        </div>
                        <p className="text-[10.5px] text-amber-900 font-medium leading-tight mt-0.5">
                          {isJapanese
                            ? '獲得した記念メダルと訪問した全国コース巡礼記録を永久保存します。'
                            : '플레이를 통해 획득한 영예의 기념 메달과 전국 구장 순례 명패를 영구 보존합니다.'}
                        </p>
                      </div>
                    </div>

                    {/* 대표님 지침 탭 스위처: [⛳ 방문 구장 통계] vs [🏅 기념 메달 & 랭킹] */}
                    <div className="flex bg-stone-100 p-1 rounded-2xl border border-stone-200">
                      <button
                        type="button"
                        onClick={() => setMedalsViewSubTab('COURSES_TOUR')}
                        className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          medalsViewSubTab === 'COURSES_TOUR'
                            ? 'bg-white text-emerald-950 shadow-xs border border-emerald-300 font-black'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span className="shrink-0">⛳</span>
                        <span className="shrink-0">{isJapanese ? '訪問コース統計' : '방문 구장 통계'}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                          medalsViewSubTab === 'COURSES_TOUR' ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {visitedCoursesList.length}곳
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMedalsViewSubTab('MEDALS_RANK')}
                        className={`flex-1 py-2 px-1 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          medalsViewSubTab === 'MEDALS_RANK'
                            ? 'bg-white text-amber-950 shadow-xs border border-amber-300 font-black'
                            : 'text-stone-500 hover:text-stone-800'
                        }`}
                      >
                        <span className="shrink-0">🏅</span>
                        <span className="shrink-0">{isJapanese ? '記念メダル & 順位' : '기념 메달 & 랭킹'}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                          medalsViewSubTab === 'MEDALS_RANK' ? 'bg-amber-100 text-amber-900' : 'bg-stone-200 text-stone-600'
                        }`}>
                          {earnedCount}/{medals.length}
                        </span>
                      </button>
                    </div>

                    {/* ---------------- 1) 나의 방문 구장 통계 & 전국·해외 도장 깨기 ---------------- */}
                    {medalsViewSubTab === 'COURSES_TOUR' && (
                      <div className="space-y-3">
                        {/* 전국 17개 시·도 도장 깨기 (투어 퍼즐) 배너 */}
                        <button
                          type="button"
                          onClick={() => {
                            setShowStatsModal(false);
                            setShowNationalTourModal(true);
                          }}
                          className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 p-3 rounded-2xl shadow-xs hover:shadow-sm flex items-center justify-between border-2 border-yellow-200 transition active:scale-[0.98] cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-stone-950 text-amber-300 flex items-center justify-center text-xl font-black shadow-xs shrink-0">
                              🗺️
                            </div>
                            <div className="text-left min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] bg-stone-950 text-amber-300 font-black px-1.5 py-0.5 rounded leading-none">
                                  {isJapanese ? '全国制覇' : '전국 도장 깨기'}
                                </span>
                                <span className="text-xs font-black text-stone-950">
                                  {isJapanese ? '全国17地域制覇パズル' : '전국 17개 시·도 투어 퍼즐'}
                                </span>
                              </div>
                              <div className="text-[11px] font-extrabold text-stone-900 mt-0.5 truncate">
                                {isJapanese ? '制覇: ' : '정복: '}
                                <strong className="text-rose-800">{tourSummary.unlockedCount} / 17</strong> ({tourSummary.progressPercent}%) · {tourSummary.currentTitle}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs font-black text-stone-950 bg-white/80 px-2.5 py-1.5 rounded-xl shadow-xs shrink-0 ml-2">
                            <span>{isJapanese ? '地図を見る' : '지도 보기'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </div>
                        </button>

                        {/* 국내 & 일본/해외 투어 순례 구장 통계 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                              <span className="text-emerald-700">⛳</span>
                              <span>{isJapanese ? '訪問コーススタンプ＆完走名牌' : '내가 방문한 구장 스탬프 & 완주 명패'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10.5px]">
                              <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                🇰🇷 국내 {koreaCourses.length}
                              </span>
                              <span className="text-rose-800 font-bold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                                🇯🇵 해외 {overseasCourses.length}
                              </span>
                            </div>
                          </div>

                          {/* 국내 / 해외(일본) 지역 필터 탭 */}
                          <div className="flex gap-1.5 text-xs">
                            <button
                              type="button"
                              onClick={() => setCourseRegionFilter('ALL')}
                              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                                courseRegionFilter === 'ALL'
                                  ? 'bg-stone-900 text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              {isJapanese ? 'すべて' : '전체'} ({visitedCoursesList.length})
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseRegionFilter('KR')}
                              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                                courseRegionFilter === 'KR'
                                  ? 'bg-emerald-700 text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              <span>🇰🇷</span>
                              <span>{isJapanese ? '韓国コース' : '국내 구장'}</span>
                              <span>({koreaCourses.length})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setCourseRegionFilter('OVERSEAS')}
                              className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs flex items-center gap-1 ${
                                courseRegionFilter === 'OVERSEAS'
                                  ? 'bg-rose-700 text-white shadow-2xs'
                                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                              }`}
                            >
                              <span>🇯🇵</span>
                              <span>{isJapanese ? '日本・海外' : '일본·해외 투어'}</span>
                              <span>({overseasCourses.length})</span>
                            </button>
                          </div>

                          {/* 필터링된 구장 리스트 */}
                          {(() => {
                            const displayedCourses = visitedCoursesList.filter((c) => {
                              if (courseRegionFilter === 'KR') return !c.isOverseas;
                              if (courseRegionFilter === 'OVERSEAS') return c.isOverseas;
                              return true;
                            });

                            if (displayedCourses.length === 0) {
                              return (
                                <div className="bg-stone-50 rounded-2xl p-5 text-center border border-stone-200 text-xs text-stone-500 space-y-1">
                                  <div className="text-xl">{courseRegionFilter === 'OVERSEAS' ? '✈️' : '⛳'}</div>
                                  <div className="font-bold text-stone-700">
                                    {courseRegionFilter === 'OVERSEAS'
                                      ? (isJapanese ? 'まだ日本・海外コースの完走記録がありません' : '아직 일본·해외 구장 완주 기록이 없습니다')
                                      : (isJapanese ? 'まだ訪問したコースがありません' : '아직 완주한 구장 기록이 없습니다')}
                                  </div>
                                  <p className="text-[11px] text-stone-400">
                                    {courseRegionFilter === 'OVERSEAS'
                                      ? (isJapanese ? '日本の本場コースをラウンドして海外スタンプを獲得しましょう！' : '일본/해외 구장 라운드 시 전용 해외 원정 명패가 발급됩니다.')
                                      : (isJapanese ? 'ラウンドを完走して全国名牌を集めましょう！' : '라운드를 완주하시면 전국 순례 도장이 자동으로 찍힙니다.')}
                                  </p>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-2">
                                {displayedCourses.map((vc) => {
                                  const tierBadge = vc.visitCount >= 100
                                    ? { title: isJapanese ? '主の風格 👑' : '터줏대감 👑', color: 'bg-purple-100 text-purple-900 border-purple-300' }
                                    : vc.visitCount >= 30
                                    ? { title: isJapanese ? '名誉マスター 🥇' : '명예 마스터 🥇', color: 'bg-amber-100 text-amber-900 border-amber-300' }
                                    : vc.visitCount >= 10
                                    ? { title: isJapanese ? '地域エース 🥈' : '지역 에이스 🥈', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
                                    : vc.visitCount >= 5
                                    ? { title: isJapanese ? '常連ゴルファー 🥉' : '단골 골퍼 🥉', color: 'bg-blue-100 text-blue-900 border-blue-300' }
                                    : { title: isJapanese ? '公認征服者 ⛳' : '공식 정복자 ⛳', color: 'bg-stone-100 text-stone-800 border-stone-300' };

                                  const localizedCourseTitle = getCourseDualName(vc.courseName, isJapanese).primary;
                                  const localizedRegionTitle = isJapanese ? translateKoreanAddressToJapanese(vc.region) : vc.region;

                                  return (
                                    <div
                                      key={vc.courseId}
                                      className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs flex items-center justify-between gap-3 hover:border-emerald-300 transition"
                                    >
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-xs font-black text-stone-900 truncate">
                                            {vc.isOverseas ? '✈️' : '⛳'} {localizedCourseTitle}
                                          </span>
                                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${
                                            vc.isOverseas ? 'bg-rose-100 text-rose-900 border-rose-300' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                          }`}>
                                            {vc.isOverseas ? (isJapanese ? '🇯🇵 海外' : '🇯🇵 해외') : (isJapanese ? '🇰🇷 韓国' : '🇰🇷 국내')}
                                          </span>
                                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-black border ${tierBadge.color}`}>
                                            {tierBadge.title}
                                          </span>
                                        </div>
                                        <div className="text-[10.5px] text-stone-500 font-medium mt-1 flex items-center gap-1.5 flex-wrap">
                                          <span className="text-stone-400 font-bold whitespace-nowrap">{localizedRegionTitle}</span>
                                          <span className="text-stone-300">·</span>
                                          <span className="font-bold text-stone-700 whitespace-nowrap">{isJapanese ? `累計 ${vc.visitCount}回` : `총 ${vc.visitCount}회 완주`}</span>
                                          {vc.bestScore < 999 && (
                                            <>
                                              <span className="text-stone-300">·</span>
                                              <span className="text-emerald-700 font-bold whitespace-nowrap">
                                                {isJapanese ? `ベスト ${vc.bestScore}打` : `최고 ${vc.bestScore}타`}
                                              </span>
                                            </>
                                          )}
                                          {vc.lastDate && (
                                            <>
                                              <span className="text-stone-300">·</span>
                                              <span className="whitespace-nowrap">{vc.lastDate}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      {/* 구장 방문 스탬프 or 대표 인증샷 */}
                                      {(() => {
                                        const coursePhotos = chroniclePhotos.filter((p) => p.courseName === vc.courseName);
                                        if (coursePhotos.length > 0) {
                                          const heroPhoto = coursePhotos[0];
                                          return (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setSelectedPhotoForViewer(heroPhoto);
                                                setShowPhotoViewerModal(true);
                                              }}
                                              className="w-10 h-10 rounded-xl overflow-hidden border-2 border-emerald-400 relative shrink-0 shadow-2xs hover:scale-105 transition cursor-pointer"
                                              title={isJapanese ? '代表写真を見る' : '구장 대표 인증샷 보기'}
                                            >
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={heroPhoto.thumbnailUrl || heroPhoto.imageUrl}
                                                alt=""
                                                className="w-full h-full object-cover"
                                              />
                                              <div className="absolute bottom-0 right-0 bg-black/70 text-[8px] text-white px-0.5 rounded-tl font-bold">
                                                📸
                                              </div>
                                            </button>
                                          );
                                        }
                                        return (
                                          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center text-sm font-black shrink-0 shadow-2xs">
                                            💮
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* ---------------- 2) 기념 메달 컬렉션 & 랭킹 센터 ---------------- */}
                    {medalsViewSubTab === 'MEDALS_RANK' && (
                      <div className="space-y-3">
                        {/* 구장별 1~100위 랭킹 센터 */}
                        {/* 전국 랭킹 상세 팝업 진입 버튼 2종 (내 순위 기반) */}
                        {(() => {
                          const TOTAL_GOLFERS = 150000;
                          const rawSkillPercent = userExpStats.rankPercent ?? 8.6;
                          const skillRank = Math.max(1, Math.round(TOTAL_GOLFERS * (rawSkillPercent / 100)));
                          const skillPercentStr = rawSkillPercent.toFixed(1);

                          const rawActivityPercent = Math.max(0.8, Number((100 - userExpStats.activityPercent).toFixed(1)));
                          const activityRank = Math.max(1, Math.round(TOTAL_GOLFERS * (rawActivityPercent / 100)));
                          const activityPercentStr = rawActivityPercent.toFixed(1);

                          return (
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setShowRankingDetailPopup('SKILL')}
                                className="p-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-xl shadow-xs transition flex items-center justify-between cursor-pointer border border-amber-400/80 active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">🏆</span>
                                  <div className="text-left min-w-0">
                                    <div className="text-[11px] font-black text-stone-950 truncate">
                                      {isJapanese
                                        ? `公認実力: 全国 ${skillRank.toLocaleString()}位`
                                        : `공인 실력: 전국 ${skillRank.toLocaleString()}등`}
                                    </div>
                                    <div className="text-[9.5px] text-amber-950/80 font-bold leading-none mt-0.5 truncate">
                                      {isJapanese ? `上位 ${skillPercentStr}%` : `상위 ${skillPercentStr}%`}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-stone-950 bg-white/70 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                  ❯
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowRankingDetailPopup('ACTIVITY')}
                                className="p-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black rounded-xl shadow-xs transition flex items-center justify-between cursor-pointer border border-emerald-500/80 active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-sm shrink-0">🔥</span>
                                  <div className="text-left min-w-0">
                                    <div className="text-[11px] font-black text-white truncate">
                                      {isJapanese
                                        ? `活動: 全国 ${activityRank.toLocaleString()}位`
                                        : `필드 활동: 전국 ${activityRank.toLocaleString()}등`}
                                    </div>
                                    <div className="text-[9.5px] text-emerald-100 font-bold leading-none mt-0.5 truncate">
                                      {isJapanese ? `上位 ${activityPercentStr}%` : `상위 ${activityPercentStr}% 열정파`}
                                    </div>
                                  </div>
                                </div>
                                <span className="text-[10px] font-black text-emerald-950 bg-white/90 px-1.5 py-0.5 rounded shrink-0 ml-1">
                                  ❯
                                </span>
                              </button>
                            </div>
                          );
                        })()}

                        {/* 나의 기념 메달 & 업적 컬렉션 */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-1.5 font-black text-xs text-stone-900">
                              <span className="text-amber-600">🏅</span>
                              <span>{isJapanese ? '獲得記念メダルコレクション' : '나의 기념 메달 & 업적 컬렉션'}</span>
                            </div>
                            <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                              {isJapanese ? `獲得: ${earnedCount} / ${medals.length}` : `획득: ${earnedCount} / ${medals.length}개`}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            {medals.map((m) => (
                              <div
                                key={m.id}
                                className={`p-2.5 rounded-2xl border transition ${
                                  m.unlocked
                                    ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/70 border-amber-300 shadow-2xs'
                                    : 'bg-stone-50 border-stone-200/80 opacity-75'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1 mb-1">
                                  <span className={`text-xl ${m.unlocked ? '' : 'grayscale opacity-60'}`}>{m.icon}</span>
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.2 rounded ${
                                      m.unlocked
                                        ? 'bg-amber-500 text-stone-950 shadow-2xs'
                                        : 'bg-stone-200 text-stone-600'
                                    }`}
                                  >
                                    {m.unlocked ? (isJapanese ? '獲得' : '획득') : (isJapanese ? '挑戦中 🔒' : '도전 🔒')}
                                  </span>
                                </div>
                                <div className={`text-xs font-black truncate ${m.unlocked ? 'text-amber-950' : 'text-stone-600'}`}>
                                  {m.title}
                                </div>
                                <div className={`text-[10px] leading-tight truncate mt-0.5 ${m.unlocked ? 'text-amber-900/80 font-medium' : 'text-stone-400'}`}>
                                  {m.desc}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 백업 기록 보관 / 복원 카드 (카카오 배너 완전 삭제 후 깔끔한 단일 관리 카드 유지) */}
                    <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Share2 className="w-3.5 h-3.5 text-stone-600" />
                          <span className="text-xs font-black text-stone-900">내 전적 데이터 1초 백업 &amp; 복원</span>
                        </div>
                        <span className="text-[9.5px] font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-full">
                          기기변경/초기화 대비
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="py-2 px-3 bg-stone-800 hover:bg-stone-900 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>내 전적 백업 복사</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleImportBackup}
                          className="py-2 px-3 bg-white hover:bg-stone-100 active:scale-95 text-stone-800 font-black text-xs rounded-xl border border-stone-300 shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-stone-600" />
                          <span>백업 기록 복원</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* 고정 하단 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setShowStatsModal(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-sm transition cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🎯 나의 공인 등급 & 실력 분석 전용 팝업창 (대표님 지침: 헷갈리지 않는 깔끔한 X창 팝업) */}
      {showGradePopup && (
        <div
          className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowGradePopup(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp max-h-[90vh] flex flex-col overflow-hidden border border-amber-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 팝업 상단 헤더 (X 닫기 버튼) */}
            <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-stone-950 px-4 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-white/90 text-stone-900 flex items-center justify-center text-sm font-black shadow-xs">
                  🎯
                </span>
                <div>
                  <div className="text-sm font-black text-stone-950">
                    {isJapanese ? '私の公認等級 & 実力分析' : '나의 공인 등급 & 실력 분석'}
                  </div>
                  <div className="text-[10px] text-stone-950/80 font-bold">
                    {isJapanese ? '全国総合データ連動' : '전국 종합 데이터 연동'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGradePopup(false)}
                className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-stone-950 flex items-center justify-center font-black transition cursor-pointer"
                title={isJapanese ? '閉じる' : '닫기'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 팝업 본문 (스크롤 영역) */}
            <div className="p-4 space-y-3.5 overflow-y-auto flex-1">
              {/* 등급 명패 & 별 5개 대형 배너 */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 border border-amber-300 rounded-2xl p-4 text-center space-y-2 shadow-2xs">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-500/20 text-3xl border border-amber-400/50 shadow-inner">
                  🎯
                </div>
                <div>
                  <div className="text-lg font-black text-stone-950">
                    {userExpStats.hasCompleted ? userExpStats.skillStarTitle : (isJapanese ? '未判定' : '공인 등급 미판정')}
                  </div>
                  <div className="text-amber-500 font-bold text-base mt-1 flex justify-center">
                    {renderExperienceStars(userExpStats.hasCompleted ? userExpPercent : 0, 'text-base')}
                  </div>
                </div>
                <div className="text-xs font-bold text-stone-800 bg-white/90 py-1.5 px-3 rounded-xl border border-amber-200 inline-block shadow-2xs">
                  {userExpStats.hasCompleted
                    ? `${isJapanese ? '18H平均' : '18홀 평균'} ${userExpStats.avgScore}${isJapanese ? '打' : '타'} (${userExpStats.parDiffText})`
                    : (isJapanese ? 'ラウンド完走時に自動算出' : '라운드 완주 시 자동 산출')}
                </div>
              </div>

              {/* 전국 실력 백분위 게이지 */}
              {userExpStats.hasCompleted ? (
                <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <span className="flex items-center gap-1 font-black">
                      <span>🏆</span>
                      <span>{isJapanese ? '全国実力パーセンタイル' : '전국 실력 백분위'}</span>
                    </span>
                    <span className="font-black text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-lg text-[11px] border border-amber-300">
                      {isJapanese ? `上位 ${userExpStats.rankPercent}%` : `전국 상위 ${userExpStats.rankPercent}% 고수`}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-600 h-2.5 rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(15, 100 - (userExpStats.rankPercent || 45))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold px-0.5">
                    <span>초급 (45%~)</span>
                    <span>중급 (25%)</span>
                    <span>상급 (10%)</span>
                    <span>마스터 (1%)</span>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/80 text-center text-xs text-stone-500 font-medium leading-relaxed">
                  {isJapanese
                    ? '⛳ 1回以上ラウンドを完走すると、スコアを総合分析して星5つの全国等級と上位%(パーセンタイル)が自動算出されます。'
                    : '⛳ 라운드를 1회 이상 완주하시면 지금까지 친 스코어를 종합 분석하여 별 5개 전국 등급과 상위 %(퍼센트)가 자동으로 산출됩니다.'}
                </div>
              )}

              {/* 필드 활동 열정 지수 */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs font-bold text-emerald-950 gap-2">
                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="text-base">🔥</span>
                  <span>{isJapanese ? 'フィールド活動熱意' : '필드 활동 열정'}</span>
                </div>
                <span className="text-[11px] font-black text-emerald-900 bg-white px-2 py-1 rounded-xl border border-emerald-300 text-right truncate">
                  {userExpStats.roundCount30Days > 0 ? `최근 30일 ${userExpStats.roundCount30Days}회 완주 (${userExpStats.activityTier})` : '기록 없음'}
                </span>
              </div>

              {/* 통산 플레이 통계 요약 (대표님의 누적 라운드 하이라이트) */}
              {completedRounds.length > 0 && (
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-2">
                  <div className="text-[11px] font-black text-stone-700 flex items-center gap-1">
                    <span>📊</span>
                    <span>{isJapanese ? '累積競技ハイライト' : '나의 통산 기록 하이라이트'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="text-[10px] text-stone-500 font-bold">총 완주</div>
                      <div className="text-xs font-black text-stone-900 mt-0.5">{completedRounds.length}회</div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="text-[10px] text-stone-500 font-bold">최저 타수</div>
                      <div className="text-xs font-black text-emerald-700 mt-0.5">
                        {Math.min(...completedRounds.map((r) => {
                          const me = r.players?.find((p) => p.isSelf) || r.players?.[0];
                          return me?.totalStrokes || (r as any).totalScore || 999;
                        }))}타
                      </div>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="text-[10px] text-stone-500 font-bold">노OB 완주</div>
                      <div className="text-xs font-black text-amber-700 mt-0.5">
                        {completedRounds.filter((r) => {
                          const me = r.players?.find((p) => p.isSelf) || r.players?.[0];
                          const ob = Object.values(me?.obCount || {}).reduce<number>((acc, cur) => acc + (Number(cur) || 0), 0);
                          return ob === 0;
                        }).length}회
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 팝업 하단 닫기 버튼 */}
            <div className="p-3 border-t border-stone-100 shrink-0 bg-white">
              <button
                type="button"
                onClick={() => setShowGradePopup(false)}
                className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-sm transition cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ⛳ 라운드 상세 스코어카드 전용 팝업창 (대표님 지침: 라운드 진행 스코어보드와 100% 동일한 4인 코스별 카드/통합/홀별 상세표 표출) */}
      <RoundScoreboardModal
        round={selectedRoundForPopup}
        courses={courses}
        isOpen={Boolean(selectedRoundForPopup)}
        onClose={() => setSelectedRoundForPopup(null)}
        onDelete={(roundId) => {
          ParkOnStorage.deleteCompletedRound(roundId);
          setCompletedRounds(ParkOnStorage.getCompletedRounds());
        }}
        onUpdate={(updated) => {
          setSelectedRoundForPopup(updated);
          setCompletedRounds(ParkOnStorage.getCompletedRounds());
        }}
      />

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
                {isJapanese ? '閉じる' : '닫기'}
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

                  {/* 1~100위 순위표 (100% 팩트 기반) */}
                  {activeLeaderboard100.skillTop100.length > 0 ? (
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
                                {player.score}{isJapanese ? '打' : '타'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center space-y-2.5 border border-dashed border-stone-200 rounded-2xl bg-stone-50/60">
                      <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 text-xl mx-auto flex items-center justify-center font-black">
                        🏆
                      </div>
                      <div className="text-sm font-black text-stone-800">
                        현재 등록된 공인 실력 순위 기록이 없습니다
                      </div>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                        파크골프 올인원은 가짜·예시 선수 정보를 일절 표출하지 않습니다.<br/>
                        실제 필드에서 공식 클럽전 또는 대회(18홀)를 완주하시면 100% 팩트 기반 공인 순위표에 실시간 등록됩니다.
                      </p>
                    </div>
                  )}

                  {/* 공인 기준 상세 안내 */}
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-amber-900 font-black">
                      <span>💡</span>
                      <span>공인 실력 순위 100% 팩트 집계 기준</span>
                    </div>
                    <p className="text-stone-600 font-medium leading-relaxed">
                      공인 실력 랭킹은 <strong>파크골프 올인원이 인증한 공인 클럽전 또는 공식 대회 18홀 완주 기록만</strong> 정직하게 반영됩니다. 개인 친선 라운드는 등외 점수로 안전하게 분리 평가됩니다.
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
                      <span className="text-emerald-800 text-sm font-black">{activeLeaderboard100.userActivityStatus.rank > 0 ? `${activeLeaderboard100.userActivityStatus.rank}위` : '기록 대기'}</span>
                      <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">
                        {activeLeaderboard100.userActivityStatus.tier}
                      </span>
                    </div>
                    <span className="text-sm font-black text-emerald-800">
                      월 {activeLeaderboard100.userActivityStatus.roundsCount30Days}회 완주
                    </span>
                  </div>

                  {/* 1~100위 순위표 (100% 팩트 기반) */}
                  {activeLeaderboard100.activityTop100.length > 0 ? (
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
                                {isJapanese ? `月 ${player.rounds}回` : `월 ${player.rounds}회`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center space-y-2.5 border border-dashed border-stone-200 rounded-2xl bg-stone-50/60">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 text-xl mx-auto flex items-center justify-center font-black">
                        🔥
                      </div>
                      <div className="text-sm font-black text-stone-800">
                        현재 등록된 필드 활동 순위 기록이 없습니다
                      </div>
                      <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                        파크골프 올인원은 가짜 예시 활동 데이터를 생성하지 않습니다.<br/>
                        해당 구장에서 라운드를 완주하시면 실제 완주 횟수(최근 30일)에 따라 활동 순위표에 실시간 반영됩니다.
                      </p>
                    </div>
                  )}

                  {/* 활동 기준 상세 안내 */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 text-[11px] space-y-1">
                    <div className="flex items-center gap-1 text-emerald-900 font-black">
                      <span>💡</span>
                      <span>필드 활동 지수 100% 팩트 집계 안내</span>
                    </div>
                    <p className="text-stone-600 font-medium leading-relaxed">
                      활동 지수는 <strong>정규 리그나 대회 여부와 관계없이</strong>, 실제 필드를 방문하여 혼자 연습하거나 친선으로 플레이한 모든 완주 기록(하루 2~3회 포함)을 <strong>100% 실시간으로 반영</strong>합니다.
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
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📍 골프장 검색 & 선택 모달 (대표님 지침: 엉뚱한 리스트 노출 금지, 오직 깔끔한 지명/구장 검색 및 결과만 표출) */}
      {showHomeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-300 stroke-[2.5]" />
                <div>
                  <h3 className="font-black text-base leading-tight">
                    {isJapanese ? 'コース検索 & 選択' : '골프장 검색 & 선택'}
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-medium">
                    {isJapanese ? 'コース名・地名を入力して検索してください' : '지명이나 골프장 이름을 입력하여 검색하세요'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowHomeModal(false);
                  setHomeModalSearch('');
                }}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Course Search Input */}
            <div className="p-3.5 bg-stone-100 border-b border-stone-200 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={homeModalSearch}
                  onChange={(e) => setHomeModalSearch(e.target.value)}
                  placeholder={isJapanese ? 'コース名・地名を入力してください' : '지명이나 골프장 이름을 입력하세요'}
                  className="w-full bg-white text-stone-900 pl-9 pr-9 py-2.5 rounded-xl text-xs sm:text-sm border-2 border-emerald-500/60 focus:outline-hidden focus:border-emerald-600 font-bold placeholder:text-stone-400 shadow-inner"
                  autoFocus
                />
                {homeModalSearch && (
                  <button
                    type="button"
                    onClick={() => setHomeModalSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body: 검색어 입력 전 vs 검색 결과 표출 */}
            {!homeModalSearch.trim() ? (
              <div className="p-6 text-center space-y-4 my-auto overflow-y-auto">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl shadow-inner">
                  ⛳
                </div>
                <div>
                  <h4 className="font-black text-stone-800 text-sm sm:text-base">
                    {isJapanese ? 'どのコースをお探しですか？' : '어느 골프장으로 가시나요?'}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed font-medium">
                    {isJapanese
                      ? '上の検索バーにコース名や地域名を入力すると、該当コースがリアルタイムで表示されます。'
                      : '위 검색창에 지역명이나 골프장 이름을 입력하시면 실시간으로 구장이 나타납니다.'}
                  </p>
                </div>

                {/* 인기 검색 지명 칩 */}
                <div className="pt-2">
                  <span className="text-[11px] font-black text-stone-400 block mb-2">
                    💡 빠른 지명 선택
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-xs mx-auto">
                    {['구미', '양평', '대구', '포항', '송도', '화천', '밀양', '경주'].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setHomeModalSearch(tag)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-emerald-100 hover:text-emerald-800 text-stone-700 font-extrabold text-xs rounded-xl border border-stone-200 transition active:scale-95 cursor-pointer"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 전국 구장 전체 지도/목록 링크 */}
                <div className="pt-3 border-t border-stone-100">
                  <Link
                    href="/courses"
                    onClick={() => setShowHomeModal(false)}
                    className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 hover:text-emerald-900"
                  >
                    <span>{isJapanese ? '全国400コース一覧を見る ➔' : '전국 400개 구장 지도 & 전체 목록 보기 ➔'}</span>
                  </Link>
                </div>
              </div>
            ) : (
              (() => {
                const searchResults = courses.filter((c) => {
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
                });

                if (searchResults.length === 0) {
                  return (
                    <div className="p-8 text-center space-y-2 my-auto">
                      <div className="text-3xl">🔍</div>
                      <div className="text-sm font-black text-stone-800">
                        {isJapanese ? '該当するコースが見つかりませんでした' : `'${homeModalSearch}' 검색 결과가 없습니다`}
                      </div>
                      <div className="text-xs text-stone-500 font-medium">
                        {isJapanese
                          ? '他のコース名や地域名で検索してみてください'
                          : '다른 지명(시·군·구)이나 골프장 이름을 입력해 보세요.'}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="p-3 space-y-2 overflow-y-auto divide-y divide-stone-100 flex-1">
                    <div className="text-xs text-stone-500 font-bold px-1 pb-1">
                      검색 결과 ({searchResults.length}개)
                    </div>
                    {searchResults.slice(0, 20).map((sc) => (
                      <div
                        key={sc.id}
                        onClick={() => {
                          handleSelectHomeCourse(sc.id);
                          setShowHomeModal(false);
                          setHomeModalSearch('');
                          router.push(`/round/new?courseId=${sc.id}`);
                        }}
                        className="p-3 rounded-2xl border-2 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 flex items-center justify-between transition cursor-pointer active:scale-[0.99] group bg-white shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="font-black text-stone-900 text-sm sm:text-base flex items-center gap-1.5 group-hover:text-emerald-800 transition">
                            <span>⛳</span>
                            <span>{getLocalizedCourseName(sc)}</span>
                          </div>
                          <div className="text-xs text-stone-500 font-medium mt-0.5">
                            {getLocalizedCourseRegion(sc)} · {formatCourseHolesText(sc)}
                          </div>
                        </div>
                        <span className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition shrink-0 ml-2">
                          {isJapanese ? '選択 ➔' : '선택 ➔'}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}

            {/* Footer */}
            <div className="p-3 bg-stone-50 border-t border-stone-200 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowHomeModal(false);
                  setHomeModalSearch('');
                }}
                className="w-full py-3 bg-stone-900 hover:bg-black text-white font-black rounded-xl text-xs transition cursor-pointer active:scale-[0.99]"
              >
                {isJapanese ? '閉じる' : '닫기'}
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

      {/* 오늘 구장 실시간 종합 정보 모달 (날씨·휴장·잔디리포트·주차장 내비) */}
      {showCourseTodayModal && (() => {
        const targetCourse = homeCourse || getCurrentActiveCourse() || courses[0];
        if (!targetCourse) return null;
        return (
          <CourseTodayModal
            isOpen={showCourseTodayModal}
            onClose={() => setShowCourseTodayModal(false)}
            course={targetCourse}
            onOpenCourseDetail={() => setSelectedCourseForDetail(targetCourse)}
          />
        );
      })()}

      {/* 구장 코스 둘러보기 모달 (홀별 거리·파·공략팁) */}
      {selectedCourseForDetail && (
        <CourseDetailModal
          course={selectedCourseForDetail}
          onClose={() => setSelectedCourseForDetail(null)}
          onSaved={(updated) => {
            ParkOnStorage.updateCourse(updated);
            setSelectedCourseForDetail(updated);
            const all = ParkOnStorage.getAllCourses();
            setCourses(all);
          }}
        />
      )}

      {/* 3단계: 전국 17개 시·도 투어 퍼즐 지도 & 마일스톤 명예 트로피 모달 */}
      <NationalTourMapModal
        isOpen={showNationalTourModal}
        onClose={() => setShowNationalTourModal(false)}
      />

      {/* 💡 초간단 설명서 & 1초 튜토리얼 팝업 */}
      <QuickGuideModal
        isOpen={showQuickGuideModal}
        onClose={() => setShowQuickGuideModal(false)}
        homeCourseId={homeCourse?.id}
      />

      {/* 📸 나의 파크골프 연대기 포토 상세 뷰어 모달 (누가·언제·어디서 + 메모 + 카톡 자랑 카드) */}
      <ChroniclePhotoViewerModal
        isOpen={showPhotoViewerModal}
        onClose={() => setShowPhotoViewerModal(false)}
        photo={selectedPhotoForViewer}
        onPhotoDeleted={(delId) => {
          setChroniclePhotos((prev) => prev.filter((p) => p.id !== delId));
        }}
        onOpenWatermarkCard={(p) => handleOpenWatermarkCardFromPhoto(p)}
      />

      {/* 📷 라운드 현장 사진 올리기 / 업로드 모달 (Canvas 자동 리사이징 & WebP 압축 탑재) */}
      <ChroniclePhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => setShowPhotoUploadModal(false)}
        targetSession={uploadTargetSession}
        completedSessions={completedRounds}
        onPhotoUploaded={(newPhoto) => {
          setChroniclePhotos((prev) => [newPhoto, ...prev]);
          setCompletedRounds(ParkOnStorage.getCompletedRounds());
        }}
      />

      {/* 💾 사진·연대기 안전 로컬 백업 & 복원 모달 */}
      <ChronicleBackupModal
        isOpen={showChronicleBackupModal}
        onClose={() => setShowChronicleBackupModal(false)}
        onDataRestored={() => {
          ChroniclePhotoStorage.getAllPhotos().then((photos) => setChroniclePhotos(photos)).catch(() => {});
          setCompletedRounds(ParkOnStorage.getCompletedRounds());
        }}
      />

      {/* 📤 카톡/밴드 워터마크 자랑 카드 생성 모달 */}
      <WatermarkPhotoCardModal
        isOpen={showWatermarkCardModal}
        onClose={() => setShowWatermarkCardModal(false)}
        session={watermarkCardSession}
        initialImage={watermarkCardInitialImage}
      />

      {/* 🏆 전국 랭킹 상세 팝업 (내 순위 기반 3개 탭 팝업: 내 순위&분석, 주변 라이벌, 전국 1~100위) */}
      <NationalRankingDetailModal
        isOpen={showRankingDetailPopup !== null}
        onClose={() => setShowRankingDetailPopup(null)}
        mode={showRankingDetailPopup || 'SKILL'}
        userExpStats={userExpStats}
        completedRounds={completedRounds}
        userName={userProfile?.userName || (isJapanese ? 'パークゴルファー' : '파크골퍼')}
        activeStatsCourse={activeStatsCourse}
        activeLeaderboard100={activeLeaderboard100}
      />

      {/* 파크골프 올인원 소개 URL 복사 완료 토스트 */}
      {showShareToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-xl border border-stone-700/60 flex items-center gap-2 animate-fadeIn whitespace-nowrap pointer-events-none">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{shareToastMessage}</span>
        </div>
      )}
    </div>
  );
}
