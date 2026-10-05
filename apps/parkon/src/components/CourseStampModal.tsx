'use client';

import React, { useEffect, useState } from 'react';
import { Course, CourseCompletionModalInfo, RoundPlayer, RoundSession } from '../types/parkon';
import { playCelebrationFanfare, triggerCelebrationHaptic } from '../lib/soundUtils';

interface CourseStampModalProps {
  info: CourseCompletionModalInfo | null;
  isOpen: boolean;
  isLeader: boolean;
  leaderName: string;
  session: RoundSession;
  course?: Course;
  isJapanese?: boolean;
  onProceedToCourse: (courseLetter: string) => void;
  onFinishRound: () => void;
  onTransferLeader?: (newLeaderId: string) => void;
}

export const CourseStampModal: React.FC<CourseStampModalProps> = ({
  info,
  isOpen,
  isLeader,
  leaderName,
  session,
  course,
  isJapanese = false,
  onProceedToCourse,
  onFinishRound,
  onTransferLeader,
}) => {
  const [showCourseSelector, setShowCourseSelector] = useState<boolean>(false);
  const [selectedCourseChip, setSelectedCourseChip] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      playCelebrationFanfare();
      triggerCelebrationHaptic();
      setShowCourseSelector(false);
      if (info?.nextRecommendedLetter) {
        setSelectedCourseChip(info.nextRecommendedLetter);
      }
    }
  }, [isOpen, info?.nextRecommendedLetter]);

  if (!isOpen || !info) return null;

  const numCourses = course
    ? course.totalCourses || Math.max(1, Math.round((course.totalHoles || 18) / 9))
    : 4;
  const COURSE_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const availableLetters = COURSE_LETTERS.slice(0, Math.max(2, numCourses));

  // 9홀 누적 스코어 랭킹 계산
  const curConfirmed = session.confirmedHoles || [];
  const sortedPlayers = [...(session.players || [])].sort((a, b) => {
    const sa = curConfirmed.reduce((sum, h) => sum + (a.scores[h] || 0), 0);
    const sb = curConfirmed.reduce((sum, h) => sum + (b.scores[h] || 0), 0);
    return sa - sb;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md shadow-2xl border-4 border-emerald-500 overflow-hidden flex flex-col p-4 sm:p-5 space-y-3.5 animate-scaleUp max-h-[92vh] overflow-y-auto relative">
        
        {/* 🎉 상단 미니 팡파레 & 공식 인증 도장 (Stamp) */}
        <div className="relative pt-2 pb-1 text-center">
          {/* 배경 반짝이 파티클 이펙트 */}
          <div className="absolute top-0 inset-x-0 flex justify-center gap-6 pointer-events-none opacity-80 text-xl">
            <span className="animate-bounce">✨</span>
            <span className="animate-ping">🌟</span>
            <span className="animate-bounce delay-100">🎊</span>
          </div>

          {/* 🔴 인영 직인 도장 (Official Circular Stamp) */}
          <div className="inline-block relative my-1 transform -rotate-6 transition-transform hover:scale-105 duration-300">
            <div className="border-4 border-double border-rose-600 rounded-2xl px-5 py-2.5 bg-rose-50/90 text-rose-700 shadow-md">
              <div className="text-[10px] font-extrabold tracking-widest text-rose-500 uppercase">
                {isJapanese ? 'PARKGOLF ALL-IN-ONE 公認' : '파크골프 올인원 公認'}
              </div>
              <div className="text-xl sm:text-2xl font-black tracking-tight text-rose-700 flex items-center justify-center gap-1.5 py-0.5">
                <span>🏅</span>
                <span>{info.completedCourseLetter}{isJapanese ? 'コース 9ホール 完走' : '코스 9홀 완주!'}</span>
              </div>
              <div className="text-[10px] font-black text-rose-600/90 border-t border-rose-300/80 pt-0.5 flex items-center justify-center gap-2">
                <span>{new Date().toLocaleDateString(isJapanese ? 'ja-JP' : 'ko-KR')}</span>
                <span>•</span>
                <span>{isJapanese ? '公式スタンプ認証' : '공식 스탬프 인증'}</span>
              </div>
            </div>
            {/* 도장 입체 도장자국 그림자 */}
            <div className="absolute -inset-1 border-2 border-rose-400/40 rounded-2xl pointer-events-none"></div>
          </div>

          <h3 className="text-lg font-black text-stone-900 mt-2">
            {isJapanese
              ? `${info.completedCourseLetter}コースのラウンドを完了しました！`
              : `${info.completedCourseLetter}코스 라운드를 무결하게 마쳤습니다!`}
          </h3>
          <p className="text-xs text-stone-600 font-bold">
            {isJapanese
              ? '次のコースを続けて回るか、ここで終了して記録を保存してください。'
              : '다음 코스로 이어서 치시겠습니까, 아니면 오늘 운동을 마감하시겠습니까?'}
          </p>
        </div>

        {/* 📊 9홀 스코어 중간 합산 카드 */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-black text-stone-500 px-1 border-b border-stone-200 pb-1">
            <span>{isJapanese ? 'プレーヤー (成績順)' : '동반자 순위 (9홀 합산)'}</span>
            <span>{isJapanese ? '打数 / 基準打差' : '타수 / 파 대비'}</span>
          </div>

          {sortedPlayers.map((p, idx) => {
            const pStrokes = curConfirmed.reduce((sum, h) => sum + (p.scores[h] || 0), 0);
            const pPar = curConfirmed.reduce((sum, h) => {
              const base = ((Number(h) - 1) % 1000) + 1;
              const meta = (session.customHolesMetadata || course?.holesMetadata || []).find(
                (m) => Number(m.hole) === base
              );
              return sum + Number(meta?.par || 3);
            }, 0);
            const pDiff = pStrokes - pPar;

            return (
              <div key={p.id} className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-stone-100">
                <div className="flex items-center gap-1.5 font-black text-stone-800">
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${
                      idx === 0 ? 'bg-amber-400 text-stone-950 shadow-2xs' : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  {p.isLeader && <span className="text-[10px] text-amber-600 font-black">👑</span>}
                  <span className="truncate max-w-[120px]">{p.name || `동반자 ${idx + 1}`}</span>
                  {p.isSelf && <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-bold">나</span>}
                </div>
                <div className="flex items-center gap-1.5 font-black">
                  <span className="text-stone-900 font-extrabold">{pStrokes}{isJapanese ? '打' : '타'}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${
                      pDiff === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : pDiff > 0
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {pDiff === 0 ? 'E (파)' : pDiff > 0 ? `+${pDiff}` : `${pDiff}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 🕹️ 대형 2-Button 분기 인터랙션 */}
        {isLeader ? (
          <div className="space-y-2.5 pt-1">
            {/* 1. 초록색 대형 버튼: [ ⛳ 다음 9홀 이어서 치기 ] */}
            {!showCourseSelector ? (
              <button
                type="button"
                onClick={() => setShowCourseSelector(true)}
                className="w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 px-4 rounded-2xl text-base flex flex-col items-center justify-center shadow-lg transition active:scale-[0.98] border-2 border-emerald-400 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">⛳</span>
                  <span>{isJapanese ? '次の9ホールへ進む' : '다음 9홀 이어서 치기'}</span>
                  <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-bold">
                    추천: {info.nextRecommendedLetter}코스
                  </span>
                </div>
                <span className="text-[11px] text-emerald-100 font-normal pt-0.5">
                  {isJapanese ? 'コースを選んで1番ホールから再スタート' : '다음 코스(A~D) 선택 후 1번 홀 티박스로 이동'}
                </span>
              </button>
            ) : (
              /* 코스 선택 칩 인라인 전개 */
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-2xl p-3 space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between text-xs font-black text-emerald-950">
                  <span>⛳ {isJapanese ? '次に進むコースを選択' : '이어서 칠 다음 코스 선택'}</span>
                  <button
                    type="button"
                    onClick={() => setShowCourseSelector(false)}
                    className="text-[11px] text-stone-500 underline font-bold"
                  >
                    {isJapanese ? '戻る' : '닫기'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {availableLetters.map((letter) => {
                    const isRec = letter === info.nextRecommendedLetter;
                    const isSel = selectedCourseChip === letter;
                    return (
                      <button
                        key={letter}
                        type="button"
                        onClick={() => setSelectedCourseChip(letter)}
                        className={`py-3 rounded-xl font-black text-sm flex flex-col items-center justify-center transition active:scale-95 border-2 cursor-pointer ${
                          isSel
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-300'
                            : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-400'
                        }`}
                      >
                        <span className="text-base">{letter}코스</span>
                        {isRec && (
                          <span className={`text-[9px] px-1 rounded font-bold ${isSel ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                            추천
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => onProceedToCourse(selectedCourseChip || info.nextRecommendedLetter)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition cursor-pointer"
                >
                  <span>🏌️</span>
                  <span>
                    {selectedCourseChip || info.nextRecommendedLetter}코스 1번 홀 티박스로 출발 ➔
                  </span>
                </button>
              </div>
            )}

            {/* 2. 황금색 대형 버튼: [ 🏆 오늘 라운드 마감하기 ] */}
            <button
              type="button"
              onClick={onFinishRound}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 font-black py-3.5 px-4 rounded-2xl text-sm flex flex-col items-center justify-center gap-0.5 shadow-md transition active:scale-[0.98] border-2 border-amber-300 cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base">🏆</span>
                <span>{isJapanese ? '本日ここまで (ラウンド終了・成績保存)' : '오늘 라운드 마감하기 (전적 저장)'}</span>
              </div>
              <span className="text-[10px] text-amber-900/90 font-bold">
                {isJapanese ? 'スコアカード・公認完走証を発行します' : '최종 통합 성적표 및 공인 완주 인증서 발급'}
              </span>
            </button>
          </div>
        ) : (
          /* 동반자 대기 안내 창 */
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-3.5 text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-amber-900 text-xs font-black">
              <span className="text-base animate-spin">⏳</span>
              <span>
                {isJapanese
                  ? `代表(${leaderName})が次のコースまたは終了を選択中...`
                  : `조장(${leaderName})님이 다음 코스 진행 여부를 선택 중입니다`}
              </span>
            </div>
            <p className="text-[11px] text-stone-600 font-semibold leading-relaxed">
              {isJapanese
                ? '代表が選択すると、全員の画面が自動的に次のホールまたは成績画面へ移動します。'
                : '조장님이 선택하시면 4명 전원의 화면이 자동으로 다음 홀 또는 결과 페이지로 함께 이동합니다.'}
            </p>
            {onTransferLeader && (
              <button
                type="button"
                onClick={() => {
                  const myPlayer = session.players?.find((p) => p.isSelf);
                  if (myPlayer) onTransferLeader(myPlayer.id);
                }}
                className="inline-flex items-center gap-1 text-[11px] bg-white border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl font-black shadow-2xs hover:bg-amber-100 active:scale-95 cursor-pointer mt-1"
              >
                <span>👑</span>
                <span>{isJapanese ? '私が代表になる' : '내가 조장 맡기'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
