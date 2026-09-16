'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Award, Share2, Copy, Check, Home, BookmarkCheck, ArrowRight, ShieldAlert, Sparkles, Trophy, Camera, CreditCard } from 'lucide-react';
import { RoundSession, Course } from '@/types/parkon';
import { ParkOnStorage } from '@/lib/storage';
import { CompanionStorage } from '@/lib/companionStorage';
import { BusinessCardStorage } from '@/lib/businessCardStorage';
import { BusinessCardModal } from '@/components/BusinessCardModal';
import { WatermarkPhotoCardModal } from '@/components/WatermarkPhotoCardModal';
import { PRESCRIPTIONS } from '@/lib/defaultCourses';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { HoleScoreBadge, ScoreBadgeLegend } from '@/components/HoleScoreBadge';

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roundId = searchParams.get('id');

  const [session, setSession] = useState<RoundSession | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [savedPlayerId, setSavedPlayerId] = useState<string | null>(null);
  const [showPhotoCardModal, setShowPhotoCardModal] = useState<boolean>(false);
  const [showBusinessCardModal, setShowBusinessCardModal] = useState<boolean>(false);
  const [exchangeCardToast, setExchangeCardToast] = useState<string | null>(null);

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

  const coursesPlayedStr = involvedCourses.map((l) => `${l}코스`).join(' + ');
  const totalHolesCount = effectivePlayedHoles.length;

  // Calculate each player's actual total strokes across only played holes
  const playersWithRealTotals = session.players.map((p) => {
    const realTotal = effectivePlayedHoles.reduce((sum, hNum) => sum + (p.scores?.[hNum] || 0), 0);
    return {
      ...p,
      realTotalStrokes: realTotal > 0 ? realTotal : p.totalStrokes,
    };
  });

  // Sort players by realTotalStrokes ascending (rankings)
  const rankedPlayers = [...playersWithRealTotals].sort((a, b) => a.realTotalStrokes - b.realTotalStrokes);

  // KakaoTalk Text Generation with per-course breakdown
  const generateKakaoText = () => {
    const dateStr = session.completedAt
      ? new Date(session.completedAt).toLocaleDateString('ko-KR')
      : new Date().toLocaleDateString('ko-KR');

    const lines = [
      `⛳ [파크온] ${session.courseName} (${coursesPlayedStr}) 라운드 최종 성적표`,
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
          return `${c.letter}코스(${c.playedInCourse.length}홀): ${cScore}타`;
        })
        .join(' / ');

      lines.push(`${medal} ${idx + 1}위: ${p.name} - ${p.realTotalStrokes}타 (${diffStr})`);
      if (courseBreakdown) {
        lines.push(`   └ ${courseBreakdown}`);
      }
    });

    lines.push(`━━━━━━━━━━━━━━━━`);
    lines.push(`📱 동반자 본인 폰에 성적 담기:`);
    lines.push(`https://parkon.kr/round/result?id=${session.id}`);

    return lines.join('\n');
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
          title: `[파크온] ${session.courseName} 라운드 성적표`,
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
  const winner = rankedPlayers[0];
  const mostOBPlayer = [...session.players].sort(
    (a, b) =>
      Object.values(b.obCount).reduce((x, y) => x + y, 0) -
      Object.values(a.obCount).reduce((x, y) => x + y, 0)
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
                체험 모드 성적표
              </span>
              <h3 className="text-sm font-black text-stone-950 mt-0.5">가상 라운딩 연습 성적표 (미저장)</h3>
            </div>
          </div>
          <p className="text-xs text-stone-900 font-bold leading-relaxed">
            이 성적표는 사용법 연습용으로 <span className="underline font-black">실제 전적이나 랭킹에 저장되지 않습니다.</span>
          </p>
          <div className="pt-1">
            <Link
              href={`/round/new?courseId=${session.courseId}`}
              className="inline-flex items-center justify-center gap-1.5 w-full bg-stone-950 hover:bg-stone-900 text-amber-300 font-black py-2.5 rounded-xl text-xs shadow-md transition active:scale-98"
            >
              <span>⛳ 실제 필드에서 [정식 라운딩] 시작하기 ▶</span>
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

        <h2 className="text-2xl font-black tracking-tight">라운드 최종 성적표</h2>
        <p className="text-emerald-200 text-xs font-semibold mt-1">
          {session.courseName} · {coursesPlayedStr} ({totalHolesCount}홀 진행 · 기준 Par {totalCoursePar})
        </p>

        {/* Official vs Practice Status Badge & Switcher */}
        <div className="mt-2.5 flex items-center justify-center gap-2">
          {session.isOfficial === false ? (
            <span className="inline-flex items-center gap-1 bg-amber-400 text-stone-950 font-black px-2.5 py-1 rounded-full text-xs shadow-xs">
              <span>🧪</span>
              <span>연습·테스트 라운드 (공식 전적 미반영)</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-emerald-400 text-emerald-950 font-black px-2.5 py-1 rounded-full text-xs shadow-xs">
              <span>🏆</span>
              <span>공식 정규 라운드 (전적 반영됨)</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleToggleOfficial}
            className="text-[11px] underline text-emerald-200 hover:text-white font-bold cursor-pointer"
            title="상태 전환"
          >
            {session.isOfficial === false ? '공식 전적으로 변경' : '연습/테스트로 변경'}
          </button>
        </div>

        <div className="mt-3.5 inline-flex items-center gap-2 bg-emerald-700/60 border border-emerald-500/40 px-4 py-2 rounded-2xl">
          <span className="text-xs text-yellow-300 font-bold">🥇 1위 우승:</span>
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

      {/* 1.5. [최우선 노출] 오늘의 동반 사진 남기기 & 포토카드 공유 CTA (Senior 56px+) */}
      <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-500 p-1 rounded-3xl shadow-lg">
        <button
          type="button"
          onClick={() => setShowPhotoCardModal(true)}
          className="w-full min-h-[56px] bg-stone-950 hover:bg-stone-900 text-white font-black px-4 py-3 rounded-[22px] flex items-center justify-between gap-2 shadow-inner transition active:scale-98 cursor-pointer"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shrink-0 shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm sm:text-base font-black text-amber-300">
                  📸 오늘의 동반 사진 남기기 &amp; 공유
                </span>
                <span className="text-[10px] bg-red-600 text-white font-black px-1.5 py-0.2 rounded-full">
                  인기 1위
                </span>
              </div>
              <p className="text-xs text-stone-300 font-medium mt-0.5">
                동반자 얼굴과 스코어가 담긴 1초 기념 포토카드 생성
              </p>
            </div>
          </div>
          <span className="text-xs font-black bg-amber-400 hover:bg-amber-300 text-stone-950 px-3 py-2 rounded-xl shrink-0 shadow-sm">
            만들기 &gt;
          </span>
        </button>
      </div>

      {/* 2. Leaderboard Table */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-stone-900 flex items-center justify-between">
          <span>동반자 종합 순위표</span>
          <span className="text-xs text-stone-600 font-medium">총 {session.players.length}명 ({totalHolesCount}홀 기준)</span>
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
                return `${c.letter}코스 ${subScore}타`;
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
                      {player.isLeader && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-black bg-amber-500 text-white">
                          👑 조장
                        </span>
                      )}
                      <span>{player.name}</span>
                      {player.isSelf && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700">
                          본인
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-stone-500 font-medium flex items-center gap-2 flex-wrap">
                      <span>OB {Object.values(player.obCount || {}).reduce((a, b) => a + b, 0)}회</span>
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
                      <span className="text-xs text-stone-600 font-bold ml-0.5">타</span>
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
                    title="내 폰에 소장하기"
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck className="w-3.5 h-3.5" />
                        <span>소장됨</span>
                      </>
                    ) : (
                      <>
                        <span>내 기록 저장 📌</span>
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
            <span>📊 코스별 상세 스코어카드</span>
          </h3>
          <span className="text-[11px] text-stone-500 font-medium">
            미진행 홀: <span className="text-stone-400 font-bold">- (미진행)</span>
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
                    {c.letter}코스 스코어
                  </h4>
                  <p className="text-[11px] text-stone-500 font-medium">
                    {c.playedInCourse.length === 9
                      ? '전체 9홀 완주'
                      : `${c.playedInCourse.length}홀 진행 (${9 - c.playedInCourse.length}홀 미진행)`}
                    {c.playedInCourse.length > 0 && ` · 진행 기준 Par ${c.coursePlayedPar}`}
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
                {c.playedInCourse.length} / 9홀
              </span>
            </div>

            {/* Horizontal Scrollable Table */}
            <div className="overflow-x-auto -mx-1 pb-1">
              <table className="w-full text-center text-xs border-collapse min-w-[520px]">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-bold border-y border-stone-200">
                    <th className="py-2.5 px-2 text-left pl-3 sticky left-0 bg-stone-50 z-10 w-24 whitespace-nowrap">
                      선수명
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
                      코스합계
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
                          {player.name}
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
                              {courseSubtotal}타
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

      {/* 3. KakaoTalk Share & Sync Section */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-300 shadow-sm space-y-3">
        <div>
          <div className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <Share2 className="w-4 h-4 text-amber-700" />
            <span>카카오톡 단체방 결과 공유 & 2단계 소장</span>
          </div>
          <p className="text-xs text-amber-900 mt-1 leading-snug">
            조장이 카톡 단톡방에 결과를 공유하면, 동반자가 터치 한 번으로 본인 스마트폰에 성적표를 영구 저장할 수 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleShare}
            className="w-full bg-[#FEE500] hover:bg-[#FADA0A] text-[#191919] font-black py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-1.5 shadow active:scale-95 transition"
          >
            <span>💬 카카오톡 공유</span>
          </button>

          <button
            onClick={handleCopyKakao}
            className="w-full bg-white border border-amber-400 hover:bg-amber-100 text-amber-950 font-black py-3 px-3 rounded-xl text-sm flex items-center justify-center gap-1.5 active:scale-95 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-amber-700" />
                <span>성적 텍스트 복사</span>
              </>
            )}
          </button>
        </div>

        {/* [NEW] 동반자 4인 디지털 명함 교환 버튼 */}
        <div className="pt-1">
          <button
            type="button"
            onClick={handleExchangeCards}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-3 px-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer border border-emerald-400/40"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            <span>🤝 동반자 4인과 디지털 명함 교환하기</span>
          </button>
        </div>
      </div>

      {/* 4. Weak Point Diagnostic & Prescription */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          <h3 className="font-extrabold text-base text-stone-900">
            오늘의 스코어 분석 & 1초 맞춤 처방
          </h3>
        </div>

        {totalObs > 0 ? (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5">
            <div className="text-xs font-bold text-rose-800 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4" />
              <span>{PRESCRIPTIONS[1].title}</span>
            </div>
            <p className="text-xs text-rose-950 font-bold mt-1">
              {PRESCRIPTIONS[1].summary}
            </p>
            <p className="text-xs text-rose-900 mt-1 leading-relaxed break-keep">
              {PRESCRIPTIONS[1].content}
            </p>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              <span>{PRESCRIPTIONS[0].title}</span>
            </div>
            <p className="text-xs text-emerald-950 font-bold mt-1">
              {PRESCRIPTIONS[0].summary}
            </p>
            <p className="text-xs text-emerald-900 mt-1 leading-relaxed break-keep">
              {PRESCRIPTIONS[0].content}
            </p>
          </div>
        )}
      </div>

      {/* Google AdSense Slot */}
      <AdSenseSlot className="pt-2" />

      {/* 5. Navigation Buttons */}
      <div className="pt-2 space-y-2">
        {session.clubRoomId && (
          <Link
            href={`/club/${session.clubRoomId}`}
            className="w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md active:scale-98 transition"
          >
            <Trophy className="w-5 h-5 text-amber-300" />
            <span>🏆 대회 / 월례회 전체 리더보드로 이동</span>
          </Link>
        )}
        <Link
          href="/chronicle"
          className="w-full bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow-md active:scale-98 transition"
        >
          <Trophy className="w-5 h-5 text-amber-300" />
          <span>📖 나의 파크골프 연대기 &amp; 1촌 명부로 이동</span>
        </Link>
        <Link
          href="/"
          className="w-full bg-stone-800 hover:bg-stone-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-base shadow active:scale-98 transition"
        >
          <Home className="w-5 h-5" />
          <span>홈 화면으로 이동</span>
        </Link>
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
