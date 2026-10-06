'use client';

import React, { useState } from 'react';
import { X, ChevronDown, Sparkles, Heart, ShieldCheck, ChevronRight, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export interface RulesWebtoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: 'ko' | 'ja';
  isJp?: boolean;
}

interface StepItem {
  step: string;
  text: string;
}

interface WebtoonCard {
  alt: string;
  title: string;
  desc: string;
}

interface MannerCard {
  alt: string;
  quote: string;
  desc: string;
}

interface QaItem {
  badge: string;
  q: string;
  a: string;
  tip: string;
}

interface WebtoonI18n {
  header: {
    title: string;
    subtitle: string;
    closeAria: string;
  };
  tabs: {
    lesson: string;
    manner: string;
    qa: string;
  };
  banner: {
    badge: string;
    mainCopy: string;
    imageAlt: string;
  };
  nav: {
    prev: string;
    next: string;
  };
  lesson: {
    title: string;
    desc: string;
    posterAlt: string;
    steps: StepItem[];
    card1: WebtoonCard;
    card2: WebtoonCard;
  };
  manner: {
    title: string;
    desc: string;
    card1: MannerCard;
    card2: MannerCard;
  };
  qa: {
    headerTitle: string;
    headerDesc: string;
    items: QaItem[];
    teaserTitle: string;
    teaserDesc: string;
  };
  closeBtn: string;
}

const RULES_WEBTOON_I18N: Record<'ko' | 'ja', WebtoonI18n> = {
  ko: {
    header: {
      title: '파키의 파크골프 웹툰북 & 룰 Q&A',
      subtitle: '그림으로 쉽고 재밌게 배우는 공식 규정 & 에티켓',
      closeAria: '닫기',
    },
    tabs: {
      lesson: '1편 기본자세',
      manner: '2편 동반자매너',
      qa: '룰 핵심 Q&A',
    },
    banner: {
      badge: '공식 파크골프 웹툰북',
      mainCopy: '파키와 함께라면 룰과 매너가 10배 즐거워집니다!',
      imageAlt: '파키의 파크골프 규정 핸드북',
    },
    nav: {
      prev: '이전화',
      next: '다음화',
    },
    lesson: {
      title: '제1화: 올바른 그립법이 타수를 줄인다!',
      desc: '파크골프는 스윙보다 그립의 안정감이 방향성을 90% 결정합니다. 파키가 알려주는 3단계 그립을 확인해보세요!',
      posterAlt: '파크골프 그립 잡는 법 3단계',
      steps: [
        { step: '1단계(왼손)', text: '그립 상단을 가볍게 쥐고 손바닥을 릴랙스' },
        { step: '2단계(오른손)', text: '왼손 바로 아래에 자연스럽게 감싸 쥐기' },
        { step: '3단계(밀착)', text: '양손 엄지손가락이 그립 중앙선을 아래로 향하게' },
      ],
      card1: {
        alt: '호쾌한 티샷 스윙',
        title: '호쾌한 티샷 팁',
        desc: '머리를 끝까지 고정하고 피니시 자세를 2초 유지하세요!',
      },
      card2: {
        alt: '신중한 퍼팅',
        title: '홀컵 쏙! 퍼팅 팁',
        desc: '손목을 꺾지 말고 진자운동(시계추) 리듬으로 밀어주세요!',
      },
    },
    manner: {
      title: '제2화: 라운딩의 진정한 묘미는 따뜻한 정(情)!',
      desc: '실력보다 더 귀한 것은 함께 웃고 배려하는 마음입니다. 필드에서 마주치는 모든 동반자는 평생의 친구가 됩니다.',
      card1: {
        alt: '파크골프장 벤치에서 할아버지와 김밥 나누는 파키',
        quote: '"오늘 샷 정말 좋으셨어요! 따뜻한 차 한잔 드세요."',
        desc: '9홀을 마치고 벤치에 둘러앉아 나누는 김밥 한 조각과 온기 넘치는 대화가 파크골프의 가장 큰 행복입니다.',
      },
      card2: {
        alt: '동반자 어르신과 반갑게 악수하는 파키',
        quote: '시작 전 "잘 부탁드립니다", 마친 후 "수고하셨습니다"',
        desc: '밝은 미소의 인사 한마디가 우리 구장을 전국에서 가장 명품 구장으로 만듭니다.',
      },
    },
    qa: {
      headerTitle: '필드에서 가장 헷갈리는 공식 룰 TOP 5',
      headerDesc: '질문을 터치하시면 파키의 명쾌한 해설과 팁이 열립니다.',
      items: [
        {
          badge: '티샷 규정',
          q: 'Q1. 티샷할 때 공이 티에서 굴러 떨어졌어요. 벌타인가요?',
          a: '벌타가 아닙니다! 스윙 의도 없이 어드레스 중 바람이나 터치로 공이 티에서 떨어진 경우 무벌타로 다시 티 위에 올려놓고 치시면 됩니다.',
          tip: '파키 팁: 단, 샷을 하려는 의도로 스윙을 시작하여 헛스윙 후 떨어진 것은 1타로 계산되니 주의하세요!',
        },
        {
          badge: 'OB 규정 (2벌타)',
          q: 'Q2. 공이 백색 OB 말뚝 밖으로 나갔어요. 어떻게 처치하나요?',
          a: '2벌타가 부과됩니다. 공이 OB 라인을 마지막으로 통과한 지점(또는 정지한 지점과 가장 가까운 인플레이 구역)에서 홀에 가깝지 않게 2클럽 이내에 드롭하고 다음 샷을 진행합니다.',
          tip: '파키 팁: 무리하게 OB선 밖으로 손을 뻗어 치시면 안 돼요! 안전이 최우선입니다.',
        },
        {
          badge: '벙커 규정',
          q: 'Q3. 벙커에 들어갔을 때 모래에 클럽 헤드를 땅에 대도 되나요?',
          a: '파크골프는 일반 골프와 달리 벙커에서 클럽 헤드를 모래에 가볍게 접촉(터치)하는 것이 허용됩니다. 단, 모래를 다지거나 고르는 등의 라이 개선 행위는 금지됩니다.',
          tip: '파키 팁: 어르신들의 허리 부담과 안전을 위해 클럽을 편안히 지면에 내려놓고 치셔도 괜찮습니다!',
        },
        {
          badge: '마크 매너',
          q: 'Q4. 동반자의 공이 제 퍼팅 라이(길목)를 딱 가리고 있어요.',
          a: '공의 위치를 마크해 달라고 요청할 수 있습니다! 동반자는 공 바로 뒤에 볼마커(또는 코인)를 놓고 공을 집어 올린 후, 퍼팅이 끝난 뒤 원위치에 놓아주시면 됩니다.',
          tip: '파키 팁: 홀컵에서 2클럽 이내의 공은 항상 마크를 요청하거나 먼저 홀아웃(컨시드) 하시는 것이 매너입니다.',
        },
        {
          badge: '홀아웃 규정',
          q: 'Q5. 공이 홀컵 테두리에 아슬아슬하게 걸쳐 있어요. 홀인 인정인가요?',
          a: '공의 전체 또는 일부가 홀컵 안 가장자리(림) 아래로 내려앉아 정지해 있다면 홀아웃(인정)입니다. 공이 컵 밖 지면에 완전히 얹혀져 있다면 아직 인정되지 않으므로 살짝 탭인하셔야 합니다.',
          tip: '파키 팁: 10초 이내에 자연적으로 떨어지는지 확인하는 여유를 가져보세요!',
        },
      ],
      teaserTitle: '🎨 파키의 공식 파크골프 웹툰 시리즈 연재 준비 중!',
      teaserDesc: '더 풍성하고 생생한 룰 웹툰이 다음 업데이트에서 순차적으로 공개됩니다.',
    },
    closeBtn: '닫기',
  },
  ja: {
    header: {
      title: 'パーキーのパークゴルフWEB漫画＆ルールQ&A',
      subtitle: 'イラストで楽しく学ぶ公式ルール＆エチケット',
      closeAria: '閉じる',
    },
    tabs: {
      lesson: '第1編 基本姿勢',
      manner: '第2編 同伴者マナー',
      qa: 'ルール重要Q&A',
    },
    banner: {
      badge: '公式パークゴルフWEB漫画',
      mainCopy: 'パーキーと一緒ならルールとマナーが10倍楽しくなる！',
      imageAlt: 'パーキーのパークゴルフ規程ハンドブック',
    },
    nav: {
      prev: '前の話',
      next: '次の話',
    },
    lesson: {
      title: '第1話：正しいグリップがスコアを縮める！',
      desc: 'パークゴルフはスイングよりもグリップの安定感が方向性を90%左右します。パーキーが教える3つの基本グリップをチェック！',
      posterAlt: 'パークゴルフグリップの握り方3ステップ',
      steps: [
        { step: 'ステップ1(左手)', text: 'グリップ上部を軽く握り手のひらをリラックス' },
        { step: 'ステップ2(右手)', text: '左手のすぐ下に自然に包み込むように握る' },
        { step: 'ステップ3(密着)', text: '両手の親指がグリップの中心線を下に向くように' },
      ],
      card1: {
        alt: '爽快なティーショットスイング',
        title: '爽快なティーショットのコツ',
        desc: '頭を最後まで固定し、フィニッシュ姿勢を2秒キープ！',
      },
      card2: {
        alt: '慎重なパッティング',
        title: 'カップイン！パッティングのコツ',
        desc: '手首を折らずに振り子(時計の振り子)リズムでストローク！',
      },
    },
    manner: {
      title: '第2話：ラウンドの本当の醍醐味は温かい心！',
      desc: '腕前よりも大切なのは、共に笑い思いやる心です。コースで出会う同伴者は生涯の友となります。',
      card1: {
        alt: 'ベンチでお弁当を分かち合うパーキー',
        quote: '「今日のショット、素晴らしかったです！温かいお茶をどうぞ」',
        desc: '9ホールを終えてベンチで囲んで分かち合う軽食と温かい会話こそ、パークゴルフの一番の幸せです。',
      },
      card2: {
        alt: '同伴者と握手するパーキー',
        quote: 'スタート前の「よろしくお願いします」、終了後の「お疲れ様でした」',
        desc: '明るい笑顔の挨拶ひとつが、私たちのコースを全国最高のコースにします。',
      },
    },
    qa: {
      headerTitle: 'コースで最も迷いやすい公式ルール TOP 5',
      headerDesc: '質問をタップすると、パーキーのわかりやすい解説とアドバイスが開きます。',
      items: [
        {
          badge: 'ティーショット規則',
          q: 'Q1. ティーショットでボールがティーから転がり落ちました。ペナルティですか？',
          a: 'ペナルティ（罰打）ではありません！打つ意思のないアドレス中の風や接触でボールが落ちた場合は、無罰で再びティーに乗せて打つことができます。',
          tip: 'パーキーのコツ: ただし、打つ意思を持ってスイングを開始し、空振りの後に落ちた場合は1打としてカウントされるのでご注意ください！',
        },
        {
          badge: 'OB規則（2打付加）',
          q: 'Q2. ボールが白杭（OB杭）の外に出ました。どう処置すればよいですか？',
          a: '2打が付加されます（2罰打）。ボールがOBラインを最後に横切った地点（または停止位置に最も近いインプレー区域）から、ホールに近づかない2クラブ以内の位置に手でプレースして次のショットを行います。',
          tip: 'パーキーのコツ: 無理にOB線の外に手を伸ばして打ってはいけません！安全が最優先です。',
        },
        {
          badge: 'バンカー規則',
          q: 'Q3. バンカーに入った時、クラブヘッドを砂にソール（接地）してもよいですか？',
          a: 'パークゴルフは一般のゴルフと異なり、バンカーでクラブヘッドを砂に軽く触れさせる（ソールする）ことが認められています。ただし、砂を踏み固めたり均したりするライの改善行為は禁止されています。',
          tip: 'パーキーのコツ: 腰への負担軽減と安全のため、クラブをリラックスして地面に置いて構えて大丈夫です！',
        },
        {
          badge: 'マークのマナー',
          q: 'Q4. 同伴者のボールが私のパッティングラインを遮っています。',
          a: 'ボールの位置をマークするよう要請できます！同伴者はボールの真後ろにマーカーを置いて球を拾い上げ、パッティング終了後に元の位置に戻してください。',
          tip: 'パーキーのコツ: カップから2クラブ以内のボールは、常にマークを依頼するか先にホールアウトするのがマナーです。',
        },
        {
          badge: 'ホールアウト規則',
          q: 'Q5. ボールがカップの縁にギリギリ引っかかっています。カップイン（ホールイン）と認められますか？',
          a: 'ボールの全体または一部がカップの内縁（リム）より下に沈んで静止していればホールイン（認められます）です。カップ外の地面に完全に乗っている場合は認められないため、軽くタップインしてください。',
          tip: 'パーキーのコツ: 10秒以内に自然にカップに落ちるかどうか確かめる余裕を持ちましょう！',
        },
      ],
      teaserTitle: '🎨 パーキーの公式パークゴルフWEB漫画シリーズ連載準備中！',
      teaserDesc: 'より充実した躍動感あふれるルール漫画が、次回アップデートで順次公開されます。',
    },
    closeBtn: '閉じる',
  },
};

export function RulesWebtoonModal({ isOpen, onClose, lang, isJp }: RulesWebtoonModalProps) {
  const { language, isJapanese: contextIsJapanese } = useTranslation();
  const [activeTab, setActiveTab] = useState<'WEBTOON_LESSON' | 'WEBTOON_MANNER' | 'RULES_QA'>('WEBTOON_LESSON');
  const [openQaIndex, setOpenQaIndex] = useState<number | null>(0);

  if (!isOpen) return null;

  // Determine active language
  const activeLangKey: 'ko' | 'ja' =
    isJp !== undefined
      ? (isJp ? 'ja' : 'ko')
      : lang !== undefined
      ? lang
      : (contextIsJapanese || language === 'ja' ? 'ja' : 'ko');

  const dict = RULES_WEBTOON_I18N[activeLangKey];

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
                {dict.header.title}
              </h3>
              <p className="text-[10px] text-emerald-200 font-medium">
                {dict.header.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-emerald-800/80 hover:bg-emerald-900 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95 shrink-0"
            aria-label={dict.header.closeAria}
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
            🏌️ {dict.tabs.lesson}
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
            🤝 {dict.tabs.manner}
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
            ❓ {dict.tabs.qa}
          </button>
        </div>

        {/* 스크롤 본문 */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* 상단 파키 대표 사진 (31번: 노을 필드에서 룰북 읽는 파키) */}
          <div className="relative rounded-2xl overflow-hidden border border-stone-200 shadow-xs bg-stone-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_31.jpg"
              alt={dict.banner.imageAlt}
              className="w-full h-44 object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-3 text-white">
              <div>
                <span className="text-[10px] font-black bg-amber-400 text-stone-950 px-2 py-0.5 rounded-full shadow-2xs inline-flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 fill-current" />
                  <span>{dict.banner.badge}</span>
                </span>
                <div className="text-sm font-black mt-1 text-white">
                  {dict.banner.mainCopy}
                </div>
              </div>
            </div>
          </div>

          {/* 1번 탭: 1편 기본 자세 교습 (그립 포스터 30번 + 스윙 41번 + 퍼팅 40번) */}
          {activeTab === 'WEBTOON_LESSON' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3">
                <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5 mb-1">
                  <span>📖 {dict.lesson.title}</span>
                </h4>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  {dict.lesson.desc}
                </p>
              </div>

              {/* 그립 포스터 30번 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_30.jpg"
                  alt={dict.lesson.posterAlt}
                  className="w-full h-auto object-cover"
                />
                <div className="p-3 bg-stone-50 text-xs space-y-1.5 text-stone-700">
                  {dict.lesson.steps.map((st, sIdx) => (
                    <div key={sIdx} className="font-bold text-stone-900 flex items-center gap-1">
                      <span className="text-emerald-700">✔</span>
                      <span><strong>{st.step}:</strong> {st.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 티샷과 퍼팅 팁 2단 카드 */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl overflow-hidden border border-stone-200 bg-white p-2 text-center space-y-1.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_41.jpg"
                    alt={dict.lesson.card1.alt}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-black text-stone-900">{dict.lesson.card1.title}</div>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    {dict.lesson.card1.desc}
                  </p>
                </div>

                <div className="rounded-xl overflow-hidden border border-stone-200 bg-white p-2 text-center space-y-1.5 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/mascot/사진저장고_사진_20260913_40.jpg"
                    alt={dict.lesson.card2.alt}
                    className="w-full h-28 object-cover rounded-lg"
                  />
                  <div className="text-[11px] font-black text-stone-900">{dict.lesson.card2.title}</div>
                  <p className="text-[10px] text-stone-500 font-medium leading-tight">
                    {dict.lesson.card2.desc}
                  </p>
                </div>
              </div>

              {/* 내비게이션: 다음화 */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('WEBTOON_MANNER')}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <span>{dict.nav.next} ({dict.tabs.manner})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 2번 탭: 2편 동반자 매너 & 나눔 (악수 34번 + 벤치 김밥 나눔 38번) */}
          {activeTab === 'WEBTOON_MANNER' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3">
                <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5 mb-1">
                  <span>🍱 {dict.manner.title}</span>
                </h4>
                <p className="text-[11px] text-purple-800 leading-relaxed font-medium">
                  {dict.manner.desc}
                </p>
              </div>

              {/* 38번: 벤치 김밥 도시락 & 차 마시는 파키 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_38.jpg"
                  alt={dict.manner.card1.alt}
                  className="w-full h-52 object-cover object-top"
                />
                <div className="p-3 bg-stone-50 space-y-1 text-xs">
                  <div className="font-black text-stone-900 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>{dict.manner.card1.quote}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">
                    {dict.manner.card1.desc}
                  </p>
                </div>
              </div>

              {/* 34번: 어르신과 악수하는 파키 */}
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mascot/사진저장고_사진_20260913_34.jpg"
                  alt={dict.manner.card2.alt}
                  className="w-full h-48 object-cover"
                />
                <div className="p-3 bg-stone-50 space-y-1 text-xs">
                  <div className="font-black text-stone-900 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dict.manner.card2.quote}</span>
                  </div>
                  <p className="text-[11px] text-stone-600 font-medium">
                    {dict.manner.card2.desc}
                  </p>
                </div>
              </div>

              {/* 내비게이션: 이전화 / 다음화 */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('WEBTOON_LESSON')}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{dict.nav.prev}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('RULES_QA')}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-black rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <span>{dict.nav.next}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* 3번 탭: 룰 핵심 Q&A 5선 */}
          {activeTab === 'RULES_QA' && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-1">
                <div className="flex items-center gap-1.5 font-black text-xs text-amber-950">
                  <span className="text-sm">❓</span>
                  <span>{dict.qa.headerTitle}</span>
                </div>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5">
                  {dict.qa.headerDesc}
                </p>
              </div>

              {dict.qa.items.map((item, idx) => {
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
                  {dict.qa.teaserTitle}
                </div>
                <p className="text-[10.5px] text-stone-500 font-medium">
                  {dict.qa.teaserDesc}
                </p>
              </div>

              {/* 내비게이션: 이전화 */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('WEBTOON_MANNER')}
                  className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{dict.nav.prev} ({dict.tabs.manner})</span>
                </button>
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
            {dict.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
