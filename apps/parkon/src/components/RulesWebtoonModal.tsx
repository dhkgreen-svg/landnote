'use client';

import React, { useState } from 'react';
import { X, BookOpen, HelpCircle, ChevronDown, Sparkles, Heart, ShieldCheck, Check } from 'lucide-react';

interface RulesWebtoonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RulesWebtoonModal({ isOpen, onClose }: RulesWebtoonModalProps) {
  const [activeTab, setActiveTab] = useState<'WEBTOON_LESSON' | 'WEBTOON_MANNER' | 'RULES_QA'>('WEBTOON_LESSON');
  const [openQaIndex, setOpenQaIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  const qaList = [
    {
      q: 'Q1. 티샷할 때 공이 티에서 굴러 떨어졌어요. 벌타인가요?',
      a: '벌타가 아닙니다! 스윙 의도 없이 어드레스 중 바람이나 터치로 공이 티에서 떨어진 경우 무벌타로 다시 티 위에 올려놓고 치시면 됩니다.',
      tip: '파키 팁: 단, 샷을 하려는 의도로 스윙을 시작하여 헛스윙 후 떨어진 것은 1타로 계산되니 주의하세요!',
      badge: '티샷 규정',
    },
    {
      q: 'Q2. 공이 백색 OB 말뚝 밖으로 나갔어요. 어떻게 처치하나요?',
      a: '2벌타가 부과됩니다. 공이 OB 라인을 마지막으로 통과한 지점(또는 정지한 지점과 가장 가까운 인플레이 구역)에서 홀에 가깝지 않게 2클럽 이내에 드롭하고 다음 샷을 진행합니다.',
      tip: '파키 팁: 무리하게 OB선 밖으로 손을 뻗어 치시면 안 돼요! 안전이 최우선입니다.',
      badge: 'OB 규정 (2벌타)',
    },
    {
      q: 'Q3. 벙커에 들어갔을 때 모래에 클럽 헤드를 땅에 대도 되나요?',
      a: '파크골프는 일반 골프와 달리 벙커에서 클럽 헤드를 모래에 가볍게 접촉(터치)하는 것이 허용됩니다. 단, 모래를 다지거나 고르는 등의 라이 개선 행위는 금지됩니다.',
      tip: '파키 팁: 어르신들의 허리 부담과 안전을 위해 클럽을 편안히 지면에 내려놓고 치셔도 괜찮습니다!',
      badge: '벙커 규정',
    },
    {
      q: 'Q4. 동반자의 공이 제 퍼팅 라이(길목)를 딱 가리고 있어요.',
      a: '공의 위치를 마크해 달라고 요청할 수 있습니다! 동반자는 공 바로 뒤에 볼마커(또는 코인)를 놓고 공을 집어 올린 후, 퍼팅이 끝난 뒤 원위치에 놓아주시면 됩니다.',
      tip: '파키 팁: 홀컵에서 2클럽 이내의 공은 항상 마크를 요청하거나 먼저 홀아웃(컨시드) 하시는 것이 매너입니다.',
      badge: '마크 매너',
    },
    {
      q: 'Q5. 공이 홀컵 테두리에 아슬아슬하게 걸쳐 있어요. 홀인 인정인가요?',
      a: '공의 전체 또는 일부가 홀컵 안 가장자리(림) 아래로 내려앉아 정지해 있다면 홀아웃(인정)입니다. 공이 컵 밖 지면에 완전히 얹혀져 있다면 아직 인정되지 않으므로 살짝 탭인하셔야 합니다.',
      tip: '파키 팁: 10초 이내에 자연적으로 떨어지는지 확인하는 여유를 가져보세요!',
      badge: '홀아웃 규정',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border border-emerald-100 flex flex-col max-h-[90vh]">
        {/* 고정 상단 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 shrink-0 bg-emerald-700 text-white">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-amber-400 text-emerald-950 flex items-center justify-center font-black text-xs shadow-xs">
              📖
            </span>
            <div>
              <h3 className="text-sm font-black leading-tight">
                파키의 파크골프 웹툰북 & 룰 Q&A
              </h3>
              <p className="text-[10px] text-emerald-200 font-medium">
                그림으로 쉽고 재밌게 배우는 공식 규정 & 에티켓
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95 shrink-0"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-stone-200 bg-stone-50 shrink-0 px-2 pt-2 gap-1 text-[11px] font-black">
          <button
            type="button"
            onClick={() => setActiveTab('WEBTOON_LESSON')}
            className={`flex-1 py-2 rounded-t-xl transition text-center cursor-pointer border-t border-x ${
              activeTab === 'WEBTOON_LESSON'
                ? 'bg-white text-emerald-800 border-stone-200 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            🏌️ 1편 기본자세
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('WEBTOON_MANNER')}
            className={`flex-1 py-2 rounded-t-xl transition text-center cursor-pointer border-t border-x ${
              activeTab === 'WEBTOON_MANNER'
                ? 'bg-white text-emerald-800 border-stone-200 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            🤝 2편 동반자매너
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('RULES_QA')}
            className={`flex-1 py-2 rounded-t-xl transition text-center cursor-pointer border-t border-x ${
              activeTab === 'RULES_QA'
                ? 'bg-white text-emerald-800 border-stone-200 font-black shadow-2xs'
                : 'text-stone-500 hover:text-stone-800 border-transparent'
            }`}
          >
            ❓ 룰 핵심 Q&A
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* 상단 파키 대표 사진 (31번: 노을 필드에서 룰북 읽는 파키) */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_31.jpg"
              alt="파키의 파크골프 규정 핸드북"
              className="w-full h-44 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 text-white">
              <div>
                <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  <span>공식 파크골프 웹툰북</span>
                </span>
                <div className="text-sm font-black mt-1 text-white">
                  파키와 함께라면 룰과 매너가 10배 즐거워집니다!
                </div>
              </div>
            </div>
          </div>

          {/* 1번 탭: 1편 기본 자세 교습 (그립 포스터 30번 + 스윙 41번 + 퍼팅 40번) */}
          {activeTab === 'WEBTOON_LESSON' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 mb-1">
                  <span>📖 제1화: 올바른 그립법이 타수를 줄인다!</span>
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  파크골프는 스윙보다 <strong>그립의 안정감</strong>이 방향성을 90% 결정합니다. 파키가 알려주는 3단계 그립을 확인해보세요!
                </p>
              </div>

              {/* 그립 포스터 30번 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_30.jpg"
                  alt="파크골프 그립 잡는 법 3단계"
                  className="w-full h-auto object-cover"
                />
                <div className="p-3 bg-stone-50 text-xs space-y-1 text-stone-700">
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="text-emerald-700">✔</span>
                    <span>1단계(왼손): 그립 상단을 가볍게 쥐고 손바닥을 릴랙스</span>
                  </div>
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="text-emerald-700">✔</span>
                    <span>2단계(오른손): 왼손 바로 아래에 자연스럽게 감싸 쥐기</span>
                  </div>
                  <div className="font-bold text-stone-900 flex items-center gap-1">
                    <span className="text-emerald-700">✔</span>
                    <span>3단계(밀착): 양손 엄지손가락이 그립 중앙선을 아래로 향하게</span>
                  </div>
                </div>
              </div>

              {/* 티샷과 퍼팅 팁 2단 카드 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl overflow-hidden border border-stone-200 bg-white p-2 text-center space-y-1.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_41.jpg"
                    alt="호쾌한 티샷 스윙"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-black text-stone-900">호쾌한 티샷 팁</div>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    머리를 끝까지 고정하고 피니시 자세를 2초 유지하세요!
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-stone-200 bg-white p-2 text-center space-y-1.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_40.jpg"
                    alt="신중한 퍼팅"
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-black text-stone-900">홀컵 쏙! 퍼팅 팁</div>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    손목을 꺾지 말고 진자운동(시계추) 리듬으로 밀어주세요!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2번 탭: 2편 동반자 매너 & 나눔 (악수 34번 + 벤치 김밥 나눔 38번) */}
          {activeTab === 'WEBTOON_MANNER' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3">
                <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5 mb-1">
                  <span>🍱 제2화: 라운딩의 진정한 묘미는 따뜻한 정(情)!</span>
                </h4>
                <p className="text-[11px] text-purple-800 leading-relaxed font-medium">
                  실력보다 더 귀한 것은 <strong>함께 웃고 배려하는 마음</strong>입니다. 필드에서 마주치는 모든 동반자는 평생의 친구가 됩니다.
                </p>
              </div>

              {/* 38번: 벤치 김밥 도시락 & 차 마시는 파키 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_38.jpg"
                  alt="파크골프장 벤치에서 할아버지와 김밥 나누는 파키"
                  className="w-full h-52 object-cover object-top"
                />
                <div className="p-3 bg-stone-50 space-y-1 text-xs">
                  <div className="font-black text-stone-900 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>&quot;오늘 샷 정말 좋으셨어요! 따뜻한 차 한잔 드세요.&quot;</span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">
                    9홀을 마치고 벤치에 둘러앉아 나누는 김밥 한 조각과 온기 넘치는 대화가 파크골프의 가장 큰 행복입니다.
                  </p>
                </div>
              </div>

              {/* 34번: 어르신과 악수하는 파키 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_34.jpg"
                  alt="동반자 어르신과 반갑게 악수하는 파키"
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-stone-50 space-y-1 text-xs">
                  <div className="font-black text-stone-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>시작 전 &quot;잘 부탁드립니다&quot;, 마친 후 &quot;수고하셨습니다&quot;</span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">
                    밝은 미소의 인사 한마디가 우리 구장을 전국에서 가장 명품 구장으로 만듭니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3번 탭: 룰 핵심 Q&A 5선 */}
          {activeTab === 'RULES_QA' && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>필드에서 가장 헷갈리는 공식 룰 TOP 5</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  질문을 터치하시면 파키의 명쾌한 해설과 팁이 열립니다.
                </p>
              </div>

              {qaList.map((item, idx) => {
                const isOpen = openQaIndex === idx;
                return (
                  <div
                    key={idx}
                    className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs transition"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQaIndex(isOpen ? null : idx)}
                      className="w-full p-3.5 text-left flex items-start justify-between gap-2 cursor-pointer hover:bg-stone-50 transition"
                    >
                      <div className="space-y-1">
                        <span className="text-[9.5px] font-black bg-stone-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                          {item.badge}
                        </span>
                        <div className="font-black text-xs text-stone-900 leading-snug">
                          {item.q}
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-400 shrink-0 transition-transform duration-200 mt-1 ${
                          isOpen ? 'rotate-180 text-emerald-700' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-1 border-t border-stone-100 bg-emerald-50/40 text-xs space-y-2">
                        <p className="text-stone-800 font-bold leading-relaxed">
                          {item.a}
                        </p>
                        <div className="bg-white p-2 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 font-medium">
                          {item.tip}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* 하단 웹툰북 연재 예고 안내 */}
              <div className="bg-stone-50 rounded-2xl p-3 border border-dashed border-stone-300 text-center space-y-1">
                <div className="text-xs font-black text-stone-800">
                  🎨 파키의 공식 파크골프 웹툰 시리즈 연재 준비 중!
                </div>
                <p className="text-[10.5px] text-stone-500 font-medium">
                  더 풍성하고 생생한 룰 웹툰이 다음 업데이트에서 순차적으로 공개됩니다.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 고정 하단 닫기 버튼 */}
        <div className="p-3 border-t border-stone-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-sm transition cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
