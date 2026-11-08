'use client';

import React, { useState } from 'react';
import { Lightbulb, ThumbsUp, Edit3, X, CheckCircle2, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

interface TipCardProps {
  hole: number;
  tip?: string;
  courseLabel?: string; // e.g. "A-1" 또는 "1"
  onSaveTip?: (newTip: string) => void;
}

// 과거에 자동 생성되었던 더미/상투적 가짜 공략 팁 필터 목록
const DUMMY_TIPS = [
  '티샷 시 좌측 경사를 태우면',
  '맞바람이 불 때는 낮게 깔아치는',
  '그린 앞 벙커 우측으로 부드럽게',
  '홀컵 뒤쪽 내리막이 심하므로',
  '중앙 롱홀입니다. 1타는 페어웨이',
  '헤드업에 주의하고 부드럽게',
  '티샷 시 페어웨이 중앙 유지',
  '페어웨이 중앙 유지',
  '중앙 유지',
  '숏홀 직접 공략',
  '안전한 미들 공략',
  '그린 앞 둔덕 주의',
  '파 세이브 집중',
  '세컨샷 정밀 어프로치',
  '단거리 홀컵 공략',
  '바람 감안한 샷',
  '롱홀 3온 안정성',
  '안정적인 스타트',
  '평탄한 페어웨이',
  '좌우 러프 조심',
  '직선형 숏홀',
  '이글/버디 찬스 홀',
  '깃대 우측 공략',
  '짧은 퍼팅 거리감',
  '중앙 전진',
  'B코스 클로징 핀 공략',
  '무리한 1온보다는 2온 안전 공략 추천',
  '페어웨이 중앙을 향해 똑바로 티샷',
];

// 코스 현장에서 터치 한 번으로 빠르게 조합할 수 있는 고수들의 실전 태그
const QUICK_TIP_TAGS = [
  '⚠️ 좌측 OB 주의',
  '⚠️ 우측 OB 주의',
  '⬇️ 홀컵 뒤 내리막 심함',
  '⬆️ 오르막 경사 (과감하게)',
  '⛳ 깃대 우측 공략',
  '⛳ 깃대 좌측 공략',
  '🏌️ 2온 안전 공략 추천',
  '안전한 중앙 공략',
];

function localizeTip(tip: string, isJapanese: boolean): string {
  if (!isJapanese) return tip;

  const exactMap: Record<string, string> = {
    '티샷 시 좌측 경사를 태우면 안전': 'ティーショット時は左側傾斜を利用すると安全',
    '맞바람이 불 때는 낮게 깔아치는 샷 추천': '向かい風の時は低めのショットがおすすめ',
    '그린 앞 벙커 우측으로 부드럽게 공략': 'グリーン手前バンカーの右側へソフトに攻略',
    '홀컵 뒤쪽 내리막이 심하므로 짧게 공략': 'カップ奥は下り傾斜がきついので手前から短めに攻略',
    '페어웨이 중앙을 향해 똑바로 티샷': 'フェアウェイ中央に向かって真っ直ぐティーショット',
    '무리한 1온보다는 2온 안전 공략 추천': '無理な1オンより安全な2オン狙いがおすすめ',
  };

  if (exactMap[tip.trim()]) {
    return exactMap[tip.trim()];
  }

  let res = tip;
  res = res.replace(/티샷/g, 'ティーショット');
  res = res.replace(/페어웨이/g, 'フェアウェイ');
  res = res.replace(/그린/g, 'グリーン');
  res = res.replace(/벙커/g, 'バンカー');
  res = res.replace(/러프/g, 'ラフ');
  res = res.replace(/좌측/g, '左側');
  res = res.replace(/우측/g, '右側');
  res = res.replace(/중앙/g, '中央');
  res = res.replace(/경사/g, '傾斜');
  res = res.replace(/오르막/g, '上り');
  res = res.replace(/내리막/g, '下り');
  res = res.replace(/안전/g, '安全');
  res = res.replace(/공략/g, '攻略');
  res = res.replace(/추천/g, 'おすすめ');
  return res;
}

export function TipCard({ hole, tip, courseLabel, onSaveTip }: TipCardProps) {
  const { isJapanese } = useTranslation();
  const [upvotes, setUpvotes] = useState(0);
  const [voted, setVoted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputTip, setInputTip] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const clean = tip ? tip.trim() : '';

  // 진짜 검증된 현장 노하우인지 판별 (상투적 더미 팁이 아니고 내용이 있는 경우)
  const isGenuineTip = clean.length > 0 && !DUMMY_TIPS.some((dummy) => clean.includes(dummy));

  const handleVote = () => {
    if (voted) return;
    setUpvotes((prev) => prev + 1);
    setVoted(true);
  };

  const handleOpenModal = () => {
    setInputTip(isGenuineTip ? clean : '');
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const trimmed = inputTip.trim();
    if (!trimmed) {
      alert(isJapanese ? '攻略のコツを入力してください。' : '이 홀만의 공략 팁을 입력해 주세요.');
      return;
    }
    if (onSaveTip) {
      onSaveTip(trimmed);
    }
    setIsModalOpen(false);
    setToastMessage(isJapanese ? '攻略ヒントを登録しました！' : '고수의 공략 꿀팁이 등록되었습니다! 🏌️');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleAppendTag = (tag: string) => {
    if (!inputTip) {
      setInputTip(tag);
    } else {
      setInputTip(`${inputTip}, ${tag}`);
    }
  };

  const holeDisplayName = courseLabel || `${hole}번 홀`;
  const localizedTip = isGenuineTip ? localizeTip(clean, isJapanese) : '';

  return (
    <>
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-900/95 text-yellow-300 font-black text-xs px-4 py-2.5 rounded-full shadow-xl border border-yellow-400 flex items-center gap-1.5 animate-bounce">
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 진짜 노하우가 있을 때 vs 없을 때 스마트 2단계 표출 */}
      {isGenuineTip ? (
        /* 1) 진짜 현장 노하우가 등록되어 있을 때: 고대비 에메랄드 카드 + 공감 & 보태기 버튼 */
        <div className="bg-emerald-50/90 border border-emerald-300 text-emerald-950 px-3 py-2 rounded-xl shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parky.jpg"
              alt="파키"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-amber-400 shadow-2xs"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-black text-emerald-800 flex items-center gap-1.5">
                <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[9px] font-black shrink-0">
                  {isJapanese ? '実戦攻略' : '현장 실전 팁'}
                </span>
                <span className="truncate">{isJapanese ? '🏌️ ベテランのコース攻略' : '🏌️ 고수의 현장 노하우'}</span>
              </div>
              <p className="text-xs font-black text-emerald-950 truncate break-keep mt-0.5">
                {localizedTip}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleVote}
              disabled={voted}
              aria-label={isJapanese ? (voted ? '共感済' : '役に立つ') : (voted ? '공감완료' : '도움돼요')}
              title={isJapanese ? (voted ? '共感済' : '役に立つ') : (voted ? '공감완료' : '도움돼요')}
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border font-bold transition active:scale-95 cursor-pointer ${
                voted
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <ThumbsUp className="w-3 h-3" />
              <span>{upvotes}</span>
            </button>
            <button
              type="button"
              onClick={handleOpenModal}
              title={isJapanese ? 'ヒント追記' : '팁 보태기'}
              className="p-1 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 active:scale-95 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 2) 아직 등록된 팁이 없을 때: 억지 가짜 팁 제거 -> 기분 좋은 응원 + [✏️ 꿀팁 남기기] 간략 버튼 */
        <div className="bg-stone-50 border border-stone-200 text-stone-800 px-3 py-2 rounded-xl shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parky.jpg"
              alt="파키"
              className="w-8 h-8 rounded-full object-cover shrink-0 border border-stone-300 shadow-2xs"
            />
            <div className="min-w-0">
              <div className="text-[10px] font-black text-stone-500 flex items-center gap-1">
                <span>🏌️ {isJapanese ? 'パキのワンポイント応援' : '파키의 라운드 한마디'}</span>
              </div>
              <p className="text-xs font-bold text-stone-700 truncate break-keep mt-0.5">
                {isJapanese ? '落ち着いて空振りなしのナイスショット！⛳' : '차분하게 빈스윙 후 나이스 샷! 화이팅 ⛳'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="shrink-0 flex items-center gap-1 text-[11px] font-black px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition active:scale-95 cursor-pointer"
          >
            <Edit3 className="w-3 h-3" />
            <span>{isJapanese ? 'ヒント投稿' : '꿀팁 남기기'}</span>
          </button>
        </div>
      )}

      {/* 고수 공략 팁 등록/수정 모달창 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white text-stone-900 rounded-2xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden animate-in zoom-in-95">
            {/* 모달 헤더 */}
            <div className="px-4 py-3 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-black text-sm">
                <Lightbulb className="w-4 h-4 text-yellow-300" />
                <span>{isJapanese ? `💡 ${holeDisplayName} 実戦攻略ヒント登録` : `💡 ${holeDisplayName} 실전 공략 꿀팁 등록`}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="p-4 space-y-3">
              <p className="text-xs text-stone-600 leading-snug">
                {isJapanese
                  ? '後続のゴルファーに役立つ現地の生きたノウハウ（OB杭、傾斜、攻め方）を1行で入力してください！'
                  : '후속 조와 동반자들에게 큰 힘이 되는 생생한 현장 노하우(OB 말뚝, 내리막, 공략 방향)를 1줄로 남겨주세요!'}
              </p>

              {/* 빠른 원터치 태그 칩 */}
              <div className="space-y-1">
                <span className="text-[10px] font-black text-stone-400">⚡ 터치하여 빠른 단어 추가:</span>
                <div className="flex flex-wrap gap-1">
                  {QUICK_TIP_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAppendTag(tag)}
                      className="text-[10px] font-bold px-2 py-1 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-700 text-stone-700 rounded-md border border-stone-200 transition active:scale-95 cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 입력창 */}
              <div>
                <textarea
                  rows={3}
                  value={inputTip}
                  onChange={(e) => setInputTip(e.target.value)}
                  placeholder={
                    isJapanese
                      ? '例: 左側OB杭に注意！少し右側のフェアウェイを安全に攻略'
                      : '예: 좌측 30m 지점 OB 말뚝 주의! 살짝 우측 페어웨이로 안전 공략'
                  }
                  className="w-full p-2.5 text-xs font-bold rounded-xl border border-stone-300 focus:border-emerald-600 focus:outline-none bg-stone-50 text-stone-900 resize-none"
                />
              </div>

              {/* 액션 버튼 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition cursor-pointer"
                >
                  {isJapanese ? 'キャンセル' : '닫기'}
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shadow-md transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isJapanese ? 'ヒント登録完了' : '공략 등록 완료'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
