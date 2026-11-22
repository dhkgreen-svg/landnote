'use client';
import { useBackHandler } from '@/lib/backNavigation';

import React, { useEffect, useRef, useState } from 'react';
import { X, Sparkles, ShieldCheck, Lock, Smartphone, ArrowRight } from 'lucide-react';
import { ParkOnStorage, KakaoAuthUser } from '@/lib/storage';
import { getOrGenerateMemberCode, syncMemberDataToCloud } from '@/lib/memberCodeUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const formatPhoneWithHyphen = (val: string): string => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
};

interface WelcomeModalProps {
  onOpenKakaoLogin?: () => void;
  onOpenInstallGuide?: () => void;
}

export function WelcomeModal({ onOpenKakaoLogin, onOpenInstallGuide }: WelcomeModalProps) {
  const { isJapanese } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [validationError, setValidationError] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const urlParams = new URLSearchParams(window.location.search);
    const forceWelcome = urlParams.get('welcome') === 'true' || urlParams.get('first') === 'true';
    const shouldReset = urlParams.get('reset') === 'true';

    if (shouldReset) {
      localStorage.removeItem('parkon_welcomed');
      localStorage.removeItem('parkon_welcome_dismissed');
      localStorage.removeItem('parkon_kakao_user');
      localStorage.removeItem('parkon_user_profile');
      localStorage.removeItem('parkon_current_round');
      localStorage.removeItem('parkon_app_installed');
      localStorage.removeItem('parkon_member_code_v1');
    }

    const isDismissed = localStorage.getItem('parkon_welcome_dismissed') === 'true';
    const isWelcomed = localStorage.getItem('parkon_welcomed') === 'true';
    const hasKakao = Boolean(ParkOnStorage.getKakaoUser());
    const isNewUserQuery = urlParams.get('mode') === 'new' || urlParams.get('join') === 'true' || urlParams.get('auth') === '1' || urlParams.get('welcome') === 'false';

    let timer: NodeJS.Timeout | null = null;
    if (!isNewUserQuery && (forceWelcome || shouldReset || (!isDismissed && !isWelcomed && !hasKakao))) {
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 300);
    }

    const handleOpenEvent = () => setIsOpen(true);
    window.addEventListener('parkon_open_welcome_modal', handleOpenEvent);

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('parkon_open_welcome_modal', handleOpenEvent);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // 📲 대표님 특명: 성명 + 휴대폰 번호 필수 확인 후 원스톱 가입 & 시작 실행
  const handleInstallAndStart = async () => {
    const rawName = nameInput.trim();
    const cleanDigits = phoneInput.replace(/\D/g, '');
    const formattedPhone = formatPhoneWithHyphen(phoneInput);
    const hasValidName = Boolean(rawName && rawName !== '홍길동' && rawName !== '파크골퍼' && rawName !== 'パークゴルファー');
    const hasValidPhone = cleanDigits.length >= 10;

    if (!hasValidName || !hasValidPhone) {
      setValidationError(
        isJapanese
          ? '⚠️ お名前と携帯電話番号の両方を入力してください。'
          : '⚠️ 성명과 휴대폰 번호를 모두 입력해 주세요.'
      );
      if (!hasValidName) {
        nameInputRef.current?.focus();
      } else {
        phoneInputRef.current?.focus();
      }
      return;
    }

    setValidationError('');
    const effectiveName = rawName;
    const isRealUserName = true;

    // 1. 프로필 저장 및 8자리 고유번호 발급 + 즉시 로그인 이벤트 전파 (iOS/안드로이드 공통)
    try {
      const profile = ParkOnStorage.getUserProfile() || {};
      const nextNicknames = isRealUserName
        ? Array.from(new Set([effectiveName, ...(Array.isArray(profile.nicknames) ? profile.nicknames : [])]))
        : (profile.nicknames || []);
      ParkOnStorage.saveUserProfile({
        ...profile,
        userName: effectiveName,
        realName: effectiveName,
        phoneNumber: formattedPhone,
        activeNickname: effectiveName,
        nicknames: nextNicknames,
        nationalGrade: profile.nationalGrade && profile.nationalGrade !== '기록 준비중' ? profile.nationalGrade : '정회원',
        clubName: profile.clubName || '',
      });

      const guestUser: KakaoAuthUser = {
        id: 'user_' + (cleanDigits || Date.now()),
        nickname: effectiveName,
        realName: effectiveName,
        aliasName: effectiveName,
        preferredDisplay: 'REAL',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(guestUser);

      if (typeof window !== 'undefined') {
        localStorage.setItem('parkon_welcomed', 'true');
        localStorage.setItem('parkon_user_phone', formattedPhone);
        localStorage.setItem('parkon_player_name', effectiveName);
        localStorage.setItem('parkon_active_nickname', effectiveName);
        localStorage.setItem('parkon_nicknames', JSON.stringify(nextNicknames));
      }

      // 8자리 회원번호 즉석 발급 & 클라우드 백그라운드 동기화
      getOrGenerateMemberCode(true);
      syncMemberDataToCloud().catch(() => {});

      // 헤더 및 전역 로그인 상태 즉시 갱신 (iOS 분기 및 PWA 설치 프롬프트보다 먼저 실행!)
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    } catch (e) {
      console.error('Failed to save user profile in welcome modal:', e);
    }

    // 2. 브라우저 PWA 앱 설치 팝업 호출
    const ua = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : '';
    const isIos = /iphone|ipad|ipod/.test(ua) && !ua.includes('crios');

    if (isIos) {
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: effectiveName } }));
      if (onOpenInstallGuide) onOpenInstallGuide();
      return;
    }

    if (deferredPrompt && deferredPrompt.prompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          try {
            localStorage.setItem('parkon_app_installed', 'true');
          } catch {}
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.warn('Install prompt error', err);
      }
    }

    // 3. 모달 닫기 및 메인 화면 진입
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as any });
    }
    setIsOpen(false);

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    window.dispatchEvent(new CustomEvent('parkon_show_header_login_tip', { detail: { name: effectiveName } }));
  };

  const handleClose = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('parkon_welcomed', 'true');
    }
    setIsOpen(false);
  };

  useBackHandler(isOpen, handleClose);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-xs flex items-start justify-center p-2.5 sm:p-4 pt-2 sm:pt-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl animate-scaleUp overflow-hidden border-2 border-emerald-400 flex flex-col mb-8 mt-1 sm:mt-2">
        {/* 상단 헤더 바 */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-emerald-700 shrink-0 bg-gradient-to-r from-emerald-800 to-emerald-900 text-white">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-yellow-400 text-emerald-950 flex items-center justify-center font-black text-[11px] shadow-xs">
              ⛳
            </span>
            <span className="text-xs font-black tracking-tight text-white">
              {isJapanese ? 'PARKY APP (パークゴルフ)' : '파키 앱 (PARKY APP) - 스마트 파크골프'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm cursor-pointer transition active:scale-95"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 본문 콘텐츠 */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 overscroll-contain text-center">
          {/* 파키 마스코트 사진 */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-emerald-400/80 bg-stone-100 aspect-square max-w-[90px] sm:max-w-[100px] mx-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mascot/사진저장고_사진_20260913_28.jpg"
              alt="파키 앱 (PARKY APP) 공식 마스코트 파키 환영인사"
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950/85 via-emerald-950/40 to-transparent p-1 text-white">
              <span className="text-[9px] font-black bg-yellow-400 text-emerald-950 px-2 py-0.5 rounded-full shadow-xs inline-flex items-center gap-0.5 whitespace-nowrap">
                <Sparkles className="w-2.5 h-2.5 fill-emerald-950 shrink-0" />
                <span>{isJapanese ? '公式マスコット パキ' : '공식 마스코트 파키'}</span>
              </span>
            </div>
          </div>

          {/* 환영 인사 문구 */}
          <div>
            <h2 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
              {isJapanese ? (
                <>
                  ようこそ！ <span className="text-emerald-700">PARKY APP</span>へ！
                </>
              ) : (
                <>
                  반갑습니다! <span className="text-emerald-700">파키 앱 (PARKY APP)</span>에 오신 것을 환영합니다!
                </>
              )}
            </h2>
          </div>

          {/* 3대 안심 보증 배지 */}
          <div className="grid grid-cols-3 gap-1.5 py-0.5">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '100% 永久無料' : '100% 평생무료'}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '登録・パス不要' : '가입·비번 없음'}
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span className="text-[10px] font-black text-emerald-950 leading-tight">
                {isJapanese ? '1秒 即時スタート' : '1초 즉시 실행'}
              </span>
            </div>
          </div>

          {/* 1. 성명 + 휴대폰 번호 필수 입력 필드 */}
          <div className="bg-stone-50 border-2 border-emerald-200 rounded-2xl p-3 text-left space-y-2.5">
            <div className="space-y-1">
              <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>{isJapanese ? '🏌️ お名前 (またはニックネーム)' : '🏌️ 성명 (또는 닉네임)'}</span>
                <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.2 rounded">
                  {isJapanese ? '必須' : '필수 입력'}
                </span>
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                onChange={(e) => {
                  setNameInput(e.target.value);
                  if (validationError) setValidationError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInstallAndStart();
                }}
                placeholder={isJapanese ? 'お名前を入力してください (例: 山田)' : '성함(또는 닉네임)을 입력해 주세요 (예: 김대희)'}
                maxLength={12}
                className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl text-sm font-bold text-stone-900 focus:border-emerald-600 focus:bg-white outline-hidden transition placeholder:text-stone-400 shadow-inner ${
                  validationError && !nameInput.trim() ? 'border-rose-500 bg-rose-50/40' : 'border-stone-200'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-black text-stone-900 flex items-center justify-between">
                <span>{isJapanese ? '📱 携帯電話番号' : '📱 휴대폰 번호'}</span>
                <span className="text-[10px] text-amber-800 font-extrabold bg-amber-100 px-1.5 py-0.2 rounded">
                  {isJapanese ? '必須・記録保管' : '필수 · 기록 분실 방지'}
                </span>
              </label>
              <input
                ref={phoneInputRef}
                type="tel"
                inputMode="numeric"
                value={phoneInput}
                onChange={(e) => {
                  setPhoneInput(formatPhoneWithHyphen(e.target.value));
                  if (validationError) setValidationError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleInstallAndStart();
                }}
                placeholder="010-0000-0000"
                maxLength={13}
                className={`w-full px-3 py-2.5 bg-white border-2 rounded-xl font-mono text-sm font-black tracking-wider text-stone-900 focus:border-emerald-600 focus:bg-white outline-hidden transition placeholder:text-stone-400 shadow-inner ${
                  validationError && phoneInput.replace(/\D/g, '').length < 10 ? 'border-rose-500 bg-rose-50/40' : 'border-stone-200'
                }`}
              />
            </div>
          </div>

          {/* 2. [대표님 지침: 버튼 통합] 미입력 시 안내문구 + 대형 가입/시작 버튼 */}
          <div className="space-y-2 pt-0.5">
            {validationError && (
              <div
                data-testid="welcome-signup-error"
                role="alert"
                className="w-full py-2.5 px-3 bg-rose-50 border-2 border-rose-400 rounded-xl text-rose-700 font-black text-xs text-center shadow-xs animate-pulse"
              >
                {validationError}
              </div>
            )}
            <button
              type="button"
              onClick={handleInstallAndStart}
              className="w-full py-3.5 px-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 active:scale-98 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer border-2 border-emerald-300"
            >
              <Smartphone className="w-5 h-5 text-yellow-300 fill-yellow-300 shrink-0 animate-bounce" />
              <span className="truncate">
                {isJapanese
                  ? '📲 スマホにアプリ追加＆すぐスタート ⛳'
                  : '📲 스마트폰에 앱 설치하고 바로 시작하기'}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <p className="text-[11px] text-stone-500 font-bold">
              {isJapanese
                ? '※ タッチするとホーム画面にアプリが作成され、すぐ始まります。'
                : '※ 터치 시 바탕화면에 1초 앱이 생성되며 즉시 시작됩니다.'}
            </p>

            {/* 3. 기존 회원의 8자리 회원번호 로그인 안내 */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenKakaoLogin) onOpenKakaoLogin();
                }}
                className="text-[11px] text-emerald-800 hover:text-emerald-950 font-black underline underline-offset-2 cursor-pointer transition flex items-center justify-center gap-1 mx-auto"
              >
                <span>{isJapanese ? '📱 携帯番号で1秒簡単スタート・ログイン ▶' : '📱 8자리 고유번호 발급 및 1초 기록 찾기 ▶'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
