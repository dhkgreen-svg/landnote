'use client';

import React, { useState, useEffect } from 'react';
import { X, Settings, Check, Sparkles, HelpCircle, Globe } from 'lucide-react';
import { HoleDisplayMode, HoleTransitionPopup, RoundSettings } from '@/types/parkon';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { GeoCountryService, ServiceCountry } from '@/lib/geoCountryService';
import { ParkOnStorage } from '@/lib/storage';

interface RoundSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChange?: (settings: RoundSettings) => void;
}

export const STORAGE_KEY_HOLE_DISPLAY = 'parkon_hole_display_mode';
export const STORAGE_KEY_TRANSITION_POPUP = 'parkon_hole_transition_popup';

export function getStoredRoundSettings(): RoundSettings {
  if (typeof window === 'undefined') {
    return { holeDisplayMode: 'PAR', holeTransitionPopup: 'OFF' };
  }
  const mode = (localStorage.getItem(STORAGE_KEY_HOLE_DISPLAY) as HoleDisplayMode) || 'PAR';
  const popup = (localStorage.getItem(STORAGE_KEY_TRANSITION_POPUP) as HoleTransitionPopup) || 'OFF';
  return { holeDisplayMode: mode, holeTransitionPopup: popup };
}

export function RoundSettingsModal({
  isOpen,
  onClose,
  onSettingsChange,
}: RoundSettingsModalProps) {
  const { language, setLanguage, isJapanese, isEnglish } = useTranslation();
  const [holeDisplayMode, setHoleDisplayMode] = useState<HoleDisplayMode>('PAR');
  const [holeTransitionPopup, setHoleTransitionPopup] = useState<HoleTransitionPopup>('OFF');

  // 모달 열릴 때 최신 저장값 로드
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const current = getStoredRoundSettings();
      setHoleDisplayMode(current.holeDisplayMode);
      setHoleTransitionPopup(current.holeTransitionPopup);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectLanguage = (lang: 'ko' | 'ja' | 'en') => {
    setLanguage(lang);
    if (typeof window !== 'undefined') {
      const country: ServiceCountry = lang === 'ko' ? 'KR' : lang === 'ja' ? 'JP' : 'GLOBAL';
      GeoCountryService.setManualCountryAndLanguage(country, lang);
      ParkOnStorage.setServiceCountry(lang === 'ja' ? 'JP' : 'KR');
      window.dispatchEvent(new Event('parkon_country_changed'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleSelectDisplayMode = (mode: HoleDisplayMode) => {
    setHoleDisplayMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_HOLE_DISPLAY, mode);
      const updated: RoundSettings = { holeDisplayMode: mode, holeTransitionPopup };
      window.dispatchEvent(
        new CustomEvent('parkon_round_settings_changed', { detail: updated })
      );
      if (onSettingsChange) onSettingsChange(updated);
    }
  };

  const handleSelectTransitionPopup = (popup: HoleTransitionPopup) => {
    setHoleTransitionPopup(popup);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_TRANSITION_POPUP, popup);
      const updated: RoundSettings = { holeDisplayMode, holeTransitionPopup: popup };
      window.dispatchEvent(
        new CustomEvent('parkon_round_settings_changed', { detail: updated })
      );
      if (onSettingsChange) onSettingsChange(updated);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-stone-900 border-t sm:border border-stone-700/80 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl space-y-4 animate-in slide-in-from-bottom-6 duration-200 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 상단 헤더 */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-amber-400/20 text-yellow-300 border border-yellow-400/30">
              <Settings className="w-5 h-5 stroke-[2.5]" />
            </span>
            <div>
              <h2 className="text-base font-black text-white flex items-center gap-1.5">
                <span>{isJapanese ? '環境設定' : isEnglish ? 'Settings' : '환경 설정'}</span>
                <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.5 rounded-full">
                  {isJapanese ? 'リアルタイム連動' : isEnglish ? 'Live Sync' : '실시간 연동'}
                </span>
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                {isJapanese
                  ? '言語、ホール表記、画面遷移を好みに合わせて設定します。'
                  : isEnglish
                  ? 'Configure language, display mode, and screen transitions.'
                  : '언어, 홀 표기 범위 및 홀 전환 동작을 내 스타일에 맞게 설정합니다.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. 🌐 언어 및 국가 선택 (Language / 言語) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>{isJapanese ? '1. 言語および地域選択' : isEnglish ? '1. Language & Country' : '1. 언어 및 국가 선택'}</span>
              <span className="text-[10px] text-stone-400 font-normal">
                {isJapanese ? '(3ヶ国)' : isEnglish ? '(3 Regions)' : '(3개 국어)'}
              </span>
            </label>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-bold">
              {isJapanese ? '即時保存' : isEnglish ? 'Auto Save' : '자동 저장'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* 한국어 */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('ko')}
              className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                language === 'ko'
                  ? 'bg-amber-400/20 border-amber-400 text-yellow-300 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-stone-800/70 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span className="text-xl leading-none">🇰🇷</span>
              <span className="text-xs font-black">한국어</span>
              <span className="text-[10px] text-stone-400 font-medium">대한민국</span>
            </button>

            {/* 日本語 */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('ja')}
              className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                language === 'ja'
                  ? 'bg-amber-400/20 border-amber-400 text-yellow-300 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-stone-800/70 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span className="text-xl leading-none">🇯🇵</span>
              <span className="text-xs font-black">日本語</span>
              <span className="text-[10px] text-stone-400 font-medium">日本</span>
            </button>

            {/* English */}
            <button
              type="button"
              onClick={() => handleSelectLanguage('en')}
              className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer min-h-[58px] ${
                language === 'en'
                  ? 'bg-amber-400/20 border-amber-400 text-yellow-300 shadow-md font-black ring-1 ring-amber-400/50'
                  : 'bg-stone-800/70 border-stone-700/60 text-stone-300 hover:bg-stone-800 hover:text-white'
              }`}
            >
              <span className="text-xl leading-none">🇺🇸</span>
              <span className="text-xs font-black">English</span>
              <span className="text-[10px] text-stone-400 font-medium">Global</span>
            </button>
          </div>
          <p className="text-[10.5px] text-stone-400 leading-snug px-0.5">
            {isJapanese
              ? '※ 選択した言語に合わせて、全画面のテキストおよびコース・公認ルール案内が即座に切り替わります。'
              : isEnglish
              ? '※ Screen texts, courses, and official rules will adapt to your language choice.'
              : '※ 선택한 언어에 맞춰 전체 메뉴, 구장 안내 및 공인 룰북이 즉시 전환됩니다.'}
          </p>
        </div>

        {/* 2. 홀 정보 표시 범위 (3단 택1 / localStorage 영구 저장) */}
        <div className="space-y-2 pt-1 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300 flex items-center gap-1.5">
              <span>{isJapanese ? '2. ホール情報表示範囲' : isEnglish ? '2. Hole Display Mode' : '2. 홀 정보 표시 범위'}</span>
              <span className="text-[10px] text-stone-400 font-normal">
                {isJapanese ? '(3段階選択)' : isEnglish ? '(Pick 1 of 3)' : '(3단 택1)'}
              </span>
            </label>
            <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-md font-bold">
              {isJapanese ? '自動保存' : isEnglish ? 'Auto Save' : '자동 영구 보존'}
            </span>
          </div>

          <div className="space-y-2">
            {/* 옵션 1: 홀명만 */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('HOLE_ONLY')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'HOLE_ONLY'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'HOLE_ONLY'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'HOLE_ONLY' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-white">{isJapanese ? 'ホール名のみ' : isEnglish ? 'Hole Only' : '홀명만'}</span>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  {isJapanese
                    ? 'ヘッダーに\'A-1 ホール\'のみを簡潔に表示します。'
                    : isEnglish
                    ? 'Displays only \'A-1 Hole\' cleanly in the header.'
                    : '헤더에 \'A-1 홀\'만 간결 표기합니다.'}
                  <br />
                  <span className="text-[10.5px] text-amber-300/80">
                    {isJapanese
                      ? '※ 鉛筆アイコン(✏️)は非表示になりますが、打数計算は正常に動作します。'
                      : isEnglish
                      ? '※ Pencil icon hidden; internal strokes & official Par calculate normally.'
                      : '※ 연필(✏️) 숨김 처리되며, 내부 타수 및 공식 Par 연산은 100% 정상 작동합니다.'}
                  </span>
                </p>
              </div>
            </button>

            {/* 옵션 2: 파까지 (기본) */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('PAR')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'PAR'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'PAR'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'PAR' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white">{isJapanese ? 'Parまで' : isEnglish ? 'Up to Par' : '파까지'}</span>
                    <span className="text-[9px] bg-emerald-500 text-white font-black px-1.5 py-0.2 rounded-full">
                      {isJapanese ? '基本おすすめ' : isEnglish ? 'Default' : '기본 추천'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀 · Par 3 ✏️
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  {isJapanese
                    ? 'ヘッダーに\'A-1 ホール · Par 3 ✏️\'と基準打数付きで表示します。'
                    : isEnglish
                    ? 'Displays \'A-1 Hole · Par 3 ✏️\' with standard par strokes.'
                    : '헤더에 \'A-1 홀 · Par 3 ✏️\'로 기준 타수와 함께 표기합니다.'}
                </p>
              </div>
            </button>

            {/* 옵션 3: 거리까지 */}
            <button
              type="button"
              onClick={() => handleSelectDisplayMode('DISTANCE')}
              className={`w-full p-3 rounded-2xl border text-left transition flex items-start gap-3 cursor-pointer ${
                holeDisplayMode === 'DISTANCE'
                  ? 'bg-amber-400/15 border-amber-400 text-white shadow-md'
                  : 'bg-stone-800/60 border-stone-700/60 text-stone-300 hover:bg-stone-800'
              }`}
            >
              <div className="pt-0.5">
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    holeDisplayMode === 'DISTANCE'
                      ? 'border-yellow-400 bg-yellow-400 text-stone-950'
                      : 'border-stone-500 bg-stone-900'
                  }`}
                >
                  {holeDisplayMode === 'DISTANCE' && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black text-white">{isJapanese ? '距離まで' : isEnglish ? 'Up to Distance' : '거리까지'}</span>
                  <span className="text-[11px] font-mono font-bold text-yellow-300 bg-stone-900 px-2 py-0.5 rounded border border-white/10">
                    A-1 홀 · Par 3 60m ✏️
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  {isJapanese
                    ? 'ヘッダーに\'A-1 ホール · Par 3 60m ✏️\'と公式距離まで一目で表示します。'
                    : isEnglish
                    ? 'Displays \'A-1 Hole · Par 3 60m ✏️\' with official distance.'
                    : '헤더에 \'A-1 홀 · Par 3 60m ✏️\'로 공식 거리까지 한눈에 표기합니다.'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* 3. 홀 전환 안내 팝업 토글 (localStorage 저장) */}
        <div className="space-y-2 pt-1 border-t border-stone-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-300">
              {isJapanese ? '3. ホール遷移案内ポップアップ' : isEnglish ? '3. Hole Transition Popup' : '3. 홀 전환 안내 팝업 토글'}
            </label>
            <div className="flex items-center gap-1 bg-stone-800 p-1 rounded-xl border border-stone-700">
              <button
                type="button"
                onClick={() => handleSelectTransitionPopup('OFF')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  holeTransitionPopup === 'OFF'
                    ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                OFF ({isJapanese ? '既定' : isEnglish ? 'Default' : '기본값'})
              </button>
              <button
                type="button"
                onClick={() => handleSelectTransitionPopup('ON')}
                className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                  holeTransitionPopup === 'ON'
                    ? 'bg-amber-400 text-stone-950 shadow-md font-black'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                ON
              </button>
            </div>
          </div>

          <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60 text-[11px] text-stone-300 leading-relaxed">
            {holeTransitionPopup === 'OFF' ? (
              <p>
                <span className="text-yellow-300 font-bold">⚡ OFF ({isJapanese ? '超高速進行' : isEnglish ? 'Fast Track' : '초고속 진행'}):</span>{' '}
                {isJapanese
                  ? 'ホール切り替え時にポップアップなしで即座に次のホールスコアボードへ移動します。'
                  : isEnglish
                  ? 'Instantly moves to next hole without transition overlay for quickest scoring.'
                  : '홀 전환 시 전광판 없이 즉시 다음 홀 스코어보드로 직행하여 빠르게 다음 타수를 기입합니다.'}
              </p>
            ) : (
              <p>
                <span className="text-emerald-400 font-bold">🏌️ ON ({isJapanese ? 'コース案内' : isEnglish ? 'Course Guide' : '안내 표출'}):</span>{' '}
                {isJapanese
                  ? '次のホール切り替え時に1.5秒間コース案内カードが表示された後、自動フェードアウトします。'
                  : isEnglish
                  ? 'Displays a 1.5s course info card before fading into the next hole.'
                  : '다음 홀 전환 시 1.5초간 가벼운 코스 안내 카드가 표출된 후 자동으로 부드럽게 페이드아웃됩니다.'}
              </p>
            )}
          </div>
        </div>

        {/* 4. 조별 라운드 규칙 안내 */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-stone-900 border border-emerald-500/30 text-[11px] text-emerald-200/90 space-y-1">
          <div className="flex items-center gap-1 font-black text-emerald-300 text-xs">
            <span>{isJapanese ? '💡 4人組ラウンドルール' : isEnglish ? '💡 Group Round Rules' : '💡 4인 조별 경기 규칙'}</span>
          </div>
          <p className="leading-snug">
            {isJapanese ? (
              <>
                • <strong>組長(Host)</strong>が歯車設定を変更すると、組員のスマートフォン画面に<strong>100%自動同期(ミラーリング)</strong>されます。
                <br />
                • ラウンド終了後の<strong>個人記録室(年代記)</strong>では、ご自身のローカル設定に合わせてスコアカードが復元されます。
              </>
            ) : isEnglish ? (
              <>
                • When the <strong>Host</strong> modifies round settings, players’ screens will <strong>mirror automatically 100%</strong> in real-time.
                <br />
                • In your <strong>Personal Chronicle</strong>, cards will reflect your local personal preferences.
              </>
            ) : (
              <>
                • <strong>조장</strong>이 톱니바퀴에서 설정을 변경하면 조원 스마트폰 화면에 <strong>100% 자동 추종(미러링)</strong>됩니다.
                <br />
                • 라운드 종료 후 <strong>개인 기록실(연대기)</strong>에서는 조원 본인의 로컬 설정에 맞춰 스코어카드가 정상 복원되어 표출됩니다.
              </>
            )}
          </p>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 font-black rounded-2xl text-sm shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isJapanese ? '設定完了' : isEnglish ? 'Done' : '설정 완료'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
