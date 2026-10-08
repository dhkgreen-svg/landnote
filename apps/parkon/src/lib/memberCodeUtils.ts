'use client';

import { ParkOnStorage, KakaoAuthUser, UserGolfProfile } from './storage';
import { CompanionStorage, Companionship } from './companionStorage';
import { BadgeStorage } from './badgeStorage';
import { RoundSession } from '@/types/parkon';

export const MEMBER_CODE_STORAGE_KEY = 'parkon_member_code_v1';

/**
 * 8자리 고유 회원번호 규격:
 * 기본 표준: 영문 4자리 + 숫자 4자리 (예: PKYA-7788, PKYB-1234)
 * 하위 호환: 기존 7자리(PKY-XXXX)는 'A'를 자동 부여하여 PKYA-XXXX로 100% 자동 승격 (데이터 유실 0%)
 */
export function normalizeMemberCode(input: string): string {
  if (!input) return '';
  // 일본어 모바일 자판 등 전각 문자(全角: ＰＫＹ-７７８８ 등)를 반각 영숫자로 자동 변환
  const half = input
    .trim()
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ');
  let clean = half.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // 1. 하위 호환 마이그레이션: 기존 7자리(영문 3자리 + 숫자 4자리, 예: PKY7788)는 'A'를 붙여 8자리로 자동 승격
  if (clean.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(clean)) {
    clean = `${clean.slice(0, 3)}A${clean.slice(3)}`;
  }

  // 2. 표준 8자리 포맷: 4자리 영문 + 4자리 숫자 (예: PKYA-7788, PKYB-1234)
  if (clean.length === 8 && /^[A-Z]{4}[0-9]{4}$/.test(clean)) {
    const prefix = clean.slice(0, 4);
    const suffix = clean.slice(4);
    return `${prefix}-${suffix}`;
  }

  return clean;
}

/**
 * 8자리 고유번호에서 구 7자리 코드 추출 (클라우드/DB 하위 호환 듀얼 조회용)
 */
export function getLegacyMemberCode(code: string): string {
  if (!code) return '';
  const clean = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 8 && clean.startsWith('PKYA')) {
    return `PKY-${clean.slice(4)}`;
  }
  if (clean.length === 8 && /^[A-Z]{3}A[0-9]{4}$/.test(clean)) {
    return `${clean.slice(0, 3)}-${clean.slice(4)}`;
  }
  return code;
}

/**
 * 휴대폰 번호 마스킹 포맷터 (010-****-5678)
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  }
  if (clean.length === 4) {
    return `010-****-${clean}`;
  }
  return phone;
}

export function isPlaceholderName(name?: string | null): boolean {
  if (!name) return true;
  const clean = name.trim();
  return (
    !clean ||
    clean === '홍길동' ||
    clean === '홍길동(본인)' ||
    clean === '손오공' ||
    clean === '플레이어' ||
    clean === '조장(본인)' ||
    clean === '조장' ||
    clean === '본인' ||
    clean === '회원' ||
    clean === '파크골퍼' ||
    clean === 'パークゴルファー' ||
    clean === '山田太郎' ||
    clean === 'ゲスト'
  );
}

export const SAFETY_STASH_STORAGE_KEY = 'parkon_completed_rounds_safety_stash_v1';

/**
 * 테스트용 가짜 데이터(수성 54타 샘플 등) 및 손상된 라운드 필터링
 */
export function isMockOrCorruptedRound(r: any): boolean {
  if (!r) return true;
  if (r.id === 'round_rec_1' || r.id === 'round_suseong_sample') return true;
  if (
    r.courseName === '수성파크골프장' &&
    r.players?.some((p: any) => (p.name === '김대희' || p.name?.includes('홍길동')) && p.totalStrokes === 54 && r.completedAt === '2026-10-02T10:00:00.000Z')
  ) {
    return true;
  }
  return false;
}

export function getSavedMemberCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    const rawName = ParkOnStorage.getUserDisplayName();
    const isMasterDaehee = rawName?.includes('김대희');
    const existing = localStorage.getItem(MEMBER_CODE_STORAGE_KEY);

    if (existing && existing.trim()) {
      const norm = normalizeMemberCode(existing.trim());
      // 7자리에서 8자리로 자동 승격되었거나 포맷이 바뀌었으면 로컬스토리지 즉시 동기화
      if (norm && norm !== existing) {
        localStorage.setItem(MEMBER_CODE_STORAGE_KEY, norm);
      }
      // 만약 기존 코드가 PKYA-7788 또는 PKY-7788인데 이름이 김대희가 아닌 경우(예: '1', '홍길동'), 과거 로컬 기본값 버그이므로 자동 재발급
      if ((norm === 'PKYA-7788' || norm === 'PKY-7788') && !isMasterDaehee && rawName && !isPlaceholderName(rawName)) {
        return getOrGenerateMemberCode(true);
      }
      return norm;
    }

    if (rawName && !isPlaceholderName(rawName)) {
      return getOrGenerateMemberCode(true);
    }
  } catch {}
  return '';
}

/**
 * 현재 기기의 8자리 고유 회원번호 조회 및 자동 발급
 * 등록된 회원(실명 입력자, 카카오 연동자, 번호 로그인자)만 발급받으며,
 * 신규 회원은 PKYB-XXXX, PKYC-XXXX 등 8자리 체계로 무한 자동 생성됩니다.
 */
export function getOrGenerateMemberCode(forceGenerate = false): string {
  if (typeof window === 'undefined') return '';

  try {
    const kakaoUser = ParkOnStorage.getKakaoUser();
    const profile = ParkOnStorage.getUserProfile();
    const rawName = ParkOnStorage.getUserDisplayName();
    const cleanName = (rawName || profile?.userName || kakaoUser?.realName || '').trim();
    const isMasterDaehee = cleanName.includes('김대희');

    const existing = localStorage.getItem(MEMBER_CODE_STORAGE_KEY);
    if (existing && existing.trim()) {
      const norm = normalizeMemberCode(existing.trim());
      // 7자리에서 8자리로 자동 승격
      if (norm && norm !== existing) {
        localStorage.setItem(MEMBER_CODE_STORAGE_KEY, norm);
      }
      if ((norm === 'PKYA-7788' || norm === 'PKY-7788') && !isMasterDaehee && cleanName) {
        // Fall through to regenerate proper code for this user!
      } else {
        return norm;
      }
    }

    const isRegistered = Boolean(
      kakaoUser?.id ||
      (cleanName && !isPlaceholderName(cleanName))
    );

    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 아직 등록되지 않은 신규 기기이고 강제 생성이 아니면 번호를 임의로 부여하지 않고 빈 문자열 반환
    if (!isRegistered && !forceGenerate && !isLocalHost) {
      return '';
    }

    let prefix = 'PKYB';
    let codeSuffix = '';

    if (isMasterDaehee) {
      prefix = 'PKYA';
      codeSuffix = '7788'; // 김대희 대표님 전용 8자리 골드 넘버 (PKYA-7788)
    } else if (cleanName && !isPlaceholderName(cleanName)) {
      const prefixes = ['PKYB', 'PKYC', 'PKYD', 'PKYE', 'PKYF', 'PKYG', 'PKYH'];
      if (/^\d+$/.test(cleanName)) {
        const numVal = parseInt(cleanName, 10);
        prefix = prefixes[numVal % prefixes.length];
        if (numVal >= 1 && numVal <= 999) {
          codeSuffix = String(1000 + numVal);
        } else {
          codeSuffix = String(numVal).slice(-4).padStart(4, '0');
        }
      } else {
        let hash = 0;
        for (let i = 0; i < cleanName.length; i++) {
          hash = ((hash << 5) - hash) + cleanName.charCodeAt(i);
          hash |= 0;
        }
        const pIdx = Math.abs(hash) % prefixes.length;
        prefix = prefixes[pIdx];
        const num = 1000 + (Math.abs(hash) % 8900);
        codeSuffix = String(num);
      }
    } else if (kakaoUser?.id) {
      const prefixes = ['PKYB', 'PKYC', 'PKYD', 'PKYE'];
      const numStr = kakaoUser.id.replace(/\D/g, '');
      const hash = Math.abs(kakaoUser.id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0));
      prefix = prefixes[hash % prefixes.length];
      if (numStr.length >= 4) {
        codeSuffix = numStr.slice(-4);
      } else {
        codeSuffix = String(1000 + (hash % 9000));
      }
    } else {
      const prefixes = ['PKYB', 'PKYC', 'PKYD', 'PKYE', 'PKYF'];
      prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      codeSuffix = String(Math.floor(1000 + Math.random() * 9000));
    }

    const newCode = `${prefix}-${codeSuffix}`;
    localStorage.setItem(MEMBER_CODE_STORAGE_KEY, newCode);

    // 자동 발급 즉시 클라우드에 1차 동기화 시도 (백그라운드)
    setTimeout(() => {
      syncMemberDataToCloud().catch(() => {});
    }, 500);

    return newCode;
  } catch (e) {
    console.error('Failed to get or generate member code:', e);
    return '';
  }
}

// 재귀 동기화 및 브라우저 메모리 폭주 원천 방지 락(Lock)
let isSyncingMemberData = false;
let isRestoringMemberData = false;
let lastSyncTimestamp = 0;

/**
 * 현재 기기의 모든 경기 기록, 연대기, 프로필, 1촌 명부를 클라우드에 자동 백업
 */
export async function syncMemberDataToCloud(): Promise<{ success: boolean; memberCode: string; message?: string }> {
  if (typeof window === 'undefined') return { success: false, memberCode: '' };

  // 1. 이미 동기화 중이거나 최근 3초 이내에 동기화가 수행된 경우 중복 호출 차단
  const now = Date.now();
  if (isSyncingMemberData || now - lastSyncTimestamp < 3000) {
    return { success: true, memberCode: getSavedMemberCode(), message: '최신 동기화 유지 중' };
  }

  isSyncingMemberData = true;
  lastSyncTimestamp = now;

  try {
    const memberCode = getOrGenerateMemberCode();
    const userName = ParkOnStorage.getUserDisplayName();
    const profile = ParkOnStorage.getUserProfile();
    const kakaoUser = ParkOnStorage.getKakaoUser();
    const completedRounds = ParkOnStorage.getCompletedRounds().filter((r) => !r.isVirtual && !isMockOrCorruptedRound(r));
    const companions = CompanionStorage.getCompanions();
    const badges = BadgeStorage.getAllBadges();
    const tour = BadgeStorage.getNationalTourRecords();

    const customCourses = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('parkon_custom_courses_v1') || '[]') : [];
    const crowdSpecs = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('parkon_crowd_hole_specs_v1') || '{}') : {};

    const payload = {
      memberCode,
      userName,
      profile,
      kakaoUser,
      completedRounds,
      companions,
      badges,
      tour,
      customCourses,
      crowdSpecs,
      updatedAt: new Date().toISOString(),
    };

    const res = await fetch('/api/sync/member', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return { success: false, memberCode, message: '서버 백업 응답 오류' };
    }

    const json = await res.json();
    return { success: true, memberCode, message: json.message || '백업 성공' };
  } catch (err: any) {
    console.warn('Cloud sync error (fallback to local):', err?.message || err);
    return { success: false, memberCode: getOrGenerateMemberCode(), message: err?.message };
  } finally {
    isSyncingMemberData = false;
  }
}

/**
 * 회원번호 8자리(또는 기존 7자리)로 클라우드에서 모든 경기 기록, 연대기, 프로필을 가져와 자동 로그인
 */
export async function fetchAndRestoreMemberData(inputCode: string): Promise<{
  success: boolean;
  memberCode: string;
  userName?: string;
  roundCount?: number;
  message: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, memberCode: inputCode, message: '브라우저 환경이 아닙니다.' };
  }

  // 중복 복원 작업 락
  if (isRestoringMemberData) {
    return { success: false, memberCode: inputCode, message: '이미 복원 작업이 진행 중입니다.' };
  }
  isRestoringMemberData = true;

  const cleanCode = normalizeMemberCode(inputCode);
  if (!cleanCode || cleanCode.replace('-', '').length < 6) {
    isRestoringMemberData = false;
    return { success: false, memberCode: inputCode, message: '올바른 8자리 고유 회원번호를 입력해 주세요. (예: PKYA-7788)' };
  }

  try {
    // 0. 스마트폰/로컬 기기의 기존 실전 기록 영구 안전 백업 (Safety Stash)
    // 연동 과정에서 발생할 수 있는 데이터 유실을 100% 원천 차단
    try {
      const rawCurrent = localStorage.getItem('parkon_completed_rounds_v1');
      if (rawCurrent && rawCurrent.length > 5) {
        const parsedCurrent = JSON.parse(rawCurrent);
        if (Array.isArray(parsedCurrent)) {
          const validCurrent = parsedCurrent.filter((r) => !isMockOrCorruptedRound(r));
          if (validCurrent.length > 0) {
            localStorage.setItem(SAFETY_STASH_STORAGE_KEY, JSON.stringify(validCurrent));
          }
        }
      }
    } catch {}

    const res = await fetch(`/api/sync/member?code=${encodeURIComponent(cleanCode)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return {
          success: false,
          memberCode: cleanCode,
          message: `해당 회원번호(${cleanCode})로 저장된 기록을 찾을 수 없습니다. 번호를 다시 확인해 주세요.`,
        };
      }
      return { success: false, memberCode: cleanCode, message: '서버와 통신 중 문제가 발생했습니다.' };
    }

    const result = await res.json();
    if (!result.success || !result.data) {
      return {
        success: false,
        memberCode: cleanCode,
        message: result.message || '회원 정보를 불러오지 못했습니다.',
      };
    }

    const { memberCode, userName, profile, kakaoUser, completedRounds, companions, badges, tour, customCourses, crowdSpecs } = result.data;

    // 1. 고유 회원번호 저장
    localStorage.setItem(MEMBER_CODE_STORAGE_KEY, memberCode);

    // 2. 프로필 복원 (skipSync=true로 클라우드 재귀 트리거 차단)
    if (profile) {
      ParkOnStorage.saveUserProfile(profile, true);
    } else if (userName) {
      ParkOnStorage.saveUserProfile({
        userName,
        nationalGrade: '공인 싱글 1급',
        clubName: '구미 파크골프 클럽',
      }, true);
    }

    // 3. 카카오/LINE 유저 복원
    if (kakaoUser) {
      ParkOnStorage.setKakaoUser(kakaoUser);
    } else if (userName) {
      // 회원번호 기반 자동 로그인 가상 유저
      const autoUser: KakaoAuthUser = {
        id: `member_${memberCode.replace(/[^A-Z0-9]/g, '')}`,
        nickname: userName,
        realName: userName,
        preferredDisplay: 'REAL',
        connectedAt: new Date().toISOString(),
      };
      ParkOnStorage.setKakaoUser(autoUser);
    }

    // 4. 완주 경기 기록(라운딩 전적) 무손실 병합 복원 (Safety Stash + Local + Cloud 완벽 합집합)
    const localRounds = ParkOnStorage.getCompletedRounds().filter((r) => !isMockOrCorruptedRound(r));
    let stashRounds: RoundSession[] = [];
    try {
      const rawStash = localStorage.getItem(SAFETY_STASH_STORAGE_KEY);
      if (rawStash) {
        const parsedStash = JSON.parse(rawStash);
        if (Array.isArray(parsedStash)) {
          stashRounds = parsedStash.filter((r) => !isMockOrCorruptedRound(r));
        }
      }
    } catch {}

    const roundMap = new Map<string, RoundSession>();
    const deletedIds = new Set(ParkOnStorage.getDeletedRoundIds());

    // 1) 클라우드 전적 등록 (가짜/목업 및 대표님이 삭제한 기록 영구 필터링)
    if (Array.isArray(completedRounds)) {
      completedRounds.forEach((r: RoundSession) => {
        if (!isMockOrCorruptedRound(r) && r?.id && !deletedIds.has(r.id)) {
          const key = r.id || `${r.courseName}_${r.completedAt}`;
          roundMap.set(key, r);
        }
      });
    }
    // 2) 로컬 전적 등록 (클라우드에 아직 안 올라간 게스트 라운드 보존 및 로컬 사진 무손실 보존)
    localRounds.forEach((r) => {
      if (r?.id && !deletedIds.has(r.id)) {
        const key = r.id || `${r.courseName}_${r.completedAt}`;
        if (!roundMap.has(key)) {
          roundMap.set(key, r);
        } else {
          // 로컬 기기에 저장된 현장 기념사진이 있으면 클라우드 복원본에 무손실 병합
          const existing = roundMap.get(key)!;
          if (r.photos && r.photos.length > 0) {
            existing.photos = Array.from(new Set([...(existing.photos || []), ...r.photos]));
          }
        }
      }
    });
    // 3) 안전 보관함 전적 등록 (연동 직전 스마트폰에서 쳤던 기록 및 사진 원천 복구)
    stashRounds.forEach((r) => {
      if (r?.id && !deletedIds.has(r.id)) {
        const key = r.id || `${r.courseName}_${r.completedAt}`;
        if (!roundMap.has(key)) {
          roundMap.set(key, r);
        } else {
          const existing = roundMap.get(key)!;
          if (r.photos && r.photos.length > 0) {
            existing.photos = Array.from(new Set([...(existing.photos || []), ...r.photos]));
          }
        }
      }
    });

    const mergedRounds = Array.from(roundMap.values()).sort((a, b) => {
      const tA = new Date(a.completedAt || 0).getTime();
      const tB = new Date(b.completedAt || 0).getTime();
      return tB - tA;
    });

    // skipSync = true: 복원된 기록을 다시 클라우드로 즉시 업로드하는 무한 루프 원천 방지
    ParkOnStorage.saveCompletedRounds(mergedRounds, true);
    const restoredRoundsCount = mergedRounds.length;

    // 5. 1촌 동반자 명부 복원
    if (Array.isArray(companions) && companions.length > 0) {
      localStorage.setItem('parkon_companions_v1', JSON.stringify(companions));
    }

    // 6. 훈장 및 전국 투어 기록 복원
    if (badges) {
      localStorage.setItem('parkon_course_badges_v1', JSON.stringify(badges));
    }
    if (tour) {
      localStorage.setItem('parkon_national_tour_v1', JSON.stringify(tour));
    }

    // 7. 현장 실측 수정 구장 제원 및 빅데이터 홀 스펙 복원
    if (Array.isArray(customCourses) && customCourses.length > 0) {
      localStorage.setItem('parkon_custom_courses_v1', JSON.stringify(customCourses));
    }
    if (crowdSpecs && typeof crowdSpecs === 'object' && Object.keys(crowdSpecs).length > 0) {
      localStorage.setItem('parkon_crowd_hole_specs_v1', JSON.stringify(crowdSpecs));
    }

    // 8. 전용 커스텀 이벤트만 안전하게 발송 (브라우저 가짜 storage 이벤트 중복 트리거 차단)
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: userName } }));
    window.dispatchEvent(new CustomEvent('parkon_companion_updated'));
    window.dispatchEvent(new CustomEvent('parkon_member_synced', { detail: { memberCode, userName } }));

    return {
      success: true,
      memberCode,
      userName: userName || '골퍼',
      roundCount: restoredRoundsCount,
      message: `🎉 '${userName || '회원'}' 님 환영합니다! 총 ${restoredRoundsCount}회의 경기 기록과 연대기가 성공적으로 복원되었습니다.`,
    };
  } catch (e: any) {
    console.error('Failed to restore member data:', e);
    return {
      success: false,
      memberCode: cleanCode,
      message: `복원 중 오류가 발생했습니다: ${e?.message || e}`,
    };
  } finally {
    isRestoringMemberData = false;
  }
}

/**
 * 7자리 고유번호 분실 시: 성함 + 휴대폰 번호(또는 끝 4자리)로 번호 1초 조회
 */
export async function findMemberCodeByNameAndPhone(
  name: string,
  phone?: string
): Promise<{
  success: boolean;
  matches?: { memberCode: string; userName: string; clubName?: string; roundCount?: number }[];
  message: string;
}> {
  if (!name || !name.trim()) {
    return { success: false, message: '성함을 입력해 주세요.' };
  }

  try {
    const params = new URLSearchParams({
      find: 'true',
      name: name.trim(),
    });
    if (phone && phone.trim()) {
      params.append('phone', phone.trim());
    }

    const res = await fetch(`/api/sync/member?${params.toString()}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || '일치하는 회원 정보를 찾지 못했습니다.',
      };
    }

    return {
      success: true,
      matches: data.matches || [],
      message: '회원번호 조회가 완료되었습니다.',
    };
  } catch (e: any) {
    return {
      success: false,
      message: `조회 중 오류가 발생했습니다: ${e?.message || e}`,
    };
  }
}

