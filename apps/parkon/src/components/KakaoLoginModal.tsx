'use client';

import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Sparkles, LogOut, User, UserCheck, Edit3, Copy, Check, RefreshCw, KeyRound, Smartphone, Cloud, Search, HelpCircle, MessageSquare, Trash2, ChevronDown, ChevronUp, Plus, Rocket } from 'lucide-react';
import { KakaoAuthUser, ParkOnStorage } from '@/lib/storage';
import { loginWithKakao, logoutKakao } from '@/lib/kakaoAuth';
import { syncSelfPlayerNameToActiveRound } from '@/lib/playerUtils';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { getOrGenerateMemberCode, getSavedMemberCode, fetchAndRestoreMemberData, syncMemberDataToCloud, normalizeMemberCode, findMemberCodeByNameAndPhone, isPlaceholderName, isMockOrCorruptedRound, maskPhoneNumber, MEMBER_CODE_STORAGE_KEY } from '@/lib/memberCodeUtils';
import { BadgeStorage } from '@/lib/badgeStorage';
import { DEFAULT_USER_PROFILE } from '@/lib/storage';

interface KakaoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: KakaoAuthUser) => void;
  initialMode?: 'login' | 'profile' | 'find';
  title?: string;
  subtitle?: string;
  initialTab?: 'CODE_LOGIN' | 'NEW_USER';
  initialName?: string;
  isJoinFlow?: boolean;
}

export function KakaoLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  initialMode = 'login',
  title = '회원 로그인 및 활동명 설정',
  subtitle = '실명과 별명을 설정하고 파크골프 커뮤니티에 참여하세요.',
  initialTab,
  initialName,
  isJoinFlow = false,
}: KakaoLoginModalProps) {
  const { isJapanese, isEnglish } = useTranslation();
  const [currentUser, setCurrentUser] = useState<KakaoAuthUser | null>(null);
  const [memberCode, setMemberCode] = useState('');
  const [realName, setRealName] = useState('');
  const [aliasName, setAliasName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredDisplay, setPreferredDisplay] = useState<'REAL' | 'ALIAS'>('REAL');
  const [isLoading, setIsLoading] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // 8자리 회원번호 직접 입력/복원 관련 상태
  const [inputCode, setInputCode] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [showSwitchLogin, setShowSwitchLogin] = useState(false);
  const [activeTab, setActiveTab] = useState<'CODE_LOGIN' | 'NEW_USER'>('CODE_LOGIN');

  // 📱 휴대폰 번호 1초 조회 및 즉시 로그인 전용 상태
  const [inputPhone, setInputPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<{
    status: 'FOUND' | 'NOT_FOUND';
    matches?: { memberCode: string; userName: string; clubName?: string; roundCount?: number; medalCount?: number; phoneNumber?: string }[];
    searchedPhone?: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isRegisteringNew, setIsRegisteringNew] = useState(false);
  const [showDirectCodeInput, setShowDirectCodeInput] = useState(false);

  // 연대기 요약 및 멀티 닉네임 상태
  const [roundCount, setRoundCount] = useState(0);
  const [medalCount, setMedalCount] = useState(0);
  const [nicknames, setNicknames] = useState<string[]>([]);
  const [activeNickname, setActiveNicknameState] = useState('');
  const [newNicknameInput, setNewNicknameInput] = useState('');
  const [showAddNickname, setShowAddNickname] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

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
      setLookupResult(null);
      setLookupError('');

      // 연대기 요약 및 닉네임 목록 로딩
      const rounds = ParkOnStorage.getCompletedRounds().filter((r) => !r.isVirtual && !isMockOrCorruptedRound(r));
      setRoundCount(rounds.length);
      try {
        const b = BadgeStorage.getAllBadges();
        const earned = Object.values(b || {}).filter((x: any) => x && x.earnedAt).length;
        setMedalCount(earned);
      } catch {
        setMedalCount(0);
      }

      const nicks = ParkOnStorage.getNicknames();
      setNicknames(nicks);
      const curDisplay = ParkOnStorage.getUserDisplayName();
      setActiveNicknameState(curDisplay);

      // 모드 결정: initialMode가 'login'이거나 아직 미등록 기기이면 무조건 로그인 입력창으로 직행!
      if (initialMode === 'find' || initialMode === 'login' || !hasRegisteredUser) {
        setShowSwitchLogin(true);
        setShowFindModal(false);
        setActiveTab('CODE_LOGIN');
      } else {
        setShowSwitchLogin(false);
        setShowFindModal(false);
      }

      if (initialName && initialName.trim()) {
        setRealName(initialName.trim());
      } else if (u) {
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
  }, [isOpen, initialMode, initialName]);

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
    const backupText = `[파크골프 올인원 평생 고유회원번호]\n👤 회원 성명: ${displayName}\n🔑 고유번호: ${memberCode}\n\n💡 스마트폰을 교체하시거나 컴퓨터(PC)에서 로그인하실 때 이 번호 8자리만 입력하시면 비밀번호 없이 모든 경기 기록과 연대기가 1초 만에 그대로 복원됩니다!\nhttps://www.parkgolfallinone.com`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(backupText);
    }
    setSentToKakaoNotice(true);
    setTimeout(() => setSentToKakaoNotice(false), 4000);
  };

  // 3-2. 멀티 닉네임 전환 및 관리
  const handleSelectNickname = (nick: string) => {
    ParkOnStorage.setActiveNickname(nick);
    setActiveNicknameState(nick);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleAddNewNickname = () => {
    const clean = newNicknameInput.trim();
    if (!clean) return;
    const updated = ParkOnStorage.addNickname(clean);
    setNicknames(updated);
    setActiveNicknameState(clean);
    setNewNicknameInput('');
    setShowAddNickname(false);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  const handleRemoveNickname = (nick: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nicknames.length <= 1) return;
    const updated = ParkOnStorage.removeNickname(nick);
    setNicknames(updated);
    const next = ParkOnStorage.getUserDisplayName();
    setActiveNicknameState(next);
    setRealName(next);
  };

  // 📱 휴대폰 번호 자동 하이픈 포맷터 (010-XXXX-XXXX)
  const formatPhoneWithHyphen = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 11);
    if (raw.length <= 3) return raw;
    if (raw.length <= 7) return `${raw.slice(0, 3)}-${raw.slice(3)}`;
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7)}`;
  };

  // 📱 휴대폰 번호 1초 조회
  const handleLookupPhone = async () => {
    const cleanDigits = inputPhone.replace(/\D/g, '');
    if (cleanDigits.length < 4) {
      setLookupError(isJapanese ? '携帯番号を4桁以上入力してください。' : '휴대폰 번호를 4자리 이상 입력해 주세요.');
      return;
    }

    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);

    try {
      const res = await findMemberCodeByNameAndPhone(undefined, cleanDigits);
      setIsLookingUp(false);

      if (res.success && res.matches && res.matches.length > 0) {
        setLookupResult({
          status: 'FOUND',
          matches: res.matches,
          searchedPhone: inputPhone,
        });
      } else {
        setLookupResult({
          status: 'NOT_FOUND',
          searchedPhone: inputPhone,
        });
      }
    } catch (e: any) {
      setIsLookingUp(false);
      setLookupError(e?.message || (isJapanese ? '照会中にエラーが発生しました。' : '조회 중 오류가 발생했습니다.'));
    }
  };

  // 📱 미등록 번호: 새 평생 고유번호 즉시 발급받고 시작
  const handleRegisterNewWithPhone = async () => {
    setIsRegisteringNew(true);
    const cleanDigits = inputPhone.replace(/\D/g, '');
    const formattedPhone = formatPhoneWithHyphen(inputPhone);
    const effectiveName = (initialName && !isPlaceholderName(initialName)) ? initialName.trim() : (isJapanese ? 'パークゴルファー' : '파크골퍼');

    try {
      const profile = ParkOnStorage.getUserProfile() || {};
      ParkOnStorage.saveUserProfile({
        ...profile,
        userName: effectiveName,
        phoneNumber: formattedPhone,
        nationalGrade: profile.nationalGrade && profile.nationalGrade !== '기록 준비중' ? profile.nationalGrade : '정회원',
        clubName: profile.clubName || '',
      });

      const guestUser: KakaoAuthUser = {
        id: 'phone_' + (cleanDigits || Date.now()),
        nickname: effectiveName,
        realName: effectiveName,
        aliasName: effectiveName,
        preferredDisplay: 'REAL',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(guestUser);
      setCurrentUser(guestUser);

      if (typeof window !== 'undefined') {
        localStorage.setItem('parkon_user_phone', formattedPhone);
      }

      // 8자리 회원번호 즉석 신규 발급
      const newCode = getOrGenerateMemberCode(true);
      setMemberCode(newCode);

      // 클라우드 및 Supabase에 즉시 영구 백업
      await syncMemberDataToCloud();

      syncSelfPlayerNameToActiveRound(effectiveName);

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));

      if (onLoginSuccess) {
        onLoginSuccess(guestUser);
      }

      setIsRegisteringNew(false);
      onClose();
    } catch (e) {
      console.error('Failed to register new member with phone:', e);
      setIsRegisteringNew(false);
      onClose();
    }
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
      const rName = realName.trim() || (isJapanese ? 'プレイヤー' : '회원');
      const aName = aliasName.trim() || (isJapanese ? 'ゴルファー' : '골퍼');
      const effectiveName =
        (preferredDisplay === 'ALIAS' ? aName : rName) ||
        rName ||
        (isJapanese ? 'プレイヤー' : '회원');

      const profile = ParkOnStorage.getUserProfile();
      ParkOnStorage.saveUserProfile({
        ...profile,
        userName: effectiveName,
        phoneNumber: phoneNumber.trim(),
      });
      getOrGenerateMemberCode();

      const user = await loginWithKakao({
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
      });
      if (isJapanese) {
        user.provider = 'line';
      }
      setCurrentUser(user);
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

    let effectiveUser: KakaoAuthUser;
    if (currentUser) {
      effectiveUser = {
        ...currentUser,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        nickname: effectiveName,
        provider: isJapanese ? 'line' : (currentUser.provider || 'kakao'),
      };
      ParkOnStorage.setKakaoUser(effectiveUser);
      setCurrentUser(effectiveUser);
    } else {
      effectiveUser = {
        id: (isJapanese ? 'line_user_' : 'kakao_user_') + Date.now(),
        nickname: effectiveName,
        realName: rName,
        aliasName: aName,
        preferredDisplay: preferredDisplay,
        provider: isJapanese ? 'line' : 'kakao',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(effectiveUser);
      setCurrentUser(effectiveUser);
    }

    setIsSavedNotice(true);
    syncSelfPlayerNameToActiveRound(effectiveName);
    syncMemberDataToCloud().catch(() => {});

    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: effectiveName } }));

    if (onLoginSuccess) {
      onLoginSuccess(effectiveUser);
    }

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
      : '브라우저에 저장된 임시 프로필과 고유번호를 완전히 비우고 [깨끗한 제로 베이스(백지 상태)]로 리셋하시겠습니까?\n\n휴대폰의 8자리(또는 기존 7자리) 고유번호로 새로 로그인하실 수 있습니다.')) {
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
      alert(isJapanese ? 'ゼロベースに初期化されました。スマホの会員番号を入力してください。' : '✓ 제로 베이스로 깨끗하게 초기화되었습니다. 휴대폰의 8자리 고유번호를 입력해 주세요!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={isJapanese ? 'bg-[#06C755] p-3.5 sm:p-4 flex items-center justify-between text-white shadow-xs shrink-0' : 'bg-emerald-700 p-3.5 sm:p-4 flex items-center justify-between text-white shadow-xs shrink-0'}>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {hasRegisteredUser && !showSwitchLogin ? '👑' : '📱'}
            </span>
            <div>
              <h3 className="font-black text-sm sm:text-base leading-tight tracking-tight">
                {hasRegisteredUser && !showSwitchLogin
                  ? (isJapanese ? '会員情報 ＆ 高速同期' : '내 회원정보 & 1초 자동로그인')
                  : (isJapanese ? '📱 携帯番号で1秒記録検索' : '📱 휴대폰 번호로 1초 내 기록 찾기')}
              </h3>
              <p className="text-[10px] text-emerald-100 font-medium">
                {hasRegisteredUser && !showSwitchLogin
                  ? (isJapanese
                      ? 'パスワード不要・8桁番号でどこでもすぐ利用'
                      : '비밀번호 없이 8자리 고유번호로 어디서든 즉시 이용')
                  : (isJapanese
                      ? '電話番号だけでマイ8桁会員番号と年代記を呼び出します'
                      : '비밀번호 없이 휴대폰 번호 하나로 내 고유번호와 기록을 바로 찾습니다.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg cursor-pointer transition"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          {hasRegisteredUser && !showSwitchLogin ? (
            /* ================= [이미 로그인된 상태: 8자리 계정 + 멀티 닉네임 선택] ================= */
            <div className="space-y-3.5 text-xs">
              {/* 1. 내 계정 기본 정보 (안심 확인용) */}
              <div className="bg-gradient-to-br from-amber-50 via-amber-100/50 to-emerald-50 border-2 border-amber-300 rounded-2xl p-3.5 shadow-sm space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-amber-950 text-xs sm:text-sm">
                    <span className="text-base">👑</span>
                    <span>{isJapanese ? 'マイ公式アカウント情報' : isEnglish ? 'Official Account' : '내 계정 기본 정보'}</span>
                  </div>
                  <span className="text-[10px] bg-amber-400 text-amber-950 font-black px-2 py-0.5 rounded-full">
                    {isJapanese ? '永久安心保管' : isEnglish ? 'Permanent' : '안심 영구 보관'}
                  </span>
                </div>

                {/* 고유번호 8자리 표시 & 복사 */}
                <div className="flex items-center justify-between bg-white rounded-xl p-2.5 border border-amber-200 shadow-inner">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <div className="text-[9.5px] text-stone-500 font-bold leading-none mb-0.5">
                        {isJapanese ? '8桁会員番号 (パスワード不要)' : isEnglish ? '8-digit Member Code' : '8자리 평생 고유번호 (비밀번호 없음)'}
                      </div>
                      <span className="text-base sm:text-lg font-black text-stone-900 tracking-wider font-mono">
                        {memberCode || 'PKYA-7788'}
                      </span>
                    </div>
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
                    <span>{codeCopied ? (isJapanese ? 'コピー済' : '복사됨!') : (isJapanese ? '번호 복사' : '번호 복사')}</span>
                  </button>
                </div>

                {/* 연결된 휴대폰 & 나의 연대기 요약 한눈에 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* 연결된 휴대폰 */}
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                      <Smartphone className="w-3 h-3 text-amber-600" />
                      <span>{isJapanese ? '連携電話番号' : isEnglish ? 'Phone' : '연결된 휴대폰'}</span>
                    </div>
                    <div className="font-mono font-black text-[11px] sm:text-[12px] text-stone-800 mt-1 truncate">
                      {phoneNumber ? maskPhoneNumber(phoneNumber) : (prof?.phoneNumber ? maskPhoneNumber(prof.phoneNumber) : '010-****-5678')}
                    </div>
                  </div>

                  {/* 나의 연대기 요약 (완주 OO회 | 메달 OO개) */}
                  <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
                    <div className="text-[10px] text-stone-500 font-bold flex items-center gap-1">
                      <span className="text-xs">🏆</span>
                      <span>{isJapanese ? '年代記要約' : isEnglish ? 'Chronicle' : '나의 연대기 요약'}</span>
                    </div>
                    <div className="font-black text-[11px] sm:text-[12px] text-emerald-800 mt-1 truncate">
                      {isJapanese ? (
                        <>完走 <span className="text-amber-600 font-mono font-black">{roundCount}</span>回 | メダル <span className="text-amber-600 font-mono font-black">{medalCount}</span>個</>
                      ) : isEnglish ? (
                        <><span className="text-amber-600 font-mono font-black">{roundCount}</span> Rounds | <span className="text-amber-600 font-mono font-black">{medalCount}</span> Medals</>
                      ) : (
                        <>완주 <span className="text-amber-600 font-mono font-black">{roundCount}</span>회 | 메달 <span className="text-amber-600 font-mono font-black">{medalCount}</span>개</>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. "오늘 라운드에 사용할 이름 선택" (멀티 프로필) */}
              <div className="space-y-2 bg-gradient-to-br from-emerald-50/80 to-amber-50/80 p-3.5 rounded-2xl border-2 border-emerald-300/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-black text-emerald-950 text-xs sm:text-sm">
                    <span className="text-base">🏌️</span>
                    <span>{isJapanese ? '今日ラウンドで使用するお名前' : isEnglish ? 'Select Name for Today\'s Round' : '오늘 라운드에 사용할 이름 선택'}</span>
                  </div>
                  <span className="text-[10px] text-emerald-800 font-black bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {isJapanese ? '即時同期' : isEnglish ? 'Instant Sync' : '즉시 반영'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 font-medium">
                  {isJapanese
                    ? '希望のお名前をタップすると、スコアカードや仲間名簿に即時反映されます。'
                    : isEnglish
                    ? 'Tap a name below to immediately apply it to your scorecard and friend list.'
                    : '원하는 이름을 터치하시면 헤더, 스코어보드와 1촌 기록에 즉시 반영됩니다.'}
                </p>

                {/* 칩 / 라디오 리스트 */}
                <div className="space-y-1.5 pt-1">
                  {nicknames.map((nick) => {
                    const isSelected = activeNickname === nick;
                    const isReal = Boolean(
                      (currentUser?.realName && currentUser.realName === nick) ||
                      (realName && realName === nick) ||
                      nick.includes('김대희')
                    );
                    const label = isReal && !nick.includes('본명') ? `${nick} (본명)` : nick;

                    return (
                      <div
                        key={nick}
                        onClick={() => handleSelectNickname(nick)}
                        className={`flex items-center justify-between p-2.5 rounded-xl border-2 transition cursor-pointer active:scale-98 ${
                          isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                            : 'bg-white hover:bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base leading-none shrink-0">
                            {isSelected ? '🔘' : '⚪'}
                          </span>
                          <span className={`text-xs font-black tracking-tight truncate ${isSelected ? 'text-white' : 'text-stone-900'}`}>
                            {label}
                          </span>
                          {isSelected && (
                            <span className="text-[9.5px] bg-amber-400 text-emerald-950 font-black px-1.5 py-0.2 rounded-full shrink-0">
                              {isJapanese ? '適用中' : isEnglish ? 'Active' : '현재 적용 중'}
                            </span>
                          )}
                        </div>
                        {nicknames.length > 1 && !isReal && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveNickname(nick, e)}
                            className={`p-1 rounded-lg hover:bg-rose-100 hover:text-rose-700 transition cursor-pointer shrink-0 ${
                              isSelected ? 'text-emerald-200 hover:text-rose-200' : 'text-stone-400'
                            }`}
                            title="닉네임 삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* + 새 닉네임 추가하기 버튼 또는 인풋 */}
                  {!showAddNickname ? (
                    <button
                      type="button"
                      onClick={() => setShowAddNickname(true)}
                      className="w-full py-2.5 px-3 border-2 border-dashed border-emerald-400/80 hover:border-emerald-600 bg-white/70 hover:bg-white text-emerald-800 font-black text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isJapanese ? '+ 新しいニックネームを追加' : isEnglish ? '+ Add New Nickname' : '+ 새 닉네임 추가하기 (예: 나이스버디, 파크도사)'}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-white p-2 rounded-xl border-2 border-emerald-500 shadow-xs animate-fadeIn">
                      <input
                        type="text"
                        value={newNicknameInput}
                        onChange={(e) => setNewNicknameInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddNewNickname();
                        }}
                        placeholder="새 닉네임 입력 (예: 파크도사)"
                        className="flex-1 px-2.5 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs font-bold outline-none focus:border-emerald-600"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddNewNickname}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-lg transition active:scale-95 cursor-pointer shrink-0"
                      >
                        {isJapanese ? '追加' : isEnglish ? 'Add' : '추가'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddNickname(false);
                          setNewNicknameInput('');
                        }}
                        className="px-2 py-2 text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {isSavedNotice && (
                <div className="p-2.5 bg-emerald-100 text-emerald-800 font-black rounded-xl text-center text-xs animate-fadeIn border border-emerald-300">
                  ✓ {isJapanese ? '活動名が正常に変更されました！' : '프로필 활동명이 즉시 적용되었습니다!'}
                </div>
              )}

              {syncStatus && (
                <div className={`p-2.5 rounded-xl font-bold text-xs text-center animate-fadeIn ${
                  syncStatus.success ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {syncStatus.message}
                </div>
              )}

              {/* 보조 설정 (접이식): 성함/휴대폰 관리 및 클라우드 즉시 백업 */}
              <div className="bg-stone-50 rounded-2xl border border-stone-200 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full p-3 flex items-center justify-between font-black text-stone-700 hover:bg-stone-100 text-xs transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span>⚙️</span>
                    <span>{isJapanese ? '詳細情報設定 ＆ クラウド同期' : isEnglish ? 'Settings & Cloud Backup' : '연락처 수정 및 클라우드 백업'}</span>
                  </span>
                  {showAdvancedSettings ? <ChevronUp className="w-4 h-4 text-stone-400" /> : <ChevronDown className="w-4 h-4 text-stone-400" />}
                </button>

                {showAdvancedSettings && (
                  <div className="p-3 pt-0 space-y-2.5 border-t border-stone-200 animate-fadeIn">
                    <div className="space-y-1">
                      <label className="font-black text-stone-800 flex items-center justify-between">
                        <span>성함 (실제 이름)</span>
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

                    <button
                      type="button"
                      onClick={handleSaveProfile}
                      className="w-full py-2 bg-stone-800 hover:bg-stone-900 text-white font-black text-xs rounded-xl transition cursor-pointer"
                    >
                      연락처 / 실명 저장
                    </button>

                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        type="button"
                        disabled={isBackingUp}
                        onClick={handleManualBackup}
                        className="py-2 px-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>{isBackingUp ? '저장 중...' : '☁️ 지금 백업'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleSendToKakao}
                        className="py-2 px-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition active:scale-95 cursor-pointer border border-[#E6CF00]"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>📲 카톡에 번호 복사</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. 하단 액션: [ 다른 계정으로 전환 / 로그아웃 ] */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowSwitchLogin(true)}
                  className="flex-1 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-black text-xs rounded-xl flex items-center justify-center gap-1.5 border border-stone-300 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-stone-600" />
                  <span>{isJapanese ? '他の番号に切替' : isEnglish ? 'Switch Account' : '다른 번호로 계정 전환'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 font-black text-xs rounded-xl transition flex items-center gap-1 cursor-pointer border border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isJapanese ? 'ログアウト' : isEnglish ? 'Logout' : '로그아웃'}</span>
                </button>
              </div>

              {/* 제로 베이스 초기화 (손오공/더미 데이터 청소) */}
              <div className="pt-0.5 text-center">
                <button
                  type="button"
                  onClick={handleResetToZeroBase}
                  className="text-[10.5px] text-stone-400 hover:text-rose-600 font-bold underline transition cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>기기 데이터 초기화 (제로 베이스 백지 상태로 리셋)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= [📱 초극단 단순화: 휴대폰 번호 단일 1초 조회 및 즉시 로그인] ================= */
            <div className="space-y-3.5 text-xs text-stone-800">
              {/* 안내 문구 */}
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 text-center space-y-1">
                <div className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-900">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isJapanese ? 'お名前・パスワード不要！1秒照会' : '성함이나 비밀번호 없이 휴대폰 번호로 1초 조회!'}</span>
                </div>
                <p className="text-[10.5px] text-stone-600 font-bold leading-relaxed">
                  {isJapanese
                    ? '携帯番号を入力すると、マイ8桁会員番号とこれまでの全ラウンド記録を呼び出します。'
                    : '휴대폰 번호를 입력하시면 본인의 8자리 고유번호와 누적 완주·메달 기록을 즉시 불러옵니다.'}
                </p>
              </div>

              {/* 1. 단일 입력 필드 & 메인 액션 버튼 */}
              <div className="bg-white border-2 border-emerald-500 rounded-2xl p-3.5 shadow-sm space-y-3">
                <div className="space-y-1.5">
                  <label className="font-black text-stone-800 text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                      <span>{isJapanese ? '携帯電話番号' : '휴대폰 번호'}</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded">
                      {isJapanese ? '自動ハイフン' : '자동 하이픈'}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={inputPhone}
                      onChange={(e) => {
                        const formatted = formatPhoneWithHyphen(e.target.value);
                        setInputPhone(formatted);
                        setLookupResult(null);
                        setLookupError('');
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleLookupPhone();
                      }}
                      placeholder="010-0000-0000 (휴대폰 번호 입력)"
                      maxLength={13}
                      className="w-full px-4 py-3.5 bg-stone-50 border-2 border-stone-200 rounded-xl font-black text-base sm:text-lg tracking-wider font-mono outline-none text-stone-900 focus:border-emerald-600 focus:bg-white transition placeholder:text-stone-400 placeholder:text-xs placeholder:font-sans shadow-inner"
                      autoFocus
                    />
                    {inputPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setInputPhone('');
                          setLookupResult(null);
                          setLookupError('');
                        }}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 font-bold p-1 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* 메인 액션 버튼 */}
                <button
                  type="button"
                  disabled={isLookingUp || inputPhone.replace(/\D/g, '').length < 4}
                  onClick={handleLookupPhone}
                  className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-95 disabled:opacity-50 text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer border border-emerald-800"
                >
                  <Search className="w-4 h-4 text-amber-300" />
                  <span>
                    {isLookingUp
                      ? (isJapanese ? '記録照会中...' : '조회 중...')
                      : (isJapanese ? '🔍 会員番号確認 ＆ 記録呼出' : '🔍 내 고유번호 확인 & 기록 불러오기')}
                  </span>
                </button>
              </div>

              {/* 에러 문구 */}
              {lookupError && (
                <div className="p-3 bg-rose-100 text-rose-800 font-bold text-xs rounded-xl text-center animate-fadeIn border border-rose-200">
                  {lookupError}
                </div>
              )}

              {/* 2. 번호 조회 후 즉시 표출 결과창 (인라인 카드) */}
              {lookupResult?.status === 'FOUND' && lookupResult.matches && lookupResult.matches.length > 0 && (
                <div className="space-y-2.5 animate-scaleUp">
                  {lookupResult.matches.map((m, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-amber-50 border-2 border-emerald-500 rounded-2xl p-4 text-center shadow-lg space-y-2.5"
                    >
                      <div className="text-sm font-black text-stone-900 leading-snug">
                        <span className="text-emerald-800 text-base">{m.userName}</span> 님의 고유번호는
                      </div>
                      <div className="bg-white border-2 border-emerald-600 rounded-xl py-2 px-3 inline-block shadow-inner">
                        <span className="text-xl sm:text-2xl font-black font-mono tracking-wider text-emerald-950">
                          [ {m.memberCode} ]
                        </span>
                        <span className="text-xs font-bold text-stone-500 ml-1.5">입니다.</span>
                      </div>
                      <div className="text-xs font-bold text-stone-700 bg-white/80 py-1.5 px-3 rounded-xl border border-emerald-200 flex items-center justify-center gap-2">
                        <span>누적 완주: <strong className="text-emerald-900 font-black">{m.roundCount || 0}회</strong></span>
                        <span className="text-stone-300">|</span>
                        <span>메달: <strong className="text-amber-700 font-black">{m.medalCount || 0}개</strong></span>
                      </div>
                      <button
                        type="button"
                        disabled={isRestoring}
                        onClick={() => handleRestoreByMemberCodeWith(m.memberCode)}
                        className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-sm rounded-xl shadow-lg transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-emerald-700"
                      >
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>{isRestoring ? '기록 복원 및 로그인 중...' : '🚀 이 기록으로 바로 시작하기'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {lookupResult?.status === 'NOT_FOUND' && (
                <div className="bg-gradient-to-br from-amber-50 via-amber-100/60 to-emerald-50 border-2 border-amber-400 rounded-2xl p-4 text-center shadow-sm space-y-3 animate-scaleUp">
                  <div className="text-amber-950 font-bold text-xs sm:text-sm leading-relaxed">
                    등록된 기록이 없습니다.<br />
                    이 휴대폰 번호로 <strong className="text-amber-900 font-black underline underline-offset-2">새 평생 고유번호</strong>를 즉시 발급받으시겠습니까?
                  </div>
                  <button
                    type="button"
                    disabled={isRegisteringNew}
                    onClick={handleRegisterNewWithPhone}
                    className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-emerald-600 to-emerald-700 hover:from-amber-400 hover:to-emerald-600 text-white font-black text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-emerald-600"
                  >
                    <span className="text-base">⛳</span>
                    <span>{isRegisteringNew ? '발급 처리 중...' : '⛳ 새 고유번호 발급받고 시작'}</span>
                  </button>
                </div>
              )}

              {/* 8자리 고유번호 직접 입력 보조 토글 (선택 옵션) */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowDirectCodeInput(!showDirectCodeInput)}
                  className="text-[11px] text-stone-500 hover:text-emerald-800 font-bold underline underline-offset-2 cursor-pointer transition inline-flex items-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5 text-stone-400" />
                  <span>
                    {showDirectCodeInput
                      ? (isJapanese ? '📱 携帯番号入力に戻る' : '📱 휴대폰 번호 입력으로 돌아가기')
                      : (isJapanese ? '🔑 8桁の会員番号(PKYA-XXXX)を直接入力しますか？' : '🔑 혹시 8자리 고유번호(PKYA-XXXX)를 직접 입력하시겠습니까?')}
                  </span>
                </button>
              </div>

              {showDirectCodeInput && (
                <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRestoreByMemberCode();
                      }}
                      placeholder="예: PKYA-7788 또는 PKYB-1234"
                      className="flex-1 px-3 py-2 bg-white border border-stone-300 rounded-lg font-black text-xs uppercase font-mono outline-none focus:border-emerald-600"
                    />
                    <button
                      type="button"
                      disabled={isRestoring}
                      onClick={handleRestoreByMemberCode}
                      className="py-2 px-3 bg-stone-800 hover:bg-stone-900 text-white font-black text-xs rounded-lg transition cursor-pointer shrink-0"
                    >
                      {isRestoring ? '불러오는 중...' : '로그인'}
                    </button>
                  </div>
                </div>
              )}

              {syncStatus && (
                <div
                  className={`p-3 rounded-xl font-black text-xs leading-relaxed text-center animate-fadeIn ${
                    syncStatus.success
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}
                >
                  {syncStatus.message}
                </div>
              )}

              {/* 하단 보조 액션 */}
              {!isJoinFlow && (
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
                      <span>{isJapanese ? '端末データ初期化 (リセット)' : '기기 데이터 초기화 (백지 리셋)'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
