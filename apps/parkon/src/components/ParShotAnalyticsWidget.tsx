'use client';

import React, { useMemo } from 'react';
import {
  TrendingUp,
  Sparkles,
  Target,
  Award,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { Course, RoundSession } from '@/types/parkon';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';

interface ParShotAnalyticsWidgetProps {
  completedRounds: RoundSession[];
  allCourses?: Course[];
  userName: string;
  isJapanese?: boolean;
  isEnglish?: boolean;
}

interface ParMetric {
  par: number;
  totalHoles: number;
  totalStrokes: number;
  avgStrokes: number;
  diffFromPar: number;
  birdiesOrBetter: number;
  pars: number;
  bogeys: number;
  doubleOrWorse: number;
  parSaveRate: number; // (pars + birdiesOrBetter) / totalHoles * 100
  birdieRate: number; // birdiesOrBetter / totalHoles * 100
}

export function ParShotAnalyticsWidget({
  completedRounds,
  allCourses = [],
  userName,
  isJapanese = false,
  isEnglish = false,
}: ParShotAnalyticsWidgetProps) {
  const parPattern = [4, 3, 4, 3, 4, 4, 3, 3, 5];

  const analytics = useMemo(() => {
    const rawRounds = (completedRounds || []).filter(
      (r) => !r.isVirtual && r.isOfficial !== false
    );

    let p3Holes = 0, p3Strokes = 0, p3Birdies = 0, p3Pars = 0, p3Bogeys = 0, p3Doubles = 0;
    let p4Holes = 0, p4Strokes = 0, p4Birdies = 0, p4Pars = 0, p4Bogeys = 0, p4Doubles = 0;
    let p5Holes = 0, p5Strokes = 0, p5Birdies = 0, p5Pars = 0, p5Bogeys = 0, p5Doubles = 0;

    rawRounds.forEach((r) => {
      const p = (r.players || []).find(
        (pl) => pl.isSelf || pl.name === userName || pl.isLeader
      ) || (r.players && r.players[0]);

      if (p && p.scores) {
        const course =
          allCourses.find((c) => c.id === r.courseId) ||
          DEFAULT_COURSES.find((c) => c.id === r.courseId);

        Object.entries(p.scores).forEach(([holeKey, scoreVal]) => {
          const hNum = Number(holeKey);
          const stroke = Number(scoreVal);
          if (!stroke || stroke <= 0) return;

          const meta = course?.holesMetadata?.find((m) => m.hole === hNum);
          const par = meta?.par || parPattern[(hNum - 1) % 9] || 4;

          if (par === 3) {
            p3Holes++;
            p3Strokes += stroke;
            if (stroke < 3) p3Birdies++;
            else if (stroke === 3) p3Pars++;
            else if (stroke === 4) p3Bogeys++;
            else p3Doubles++;
          } else if (par === 4) {
            p4Holes++;
            p4Strokes += stroke;
            if (stroke < 4) p4Birdies++;
            else if (stroke === 4) p4Pars++;
            else if (stroke === 5) p4Bogeys++;
            else p4Doubles++;
          } else if (par === 5) {
            p5Holes++;
            p5Strokes += stroke;
            if (stroke < 5) p5Birdies++;
            else if (stroke === 5) p5Pars++;
            else if (stroke === 6) p5Bogeys++;
            else p5Doubles++;
          }
        });
      }
    });

    const totalHolesAll = p3Holes + p4Holes + p5Holes;

    // 만약 라운드 기록이 아직 적거나 없을 때도 현실적이고 매력적인 지표 프리뷰를 제공
    const hasData = totalHolesAll > 0;
    const effP3Holes = hasData ? p3Holes : 8;
    const effP3Strokes = hasData ? p3Strokes : 24;
    const effP3Birdies = hasData ? p3Birdies : 2;
    const effP3Pars = hasData ? p3Pars : 4;
    const effP3Bogeys = hasData ? p3Bogeys : 2;
    const effP3Doubles = hasData ? p3Doubles : 0;

    const effP4Holes = hasData ? p4Holes : 16;
    const effP4Strokes = hasData ? p4Strokes : 65;
    const effP4Birdies = hasData ? p4Birdies : 2;
    const effP4Pars = hasData ? p4Pars : 10;
    const effP4Bogeys = hasData ? p4Bogeys : 3;
    const effP4Doubles = hasData ? p4Doubles : 1;

    const effP5Holes = hasData ? p5Holes : 4;
    const effP5Strokes = hasData ? p5Strokes : 20;
    const effP5Birdies = hasData ? p5Birdies : 1;
    const effP5Pars = hasData ? p5Pars : 2;
    const effP5Bogeys = hasData ? p5Bogeys : 1;
    const effP5Doubles = hasData ? p5Doubles : 0;

    const makeParMetric = (
      par: number,
      holes: number,
      strokes: number,
      birdies: number,
      pars: number,
      bogeys: number,
      doubles: number
    ): ParMetric => {
      const avg = holes > 0 ? Number((strokes / holes).toFixed(1)) : par;
      const diff = Number((avg - par).toFixed(1));
      const parSave = holes > 0 ? Math.round(((pars + birdies) / holes) * 100) : 0;
      const birdieR = holes > 0 ? Math.round((birdies / holes) * 100) : 0;
      return {
        par,
        totalHoles: holes,
        totalStrokes: strokes,
        avgStrokes: avg,
        diffFromPar: diff,
        birdiesOrBetter: birdies,
        pars,
        bogeys,
        doubleOrWorse: doubles,
        parSaveRate: parSave,
        birdieRate: birdieR,
      };
    };

    const metricP3 = makeParMetric(3, effP3Holes, effP3Strokes, effP3Birdies, effP3Pars, effP3Bogeys, effP3Doubles);
    const metricP4 = makeParMetric(4, effP4Holes, effP4Strokes, effP4Birdies, effP4Pars, effP4Bogeys, effP4Doubles);
    const metricP5 = makeParMetric(5, effP5Holes, effP5Strokes, effP5Birdies, effP5Pars, effP5Bogeys, effP5Doubles);

    const totalCalculatedHoles = metricP3.totalHoles + metricP4.totalHoles + metricP5.totalHoles;
    const totalBirdies = metricP3.birdiesOrBetter + metricP4.birdiesOrBetter + metricP5.birdiesOrBetter;
    const totalPars = metricP3.pars + metricP4.pars + metricP5.pars;
    const totalBogeys = metricP3.bogeys + metricP4.bogeys + metricP5.bogeys;
    const totalDoubles = metricP3.doubleOrWorse + metricP4.doubleOrWorse + metricP5.doubleOrWorse;

    const birdiePct = Math.round((totalBirdies / totalCalculatedHoles) * 100);
    const parPct = Math.round((totalPars / totalCalculatedHoles) * 100);
    const bogeyPct = Math.round((totalBogeys / totalCalculatedHoles) * 100);
    const doublePct = Math.max(0, 100 - (birdiePct + parPct + bogeyPct));

    // [요건 3] AI 원포인트 실력 진단 한 줄 코멘트 생성
    let aiComment = '';
    if (metricP3.birdieRate >= 20 || metricP3.parSaveRate >= 75) {
      aiComment = isJapanese
        ? `🎯 Par3ショートホールのパーセーブ率が${metricP3.parSaveRate}%と驚異的です！精密なアイアンティーショットが強みです。`
        : `🎯 Par 3 숏홀 파 세이브율이 ${metricP3.parSaveRate}%로 매우 정교합니다! 송곳 같은 티샷 감각을 유지하고 계십니다.`;
    } else if (metricP5.parSaveRate >= 70) {
      aiComment = isJapanese
        ? `🦅 Par5ロングホールでのスコア安定性(${metricP5.parSaveRate}%)が抜群です！長距離攻略とマネジメントが素晴らしいです。`
        : `🦅 Par 5 롱홀 파 세이브율이 ${metricP5.parSaveRate}%로 롱홀 장타 및 세컨샷 공략이 매우 안정적입니다.`;
    } else if (metricP4.diffFromPar > 0.4) {
      aiComment = isJapanese
        ? `💡 Par4ミドルホールで平均${metricP4.avgStrokes}打と打数損失が見られます。安全な2オン作戦を推奨します。`
        : `💡 Par 4 미들홀에서 평균 ${metricP4.avgStrokes}타로 타수 손실이 발생하고 있으니, 무리한 온그린 대신 안전한 공략을 권장합니다.`;
    } else if (parPct + birdiePct >= 65) {
      aiComment = isJapanese
        ? `🌟 全体のパー以上達成率が${parPct + birdiePct}%で、シングルゴルファー級の卓越した危機管理能力を発揮しています！`
        : `🌟 전체 파 이상 달성률이 ${parPct + birdiePct}%로 싱글 골퍼 수준의 탁월한 위기관리 능력을 보여줍니다!`;
    } else {
      aiComment = isJapanese
        ? `⛳ ショートパットの集中力を補強すれば、次の星(スター)等級へ即座に昇級できる高い潜在力を持っています！`
        : `⛳ Par 3 홀 티샷 정확도와 퍼팅 거리감을 조금만 보강하시면 다음 스타 등급으로 즉시 도약할 수 있습니다!`;
    }

    return {
      hasData,
      metricP3,
      metricP4,
      metricP5,
      totalCalculatedHoles,
      distribution: {
        totalBirdies,
        totalPars,
        totalBogeys,
        totalDoubles,
        birdiePct,
        parPct,
        bogeyPct,
        doublePct,
      },
      aiComment,
    };
  }, [completedRounds, allCourses, userName, isJapanese]);

  return (
    <div className="bg-white rounded-3xl p-4 border border-stone-200 shadow-sm space-y-3.5">
      {/* 1. 위젯 상단 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="p-1.5 rounded-xl bg-purple-100 text-purple-800">
            <Target className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-sm font-black text-stone-900 leading-tight">
              {isJapanese ? 'Par別ショット精密分析' : 'Par별 샷 정밀 분석'}
            </h3>
            <p className="text-[10px] text-stone-400 font-semibold">
              {isJapanese
                ? 'Par3·4·5別のパーセーブ率およびショット結果の分布'
                : 'Par 3 · Par 4 · Par 5 홀별 공략 성공률 및 샷 결과 분포'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
          {analytics.hasData
            ? `${analytics.totalCalculatedHoles}${isJapanese ? 'ホール分析' : '홀 실측 분석'}`
            : (isJapanese ? '基準指標' : '표준 지표')}
        </span>
      </div>

      {/* 2. AI 원포인트 실력 진단 한 줄 코멘트 카드 */}
      <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-stone-900 text-white rounded-2xl p-3.5 shadow-sm border border-purple-400/30 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
            <Sparkles className="w-3 h-3 text-stone-950" />
            <span>{isJapanese ? 'AI ワンポイント実力診断' : 'AI 원포인트 실력 진단'}</span>
          </span>
          <span className="text-[9px] text-purple-300 font-bold">
            {isJapanese ? 'PARKY AI エンジン' : 'PARKY AI 정밀 진단'}
          </span>
        </div>
        <p className="text-xs font-bold text-stone-100 leading-relaxed pl-0.5">
          {analytics.aiComment}
        </p>
      </div>

      {/* 3. Par 3 / Par 4 / Par 5 홀별 3단 지표 카드 */}
      <div className="grid grid-cols-3 gap-2">
        {/* Par 3 숏홀 */}
        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2 text-center flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-black text-stone-800">Par 3</span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              {isJapanese ? 'ショート' : '숏홀'} ({analytics.metricP3.totalHoles}{isJapanese ? 'H' : '홀'})
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200 shadow-2xs space-y-0.5">
            <div className="text-sm font-black text-stone-900">
              {analytics.metricP3.avgStrokes}타
            </div>
            <div className="text-[9px] font-bold text-stone-500">
              {analytics.metricP3.diffFromPar <= 0
                ? `${analytics.metricP3.diffFromPar}`
                : `+${analytics.metricP3.diffFromPar}`}
            </div>
          </div>

          <div className="space-y-1 text-left text-[10px] pt-0.5">
            <div className="flex items-center justify-between font-bold text-stone-600">
              <span>파 세이브</span>
              <span className="text-emerald-700 font-black">{analytics.metricP3.parSaveRate}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full"
                style={{ width: `${Math.min(100, analytics.metricP3.parSaveRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-stone-400 font-medium pt-0.5">
              <span>버디율</span>
              <span className="text-purple-700 font-bold">{analytics.metricP3.birdieRate}%</span>
            </div>
          </div>
        </div>

        {/* Par 4 미들홀 */}
        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2 text-center flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs font-black text-stone-800">Par 4</span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              {isJapanese ? 'ミドル' : '미들홀'} ({analytics.metricP4.totalHoles}{isJapanese ? 'H' : '홀'})
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200 shadow-2xs space-y-0.5">
            <div className="text-sm font-black text-stone-900">
              {analytics.metricP4.avgStrokes}타
            </div>
            <div className="text-[9px] font-bold text-stone-500">
              {analytics.metricP4.diffFromPar <= 0
                ? `${analytics.metricP4.diffFromPar}`
                : `+${analytics.metricP4.diffFromPar}`}
            </div>
          </div>

          <div className="space-y-1 text-left text-[10px] pt-0.5">
            <div className="flex items-center justify-between font-bold text-stone-600">
              <span>파 세이브</span>
              <span className="text-indigo-700 font-black">{analytics.metricP4.parSaveRate}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full"
                style={{ width: `${Math.min(100, analytics.metricP4.parSaveRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-stone-400 font-medium pt-0.5">
              <span>버디율</span>
              <span className="text-purple-700 font-bold">{analytics.metricP4.birdieRate}%</span>
            </div>
          </div>
        </div>

        {/* Par 5 롱홀 */}
        <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2 text-center flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-xs font-black text-stone-800">Par 5</span>
            </div>
            <div className="text-[10px] text-stone-400 font-medium">
              {isJapanese ? 'ロング' : '롱홀'} ({analytics.metricP5.totalHoles}{isJapanese ? 'H' : '홀'})
            </div>
          </div>

          <div className="bg-white rounded-xl p-2 border border-stone-200 shadow-2xs space-y-0.5">
            <div className="text-sm font-black text-stone-900">
              {analytics.metricP5.avgStrokes}타
            </div>
            <div className="text-[9px] font-bold text-stone-500">
              {analytics.metricP5.diffFromPar <= 0
                ? `${analytics.metricP5.diffFromPar}`
                : `+${analytics.metricP5.diffFromPar}`}
            </div>
          </div>

          <div className="space-y-1 text-left text-[10px] pt-0.5">
            <div className="flex items-center justify-between font-bold text-stone-600">
              <span>파 세이브</span>
              <span className="text-amber-700 font-black">{analytics.metricP5.parSaveRate}%</span>
            </div>
            <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full"
                style={{ width: `${Math.min(100, analytics.metricP5.parSaveRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-stone-400 font-medium pt-0.5">
              <span>버디율</span>
              <span className="text-purple-700 font-bold">{analytics.metricP5.birdieRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. 전체 샷 결과 시각화 프로그레스 바 & 비율 집계 */}
      <div className="bg-stone-50 rounded-2xl p-3 border border-stone-200 space-y-2">
        <div className="flex items-center justify-between text-xs font-black text-stone-800">
          <span>{isJapanese ? '全体ショット結果分布' : '전체 샷 결과 비율 분포'}</span>
          <span className="text-[10px] text-stone-400 font-bold">
            {isJapanese ? '計 100% 換算' : '누적 100% 환산'}
          </span>
        </div>

        {/* 멀티 컬러 프로그레스 바 */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-stone-200 shadow-inner">
          <div
            title={`버디 이상: ${analytics.distribution.birdiePct}%`}
            style={{ width: `${analytics.distribution.birdiePct}%` }}
            className="bg-teal-500 h-full transition-all duration-500"
          />
          <div
            title={`파: ${analytics.distribution.parPct}%`}
            style={{ width: `${analytics.distribution.parPct}%` }}
            className="bg-indigo-500 h-full transition-all duration-500"
          />
          <div
            title={`보기: ${analytics.distribution.bogeyPct}%`}
            style={{ width: `${analytics.distribution.bogeyPct}%` }}
            className="bg-amber-400 h-full transition-all duration-500"
          />
          <div
            title={`더블보기 이상: ${analytics.distribution.doublePct}%`}
            style={{ width: `${analytics.distribution.doublePct}%` }}
            className="bg-rose-500 h-full transition-all duration-500"
          />
        </div>

        {/* 4단 범례 및 수치 */}
        <div className="grid grid-cols-4 gap-1 pt-1 text-center">
          <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
              <span>버디+</span>
            </div>
            <div className="text-xs font-black text-teal-700">{analytics.distribution.birdiePct}%</div>
            <div className="text-[9px] text-stone-400">{analytics.distribution.totalBirdies}회</div>
          </div>

          <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>파(Par)</span>
            </div>
            <div className="text-xs font-black text-indigo-700">{analytics.distribution.parPct}%</div>
            <div className="text-[9px] text-stone-400">{analytics.distribution.totalPars}회</div>
          </div>

          <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span>보기</span>
            </div>
            <div className="text-xs font-black text-amber-700">{analytics.distribution.bogeyPct}%</div>
            <div className="text-[9px] text-stone-400">{analytics.distribution.totalBogeys}회</div>
          </div>

          <div className="bg-white p-1.5 rounded-xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-center gap-1 text-[10px] text-stone-500 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span>더블+</span>
            </div>
            <div className="text-xs font-black text-rose-700">{analytics.distribution.doublePct}%</div>
            <div className="text-[9px] text-stone-400">{analytics.distribution.totalDoubles}회</div>
          </div>
        </div>
      </div>
    </div>
  );
}
