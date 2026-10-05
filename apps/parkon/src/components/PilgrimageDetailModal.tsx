'use client';

import React, { useState } from 'react';
import { X, Trophy, CheckCircle2, MapPin, Navigation, Share2, Sparkles, Award, Star, Compass, ThumbsUp, Calendar } from 'lucide-react';
import { PilgrimageCourse, PilgrimageStorage } from '@/lib/pilgrimageStorage';
import { RoundSession } from '@/types/parkon';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface PilgrimageDetailModalProps {
  course: PilgrimageCourse | null;
  completedRounds: RoundSession[];
  isOpen: boolean;
  onClose: () => void;
}

export function PilgrimageDetailModal({
  course,
  completedRounds,
  isOpen,
  onClose,
}: PilgrimageDetailModalProps) {
  const { isJapanese } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState<'RECORD' | 'STORY' | 'BIGDATA'>('RECORD');
  const [hasVoted, setHasVoted] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!isOpen || !course) return null;

  const userRecord = PilgrimageStorage.getUserCourseRecord(course.courseId, completedRounds);

  const handleVote = () => {
    setHasVoted(true);
  };

  const handleShare = async () => {
    const text = isJapanese
      ? `[PARKY 聖地巡礼公認] 「${course.nameJa}」${userRecord.isVisited ? '完走達成！' : '巡礼挑戦中！'}\n全世界パークゴルフ公式プラットフォーム PARKY`
      : `[PARKY 공식 성지순례] 「${course.nameKo}」 ${userRecord.isVisited ? '공식 완주 달성!' : '성지순례 도전 중!'}\n전국 파크골프 올인원 PARKY`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: isJapanese ? `PARKY 聖地巡礼公認` : `PARKY 공식 성지순례`,
          text: text,
          url: typeof window !== 'undefined' ? window.location.href : '',
        });
      } catch {
        // fallback
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 touch-manipulation">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overscroll-contain">
        {/* 1. 상단 그라데이션 헤더 */}
        <div className="bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-5 relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-2xl">{course.badgeEmoji}</span>
            <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-amber-400 text-emerald-950 shadow-xs">
              {isJapanese ? course.categoryLabelJa : course.categoryLabelKo}
            </span>
            <span className="text-[10px] font-bold text-emerald-200">
              {course.country === 'KR' ? '🇰🇷 대한민국' : '🇯🇵 日本'}
            </span>
          </div>

          <h2 className="text-xl font-black text-white tracking-tight">
            {isJapanese ? course.nameJa : course.nameKo}
          </h2>
          <p className="text-xs text-emerald-200 mt-0.5 font-medium flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{isJapanese ? course.regionJa : course.regionKo}</span>
          </p>

          {/* 완주 여부 즉시 뱃지 */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-sm border border-amber-300/40 bg-amber-400/20 text-amber-200">
            {userRecord.isVisited ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{isJapanese ? '🏆 聖地巡礼 完走公認 獲得！' : '🏆 성지순례 공식 완주 인증 완료!'}</span>
              </>
            ) : (
              <>
                <Compass className="w-4 h-4 text-stone-300" />
                <span>{isJapanese ? '🔒 聖地巡礼 挑戦待機中' : '🔒 성지순례 도전 대기중'}</span>
              </>
            )}
          </div>
        </div>

        {/* 2. 서브 탭 (나의 실록 / 역사 가치 / 빅데이터 지표) */}
        <div className="grid grid-cols-3 p-1.5 bg-stone-100 border-b border-stone-200 text-xs font-black shrink-0">
          <button
            type="button"
            onClick={() => setActiveSubTab('RECORD')}
            className={`py-2 rounded-xl transition cursor-pointer text-center ${
              activeSubTab === 'RECORD'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {isJapanese ? 'マイ巡礼実録' : '나의 완주 실록'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('STORY')}
            className={`py-2 rounded-xl transition cursor-pointer text-center ${
              activeSubTab === 'STORY'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {isJapanese ? '歴史 ＆ 価値' : '역사적 가치'}
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('BIGDATA')}
            className={`py-2 rounded-xl transition cursor-pointer text-center ${
              activeSubTab === 'BIGDATA'
                ? 'bg-white text-emerald-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            {isJapanese ? '客観データ' : '빅데이터 지표'}
          </button>
        </div>

        {/* 3. 모달 스크롤 본문 */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-stone-800">
          {/* TAB 1: 나의 완주 실록 */}
          {activeSubTab === 'RECORD' && (
            <div className="space-y-3.5">
              {userRecord.isVisited ? (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 border-2 border-amber-300 rounded-3xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 flex items-center justify-center font-black shadow-xs">
                        🏆
                      </div>
                      <div>
                        <div className="text-xs font-black text-amber-950">
                          {isJapanese ? '聖地巡礼 スコア実録' : '성지순례 공식 기록장'}
                        </div>
                        <div className="text-[10px] text-amber-700 font-bold">
                          {isJapanese ? 'PARKY公式永久認証' : 'PARKY 공인 영구 인증'}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      {userRecord.roundCount}{isJapanese ? '回 完走' : '회 완주'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="bg-white/80 p-2.5 rounded-2xl border border-amber-200">
                      <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '生涯ベスト打数' : '인생 최저타'}</div>
                      <div className="text-lg font-black text-stone-900 mt-0.5">
                        {userRecord.bestScore ? `${userRecord.bestScore}${isJapanese ? '打' : '타'}` : '-'}
                      </div>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-2xl border border-amber-200">
                      <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '最近の巡礼日' : '최근 완주 일자'}</div>
                      <div className="text-xs font-black text-stone-900 mt-1 truncate">
                        {userRecord.lastDate ? new Date(userRecord.lastDate).toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR') : '-'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCertificate(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-black text-xs rounded-2xl shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer border border-amber-400"
                  >
                    <Award className="w-4 h-4" />
                    <span>{isJapanese ? '📜 黄金の聖地巡礼証書を発行・共有' : '📜 황금 성지순례 인증서 발급 & 공유'}</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-7 bg-stone-50 rounded-3xl border-2 border-dashed border-stone-300 p-4 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-stone-200 text-stone-500 flex items-center justify-center font-black text-2xl mx-auto shadow-inner">
                    🔒
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-stone-800">
                      {isJapanese ? 'まだこの聖地を巡礼していません' : '아직 이 성지를 순례하지 않았습니다'}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                      {isJapanese
                        ? '現地で公式ラウンドを完走(9ホール単位)してスコアを保存すると、この画面に黄金の巡礼スタンプが永久刻印されます。'
                        : '현장에서 공식 라운드를 완주(9홀 단위)하고 저장하면, 이 화면에 황금 성지 도장이 영구 박제됩니다.'}
                    </p>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={handleShare}
                      className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition"
                    >
                      {isJapanese ? '仲間に挑戦共有 📤' : '동반자에게 공유 📤'}
                    </button>
                  </div>
                </div>
              )}

              {/* 하단 한 줄 요약 가치 */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="font-bold leading-relaxed">
                  {isJapanese ? course.taglineJa : course.taglineKo}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: 역사적 가치 & 코스 특징 */}
          {activeSubTab === 'STORY' && (
            <div className="space-y-3.5 text-xs">
              <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200 space-y-2">
                <div className="font-black text-stone-900 text-sm flex items-center gap-1.5">
                  <span>🏛️</span>
                  <span>{isJapanese ? course.historicTitleJa : course.historicTitleKo}</span>
                </div>
                <p className="text-stone-600 leading-relaxed font-medium">
                  {isJapanese ? course.descriptionJa : course.descriptionKo}
                </p>
              </div>

              {/* 핵심 하이라이트 3대 요소 */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-black text-stone-500">
                  {isJapanese ? '⭐ 聖地公認 3大ハイライト' : '⭐ 성지 공인 3대 핵심 포인트'}
                </div>
                {(isJapanese ? course.highlightsJa : course.highlightsKo).map((hl, idx) => (
                  <div key={idx} className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-emerald-950 font-black text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-stone-800 text-[11.5px]">{hl}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 객관적 빅데이터 지표 */}
          {activeSubTab === 'BIGDATA' && (
            <div className="space-y-3 text-xs">
              <div className="bg-emerald-950 text-white rounded-2xl p-3.5 space-y-1">
                <div className="text-amber-300 font-black text-xs flex items-center gap-1">
                  <span>📊</span>
                  <span>{isJapanese ? 'PARKY 客観ビッグデータ 4大昇格指標' : 'PARKY 객관적 빅데이터 4대 승격 지표'}</span>
                </div>
                <p className="text-[10px] text-emerald-200">
                  {isJapanese
                    ? '管理者の主観ではなく、GPS移動データと実測スコアに基づいて公認認定されています。'
                    : '관리자의 주관이 아닌 실제 GPS 원정 데이터와 완주 평점을 기반으로 100% 공인되었습니다.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '遠征来場比率 (50km+)' : '외지인 원정율 (50km+)'}</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">{course.outOfTownRatio}%</div>
                  <div className="text-[9px] text-stone-400">{isJapanese ? '基準 60% 超過' : '기준 60% 이상 충족'}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '実測完走者 総合評点' : '실측 완주자 평점'}</div>
                  <div className="text-lg font-black text-amber-600 mt-0.5">★ {course.ratingScore}</div>
                  <div className="text-[9px] text-stone-400">{isJapanese ? '5.0点満点 基準' : '5.0점 만점 기준'}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '日韓グローバル来場者' : '글로벌 인바운드'}</div>
                  <div className="text-lg font-black text-purple-700 mt-0.5">{course.globalVisitorCount.toLocaleString()}{isJapanese ? '名' : '명'}</div>
                  <div className="text-[9px] text-stone-400">{isJapanese ? '外国人公認完走' : '해외 골퍼 실측 완주'}</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200">
                  <div className="text-[10px] text-stone-500 font-bold">{isJapanese ? '愛好者 聖地推薦署名' : '유저 성지 추천 서명'}</div>
                  <div className="text-lg font-black text-blue-700 mt-0.5">{(course.petitionVotes + (hasVoted ? 1 : 0)).toLocaleString()}{isJapanese ? '票' : '표'}</div>
                  <div className="text-[9px] text-stone-400">{isJapanese ? '1,000票突破認定' : '1,000표 돌파 인증'}</div>
                </div>
              </div>

              {/* 성지 추천 인터랙티브 투표 버튼 */}
              <button
                type="button"
                onClick={handleVote}
                disabled={hasVoted}
                className={`w-full py-2.5 rounded-xl font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  hasVoted
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-white hover:bg-stone-50 text-stone-800 border-2 border-stone-300 shadow-2xs active:scale-98'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasVoted ? 'fill-blue-700 text-blue-700' : 'text-stone-600'}`} />
                <span>
                  {hasVoted
                    ? (isJapanese ? '✓ 聖地推薦を完了しました！' : '✓ 이 구장 성지 추천 완료 (+1표 반영)')
                    : (isJapanese ? '👍 私もこのコースを聖地に推薦する (+1)' : '👍 나도 이 구장을 공식 성지로 추천합니다 (+1)')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* 4. 하단 닫기 */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-black text-xs rounded-xl transition cursor-pointer"
          >
            {isJapanese ? '閉じる' : '닫기'}
          </button>
        </div>
      </div>

      {/* 📜 황금 성지순례 모바일 인증서 팝업 */}
      {showCertificate && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in zoom-in-95 touch-manipulation">
          <div className="bg-gradient-to-b from-amber-50 via-white to-amber-100 rounded-3xl p-6 max-w-sm w-full border-4 border-amber-400 shadow-2xl space-y-4 text-center text-stone-900 relative">
            <button
              type="button"
              onClick={() => setShowCertificate(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center font-black text-3xl mx-auto shadow-md border-2 border-amber-200">
              👑
            </div>

            <div>
              <div className="text-[10px] font-black text-amber-800 tracking-widest uppercase">
                PARKY OFFICIAL CERTIFICATE
              </div>
              <h3 className="text-xl font-black text-stone-900 mt-1">
                {isJapanese ? '聖地巡礼 公認証書' : '공식 성지순례 완주 인증서'}
              </h3>
            </div>

            <div className="p-3 bg-white/90 rounded-2xl border border-amber-300 shadow-inner text-xs space-y-1">
              <div className="text-stone-500 font-bold">{isJapanese ? '公認巡礼聖地' : '공인 순례 성지'}</div>
              <div className="text-base font-black text-emerald-950">
                {isJapanese ? course.nameJa : course.nameKo}
              </div>
              <div className="text-[11px] text-amber-800 font-bold pt-1">
                {userRecord.roundCount}{isJapanese ? '回 完走認定' : '회 완주 공인'} · {userRecord.bestScore ? `${isJapanese ? 'ベスト ' : '최저타 '}${userRecord.bestScore}${isJapanese ? '打' : '타'}` : ''}
              </div>
            </div>

            <p className="text-[11px] text-stone-600 leading-relaxed font-medium">
              {isJapanese
                ? '貴殿は日韓パークゴルフの偉大なる聖地を巡礼完走し、卓越した情熱を証明したことを永久認定します。'
                : '귀하는 대한민국 및 글로벌 파크골프의 위대한 성지를 순례 완주하여, 골퍼로서의 탁월한 열정을 증명하였음을 영구 인증합니다.'}
            </p>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-black text-xs rounded-xl shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                <span>{isJapanese ? 'LINE・SNSで誇る' : '밴드·카톡에 자랑하기'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 토스트 */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-stone-900 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg animate-in fade-in">
          {isJapanese ? 'クリップボードにコピーしました！' : '성지순례 인증 텍스트가 복사되었습니다!'}
        </div>
      )}
    </div>
  );
}
