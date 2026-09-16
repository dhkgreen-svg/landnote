import { RoundPlayer, RoundSession } from '@/types/parkon';
import { ParkOnStorage, KakaoAuthUser } from './storage';

/**
 * 사용자 본인 기본 이름 가져오기
 * (사용자 프로필, 카카오 실명/가명, 또는 기본값 '김대희')
 */
export function getDefaultSelfName(): string {
  if (typeof window === 'undefined') return '플레이어';
  try {
    return ParkOnStorage.getUserDisplayName() || '플레이어';
  } catch (e) {
    console.error(e);
  }
  return '플레이어';
}

/**
 * 레거시 이름 '본인(조장)' 또는 '본인'을 실제 이름으로 정화
 */
export function cleanPlayerName(rawName: string, isSelf?: boolean, fallbackIdx?: number): string {
  const fallback = isSelf
    ? getDefaultSelfName()
    : (fallbackIdx !== undefined ? `동반자 ${fallbackIdx + 1}` : '동반자');

  if (!rawName) return fallback;
  const trimmed = rawName.trim();
  if (!trimmed) return fallback;

  if (
    trimmed === '본인(조장)' ||
    trimmed === '본인' ||
    trimmed.startsWith('본인(')
  ) {
    return getDefaultSelfName();
  }
  return trimmed;
}

/**
 * 조장 1번 우선 배치 + 나머지 동반자 가나다순 정렬 함수
 *
 * 규칙:
 * 1. 조장(isLeader: true)은 무조건 1번(첫 번째)에 배치
 * 2. 나머지 인원들은 가나다순(localeCompare 'ko')으로 정렬
 * 3. 내가 조장이면 -> 1번에 나(김대희), 2~4번에 동반자들 가나다순
 * 4. 내가 조장이 아니면 -> 1번에 해당 조장, 2~4번에 나(김대희)를 포함한 인원 가나다순
 */
export function sortPlayersByLeaderAndAlphabetical(players: RoundPlayer[]): RoundPlayer[] {
  if (!players || players.length === 0) return [];

  // 레거시 이름 정화 및 본인 여부 보정
  const normalized = players.map((p, idx) => {
    const isSelf = p.isSelf ?? (idx === 0 && (p.name?.includes('본인') || idx === 0));
    const cleanedName = cleanPlayerName(p.name, isSelf, idx);
    return {
      ...p,
      name: cleanedName,
      isSelf,
    };
  });

  // 활동 중인 플레이어와 중도 퇴장(isOut) 플레이어 분리
  const activePlayers = normalized.filter((p) => !p.isOut);
  const departedPlayers = normalized.filter((p) => p.isOut);

  // 1. 활성 플레이어 중에서 조장 찾기 (퇴장한 조장은 자동 해제 및 활성 인원 승격)
  let leader = activePlayers.find((p) => p.isLeader);
  if (!leader && activePlayers.length > 0) {
    leader = activePlayers.find((p) => p.isSelf) || activePlayers[0];
    leader = { ...leader, isLeader: true };
  }

  let sortedActive: RoundPlayer[] = [];
  if (leader) {
    const others = activePlayers
      .filter((p) => p.id !== leader!.id)
      .map((p) => ({
        ...p,
        isLeader: false,
      }));

    // 2. 나머지 활성 인원 가나다순 정렬 (이름 기준)
    others.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB, 'ko');
    });

    sortedActive = [{ ...leader, isLeader: true }, ...others];
  } else {
    sortedActive = activePlayers.map((p) => ({ ...p, isLeader: false }));
  }

  // 3. 중도 퇴장 인원은 조장 해제 후 맨 뒤에 배치
  const sortedDeparted = departedPlayers.map((p) => ({ ...p, isLeader: false }));

  return [...sortedActive, ...sortedDeparted];
}

/**
  * 프로필/로그인 활동명 변경 시, 현재 진행 중인 라운드의 본인(isSelf) 플레이어 이름도 실시간 동기화
  */
export function syncSelfPlayerNameToActiveRound(newName: string): void {
  if (typeof window === 'undefined' || !newName?.trim()) return;
  try {
    const active = ParkOnStorage.getCurrentRound();
    if (!active || !active.players || active.players.length === 0) return;

    const trimmed = newName.trim();
    let hasChanged = false;

    // 본인 플레이어 이름 동기화 (isSelf 우선, 없으면 idx === 0)
    const updatedPlayers = active.players.map((p, idx) => {
      const isSelf = p.isSelf ?? (idx === 0);
      if (isSelf && p.name !== trimmed) {
        hasChanged = true;
        return { ...p, name: trimmed, isSelf: true };
      }
      return p;
    });

    if (hasChanged) {
      // 조장 우선 + 가나다순 재정렬 (본인이 조장이 아닌 경우 가나다 위치 변경 반영)
      const sorted = sortPlayersByLeaderAndAlphabetical(updatedPlayers);
      const updatedRound: RoundSession = {
        ...active,
        players: sorted,
      };
      ParkOnStorage.saveCurrentRound(updatedRound);
      window.dispatchEvent(new CustomEvent('parkon_round_player_sync', { detail: { newName: trimmed } }));
    }
  } catch (e) {
    console.error('Failed to sync self player name to active round:', e);
  }
}

/**
  * 라운드 내 동반자/조장 관리 모달에서 본인 이름을 직접 수정했을 때,
  * 사용자 프로필 및 카카오 인증 정보(상단 헤더 표시명)에도 즉시 양방향 동기화
  */
export function syncRoundSelfNameToUserProfile(newName: string): void {
  if (typeof window === 'undefined' || !newName?.trim()) return;
  try {
    const trimmed = newName.trim();
    const kakao = ParkOnStorage.getKakaoUser();
    if (kakao) {
      const isAlias = kakao.preferredDisplay === 'ALIAS';
      const updatedKakao: KakaoAuthUser = {
        ...kakao,
        realName: isAlias ? (kakao.realName || trimmed) : trimmed,
        aliasName: isAlias ? trimmed : (kakao.aliasName || trimmed),
        nickname: trimmed,
      };
      ParkOnStorage.setKakaoUser(updatedKakao);
    } else {
      const profile = ParkOnStorage.getUserProfile();
      ParkOnStorage.saveUserProfile({
        ...profile,
        userName: trimmed,
      });
    }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('parkon_profile_updated', { detail: { newName: trimmed } }));
  } catch (e) {
    console.error('Failed to sync round self name to user profile:', e);
  }
}
