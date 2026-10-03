'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, LogOut, User, UserCheck, Edit3, Copy, Check, RefreshCw, KeyRound, Smartphone, Cloud, Search, HelpCircle, MessageSquare, Trash2 } from 'lucide-react';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { loginWithKakao, logoutKakao } from '@/lib/kakaoAuth';
import { syncSelfPlayerNameToActiveRound } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getOrGenerateMemberCode, getSavedMemberCode, fetchAndRestoreMemberData, syncMemberDataToCloud, normalizeMemberCode, findMemberCodeByNameAndPhone, isPlaceholderName, MEMBER_CODE_STORAGE_KEY } from '@/lib/memberCodeUtils';
import { DEFAULT_USER_PROFILE } from '@/lib/storage';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: KakaoAuthUser) => void;
  initialMode?: 'login' | 'profile' | 'find';
  title?: string;
  subtitle?: string;
}

export function KakaoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  title = '회원 로그인 및 활동명 설정',
  subtitle = '실명과 별명을 설정하고 파크골프 커뮤니티에 참여하세요.',
}: KakaoLoginModalProps) {
  const { isJapanese } = useTranslation();
  const [currentUser, setCurrentUser] = useState<KakaoAuthUser | null>(null);
  const [memberCode, setMemberCode] = useState('');
  const [realName, setRealName] = useState('');
  const [aliasName, setAliasName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredDisplay, setPreferredDisplay] = useState<'REAL' | 'ALIAS'>('REAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // 7자리 회원번호 로그인 관련 상태
  const [inputCode, setInputCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showSwitchLogin, setShowSwitchLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<'CODE_LOGIN' | 'NEW_USER'>('CODE_LOGIN');

  // 고유번호 분실 시 찾기 모달/상태
  const [showFindModal, setShowFindModal] = useState(false);
  const [findName, setFindName] = useState('');
  const [findPhone, setFindPhone] = useState('');
  const [isFinding, setIsFinding] = useState(false);
  const [foundMatches, setFoundMatches] = useState<any[] | null>(null);
  const [findError, setFindError] = useState('');
  const [sentToKakaoNotice, setSentToKakaoNotice] = useState(false);

  const savedCode = typeof window !== 'undefined' ? getSavedMemberCode() : '';
  const prof = typeof window !== 'undefined' ? ParkOnStorage.getUserProfile() : null;
  const hasValidProfileName = Boolean(prof?.userName && !isPlaceholderName(prof.userName));
  // 진짜 등록된 회원: 카카오 ID가 있거나, (유효한 실명 + 저장된 회원코드가 둘 다 존재할 때)
  const hasRegisteredUser = Boolean(currentUser?.id || (hasValidProfileName && savedCode));

  useEffect(() => {
    if (isOpen) {
      const u = ParkOnStorage.getKakaoUser();
      setCurrentUser(u);
      const code = getSavedMemberCode();
      setMemberCode(code);
      setSyncStatus(null);
      setFoundMatches(null);
      setFindError('');
      setSentToKakaoNotice(false);

      // 모드 결정: initialMode가 'login'이거나 아직 미등록 기기이면 무조건 로그인 입력창으로 직행!
      if (initialMode === 'find') {
        setShowFindModal(true);
        setShowSwitchLogin(true);
      } else if (initialMode === 'login' || !hasRegisteredUser) {
        setShowSwitchLogin(true);
        setShowFindModal(false);
        setActiveTab('CODE_LOGIN');
      } else {
        setShowSwitchLogin(false);
        setShowFindModal(false);
      }

      if (u) {
        const uReal = !isPlaceholderName(u.realName) ? u.realName! : (!isPlaceholderName(u.nickname) ? u.nickname : '');
        setRealName(uReal);
        setAliasName(u.aliasName || '');
        setPreferredDisplay(u.preferredDisplay || 'REAL');
      } else {
        const p = ParkOnStorage.getUserProfile();
        const existingName = p?.userName && !isPlaceholderName(p.userName) ? p.userName : '';
        setRealName(existingName);
        setAliasName('');
        setPhoneNumber(p?.phoneNumber || '');
        setPreferredDisplay('REAL');
      }
      setIsSavedNotice(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  // 1. 7자리 회원번호로 1초 만에 복원 & 자동 로그인
  const handleRestoreByMemberCodeWith = async (codeToRestore: string) => {
    if (!codeToRestore.trim()) {
      setSyncStatus({ success: false, message: '7자리 회원번호를 입력해 주세요.' });
      return;
    }

    setIsRestoring(true);
    setSyncStatus(null);

    const res = await fetchAndRestoreMemberData(codeToRestore.trim());
    setIsRestoring(false);

    if (res.success) {
      setSyncStatus({ success: true, message: res.message });
      const u = ParkOnStorage.getKakaoUser();
      setCurrentUser(u);
      setMemberCode(res.memberCode);
      if (res.userName) {
        setRealName(res.userName);
      }
      setShowSwitchLogin(false);
      setShowFindModal(false);

      if (onLoginSuccess && u) {
        onLoginSuccess(u);
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setSyncStatus({ success: false, message: res.message });
    }
  };

  const handleRestoreByMemberCode = () => {
    handleRestoreByMemberCodeWith(inputCode);
  };

  // 2. 현재 내 경기 기록 클라우드 백업
  const handleManualBackup = async () => {
    setIsBackingUp(true);
    const res = await syncMemberDataToCloud();
    setIsBackingUp(false);
    if (res.success) {
      setSyncStatus({ success: true, message: '✓ 현재 모든 경기 기록과 연대기가 클라우드에 안전하게 보관되었습니다!' });
    } else {
      setSyncStatus({ success: false, message: '백업 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
    }
    setTimeout(() => {
      setSyncStatus(null);
    }, 3000);
  };

  // 3. 회원번호 복사
  const handleCopyMemberCode = () => {
    if (!memberCode) return;
    try {
      navigator.clipboard.writeText(memberCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      alert(`내 고유 회원번호: ${memberCode}`);
    }
  };

  // 3-1. 폰 변경 대비: 내 카톡 / 클립보드로 번호 전송 보관
  const handleSendToKakao = () => {
    const displayName = realName || ParkOnStorage.getUserDisplayName();
    const backupText = `[파크골프 올인원 평생 고유회원번호]\n👤 회원 성명: ${displayName}\n🔑 고유번호: ${memberCode}\n\n💡 스마트폰을 교체하시거나 컴퓨터(PC)에서 로그인하실 때 이 번호 7자리만 입력하시면 비밀번호 없이 모든 경기 기록과 연대기가 1초 만에 그대로 복원됩니다!\nhttps://www.parkgolfallinone.com`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(backupText);
    }
    setSentToKakaoNotice(true);
    setTimeout(() => setSentToKakaoNotice(false), 4000);
  };

  // 3-2. 고유번호 분실 시: 성함 + 휴대폰 번호(뒤 4자리)로 번호 찾기
  const handleFindMemberCode = async () => {
    if (!findName.trim()) {
      setFindError('성함을 입력해 주세요.');
      return;
    }
    setIsFinding(true);
    setFindError('');
    setFoundMatches(null);

    const res = await findMemberCodeByNameAndPhone(findName.trim(), findPhone.trim());
    setIsFinding(false);

    if (res.success && res.matches && res.matches.length > 0) {
      setFoundMatches(res.matches);
    } else {
      setFindError(res.message || '일치하는 회원을 찾지 못했습니다.');
    }
  };

  // 4. 카카오 1초 로그인
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

      // 클라우드에 자동 백업
      syncMemberDataToCloud().catch(() => {});

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

  // 5. 프로필 저장 완료
  const handleSaveProfile = () => {
    const rName = realName.trim() || (isJapanese ? 'プレイヤー' : '회원');
    const aName = aliasName.trim() || (isJapanese ? 'ゴルファー' : '골퍼');
    const effectiveName = preferredDisplay === 'ALIAS' ? aName : rName;

    const profile = ParkOnStorage.getUserProfile();
    ParkOnStorage.saveUserProfile({
      ...profile,
      userName: effectiveName,
      phoneNumber: phoneNumber.trim(),
    });

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
    syncMemberDataToCloud().catch(() => {});

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));
    setTimeout(() => {
      setIsSavedNotice(false);
      onClose();
    }, 600);
  };

  // 6. 로그아웃
  const handleLogout = () => {
    if (window.confirm(isJapanese ? 'ログアウト(連携解除)しますか？' : '카카오 계정 연동을 해제(로그아웃)하시겠습니까?')) {
      logoutKakao();
      setCurrentUser(null);
      window.dispatchEvent(new Event('storage'));
      alert(isJapanese ? 'ログアウトしました。' : '로그아웃되었습니다.');
      onClose();
    }
  };

  // 7. 제로 베이스 초기화 (손오공/홍길동 등 임시 프로필 및 고유번호 완전 백지 리셋)
  const handleResetToZeroBase = () => {
    if (window.confirm(isJapanese
      ? '保存された一時プロフィールと会員番号を完全に消去し、ゼロベース（初期白紙状態）にリセットしますか？\n\nスマホの会員番号で新しくログインできます。'
      : '브라우저에 저장된 임시 프로필(손오공 등)과 고유번호를 완전히 비우고 [깨끗한 제로 베이스(백지 상태)]로 리셋하시겠습니까?\n\n휴대폰의 7자리 고유번호로 새로 로그인하실 수 있습니다.')) {
      try {
        localStorage.removeItem(MEMBER_CODE_STORAGE_KEY);
      } catch {}
      ParkOnStorage.saveUserProfile({
        ...DEFAULT_USER_PROFILE,
        userName: '',
        phoneNumber: '',
      });
      ParkOnStorage.setKakaoUser(null);
      logoutKakao();
      setCurrentUser(null);
      setMemberCode('');
      setRealName('');
      setPhoneNumber('');
      setAliasName('');
      setInputCode('');
      setShowSwitchLogin(true);
      setActiveTab('CODE_LOGIN');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('parkon_profile_updated'));
      alert(isJapanese ? 'ゼロベースに初期化されました。スマホの会員番号を入力してください。' : '✓ 제로 베이스로 깨끗하게 초기화되었습니다. 휴대폰의 7자리 고유번호를 입력해 주세요!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={isJapanese ? 'bg-[#06C755] p-3.5 sm:p-4 flex items-center justify-between text-white shadow-xs shrink-0' : 'bg-emerald-700 p-3.5 sm:p-4 flex items-center justify-between text-white shadow-xs shrink-0'}>
          <div className="flex items-center gap-2">
            <span className="text-xl">👑</span>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight tracking-tight">
                {hasRegisteredUser && !showSwitchLogin && !showFindModal
                  ? (isJapanese ? '会員情報 ＆ 高速同期' : '내 회원정보 & 1초 자동로그인')
                  : (isJapanese ? '会員ログイン ＆ クラウド同期' : '회원번호 1초 로그인 & 동기화')}
              </h3>
              <p className="text-[10px] text-emerald-100 font-medium">
                {isJapanese
                  ? 'パスワード不要・7桁番号でどこでもすぐ利用'
                  : '비밀번호 없이 7자리 번호로 어디서든 즉시 이용'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {showFindModal ? (
            /* ================= [🔍 고유번호 분실 시 1초 찾기 화면] ================= */
            <div className="space-y-3 bg-amber-50/90 p-4 rounded-2xl border-2 border-amber-300 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs sm:text-sm">
                  <Search className="w-4 h-4 text-amber-600" />
                  <span>{isJapanese ? '🔍 会員番号を1秒検索' : '🔍 내 고유번호 1초 찾기'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowFindModal(false);
                    setFoundMatches(null);
                    setFindError('');
                  }}
                  className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
                >
                  {isJapanese ? '✕ 閉じる' : '✕ 닫기'}
                </button>
              </div>

              <p className="text-[11px] text-stone-700 font-bold leading-relaxed bg-white/70 p-2 rounded-xl border border-amber-200">
                {isJapanese
                  ? '💡 スマホを機種変更してお忘れですか？ お名前と電話番号を入力するだけで、マイ会員番号をすぐにお探しします！'
                  : '💡 폰을 바꾸어 고유번호를 잊으셨나요? 성함과 휴대폰 번호만 입력하시면 나만의 평생 고유번호를 즉시 찾아드립니다!'}
              </p>

              <div className="space-y-2">
                <div>
                  <label className="font-black text-stone-800 text-[10.5px] block mb-0.5">
                    {isJapanese ? 'お名前 (本名) *' : '성함 (실제 이름) *'}
                  </label>
                  <input
                    type="text"
                    value={findName}
                    onChange={(e) => setFindName(e.target.value)}
                    placeholder={isJapanese ? '例: 佐藤' : '예: 김대희'}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="font-black text-stone-800 text-[10.5px] block mb-0.5">
                    {isJapanese ? '電話番号 (または下4桁)' : '휴대폰 번호 (또는 뒷 4자리)'}
                  </label>
                  <input
                    type="text"
                    value={findPhone}
                    onChange={(e) => setFindPhone(e.target.value)}
                    placeholder={isJapanese ? '例: 7788 または 090-1234-7788' : '예: 7788 또는 010-1234-7788'}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="button"
                  disabled={isFinding}
                  onClick={handleFindMemberCode}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-amber-950 font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>
                    {isFinding
                      ? (isJapanese ? '検索中...' : '조회 중...')
                      : (isJapanese ? '🔍 会員番号を検索する' : '🔍 내 회원번호 조회하기')}
                  </span>
                </button>
              </div>

              {findError && (
                <div className="p-2.5 bg-rose-100 text-rose-800 font-bold text-xs rounded-xl text-center">
                  {findError}
                </div>
              )}

              {foundMatches && foundMatches.length > 0 && (
                <div className="space-y-2 pt-1 border-t border-amber-200">
                  <p className="text-[11px] font-black text-emerald-800">
                    {isJapanese ? '🎉 見つかりました！以下の番号ですぐログイン:' : '🎉 찾았습니다! 아래 번호로 즉시 로그인하세요:'}
                  </p>
                  {foundMatches.map((m, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between gap-2">
                      <div>
                        <div className="font-black text-xs text-stone-900">{m.userName} {isJapanese ? '様' : '님'}</div>
                        <div className="text-[10px] text-stone-500">{m.clubName || (isJapanese ? 'クラブ' : '클럽')} · {isJapanese ? `ラウンド ${m.roundCount}回` : `경기 ${m.roundCount}회`}</div>
                        <div className="text-sm font-black text-amber-600 font-mono tracking-wider">{m.memberCode}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setInputCode(m.memberCode);
                          setShowFindModal(false);
                          handleRestoreByMemberCodeWith(m.memberCode);
                        }}
                        className="py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-xl shadow-xs transition active:scale-95 cursor-pointer shrink-0"
                      >
                        {isJapanese ? '🚀 即時ログイン' : '🚀 즉시 로그인'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : hasRegisteredUser && !showSwitchLogin ? (
            /* ================= [이미 로그인된 상태] ================= */
            <div className="space-y-3.5 text-xs">
              {/* 👑 VIP 황금빛 회원번호 카드 (대표님 지침: 비밀번호 없이 7자리로 PC 연동) */}
              <div className="bg-gradient-to-br from-amber-50 via-amber-100/60 to-emerald-50 border-2 border-amber-300 rounded-2xl p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs">
                    <span className="text-base">👑</span>
                    <span>나의 평생 고유번호 (비밀번호 없음)</span>
                  </div>
                  <span className="text-[9px] bg-amber-400/80 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    영구 보관
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-amber-200 shadow-inner">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-lg font-black text-stone-900 tracking-wider font-mono">
                      {memberCode || 'PKY-7788'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyMemberCode}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-black transition active:scale-95 cursor-pointer shadow-xs ${
                      codeCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-400 hover:bg-amber-300 text-stone-950'
                    }`}
                  >
                    {codeCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{codeCopied ? (isJapanese ? 'コピー済' : '복사됨!') : (isJapanese ? '番号コピー' : '번호 복사')}</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-700 font-bold leading-relaxed bg-white/70 p-2 rounded-xl border border-amber-100">
                  {isJapanese
                    ? '💡 パソコンや別のスマホでこの7桁の番号を入れるだけで、パスワード不要で過去の全スコアと年代記がそのまま復元されます！'
                    : '💡 PC(컴퓨터)나 다른 휴대폰에서 이 번호 7자리만 넣으시면, 비밀번호 없이 내 모든 경기 기록과 연대기가 1초 만에 그대로 복원됩니다!'}
                </p>

                {/* 📲 폰 변경 대비: 번호 전송 보관 */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={handleSendToKakao}
                    className="w-full py-2.5 px-3 bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-[#E6CF00]"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#191919]" />
                    <span>{isJapanese ? '📲 機種変更に備えて番号をコピーしてメモ' : '📲 폰 바꿀 때 대비: 내 카톡으로 번호 보내두기'}</span>
                  </button>
                  {sentToKakaoNotice && (
                    <div className="p-2 bg-amber-100 text-amber-950 font-bold text-[10.5px] rounded-xl text-center animate-fadeIn">
                      {isJapanese
                        ? '✓ 会員番号案内文が安全にコピーされました！メモ帳やLINEに貼り付けて保管してください。'
                        : '✓ 회원번호 안내문이 안전하게 복사되었습니다! 카톡 \'나와의 채팅\'에 붙여넣어 평생 보관하세요.'}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-0.5">
                  <button
                    type="button"
                    disabled={isBackingUp}
                    onClick={handleManualBackup}
                    className="flex-1 py-2 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>{isBackingUp ? (isJapanese ? '保存中...' : '클라우드 저장 중...') : (isJapanese ? '☁️ クラウドへバックアップ' : '☁️ 지금 클라우드 백업')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSwitchLogin(true)}
                    className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-[10.5px] rounded-xl flex items-center justify-center gap-1 border border-stone-200 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{isJapanese ? '別の番号でログイン' : '다른 번호로 로그인'}</span>
                  </button>
                </div>
              </div>

              {/* 내 현재 활동명 프로필 확인 */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                  {currentUser?.realName ? currentUser.realName.slice(0, 1) : (realName ? realName.slice(0, 1) : '골')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-stone-900 truncate">
                      {ParkOnStorage.getUserDisplayName()}
                    </span>
                    <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                      <CheckCircle className="w-2.5 h-2.5" /> {isJapanese ? '連携完了' : '연동 완료'}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500 font-medium mt-0.5">
                    {isJapanese ? '表示中の名前' : '현재 표시 활동명'}: {ParkOnStorage.getUserDisplayName()}
                  </div>
                </div>
              </div>

              {/* 실명 & 가명 & 연락처 수정 폼 */}
              <div className="space-y-2.5 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>성함 (실제 이름) *</span>
                    <span className="text-[10px] text-emerald-700 font-bold">공식 기록·대회용</span>
                  </label>
                  <input
                    type="text"
                    value={realName}
                    onChange={(e) => setRealName(e.target.value)}
                    placeholder="성함을 입력하세요 (예: 김대희)"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-stone-800 flex items-center justify-between">
                    <span>휴대폰 번호 (고유번호 분실 시 1초 조회용)</span>
                    <span className="text-[10px] text-amber-700 font-bold">안심 보관</span>
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="예: 010-1234-7788 또는 끝 4자리"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs focus:border-emerald-600 outline-none"
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
                    placeholder="예: 나이스샷, 홀인원"
                    className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs focus:border-purple-600 outline-none"
                  />
                </div>

                {/* 기본 활동명 라디오 선택 */}
                <div className="space-y-1 pt-0.5">
                  <span className="font-black text-stone-800 text-[10.5px]">기본 활동명 선택</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('REAL')}
                      className={`py-1.5 px-2 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'REAL'
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>실명 ({realName || '실명'})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredDisplay('ALIAS')}
                      className={`py-1.5 px-2 rounded-xl font-black text-xs border transition flex items-center justify-center gap-1 ${
                        preferredDisplay === 'ALIAS'
                          ? 'bg-purple-700 text-white border-purple-800 shadow-xs'
                          : 'bg-white text-stone-700 border-stone-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>가명 ({aliasName || '가명'})</span>
                    </button>
                  </div>
                </div>
              </div>

              {isSavedNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 font-black rounded-xl text-center text-xs animate-fadeIn">
                  ✓ 프로필 활동명이 성공적으로 저장되었습니다!
                </div>
              )}

              {syncStatus && (
                <div className={`p-2.5 rounded-xl font-bold text-xs text-center animate-fadeIn ${
                  syncStatus.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {syncStatus.message}
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
                  className="py-3 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-stone-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              </div>

              {/* 제로 베이스 초기화 (손오공/더미 데이터 청소) */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleResetToZeroBase}
                  className="text-[11px] text-stone-400 hover:text-rose-600 font-bold underline transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>기기 데이터 초기화 (제로 베이스 백지 상태로 리셋)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= [신규 / PC 최초 접속 / 번호 로그인 모드] ================= */
            <div className="space-y-3.5 text-xs text-stone-800">
              {/* 상단 탭 전환: [🔑 고유번호로 내 기록 불러오기] vs [✍️ 새로 성명 등록] */}
              <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('CODE_LOGIN')}
                  className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 ${
                    activeTab === 'CODE_LOGIN'
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isJapanese ? 'スマホの記録読込' : '내 폰 기록 불러오기'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('NEW_USER')}
                  className={`py-2 px-1 rounded-xl font-black text-xs transition flex items-center justify-center gap-1 ${
                    activeTab === 'NEW_USER'
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-300'
                      : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isJapanese ? '新規お名前登録' : '새 성명 입력하기'}</span>
                </button>
              </div>

              {activeTab === 'CODE_LOGIN' ? (
                /* --- TAB A: 7자리 고유번호로 비밀번호 없이 자동 로그인 --- */
                <div className="space-y-3 bg-gradient-to-br from-amber-50/70 to-emerald-50/70 p-3.5 rounded-2xl border-2 border-emerald-300/80">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-black text-emerald-950 text-xs">
                      <KeyRound className="w-4 h-4 text-emerald-700" />
                      <span>{isJapanese ? '7桁会員番号で1秒自動ログイン' : '회원번호 7자리로 1초 자동 로그인'}</span>
                    </div>
                    <p className="text-[11px] text-stone-600 font-bold leading-relaxed">
                      {isJapanese
                        ? 'スマートフォンで確認した7桁の会員番号を入力すると、パスワード不要でスマホのすべてのスコア記録と年代記がPCにそのまま復元されます！'
                        : '스마트폰에서 확인하신 7자리 고유번호를 입력하시면, 비밀번호 없이 휴대폰의 모든 경기 기록과 연대기가 PC로 그대로 복원됩니다!'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-black text-stone-800 text-[11px] flex items-center justify-between">
                      <span>{isJapanese ? '7桁会員番号を入力' : '7자리 고유번호 입력'}</span>
                      <span className="text-[10px] text-emerald-700 font-bold">{isJapanese ? 'パスワード不要' : '비밀번호 불필요'}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => {
                          const val = e.target.value
                            .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
                            .replace(/　/g, ' ');
                          setInputCode(val.toUpperCase());
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRestoreByMemberCode();
                        }}
                        placeholder={isJapanese ? '例: PKY-7788 または ABC1234' : '예: PKY-7788 또는 ABC1234'}
                        className="w-full px-3.5 py-3 bg-white border-2 border-emerald-500 rounded-xl font-black text-sm tracking-wider font-mono outline-none text-stone-900 placeholder:text-stone-400 uppercase"
                      />
                      {inputCode && (
                        <button
                          type="button"
                          onClick={() => setInputCode('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* ❓ 고유번호를 잊으셨나요? 바로 찾기 버튼 */}
                    <div className="flex items-center justify-end pt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowFindModal(true)}
                        className="text-[11px] text-emerald-800 hover:text-emerald-950 font-black underline underline-offset-2 flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isJapanese ? '会員番号をお忘れですか？ (お名前/電話番号で検索)' : '고유번호를 잊으셨나요? (성함/전화번호로 찾기)'}</span>
                      </button>
                    </div>
                  </div>

                  {syncStatus && (
                    <div className={`p-3 rounded-xl font-black text-xs leading-relaxed text-center animate-fadeIn ${
                      syncStatus.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                    }`}>
                      {syncStatus.message}
                    </div>
                  )}

                  <button
                    type="button"
                    disabled={isRestoring}
                    onClick={handleRestoreByMemberCode}
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-800 disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>
                      {isRestoring
                        ? (isJapanese ? '記録読込中...' : '내 기록 불러오는 중...')
                        : (isJapanese ? '🚀 記録を呼び出す (パスワード不要で即時ログイン)' : '🚀 내 기록 불러오기 (비밀번호 없이 즉시 로그인)')}
                    </span>
                  </button>

                  <div className="bg-white/80 p-2.5 rounded-xl border border-stone-200 text-[10.5px] text-stone-600 space-y-1">
                    <p className="font-extrabold text-stone-800">
                      {isJapanese ? '💡 会員番号はどこで確認できますか？' : '💡 내 고유번호는 어디서 확인하나요?'}
                    </p>
                    <p>
                      {isJapanese
                        ? 'スマホ画面上部のお名前の下、または【私の年代記】画面に記載された【👑 会員番号: PKY-XXXX】をご確認の上、ここに入力してください。'
                        : '스마트폰 화면 상단 내 이름 밑 또는 [나의 연대기] 화면에 적힌 \'👑 고유번호: PKY-XXXX\'를 확인하시고 여기에 입력하시면 됩니다.'}
                    </p>
                  </div>
                </div>
              ) : (
                /* --- TAB B: 신규 성명 입력 & 카카오 간편 연동 --- */
                <div className="space-y-3">
                  <div className="text-center space-y-1">
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-900 rounded-full text-[10px] font-extrabold">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>{isJapanese ? 'パスワード不要・お名前入力だけで完了！' : '비밀번호 없이 성명만 입력하면 끝!'}</span>
                    </div>
                    <h4 className="font-black text-stone-900 text-xs sm:text-sm">
                      {isJapanese
                        ? 'お名前を入力すると、マイ7桁の会員番号が自動発行されます。'
                        : '성함을 입력하시면 나만의 7자리 평생 고유번호가 자동 발급됩니다.'}
                    </h4>
                  </div>

                  <div className="space-y-2 bg-stone-50 p-3 rounded-2xl border border-stone-200">
                    <div className="space-y-1">
                      <label className="font-black text-stone-800 flex items-center justify-between">
                        <span>{isJapanese ? 'お名前 (本名) *' : '성함 (실제 이름) *'}</span>
                        <span className="text-[10px] text-emerald-700 font-bold">{isJapanese ? '公式大会用' : '공식 대회 출전용'}</span>
                      </label>
                      <input
                        type="text"
                        value={realName}
                        onChange={(e) => setRealName(e.target.value)}
                        placeholder={isJapanese ? 'お名前を入力 (例: 佐藤 健一)' : '성함을 입력하세요 (예: 김대희)'}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-stone-800 flex items-center justify-between">
                        <span>{isJapanese ? '電話番号 (番号紛失時の照会用)' : '휴대폰 번호 (고유번호 분실 시 1초 조회용)'}</span>
                        <span className="text-[10px] text-amber-700 font-bold">{isJapanese ? '安全保管' : '안심 보관'}</span>
                      </label>
                      <input
                        type="text"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={isJapanese ? '例: 090-1234-7788 または下4桁' : '예: 010-1234-7788 또는 끝 4자리'}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-black text-stone-800 flex items-center justify-between">
                        <span>{isJapanese ? 'ニックネーム (呼称)' : '가명 / 닉네임 (별명)'}</span>
                        <span className="text-[10px] text-purple-700 font-bold">{isJapanese ? '親善・フレンド用' : '친선 번개용'}</span>
                      </label>
                      <input
                        type="text"
                        value={aliasName}
                        onChange={(e) => setAliasName(e.target.value)}
                        placeholder={isJapanese ? '例: ナイスショット, 名人' : '예: 나이스샷, 홀인원'}
                        className="w-full px-3 py-2 bg-white border border-stone-300 rounded-xl font-bold text-xs outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="w-full mt-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {isJapanese ? '✓ このお名前ですぐ始める' : '✓ 이 성명으로 즉시 시작하기'}
                    </button>
                  </div>

                  {/* 카카오톡/LINE 1초 간편 연동 */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleLogin}
                      className={
                        isJapanese
                          ? 'w-full py-3 px-3 bg-[#06C755] hover:bg-[#05b34c] active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#05a044]'
                          : 'w-full py-3 px-3 bg-[#FEE500] hover:bg-[#FDD835] active:scale-95 text-[#191919] font-black text-xs sm:text-sm rounded-xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer border border-[#E6CF00]'
                      }
                    >
                      <span className="text-base leading-none">💬</span>
                      <span>
                        {isLoading
                          ? (isJapanese ? '自動連携中...' : '자동 가입 처리 중...')
                          : (isJapanese ? '💬 LINE連携で1秒簡単ログイン' : '💬 카카오톡 [확인] 누르고 1초 자동 가입')}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* 둘러보기 & 가상 연습 라운딩 */}
              <div className="pt-2 border-t border-stone-200/80 space-y-1.5">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-2 bg-stone-100 hover:bg-stone-200 active:scale-95 text-stone-700 font-black text-[11px] rounded-xl transition flex items-center justify-center gap-1 border border-stone-300 cursor-pointer"
                  >
                    <span>{isJapanese ? '👉 登録なしで見学' : '👉 가입 없이 둘러보기'}</span>
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
                    <span>{isJapanese ? '🎯 練習ラウンド体験' : '🎯 프로그램 체험 연습'}</span>
                  </button>
                </div>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={handleResetToZeroBase}
                    className="text-[10.5px] text-stone-400 hover:text-rose-600 font-bold underline transition cursor-pointer inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{isJapanese ? '端末データ初期化 (ゲスト情報削除 / リセット)' : '기기 데이터 초기화 (손오공 등 임시정보 삭제 / 백지 리셋)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
