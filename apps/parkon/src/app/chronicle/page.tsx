'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Award, 
  Calendar, 
  MapPin, 
  Users, 
  Heart, 
  Sparkles, 
  QrCode, 
  Flame, 
  ChevronRight, 
  ShieldCheck, 
  Compass, 
  CheckCircle2, 
  Star,
  Home,
  Zap,
  Play,
  Swords,
  Share2,
  Phone,
  Mail,
  Building2,
  Briefcase,
  X,
  Copy,
  Check,
  KeyRound,
} from 'lucide-react';
import { ParkOnStorage } from '@/lib/storage';
import { ClubStorage } from '@/lib/clubStorage';
import { CompanionStorage, Companionship, CompanionLightningRound } from '@/lib/companionStorage';
import { BusinessCardStorage } from '@/lib/businessCardStorage';
import { UserBusinessCard } from '@/types/businessCard';
import { CompanionQRModal } from '@/components/CompanionQRModal';
import { CompanionFeedWidget } from '@/components/CompanionFeedWidget';
import { CompanionLightningModal } from '@/components/CompanionLightningModal';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { getSavedMemberCode } from '@/lib/memberCodeUtils';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { formatPlayerDisplayName } from '@/lib/playerUtils';
import { PILGRIMAGE_COURSES, PilgrimageStorage, PilgrimageCourse } from '@/lib/pilgrimageStorage';
import { PilgrimageDetailModal } from '@/components/PilgrimageDetailModal';

function ChronicleContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, isJapanese, isEnglish } = useTranslation();
  const addFriendParam = searchParams.get('addFriend');

  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [memberCode, setMemberCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMode, setLoginModalMode] = useState<'login' | 'profile'>('login');
  const [companions, setCompanions] = useState<Companionship[]>([]);
  const [lightningRounds, setLightningRounds] = useState<CompanionLightningRound[]>([]);
  const [exchangedCards, setExchangedCards] = useState<UserBusinessCard[]>([]);
  const [selectedCompanionCard, setSelectedCompanionCard] = useState<UserBusinessCard | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLightningModal, setShowLightningModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'MILESTONE' | 'CLUB_MATCH' | 'COMPANIONS' | 'STAMP_MAP'>('MILESTONE');
  const [selectedMedalModal, setSelectedMedalModal] = useState<'HIO' | 'EAGLE' | 'ALBATROSS' | null>(null);
  const [selectedPilgrimCourse, setSelectedPilgrimCourse] = useState<PilgrimageCourse | null>(null);

  // Handle incoming addFriend query param from QR scan
  useEffect(() => {
    if (addFriendParam) {
      const friendName = decodeURIComponent(addFriendParam).trim();
      if (friendName) {
        CompanionStorage.addOrUpdateCompanion(friendName, '현장 QR 맺음', undefined, 'QR 스캔을 통해 결연된 1촌');
        setToastMsg(`🎉 '${friendName}' 님과 평생 1촌 동반자 인연이 성사되었습니다!`);
        setTimeout(() => setToastMsg(''), 4000);
      }
    }
  }, [addFriendParam]);

  useEffect(() => {
    setMounted(true);
    const load = () => {
      const raw = ParkOnStorage.getUserDisplayName();
      setUserName(formatPlayerDisplayName(raw, true, isJapanese));
      setCompanions(CompanionStorage.getCompanions());
      setLightningRounds(CompanionStorage.getLightningRounds());
      setExchangedCards(BusinessCardStorage.getExchangedCards());
      setMemberCode(getSavedMemberCode());
    };
    load();
    window.addEventListener('parkon_companion_updated', load);
    window.addEventListener('parkon_lightning_updated', load);
    window.addEventListener('parkon_business_cards_exchanged', load);
    window.addEventListener('parkon_member_synced', load);
    window.addEventListener('storage', load);
    return () => {
      window.removeEventListener('parkon_companion_updated', load);
      window.removeEventListener('parkon_lightning_updated', load);
      window.removeEventListener('parkon_business_cards_exchanged', load);
      window.removeEventListener('parkon_member_synced', load);
      window.removeEventListener('storage', load);
    };
  }, [isJapanese]);

  const handleCopyMemberCode = () => {
    if (!memberCode) return;
    try {
      navigator.clipboard.writeText(memberCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      alert(`내 고유 회원번호: ${memberCode}`);
    }
  };

  // 1. 실제 사용자가 완주한 공식 라운드만 반영 (가상 연습 라운드 제외)
  const completedRounds = ParkOnStorage.getCompletedRounds().filter(
    (r) => !r.isVirtual && r.isOfficial !== false
  );
  const totalRoundsCount = completedRounds.length;
  const totalHolesCount = completedRounds.reduce(
    (sum, r) => sum + (r.confirmedHoles?.length || r.totalHoles || 0),
    0
  );

  // 실제 완주한 구장 및 코스 메타데이터
  const allCourses = ParkOnStorage.getAllCourses();

  // ⛩️ 한일 양대 성지순례 및 트로피 실시간 현황 계산
  const pilgrimStatus = PilgrimageStorage.getUserStatus(completedRounds);

  // 훈장 상세 기록 구조 정의
  interface MedalRecord {
    date: string;
    courseName: string;
    holeNumber: number;
    holeLabel: string;
    par: number;
    strokes: number;
  }

  // 사용자 본인 타수 수집 및 훈장(홀인원/이글/알바트로스) 실측 계산
  const userScores: number[] = [];
  const hioListPar3: MedalRecord[] = [];
  const hioListPar4: MedalRecord[] = [];
  const hioListPar5: MedalRecord[] = [];
  const eagleListPar4: MedalRecord[] = [];
  const eagleListPar5: MedalRecord[] = [];
  const albatrossList: MedalRecord[] = [];

  const parPattern = [4, 3, 4, 3, 4, 4, 3, 3, 5];

  completedRounds.forEach((r) => {
    const p = (r.players || []).find(
      (pl) => pl.isSelf || pl.name === userName || pl.isLeader
    ) || (r.players && r.players[0]);
    if (p && p.totalStrokes > 0) {
      userScores.push(p.totalStrokes);
    }
    if (p && p.scores) {
      const course = allCourses.find((c) => c.id === r.courseId) || DEFAULT_COURSES.find((c) => c.id === r.courseId);
      const roundDate = new Date(r.completedAt || r.startedAt).toLocaleDateString('ko-KR');
      const courseName = r.courseName || course?.name || '파크골프장';

      Object.entries(p.scores).forEach(([holeKey, scoreVal]) => {
        const hNum = Number(holeKey);
        const stroke = Number(scoreVal);
        if (!stroke || stroke <= 0) return;

        const meta = course?.holesMetadata?.find((m) => m.hole === hNum);
        const par = meta?.par || parPattern[(hNum - 1) % 9] || 4;
        const holeLabel = `${hNum}번 홀`;

        const record: MedalRecord = {
          date: roundDate,
          courseName,
          holeNumber: hNum,
          holeLabel,
          par,
          strokes: stroke,
        };

        // 1. 홀인원 (1타 만에 홀아웃)
        if (stroke === 1) {
          if (par === 3) {
            hioListPar3.push(record);
          } else if (par === 4) {
            hioListPar4.push(record);
          } else if (par === 5) {
            hioListPar5.push(record);
          } else {
            hioListPar3.push(record);
          }
        }

        // 2. 이글 (Par 기준 -2타, 1타 친 홀인원은 제외)
        if (stroke > 1 && stroke === par - 2) {
          if (par === 4 && stroke === 2) {
            eagleListPar4.push(record);
          } else if (par === 5 && stroke === 3) {
            eagleListPar5.push(record);
          }
        }

        // 3. 알바트로스 (Par 5 롱홀에서 2타 만에 홀아웃, -3타)
        if (par === 5 && stroke === 2) {
          albatrossList.push(record);
        }
      });
    }
  });

  const totalHoleInOnes = hioListPar3.length + hioListPar4.length + hioListPar5.length;
  const totalEagles = eagleListPar4.length + eagleListPar5.length;
  const totalAlbatross = albatrossList.length;

  const bestScore = userScores.length > 0 ? Math.min(...userScores) : null;
  const avgStrokes =
    userScores.length > 0
      ? Number((userScores.reduce((a, b) => a + b, 0) / userScores.length).toFixed(1))
      : null;

  // 실제 타수에 기반한 스타 등급 (기록 없으면 '기록 준비중')
  let skillStarTitle = isJapanese ? '記録準備中' : '기록 준비중';
  if (avgStrokes !== null) {
    if (avgStrokes <= 54) skillStarTitle = isJapanese ? '★★★★★ 5スター (マスター)' : '★★★★★ 5스타 (마스터)';
    else if (avgStrokes <= 58.5) skillStarTitle = isJapanese ? '★★★★ 4スター (上級)' : '★★★★ 4스타 (상급)';
    else if (avgStrokes <= 62.5) skillStarTitle = isJapanese ? '★★★ 3スター (中級)' : '★★★ 3스타 (중급)';
    else if (avgStrokes <= 66.5) skillStarTitle = isJapanese ? '★★ 2スター (初中級)' : '★★ 2스타 (중초급)';
    else if (avgStrokes <= 72.5) skillStarTitle = isJapanese ? '★ 1スター (初級)' : '★ 1스타 (초급)';
    else skillStarTitle = isJapanese ? '0.5スター (入門)' : '0.5스타 (입문)';
  }

  // 사용자 실제 프로필 (클럽 및 첫 라운드 일자)
  const userProfile = ParkOnStorage.getUserProfile();
  const clubNameDisplay =
    userProfile.clubName && userProfile.clubName !== '동락 파크골프 클럽'
      ? userProfile.clubName
      : (isJapanese ? '所属クラブ未登録' : '소속 클럽 미등록');

  const careerStartDateText =
    completedRounds.length > 0
      ? (isJapanese
          ? `初公式ラウンド: ${new Date(
              completedRounds[completedRounds.length - 1].startedAt ||
                completedRounds[completedRounds.length - 1].completedAt ||
                ''
            ).toLocaleDateString('ja-JP')}`
          : `첫 공식 라운드: ${new Date(
              completedRounds[completedRounds.length - 1].startedAt ||
                completedRounds[completedRounds.length - 1].completedAt ||
                ''
            ).toLocaleDateString('ko-KR')}`)
      : (isJapanese ? '公式ラウンド記録準備中' : '공식 라운드 기록 준비중');

  const topCompanion = companions.length > 0 ? companions[0] : null;

  // 실제 완주한 구장 목록만 도장깨기에 반영
  const conqueredCourseIds = Array.from(new Set(completedRounds.map((r) => r.courseId)));
  const conqueredCoursesList = allCourses.filter((c) => conqueredCourseIds.includes(c.id));

  // 실제 구장 DB 기반 시도별 도장깨기 정복 통계 계산
  const regionGroups = [
    { name: '대구·경북', match: (r: string) => r.includes('대구') || r.includes('경북') || r.includes('구미') || r.includes('군위') },
    { name: '부산·울산·경남', match: (r: string) => r.includes('부산') || r.includes('울산') || r.includes('경남') },
    { name: '서울·경기·인천', match: (r: string) => r.includes('서울') || r.includes('경기') || r.includes('인천') },
    { name: '강원·충청·전라·제주', match: (r: string) => r.includes('강원') || r.includes('충북') || r.includes('충남') || r.includes('전북') || r.includes('전남') || r.includes('제주') || r.includes('대전') || r.includes('광주') || r.includes('세종') },
  ];

  const regionalStats = regionGroups.map((grp) => {
    const totalInReg = allCourses.filter((c) => grp.match(c.region || '')).length;
    const conqueredInReg = conqueredCoursesList.filter((c) => grp.match(c.region || '')).length;
    return {
      name: grp.name,
      total: totalInReg || 1,
      conquered: conqueredInReg,
      pct: totalInReg > 0 ? Math.round((conqueredInReg / totalInReg) * 100) : 0,
    };
  });

  if (!mounted) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-44 bg-emerald-950/20 rounded-3xl animate-pulse" />
        <div className="h-12 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-stone-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Toast Banner on successful 1촌 connection */}
      {toastMsg && (
        <div className="p-3.5 bg-emerald-700 text-white rounded-2xl shadow-lg text-center text-xs font-black flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Top Master Profile Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-2xl shadow-md border-2 border-amber-300">
              {userName.slice(0, 1) || (isJapanese ? 'プ' : '플')}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-black text-white tracking-tight">
                  {userName || (isJapanese ? 'プレイヤー' : '플레이어')} {isJapanese ? '様' : '님'}
                </h1>
                <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full">
                  {skillStarTitle}
                </span>
              </div>
              <p className="text-xs text-emerald-200 mt-0.5 font-medium">
                {clubNameDisplay} · {careerStartDateText}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="py-2 px-3 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-xs font-black text-amber-200 flex items-center gap-1.5 backdrop-blur-sm transition active:scale-95 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>{isJapanese ? 'マイ友QR' : '내 1촌 QR'}</span>
            </button>
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
              className="p-2 bg-white/15 hover:bg-white/25 border border-white/30 rounded-xl text-white backdrop-blur-sm transition active:scale-95 cursor-pointer flex items-center justify-center"
              title={isJapanese ? "閉じる (前画面へ)" : "닫기 (이전 화면으로)"}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4대 커리어 핵심 지표 */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-emerald-700/60 text-center">
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">
              {isJapanese ? '通算ラウンド' : '통산 라운드'}
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {totalRoundsCount}{isJapanese ? '回' : '회'}
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">
              {isJapanese ? '累計ホール数' : '누적 홀수'}
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {totalHolesCount}{isJapanese ? 'ホール' : '홀'}
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-amber-300 font-bold">
              {isJapanese ? 'ベストスコア' : '인생 최저타'}
            </div>
            <div className="text-lg font-black text-amber-300 mt-0.5">
              {bestScore !== null ? `${bestScore}${isJapanese ? '打' : '타'}` : (isJapanese ? '-打' : '-타')}
            </div>
          </div>
          <div className="bg-emerald-950/40 rounded-xl p-2 border border-emerald-600/30">
            <div className="text-[10px] text-emerald-200 font-medium">
              {isJapanese ? '平均打数' : '평균 타수'}
            </div>
            <div className="text-lg font-black text-white mt-0.5">
              {avgStrokes !== null ? `${avgStrokes}${isJapanese ? '打' : '타'}` : (isJapanese ? '-打' : '-타')}
            </div>
          </div>
        </div>
      </div>

      {/* 👑 VIP 평생 고유번호 카드 & PC 연동 배너 (대표님 지침: 7자리 번호로 비밀번호 없이 연동) */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500 rounded-3xl p-0.5 shadow-lg">
        <div className="bg-emerald-950 rounded-[22px] p-3.5 sm:p-4 text-white space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-black text-amber-300 text-xs sm:text-sm">
              <span className="text-base">👑</span>
              <span>나의 평생 고유회원번호 (비밀번호 불필요)</span>
            </div>
            <span className="text-[9.5px] bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full shadow-xs">
              자동 발급
            </span>
          </div>

          <div className="flex items-center justify-between bg-emerald-900/80 rounded-2xl p-2.5 sm:p-3 border border-amber-300/40 shadow-inner">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-amber-300 shrink-0" />
              <span className="text-lg sm:text-xl font-black text-amber-300 tracking-wider font-mono">
                {memberCode || 'PKY-7788'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyMemberCode}
                className={`py-1.5 px-3 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-xs flex items-center gap-1 ${
                  codeCopied ? 'bg-emerald-500 text-white' : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                }`}
              >
                {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{codeCopied ? '복사됨!' : '번호 복사'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginModalMode('login');
                  setShowLoginModal(true);
                }}
                className="py-1.5 px-2.5 rounded-xl text-xs font-black bg-white/20 hover:bg-white/30 text-white border border-white/30 transition active:scale-95 cursor-pointer"
                title="다른 기기/번호로 로그인"
              >
                <span>🔑 로그인/변경</span>
              </button>
            </div>
          </div>

          <p className="text-[11px] text-emerald-100 font-medium leading-relaxed">
            💡 <strong>PC(컴퓨터)나 다른 휴대폰</strong>에서 이 번호 <strong>7자리</strong>만 넣으시면, 비밀번호 없이 <strong>내 모든 연대기와 경기 기록이 1초 만에 그대로 복원</strong>됩니다!
          </p>
        </div>
      </div>

      {/* 2. 4대 탭 내비게이션 (클럽 대항전 실록 신설) */}
      <div className="grid grid-cols-4 p-1.5 bg-stone-200 rounded-2xl gap-1 text-[11px] font-black">
        <button
          type="button"
          onClick={() => setActiveTab('MILESTONE')}
          className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'MILESTONE'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-600" />
          <span>{isJapanese ? 'キャリア' : '커리어'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CLUB_MATCH')}
          className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'CLUB_MATCH'
              ? 'bg-gradient-to-b from-purple-800 to-purple-950 text-amber-300 shadow-sm border border-purple-500'
              : 'text-stone-700 hover:text-purple-900'
          }`}
        >
          <Swords className="w-4 h-4 text-purple-600" />
          <span>{isJapanese ? 'クラブ対抗戦' : '대항전 실록'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('COMPANIONS')}
          className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'COMPANIONS'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>{isJapanese ? 'ゴルフ仲間' : '1촌 명부'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('STAMP_MAP')}
          className={`min-h-[48px] rounded-xl transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
            activeTab === 'STAMP_MAP'
              ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          <Compass className="w-4 h-4 text-blue-600" />
          <span>{isJapanese ? '聖地・全国制覇' : '성지순례·도장깨기'}</span>
        </button>
      </div>

      {/* 3. 탭별 메인 콘텐츠 */}
      {activeTab === 'MILESTONE' && (
        <div className="space-y-4">
          {/* 최다 동반 1촌 파트너 하이라이트 카드 */}
          {topCompanion ? (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-3xl p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-600" />
                  <span className="text-xs font-black text-amber-900">
                    {isJapanese ? '生涯のラウンドパートナー' : '평생의 라운드 단짝 1촌'}
                  </span>
                </div>
                <span className="text-xs font-black text-amber-700 bg-amber-200/80 px-2 py-0.5 rounded-full">
                  {isJapanese ? `通算 ${topCompanion.roundCount}回 同伴` : `통산 ${topCompanion.roundCount}회 동반`}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white font-black text-lg flex items-center justify-center shadow-xs">
                    {topCompanion.companionName.slice(0, 1)}
                  </div>
                  <div>
                    <h4 className="text-base font-black text-stone-900">
                      {topCompanion.companionName} {isJapanese ? '様' : '님'}
                    </h4>
                    <p className="text-xs text-stone-500 font-medium">
                      {topCompanion.memo || (isJapanese ? '最高のナイスショットパートナー' : '최고의 굿샷 파트너')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700">
                    {isJapanese ? '最近同伴コース' : '최근 동반 구장'}
                  </span>
                  <p className="text-[11px] text-stone-600 font-bold">
                    {topCompanion.lastCourseName || (isJapanese ? 'フィールドラウンド' : '필드 라운드')}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center font-bold text-lg">
                  👥
                </div>
                <div>
                  <h4 className="text-xs font-black text-stone-900">
                    {isJapanese ? '登録されたゴルフ仲間がいません' : '등록된 1촌 동반자가 없습니다'}
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    {isJapanese
                      ? 'フィールドで一緒にプレーした仲間とQRコードで仲間になりましょう。'
                      : '필드에서 함께 친 동반자와 QR 코드로 1촌을 맺어보세요.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(true)}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shrink-0 shadow-xs cursor-pointer transition active:scale-95"
              >
                {isJapanese ? '仲間登録 +' : '1촌 맺기 +'}
              </button>
            </div>
          )}

          {/* ⛩️ 한일 양대 공식 성지순례 여권 미리보기 배너 */}
          <div className="bg-gradient-to-br from-amber-950 via-stone-900 to-emerald-950 text-white rounded-3xl p-5 border-2 border-amber-400/60 shadow-lg space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xl shadow-md border border-amber-300">
                  ⛩️
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-black text-amber-200">
                      {isJapanese ? '日韓 聖地巡礼パスポート' : '한·일 공식 성지순례 여권'}
                    </h3>
                    <span className="text-[9px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                      NEW
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-300 font-medium">
                    {isJapanese ? '歴史の4大聖地から全国5大名門コース巡礼実録' : '역사 4대 성지부터 전국 5대 명품 구장 완주 실록'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('STAMP_MAP')}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-black rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <span>{isJapanese ? 'パスポートを見る' : '여권 펼치기'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 4대 여권 스탬프 요약 지표 */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-amber-300 font-bold">{isJapanese ? '歴史聖地' : '역사 성지'}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {pilgrimStatus.visitedHeritageCount}/{pilgrimStatus.totalHeritageCount}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-emerald-300 font-bold">{isJapanese ? '韓国5大' : '한국 5대'}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {pilgrimStatus.visitedKoreaMasterpieceCount}/{pilgrimStatus.totalKoreaMasterpieceCount}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-rose-300 font-bold">{isJapanese ? '日本5大' : '일본 5대'}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {pilgrimStatus.visitedJapanMasterpieceCount}/{pilgrimStatus.totalJapanMasterpieceCount}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-cyan-300 font-bold">{isJapanese ? '開拓者' : '개척자'}</div>
                <div className="text-sm font-black text-white mt-0.5">
                  {pilgrimStatus.hasGlobalPioneer ? '🏆 달성' : '도전'}
                </div>
              </div>
            </div>
          </div>

          {/* 명예의 전당 특별 훈장 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-black text-stone-900">
                  {isJapanese ? '殿堂入り特別メダル' : '명예의 전당 특별 훈장'}
                </h3>
              </div>
              <span className="text-[10px] text-stone-400 font-bold bg-stone-100 px-2 py-0.5 rounded-full">
                {isJapanese ? 'タップで詳細記録 🔍' : '훈장 터치 시 상세 실록 🔍'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {/* 1. 홀인원 카드 */}
              <button
                type="button"
                onClick={() => setSelectedMedalModal('HIO')}
                className="p-3 bg-amber-50 hover:bg-amber-100/70 border border-amber-300/80 rounded-2xl space-y-1.5 transition active:scale-95 cursor-pointer shadow-xs text-center flex flex-col justify-between items-center group w-full"
              >
                <div className="space-y-0.5">
                  <span className="text-2xl group-hover:scale-110 transition inline-block">⛳</span>
                  <div className="text-xs font-black text-amber-950 flex items-center justify-center gap-0.5">
                    <span>{isJapanese ? 'ホールインワン' : '홀인원'}</span>
                    <span className="text-[10px] text-amber-600">🔍</span>
                  </div>
                  <div className="text-base font-black text-amber-800">
                    {totalHoleInOnes}{isJapanese ? '回 達成' : '회 달성'}
                  </div>
                </div>

                <div className="w-full space-y-0.5 pt-0.5">
                  <div className="text-[9px] font-black text-amber-800 bg-amber-100/80 px-1 py-0.5 rounded-md truncate w-full">
                    P3:{hioListPar3.length} · P4:{hioListPar4.length} · P5:{hioListPar5.length}
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold">
                    {totalHoleInOnes > 0
                      ? (isJapanese ? '詳細記録を見る' : '상세 실록 보기')
                      : (isJapanese ? '記録待ち' : '기록 대기')}
                  </div>
                </div>
              </button>

              {/* 2. 이글 훈장 카드 */}
              <button
                type="button"
                onClick={() => setSelectedMedalModal('EAGLE')}
                className="p-3 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-300/80 rounded-2xl space-y-1.5 transition active:scale-95 cursor-pointer shadow-xs text-center flex flex-col justify-between items-center group w-full"
              >
                <div className="space-y-0.5">
                  <span className="text-2xl group-hover:scale-110 transition inline-block">🦅</span>
                  <div className="text-xs font-black text-emerald-950 flex items-center justify-center gap-0.5">
                    <span>{isJapanese ? 'イーグル' : '이글 훈장'}</span>
                    <span className="text-[10px] text-emerald-600">🔍</span>
                  </div>
                  <div className="text-base font-black text-emerald-800">
                    {totalEagles}{isJapanese ? '回 達成' : '회 달성'}
                  </div>
                </div>

                <div className="w-full space-y-0.5 pt-0.5">
                  <div className="text-[9px] font-black text-emerald-800 bg-emerald-100/80 px-1 py-0.5 rounded-md truncate w-full">
                    P4:{eagleListPar4.length}{isJapanese ? '回' : '회'} · P5:{eagleListPar5.length}{isJapanese ? '回' : '회'}
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold">
                    {totalEagles > 0
                      ? (isJapanese ? '詳細記録を見る' : '상세 실록 보기')
                      : (isJapanese ? '記録待ち' : '기록 대기')}
                  </div>
                </div>
              </button>

              {/* 3. 알바트로스 훈장 카드 */}
              <button
                type="button"
                onClick={() => setSelectedMedalModal('ALBATROSS')}
                className="p-3 bg-indigo-50 hover:bg-indigo-100/70 border border-indigo-300/80 rounded-2xl space-y-1.5 transition active:scale-95 cursor-pointer shadow-xs text-center flex flex-col justify-between items-center group w-full"
              >
                <div className="space-y-0.5">
                  <span className="text-2xl group-hover:scale-110 transition inline-block">🦢</span>
                  <div className="text-xs font-black text-indigo-950 flex items-center justify-center gap-0.5">
                    <span>{isJapanese ? 'アルバトロス' : '알바트로스'}</span>
                    <span className="text-[10px] text-indigo-600">🔍</span>
                  </div>
                  <div className="text-base font-black text-indigo-800">
                    {totalAlbatross}{isJapanese ? '回 達成' : '회 달성'}
                  </div>
                </div>

                <div className="w-full space-y-0.5 pt-0.5">
                  <div className="text-[9px] font-black text-indigo-800 bg-indigo-100/80 px-1 py-0.5 rounded-md truncate w-full">
                    {isJapanese ? 'Par5 ロングホール 2打完走' : '파5 롱홀 2타 완주'}
                  </div>
                  <div className="text-[10px] text-stone-400 font-semibold">
                    {totalAlbatross > 0
                      ? (isJapanese ? '詳細記録を見る' : '상세 실록 보기')
                      : (isJapanese ? '記録待ち' : '기록 대기')}
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* 타임라인 히스토리 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-stone-900">
                  {isJapanese ? '最近のラウンドタイムライン' : '최근 라운드 타임라인'}
                </h3>
              </div>
              <span className="text-xs text-stone-400 font-medium">
                {isJapanese ? '永久記録保存' : '영구 기록 보존'}
              </span>
            </div>

            {completedRounds.length === 0 ? (
              <div className="text-center py-6 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-1.5">
                <span className="text-3xl">⛳</span>
                <p className="font-black text-xs text-stone-700">
                  {isJapanese ? 'まだ完了した公式ラウンド記録がありません。' : '아직 완료된 공식 라운드 기록이 없습니다.'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isJapanese
                    ? 'フィールドでスコアカードを完走して保存すると、実際の試合記録がタイムラインに自動登録されます。'
                    : '필드에서 스코어카드를 완주하고 저장하면 실제 경기 기록이 타임라인에 자동으로 등록됩니다.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {completedRounds.slice(0, 10).map((r) => {
                  const myPl =
                    (r.players || []).find((p) => p.isSelf || p.name === userName || p.isLeader) || (r.players && r.players[0]) || { totalStrokes: (r as any).totalScore || 54, totalParDiff: 0 };
                  const strokes = myPl?.totalStrokes || 0;
                  const parDiff = myPl?.totalParDiff ?? 0;
                  const parStr = parDiff === 0 ? 'Even' : parDiff > 0 ? `+${parDiff}` : `${parDiff}`;
                  const companionsText =
                    (r.players || [])
                      .filter((p) => !p.isSelf && p.name !== userName)
                      .map((p) => p.name)
                      .join(', ') || (isJapanese ? '単独プレー' : '단독 플레이');

                  return (
                    <div key={r.id} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-stone-900">
                          {r.courseName} ({r.confirmedHoles?.length || r.totalHoles}{isJapanese ? 'ホール' : '홀'})
                        </span>
                        <span className="text-xs font-black text-emerald-700">
                          {strokes}{isJapanese ? '打' : '타'} ({parStr})
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>
                          {new Date(r.completedAt || r.startedAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR')}
                        </span>
                        <span className="truncate max-w-[180px]">
                          {isJapanese ? '同伴: ' : '동반: '}{companionsText}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ⚔️ 클럽 대항전 및 대회 실록 (Match & Tournament Chronicle) */}
      {activeTab === 'CLUB_MATCH' && (
        <div className="space-y-4">
          {(() => {
            const myClubIds = typeof window !== 'undefined' ? ClubStorage.getMyClubIds() : [];
            const myClub = myClubIds.length > 0 ? ClubStorage.getClubById(myClubIds[0]) : null;
            const myPastHistory = myClub ? ClubStorage.getMemberPastHistoryInClub(myClub.id, userName) : [];
            const totalMatches = myPastHistory.length;
            const wins = myPastHistory.filter((h) => h.myRecord.isWinner || h.myRecord.rank === 1).length;
            const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
            const medalists = myPastHistory.filter((h) => h.myRecord.awards?.some((a) => a.includes('메달리스트'))).length;
            const avgStrokes =
              totalMatches > 0
                ? (myPastHistory.reduce((s, h) => s + h.myRecord.totalStrokes, 0) / totalMatches).toFixed(1)
                : '-';

            if (!myClub) {
              return (
                <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-sm text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto text-2xl">
                    🛡️
                  </div>
                  <h3 className="font-black text-base text-stone-900">
                    {isJapanese ? '所属クラブ接続待機 (記録保存中)' : '소속 클럽 연결 대기 (영구 이력 보존 중)'}
                  </h3>
                  <p className="text-xs text-stone-500 font-medium leading-relaxed max-w-sm mx-auto">
                    {isJapanese ? (
                      <>
                        現在所属クラブが未登録(または退会)状態です。<br />
                        会員様の過去のクラブ大会出場スコアと受賞メダルは<strong>‘秘密保管所’</strong>に安全に保存されており、クラブに復帰(再加入)すると過去の実録が100%復旧してここに再接続されます。
                      </>
                    ) : (
                      <>
                        현재 소속 클럽이 미등록(또는 탈퇴) 상태입니다.<br />
                        회원님의 과거 클럽 대회 출전 스코어와 수상 훈장은 <strong>&lsquo;비밀 보관소&rsquo;</strong>에 안전 보존되어 있으며, 클럽에 복귀(재가입)하시면 모든 과거 실록이 100% 원상 복구되어 이곳에 다시 연결됩니다.
                      </>
                    )}
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/club"
                      className="inline-block px-5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95"
                    >
                      {isJapanese ? '所属クラブ加入および復帰へ ▶' : '소속 클럽 가입 및 복귀하러 가기 ▶'}
                    </Link>
                  </div>
                </div>
              );
            }

            return (
              <>
                {/* 대항전 공식 전적 요약 카드 */}
                <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-stone-950 text-white rounded-3xl p-5 shadow-xl border-2 border-purple-400/40 space-y-4">
                  <div className="flex items-center justify-between border-b border-purple-700/50 pb-3">
                    <div className="flex items-center gap-2">
                      <Swords className="w-5 h-5 text-amber-300" />
                      <div>
                        <h3 className="text-base font-black tracking-tight text-white">
                          &lsquo;{myClub.name}&rsquo; {isJapanese ? '公式実録' : '공식 실록'}
                        </h3>
                        <p className="text-[10px] text-purple-300">
                          {isJapanese ? '大会出場履歴 100% リアルタイム連動' : '내 대회 출전 이력 100% 실시간 연동'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-amber-400 text-purple-950 font-black px-2.5 py-0.5 rounded-full">
                      {isJapanese ? '公式認定実録' : '공식 인증 실록'}
                    </span>
                  </div>

                  {/* 전적 지표 그리드 */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                      <div className="text-[10px] text-purple-200 font-bold">
                        {isJapanese ? '通算出戦' : '통산 출전'}
                      </div>
                      <div className="text-lg font-black text-amber-300 mt-0.5">
                        {totalMatches}{isJapanese ? '回' : '회'}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                      <div className="text-[10px] text-purple-200 font-bold">
                        {isJapanese ? '優勝回数' : '우승 횟수'}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">
                        {wins}{isJapanese ? '回' : '회'}
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                      <div className="text-[10px] text-purple-200 font-bold">
                        {isJapanese ? '勝率' : '승률'}
                      </div>
                      <div className="text-lg font-black text-white mt-0.5">{winRate}%</div>
                    </div>
                    <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                      <div className="text-[10px] text-purple-200 font-bold">
                        {isJapanese ? '平均打数' : '평균 타수'}
                      </div>
                      <div className="text-lg font-black text-emerald-300 mt-0.5">
                        {avgStrokes}{isJapanese ? '打' : '타'}
                      </div>
                    </div>
                  </div>

                  {/* 내 대항전 개인 타이틀 뱃지 */}
                  <div className="bg-purple-900/60 rounded-2xl p-3 border border-purple-500/30 flex items-center justify-between text-xs">
                    <span className="text-purple-200 font-bold flex items-center gap-1.5">
                      <span>🎖️</span>
                      <span>{isJapanese ? '代表選手栄誉' : '대표 선수 영예'}</span>
                    </span>
                    <span className="text-stone-300 font-bold">
                      {totalMatches > 0
                        ? (isJapanese ? `'${userName}' 公式大会出場確認` : `'${userName}' 공식 대회 출전 확인`)
                        : (isJapanese ? '公式クラブ大会出場時に授与' : '공식 클럽 대회 출전 시 수여')}
                    </span>
                  </div>
                </div>

                {/* 대항전 특별 훈장 컬렉션 */}
                <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-purple-700" />
                    <h3 className="text-sm font-black text-stone-900">
                      {isJapanese ? 'クラブ大会栄誉メダル' : '클럽 대회 명예 훈장'}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                      <span className="text-2xl">👑</span>
                      <div className="text-xs font-black text-stone-900">
                        {isJapanese ? '大会チャンピオン' : '대회 챔피언'}
                      </div>
                      <div className="text-base font-black text-purple-900">
                        {wins}{isJapanese ? '回 優勝' : '회 우승'}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {wins > 0 ? (isJapanese ? '公式優勝認定' : '공식 우승 인증') : (isJapanese ? '記録待機中' : '기록 대기중')}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                      <span className="text-2xl">⭐</span>
                      <div className="text-xs font-black text-stone-900">
                        {isJapanese ? 'メダリスト' : '메달리스트'}
                      </div>
                      <div className="text-base font-black text-purple-900">
                        {medalists}{isJapanese ? '回 受賞' : '회 수상'}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {medalists > 0 ? (isJapanese ? '最少打認定' : '최저타 인증') : (isJapanese ? '記録待機中' : '기록 대기중')}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-1">
                      <span className="text-2xl">⚔️</span>
                      <div className="text-xs font-black text-stone-900">
                        {isJapanese ? '対抗戦出場' : '대항전 출전'}
                      </div>
                      <div className="text-base font-black text-purple-900">
                        {totalMatches}{isJapanese ? '戦 ' : '전 '}{wins}{isJapanese ? '勝' : '승'}
                      </div>
                      <div className="text-[10px] text-stone-400">
                        {totalMatches > 0 ? (isJapanese ? '公認戦績' : '전적 공인') : (isJapanese ? '記録待機中' : '기록 대기중')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 대항전 출전 상세 매치 히스토리 */}
                <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-purple-700" />
                      <h3 className="text-sm font-black text-stone-900">
                        {isJapanese
                          ? `マイクラス大会出場実録 (${totalMatches}件)`
                          : `내 클럽 대회 출전 실록 (${totalMatches}건)`}
                      </h3>
                    </div>
                    <span className="text-xs text-stone-400 font-medium">
                      {isJapanese ? '永久記録保存' : '영구 기록 보존'}
                    </span>
                  </div>

                  {totalMatches === 0 ? (
                    <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                      <span className="text-3xl">⚔️</span>
                      <p className="font-black text-xs text-stone-700">
                        {isJapanese ? 'まだ出場したクラブ大会の記録がありません。' : '아직 출전한 클럽 대회 기록이 없습니다.'}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {isJapanese
                          ? '所属クラブの定期戦や対抗戦ラウンドを完走すると、公認マッチ結果がここに永久記録されます。'
                          : '소속 클럽의 정기전이나 대항전 라운드를 완주하면 공인 매치 결과가 이곳에 영구 기록됩니다.'}
                      </p>
                      <div className="pt-1">
                        <Link
                          href="/club"
                          className="inline-block px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                        >
                          {isJapanese ? 'クラブ大会を確認する ▶' : '클럽 대회 확인하기 ▶'}
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {myPastHistory.map((h, hIdx) => (
                        <div
                          key={h.tournament.id || hIdx}
                          className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-stone-900">
                              {h.tournament.title}
                            </span>
                            <span className="text-xs font-black text-purple-800">
                              {h.myRecord.rank}{isJapanese ? '位' : '위'} ({h.myRecord.totalStrokes}{isJapanese ? '打' : '타'})
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>📅 {h.tournament.heldAt} · 📍 {h.tournament.courseName}</span>
                            <span>{h.myRecord.groupNumber}{isJapanese ? '組 出場' : '조 출전'}</span>
                          </div>
                          {h.myRecord.awards && h.myRecord.awards.length > 0 && (
                            <div className="text-[10px] text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-lg font-black inline-block">
                              {isJapanese ? '🏅 受賞: ' : '🏅 수상: '}{h.myRecord.awards.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'COMPANIONS' && (
        <div className="space-y-4">
          {/* 1촌 전용 액션 버튼 (52px+ 대형 터치 규격) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setShowLightningModal(true)}
              className="w-full min-h-[52px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer border border-amber-400/50"
            >
              <Zap className="w-5 h-5 fill-stone-950 text-stone-950" />
              <span>{isJapanese ? '⚡ ゴルフ仲間に招集マッチを提案' : '⚡ 나의 1촌에게 번개 라운드 띄우기'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowQrModal(true)}
              className="w-full min-h-[52px] bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-base flex items-center justify-center gap-2 shadow-md active:scale-98 transition cursor-pointer"
            >
              <QrCode className="w-5 h-5 text-amber-300" />
              <span>{isJapanese ? '+ 現場で同伴者とQR仲間登録' : '+ 현장에서 동반자와 1촌 QR 맺기'}</span>
            </button>
          </div>

          {/* 실시간 모집 중인 1촌 번개 라운드 카드 */}
          {lightningRounds.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 rounded-3xl p-4 border-2 border-amber-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-amber-950">
                      {isJapanese ? '募集中の仲間ラウンド' : '모집 중인 1촌 친목 번개'}
                    </h3>
                    <p className="text-[10px] text-amber-700 font-bold">
                      {isJapanese ? 'ゴルフ仲間専用 4人組編成' : '1촌 동반자 전용 4인 조 편성'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLightningModal(true)}
                  className="text-xs font-black text-amber-800 hover:text-amber-950 flex items-center gap-0.5 cursor-pointer"
                >
                  <span>{isJapanese ? 'すべて見る' : '전체보기'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {lightningRounds.slice(0, 3).map((ltn) => {
                  const isUserJoined = ltn.currentPlayers.some((p) => p.name === userName);
                  const isFull = ltn.currentPlayers.length >= ltn.targetPlayersCount;

                  return (
                    <div
                      key={ltn.id}
                      className="bg-white p-3 rounded-2xl border border-amber-200/70 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900">{ltn.courseName}</span>
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-1.5 py-0.5 rounded">
                            {ltn.dateStr} {ltn.timeStr}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                            {ltn.currentPlayers.length}/{ltn.targetPlayersCount}{isJapanese ? '人' : '명'}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium line-clamp-1">{ltn.notes}</p>
                        <div className="flex items-center gap-1 text-[11px] text-stone-600">
                          <span className="font-bold text-stone-400">
                            {isJapanese ? '参加者:' : '참여자:'}
                          </span>
                          {ltn.currentPlayers.map((p) => (
                            <span key={p.id} className="bg-stone-100 px-1.5 py-0.2 rounded font-bold text-[10px]">
                              {p.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isFull ? (
                          <button
                            type="button"
                            onClick={() => {
                              window.location.href = `/round/new?courseId=${ltn.courseId}&players=${encodeURIComponent(
                                ltn.currentPlayers.map((p) => p.name).join(',')
                              )}`;
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            <span>{isJapanese ? 'スコアカード開始' : '스코어카드 시작'}</span>
                          </button>
                        ) : isUserJoined ? (
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl">
                            {isJapanese ? '参加完了 (待機中)' : '참여 완료 (대기중)'}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              CompanionStorage.joinLightningRound(ltn.id, userName);
                              setLightningRounds(CompanionStorage.getLightningRounds());
                              setToastMsg(isJapanese ? `⚡ '${ltn.courseName}' ラウンドに参加しました！` : `⚡ '${ltn.courseName}' 1촌 번개 조에 참여했습니다!`);
                              setTimeout(() => setToastMsg(''), 3000);
                            }}
                            className="w-full sm:w-auto px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 text-xs font-black rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                          >
                            <span>{isJapanese ? '参加する ✋' : '참여하기 ✋'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 1촌 실시간 응원 피드 위젯 */}
          <CompanionFeedWidget />

          {/* 나의 1촌 명부 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-black text-stone-900">
                  {isJapanese ? '私のゴルフ仲間名簿' : '나의 1촌 동반자 명부'}
                </h3>
              </div>
              <span className="text-xs font-bold text-stone-500">
                {isJapanese ? `計 ${companions.length}人` : `총 ${companions.length}명`}
              </span>
            </div>

            {companions.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                <span className="text-3xl">👥</span>
                <p className="font-black text-xs text-stone-700">
                  {isJapanese ? '登録されたゴルフ仲間がまだいません。' : '등록된 1촌 동반자가 아직 없습니다.'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isJapanese
                    ? '現場で同伴者のQRコードをスキャンするか、自分のQRを見せると仲間としてつながります。'
                    : '현장에서 동반자의 QR 코드를 스캔하거나 내 QR을 보여주면 평생 1촌으로 연결됩니다.'}
                </p>
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQrModal(true)}
                    className="inline-block px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition active:scale-95"
                  >
                    {isJapanese ? '+ 私の友QRを開く' : '+ 내 1촌 QR 열기'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-stone-100">
                {companions.map((c, idx) => {
                  const card = c.businessCard || exchangedCards.find((bc) => bc.name === c.companionName);

                  return (
                    <div key={c.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                          {c.companionName.slice(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-sm font-black text-stone-900">{c.companionName}</span>
                            {idx === 0 && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 rounded">
                                {isJapanese ? '最多同伴' : '최다 동반'}
                              </span>
                            )}
                            {card && (
                              <button
                                type="button"
                                onClick={() => setSelectedCompanionCard(card)}
                                className="inline-flex items-center gap-1 text-[10px] font-black text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-lg cursor-pointer transition active:scale-95 shadow-2xs"
                              >
                                <span>📇</span>
                                <span className="truncate max-w-[110px]">{card.company || (isJapanese ? 'デジタル名刺' : '디지털 명함')}</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-400 font-medium">
                            {c.lastCourseName ? `${isJapanese ? '最近: ' : '최근: '}${c.lastCourseName}` : (isJapanese ? '最近のラウンド' : '최근 라운드')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700">{c.roundCount}{isJapanese ? '回' : '회'}</span>
                        <span className="text-xs text-stone-500 font-medium">{isJapanese ? ' 同伴' : ' 동반'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'STAMP_MAP' && (
        <div className="space-y-5">
          {/* ⛩️ 한·일 양대 공식 성지순례 여권 상단 마스터 대형 전광판 */}
          <div className="bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 text-white rounded-3xl p-5 border-2 border-amber-400/60 shadow-xl space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-2xl shadow-lg border-2 border-amber-300">
                  ⛩️
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black tracking-tight text-amber-200">
                      {isJapanese ? '日韓 公認 聖地巡礼パスポート' : '한·일 공식 성지순례 여권'}
                    </h3>
                    <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-2 py-0.5 rounded-full">
                      OFFICIAL
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 font-medium">
                    {isJapanese
                      ? '人類の発祥地から最高権威の名門コースまで公認巡礼実録'
                      : '인류 파크골프 발상지부터 한일 최고 권위 명품 구장까지 완주 공인 실록'}
                  </p>
                </div>
              </div>
            </div>

            {/* 4대 여권 스탬프 요약 지표 */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-amber-300 font-bold">{isJapanese ? '歴史聖地' : '역사 성지'}</div>
                <div className="text-base font-black text-white mt-0.5">
                  {pilgrimStatus.visitedHeritageCount}/{pilgrimStatus.totalHeritageCount}
                </div>
                <div className="text-[9px] text-stone-300 mt-0.5">
                  {pilgrimStatus.visitedHeritageCount === pilgrimStatus.totalHeritageCount ? '👑 제패' : '순례중'}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-emerald-300 font-bold">{isJapanese ? '韓国5大' : '한국 5대'}</div>
                <div className="text-base font-black text-white mt-0.5">
                  {pilgrimStatus.visitedKoreaMasterpieceCount}/{pilgrimStatus.totalKoreaMasterpieceCount}
                </div>
                <div className="text-[9px] text-stone-300 mt-0.5">
                  {pilgrimStatus.visitedKoreaMasterpieceCount === pilgrimStatus.totalKoreaMasterpieceCount ? '👑 제패' : '순례중'}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-rose-300 font-bold">{isJapanese ? '日本5大' : '일본 5대'}</div>
                <div className="text-base font-black text-white mt-0.5">
                  {pilgrimStatus.visitedJapanMasterpieceCount}/{pilgrimStatus.totalJapanMasterpieceCount}
                </div>
                <div className="text-[9px] text-stone-300 mt-0.5">
                  {pilgrimStatus.visitedJapanMasterpieceCount === pilgrimStatus.totalJapanMasterpieceCount ? '👑 제패' : '순례중'}
                </div>
              </div>
              <div className="p-2.5 bg-white/10 rounded-2xl border border-white/10">
                <div className="text-[10px] text-cyan-300 font-bold">{isJapanese ? '開拓者' : '개척자'}</div>
                <div className="text-base font-black text-amber-300 mt-0.5">
                  {pilgrimStatus.hasGlobalPioneer ? '🏆 달성' : '도전'}
                </div>
                <div className="text-[9px] text-stone-300 mt-0.5">
                  {pilgrimStatus.hasGlobalPioneer ? '현해탄 수여' : '해외 완주'}
                </div>
              </div>
            </div>

            <p className="text-[11px] text-amber-200/90 bg-amber-950/60 p-2.5 rounded-xl border border-amber-500/30 text-center font-medium">
              💡 {isJapanese
                ? '聖地コースをタップすると、歴史的価値・コース攻略法・完走証明書(証書)を確認できます。'
                : '성지 구장을 터치하면 역사적 가치와 공략 포인트, 완주 황금 인증서와 카카오 길안내를 확인할 수 있습니다.'}
            </p>
          </div>

          {/* 🏛️ 트랙 A: 불멸의 역사 4대 성지 (Heritage Sacred 4) */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🏛️</span>
                <div>
                  <h4 className="text-sm font-black text-stone-900">
                    {isJapanese ? '不滅の歴史 4大聖地' : '불멸의 역사 4대 성지'}
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    {isJapanese ? '発祥地・始発地・公認1号コース' : '세계 발상지·한국 시발지·여의도 1호·국내 공인 1호'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                {pilgrimStatus.visitedHeritageCount}/{pilgrimStatus.totalHeritageCount} {isJapanese ? '巡礼完了' : '완주'}
              </span>
            </div>

            <div className="space-y-2.5">
              {PILGRIMAGE_COURSES.filter((c) => c.category === 'HERITAGE').map((course) => {
                const rec = PilgrimageStorage.getUserCourseRecord(course.courseId, completedRounds);
                const isCompleted = rec.isVisited;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedPilgrimCourse(course)}
                    className="w-full text-left p-3.5 bg-stone-50 hover:bg-amber-50/70 border border-stone-200 hover:border-amber-300 rounded-2xl transition active:scale-[0.98] cursor-pointer space-y-2 shadow-xs group touch-manipulation select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{course.country === 'JP' ? '🇯🇵' : '🇰🇷'}</span>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-black text-stone-900 group-hover:text-amber-950 transition">
                              {isJapanese ? course.nameJa : course.nameKo}
                            </span>
                            <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded-md">
                              {course.badgeEmoji} {isJapanese ? course.historicTitleJa : course.historicTitleKo}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            📍 {isJapanese ? course.regionJa : course.regionKo}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-stone-400 group-hover:text-amber-700 font-black shrink-0">
                        {isJapanese ? '詳細 🔍' : '상세 실록 🔍'}
                      </span>
                    </div>

                    <div className="text-[11.5px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200/80 font-medium">
                      {isJapanese ? course.taglineJa : course.taglineKo}
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      {isCompleted ? (
                        <span className="font-black text-amber-800 bg-amber-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <span>🏆</span>
                          <span>
                            {isJapanese
                              ? `巡礼完走 ${rec.roundCount}回 ${rec.bestScore ? `(最少 ${rec.bestScore}打)` : ''} · 証明書`
                              : `성지 완주 ${rec.roundCount}회 ${rec.bestScore ? `(최저 ${rec.bestScore}타)` : ''} · 인증서 발급`}
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>⛩️</span>
                          <span>{isJapanese ? '巡礼挑戦待機中 (タップで案内)' : '성지 순례 도전 대기 (터치 시 안내)'}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-bold">
                        {course.petitionVotes}{isJapanese ? '票 推薦' : '표 추천'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🇰🇷 트랙 B: 대한민국 5대 명품 성지 (Korea Masterpiece 5) */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🇰🇷</span>
                <div>
                  <h4 className="text-sm font-black text-stone-900">
                    {isJapanese ? '大韓民国 5大名門聖地' : '대한민국 5대 명품 성지'}
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    {isJapanese ? '全国ゴルファー羨望の最高峰コース' : '전국 파크골퍼들이 가장 가고 싶어하는 최고 권위 코스'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {pilgrimStatus.visitedKoreaMasterpieceCount}/{pilgrimStatus.totalKoreaMasterpieceCount} {isJapanese ? '巡礼完了' : '완주'}
              </span>
            </div>

            <div className="space-y-2.5">
              {PILGRIMAGE_COURSES.filter((c) => c.category === 'KOREA_MASTERPIECE').map((course) => {
                const rec = PilgrimageStorage.getUserCourseRecord(course.courseId, completedRounds);
                const isCompleted = rec.isVisited;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedPilgrimCourse(course)}
                    className="w-full text-left p-3.5 bg-stone-50 hover:bg-emerald-50/70 border border-stone-200 hover:border-emerald-300 rounded-2xl transition active:scale-[0.98] cursor-pointer space-y-2 shadow-xs group touch-manipulation select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900 group-hover:text-emerald-950 transition">
                            {isJapanese ? course.nameJa : course.nameKo}
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.2 rounded-md">
                            {course.badgeEmoji} {isJapanese ? course.historicTitleJa : course.historicTitleKo}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          📍 {isJapanese ? course.regionJa : course.regionKo}
                        </p>
                      </div>
                      <span className="text-[11px] text-stone-400 group-hover:text-emerald-700 font-black shrink-0">
                        {isJapanese ? '詳細 🔍' : '상세 실록 🔍'}
                      </span>
                    </div>

                    <div className="text-[11.5px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200/80 font-medium">
                      {isJapanese ? course.taglineJa : course.taglineKo}
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      {isCompleted ? (
                        <span className="font-black text-emerald-800 bg-emerald-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <span>🏆</span>
                          <span>
                            {isJapanese
                              ? `巡礼完走 ${rec.roundCount}回 ${rec.bestScore ? `(最少 ${rec.bestScore}打)` : ''} · 証明書`
                              : `성지 완주 ${rec.roundCount}회 ${rec.bestScore ? `(최저 ${rec.bestScore}타)` : ''} · 인증서 발급`}
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>⛩️</span>
                          <span>{isJapanese ? '巡礼挑戦待機中 (タップで案内)' : '성지 순례 도전 대기 (터치 시 안내)'}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-bold">
                        {course.petitionVotes}{isJapanese ? '票 推薦' : '표 추천'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 🇯🇵 트랙 C: 일본 열도 5대 명품 성지 (Japan Masterpiece 5) */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xl">🇯🇵</span>
                <div>
                  <h4 className="text-sm font-black text-stone-900">
                    {isJapanese ? '日本列島 5大名門聖地' : '일본 열도 5대 명품 성지'}
                  </h4>
                  <p className="text-[10px] text-stone-500">
                    {isJapanese ? '北海道から九州まで本場日本の代表名門コース' : '홋카이도에서 규슈까지 본토 일본을 대표하는 공인 명문 구장'}
                  </p>
                </div>
              </div>
              <span className="text-xs font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full">
                {pilgrimStatus.visitedJapanMasterpieceCount}/{pilgrimStatus.totalJapanMasterpieceCount} {isJapanese ? '巡礼完了' : '완주'}
              </span>
            </div>

            <div className="space-y-2.5">
              {PILGRIMAGE_COURSES.filter((c) => c.category === 'JAPAN_MASTERPIECE').map((course) => {
                const rec = PilgrimageStorage.getUserCourseRecord(course.courseId, completedRounds);
                const isCompleted = rec.isVisited;
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setSelectedPilgrimCourse(course)}
                    className="w-full text-left p-3.5 bg-stone-50 hover:bg-rose-50/70 border border-stone-200 hover:border-rose-300 rounded-2xl transition active:scale-[0.98] cursor-pointer space-y-2 shadow-xs group touch-manipulation select-none"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-stone-900 group-hover:text-rose-950 transition">
                            {isJapanese ? course.nameJa : course.nameKo}
                          </span>
                          <span className="text-[10px] bg-rose-100 text-rose-900 font-bold px-1.5 py-0.2 rounded-md">
                            {course.badgeEmoji} {isJapanese ? course.historicTitleJa : course.historicTitleKo}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                          📍 {isJapanese ? course.regionJa : course.regionKo}
                        </p>
                      </div>
                      <span className="text-[11px] text-stone-400 group-hover:text-rose-700 font-black shrink-0">
                        {isJapanese ? '詳細 🔍' : '상세 실록 🔍'}
                      </span>
                    </div>

                    <div className="text-[11.5px] text-stone-600 bg-white p-2 rounded-xl border border-stone-200/80 font-medium">
                      {isJapanese ? course.taglineJa : course.taglineKo}
                    </div>

                    <div className="flex items-center justify-between pt-0.5 text-xs">
                      {isCompleted ? (
                        <span className="font-black text-rose-800 bg-rose-200/80 px-2.5 py-1 rounded-xl flex items-center gap-1">
                          <span>🏆</span>
                          <span>
                            {isJapanese
                              ? `巡礼完走 ${rec.roundCount}回 ${rec.bestScore ? `(最少 ${rec.bestScore}打)` : ''} · 証明書`
                              : `성지 완주 ${rec.roundCount}회 ${rec.bestScore ? `(최저 ${rec.bestScore}타)` : ''} · 인증서 발급`}
                          </span>
                        </span>
                      ) : (
                        <span className="font-bold text-stone-500 bg-stone-200/80 px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <span>⛩️</span>
                          <span>{isJapanese ? '巡礼挑戦待機中 (タップで案内)' : '성지 순례 도전 대기 (터치 시 안내)'}</span>
                        </span>
                      )}
                      <span className="text-[10px] text-stone-400 font-bold">
                        {course.petitionVotes}{isJapanese ? '票 推薦' : '표 추천'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ✈️ 트랙 D: 현해탄을 건넌 한일 글로벌 개척자 트로피 */}
          {(() => {
            const pioneerCourse = PILGRIMAGE_COURSES.find((c) => c.category === 'GLOBAL_PIONEER');
            if (!pioneerCourse) return null;
            return (
              <div
                onClick={() => setSelectedPilgrimCourse(pioneerCourse)}
                className="bg-gradient-to-br from-cyan-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 border-2 border-cyan-400/50 shadow-lg space-y-3 cursor-pointer hover:border-cyan-300 transition active:scale-[0.98] touch-manipulation select-none"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-400 text-stone-950 flex items-center justify-center font-black text-2xl shadow-lg border border-cyan-300">
                      ✈️
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-black text-cyan-200">
                          {isJapanese ? pioneerCourse.nameJa : pioneerCourse.nameKo}
                        </h4>
                        <span className="text-[10px] bg-cyan-400 text-stone-950 font-black px-1.5 py-0.2 rounded-full">
                          GLOBAL
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-300">
                        {isJapanese ? '日韓海峡を越えたグローバルフロンティア' : '현해탄을 건너 양국의 필드를 개척한 골퍼 영예'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-cyan-300">
                    {isJapanese ? '詳細 🔍' : '실록 보기 🔍'}
                  </span>
                </div>

                <p className="text-xs text-stone-300 bg-white/10 p-3 rounded-2xl border border-white/10 leading-relaxed font-medium">
                  {isJapanese ? pioneerCourse.taglineJa : pioneerCourse.taglineKo}
                </p>

                <div className="flex items-center justify-between pt-1">
                  {pilgrimStatus.hasGlobalPioneer ? (
                    <span className="text-xs font-black text-amber-300 bg-amber-400/20 px-3 py-1 rounded-xl border border-amber-400/40 flex items-center gap-1.5">
                      <span>🏆</span>
                      <span>{isJapanese ? '授与完了 (黄金証明書 閲覧可能)' : '공식 수여 완료 (황금 인증서 열람 가능)'}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-cyan-200 bg-cyan-900/50 px-3 py-1 rounded-xl border border-cyan-500/30 flex items-center gap-1.5">
                      <span>⏳</span>
                      <span>{isJapanese ? '挑戦中 (海外コース1回完走で即時達成)' : '도전 진행 중 (해외 구장 1회 완주 시 즉시 획득)'}</span>
                    </span>
                  )}
                  <span className="text-[10px] text-stone-400">
                    {isJapanese ? 'タップして詳細確認' : '터치하여 상세 확인'}
                  </span>
                </div>
              </div>
            );
          })()}

          {/* 기존 전국 시도별 정복 및 완주 구장 섹션 연결 */}
          <div className="pt-2 border-t border-stone-200">
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-black">
                  {isJapanese ? '全国コース制覇スタンプ' : '전국 구장 도장깨기 스탬프'}
                </h3>
              </div>
              <p className="text-xs text-blue-200 font-medium">
                {isJapanese
                  ? '全国のパークゴルフ場を回り、完走したコースで黄金のトロフィーピンを獲得しましょう！'
                  : '전국 500여 개 파크골프장을 누비며 완주한 구장에 황금 트로피 핀을 획득하세요!'}
              </p>
            </div>
          </div>

          {/* 시도별 정복 현황 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <h4 className="text-xs font-black text-stone-700">
              {isJapanese ? '地域別コース制覇率' : '시·도별 구장 정복률'}
            </h4>
            <div className="space-y-2.5">
              {regionalStats.map((reg) => (
                <div key={reg.name} className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-stone-900">
                      {reg.name} ({reg.conquered}/{reg.total}{isJapanese ? 'コース' : '개 구장'})
                    </span>
                    <span className="text-emerald-700">
                      {reg.pct}% {isJapanese ? '制覇' : '정복'}
                    </span>
                  </div>
                  <div className="w-full bg-stone-200 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${Math.max(reg.pct, 0)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 완주한 황금빛 구장 목록 */}
          <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h4 className="text-xs font-black text-stone-900">
                {isJapanese
                  ? `制覇完了した黄金コース (${conqueredCoursesList.length}箇所)`
                  : `정복 완료한 황금빛 구장 (${conqueredCoursesList.length}개소)`}
              </h4>
            </div>

            {conqueredCoursesList.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-dashed border-stone-300 space-y-2">
                <span className="text-3xl">🏆</span>
                <p className="font-black text-xs text-stone-700">
                  {isJapanese ? 'まだ制覇完了したコースがありません。' : '아직 정복 완료한 구장이 없습니다.'}
                </p>
                <p className="text-[11px] text-stone-400">
                  {isJapanese
                    ? '全国パークゴルフ場で公式スコアカードを完走して保存すると、黄金のトロフィースタンプが押されます。'
                    : '전국 파크골프장에서 공식 스코어카드를 완주하고 저장하면 황금빛 트로피 도장이 찍힙니다.'}
                </p>
                <div className="pt-1">
                  <Link
                    href="/"
                    className="inline-block px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95"
                  >
                    {isJapanese ? '全国のコースを探す ▶' : '전국 구장 찾아보기 ▶'}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {conqueredCoursesList.map((c) => (
                  <div key={c.id} className="p-3 bg-amber-50/60 border border-amber-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
                        🏆
                      </div>
                      <div>
                        <div className="text-xs font-black text-stone-900">{c.name}</div>
                        <div className="text-[10px] text-stone-500">
                          {c.region} · {c.totalHoles}{isJapanese ? 'ホール完走認定' : '홀 완주 인증'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full">
                      {isJapanese ? '制覇完了' : '정복 완료'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Bottom Home Navigation Button */}
      <div className="pt-2">
        <Link
          href="/"
          className="w-full min-h-[52px] bg-stone-800 hover:bg-stone-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-base shadow active:scale-98 transition"
        >
          <Home className="w-5 h-5" />
          <span>{isJapanese ? 'パークゴルフ オールインワン ホームへ戻る' : '파크골프 올인원 홈 화면으로 돌아가기'}</span>
        </Link>
      </div>

      {/* Companion QR Modal */}
      <CompanionQRModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onCompanionAdded={() => setCompanions(CompanionStorage.getCompanions())}
      />

      {/* Companion Lightning Modal */}
      <CompanionLightningModal
        isOpen={showLightningModal}
        onClose={() => setShowLightningModal(false)}
        onRoundCreated={() => setLightningRounds(CompanionStorage.getLightningRounds())}
      />

      {/* 1촌 동반자 디지털 명함 모달 */}
      {selectedCompanionCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            {/* 상단 카드 헤더 */}
            <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-stone-900 text-white p-5 relative">
              <button
                type="button"
                onClick={() => setSelectedCompanionCard(null)}
                className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">📇</span>
                <span className="text-xs font-bold text-amber-200 tracking-wider">
                  {isJapanese ? '仲間ゴルファー デジタル名刺' : '1촌 동호인 디지털 명함'}
                </span>
              </div>
              <h3 className="text-xl font-black text-white">{selectedCompanionCard.name}</h3>
              <p className="text-xs text-amber-100 font-medium">
                {selectedCompanionCard.company} · {selectedCompanionCard.title}
              </p>
            </div>

            {/* 본문 정보 */}
            <div className="p-5 space-y-3 text-xs text-stone-700">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="font-black text-stone-900">{selectedCompanionCard.company}</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                    {selectedCompanionCard.industry}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <Briefcase className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{isJapanese ? '役職:' : '직함:'} {selectedCompanionCard.title}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>{isJapanese ? '活動地域:' : '활동 지역:'} {selectedCompanionCard.region}</span>
                </div>
              </div>

              {selectedCompanionCard.bio && (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200/80 text-stone-800 text-[11.5px] leading-relaxed">
                  &ldquo;{selectedCompanionCard.bio}&rdquo;
                </div>
              )}

              {/* 연락처 바로가기 */}
              <div className="pt-1 flex items-center gap-2">
                {selectedCompanionCard.phone && (
                  <a
                    href={`tel:${selectedCompanionCard.phone.replace(/[^0-9]/g, '')}`}
                    className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-center flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
                  >
                    <Phone className="w-4 h-4" />
                    <span>{isJapanese ? '電話発信' : '전화 연결'}</span>
                  </a>
                )}
                {selectedCompanionCard.email && (
                  <a
                    href={`mailto:${selectedCompanionCard.email}`}
                    className="flex-1 py-3 bg-stone-800 hover:bg-stone-900 text-white font-black rounded-xl text-center flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{isJapanese ? 'メール' : '이메일'}</span>
                  </a>
                )}
              </div>
            </div>

            {/* 닫기 버튼 */}
            <div className="p-3 bg-stone-100 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setSelectedCompanionCard(null)}
                className="w-full py-2.5 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-black rounded-xl text-xs transition cursor-pointer"
              >
                {isJapanese ? '閉じる' : '닫기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏅 명예의 전당 특별 훈장 상세 모달 */}
      {selectedMedalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 max-h-[85vh] overflow-y-auto">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedMedalModal === 'HIO' ? '⛳' : selectedMedalModal === 'EAGLE' ? '🦅' : '🦢'}
                </span>
                <div>
                  <h3 className="font-black text-sm text-stone-900">
                    {selectedMedalModal === 'HIO'
                      ? (isJapanese ? 'ホールインワンの殿堂' : '홀인원 명예의 전당')
                      : selectedMedalModal === 'EAGLE'
                      ? (isJapanese ? 'イーグルメダルの殿堂' : '이글 훈장 명예의 전당')
                      : (isJapanese ? 'アルバトロスメダルの殿堂' : '알바트로스 훈장 명예의 전당')}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-bold">
                    {selectedMedalModal === 'HIO'
                      ? (isJapanese
                          ? `計 ${totalHoleInOnes}回 達成 (Par3 · Par4 · Par5別)`
                          : `총 ${totalHoleInOnes}회 달성 (파3 · 파4 · 파5별 실록)`)
                      : selectedMedalModal === 'EAGLE'
                      ? (isJapanese
                          ? `計 ${totalEagles}回 達成 (Par4 · Par5別)`
                          : `총 ${totalEagles}회 달성 (파4 · 파5별 실록)`)
                      : (isJapanese
                          ? `計 ${totalAlbatross}回 達成 (Par5 2打完走実録)`
                          : `총 ${totalAlbatross}회 달성 (파5 2타 완주 실록)`)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedMedalModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold cursor-pointer transition active:scale-95"
              >
                ✕
              </button>
            </div>

            {/* 1. 홀인원 세부 통계 */}
            {selectedMedalModal === 'HIO' && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 space-y-0.5">
                    <div className="text-[10px] text-amber-800 font-black">
                      {isJapanese ? 'Par3 ホールインワン' : '파3 홀인원'}
                    </div>
                    <div className="text-lg font-black text-amber-700">{hioListPar3.length}{isJapanese ? '回' : '회'}</div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      {isJapanese ? 'ショート 1打' : '숏홀 원샷'}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 space-y-0.5">
                    <div className="text-[10px] text-amber-800 font-black">
                      {isJapanese ? 'Par4 ホールインワン' : '파4 홀인원'}
                    </div>
                    <div className="text-lg font-black text-amber-700">{hioListPar4.length}{isJapanese ? '回' : '회'}</div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      {isJapanese ? 'ミドル 奇跡' : '미들홀 기적'}
                    </div>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-2xl border border-amber-200 space-y-0.5">
                    <div className="text-[10px] text-amber-800 font-black">
                      {isJapanese ? 'Par5 ホールインワン' : '파5 홀인원'}
                    </div>
                    <div className="text-lg font-black text-amber-700">{hioListPar5.length}{isJapanese ? '回' : '회'}</div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      {isJapanese ? 'ロング コンドル' : '롱홀 콘도르'}
                    </div>
                  </div>
                </div>

                {/* 상세 실록 리스트 */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>{isJapanese ? '📜 公式ホールインワン達成内訳' : '📜 공식 홀인원 달성 내역'}</span>
                    <span className="text-[10px] text-stone-400">({totalHoleInOnes}{isJapanese ? '件' : '건'})</span>
                  </div>

                  {totalHoleInOnes === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center space-y-1">
                      <p className="text-xs font-black text-stone-600">
                        {isJapanese ? 'まだ達成されたホールインワンの記録がありません。' : '아직 달성된 홀인원 기록이 없습니다.'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isJapanese
                          ? 'フィールドで1打でホールインするとPar3/Par4/Par5別に永久実録に自動登録されます！'
                          : '필드에서 1타에 홀인하면 파3/파4/파5별로 영구 실록에 자동 등록됩니다!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {[...hioListPar5, ...hioListPar4, ...hioListPar3].map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-stone-900 flex items-center gap-1">
                              <span className="bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                                Par {item.par}
                              </span>
                              <span>{item.courseName}</span>
                              <span className="text-amber-800 font-bold">{item.holeLabel}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              {item.date} {isJapanese ? '達成' : '달성'}
                            </div>
                          </div>
                          <span className="font-black text-amber-700 bg-white px-2 py-1 rounded-lg border border-amber-200">
                            {isJapanese ? '1打 (ホールインワン)' : '1타 (홀인원)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. 이글 세부 통계 */}
            {selectedMedalModal === 'EAGLE' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-0.5">
                    <div className="text-[10px] text-emerald-800 font-black">
                      {isJapanese ? 'Par4 イーグル' : '파4 이글'}
                    </div>
                    <div className="text-lg font-black text-emerald-700">{eagleListPar4.length}{isJapanese ? '回' : '회'}</div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      {isJapanese ? '2打完走 (-2打)' : '2타 완주 (-2타)'}
                    </div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 space-y-0.5">
                    <div className="text-[10px] text-emerald-800 font-black">
                      {isJapanese ? 'Par5 イーグル' : '파5 이글'}
                    </div>
                    <div className="text-lg font-black text-emerald-700">{eagleListPar5.length}{isJapanese ? '回' : '회'}</div>
                    <div className="text-[9px] text-stone-400 font-medium">
                      {isJapanese ? '3打完走 (-2打)' : '3타 완주 (-2타)'}
                    </div>
                  </div>
                </div>

                {/* 상세 실록 리스트 */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>{isJapanese ? '📜 公式イーグル達成内訳' : '📜 공식 이글 달성 내역'}</span>
                    <span className="text-[10px] text-stone-400">({totalEagles}{isJapanese ? '件' : '건'})</span>
                  </div>

                  {totalEagles === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center space-y-1">
                      <p className="text-xs font-black text-stone-600">
                        {isJapanese ? 'まだ達成されたイーグルの記録がありません。' : '아직 달성된 이글 기록이 없습니다.'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isJapanese
                          ? 'Par4で2打、Par5で3打でホールアウトするとイーグルメダル実録に自動登録されます！'
                          : '파4에서 2타, 파5에서 3타로 홀아웃하면 이글 훈장 실록에 자동 등록됩니다!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {[...eagleListPar5, ...eagleListPar4].map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-stone-900 flex items-center gap-1">
                              <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                                Par {item.par}
                              </span>
                              <span>{item.courseName}</span>
                              <span className="text-emerald-800 font-bold">{item.holeLabel}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              {item.date} {isJapanese ? '達成' : '달성'}
                            </div>
                          </div>
                          <span className="font-black text-emerald-700 bg-white px-2 py-1 rounded-lg border border-emerald-200">
                            {item.strokes}{isJapanese ? '打 (-2打)' : '타 (-2타)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. 알바트로스 세부 통계 */}
            {selectedMedalModal === 'ALBATROSS' && (
              <div className="space-y-3">
                <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 text-center space-y-1">
                  <div className="text-[11px] text-indigo-900 font-black">
                    {isJapanese ? 'Par5 ロングホール アルバトロス' : '파5 롱홀 알바트로스'}
                  </div>
                  <div className="text-2xl font-black text-indigo-800">
                    {totalAlbatross}{isJapanese ? '回 達成' : '회 달성'}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-bold">
                    {isJapanese ? '100〜150m ロングホールで2打完走 (-3打の伝説)' : '100~150m 롱홀에서 2타 만에 홀아웃 (-3타 전설)'}
                  </div>
                </div>

                {/* 상세 실록 리스트 */}
                <div className="space-y-2">
                  <div className="text-xs font-black text-stone-800 flex items-center gap-1">
                    <span>{isJapanese ? '📜 公式アルバトロス達成内訳' : '📜 공식 알바트로스 달성 내역'}</span>
                    <span className="text-[10px] text-stone-400">({totalAlbatross}{isJapanese ? '件' : '건'})</span>
                  </div>

                  {totalAlbatross === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300 text-center space-y-1">
                      <p className="text-xs font-black text-stone-600">
                        {isJapanese ? 'まだ達成されたアルバトロスの記録がありません。' : '아직 달성된 알바트로스 기록이 없습니다.'}
                      </p>
                      <p className="text-[10px] text-stone-400">
                        {isJapanese
                          ? 'Par5 ロングホールで2打でホールアウトすると伝説のアルバトロスメダルが授与されます！'
                          : '파5 롱홀에서 2타 만에 홀아웃하면 전설의 알바트로스 훈장이 수여됩니다!'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {albatrossList.map((item, idx) => (
                        <div key={idx} className="p-2.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 flex items-center justify-between text-xs">
                          <div>
                            <div className="font-black text-stone-900 flex items-center gap-1">
                              <span className="bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded">
                                Par {item.par}
                              </span>
                              <span>{item.courseName}</span>
                              <span className="text-indigo-800 font-bold">{item.holeLabel}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              {item.date} {isJapanese ? '達成' : '달성'}
                            </div>
                          </div>
                          <span className="font-black text-indigo-700 bg-white px-2 py-1 rounded-lg border border-indigo-200">
                            2{isJapanese ? '打 (-3打)' : '타 (-3타)'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setSelectedMedalModal(null)}
              className="w-full py-2.5 bg-stone-800 hover:bg-stone-900 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer"
            >
              {isJapanese ? '閉じる' : '닫기'}
            </button>
          </div>
        </div>
      )}

      {/* ⛩️ 한일 공식 성지순례 상세 모달 */}
      <PilgrimageDetailModal
        course={selectedPilgrimCourse}
        completedRounds={completedRounds}
        isOpen={!!selectedPilgrimCourse}
        onClose={() => setSelectedPilgrimCourse(null)}
      />

      {/* 👑 회원번호 로그인 & 프로필 관리 모달 */}
      <KakaoLoginModal
        isOpen={showLoginModal}
        initialMode={loginModalMode}
        onClose={() => {
          setShowLoginModal(false);
          setMemberCode(getSavedMemberCode());
        }}
      />
    </div>
  );
}

export default function ChroniclePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-600">Loading...</div>}>
      <ChronicleContent />
    </Suspense>
  );
}
