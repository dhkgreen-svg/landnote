'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, LogOut, User, UserCheck, Edit3 } from 'lucide-react';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { loginWithKakao, logoutKakao } from '@/lib/kakaoAuth';
import { syncSelfPlayerNameToActiveRound } from '@/lib/playerUtils';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: KakaoAuthUser) => void;
  title?: string;
  subtitle?: string;
}

export function KakaoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  title = '회원 로그인 및 활동명 설정',
  subtitle = '실명과 별명을 설정하고 파크골프 커뮤니티에 참여하세요.',
}: KakaoLoginModalProps) {
  const [currentUser, setCurrentUser] = useState<KakaoAuthUser | null>(null);
  const [realName, setRealName] = useState('김대희');
  const [aliasName, setAliasName] = useState('나이스버디');
  const [preferredDisplay, setPreferredDisplay] = useState<'REAL' | 'ALIAS'>('REAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const u = ParkOnStorage.getKakaoUser();
      setCurrentUser(u);
      if (u) {
        setRealName(u.realName || u.nickname || '김대희');
        setAliasName(u.aliasName || '나이스버디');
        setPreferredDisplay(u.preferredDisplay || 'REAL');
      } else {
        setRealName('김대희');
        setAliasName('나이스버디');
        setPreferredDisplay('REAL');
      }
      setIsSavedNotice(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      const user = await loginWithKakao({
        realName: realName.trim() || '김대희',
        aliasName: aliasName.trim() || '나이스버디',
        preferredDisplay: preferredDisplay,
      });
      setCurrentUser(user);
      const effectiveName =
        (preferredDisplay === 'ALIAS' ? aliasName.trim() : realName.trim()) ||
        realName.trim() ||
        aliasName.trim() ||
        '김대희';
      syncSelfPlayerNameToActiveRound(effectiveName);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
      setIsLoading(false);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
      onClose();
    } catch (e) {
      console.error(e);
      setIsLoading(false);
      alert('카카오 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleSaveProfile = () => {
    const rName = realName.trim() || '김대희';
    const aName = aliasName.trim() || '나이스버디';
    const effectiveName = preferredDisplay === 'ALIAS' ? aName : rName;

    if (currentUser) {
      const updated: KakaoAuthUser = {
        ...currentUser,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        nickname: effectiveName,
      };
      ParkOnStorage.setKakaoUser(updated);
      setCurrentUser(updated);
    } else {
      const profile = ParkOnStorage.getUserProfile();
      ParkOnStorage.saveUserProfile({
        ...profile,
        userName: effectiveName,
      });
      const localUser: KakaoAuthUser = {
        id: 'kakao_user_' + Date.now(),
        nickname: effectiveName,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(localUser);
      setCurrentUser(localUser);
    }

    setIsSavedNotice(true);
    syncSelfPlayerNameToActiveRound(effectiveName);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    if (window.confirm('카카오 계정 연동을 해제(로그아웃)하시겠습니까?')) {
      logoutKakao();
      setCurrentUser(null);
      window.dispatchEvent(new Event('storage'));
      alert('로그아웃되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
        {/* Kakao Yellow Header */}
        <div className="bg-[#FEE500] p-4 flex items-center justify-between text-[#191919]">
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h3 className="font-black text-base leading-none tracking-tight">
              {currentUser ? '내 회원 정보 및 활동명 설정' : title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#191919]/70 hover:text-[#191919] p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {currentUser ? (
            /* 이미 로그인된 상태 - 실명 / 가명 / 활동명 수정 */
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#FEE500] text-[#191919] flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {currentUser.realName ? currentUser.realName.slice(0, 1) : '김'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 truncate">
                      {ParkOnStorage.getUserDisplayName()}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> 연동됨
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                    현재 표시 활동명: {ParkOnStorage.getUserDisplayName()}
                  </div>
                </div>
              </div>

              {/* 실명 & 가명 입력 폼 */}
              <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>실명 (실제 성함) *</span>
                    <span className="text-[10px] text-emerald-700 font-bold">공식 대회·월례회용</span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="예: 김대희, 홍길동"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>가명 / 닉네임 (별명)</span>
                    <span className="text-[10px] text-purple-700 font-bold">친선·오픈 번개용</span>
                  </label>
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder="예: 나이스버디, 파크달인"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                {/* 기본 활동명 라디오 선택 */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-black text-stone-800 text-[11px]">기본 활동명 선택</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('REAL')}
                      className={`py-2 px-2 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'REAL'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>실명 ({realName || '김대희'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('ALIAS')}
                      className={`py-2 px-2 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'ALIAS'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>가명 ({aliasName || '나이스버디'})</span>
                    </button>
                  </div>
                </div>
              </div>

              {isSavedNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 font-black rounded-xl text-center text-xs animate-fadeIn">
                  ✓ 프로필 활동명이 성공적으로 저장되었습니다!
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                >
                  프로필 저장 완료
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-stone-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>
            </div>
          ) : (
            /* 최초 가입 및 로그인 - 실명/가명 입력 후 1초 로그인 */
            <div className="space-y-3.5 text-xs text-stone-800">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>카카오톡 1초 가입 및 회원 등록</span>
                </div>
                <h4 className="font-black text-stone-900 text-sm">
                  어떤 이름으로 활동하시겠습니까?
                </h4>
                <p className="text-[11px] text-stone-500 font-medium">
                  실명과 별명을 모두 등록하고 상황에 따라 선택할 수 있습니다.
                </p>
              </div>

              <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>실명 (실제 성함) *</span>
                    <span className="text-[10px] text-emerald-700 font-bold">공식 대회 출전용</span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="예: 김대희"
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>가명 / 닉네임 (별명)</span>
                    <span className="text-[10px] text-purple-700 font-bold">친선 번개용</span>
                  </label>
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder="예: 나이스버디"
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                {/* 활동명 모드 선택 */}
                <div className="space-y-1 pt-1">
                  <span className="font-black text-stone-800 text-[11px]">기본 활동명 방식</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('REAL')}
                      className={`py-2 px-1.5 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'REAL'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>실명 ({realName || '김대희'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('ALIAS')}
                      className={`py-2 px-1.5 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'ALIAS'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>가명 ({aliasName || '나이스버디'})</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 카카오 시그니처 1초 버튼 */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleLogin}
                  className="w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-[#E6CF00]"
                >
                  <span className="text-lg leading-none">💬</span>
                  <span>
                    {isLoading
                      ? '로그인 처리 중...'
                      : `${preferredDisplay === 'ALIAS' ? aliasName : realName}(으)로 1초 시작하기`}
                  </span>
                </button>
              </div>

              <div className="text-[10px] text-stone-500 font-medium text-center leading-relaxed">
                ※ 가입 후 각 클럽별로 서로 다른 활동명을 언제든지 변경 지정할 수 있습니다.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
