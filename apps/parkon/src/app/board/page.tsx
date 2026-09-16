'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { TournamentNotice, ParkGolfNewsItem, UserVoiceItem, FreeBoardPost } from '@/types/board';
import { BoardStorage, calculateDistanceKm } from '@/lib/boardStorage';
import { ParkOnStorage } from '@/lib/storage';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';

export default function CommunityBoardPage() {
  const [activeTab, setActiveTab] = useState<'NOTICES' | 'NEWS' | 'VOICE' | 'TALK'>('NOTICES');
  const [userName, setUserName] = useState<string>('김대희');
  const [toastMsg, setToastMsg] = useState<string>('');

  // 1. GPS 위치 상태 (실제 브라우저 geolocation 또는 기본값)
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

  // 필터링된 대회 공고
  const filteredNotices = noticesWithDistance.filter((n) => {
    if (!noticeSearchTerm.trim()) return true;
    const term = noticeSearchTerm.trim().toLowerCase();
    return (
      n.title.toLowerCase().includes(term) ||
      n.region.toLowerCase().includes(term) ||
      n.courseName.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 pb-20">
      {/* 1. 상단 타이틀 & GPS 감지 배너 */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-950 to-stone-950 text-white p-4 sm:p-5 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-amber-400 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                <span>게시판 &amp; 파크골프 뉴스</span>
                <span className="text-[10px] bg-amber-400 text-purple-950 px-2 py-0.5 rounded-full font-black">
                  GPS 연동
                </span>
              </h1>
              <p className="text-xs text-purple-200 mt-0.5 font-medium">
                전국 시합 공고 · 내 위치 실시간 뉴스 · 열린 신문고 소통창
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="text-xs bg-white/15 hover:bg-white/25 text-white font-bold py-1.5 px-3 rounded-xl border border-white/20 transition active:scale-95 flex items-center gap-1"
          >
            <Home className="w-3.5 h-3.5 text-amber-300" />
            <span>홈으로</span>
          </Link>
        </div>

        {/* 📍 GPS 실시간 내 위치 & 반경 배너 */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="text-xs text-stone-200">
              현재 내 위치 기준:{' '}
              <strong className="text-amber-300 font-black">
                {gpsLocation ? gpsLocation.regionName : '위치 감지 중...'}
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
            <span>{isGpsLoading ? '위치 측정 중...' : 'GPS 실시간 갱신'}</span>
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
      <div className="p-3">
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
            <span>시합 공고</span>
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
            <span>파크 뉴스</span>
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
            <span>열린 신문고</span>
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
            <span>사랑방 톡</span>
          </button>
        </div>
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
                placeholder="대회명, 개최 지역, 구장명 검색 (예: 구미시장배, 수성, 삼락)"
                className="w-full pl-9 pr-3 py-3 bg-white border border-stone-300 rounded-2xl text-xs font-bold focus:outline-none focus:border-purple-600 shadow-2xs"
              />
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-stone-600 px-1">
              <span>총 {filteredNotices.length}개의 공식 시합 공고</span>
              <span className="text-purple-800 font-black">AI 자동 수집 &amp; 매일 업데이트</span>
            </div>

            {/* 대회 목록 카드 */}
            <div className="space-y-3">
              {filteredNotices.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3 hover:border-purple-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.status === 'RECRUITING' ? (
                          <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                            접수중 ⏳
                          </span>
                        ) : item.status === 'UPCOMING' ? (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                            접수예정 📅
                          </span>
                        ) : (
                          <span className="bg-stone-200 text-stone-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                            마감 🏁
                          </span>
                        )}
                        <span className="text-xs font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                          📍 {item.region}
                        </span>
                        {item.distKm !== null && (
                          <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            🚗 내 위치서 {item.distKm}km
                          </span>
                        )}
                        {item.linkUrl.includes('kpga7330') ? (
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                            ✓ 협회 공인 원본
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                            ✓ 지자체 공인 원본
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-stone-950 leading-snug">
                        {item.title}
                      </h3>
                    </div>
                  </div>

                  {/* 세부 명세 그리드 */}
                  <div className="bg-stone-50 rounded-2xl p-3 text-xs space-y-1.5 border border-stone-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-bold">주최/주관:</span>
                      <span className="font-extrabold text-stone-800">{item.host}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-bold">개최 구장:</span>
                      <span className="font-black text-purple-950">{item.courseName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-bold">접수 기간:</span>
                      <span className="font-black text-emerald-700">{item.periodStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-bold">대회 일시:</span>
                      <span className="font-bold text-stone-800">{item.eventDateStr}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-bold">참가비 / 정원:</span>
                      <span className="font-bold text-stone-800">{item.entryFee} · {item.targetCount}</span>
                    </div>
                  </div>

                  {/* 하단 액션 버튼 */}
                  <div className="flex gap-2 pt-1">
                    <a
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-h-[44px] bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>공식 접수 공고 보기</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const shareText = `📢 [파크온 시합 공고]\n${item.title}\n- 일시: ${item.eventDateStr}\n- 장소: ${item.courseName}\n- 접수: ${item.periodStr}\n\n공식 접수 바로가기: ${item.linkUrl}`;
                        navigator.clipboard?.writeText(shareText);
                        showToast('📋 대회 공고 내용이 복사되었습니다! 단톡방이나 밴드에 공유하세요.');
                      }}
                      className="px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 transition active:scale-95 flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                      title="카톡/밴드 공유"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>공유</span>
                    </button>
                  </div>
                </div>
              ))}
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
                  <h3 className="text-xs font-black text-stone-900">전국 메이저 핵심 헤드라인</h3>
                </div>
                <span className="text-[10px] text-stone-400 font-bold">AI 실시간 요약</span>
              </div>

              <div className="space-y-2.5">
                {news
                  .filter((n) => n.category === 'MAJOR')
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-purple-50/60 rounded-2xl border border-purple-100 space-y-1 hover:bg-purple-100/70 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px] text-purple-900 font-black">
                        <span className="bg-purple-200/80 px-2 py-0.2 rounded">전국 이슈</span>
                        <span className="text-stone-400 font-normal">{item.dateStr}</span>
                      </div>
                      <h4 className="text-xs font-black text-stone-900 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-stone-600 font-medium leading-relaxed">{item.summary}</p>
                    </a>
                  ))}
              </div>
            </div>

            {/* 2. 지역 밀착형 뉴스 + 동호인 직접 제보 버튼 */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-stone-900 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-purple-700" />
                  <span>내 지역 &amp; 전국 시·도 밀착 소식</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowReportNewsModal(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>우리 지역 소식 제보하기</span>
                </button>
              </div>

              {/* 지역 필터 칩 (대한민국 전국 표준 행정 지명 순서) */}
              <div className="flex flex-wrap gap-1">
                {['전체', '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'].map((reg) => (
                  <button
                    key={reg}
                    type="button"
                    onClick={() => setNewsRegionFilter(reg)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      newsRegionFilter === reg
                        ? 'bg-purple-800 text-white border-purple-900 shadow-xs'
                        : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {reg}
                  </button>
                ))}
              </div>

              {/* 지역 뉴스 피드 목록 */}
              <div className="space-y-2.5">
                {news
                  .filter((n) => {
                    if (newsRegionFilter === '전체') return true;
                    return n.region.includes(newsRegionFilter);
                  })
                  .map((item) => (
                    <a
                      key={item.id}
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-1.5 hover:bg-stone-50/80 transition cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-black text-purple-900 bg-purple-50 px-2 py-0.5 rounded">
                          {item.region} · {item.source}
                        </span>
                        <span className="text-stone-400 font-medium">{item.dateStr}</span>
                      </div>
                      <h4 className="text-xs font-black text-stone-900 leading-snug">{item.title}</h4>
                      <p className="text-[11px] text-stone-600 leading-relaxed font-medium">{item.summary}</p>
                    </a>
                  ))}
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
                  <span>김대희 대표 &amp; 개발팀 드림</span>
                </span>
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  24시간 열린 소통
                </span>
              </div>
              <p className="text-xs text-stone-200 leading-relaxed font-medium">
                파크온을 이용하시며 <strong>불편했던 점, 잘못된 구장 정보, 바라는 새 기능</strong>이 있다면
                언제든 남겨주세요! 대표와 개발팀이 모든 글을 직접 정독하고 개선 업데이트로 보답하겠습니다.
              </p>
              <button
                type="button"
                onClick={() => setShowVoiceModal(true)}
                className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4 text-stone-950" />
                <span>✍️ 건의사항 및 개선 의견 남기기</span>
              </button>
            </div>

            {/* 카테고리 필터 */}
            <div className="flex gap-1.5">
              {[
                { key: 'ALL', label: '전체 보기' },
                { key: 'FEATURE', label: '✨ 기능 제안' },
                { key: 'COURSE_INFO', label: '⛳ 구장 정보 수정' },
                { key: 'BUG', label: '🐞 오류/불편 제보' },
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
                            ? '🐞 오류 제보'
                            : v.category === 'FEATURE'
                            ? '✨ 새 기능'
                            : v.category === 'COURSE_INFO'
                            ? '⛳ 구장 정보'
                            : '일반 건의'}
                        </span>
                        {v.status === 'RESOLVED' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            반영 완료 🎉
                          </span>
                        ) : v.status === 'IN_REVIEW' ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                            검토 중 🔍
                          </span>
                        ) : (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                            접수 완료 ⏳
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
                          <span>답변:</span>
                          <span className="text-[11px] text-emerald-700 font-bold">운영팀 공식 회신</span>
                        </div>
                        <p className="text-emerald-900 font-medium leading-relaxed">{v.officialReply}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                      <span className="text-[11px] text-stone-400 font-bold">작성자: {v.authorName}</span>
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
                        <span>저도 공감해요 ({v.likeCount})</span>
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
                <span>동호인 사랑방 한마디 남기기</span>
                <span className="text-[10px] text-stone-400 font-normal">자유롭게 이야기를 나누세요</span>
              </div>
              <textarea
                value={talkInput}
                onChange={(e) => setTalkInput(e.target.value)}
                rows={3}
                placeholder="오늘 라운딩 날씨, 장비 후기, 파크골프 이야기 등 무엇이든 편하게 적어보세요."
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-2xl text-xs font-bold leading-relaxed resize-none focus:outline-none focus:border-purple-600 focus:bg-white"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-98 cursor-pointer"
              >
                사랑방에 글 올리기
              </button>
            </form>

            {/* 피드 목록 */}
            <div className="space-y-2.5">
              {posts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl p-3.5 border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-stone-900 font-black flex items-center gap-1.5">
                      <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-900 flex items-center justify-center text-[10px] font-black">
                        {p.authorName.slice(0, 1)}
                      </span>
                      <span>{p.authorName}</span>
                      {p.region && (
                        <span className="text-[10px] text-stone-500 font-normal">({p.region})</span>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400 font-normal">{p.createdAt}</span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed font-medium">{p.content}</p>
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
    </div>
  );
}
