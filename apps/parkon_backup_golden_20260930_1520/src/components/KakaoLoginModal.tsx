'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, LogOut, User, UserCheck, Edit3 } from 'lucide-react';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { loginWithKakao, logoutKakao } from '@/lib/kakaoAuth';
import { syncSelfPlayerNameToActiveRound } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

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
  const { isJapanese } = useTranslation();
  const [currentUser, setCurrentUser] = useState<KakaoAuthUser | null>(null);
  const [realName, setRealName] = useState('');
  const [aliasName, setAliasName] = useState('');
  const [preferredDisplay, setPreferredDisplay] = useState<'REAL' | 'ALIAS'>('REAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const u = ParkOnStorage.getKakaoUser();
      setCurrentUser(u);
      const isPlaceholder = (val?: string | null) => {
        if (!val) return true;
        const c = val.trim();
        return c === '홍길동' || c === '홍길동(본인)' || c === '플레이어' || c === '조장(본인)' || c === '본인' || c === '회원';
      };

      if (u) {
        const uReal = !isPlaceholder(u.realName) ? u.realName! : (!isPlaceholder(u.nickname) ? u.nickname : '');
        setRealName(uReal);
        setAliasName(u.aliasName || '');
        setPreferredDisplay(u.preferredDisplay || 'REAL');
      } else {
        const prof = ParkOnStorage.getUserProfile();
        const existingName = prof?.userName && !isPlaceholder(prof.userName) ? prof.userName : '';
        setRealName(existingName);
        setAliasName('');
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
        realName: realName.trim() || (isJapanese ? 'プレイヤー' : '회원'),
        aliasName: aliasName.trim() || (isJapanese ? 'ゴルファー' : '골퍼'),
        preferredDisplay: preferredDisplay,
      });
      if (isJapanese) {
        user.provider = 'line';
      }
      setCurrentUser(user);
      const effectiveName =
        (preferredDisplay === 'ALIAS' ? aliasName.trim() : realName.trim()) ||
        realName.trim() ||
        aliasName.trim() ||
        (isJapanese ? 'プレイヤー' : '회원');
      syncSelfPlayerNameToActiveRound(effectiveName);
      const vId = typeof window !== 'undefined' ? (localStorage.getItem('parkon_visitor_uuid_v1') || undefined) : undefined;
      fetch('/api/admin/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vId,
          path: typeof window !== 'undefined' ? window.location.pathname : '/',
          userName: effectiveName,
          isKakaoUser: !isJapanese,
          isLineUser: isJapanese,
          kakaoId: String(user.id || ''),
        }),
      }).catch(() => {});
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
      alert(isJapanese ? 'LINEログイン中に問題が発生しました。もう一度お試しください。' : '카카오 로그인 중 문제가 발생했습니다. 다시 시도해 주세요.');
    }
  };

  const handleSaveProfile = () => {
    const rName = realName.trim() || (isJapanese ? 'プレイヤー' : '회원');
    const aName = aliasName.trim() || (isJapanese ? 'ゴルファー' : '골퍼');
    const effectiveName = preferredDisplay === 'ALIAS' ? aName : rName;

    if (currentUser) {
      const updated: KakaoAuthUser = {
        ...currentUser,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        nickname: effectiveName,
        provider: isJapanese ? 'line' : (currentUser.provider || 'kakao'),
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
        id: (isJapanese ? 'line_user_' : 'kakao_user_') + Date.now(),
        nickname: effectiveName,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        provider: isJapanese ? 'line' : 'kakao',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(localUser);
      setCurrentUser(localUser);
    }

    setIsSavedNotice(true);
    syncSelfPlayerNameToActiveRound(effectiveName);
    const vIdSave = typeof window !== 'undefined' ? (localStorage.getItem('parkon_visitor_uuid_v1') || undefined) : undefined;
    fetch('/api/admin/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId: vIdSave,
        path: typeof window !== 'undefined' ? window.location.pathname : '/',
        userName: effectiveName,
        isKakaoUser: !isJapanese,
        isLineUser: isJapanese,
        kakaoId: currentUser?.id ? String(currentUser.id) : undefined,
      }),
    }).catch(() => {});
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    if (window.confirm(isJapanese ? 'ログアウト(連携解除)しますか？' : '카카오 계정 연동을 해제(로그아웃)하시겠습니까?')) {
      logoutKakao();
      setCurrentUser(null);
      window.dispatchEvent(new Event('storage'));
      alert(isJapanese ? 'ログアウトしました。' : '로그아웃되었습니다.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header: Kakao Yellow (KR) vs LINE Green (JP) */}
        <div className={isJapanese ? 'bg-[#06C755] p-4 flex items-center justify-between text-white shadow-xs' : 'bg-[#FEE500] p-4 flex items-center justify-between text-[#191919] shadow-xs'}>
          <div className="flex items-center gap-2">
            <span className="text-xl">💬</span>
            <h3 className="font-black text-base leading-none tracking-tight">
              {currentUser
                ? (isJapanese ? '会員情報・表示名設定' : '내 회원 정보 및 활동명 설정')
                : (isJapanese ? '会員ログイン・LINE連携' : title)}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={isJapanese ? 'text-white/80 hover:text-white p-1 rounded-lg cursor-pointer' : 'text-[#191919]/70 hover:text-[#191919] p-1 rounded-lg cursor-pointer'}
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
                <div className={isJapanese ? 'w-11 h-11 rounded-full bg-[#06C755] text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs' : 'w-11 h-11 rounded-full bg-[#FEE500] text-[#191919] flex items-center justify-center font-black text-base shrink-0 shadow-xs'}>
                  {currentUser.realName ? currentUser.realName.slice(0, 1) : (isJapanese ? '田' : '김')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 truncate">
                      {ParkOnStorage.getUserDisplayName()}
                    </span>
                    <span className={isJapanese ? 'text-[10px] bg-[#06C755] text-white font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5' : 'text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5'}>
                      <CheckCircle className="w-2.5 h-2.5" /> {isJapanese ? 'LINE連携済み' : '연동됨'}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {isJapanese ? `表示名: ${ParkOnStorage.getUserDisplayName()}` : `현재 표시 활동명: ${ParkOnStorage.getUserDisplayName()}`}
                  </div>
                </div>
              </div>

              {/* 실명 & 가명 입력 폼 */}
              <div className="space-y-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>{isJapanese ? 'お名前 (本名) *' : '성함 (실제 이름) *'}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {isJapanese ? '公式記録・大会用' : '공식 기록·대회용'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder={isJapanese ? 'お名前を入力してください (例: 田中太郎)' : '성함을 입력하세요 (예: 김대희)'}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>{isJapanese ? 'ニックネーム (別名)' : '가명 / 닉네임 (별명)'}</span>
                    <span className="text-[10px] text-purple-700 font-bold">
                      {isJapanese ? '親善ラウンド用' : '친선·오픈 번개용'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder={isJapanese ? '例: ナイスショット、ホールインワン' : '예: 나이스샷, 홀인원'}
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                {/* 기본 활동명 라디오 선택 */}
                <div className="space-y-1.5 pt-1">
                  <span className="font-black text-stone-800 text-[11px]">
                    {isJapanese ? '基本表示名の選択' : '기본 활동명 선택'}
                  </span>
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
                      <span>{isJapanese ? `本名 (${realName || '本名'})` : `실명 (${realName || '실명'})`}</span>
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
                      <span>{isJapanese ? `ニックネーム (${aliasName || '別名'})` : `가명 (${aliasName || '가명'})`}</span>
                    </button>
                  </div>
                </div>
              </div>

              {isSavedNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 font-black rounded-xl text-center text-xs animate-fadeIn">
                  {isJapanese
                    ? '✓ プロフィールの活動名が正常に保存されました！'
                    : '✓ 프로필 활동명이 성공적으로 저장되었습니다!'}
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow transition cursor-pointer"
                >
                  {isJapanese ? '設定を保存する' : '프로필 저장 완료'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-3 px-3.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-stone-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isJapanese ? 'ログアウト' : '로그아웃'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* 최초 가입 및 로그인 - 실명/가명 입력 후 1초 로그인 */
            <div className="space-y-3.5 text-xs text-stone-800">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>
                    {isJapanese
                      ? 'パスワード不要！ワンクリックで完了'
                      : '비밀번호 없이 카카오톡 [확인]만 누르면 끝!'}
                  </span>
                </div>
                <h4 className="font-black text-stone-900 text-sm">
                  {isJapanese
                    ? 'お名前を入力して、かんたん1秒連携スタート！'
                    : '카카오톡 창이 뜨면 [확인]만 누르시면 1초 만에 자동 가입 완료!'}
                </h4>
                <p className="text-[11px] text-emerald-800 font-bold bg-emerald-50 py-1 px-2 rounded-xl border border-emerald-200">
                  {isJapanese ? '✓ 複雑なパスワード登録は一切不要です。' : '✓ 복잡한 비밀번호 입력이 전혀 없습니다.'}
                </p>
              </div>

              <div className="space-y-2.5 bg-stone-50 p-3.5 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>{isJapanese ? 'お名前 (本名) *' : '성함 (실제 이름) *'}</span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      {isJapanese ? '公式記録・大会用' : '공식 대회 출전용'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder={isJapanese ? 'お名前を入力してください (例: 田中太郎)' : '성함을 입력하세요 (예: 김대희)'}
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>{isJapanese ? 'ニックネーム (別名)' : '가명 / 닉네임 (별명)'}</span>
                    <span className="text-[10px] text-purple-700 font-bold">
                      {isJapanese ? '親善ラウンド用' : '친선 번개용'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={aliasName}
                    onChange={(e) => setAliasName(e.target.value)}
                    placeholder={isJapanese ? '例: ナイスショット、ホールインワン' : '예: 나이스샷, 홀인원'}
                    className="w-full px-3 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs"
                  />
                </div>

                {/* 활동명 모드 선택 */}
                <div className="space-y-1 pt-1">
                  <span className="font-black text-stone-800 text-[11px]">
                    {isJapanese ? '基本表示名の選択' : '기본 활동명 방식'}
                  </span>
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
                      <span>{isJapanese ? `本名 (${realName || '本名'})` : `실명 (${realName || '실명'})`}</span>
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
                      <span>{isJapanese ? `ニックネーム (${aliasName || '別名'})` : `별명 (${aliasName || '별명'})`}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 시그니처 1초 버튼: 한국(Kakao #FEE500) vs 일본(LINE #06C755) */}
              <div className="pt-1">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleLogin}
                  className={
                    isJapanese
                      ? 'w-full py-3.5 px-4 bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-[#05a044]'
                      : 'w-full py-3.5 px-4 bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-[#E6CF00]'
                  }
                >
                  <span className="text-lg leading-none">💬</span>
                  <span>
                    {isLoading
                      ? (isJapanese ? '登録処理中...' : '자동 가입 처리 중...')
                      : (isJapanese ? '💬 LINE [許可] を押して1秒自動連携' : '💬 카카오톡 [확인] 누르고 1초 자동 가입')}
                  </span>
                </button>
                <p className="text-[10.5px] text-stone-500 font-medium text-center mt-1.5">
                  {isJapanese
                    ? '* 一度登録すると、次回からはアプリを開くだけで自動的にログインされます。'
                    : '* 한 번만 [확인] 누르시면 다음부터는 들어오기만 해도 바로 내 것으로 자동 로그인됩니다.'}
                </p>
              </div>

              {/* 게스트 1초 둘러보기 & 가상 라운딩 바로가기 (가입 장벽 제로) */}
              <div className="pt-2 border-t border-stone-200/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                    }}
                    className="py-2.5 px-2 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-black text-[11px] rounded-xl transition flex items-center justify-center gap-1 border border-stone-300 cursor-pointer"
                  >
                    <span>{isJapanese ? '👉 登録なしで利用' : '👉 가입 없이 둘러보기'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const virtualSession = ParkOnStorage.createVirtualRoundSession();
                      onClose();
                      window.location.href = `/round/${virtualSession.id}`;
                    }}
                    className="py-2.5 px-2 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 active:scale-95 text-white font-black text-[11px] rounded-xl transition flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                  >
                    <span>{isJapanese ? '🎯 体験・練習ラウンド' : '🎯 프로그램 체험 연습'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-stone-500 font-medium text-center">
                  {isJapanese
                    ? '※ 登録なしでもすべての機能を自由にご利用いただけます。'
                    : '※ 둘러보기 및 프로그램 체험 연습은 로그인 없이 모든 기능을 자유롭게 이용하실 수 있습니다.'}
                </div>
              </div>

              <div className="text-[10px] text-stone-500 font-medium text-center leading-relaxed">
                {isJapanese
                  ? '※ 登録後、クラブやサークルごとに異なる表示名をいつでも変更できます。'
                  : '※ 가입 후 각 클럽별로 서로 다른 활동명을 언제든지 변경 지정할 수 있습니다.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
