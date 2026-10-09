'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Newspaper,
  Trophy,
  MessageSquare,
  Sparkles,
  MapPin,
  Calendar,
  ExternalLink,
  Share2,
  ThumbsUp,
  Search,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Compass,
  Home,
  Check,
  FileText,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { TournamentNotice, ParkGolfNewsItem, UserVoiceItem, FreeBoardPost } from '@/types/board';
import { BoardStorage, calculateDistanceKm } from '@/lib/boardStorage';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { TournamentDetailModal } from '@/components/TournamentDetailModal';
import { NewsDetailModal } from '@/components/NewsDetailModal';
import { resolveNoticeDisplay, resolveNewsDisplay, formatBilingualRegion } from '@/lib/bilingualBoardHelper';

export default function CommunityBoardPage() {
  const router = useRouter();
  const { isJapanese } = useTranslation();
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'NEWS' | 'VOICE' | 'TALK'>('NOTICES');
  const [userName, setUserName] = useState<string>(() => (typeof window !== 'undefined' ? ParkOnStorage.getUserDisplayName() || '' : ''));
  const [toastMsg, setToastMsg] = useState<string>('');

  // 1. 국가 필터 (전체 / 한국 / 일본)
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'KR' | 'JP'>('ALL');

  // 2. 팝업 상세 모달 상태
  const [selectedNotice, setSelectedNotice] = useState<TournamentNotice | null>(null);
  const [selectedNews, setSelectedNews] = useState<ParkGolfNewsItem | null>(null);

  // 3. GPS 위치 상태 (실제 브라우저 geolocation 또는 기본값)
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number; regionName: string } | null>(null);
  const [isGpsLoading, setIsGpsLoading] = useState(false);
  const [gpsRangeKm, setGpsRangeKm] = useState<number>(30); // 30km 반경 기본

  // 2. 데이터 상태
  const [notices, setNotices] = useState<TournamentNotice[]>([]);
  const [news, setNews] = useState<ParkGolfNewsItem[]>([]);
  const [voices, setUserVoices] = useState<UserVoiceItem[]>([]);
  const [posts, setPosts] = useState<FreeBoardPost[]>([]);

  // 3. 필터 및 검색 상태
  const [noticeSearchTerm, setNoticeSearchTerm] = useState('');
  const [newsRegionFilter, setNewsRegionFilter] = useState('전체');
  const [voiceCategoryFilter, setVoiceCategoryFilter] = useState<'ALL' | 'BUG' | 'FEATURE' | 'COURSE_INFO'>('ALL');

  // 4. 모달 상태
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceContent, setVoiceContent] = useState('');
  const [voiceCategory, setVoiceCategory] = useState<UserVoiceItem['category']>('FEATURE');

  const [showReportNewsModal, setShowReportNewsModal] = useState(false);
  const [reportTitle, setReportTitle] = useState('');
  const [reportSummary, setReportSummary] = useState('');
  const [reportRegion, setReportRegion] = useState('경북');

  const [talkInput, setTalkInput] = useState('');

  // 초기 로딩
  useEffect(() => {
    setUserName(ParkOnStorage.getUserDisplayName());
    setNotices(BoardStorage.getNotices());
    setNews(BoardStorage.getNews());
    setUserVoices(BoardStorage.getUserVoices());
    setPosts(BoardStorage.getPosts());

    // 저장된 GPS 위치 불러오기
    const savedLoc = BoardStorage.getUserLocation();
    if (savedLoc) {
      setGpsLocation(savedLoc);
    } else {
      // 기본 구미/대구 중심 세팅
      setGpsLocation({ lat: 36.10398, lng: 128.3756, regionName: '경북 구미시' });
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // 실시간 GPS 위치 동기화 실행
  const requestCurrentGps = () => {
    if (!navigator.geolocation) {
      alert('현재 브라우저에서 GPS 위치 권한을 지원하지 않습니다.');
      return;
    }
    setIsGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // 위경도로부터 가장 가까운 기본 구장 탐색하여 지역명 추론
        let closestCourse = DEFAULT_COURSES[0];
        let minD = 999999;
        DEFAULT_COURSES.forEach((c) => {
          if (c.lat && c.lng) {
            const d = calculateDistanceKm(lat, lng, c.lat, c.lng);
            if (d < minD) {
              minD = d;
              closestCourse = c;
            }
          }
        });

        const newLoc = { lat, lng, regionName: closestCourse.region || '내 위치' };
        setGpsLocation(newLoc);
        BoardStorage.setUserLocation(lat, lng, closestCourse.region || '내 위치');
        setIsGpsLoading(false);
        showToast(`📍 GPS 위치 수신 완료: '${closestCourse.region}' 반경 기준 동기화!`);
      },
      (err) => {
        console.warn('GPS failed', err);
        setIsGpsLoading(false);
        showToast('📍 GPS 권한이 차단되어 기본 지역(경북 구미) 기준으로 설정되었습니다.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // 고객 건의 등록 핸들러
  const handleCreateVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceTitle.trim() || !voiceContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }
    BoardStorage.addUserVoice({
      authorName: userName,
      category: voiceCategory,
      title: voiceTitle,
      content: voiceContent,
    });
    setUserVoices(BoardStorage.getUserVoices());
    setShowVoiceModal(false);
    setVoiceTitle('');
    setVoiceContent('');
    showToast('💡 소중한 의견이 열린 신문고에 등록되었습니다! 대표/운영팀이 신속히 검토합니다.');
  };

  // 지역 뉴스 제보 등록 핸들러
  const handleCreateReportNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportSummary.trim()) {
      alert('제목과 소식 요약을 입력해 주세요.');
      return;
    }
    BoardStorage.addUserReportNews({
      title: reportTitle,
      summary: reportSummary,
      region: reportRegion,
      authorName: userName,
    });
    setNews(BoardStorage.getNews());
    setShowReportNewsModal(false);
    setReportTitle('');
    setReportSummary('');
    showToast('📰 우리 지역 파크골프 소식이 전국 게시판에 등록되었습니다!');
  };

  // 사랑방 글 작성 핸들러
  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!talkInput.trim()) return;
    BoardStorage.addPost(userName, gpsLocation?.regionName || '전국', talkInput);
    setPosts(BoardStorage.getPosts());
    setTalkInput('');
    showToast('💬 사랑방에 한마디가 등록되었습니다!');
  };

  // 공감 좋아요 토글
  const handleVoiceLike = (id: string) => {
    BoardStorage.toggleVoiceLike(id);
    setUserVoices(BoardStorage.getUserVoices());
  };

  // 거리 계산된 대회 공고 목록
  const noticesWithDistance = notices.map((n) => {
    let distKm: number | null = null;
    if (gpsLocation && n.lat && n.lng) {
      distKm = calculateDistanceKm(gpsLocation.lat, gpsLocation.lng, n.lat, n.lng);
    }
    return { ...n, distKm };
  });

  // 필터링된 대회 공고 (국가 필터 + 한일 양국어 검색 연동)
  const filteredNotices = noticesWithDistance.filter((n) => {
    if (countryFilter !== 'ALL' && (n.country || 'KR') !== countryFilter) {
      return false;
    }
    if (!noticeSearchTerm.trim()) return true;
    const term = noticeSearchTerm.trim().toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      (n.titleKo && n.titleKo.toLowerCase().includes(term)) ||
      (n.titleJa && n.titleJa.toLowerCase().includes(term)) ||
      n.region.toLowerCase().includes(term) ||
      n.courseName.toLowerCase().includes(term) ||
      (n.courseNameKo && n.courseNameKo.toLowerCase().includes(term)) ||
      (n.courseNameJa && n.courseNameJa.toLowerCase().includes(term)) ||
      (n.host && n.host.toLowerCase().includes(term))
    );
  });

  // 필터링 및 한·일 언어별 최적 정렬 (일본어 모드 시 일본 대회 우선 상단 배치)
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    if (isJapanese) {
      if (a.country === 'JP' && b.country !== 'JP') return -1;
      if (a.country !== 'JP' && b.country === 'JP') return 1;
    } else {
      if ((a.country || 'KR') === 'KR' && b.country === 'JP') return -1;
      if (a.country === 'JP' && (b.country || 'KR') === 'KR') return 1;
    }
    return 0;
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20">
      {/* 1. 상단 타이틀 & GPS 감지 배너 */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-stone-950 text-white p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white whitespace-nowrap">
                {isJapanese ? '掲示板 ＆ ニュース' : '게시판 & 뉴스'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/"
              className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold py-1.5 px-3 rounded-xl border border-white/20 transition active:scale-95 flex items-center gap-1 shrink-0 whitespace-nowrap"
            >
              <Home className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span className="whitespace-nowrap">{isJapanese ? 'ホーム' : '홈으로'}</span>
            </Link>
            {/* 대표님 요청: 상단 우측 닫기 (X) 버튼 누르면 항상 직전 화면으로 복귀 */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  router.back();
                } else {
                  router.push('/');
                }
              }}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-white/15 rounded-xl border border-white/20 transition cursor-pointer flex items-center justify-center shrink-0"
              title={isJapanese ? '閉じる (直前の画面へ)' : '닫기 (이전 화면으로)'}
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>

        {/* 📍 GPS 실시간 내 위치 & 반경 배너 */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs text-stone-200">
              {isJapanese ? '現在位置基準: ' : '현재 내 위치 기준: '}
              <strong className="text-amber-300 font-black">
                {gpsLocation
                  ? (isJapanese ? formatBilingualRegion(gpsLocation.regionName, true) : gpsLocation.regionName)
                  : (isJapanese ? '位置検出中...' : '위치 감지 중...')}
              </strong>
            </span>
          </div>
          <button
            type="button"
            onClick={requestCurrentGps}
            disabled={isGpsLoading}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
          >
            <Compass className={`w-3.5 h-3.5 ${isGpsLoading ? 'animate-spin' : ''}`} />
            <span>
              {isGpsLoading
                ? (isJapanese ? '位置測定中...' : '위치 측정 중...')
                : (isJapanese ? 'GPS更新' : 'GPS 실시간 갱신')}
            </span>
          </button>
        </div>
      </div>

      {/* 토스트 피드백 */}
      {toastMsg && (
        <div className="fixed bottom-6 inset-x-4 max-w-sm mx-auto z-[9999] bg-stone-950/95 text-white text-xs font-black p-4 rounded-2xl shadow-2xl border-2 border-amber-400 flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <button type="button" onClick={() => setToastMsg('')} className="text-stone-400 ml-2">
            ✕
          </button>
        </div>
      )}

      {/* 2. 4대 전문 탭 (시니어 52px+ 대형 규격) */}
      <div className="p-3 space-y-2.5">
        {/* 📚 파크골프 공인 전문 가이드 10선 배너 */}
        <Link
          href="/guide"
          className="block bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white p-3 rounded-2xl shadow-sm border border-emerald-600/60 hover:border-amber-400 transition group"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center text-sm font-black shrink-0 shadow-xs">
                📚
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded-md">
                    {isJapanese ? '必読コラム' : '필독 칼럼'}
                  </span>
                  <span className="text-xs font-black text-white truncate">
                    {isJapanese ? 'パークゴルフ公式専門ガイド 10選' : '파크골프 공인 전문 가이드 10선'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-200 truncate mt-0.5">
                  {isJapanese ? '基本姿勢・ルール・用具選び・コース攻略の完全解説' : '입문·장비선택·장타스윙·OB벌타·이븐파 공략법 총정리'}
                </p>
              </div>
            </div>
            <span className="text-xs bg-white text-emerald-950 px-2.5 py-1 rounded-xl font-black shrink-0 group-hover:bg-amber-300 transition flex items-center gap-0.5">
              <span>{isJapanese ? '読む' : '보기'}</span>
              <span>&gt;</span>
            </span>
          </div>
        </Link>

        <div className="grid grid-cols-4 p-1.5 bg-white rounded-2xl border-2 border-stone-200 shadow-sm gap-1 text-[11px] font-black text-stone-700">
          <button
            type="button"
            onClick={() => setActiveTab('NOTICES')}
            className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'NOTICES'
                ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-md'
                : 'hover:bg-stone-50'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span>{isJapanese ? '大会公示' : '시합 공고'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('NEWS')}
            className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'NEWS'
                ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-md'
                : 'hover:bg-stone-50'
            }`}
          >
            <Newspaper className="w-4 h-4 text-amber-300" />
            <span>{isJapanese ? 'ニュース' : '파크 뉴스'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('VOICE')}
            className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'VOICE'
                ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-md'
                : 'hover:bg-stone-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{isJapanese ? 'オープン広場' : '열린 신문고'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TALK')}
            className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              activeTab === 'TALK'
                ? 'bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-md'
                : 'hover:bg-stone-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>{isJapanese ? 'サロントーク' : '사랑방 톡'}</span>
          </button>
        </div>

        {/* 한·일 국가 교차 필터 탭 (시합 공고 및 파크 뉴스 탭에서 즉시 상호 전환) */}
        {(activeTab === 'NOTICES' || activeTab === 'NEWS') && (
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-white rounded-2xl border-2 border-stone-200 shadow-2xs text-xs font-black">
            <button
              type="button"
              onClick={() => setCountryFilter('ALL')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                countryFilter === 'ALL'
                  ? 'bg-purple-900 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>🌏</span>
              <span>{isJapanese ? '韓日全体' : '한·일 전체'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCountryFilter('KR')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                countryFilter === 'KR'
                  ? 'bg-blue-800 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className={`px-1 py-0.2 rounded text-[9px] font-black ${countryFilter === 'KR' ? 'bg-blue-900 text-blue-100 border border-blue-400' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>KR</span>
              <span>{isJapanese ? '韓国' : '대한민국'}</span>
            </button>
            <button
              type="button"
              onClick={() => setCountryFilter('JP')}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                countryFilter === 'JP'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span className={`px-1 py-0.2 rounded text-[9px] font-black ${countryFilter === 'JP' ? 'bg-rose-900 text-rose-100 border border-rose-400' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>JP</span>
              <span>{isJapanese ? '日本 (NPGA)' : '일본 (NPGA)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. 탭별 콘텐츠 본문 */}
      <main className="px-3 space-y-4">
        {/* ======================================================== */}
        {/* 탭 1: 🏆 [전국 시합·대회 공고 (GPS 거리순 연동)] */}
        {/* ======================================================== */}
        {activeTab === 'NOTICES' && (
          <div className="space-y-3.5">
            {/* 검색창 */}
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={noticeSearchTerm}
                onChange={(e) => setNoticeSearchTerm(e.target.value)}
                placeholder={isJapanese ? '大会名、開催地域、球場名検索 (例: 幕別、札幌、久留米)' : '대회명, 개최 지역, 구장명 검색 (예: 구미시장배, 수성, 삼락)'}
                className="w-full pl-9 pr-3 py-3 bg-white border border-stone-300 rounded-2xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-stone-600 px-1">
              <span>{isJapanese ? `計 ${sortedNotices.length}件の公式大会公示` : `총 ${sortedNotices.length}개의 공식 시합 공고`}</span>
              <span className="text-purple-800 font-black">{isJapanese ? 'AI自動収集 ＆ 毎日更新' : 'AI 자동 수집 & 매일 업데이트'}</span>
            </div>

            {/* 대회 목록: 대표님 요청 콤팩트 제목/제원 리스트 (클릭 시 풀스크린 상세 팝업 오픈) */}
            <div className="space-y-2">
              {sortedNotices.map((item) => {
                const display = resolveNoticeDisplay(item, isJapanese);
                const displayTitle = display.title;
                const displayCourse = display.courseName;
                const displayHost = display.host;
                const displayRegion = display.region;
                const displayDate = display.eventDateStr;
                const displayFee = display.entryFee;
                const isJp = display.isJp;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNotice(item)}
                    className="bg-white rounded-2xl p-4 border border-stone-300 shadow-2xs hover:border-purple-600 hover:shadow-md transition cursor-pointer active:scale-[0.99] flex items-center justify-between gap-3 group min-h-[68px]"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* 1행: 상태 배지 + 국가/지역 + 거리 + 접수/대회일시 */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === 'RECRUITING' ? (
                          <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-black px-2 py-0.5 rounded-md">
                            {isJapanese ? '受付中 ⏳' : '접수중 ⏳'}
                          </span>
                        ) : item.status === 'UPCOMING' ? (
                          <span className="bg-amber-100 text-amber-950 border border-amber-300 text-xs font-black px-2 py-0.5 rounded-md">
                            {isJapanese ? '予定 📅' : '접수예정 📅'}
                          </span>
                        ) : (
                          <span className="bg-stone-200 text-stone-800 text-xs font-black px-2 py-0.5 rounded-md">
                            {isJapanese ? '締切 🏁' : '마감 🏁'}
                          </span>
                        )}
                        <span className={`text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                          isJp
                            ? 'text-rose-950 bg-rose-50 border-rose-300'
                            : 'text-blue-950 bg-blue-50 border-blue-300'
                        }`}>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-black text-white ${isJp ? 'bg-rose-600' : 'bg-blue-600'}`}>
                            {isJp ? 'JP' : 'KR'}
                          </span>
                          <span>{displayRegion}</span>
                        </span>
                        {item.distKm !== null && !isJapanese && (
                          <span className="text-xs font-black text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                            🚗 {item.distKm}km
                          </span>
                        )}
                        <span className="text-xs text-stone-600 font-bold ml-auto sm:ml-0">
                          {displayDate}
                        </span>
                      </div>

                      {/* 2행: 대회 제목 (한국어/일본어 자동 반영 - 시니어 16px 가독성) */}
                      <h3 className="text-sm sm:text-base font-black text-stone-950 leading-snug group-hover:text-purple-900 transition truncate">
                        {displayTitle}
                      </h3>

                      {/* 3행: 제원 한줄 요약 (구장 · 주최 · 참가비) */}
                      <div className="text-xs text-stone-600 font-semibold truncate flex items-center gap-1.5">
                        <span className="font-extrabold text-stone-800">⛳ {displayCourse}</span>
                        <span>·</span>
                        <span className="truncate">{displayHost}</span>
                        {displayFee && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-700 font-extrabold">{displayFee}</span>
                          </>
                        )}
                        {item.pdfUrl && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                            PDF
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 우측 바로가기 화살표 버튼 */}
                    <div className="flex items-center gap-1 shrink-0 text-stone-400 group-hover:text-purple-700">
                      <span className="hidden sm:inline text-xs font-black text-purple-800 bg-purple-100 px-2.5 py-1.5 rounded-xl border border-purple-200">
                        {isJapanese ? '詳細 ➔' : '상세보기 ➔'}
                      </span>
                      <ChevronRight className="w-5 h-5 text-purple-700" />
                    </div>
                  </div>
                );
              })}

              {filteredNotices.length === 0 && (
                <div className="bg-white rounded-2xl p-8 text-center border border-stone-200 text-stone-500 space-y-2">
                  <p className="text-xs font-bold">
                    {isJapanese ? '該当する大会公示がありません。' : '조건에 맞는 시합 공고가 없습니다.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCountryFilter('ALL');
                      setNoticeSearchTerm('');
                    }}
                    className="text-xs text-purple-700 font-black underline cursor-pointer"
                  >
                    {isJapanese ? '全体表示' : '전체 보기로 돌아가기'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 탭 2: 📰 [전국 & 지역 파크골프 뉴스 (동호인 제보 연동)] */}
        {/* ======================================================== */}
        {activeTab === 'NEWS' && (
          <div className="space-y-4">
            {/* 1. 전국 메이저 헤드라인 뉴스 (상단 요약) */}
            <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">📢</span>
                  <h3 className="text-xs font-black text-stone-900">
                    {isJapanese ? '主要ヘッドラインニュース' : '전국 메이저 핵심 헤드라인'}
                  </h3>
                </div>
                <span className="text-[10px] text-stone-400 font-bold">
                  {isJapanese ? 'AI自動要約' : 'AI 실시간 요약'}
                </span>
              </div>

              <div className="space-y-2">
                {news
                  .filter((n) => {
                    if (countryFilter !== 'ALL' && (n.country || 'KR') !== countryFilter) return false;
                    return n.category === 'MAJOR';
                  })
                  .map((item) => {
                    const display = resolveNewsDisplay(item, isJapanese);
                    const displayTitle = display.title;
                    const displaySummary = display.summary;
                    const isJp = display.isJp;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedNews(item)}
                        className="p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1 hover:bg-purple-100/70 transition cursor-pointer active:scale-[0.99] group"
                      >
                        <div className="flex items-center justify-between text-[11px] text-purple-900 font-black">
                          <span className="bg-purple-200/80 px-2 py-0.2 rounded flex items-center gap-1">
                            <span>{isJp ? '🇯🇵' : '🇰🇷'}</span>
                            <span>{isJp ? '日本 NPGA' : (isJapanese ? '全国イシュー' : '전국 이슈')}</span>
                          </span>
                          <span className="text-stone-400 font-normal">{display.dateStr}</span>
                        </div>
                        <h4 className="text-xs font-black text-stone-900 leading-snug group-hover:text-purple-950 transition">
                          {displayTitle}
                        </h4>
                        <p className="text-[11px] text-stone-600 font-medium leading-relaxed line-clamp-2">
                          {displaySummary}
                        </p>
                        <div className="flex justify-end pt-1">
                          <span className="text-[10px] font-black text-purple-700 flex items-center gap-0.5">
                            <span>{isJapanese ? '詳細を見る' : '자세히 보기'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. 지역 밀착형 뉴스 + 동호인 직접 제보 버튼 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" />
                  <span>{isJapanese ? '地域密着ニュース' : '내 지역 & 전국 시·도 밀착 소식'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportNewsModal(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isJapanese ? '地域ニュース提供' : '우리 지역 소식 제보하기'}</span>
                </button>
              </div>

              {/* 지역 필터 칩 (한국 / 일본에 맞춰 지역 필터 노출) */}
              <div className="flex flex-wrap gap-1">
                {(countryFilter === 'JP'
                  ? (isJapanese ? ['全体', '北海道', '東北', '関東', '関西', '九州'] : ['전체', '홋카이도', '도호쿠', '간토', '간사이', '규슈'])
                  : (isJapanese
                    ? ['全体', 'ソウル', '京畿', '大邱', '慶北', '釜山', '慶南', '江原', '全羅', '忠清', '済州']
                    : ['전체', '서울', '경기', '대구', '경북', '부산', '경남', '강원', '전북', '전남', '충북', '충남', '제주'])
                ).map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setNewsRegionFilter(reg === '全体' ? '전체' : reg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      (newsRegionFilter === reg || (newsRegionFilter === '전체' && reg === '全体'))
                        ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              {/* 지역 뉴스 피드 목록 */}
              <div className="space-y-2">
                {news
                  .filter((n) => {
                    if (countryFilter !== 'ALL' && (n.country || 'KR') !== countryFilter) return false;
                    if (newsRegionFilter === '전체' || newsRegionFilter === '全体') return true;
                    return n.region.includes(newsRegionFilter);
                  })
                  .map((item) => {
                    const display = resolveNewsDisplay(item, isJapanese);
                    const displayTitle = display.title;
                    const displaySummary = display.summary;
                    const isJp = display.isJp;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedNews(item)}
                        className="bg-white rounded-2xl p-3 border border-stone-200 shadow-2xs space-y-1.5 hover:bg-stone-50/90 transition cursor-pointer active:scale-[0.99] group"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded flex items-center gap-1">
                            <span>{isJp ? '🇯🇵' : '🇰🇷'}</span>
                            <span>{display.region} · {display.source}</span>
                          </span>
                          <span className="text-stone-400 font-medium">{display.dateStr}</span>
                        </div>
                        <h4 className="text-xs font-black text-stone-900 leading-snug group-hover:text-purple-900 transition">
                          {displayTitle}
                        </h4>
                        <p className="text-[11px] text-stone-600 leading-relaxed font-medium line-clamp-2">
                          {displaySummary}
                        </p>
                        <div className="flex justify-end pt-0.5">
                          <span className="text-[10px] font-black text-purple-700 flex items-center gap-0.5">
                            <span>{isJapanese ? '詳細を見る' : '자세히 보기'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 탭 3: 💡 [열린 신문고 (고객 건의 & 오류 제보 소통창)] */}
        {/* ======================================================== */}
        {activeTab === 'VOICE' && (
          <div className="space-y-3.5">
            {/* 대표 인사 및 취지 안내 카드 */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 via-teal-950 to-stone-950 text-white rounded-3xl shadow-sm space-y-2 border border-emerald-500/40">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>{isJapanese ? '金大熙(キム・デヒ)代表 ＆ 開発チームより' : '김대희 대표 & 개발팀 드림'}</span>
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  {isJapanese ? '24時間オープン疎通' : '24시간 열린 소통'}
                </span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed font-medium">
                {isJapanese
                  ? 'パークゴルフ オールインワンをご利用いただき、不便な点、修正が必要な球場情報、ご希望の新機能がございましたら、いつでもお気軽にお寄せください。代表と開発チームが直接確認し、改善アップデートでお応えいたします。'
                  : '파크골프 올인원을 이용하시며 불편했던 점, 잘못된 구장 정보, 바라는 새 기능이 있다면 언제든 남겨주세요! 대표와 개발팀이 모든 글을 직접 정독하고 개선 업데이트로 보답하겠습니다.'}
              </p>
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-stone-950" />
                <span>{isJapanese ? '✍️ ご意見・改善リクエストを残す' : '✍️ 건의사항 및 개선 의견 남기기'}</span>
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-1.5">
              {[
                { key: 'ALL', label: isJapanese ? 'すべて見る' : '전체 보기' },
                { key: 'FEATURE', label: isJapanese ? '✨ 新機能提案' : '✨ 기능 제안' },
                { key: 'COURSE_INFO', label: isJapanese ? '⛳ 球場情報修正' : '⛳ 구장 정보 수정' },
                { key: 'BUG', label: isJapanese ? '🐞 不具合報告' : '🐞 오류/불편 제보' },
              ].map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setVoiceCategoryFilter(cat.key as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    voiceCategoryFilter === cat.key
                      ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* 건의글 리스트 */}
            <div className="space-y-3">
              {voices
                .filter((v) => {
                  if (voiceCategoryFilter === 'ALL') return true;
                  return v.category === voiceCategoryFilter;
                })
                .map((v) => (
                  <div
                    key={v.id}
                    className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                          {v.category === 'BUG'
                            ? (isJapanese ? '🐞 不具合報告' : '🐞 오류 제보')
                            : v.category === 'FEATURE'
                            ? (isJapanese ? '✨ 新機能' : '✨ 새 기능')
                            : v.category === 'COURSE_INFO'
                            ? (isJapanese ? '⛳ 球場情報' : '⛳ 구장 정보')
                            : (isJapanese ? '一般提案' : '일반 건의')}
                        </span>
                        {v.status === 'RESOLVED' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {isJapanese ? '反映完了 🎉' : '반영 완료 🎉'}
                          </span>
                        ) : v.status === 'IN_REVIEW' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            {isJapanese ? '検討中 🔍' : '검토 중 🔍'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            {isJapanese ? '受付完了 ⏳' : '접수 완료 ⏳'}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400 font-medium">{v.createdAt}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-stone-900">{v.title}</h4>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed font-medium">{v.content}</p>
                    </div>

                    {/* 대표 / 운영팀 공식 답변 블록 */}
                    {v.officialReply && (
                      <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs space-y-1">
                        <div className="flex items-center gap-1 font-black text-emerald-950">
                          <span>{isJapanese ? '回答:' : '답변:'}</span>
                          <span className="text-[11px] text-emerald-700 font-bold">{isJapanese ? '運営チーム公式返信' : '운영팀 공식 회신'}</span>
                        </div>
                        <p className="text-emerald-900 font-medium leading-relaxed">{v.officialReply}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <span className="text-[11px] text-stone-400 font-bold">{isJapanese ? '作成者:' : '작성자:'} {v.authorName}</span>
                      <button
                        type="button"
                        onClick={() => handleVoiceLike(v.id)}
                        className={`px-2.5 py-1 rounded-lg font-black flex items-center gap-1 transition cursor-pointer ${
                          v.likedByMe
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-200'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>{isJapanese ? `共感 (${v.likeCount})` : `저도 공감해요 (${v.likeCount})`}</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 탭 4: 💬 [동호인 사랑방 자유 토크] */}
        {/* ======================================================== */}
        {activeTab === 'TALK' && (
          <div className="space-y-3.5">
            {/* 자유 한마디 입력창 */}
            <form onSubmit={handleCreatePost} className="bg-white rounded-3xl p-3.5 border border-stone-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-stone-800">
                <span>{isJapanese ? '愛好者サロントーク 一言残す' : '동호인 사랑방 한마디 남기기'}</span>
                <span className="text-[10px] text-stone-400 font-normal">{isJapanese ? '自由にお話しください' : '자유롭게 이야기를 나누세요'}</span>
              </div>
              <textarea
                value={talkInput}
                onChange={(e) => setTalkInput(e.target.value)}
                rows={3}
                placeholder={isJapanese ? '今日のラウンドの感想、道具レビュー、パークゴルフのお話など、ご自由にお書きください。' : '오늘 라운딩 날씨, 장비 후기, 파크골프 이야기 등 무엇이든 편하게 적어보세요.'}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold leading-relaxed resize-none focus:outline-none focus:border-purple-600 focus:bg-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-98 cursor-pointer"
              >
                {isJapanese ? 'サロンに投稿する' : '사랑방에 글 올리기'}
              </button>
            </form>

              {/* 피드 목록 (시니어 가독성 p-4, 16px 본문) */}
              <div className="space-y-3">
                {posts.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl p-4 border border-stone-300 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <span className="text-stone-900 font-black flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center text-xs font-black border border-purple-200">
                          {p.authorName.slice(0, 1)}
                        </span>
                        <span className="text-sm font-extrabold">{p.authorName}</span>
                        {p.region && (
                          <span className="text-xs text-stone-500 font-normal">({p.region})</span>
                        )}
                      </span>
                      <span className="text-xs text-stone-400 font-normal">{p.createdAt}</span>
                    </div>
                    <p className="text-sm sm:text-base text-stone-800 leading-relaxed font-semibold">{p.content}</p>
                  </div>
                ))}
              </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* 팝업 1: 고객 건의 & 오류 제보 작성 모달 */}
      {/* ======================================================== */}
      {showVoiceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">열린 신문고 건의 &amp; 제보 작성</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVoice} className="p-4 space-y-3 text-stone-800">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">건의 유형 *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { key: 'FEATURE', label: '✨ 기능 제안' },
                    { key: 'COURSE_INFO', label: '⛳ 구장 정보' },
                    { key: 'BUG', label: '🐞 오류 제보' },
                  ].map((cat) => (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => setVoiceCategory(cat.key as any)}
                      className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                        voiceCategory === cat.key
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-stone-50 text-stone-700 border-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">건의 제목 *</label>
                <input
                  type="text"
                  value={voiceTitle}
                  onChange={(e) => setVoiceTitle(e.target.value)}
                  placeholder="예: 클럽 대항전 관련 새로운 아이디어 제안합니다"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">세부 내용 *</label>
                <textarea
                  value={voiceContent}
                  onChange={(e) => setVoiceContent(e.target.value)}
                  rows={4}
                  placeholder="어떤 점이 불편하셨거나 어떤 기능이 추가되면 좋을지 자세히 적어주시면 신속히 검토하여 반영하겠습니다."
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold leading-relaxed resize-none focus:outline-none focus:border-emerald-600"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceModal(false)}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  열린 신문고에 등록
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 팝업 2: 우리 지역 파크골프 소식 제보 모달 */}
      {/* ======================================================== */}
      {showReportNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-800 to-purple-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-amber-300" />
                <h3 className="font-extrabold text-base">우리 지역 파크골프 소식 제보</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowReportNewsModal(false)}
                className="text-stone-300 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReportNews} className="p-4 space-y-3 text-stone-800">
              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">해당 지역 선택 *</label>
                <select
                  value={reportRegion}
                  onChange={(e) => setReportRegion(e.target.value)}
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                >
                  {['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                    <option key={reg} value={reg}>
                      {reg} 지역
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">소식 제목 *</label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="예: 구미 동락 파크골프장 가을맞이 클럽 친선대회 성료"
                  className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-stone-800">소식 요약 내용 *</label>
                <textarea
                  value={reportSummary}
                  onChange={(e) => setReportSummary(e.target.value)}
                  rows={4}
                  placeholder="새로운 구장 개장 소식이나 클럽 대회 결과, 잔디 상태 등을 자유롭게 알려주세요."
                  className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold leading-relaxed resize-none focus:outline-none focus:border-purple-600"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowReportNewsModal(false)}
                  className="w-1/3 py-3 bg-stone-100 text-stone-600 font-bold text-xs rounded-xl"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-md cursor-pointer"
                >
                  지역 뉴스 등록하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. 시합 공고 상세 팝업 모달 (한일 원클릭 번역 연동) */}
      <TournamentDetailModal
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />

      {/* 6. 파크 뉴스 상세 팝업 모달 (한일 원클릭 번역 연동) */}
      <NewsDetailModal
        news={selectedNews}
        onClose={() => setSelectedNews(null)}
      />
    </div>
  );
}
