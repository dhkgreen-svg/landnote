'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Share2, Copy, Check, Home, BookmarkCheck, ArrowRight, ShieldAlert, Sparkles, Trophy, Camera, CreditCard, Trash2 } from 'lucide-react';
import { RoundSession, Course } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { CompanionStorage } from '@/lib/companionStorage';
import { BusinessCardStorage } from '@/lib/businessCardStorage';
import { BusinessCardModal } from '@/components/BusinessCardModal';
import { WatermarkPhotoCardModal } from '@/components/WatermarkPhotoCardModal';
import { ChroniclePhotoUploadModal } from '@/components/ChroniclePhotoUploadModal';
import { PRESCRIPTIONS } from '@/lib/defaultCourses';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';
import { KakaoAuthUser } from '@/lib/storage';
import { KakaoLoginModal } from '@/components/KakaoLoginModal';
import { DigitalBadgeModal } from '@/components/DigitalBadgeModal';
import { CourseHallOfFameModal } from '@/components/CourseHallOfFameModal';
import { NationalTourMapModal } from '@/components/NationalTourMapModal';
import { BadgeStorage, CourseBadgeRecord, ProvinceInfo } from '@/lib/badgeStorage';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getCourseDualName } from '@/lib/courseLocalization';
import { formatPlayerDisplayName } from '@/lib/playerUtils';
import { DiamondTierBadge } from '@/components/DiamondTierBadge';
import { calculateTier, getUserCompleted9Holes } from '@/lib/courseBlockTier';
import { RestaurantSubmitModal } from '@/components/RestaurantSubmitModal';

const JA_PRESCRIPTIONS = [
  {
    id: 'rx-par3-short',
    title: 'Par 3 ショートホール打数セーブ緊急処方',
    summary: 'ショートパットの距離感＆ヘッドアップ防止',
    content: 'Par 3で打数が増えた主な原因は、ティーショット後の3〜5mパッティングのオーバーまたはショートです。インパクト後1秒間視線を芝に固定し、バックスイングとフォローの比率を1:1で維持しましょう。',
  },
  {
    id: 'rx-ob-control',
    title: 'OB多発ホール 方向性改善緊急処方',
    summary: 'ヘッドリリースとアドレスエイミングの再調整',
    content: 'OBが発生したホールでは、飛距離を意識して体が先に開く傾向があります。グリッププレッシャーを30%落とし、目標より3m手前の芝を仮想エイミングポイントにして柔らかくスイングしましょう。',
  },
  {
    id: 'rx-long-hole',
    title: 'Par 5 ロングホール セカンドショット安定化処方',
    summary: '無理な2オンを避け、30mアプローチ分割攻略',
    content: 'ロングホールでは2オンの欲を抑え、徹底した3オン戦略をとることで安定したParセーブが可能です。70m + 40m + 10mの分割打撃を実践してみてください。',
  },
];

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roundId = searchParams.get('id');
  const { t, isJapanese, isEnglish } = useTranslation();
  const [copiedResult, setCopiedResult] = useState<boolean>(false);

  const handleCopyResultUrl = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.parkgolfallinone.com';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedResult(true);
      setTimeout(() => setCopiedResult(false), 2500);
    }
  };

  const [session, setSession] = useState<RoundSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedPlayerId, setSavedPlayerId] = useState<string | null>(null);
  const [showPhotoCardModal, setShowPhotoCardModal] = useState<boolean>(false);
  const [showPostRoundPhotoPrompt, setShowPostRoundPhotoPrompt] = useState<boolean>(false);
  const [showPhotoUploadModal, setShowPhotoUploadModal] = useState<boolean>(false);
  const [showBusinessCardModal, setShowBusinessCardModal] = useState<boolean>(false);
  const [exchangeCardToast, setExchangeCardToast] = useState<string | null>(null);
  const [kakaoUser, setKakaoUser] = useState<KakaoAuthUser | null>(null);
  const [showKakaoModal, setShowKakaoModal] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string | null>(null);
  const [badgeRecord, setBadgeRecord] = useState<CourseBadgeRecord | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [showHallOfFameModal, setShowHallOfFameModal] = useState<boolean>(false);
  const [showNationalTourModal, setShowNationalTourModal] = useState<boolean>(false);
  const [newlyUnlockedProvince, setNewlyUnlockedProvince] = useState<ProvinceInfo | null>(null);
  const [isFull18Completed, setIsFull18Completed] = useState<boolean>(false);
  const [showRestaurantModal, setShowRestaurantModal] = useState<boolean>(false);

  const handleExchangeCards = () => {
    if (!session) return;
    const added = BusinessCardStorage.exchangeWithRoundCompanions(session.players);
    setExchangeCardToast(`동반자 ${added}명의 디지털 명함이 내 명함첩에 안전하게 보관되었습니다!`);
    setTimeout(() => setExchangeCardToast(null), 3500);
    setShowBusinessCardModal(true);
  };

  useEffect(() => {
    if (!roundId) {
      const current = ParkOnStorage.getCurrentRound();
      if (current) {
        setSession(current);
      } else {
        const completed = ParkOnStorage.getCompletedRounds();
        if (completed.length > 0) setSession(completed[0]);
      }
      return;
    }

    const completed = ParkOnStorage.getCompletedRounds().find((r) => r.id === roundId);
    if (completed) {
      setSession(completed);
    } else {
      const current = ParkOnStorage.getCurrentRound();
      if (current && current.id === roundId) {
        setSession(current);
      } else {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const rid = searchParams?.get('roomId') || 'latest';
        fetch(`/api/round/room?roomId=${encodeURIComponent(rid)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.room?.roundSession) {
              const restored = data.room.roundSession;
              const storedPlayerName = typeof localStorage !== 'undefined' ? localStorage.getItem('parkon_player_name')?.trim() : '';
              const selfName =
                ParkOnStorage.getUserDisplayName() ||
                ParkOnStorage.getUserProfile()?.userName ||
                ParkOnStorage.getKakaoUser()?.nickname ||
                storedPlayerName;
              const fixedRestored: RoundSession = {
                ...restored,
                players: (restored.players || []).map((p: any) => ({
                  ...p,
                  isSelf: selfName && selfName !== '플레이어' ? p.name === selfName : p.isSelf,
                })),
              };
              ParkOnStorage.saveCompletedRound(fixedRestored);
              setSession(fixedRestored);
            }
          })
          .catch(() => {});
      }
    }
  }, [roundId]);

  useEffect(() => {
    if (session) {
      const allCourses = ParkOnStorage.getAllCourses();
      const found = allCourses.find((c) => c.id === session.courseId) || allCourses[0];
      setCourse(found);
      // 자동 1촌 연결 & 누적 라운드 카운트 증가
      CompanionStorage.autoConnectRoundCompanions(session);
      const currentUser = ParkOnStorage.getKakaoUser();
      setKakaoUser(currentUser);
      if (currentUser?.id) {
        BadgeStorage.syncToCloud(currentUser.id, currentUser.nickname);
      }

      // [대표님 핵심 원칙]: 9홀 모듈형 기준 - 9홀 단위 완주 확인 & 뱃지/당일연타석 스탬프 자동 발급
      const myPlayer = session.players?.find((p) => p.isSelf) || session.players?.[0];
      const myScoredCount = myPlayer
        ? Object.keys(myPlayer.scores || {}).filter((h) => Number(myPlayer.scores[Number(h)]) > 0).length
        : 0;
      const totalHolesCount = (session.selectedHoleNumbers?.length || session.confirmedHoles?.length || session.totalHoles || 0);
      const effectiveHoles = Math.max(myScoredCount, totalHolesCount);
      const is9HoleCompleted = effectiveHoles >= 9;
      setIsFull18Completed(is9HoleCompleted);

      // 코스 문자열 추출 (예: A코스 + B코스 + C코스)
      const COURSE_LETTERS_MAP = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const playedHolesList = (session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0
        ? session.selectedHoleNumbers
        : Array.from({ length: session.totalHoles || 18 }, (_, i) => i + 1)
      );
      const invCourses = Array.from(
        new Set(
          playedHolesList.map((hNum) => {
            const baseH = ((hNum - 1) % 1000) + 1;
            const cIdx = Math.floor((baseH - 1) / 9);
            return COURSE_LETTERS_MAP[cIdx % COURSE_LETTERS_MAP.length] || 'A';
          })
        )
      );
      const cPlayedStr = invCourses.map((l) => `${l}코스`).join(' + ');

      if (is9HoleCompleted) {
        const badgeResult = BadgeStorage.recordCompletion(
          found.id,
          found.name,
          effectiveHoles,
          found.region || found.address,
          cPlayedStr
        );
        setBadgeRecord(badgeResult.badge);
        if (badgeResult.isNewProvinceUnlocked && badgeResult.unlockedProvince) {
          setNewlyUnlockedProvince(badgeResult.unlockedProvince);
        }
        // 1. 라운드 종료 기념사진 등록 유도 팝업
        const photoPromptKey = `parkon_photo_prompt_seen_${session.id}`;
        if (!sessionStorage.getItem(photoPromptKey)) {
          setShowPostRoundPhotoPrompt(true);
          sessionStorage.setItem(photoPromptKey, 'true');
        } else {
          // 첫 진입 시 완주 뱃지 자동 팝업
          const seenKey = `parkon_badge_seen_${session.id}`;
          if (!sessionStorage.getItem(seenKey)) {
            setShowBadgeModal(true);
            sessionStorage.setItem(seenKey, 'true');
          }
        }
      } else {
        const existing = BadgeStorage.getBadge(found.id);
        if (existing) setBadgeRecord(existing);
      }
    }
  }, [session]);

  if (!session || !course) {
    return (
      <div className="p-8 text-center font-bold text-stone-600">
        성적표 불러오는 중...
      </div>
    );
  }

  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

  // 1. Identify which holes actually have recorded strokes from at least one player
  const playedHoleNumbers = (session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0
    ? session.selectedHoleNumbers
    : Array.from({ length: session.totalHoles }, (_, i) => i + 1)
  ).filter((hNum) => session.players.some((p) => (p.scores?.[hNum] || 0) > 0));

  // If no scores are recorded yet (edge fallback), use selectedHoleNumbers or 1..totalHoles
  const effectivePlayedHoles = playedHoleNumbers.length > 0
    ? playedHoleNumbers
    : (session.selectedHoleNumbers && session.selectedHoleNumbers.length > 0
        ? session.selectedHoleNumbers
        : Array.from({ length: session.totalHoles }, (_, i) => i + 1));

  // 2. Identify which courses were part of this round
  const involvedCourses: string[] = session.selectedCourseLetters && session.selectedCourseLetters.length > 0
    ? [...session.selectedCourseLetters]
    : Array.from(new Set(effectivePlayedHoles.map((hNum) => COURSE_LETTERS[Math.floor((Number(hNum) - 1) / 9)] || 'A')));

  // Ensure any course that has played holes is also in involvedCourses
  effectivePlayedHoles.forEach((hNum) => {
    const letter = COURSE_LETTERS[Math.floor((Number(hNum) - 1) / 9)] || 'A';
    if (!involvedCourses.includes(letter)) {
      involvedCourses.push(letter);
    }
  });

  // Calculate total course par for ONLY played holes
  let totalCoursePar = 0;
  effectivePlayedHoles.forEach((hNum) => {
    const hMeta = course.holesMetadata?.find((m) => Number(m.hole) === Number(hNum));
    totalCoursePar += hMeta?.par || 3;
  });

  // Group course section data (A, B, C...)
  const courseSections = involvedCourses.map((cLetter) => {
    const cIdx = Math.max(0, COURSE_LETTERS.indexOf(cLetter));
    const startHole = cIdx * 9 + 1;
    const full9Holes = Array.from({ length: 9 }, (_, i) => startHole + i);
    const playedInCourse = full9Holes.filter((hNum) => effectivePlayedHoles.includes(hNum));
    const coursePlayedPar = playedInCourse.reduce((acc, hNum) => {
      const hMeta = course.holesMetadata?.find((m) => Number(m.hole) === Number(hNum));
      return acc + (hMeta?.par || 3);
    }, 0);

    return {
      letter: cLetter,
      full9Holes,
      playedInCourse,
      coursePlayedPar,
    };
  });

  const coursesPlayedStr = involvedCourses.map((l) => (isJapanese ? `${l}コース` : `${l}코스`)).join(' + ');
  const totalHolesCount = effectivePlayedHoles.length;

  // Calculate each player's actual total strokes across only played holes
  const playersWithRealTotals = session.players.map((p) => {
    const realTotal = effectivePlayedHoles.reduce((sum, hNum) => sum + (p.scores?.[hNum] || 0), 0);
    return {
      ...p,
      realTotalStrokes: realTotal > 0 ? realTotal : p.totalStrokes,
    };
  });

  // Sort players: valid scores (> 0) sorted ascending, unplayed/zero strokes pushed to the end
  const rankedPlayers = [...playersWithRealTotals].sort((a, b) => {
    if (a.realTotalStrokes > 0 && b.realTotalStrokes > 0) {
      return a.realTotalStrokes - b.realTotalStrokes;
    }
    if (a.realTotalStrokes > 0 && b.realTotalStrokes <= 0) return -1;
    if (a.realTotalStrokes <= 0 && b.realTotalStrokes > 0) return 1;
    return 0;
  });

  // KakaoTalk & LINE Text Generation with per-course breakdown
  const generateKakaoText = () => {
    const dateStr = session.completedAt
      ? new Date(session.completedAt).toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR')
      : new Date().toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR');

    const topPlayer = session.players.find((p) => p.isSelf) || rankedPlayers[0];
    const topCompleted = getUserCompleted9Holes(topPlayer?.name);
    const topTier = calculateTier(topCompleted);

    const lines = isJapanese
      ? [
          `⛳ [パークゴルフ オールインワン] ${session.courseName} (${coursesPlayedStr}) ラウンド最終成績表`,
          `👑 ${topPlayer?.name || 'プレーヤー'}様の[${topTier.nameJa}] (${topCompleted}回完走) 公式成績`,
          `📅 日時: ${dateStr} (計 ${totalHolesCount}ホール進行 / 基準 Par ${totalCoursePar})`,
          `━━━━━━━━━━━━━━━━`,
        ]
      : [
          `⛳ [파크골프 올인원] ${session.courseName} (${coursesPlayedStr}) 라운드 최종 성적표`,
          `👑 ${topPlayer?.name || '골퍼'}님의 [${topTier.nameKo}] (${topCompleted}회 완주) 공식 성적`,
          `📅 일시: ${dateStr} (총 ${totalHolesCount}홀 진행 / 기준 Par ${totalCoursePar})`,
          `━━━━━━━━━━━━━━━━`,
        ];

    rankedPlayers.forEach((p, idx) => {
      const diff = p.realTotalStrokes - totalCoursePar;
      const diffStr = diff === 0 ? 'E' : diff > 0 ? `+${diff}` : `${diff}`;
      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '👤';

      const courseBreakdown = courseSections
        .filter((c) => c.playedInCourse.length > 0)
        .map((c) => {
          const cScore = c.playedInCourse.reduce((sum, h) => sum + (p.scores?.[h] || 0), 0);
          return isJapanese
            ? `${c.letter}コース(${c.playedInCourse.length}ホール): ${cScore}打`
            : `${c.letter}코스(${c.playedInCourse.length}홀): ${cScore}타`;
        })
        .join(' / ');

      const rankTitle = isJapanese ? `${idx + 1}位` : `${idx + 1}위`;
      const scoreUnit = isJapanese ? '打' : '타';
      const cleanName = formatPlayerDisplayName(p.name, p.isSelf, isJapanese);
      lines.push(`${medal} ${rankTitle}: ${cleanName} - ${p.realTotalStrokes}${scoreUnit} (${diffStr})`);
      if (courseBreakdown) {
        lines.push(`   └ ${courseBreakdown}`);
      }
    });

    lines.push(`━━━━━━━━━━━━━━━━`);
    lines.push(isJapanese ? `📱 同伴者自身のスマホにスコアを保存:` : `📱 동반자 본인 폰에 성적 담기:`);
    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.parkgolfallinone.com';
    lines.push(`${originUrl}/round/result?id=${session.id}`);

    return lines.join('\n');
  };

  const handleShareToLine = () => {
    const text = generateKakaoText();
    const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text)}`;
    if (typeof window !== 'undefined') {
      window.open(lineUrl, '_blank');
    }
  };


  const handleCopyKakao = async () => {
    const text = generateKakaoText();
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleShare = async () => {
    const text = generateKakaoText();
    if (navigator.share) {
      try {
        await navigator.share({
          title: isJapanese ? `[パークゴルフ オールインワン] ${session.courseName} ラウンド成績表` : `[파크골프 올인원] ${session.courseName} 라운드 성적표`,
          text: text,
        });
      } catch (err) {
        handleCopyKakao();
      }
    } else {
      handleCopyKakao();
    }
  };

  // One-touch Companion Record Claim (내 기록장에 담기)
  const handleClaimRecord = (playerId: string) => {
    setSavedPlayerId(playerId);
    ParkOnStorage.saveCompletedRound(session);
  };

  // Toggle between Official and Practice/Test mode
  const handleToggleOfficial = () => {
    const updated: RoundSession = {
      ...session,
      isOfficial: session.isOfficial === false ? true : false,
    };
    setSession(updated);
    ParkOnStorage.saveCompletedRound(updated);
  };

  // Weak Point Prescription Logic
  const validRankedPlayers = rankedPlayers.filter((p) => p.realTotalStrokes > 0);
  const winner = validRankedPlayers[0] || rankedPlayers[0];
  const mostOBPlayer = [...session.players].sort(
    (a, b) =>
      Object.values(b.obCount || {}).reduce((x, y) => x + y, 0) -
      Object.values(a.obCount || {}).reduce((x, y) => x + y, 0)
  )[0];
  const totalObs = Object.values(mostOBPlayer?.obCount || {}).reduce((x, y) => x + y, 0);

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* 0. 가상 라운딩 연습 성적표 안내 배너 */}
      {session.isVirtual && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-stone-950 p-4 rounded-2xl border-2 border-amber-300 shadow-md space-y-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <div>
              <span className="text-[10px] bg-stone-950 text-amber-300 font-black px-2 py-0.5 rounded-full">
                {isJapanese ? '体験モード成績表' : '체험 모드 성적표'}
              </span>
              <h3 className="text-sm font-black text-stone-950 mt-0.5">{isJapanese ? '体験練習 スコアカード (未保存)' : '가상 라운딩 연습 성적표 (미저장)'}</h3>
            </div>
          </div>
          <p className="text-xs text-stone-900 font-bold leading-relaxed">
            {isJapanese
              ? <>この成績表は機能体験用で、<span className="underline font-black">実際の戦績やランキングには保存されません。</span></>
              : <>이 성적표는 사용법 연습용으로 <span className="underline font-black">실제 전적이나 랭킹에 저장되지 않습니다.</span></>}
          </p>
          <div className="pt-1">
            <Link
              href={`/round/new?courseId=${session.courseId}`}
              className="inline-flex items-center justify-center gap-1.5 w-full bg-stone-950 hover:bg-stone-900 text-amber-300 font-black py-2.5 rounded-xl text-xs shadow-md transition active:scale-98"
            >
              <span>{isJapanese ? '⛳ 実際のフィールドで [正式ラウンド] を開始 ▶' : '⛳ 실제 필드에서 [정식 라운딩] 시작하기 ▶'}</span>
            </Link>
          </div>
        </div>
      )}

      {/* 명함 교환 알림 토스트 */}
      {exchangeCardToast && (
        <div className="bg-amber-400 text-stone-950 text-xs font-black text-center py-2.5 px-4 rounded-xl shadow-md animate-bounce">
          ✨ {exchangeCardToast}
        </div>
      )}

      {/* 3단계: 전국 17개 시·도 투어 퍼즐 신규 해금 축하 배너 */}
      {newlyUnlockedProvince && (
        <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-stone-950 p-4 rounded-3xl border-2 border-yellow-200 shadow-xl flex items-center justify-between gap-3 animate-bounce">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none">{newlyUnlockedProvince.symbol}</span>
            <div>
              <div className="text-[10px] font-black bg-stone-950 text-yellow-300 px-2 py-0.5 rounded-full inline-block">
                🎉 전국 17개 시·도 투어 퍼즐 해금!
              </div>
              <div className="text-xs font-black text-stone-950 mt-1">
                [{newlyUnlockedProvince.name}] 조각이 황금빛으로 점등되었습니다!
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowNationalTourModal(true)}
            className="bg-stone-950 hover:bg-stone-900 text-amber-300 text-xs font-black px-3.5 py-2 rounded-2xl shadow-lg shrink-0 cursor-pointer transition active:scale-95"
          >
            지도 보기 ▶
          </button>
        </div>
      )}

      {/* 1. Header Trophy Card */}
      <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-3xl p-5 shadow-xl text-center relative overflow-hidden">
        {/* 파키의 완주 응원 배너 */}
        <div className="inline-flex items-center gap-2.5 bg-emerald-900/80 border border-amber-300/60 px-3.5 py-1.5 rounded-2xl mb-3 shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parky.jpg"
            alt="마스코트 파키"
            className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 shrink-0"
          />
          <div className="text-left">
            <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-1.5 py-0.2 rounded-md">
              스마트 AI 코치 파키의 한마디
            </span>
            <p className="text-xs font-bold text-amber-200 mt-0.5">
              &ldquo;오늘 멋진 라운드 완주를 진심으로 축하드려요! 굿샷! 🎉&rdquo;
            </p>
          </div>
        </div>

        <h2 className="text-2xl font-black tracking-tight">{isJapanese ? 'ラウンド最終成績表' : '라운드 최종 성적표'}</h2>
        {(() => {
          const dual = getCourseDualName(course || session.courseName, isJapanese);
          return (
            <div className="mt-1 flex flex-col items-center">
              <span className="text-base font-black text-white flex items-center gap-1.5">
                {dual.flag && <span>{dual.flag}</span>}
                <span>{dual.primary}</span>
              </span>
              <span className="text-xs text-emerald-200 font-bold mt-0.5">
                {dual.showSecondary && dual.secondary ? `${dual.secondary} · ` : ''}{coursesPlayedStr} ({totalHolesCount}{isJapanese ? 'ホール進行 · 基準 Par ' : '홀 진행 · 기준 Par '}{totalCoursePar})
              </span>
            </div>
          );
        })()}

        {/* 공식 9홀 이상 완주 시에만 누적 완주 횟수 표출 (1홀/2홀 등 미완주 시에는 불필요한 뱃지 전면 미표출) */}
        {totalHolesCount >= 9 && (() => {
          const myPlayer = session.players.find((p) => p.isSelf) || rankedPlayers[0];
          const completed9H = getUserCompleted9Holes(myPlayer?.name);
          return (
            <div className="mt-2.5 flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black bg-emerald-900/90 text-amber-300 border border-amber-400/50 shadow-sm">
                <span>⛳</span>
                <span>{isJapanese ? `公式9ホール完走累計: ${completed9H}回` : `공식 9홀 누적 완주: ${completed9H}회`}</span>
              </span>
            </div>
          );
        })()}

        {/* Official vs Practice Status Badge & Switcher */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {session.isOfficial === false ? (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 font-black px-2.5 py-1 rounded-full text-xs shadow-xs">
              <span>🧪</span>
              <span>{isJapanese ? '練習・テストラウンド (戦績未反映)' : '연습·테스트 라운드 (전적 미반영)'}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-400 text-emerald-950 font-black px-2.5 py-1 rounded-full text-xs shadow-xs">
              <span>🏌️</span>
              <span>{isJapanese ? '実戦ラウンド (戦績反映済み)' : '실제 라운드 (전적 반영됨)'}</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleOfficial}
            className="text-[11px] underline text-emerald-200 hover:text-white font-bold cursor-pointer"
            title={isJapanese ? '状態切り替え' : '상태 전환'}
          >
            {session.isOfficial === false ? (isJapanese ? '戦績反映に変更' : '전적 반영으로 변경') : (isJapanese ? '연습/테스트로 변경' : '연습/테스트로 변경')}
          </button>
        </div>

        {/* 구장 명예의 전당 & 완주 뱃지 (실타수 증서 전면 삭제: 9홀 이상 정규 완주 시에만 완주 뱃지 노출) */}
        <div className={`mt-3.5 pt-3 border-t border-emerald-700/60 ${isFull18Completed ? 'grid grid-cols-2 gap-2' : 'flex justify-center'}`}>
          {isFull18Completed && (
            <button
              type="button"
              onClick={() => {
                if (badgeRecord) setShowBadgeModal(true);
              }}
              className="p-2.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              <Award className="w-4 h-4 fill-current text-stone-950" />
              <span className="truncate">
                {isJapanese ? `🎖️ 完走バッジ (${badgeRecord?.visitCount || 1}回)` : `🎖️ 완주 뱃지 (${badgeRecord?.visitCount || 1}회)`}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowHallOfFameModal(true)}
            className={`p-2.5 rounded-2xl bg-emerald-900/90 hover:bg-emerald-800/90 border border-emerald-400/50 text-emerald-100 hover:text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer ${
              isFull18Completed ? '' : 'w-full'
            }`}
          >
            <Trophy className="w-4 h-4 text-amber-300" />
            <span className="truncate">{isJapanese ? '🏆 コース名誉の殿堂' : '🏆 구장 명예의 전당'}</span>
          </button>
        </div>

        {/* 📖 나의 연대기 보관 안내 배너 (카톡 전송 및 사진 저장 탭 삭제, 연대기 단독 안내로 간소화) */}
        <div className="mt-3 pt-3 border-t border-emerald-700/60 flex flex-col gap-2">
          {session.isOfficial !== false ? (
            <Link
              href="/chronicle"
              className="py-2.5 px-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-100 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              title="나의 연대기에서 공식 전적과 완주 뱃지 확인"
            >
              <span>📖 {isJapanese ? '私の年代記に公式戦績として永久保管されました (記録確認 ➔)' : '나의 연대기에 공식 전적으로 영구 보관되었습니다 (기록 확인 ➔)'}</span>
            </Link>
          ) : (
            <Link
              href="/chronicle"
              className="py-2.5 px-3 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/40 text-amber-200 font-bold text-xs flex items-center justify-center gap-1 transition cursor-pointer"
              title="나의 연대기에서 전체 기록 확인"
            >
              <span>📖 {isJapanese ? '私の年代記には正式ラウンドのみ永久保管されます (記録確認 ➔)' : '나의 연대기에는 정식 라운딩만 영구 보관됩니다 (기록 확인 ➔)'}</span>
            </Link>
          )}
        </div>

        <div className="mt-3.5 inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/40 px-4 py-2 rounded-2xl">
          <span className="text-xs text-yellow-300 font-bold">{isJapanese ? '🥇 1位 優勝:' : '🥇 1위 우승:'}</span>
          <span className="text-lg font-black text-white">{winner.name}</span>
          <span className="text-xs bg-emerald-500 text-emerald-950 font-black px-2 py-0.5 rounded-full">
            {winner.realTotalStrokes}타 (
            {winner.realTotalStrokes - totalCoursePar === 0
              ? 'E'
              : winner.realTotalStrokes - totalCoursePar > 0
              ? `+${winner.realTotalStrokes - totalCoursePar}`
              : winner.realTotalStrokes - totalCoursePar}
            )
          </span>
        </div>
      </div>

      {/* 1.5. [최우선 노출] 오늘의 동반 사진 남기기 & 공유 CTA */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 p-1 rounded-2xl shadow-md">
        <button
          type="button"
          onClick={() => setShowPhotoUploadModal(true)}
          className="w-full bg-stone-950 hover:bg-stone-900 text-white font-black px-4 py-3 rounded-[14px] flex items-center justify-center gap-2.5 shadow-inner transition active:scale-[0.99] cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-xs">
            <Camera className="w-4.5 h-4.5" />
          </div>
          <span className="text-sm sm:text-base font-black text-amber-300 tracking-tight">
            {isJapanese ? '本日の同伴写真を残す ＆ 共有' : '오늘의 동반 사진 남기기 & 공유'}
          </span>
        </button>
      </div>

      {/* 2. Leaderboard Table */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-stone-900 flex items-center justify-between">
          <span>{isJapanese ? '同伴者 総合順位表' : '동반자 종합 순위표'}</span>
          <span className="text-xs text-stone-600 font-medium">{isJapanese ? `計 ${session.players.length}名 (${totalHolesCount}ホール基準)` : `총 ${session.players.length}명 (${totalHolesCount}홀 기준)`}</span>
        </h3>

        <div className="space-y-2">
          {rankedPlayers.map((player, idx) => {
            const diff = player.realTotalStrokes - totalCoursePar;
            const diffStr = diff === 0 ? 'Even' : diff > 0 ? `+${diff}` : `${diff}`;
            const isSaved = savedPlayerId === player.id;

            // Course breakdown subtext
            const courseSubScores = courseSections
              .filter((c) => c.playedInCourse.length > 0)
              .map((c) => {
                const subScore = c.playedInCourse.reduce((sum, h) => sum + (player.scores?.[h] || 0), 0);
                return `${c.letter}${isJapanese ? 'コース ' : '코스 '}${subScore}${isJapanese ? '打' : '타'}`;
              })
              .join(' · ');

            return (
              <div
                key={player.id}
                className={`p-3 rounded-xl border-2 flex items-center justify-between transition ${
                  idx === 0
                    ? 'bg-amber-50/70 border-amber-400'
                    : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950'
                        : idx === 1
                        ? 'bg-stone-300 text-stone-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-extrabold text-base text-stone-900 flex items-center gap-1.5 flex-wrap">
                      {player.isLeader && session.players.length > 1 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-500 text-white">
                          {isJapanese ? '👑 代表' : '👑 조장'}
                        </span>
                      )}
                      <span>{formatPlayerDisplayName(player.name, player.isSelf, isJapanese)}</span>
                      {player.isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700">
                          {isJapanese ? '本人' : '본인'}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2 flex-wrap">
                      <span>OB {Object.values(player.obCount || {}).reduce((a, b) => a + b, 0)}{isJapanese ? '回' : '회'}</span>
                      {courseSubScores && (
                        <>
                          <span className="text-stone-300">|</span>
                          <span className="text-emerald-700 font-semibold">{courseSubScores}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xl font-black text-stone-900">
                      {player.realTotalStrokes}
                      <span className="text-xs text-stone-600 font-bold ml-0.5">{isJapanese ? '打' : '타'}</span>
                    </div>
                    <div
                      className={`text-xs font-black ${
                        diff > 0
                          ? 'text-rose-600'
                          : diff < 0
                          ? 'text-blue-600'
                          : 'text-stone-600'
                      }`}
                    >
                      {diffStr}
                    </div>
                  </div>

                  {/* One-touch Claim Button */}
                  <button
                    onClick={() => handleClaimRecord(player.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                      isSaved
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-stone-300 text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-500'
                    }`}
                    title={isJapanese ? 'マイスマホに保存' : '내 폰에 소장하기'}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>{isJapanese ? '保存済み' : '소장됨'}</span>
                      </>
                    ) : (
                      <>
                        <span>{isJapanese ? 'マイスコア保存 📌' : '내 기록 저장 📌'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Detailed Course-by-Course Scorecards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-extrabold text-base text-stone-900 flex items-center gap-2">
            <span>{isJapanese ? '📊 コース別詳細スコアカード' : '📊 코스별 상세 스코어카드'}</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-medium">
            {isJapanese ? '未プレー: ' : '미진행 홀: '}<span className="text-stone-400 font-bold">{isJapanese ? '- (未プレー)' : '- (미진행)'}</span>
          </span>
        </div>

        {/* 🎯 골프 공인 언더파 기호 안내 범례 */}
        <ScoreBadgeLegend />

        {courseSections.map((c) => (
          <div
            key={c.letter}
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {c.letter}
                </span>
                <div>
                  <h4 className="font-extrabold text-stone-900 text-base">
                    {c.letter}{isJapanese ? 'コース スコア' : '코스 스코어'}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {c.playedInCourse.length === 9
                      ? (isJapanese ? '全9ホール完走' : '전체 9홀 완주')
                      : (isJapanese ? `${c.playedInCourse.length}ホール進行 (${9 - c.playedInCourse.length}ホール未プレー)` : `${c.playedInCourse.length}홀 진행 (${9 - c.playedInCourse.length}홀 미진행)`)}
                    {c.playedInCourse.length > 0 && (isJapanese ? ` · 基準 Par ${c.coursePlayedPar}` : ` · 진행 기준 Par ${c.coursePlayedPar}`)}
                  </p>
                </div>
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  c.playedInCourse.length === 9
                    ? 'bg-emerald-100 text-emerald-800'
                    : c.playedInCourse.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-stone-100 text-stone-500'
                }`}
              >
                {c.playedInCourse.length} / 9{isJapanese ? 'ホール' : '홀'}
              </span>
            </div>

            {/* Horizontal Scrollable Table */}
            <div className="overflow-x-auto -mx-1 pb-1">
              <table className="w-full text-center text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-y border-stone-200">
                    <th className="py-2.5 px-2 text-left pl-3 sticky left-0 bg-stone-50 z-10 w-24 whitespace-nowrap">
                      {isJapanese ? '選手名' : '선수명'}
                    </th>
                    {c.full9Holes.map((hNum, i) => {
                      const hMeta = course.holesMetadata?.find((m) => Number(m.hole) === Number(hNum));
                      const par = hMeta?.par || 3;
                      const isHolePlayed = c.playedInCourse.includes(hNum);
                      return (
                        <th
                          key={hNum}
                          className={`py-2 px-1.5 font-bold ${
                            !isHolePlayed ? 'text-stone-300' : 'text-stone-700'
                          }`}
                        >
                          <div>{c.letter}-{i + 1}</div>
                          <div className={`text-[10px] ${!isHolePlayed ? 'text-stone-300' : 'text-stone-400'} font-normal`}>
                            P{par}
                          </div>
                        </th>
                      );
                    })}
                    <th className="py-2 px-2.5 font-extrabold text-stone-900 bg-stone-100/90 whitespace-nowrap">
                      {isJapanese ? 'コース合計' : '코스합계'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {rankedPlayers.map((player) => {
                    const courseSubtotal = c.playedInCourse.reduce(
                      (sum, h) => sum + (player.scores?.[h] || 0),
                      0
                    );
                    const courseDiff = courseSubtotal - c.coursePlayedPar;
                    const courseDiffStr =
                      courseDiff === 0 ? 'E' : courseDiff > 0 ? `+${courseDiff}` : `${courseDiff}`;

                    return (
                      <tr key={player.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-2.5 px-2 text-left pl-3 font-bold text-stone-900 sticky left-0 bg-white z-10 whitespace-nowrap shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                          {formatPlayerDisplayName(player.name, player.isSelf, isJapanese)}
                        </td>
                        {c.full9Holes.map((hNum) => {
                          const score = player.scores?.[hNum];
                          const isPlayed =
                            score !== undefined && score > 0 && c.playedInCourse.includes(hNum);
                          const hMeta = course.holesMetadata?.find((m) => Number(m.hole) === Number(hNum));
                          const par = hMeta?.par || 3;

                          if (!isPlayed) {
                            return (
                              <td key={hNum} className="py-2.5 px-1.5 text-stone-300 font-light" title="미진행">
                                -
                              </td>
                            );
                          }

                          return (
                            <td key={hNum} className="py-2.5 px-1.5 text-center">
                              <div className="flex items-center justify-center">
                                <HoleScoreBadge
                                  score={score}
                                  par={par}
                                  isConfirmed={isPlayed}
                                  size="sm"
                                />
                              </div>
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-2.5 font-black text-stone-900 bg-stone-50/80 whitespace-nowrap">
                          {c.playedInCourse.length > 0 ? (
                            <span>
                              {courseSubtotal}{isJapanese ? '打' : '타'}
                              <span className="text-[10px] text-stone-500 font-semibold ml-1">
                                ({courseDiffStr})
                              </span>
                            </span>
                          ) : (
                            <span className="text-stone-400 font-normal">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* 3. KakaoTalk / Band / LINE Share & Sync Section */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 shadow-sm space-y-3">
        <div>
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <Share2 className="w-4 h-4 text-amber-700" />
            <span>{isJapanese ? 'LINEグループ共有 ＆ スコア保存' : '카카오톡 · 네이버 밴드 단체방 결과 공유 & 소장'}</span>
          </div>
          <p className="text-xs text-amber-900 mt-1 leading-snug">
            {isJapanese
              ? '代表がLINEグループに結果を共有すると、同伴者がワンタップで自分のスマホにスコアを永久保存できます。'
              : '조장이 카톡이나 밴드에 결과를 공유하면, 동반자가 터치 한 번으로 본인 스마트폰에 성적표를 영구 저장할 수 있습니다.'}
          </p>
        </div>

        {isJapanese ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleShareToLine}
              className="w-full bg-[#06C755] hover:bg-[#05b34c] text-white font-black py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
            >
              <span>🟢 LINEで結果を共有</span>
            </button>

            <button
              onClick={handleCopyKakao}
              className="w-full bg-white border border-amber-400 hover:bg-amber-100 text-amber-950 font-black py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">コピー完了！</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>スコアテキストをコピー</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={handleShare}
              className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black py-3.5 px-3 rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <span>💬 카카오톡으로 동반자에게 성적표 보내기</span>
            </button>

            <button
              onClick={handleCopyKakao}
              className="w-full bg-white border border-amber-400 hover:bg-amber-100 text-amber-950 font-black py-2.5 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 transition cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 font-black">성적표 텍스트 복사 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-700" />
                  <span>📋 성적 텍스트 복사 (문자·카페 붙여넣기용)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 동반자 디지털 명함 교환 버튼 (동반자가 1명 이상 있을 때만 표출) */}
        {session && session.players.length > 1 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={handleExchangeCards}
              className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer border border-emerald-400/40"
            >
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>
                {isJapanese
                  ? `🤝 同伴者(${session.players.length - 1}名)とデジタル名刺を交換`
                  : `🤝 동반자(${session.players.length - 1}명)와 디지털 명함 교환하기`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Weak Point Diagnostic & Prescription */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-base text-stone-900">
            {isJapanese ? '本日のスコア分析 ＆ アドバイス' : '오늘의 스코어 분석 & 1초 맞춤 처방'}
          </h3>
        </div>

        {(() => {
          const currentPrescriptions = isJapanese ? JA_PRESCRIPTIONS : PRESCRIPTIONS;
          return totalObs > 0 ? (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
              <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
                <span>{currentPrescriptions[1].title}</span>
              </div>
              <p className="text-xs text-rose-950 font-bold mt-1">
                {currentPrescriptions[1].summary}
              </p>
              <p className="text-xs text-rose-900 mt-1 leading-relaxed break-keep">
                {currentPrescriptions[1].content}
              </p>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                <span>{currentPrescriptions[0].title}</span>
              </div>
              <p className="text-xs text-emerald-950 font-bold mt-1">
                {currentPrescriptions[0].summary}
              </p>
              <p className="text-xs text-emerald-900 mt-1 leading-relaxed break-keep">
                {currentPrescriptions[0].content}
              </p>
            </div>
          );
        })()}
      </div>

      {/* Google AdSense Slot */}
      <AdSenseSlot className="pt-2" />

      {/* [대표님 기획] 게스트 -> 정회원 3초 전환 배너 */}
      {!kakaoUser && (
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-stone-950 p-4 sm:p-5 rounded-2xl shadow-xl border-2 border-amber-300 space-y-3 text-center">
          <div className="inline-flex items-center gap-1.5 bg-stone-950 text-amber-300 px-3 py-1 rounded-full text-xs font-black shadow-xs">
            <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
            <span>{isJapanese ? '👑 パークゴルフ オールインワン 公式戦績登録' : '👑 파크골프 올인원 공식 전적 등록'}</span>
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-stone-950 leading-tight">
              {isJapanese ? (
                <>本日達成されたスコアを<br />スマホに永久保存しますか？ ⛳</>
              ) : (
                <>오늘 달성하신 멋진 스코어를<br />내 휴대폰에 평생 저장할까요? ⛳</>
              )}
            </h3>
            <p className="text-xs font-bold text-stone-900 mt-1.5 leading-snug">
              {isJapanese ? (
                <>ログインすると、今回のラウンド記録({totalHolesCount}H)が<br />スマホの <span className="underline font-black decoration-stone-950">[マイ戦績]</span> に公式記録として永久保存されます！</>
              ) : (
                <>지금 카카오 1초 로그인하시면 방금 친 {totalHolesCount}홀 기록이<br />내 휴대폰 <span className="underline font-black decoration-stone-950">[나의 연대기]</span>에 공식 전적으로 영구 보존됩니다!</>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowKakaoModal(true)}
            className="w-full py-3.5 px-4 bg-stone-950 hover:bg-stone-900 text-amber-300 font-black text-sm rounded-xl shadow-lg transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer border border-amber-400"
          >
            <span>{isJapanese ? '⚡ ログインしてマイ記録を永久保存する' : '⚡ 카카오 1초 로그인하고 내 기록 평생 저장하기'}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      )}

      {saveSuccessToast && (
        <div className="bg-emerald-700 text-white text-xs sm:text-sm font-black p-3.5 rounded-xl shadow-lg text-center animate-bounce">
          {saveSuccessToast}
        </div>
      )}

      {/* 4.5. 라운드 결과 SNS 공유 (LINE 원터치 공유 & URL 복사) */}
      <div className="bg-white rounded-2xl p-4 border-2 border-emerald-600 shadow-md space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-sm text-stone-900">
            <span className="text-base">⛳</span>
            <span>{isJapanese ? '同伴者にラウンド結果を共有' : isEnglish ? 'Share Results with Friends' : '동반자에게 라운드 결과 공유하기'}</span>
          </div>
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {isJapanese ? 'ワンタッチ共有' : '원터치 전송'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
          {/* 🖼️ 단체 라운드 인증서 / 워터마크 포토카드 버튼 */}
          <button
            type="button"
            onClick={() => setShowPhotoCardModal(true)}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-stone-950 font-black text-sm rounded-xl shadow-md transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer border border-amber-300 col-span-full"
          >
            <Camera className="w-4 h-4 text-stone-950" />
            <span>{isJapanese ? '🖼️ 記念フォトカード作成・LINE共有' : '🖼️ 단체 기념 포토카드 만들기 & 카톡/밴드 공유'}</span>
          </button>

          {/* 🟢 LINE 결과 공유 버튼 (초록색 #06C755 고유 브랜드 컬러) */}
          <button
            type="button"
            onClick={handleShareToLine}
            className="w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-lg leading-none">🟢</span>
            <span>{isJapanese ? 'LINEで結果を共有' : 'LINE으로 결과 공유'}</span>
          </button>

          {/* 📋 URL 복사 버튼 */}
          <button
            type="button"
            onClick={handleCopyResultUrl}
            className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 active:scale-[0.98] text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-stone-700"
          >
            <Copy className="w-4 h-4 text-amber-300" />
            <span>{copiedResult ? (isJapanese ? 'コピー完了！' : '복사 완료!') : (isJapanese ? '結果URLをコピー' : '결과 URL 복사')}</span>
          </button>
        </div>
      </div>

      {/* 🍲 [대표님 신규 기능]: 라운드 완주 후 뒤풀이 맛집 추천 유도 배너 */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-400 to-amber-400 rounded-3xl p-4 shadow-lg border-2 border-amber-300 text-stone-950 space-y-2.5 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍲</span>
            <div>
              <span className="text-[10px] font-black bg-stone-950 text-amber-300 px-2 py-0.5 rounded-full inline-block">
                {isJapanese ? 'ラウンド後の反省会・食事' : '오늘 라운드 뒤풀이 & 식사'}
              </span>
              <h4 className="font-black text-sm text-stone-950 leading-tight mt-0.5">
                {isJapanese ? '今日ラウンド後、どこで食事されましたか？' : '오늘 라운드 후 어디서 식사하셨나요?'}
              </h4>
            </div>
          </div>
          <span className="text-[11px] font-black text-amber-950 bg-white/80 px-2 py-0.5 rounded-xl shadow-2xs">
            {isJapanese ? '1秒推薦' : '1초 추천'}
          </span>
        </div>
        <p className="text-xs text-stone-900 font-semibold leading-snug">
          {isJapanese
            ? '同伴者の皆様と訪れた美味しい行きつけのお店を全国のゴルファーにお知らせください！'
            : '동반자들과 함께 간 맛있는 찐 단골집을 동호인들에게 알려주시고 [🍽️ 미식가 훈장]을 받으세요!'}
        </p>
        <button
          type="button"
          onClick={() => setShowRestaurantModal(true)}
          className="w-full py-3 bg-stone-950 hover:bg-stone-900 active:scale-98 text-amber-300 font-black rounded-2xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
        >
          <span>🍲</span>
          <span>{isJapanese ? '私たちの組の行きつけ店を1秒推薦する ▶' : '우리 조 단골집 1초 추천하기 ▶'}</span>
        </button>
      </div>

      {/* 5. Navigation Buttons */}
      <div className="pt-2 space-y-2">
        {session.clubRoomId && (
          <Link
            href={`/club/${session.clubRoomId}`}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md active:scale-98 transition"
          >
            <Trophy className="w-5 h-5 text-amber-300" />
            <span>{isJapanese ? '🏆 大会・月例会リーダーボードへ' : '🏆 대회 / 월례회 전체 리더보드로 이동'}</span>
          </Link>
        )}
        <Link
          href="/chronicle"
          className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md active:scale-98 transition"
        >
          <Trophy className="w-5 h-5 text-amber-300" />
          <span>{isJapanese ? '📖 マイ年代記へ移動' : '📖 나의 파크골프 연대기 & 1촌 명부로 이동'}</span>
        </Link>
        <Link
          href="/"
          className="w-full bg-stone-800 hover:bg-stone-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow active:scale-98 transition"
        >
          <Home className="w-5 h-5" />
          <span>{isJapanese ? 'ホーム画面へ移動' : '홈 화면으로 이동'}</span>
        </Link>
        {/* 개별 라운드 기록 삭제 버튼 (안전한 1건 전용 삭제) */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(isJapanese ? 'このラウンド記録を削除しますか？\n（この操作は元に戻せません）' : '이 라운드 기록을 삭제하시겠습니까?\n(이 작업은 복구할 수 없습니다)')) {
              ParkOnStorage.deleteCompletedRound(session.id);
              alert(isJapanese ? 'ラウンド記録が削除されました。' : '해당 라운드 기록이 삭제되었습니다.');
              window.location.href = '/';
            }
          }}
          className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl border border-red-200 text-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>{isJapanese ? 'このラウンド記録を削除' : '이 라운드 기록 삭제'}</span>
        </button>
      </div>

      {/* Watermark Photo Card Modal */}
      <WatermarkPhotoCardModal
        isOpen={showPhotoCardModal}
        onClose={() => setShowPhotoCardModal(false)}
        session={session}
      />

      {/* Digital Business Card Modal */}
      <BusinessCardModal
        isOpen={showBusinessCardModal}
        onClose={() => setShowBusinessCardModal(false)}
        initialTab="EXCHANGED"
      />

      {/* 카카오 1초 로그인 모달 */}
      <KakaoLoginModal
        isOpen={showKakaoModal}
        onClose={() => setShowKakaoModal(false)}
        onLoginSuccess={(u) => {
          setKakaoUser(u);
          setShowKakaoModal(false);
          // 현재 라운드 세션을 completedRounds에 공식 전적으로 영구 저장!
          if (session) {
            const completed = ParkOnStorage.getCompletedRounds();
            if (!completed.some((r) => r.id === session.id)) {
              ParkOnStorage.saveCompletedRound({
                ...session,
                isOfficial: true,
                status: 'COMPLETED',
                completedAt: session.completedAt || new Date().toISOString(),
              });
            }
          }
          setSaveSuccessToast('🎉 방금 완료한 라운딩이 회원님의 [나의 연대기]에 공식 전적으로 평생 저장되었습니다!');
          window.dispatchEvent(new Event('storage'));
        }}
        title="회원 로그인하고 공식 기록 저장"
        subtitle="카카오 1초 로그인 시 오늘 친 라운딩 전적이 영구 보존됩니다."
      />

      {/* 대표님 원칙 2단계: 9홀 모듈형 완주 기념 디지털 뱃지 팝업 & 카톡 자랑하기 */}
      {badgeRecord && (
        <DigitalBadgeModal
          isOpen={showBadgeModal}
          onClose={() => setShowBadgeModal(false)}
          badge={badgeRecord}
          completedHolesCount={totalHolesCount}
          completedBlocksCount={involvedCourses.length || Math.max(1, Math.round(totalHolesCount / 9))}
          coursesPlayedStr={coursesPlayedStr}
          onOpenHallOfFame={() => {
            setShowBadgeModal(false);
            setShowHallOfFameModal(true);
          }}
          onOpenNationalTourMap={() => {
            setShowBadgeModal(false);
            setShowNationalTourModal(true);
          }}
        />
      )}

      {/* 대표님 원칙 2단계: 구장별 실시간 명예의 전당 (최다 완주 TOP 10) */}
      <CourseHallOfFameModal
        isOpen={showHallOfFameModal}
        onClose={() => setShowHallOfFameModal(false)}
        courseId={course.id}
        courseName={course.name}
        myVisitCount={badgeRecord?.visitCount || 0}
      />

      {/* 3단계: 전국 17개 시·도 투어 퍼즐 지도 & 마일스톤 명예 트로피 모달 */}
      <NationalTourMapModal
        isOpen={showNationalTourModal}
        onClose={() => setShowNationalTourModal(false)}
      />

      {/* 🏆 [연대기 포토 시스템] 라운드 완주 직후 기념사진 등록 유도 팝업 */}
      {showPostRoundPhotoPrompt && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border-2 border-amber-300 text-center space-y-4 animate-scaleUp relative overflow-hidden">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-stone-950 flex items-center justify-center text-3xl mx-auto shadow-lg animate-bounce">
              🏆
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-black bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full inline-block">
                {isJapanese ? '🎉 ラウンド完走記念' : '🎉 라운드 완주 기념'}
              </span>
              <h3 className="text-lg font-black text-stone-900 leading-snug">
                {isJapanese ? '🏆 18ホール完走をお祝いします！' : '🏆 18홀 라운드 완주를 축하합니다!'}
              </h3>
              <p className="text-xs text-stone-600 font-semibold leading-relaxed pt-0.5">
                {isJapanese
                  ? '本日一緒に汗を流した同伴者の皆様と現場記念写真を残してみましょう！'
                  : '오늘 함께 땀 흘린 동반자들과 현장 기념사진을 남겨보세요!'}
              </p>
            </div>

            {/* 함께한 분 명단 칩 */}
            {session.players && session.players.length > 0 && (
              <div className="bg-stone-50 rounded-2xl p-2.5 border border-stone-200/80 text-left space-y-1">
                <div className="text-[10px] font-black text-stone-500 flex items-center gap-1">
                  <span>🤝</span>
                  <span>{isJapanese ? '一緒にプレーした方:' : '함께한 분:'}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {session.players.map((p, idx) => {
                    const displayName = p.isSelf ? `${p.name || (isJapanese ? '本人' : '나')}(나)` : p.name;
                    return (
                      <span
                        key={idx}
                        className={`text-xs font-bold px-2 py-0.5 rounded-lg border shadow-2xs ${
                          p.isSelf
                            ? 'bg-amber-100 text-amber-950 border-amber-300 font-black'
                            : 'bg-white text-stone-800 border-stone-200'
                        }`}
                      >
                        {displayName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowPostRoundPhotoPrompt(false);
                  setShowPhotoUploadModal(true);
                }}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black py-3.5 px-4 rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
              >
                <Camera className="w-4 h-4 text-emerald-200" />
                <span>{isJapanese ? '📷 団体・記念写真を登録する' : '📷 단체/기념사진 등록하기'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPostRoundPhotoPrompt(false);
                  const seenKey = `parkon_badge_seen_${session.id}`;
                  if (!sessionStorage.getItem(seenKey) && isFull18Completed) {
                    setShowBadgeModal(true);
                    sessionStorage.setItem(seenKey, 'true');
                  }
                }}
                className="w-full py-2.5 text-stone-500 hover:text-stone-800 font-bold text-xs rounded-xl hover:bg-stone-100 transition cursor-pointer"
              >
                {isJapanese ? '次にする' : '다음에 하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📷 라운드 현장 사진 업로드 모달 */}
      <ChroniclePhotoUploadModal
        isOpen={showPhotoUploadModal}
        onClose={() => {
          setShowPhotoUploadModal(false);
          const seenKey = `parkon_badge_seen_${session.id}`;
          if (!sessionStorage.getItem(seenKey) && isFull18Completed) {
            setShowBadgeModal(true);
            sessionStorage.setItem(seenKey, 'true');
          }
        }}
        targetSession={session}
        completedSessions={session ? [session] : []}
        onPhotoUploaded={(newPhoto) => {
          setSaveSuccessToast(
            isJapanese
              ? '📸 思い出の写真が年代記アルバムに保存されました！'
              : '📸 오늘의 기념사진이 연대기 앨범에 안전하게 등록되었습니다!'
          );
          setTimeout(() => setSaveSuccessToast(null), 3500);
        }}
      />

      {/* 🍲 [대표님 신규 기능]: 라운드 완주 후 뒤풀이 맛집 추천 등록 모달 */}
      <RestaurantSubmitModal
        isOpen={showRestaurantModal}
        onClose={() => setShowRestaurantModal(false)}
        defaultCourseName={course?.name || session?.courseName || '구미 동락 파크골프장'}
        defaultCourseId={course?.id || session?.courseId || '1'}
        onSuccess={() => {
          setSaveSuccessToast(
            isJapanese
              ? '🍲 おすすめのお店が登録され、年代記に美食家バッジが追加されました！'
              : '🍲 단골 맛집이 등록되어 나의 연대기에 [🍽️ 필드의 미식가 훈장]이 적립되었습니다!'
          );
          setTimeout(() => setSaveSuccessToast(null), 4000);
        }}
      />
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center font-bold text-stone-600">성적표 집계 중...</div>}>
      <ResultContent />
    </Suspense>
  );
}
