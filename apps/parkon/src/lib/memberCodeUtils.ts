'use client';

import { ParkOnStorage, KakaoAuthUser, UserGolfProfile } from './storage';
import { CompanionStorage, Companionship } from './companionStorage';
import { BadgeStorage } from './badgeStorage';
import { RoundSession } from '@/types/parkon';

export const MEMBER_CODE_STORAGE_KEY = 'parkon_member_code_v1';

/**
 * 7자리 고유 회원번호 규격:
 * 기본: PKY-XXXX (예: PKY-7788)
 * 사용자 지정 가능: 영문 3자리 + 숫자 4자리 (예: ABC1234)
 */
export function normalizeMemberCode(input: string): string {
  if (!input) return '';
  // 일본어 모바일 자판 등 전각 문자(全角: ＰＫＹ-７７８８ 등)를 반각 영숫자로 자동 변환
  const half = input
    .trim()
    .replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0))
    .replace(/　/g, ' ');
  const clean = half.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length === 7) {
    // 3자리 영문 + 4자리 숫자 형태이면 표준 하이픈 포맷 적용
    const prefix = clean.slice(0, 3);
    const suffix = clean.slice(3);
    return `${prefix}-${suffix}`;
  }
  return clean;
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

/**
 * 7자리 고유 회원번호 조회 (없으면 빈 문자열 반환)
 */
export function getSavedMemberCode(): string {
  if (typeof window === 'undefined') return '';
  try {
    const existing = localStorage.getItem(MEMBER_CODE_STORAGE_KEY);
    if (existing && existing.trim()) {
      return normalizeMemberCode(existing.trim());
    }
  } catch {}
  return '';
}

/**
 * 현재 기기의 7자리 고유 회원번호 조회
 * 등록된 회원(실명 입력자, 카카오 연동자, 번호 로그인자)만 발급받으며,
 * 새 컴퓨터/미등록 방문자에게는 임의로 번호를 부여하지 않고 빈 문자열을 유지합니다.
 */
export function getOrGenerateMemberCode(forceGenerate = false): string {
  if (typeof window === 'undefined') return '';

  try {
    const existing = localStorage.getItem(MEMBER_CODE_STORAGE_KEY);
    if (existing && existing.trim()) {
      return normalizeMemberCode(existing.trim());
    }

    const kakaoUser = ParkOnStorage.getKakaoUser();
    const profile = ParkOnStorage.getUserProfile();
    const rawName = ParkOnStorage.getUserDisplayName();

    const isRegistered = Boolean(
      kakaoUser?.id ||
      (rawName && !isPlaceholderName(rawName)) ||
      (profile?.userName && !isPlaceholderName(profile.userName))
    );

    const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // 아직 등록되지 않은 신규 기기이고 강제 생성이 아니면 번호를 임의로 부여하지 않고 빈 문자열 반환 (단, 로컬 개발/대표님 기기는 PKY-7788 즉시 보장)
    if (!isRegistered && !forceGenerate && !isLocalHost) {
      return '';
    }

    // 대표님(김대희) 계정 또는 로컬호스트 개발 환경인 경우 상징적인 프리미엄 회원번호 우선 배정
    let codeSuffix = '';
    if (isLocalHost || rawName?.includes('김대희') || profile?.userName?.includes('김대희') || kakaoUser?.realName?.includes('김대희')) {
      codeSuffix = '7788';
    } else if (kakaoUser?.id) {
      // 카카오 ID 기반 안정적 고유 숫자 도출
      const numStr = kakaoUser.id.replace(/\D/g, '');
      if (numStr.length >= 4) {
        codeSuffix = numStr.slice(-4);
      } else {
        const hash = Math.abs(kakaoUser.id.split('').reduce((acc, c) => acc * 31 + c.charCodeAt(0), 0));
        codeSuffix = String(1000 + (hash % 9000));
      }
    } else {
      // 신규/게스트 유저가 직접 번호 발급을 요청한 경우: 1000 ~ 9999 난수 배정
      codeSuffix = String(Math.floor(1000 + Math.random() * 9000));
    }

    const newCode = `PKY-${codeSuffix}`;
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

/**
 * 현재 기기의 모든 경기 기록, 연대기, 프로필, 1촌 명부를 클라우드에 자동 백업
 */
export async function syncMemberDataToCloud(): Promise<{ success: boolean; memberCode: string; message?: string }> {
  if (typeof window === 'undefined') return { success: false, memberCode: '' };

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
  }
}

/**
 * 회원번호 7자리만으로 클라우드에서 모든 경기 기록, 연대기, 프로필을 가져와 자동 로그인
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

  const cleanCode = normalizeMemberCode(inputCode);
  if (!cleanCode || cleanCode.replace('-', '').length < 6) {
    return { success: false, memberCode: inputCode, message: '올바른 7자리 고유 회원번호를 입력해 주세요. (예: PKY-7788)' };
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

    // 2. 프로필 복원
    if (profile) {
      ParkOnStorage.saveUserProfile(profile);
    } else if (userName) {
      ParkOnStorage.saveUserProfile({
        userName,
        nationalGrade: '공인 싱글 1급',
        clubName: '구미 파크골프 클럽',
      });
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

    // 1) 클라우드 전적 등록 (가짜/목업 필터링)
    if (Array.isArray(completedRounds)) {
      completedRounds.forEach((r: RoundSession) => {
        if (!isMockOrCorruptedRound(r)) {
          const key = r.id || `${r.courseName}_${r.completedAt}`;
          roundMap.set(key, r);
        }
      });
    }
    // 2) 로컬 전적 등록 (클라우드에 아직 안 올라간 게스트 라운드 보존)
    localRounds.forEach((r) => {
      const key = r.id || `${r.courseName}_${r.completedAt}`;
      if (!roundMap.has(key)) {
        roundMap.set(key, r);
      }
    });
    // 3) 안전 보관함 전적 등록 (연동 직전 스마트폰에서 쳤던 기록 원천 복구)
    stashRounds.forEach((r) => {
      const key = r.id || `${r.courseName}_${r.completedAt}`;
      if (!roundMap.has(key)) {
        roundMap.set(key, r);
      }
    });

    const mergedRounds = Array.from(roundMap.values()).sort((a, b) => {
      const tA = new Date(a.completedAt || 0).getTime();
      const tB = new Date(b.completedAt || 0).getTime();
      return tB - tA;
    });

    ParkOnStorage.saveCompletedRounds(mergedRounds);
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

    // 7. 시스템 전역 이벤트 트리거 (새로고침 없이 실시간 반영)
    window.dispatchEvent(new Event('storage'));
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

