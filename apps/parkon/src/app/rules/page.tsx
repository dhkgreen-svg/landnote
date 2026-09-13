'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  Mic,
  MicOff,
  Camera,
  Volume2,
  CheckCircle,
  AlertCircle,
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  ShieldCheck,
  Home,
  MessageSquare,
  BookOpen,
  ExternalLink,
  Info,
} from 'lucide-react';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import {
  KPGA_RULEBOOK_CHAPTERS,
  RULE_CATEGORIES,
  RuleCategoryId,
  CATEGORIZED_RULES,
  CategorizedRuleItem,
  RulebookChapter,
} from '@/lib/rulebookData';

export default function RulesPage() {
  const [selectedCategory, setSelectedCategory] = useState<RuleCategoryId>('ob');
  const [questionText, setQuestionText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activeVerdict, setActiveVerdict] = useState<CategorizedRuleItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<RulebookChapter | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const questionTextRef = useRef('');

  useEffect(() => {
    questionTextRef.current = questionText;
  }, [questionText]);

  // Initialize Speech Recognition (Continuous mode without 5-second timeout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'ko-KR';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let fullTranscript = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullTranscript += event.results[i][0].transcript + ' ';
          }
          const text = fullTranscript.trim();
          if (text) {
            setQuestionText(text);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn('Speech recognition status:', err);
        };

        recognition.onend = () => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {}
          } else {
            setIsListening(false);
          }
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }

    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Voice start: 음성 문의 시작
  const startVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('현재 브라우저에서는 음성 인식을 지원하지 않거나 마이크 권한이 필요합니다. 문자 입력을 이용해 주세요.');
      return;
    }

    try {
      isListeningRef.current = true;
      setIsListening(true);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Speech recognition error:', err);
    }
  };

  // Voice cancel: 음성 문의 취소
  const cancelVoiceInput = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Voice finish & submit
  const finishVoiceAndSubmit = () => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setTimeout(() => {
      handleInstantVerdict(questionTextRef.current || questionText, selectedCategory);
    }, 100);
  };

  // Photo upload / capture handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Close verdict modal
  const closeModal = () => {
    setShowModal(false);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  // Open modal directly from question item click
  const openRuleModal = (rule: CategorizedRuleItem) => {
    setActiveVerdict(rule);
    setShowModal(true);
  };

  // Instant Verdict Solver Engine (Gemini AI 연동 + 50개 DB 매칭)
  const handleInstantVerdict = async (query = questionText, cat = selectedCategory) => {
    const trimmed = (query || '').trim();
    setIsAnalyzing(true);

    try {
      // 1. 제미나이 AI 실시간 질의
      if (trimmed) {
        const res = await fetch('/api/solomon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: trimmed, category: cat }),
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const aiData: CategorizedRuleItem = {
              id: 'ai-verdict',
              category: cat,
              categoryLabel: 'AI 솔로몬 판정',
              title: json.data.title || trimmed,
              situation: json.data.situation || trimmed,
              verdict: json.data.verdict,
              penalty: json.data.penalty,
              procedure: json.data.procedure,
              tags: json.data.tags || ['솔로몬', '공인판정'],
              officialArticle: json.data.officialArticle || '제33조(아웃 오브 바운즈: OB 및 처치)',
              officialRuleText:
                json.data.officialRuleText ||
                '대한파크골프협회 공인 규정에 따라 인플레이 구역 여부 및 벌타를 판정합니다.',
              voiceAnswer: json.data.voiceAnswer,
            };
            setActiveVerdict(aiData);
            setShowModal(true);
            setIsAnalyzing(false);
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Gemini API fetch error, falling back to local database:', err);
    }

    // 2. 오프라인 또는 기본 매칭 폴백 (50개 DB 검색)
    const lower = trimmed.toLowerCase();
    let matchedRule: CategorizedRuleItem | null = null;
    if (lower) {
      matchedRule =
        CATEGORIZED_RULES.find((r) => {
          return (
            r.title.toLowerCase().includes(lower) ||
            r.situation.toLowerCase().includes(lower) ||
            r.tags.some((t) => lower.includes(t.toLowerCase()) || t.toLowerCase().includes(lower))
          );
        }) || null;
    }

    if (!matchedRule) {
      matchedRule =
        CATEGORIZED_RULES.find((r) => r.category === cat) || CATEGORIZED_RULES[0];
    }

    setActiveVerdict(matchedRule);
    setShowModal(true);
    setIsAnalyzing(false);
  };

  // Text-To-Speech (TTS)
  const speakVerdict = (rule: CategorizedRuleItem) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      alert('음성 출력을 지원하지 않는 기기입니다.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();
    const voiceMsg = rule.voiceAnswer
      ? rule.voiceAnswer
      : `${rule.verdict.replace(/【|】/g, '').trim()}. ${rule.procedure.trim()}`;

    const cleanText = voiceMsg.replace(/【|】/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ko-KR';
    utterance.rate = 1.45;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const currentCategoryRules = CATEGORIZED_RULES.filter(
    (r) => r.category === selectedCategory
  );
  const selectedCategoryMeta = RULE_CATEGORIES.find((c) => c.id === selectedCategory);

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 pb-16">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/" className="p-2 -ml-2 text-stone-700 hover:text-stone-950">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex-1">
          <h2 className="text-xl font-black text-stone-900 flex items-center gap-1.5">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm">
              ⚖️
            </span>
            <span>룰 솔로몬</span>
            <span className="text-xs bg-amber-400 text-emerald-950 font-black px-2 py-0.5 rounded-full shadow-sm">
              1초 판정
            </span>
          </h2>
          <p className="text-xs text-stone-600 font-bold mt-0.5">
            필드 분쟁 즉시 해결 · (사)대한파크골프협회 공인 규정 준거
          </p>
        </div>
      </div>

      {/* Guide Banner with Mascot Parky */}
      <div className="bg-emerald-800 text-white rounded-3xl p-4 shadow-md flex items-center gap-3.5 border border-amber-400/60">
        <img
          src="/parky.jpg"
          alt="마스코트 파키"
          className="w-16 h-16 rounded-2xl object-cover shrink-0 border-2 border-amber-300 shadow-md"
        />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full">
              공식 경기위원
            </span>
            <h3 className="font-extrabold text-sm text-amber-300">
              파키(Parky)가 1초 판정해 드려요!
            </h3>
          </div>
          <p className="text-xs text-emerald-100 mt-1 leading-relaxed break-keep font-medium">
            동반자와 룰이 엇갈릴 때 <strong>공식 룰북 항목</strong>이나 <strong>분야별 질문 문항</strong>을 누르시면 팝업창에서 명쾌한 세부 판정을 즉시 보실 수 있습니다!
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 1. (사)대한파크골프협회 공인 공식 룰북 (제1장~제8장 밑으로 쭉 나열) */}
      {/* 좌우 스크롤 제거 -> 세로 나열 리스트 + 클릭 시 팝업창 출력 */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-md p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-stone-200/80 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-xl shadow-md shrink-0">
              📘
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                  협회 공인
                </span>
                <h3 className="font-extrabold text-sm text-stone-900 truncate">
                  (사)대한파크골프협회 공식 룰북
                </h3>
              </div>
              <p className="text-xs text-stone-600 font-bold mt-0.5 truncate">
                항목을 터치하시면 해당 장의 세부 내용이 팝업창으로 뜹니다
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0">
            총 8개 장
          </span>
        </div>

        {/* 8개 장 세로 나열 리스트 (좌우 스크롤 없이 밑으로 쭉 나열) */}
        <div className="space-y-2 pt-0.5">
          {KPGA_RULEBOOK_CHAPTERS.map((ch) => (
            <button
              key={ch.id}
              type="button"
              onClick={() => setSelectedChapter(ch)}
              className="w-full text-left p-3 rounded-2xl border-2 border-stone-200 hover:border-emerald-600 bg-stone-50/80 hover:bg-emerald-50/50 shadow-sm transition active:scale-[0.98] flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-emerald-700 group-hover:bg-emerald-600 text-white font-black text-xs flex flex-col items-center justify-center shrink-0 shadow-sm transition">
                  <span className="text-[9px] text-amber-300 font-black">공인</span>
                  <span>{ch.chapterNumber}</span>
                </span>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-stone-900 truncate">
                    {ch.title}
                  </h4>
                  <p className="text-[11px] text-stone-500 font-bold truncate mt-0.5">
                    {ch.summary}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1">
                <span className="text-[11px] font-black text-emerald-800 bg-white group-hover:bg-emerald-600 group-hover:text-white px-2 py-1 rounded-lg transition border border-emerald-200 shadow-sm">
                  세부 내용
                </span>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. 규정 분야별 질문 문항 선택 (카테고리 보기 & 문항 리스트) */}
      {/* ========================================================= */}
      <div className="space-y-3">
        {/* Category Header */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📂</span>
            <span className="text-sm font-black text-stone-900">
              규정 분야별 질문 선택 (카테고리 보기)
            </span>
          </div>
          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 px-2 py-0.5 rounded-full">
            총 50문항
          </span>
        </div>

        {/* Categories Grid (6개 분야 탭) */}
        <div className="grid grid-cols-3 gap-2">
          {RULE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-2.5 rounded-2xl text-left transition flex flex-col justify-between border-2 shadow-sm active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-700 text-white border-emerald-600 shadow-emerald-700/30'
                    : 'bg-white text-stone-800 border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{cat.icon}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                      isSelected
                        ? 'bg-amber-400 text-emerald-950'
                        : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {cat.badge}
                  </span>
                </div>
                <div className="font-black text-xs leading-tight break-keep">
                  {cat.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Category Questions List */}
        <div className="bg-stone-50 border-2 border-emerald-600/30 rounded-3xl p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-sm">{selectedCategoryMeta?.icon}</span>
              <span className="text-xs font-black text-stone-900">
                {selectedCategoryMeta?.label} ({currentCategoryRules.length}문항)
              </span>
            </div>
            <span className="text-[11px] font-bold text-stone-500">
              터치 시 판정 답이 뜹니다
            </span>
          </div>

          <p className="text-[11px] text-stone-600 font-bold px-1">
            {selectedCategoryMeta?.description}
          </p>

          {/* Question List Items */}
          <div className="space-y-2 pt-1">
            {currentCategoryRules.map((rule, idx) => (
              <button
                key={rule.id}
                type="button"
                onClick={() => openRuleModal(rule)}
                className="w-full text-left p-3.5 rounded-2xl border-2 border-stone-200 hover:border-emerald-600 bg-white hover:bg-emerald-50/50 shadow-sm transition active:scale-[0.98] flex items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-xl bg-emerald-700 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-sm group-hover:bg-emerald-600">
                    Q{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-stone-100 text-stone-700 border border-stone-200 shrink-0">
                        {rule.categoryLabel}
                      </span>
                      <h4 className="font-extrabold text-xs text-stone-900 truncate">
                        {rule.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-stone-600 font-bold truncate">
                      {rule.situation}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-[11px] font-black text-emerald-800 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white px-2 py-1 rounded-lg transition border border-emerald-200">
                    답 보기
                  </span>
                  <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. Q&A 질문하고 즉시 답 받기 (최하단 배치) */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl border-2 border-emerald-600 shadow-md p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-emerald-950 flex items-center gap-1">
            <MessageSquare className="w-4 h-4 text-emerald-700" />
            <span>Q&A 질문하고 즉시 답 받기 (직접 입력 / 음성 / 사진)</span>
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            1초 판정
          </span>
        </div>

        {/* Text Input Area */}
        <div className="relative">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder={
              selectedCategory === 'ob'
                ? '예: 공이 OB 흰 선에 살짝 걸쳤는데 세이프인가요?'
                : selectedCategory === 'hazard_relief'
                ? '예: 연못 해저드에 공이 빠졌을 때 몇 벌타인가요?'
                : selectedCategory === 'putting_green'
                ? '예: 깃대를 맞고 밖으로 튕겨 나온 공은 홀인인가요?'
                : selectedCategory === 'tee_swing'
                ? '예: 헛스윙했는데 1타로 계산하나요?'
                : selectedCategory === 'touch_penalty'
                ? '예: 동반자 공을 맞췄는데 맞은 공은 어떻게 하나요?'
                : '궁금한 상황을 자유롭게 입력하세요 (예: 깃대 맞고 튕김, 헛스윙 1타 등)'
            }
            rows={2}
            className="w-full text-sm font-bold p-3 pr-8 rounded-2xl border-2 border-stone-200 focus:border-emerald-600 focus:outline-none resize-none placeholder:text-stone-400 leading-snug"
          />
          {questionText && (
            <button
              type="button"
              onClick={() => setQuestionText('')}
              className="absolute right-2.5 top-2.5 p-1 text-stone-400 hover:text-stone-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Voice & Photo Actions */}
        {isListening ? (
          <div className="bg-rose-50 border-2 border-rose-400 rounded-2xl p-3.5 space-y-2.5 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                <span className="text-xs font-black text-rose-800">
                  🎙️ 시간제한 없이 편안하게 말씀하세요...
                </span>
              </div>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                실시간 음성 듣는 중
              </span>
            </div>
            <p className="text-[11px] text-stone-700 font-bold leading-relaxed">
              상황을 충분히 설명하신 후, 아래 <strong>[✓ 확인 (말씀 완료 및 판정)]</strong>을 누르시면 답을 드립니다.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={finishVoiceAndSubmit}
                className="col-span-2 py-3 px-3 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <CheckCircle className="w-4 h-4 text-amber-300" />
                <span>✓ 확인 (말씀 완료 및 판정)</span>
              </button>

              <button
                type="button"
                onClick={cancelVoiceInput}
                className="py-3 px-3 rounded-xl font-black text-xs bg-stone-200 hover:bg-stone-300 text-stone-800 flex items-center justify-center gap-1 active:scale-95 transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>취소</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={startVoiceInput}
              className="py-3 px-3 rounded-2xl font-black text-xs bg-stone-50 text-stone-800 border border-stone-300 hover:bg-stone-100 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Mic className="w-4 h-4 text-rose-600" />
              <span>🎙️ 말로 음성 문의</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-2xl font-black text-xs bg-stone-50 text-stone-800 border border-stone-300 hover:bg-stone-100 flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <Camera className="w-4 h-4 text-emerald-700" />
              <span>📷 현장 사진 찍기/업로드</span>
            </button>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Photo Preview if uploaded */}
        {photoPreview && (
          <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500 bg-stone-900 p-1">
            <img
              src={photoPreview}
              alt="현장 사진"
              className="w-full h-36 object-cover rounded-xl"
            />
            <div className="absolute bottom-2 left-3 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>현장 공·경계 사진 분석 준비 완료</span>
            </div>
            <button
              type="button"
              onClick={removePhoto}
              className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Instant Solve Button */}
        <button
          type="button"
          onClick={() => handleInstantVerdict()}
          disabled={isAnalyzing}
          className="w-full py-4 text-base font-black bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl shadow-lg shadow-emerald-700/30 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {isAnalyzing ? (
            <span>⚡ 룰 솔로몬 분석 중...</span>
          ) : (
            <>
              <span>⚡ 1초 솔로몬 판정 받기 (팝업창)</span>
            </>
          )}
        </button>
      </div>

      {/* Google AdSense Slot */}
      <AdSenseSlot className="pt-1" />

      {/* Back to Home Button */}
      <div className="pt-2">
        <Link
          href="/"
          className="w-full bg-stone-900 hover:bg-stone-800 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-md active:scale-95 transition"
        >
          <Home className="w-4 h-4 text-emerald-400" />
          <span>확인 완료 (홈으로 복귀)</span>
        </Link>
      </div>

      {/* ========================================================= */}
      {/* 팝업 모달 1: 룰북 각 장별 세부 내용 전용 팝업창 */}
      {/* 클릭 시 해당 장의 규정 전문과 벌칙 세부 내용이 모달로 출력 */}
      {/* ========================================================= */}
      {selectedChapter && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
          onClick={() => setSelectedChapter(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-600 max-h-[90vh] flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rulebook Chapter Header */}
            <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 font-black flex items-center justify-center text-xl shadow shrink-0">
                  📘
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="bg-amber-400 text-emerald-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                      {selectedChapter.chapterNumber}
                    </span>
                    <h3 className="font-extrabold text-base text-white leading-tight truncate">
                      {selectedChapter.title}
                    </h3>
                  </div>
                  <p className="text-[11px] text-emerald-200 font-bold mt-0.5">
                    (사)대한파크골프협회 공인 경기규칙 전문
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedChapter(null)}
                className="p-1.5 rounded-full bg-emerald-950/60 hover:bg-emerald-800 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chapter Articles Content (Scrollable) */}
            <div className="p-4 overflow-y-auto space-y-3.5 flex-1">
              {/* Chapter Header Info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-700 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {selectedChapter.chapterNumber} 개요
                  </span>
                  <h4 className="text-xs font-black text-emerald-950">
                    {selectedChapter.title}
                  </h4>
                </div>
                <p className="text-xs text-emerald-900 font-bold mt-1 leading-relaxed break-keep">
                  {selectedChapter.summary}
                </p>
              </div>

              {/* Articles in Chapter */}
              <div className="space-y-3">
                {selectedChapter.articles.map((art, aIdx) => (
                  <div
                    key={aIdx}
                    className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between border-b border-stone-200 pb-1.5">
                      <h5 className="font-extrabold text-xs text-stone-900 flex items-center gap-1.5">
                        <span className="text-emerald-700">📜</span>
                        <span>{art.articleNumber}</span>
                        <span className="text-stone-500 font-bold">· {art.title}</span>
                      </h5>
                    </div>

                    <div className="text-xs text-stone-800 font-medium leading-relaxed break-keep whitespace-pre-line">
                      {art.content}
                    </div>

                    {art.penaltyNote && (
                      <div className="bg-rose-50 border border-rose-200 rounded-xl px-2.5 py-1 text-[11px] font-black text-rose-800 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>위반 시 벌칙: {art.penaltyNote}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Official External Link Note */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 font-bold flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span className="truncate">협회 공식 웹사이트 규정실 바로가기</span>
                </div>
                <a
                  href="https://kpga.or.kr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-amber-400 hover:bg-amber-500 text-emerald-950 font-black rounded-lg text-[11px] shrink-0 flex items-center gap-1"
                >
                  <span>kpga.or.kr</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-stone-200 bg-stone-50">
              <button
                type="button"
                onClick={() => setSelectedChapter(null)}
                className="w-full py-3.5 rounded-2xl font-black text-sm bg-stone-900 hover:bg-stone-800 text-white shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <X className="w-4 h-4 text-stone-400" />
                <span>확인 완료 (목록으로 복귀)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 팝업 모달 2: 질문 판정 결과 전용 팝업창 (솔로몬 판정) */}
      {/* ========================================================= */}
      {showModal && activeVerdict && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-fadeIn"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-600 max-h-[90vh] flex flex-col animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/parky.jpg"
                  alt="경기위원 파키"
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-300 shadow shrink-0"
                />
                <div>
                  <h3 className="font-extrabold text-base text-white leading-tight flex items-center gap-1.5">
                    <span>파키의 룰 솔로몬 판정</span>
                    <span className="text-[10px] bg-amber-400 text-emerald-950 font-black px-1.5 py-0.5 rounded-full">
                      공인 규정
                    </span>
                  </h3>
                  <p className="text-[11px] text-emerald-200 font-bold">
                    대한파크골프협회 경기규칙 준거 판정
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full bg-emerald-900/60 hover:bg-emerald-700 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-4 overflow-y-auto space-y-3.5">
              {/* Question Situation */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-1">
                <div className="text-xs font-black text-emerald-800 flex items-center gap-1">
                  <span>질문 상황:</span>
                </div>
                <div className="text-sm font-extrabold text-stone-900 leading-snug">
                  {activeVerdict.title}
                </div>
                <p className="text-xs text-stone-600 font-bold mt-1 leading-relaxed break-keep">
                  {activeVerdict.situation}
                </p>
              </div>

              {/* Verdict Highlight Box */}
              <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-md space-y-1">
                <div className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-amber-300" />
                  <span>최종 솔로몬 판정 결론</span>
                </div>
                <div className="text-lg font-black leading-snug tracking-tight text-white">
                  {activeVerdict.verdict}
                </div>
              </div>

              {/* Penalty Status */}
              <div className="flex items-center justify-between bg-stone-100 px-3.5 py-2.5 rounded-xl border border-stone-200">
                <span className="text-xs font-black text-stone-700">벌타 유무:</span>
                <span
                  className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    activeVerdict.penalty.includes('벌타 없음') || activeVerdict.penalty.includes('무벌')
                      ? 'bg-emerald-600 text-white'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {activeVerdict.penalty}
                </span>
              </div>

              {/* Procedure */}
              <div className="bg-white p-3.5 rounded-2xl border-2 border-stone-200 space-y-1">
                <div className="text-xs font-black text-stone-900 flex items-center gap-1">
                  <span>📌 현장 진행 및 처리 절차:</span>
                </div>
                <p className="text-xs text-stone-800 font-bold leading-relaxed break-keep">
                  {activeVerdict.procedure}
                </p>
              </div>

              {/* Official Association Regulation Rule Text Box */}
              {(activeVerdict.officialArticle || activeVerdict.officialRuleText) && (
                <div className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-3.5 space-y-2 shadow-sm">
                  <div className="flex items-center justify-between gap-1.5 border-b border-amber-200/90 pb-2">
                    <div className="flex items-center gap-1.5 text-amber-950 font-black text-xs">
                      <span className="text-base">📜</span>
                      <span>(사)대한파크골프협회 공식 경기규정</span>
                    </div>
                    {activeVerdict.officialArticle && (
                      <span className="text-[11px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-lg border border-amber-400">
                        {activeVerdict.officialArticle}
                      </span>
                    )}
                  </div>
                  {activeVerdict.officialRuleText && (
                    <div className="bg-white/95 p-3 rounded-xl border border-amber-200 text-stone-800 text-xs font-semibold leading-relaxed break-keep space-y-1">
                      <div className="text-[11px] font-black text-amber-800 flex items-center gap-1">
                        <span>【공인 규정 조항 원문】</span>
                      </div>
                      <p className="text-stone-700 italic">
                        &ldquo;{activeVerdict.officialRuleText}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Speaker TTS Read Aloud Button */}
              <button
                type="button"
                onClick={() => speakVerdict(activeVerdict)}
                className={`w-full py-3 px-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition shadow ${
                  isSpeaking
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-stone-800 hover:bg-stone-900 text-white'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>
                  {isSpeaking
                    ? '🔊 음성 낭독 중... (터치 시 중단)'
                    : '🔊 동반자에게 스피커로 판정 읽어주기'}
                </span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-stone-200 bg-stone-50">
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-3.5 rounded-2xl font-black text-sm bg-stone-900 hover:bg-stone-800 text-white shadow flex items-center justify-center gap-1.5 active:scale-95 transition"
              >
                <X className="w-4 h-4 text-stone-400" />
                <span>확인 완료 (이전 화면으로 복귀)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
