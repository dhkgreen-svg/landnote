import {
  RoundSession,
  Course,
  CourseConditionState,
  GrassLength,
  RollSpeed,
  MoistureLevel,
  ConditionVoteLog,
  CourseSkillRankItem,
  CourseActivityRankItem,
} from '@/types/parkon';
import { DEFAULT_COURSES, generateStandardHoles } from './defaultCourses';

export interface CourseConditionEvaluation {
  state: CourseConditionState;
  hasActiveReport: boolean;
  isRealtime1Hour: boolean;
  active1HourVotesCount: number;
  latestVoteTimeStr: string;
  formattedCurrentDate: string;
  formattedCurrentTime: string;
  minutesAgo?: number;
  statusBadgeText: string;
}

const STORAGE_KEYS = {
  CURRENT_ROUND: 'parkon_current_round_v1',
  HOME_COURSE_ID: 'parkon_home_course_id_v1',
  FAVORITE_HOME_COURSES: 'parkon_favorite_home_courses_v1',
  COMPLETED_ROUNDS: 'parkon_completed_rounds_v1',
  CUSTOM_COURSES: 'parkon_custom_courses_v1',
  COURSE_CONDITIONS: 'parkon_course_conditions_v1',
  CROWD_HOLE_SPECS: 'parkon_crowd_hole_specs_v1',
  USER_PROFILE: 'parkon_user_profile_v1',
  SUNLIGHT_MODE: 'parkon_sunlight_mode_v1',
  KAKAO_USER: 'parkon_kakao_user_v1',
};

export interface KakaoAuthUser {
  id: string;
  nickname: string;
  realName?: string; // 실명 (예: 김대희)
  aliasName?: string; // 가명/별명 (예: 나이스버디)
  preferredDisplay?: 'REAL' | 'ALIAS'; // 기본 활동명 선택: 'REAL'(실명) | 'ALIAS'(가명)
  clubAliases?: Record<string, string>; // 클럽별 지정 활동명 { [clubId]: string }
  profileImageUrl?: string;
  email?: string;
  connectedAt: string;
}

export interface UserGolfProfile {
  userName: string;
  nationalGrade: string; // '5스타 마스터' | '4스타 상급' | '3스타 중급' | '2스타 중초급' | '1스타 초급' | '일반 루키'
  clubName: string;
  kakaoUser?: KakaoAuthUser | null;
}

export const DEFAULT_USER_PROFILE: UserGolfProfile = {
  userName: '김대희',
  nationalGrade: '기록 준비중',
  clubName: '',
  kakaoUser: null,
};

export interface CrowdSpecProposal {
  par: number;
  distanceMeter: number;
  votes: number;
  updatedAt: string;
}

export interface CrowdsourcedHoleSpec {
  courseId: string;
  courseName: string;
  hole: number;
  par: number;
  distanceMeter: number;
  updatedAt: string;
  contributorCount?: number;
  isInitialRegistered?: boolean;
  proposals?: CrowdSpecProposal[];
}

export interface CrowdSpecSaveResult {
  isInitial: boolean;
  isOfficialUpdated: boolean;
  officialPar: number;
  officialDist: number;
  votesForThisSpec: number;
  requiredVotes: number;
  message: string;
}

export const ParkOnStorage = {
  // 0. User Profile
  getUserProfile(): UserGolfProfile {
    if (typeof window === 'undefined') return DEFAULT_USER_PROFILE;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (!data) return DEFAULT_USER_PROFILE;
      const parsed: UserGolfProfile = JSON.parse(data);
      if (!parsed.userName || parsed.userName === '본인(조장)' || parsed.userName === '본인') {
        parsed.userName = '김대희';
      }
      if (parsed.clubName === '동락 파크골프 클럽') {
        parsed.clubName = '';
      }
      if (parsed.nationalGrade?.includes('4스타') || parsed.nationalGrade?.includes('상급')) {
        parsed.nationalGrade = '기록 준비중';
      }
      return parsed;
    } catch {
      return DEFAULT_USER_PROFILE;
    }
  },

  saveUserProfile(profile: UserGolfProfile): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save user profile:', e);
    }
  },

  getKakaoUser(): KakaoAuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.KAKAO_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setKakaoUser(user: KakaoAuthUser | null): void {
    if (typeof window === 'undefined') return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.KAKAO_USER, JSON.stringify(user));
        const currentProfile = this.getUserProfile();
        const effectiveName =
          (user.preferredDisplay === 'ALIAS' ? user.aliasName : user.realName) ||
          user.realName ||
          user.aliasName ||
          user.nickname ||
          '파크골퍼';

        this.saveUserProfile({
          ...currentProfile,
          userName: effectiveName,
          kakaoUser: user,
        });
      } else {
        localStorage.removeItem(STORAGE_KEYS.KAKAO_USER);
        const currentProfile = this.getUserProfile();
        this.saveUserProfile({
          ...currentProfile,
          userName: '파크골퍼',
          kakaoUser: null,
        });
      }
    } catch (e) {
      console.error('Failed to set kakao user:', e);
    }
  },

  // 사용자의 현재 유효 활동명 반환 (클럽 ID가 주어지면 해당 클럽 지정명 우선)
  getUserDisplayName(clubId?: string): string {
    const user = this.getKakaoUser();
    if (!user) {
      const profile = this.getUserProfile();
      if (
        profile &&
        profile.userName &&
        profile.userName !== '본인(조장)' &&
        profile.userName !== '본인' &&
        !profile.userName.includes('본인(')
      ) {
        return profile.userName;
      }
      return '김대희';
    }

    if (clubId && user.clubAliases && user.clubAliases[clubId]) {
      return user.clubAliases[clubId];
    }

    if (user.preferredDisplay === 'ALIAS' && user.aliasName) {
      return user.aliasName;
    }
    if (user.preferredDisplay === 'REAL' && user.realName) {
      return user.realName;
    }
    if (user.realName) {
      return user.realName;
    }
    return user.aliasName || user.nickname || '김대희';
  },

  // 클럽별 사용자 활동명 저장
  setClubUserAlias(clubId: string, aliasName: string): void {
    const user = this.getKakaoUser();
    if (!user) return;
    if (!user.clubAliases) user.clubAliases = {};
    user.clubAliases[clubId] = aliasName;
    this.setKakaoUser(user);
  },
  // 1. Home Course
  normalizeCourseId(courseId: string): string {
    if (courseId === 'course-gumi-yangho') return 'course-26ed6cca-09c6-42fe-8e1e-773f23a30db1';
    if (courseId === 'course-gumi-jisan') return 'course-3d43d16b-0a42-4a6f-b8d0-00a74a3bfb09';
    return courseId;
  },

  getHomeCourseId(): string {
    if (typeof window === 'undefined') return DEFAULT_COURSES[0].id;
    const saved = localStorage.getItem(STORAGE_KEYS.HOME_COURSE_ID) || DEFAULT_COURSES[0].id;
    return this.normalizeCourseId(saved);
  },

  setHomeCourseId(courseId: string): void {
    if (typeof window === 'undefined') return;
    const validId = this.normalizeCourseId(courseId);
    localStorage.setItem(STORAGE_KEYS.HOME_COURSE_ID, validId);
    // 선택된 구장을 홈구장 목록에도 자동 포함
    this.addFavoriteHomeCourse(validId);
  },

  // 1-1. 복수 홈구장 관리 (최대 30개 지원)
  getFavoriteHomeCourseIds(): string[] {
    if (typeof window === 'undefined') return [DEFAULT_COURSES[0].id];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_HOME_COURSES);
      if (data) {
        let parsed: string[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          let hasMigrated = false;
          let normalized = parsed.map((id) => {
            const mapped = this.normalizeCourseId(id);
            if (mapped !== id) hasMigrated = true;
            return mapped;
          });

          // 만약 구미 구장들을 선택했는데 이전 버그로 양포가 누락되었을 경우 자동 복원
          const hasGumi = normalized.some((id) => id.includes('gumi') || id === 'course-3d43d16b-0a42-4a6f-b8d0-00a74a3bfb09');
          const hasYangpo = normalized.includes('course-26ed6cca-09c6-42fe-8e1e-773f23a30db1');
          if (hasGumi && !hasYangpo) {
            normalized.push('course-26ed6cca-09c6-42fe-8e1e-773f23a30db1');
            hasMigrated = true;
          }

          const uniqueList = Array.from(new Set(normalized));
          if (hasMigrated) {
            this.setFavoriteHomeCourseIds(uniqueList);
          }
          return uniqueList;
        }
      }
    } catch {
      // fallback
    }
    // 기본 즐겨찾기 홈구장 시드 (구미 대표 3대 구장: 구미, 동락, 양포)
    const curHome = this.normalizeCourseId(this.getHomeCourseId());
    const defaults = Array.from(
      new Set([
        curHome,
        'course-3d43d16b-0a42-4a6f-b8d0-00a74a3bfb09', // 구미파크골프장
        'course-gumi-dongrak',                          // 동락파크골프장
        'course-26ed6cca-09c6-42fe-8e1e-773f23a30db1', // 구미 양포(양호)파크골프장
      ])
    );
    this.setFavoriteHomeCourseIds(defaults);
    return defaults;
  },

  setFavoriteHomeCourseIds(courseIds: string[]): void {
    if (typeof window === 'undefined') return;
    try {
      const normalized = courseIds.map((id) => this.normalizeCourseId(id));
      localStorage.setItem(STORAGE_KEYS.FAVORITE_HOME_COURSES, JSON.stringify(Array.from(new Set(normalized))));
      window.dispatchEvent(new Event('parkon_favorite_courses_updated'));
    } catch (e) {
      console.error('Failed to save favorite home courses:', e);
    }
  },

  addFavoriteHomeCourse(courseId: string): string[] {
    const validId = this.normalizeCourseId(courseId);
    const list = this.getFavoriteHomeCourseIds();
    if (!list.includes(validId)) {
      if (list.length >= 30) {
        list.shift(); // 30개 초과 시 가장 오래된 것 순환
      }
      list.push(validId);
      this.setFavoriteHomeCourseIds(list);
    }
    return list;
  },

  removeFavoriteHomeCourse(courseId: string): string[] {
    const validId = this.normalizeCourseId(courseId);
    let list = this.getFavoriteHomeCourseIds().filter((id) => id !== validId && id !== courseId);
    if (list.length === 0) {
      list = [validId]; // 최소 1개 유지
    }
    this.setFavoriteHomeCourseIds(list);
    if (this.normalizeCourseId(this.getHomeCourseId()) === validId) {
      this.setHomeCourseId(list[0]);
    }
    return list;
  },

  // 2. Active Round (Auto-save)
  getCurrentRound(): RoundSession | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_ROUND);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveCurrentRound(session: RoundSession): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ROUND, JSON.stringify(session));
    } catch (e) {
      console.error('Failed to autosave round:', e);
    }
  },

  // 2-1. 가상 라운딩(체험/연습 모드) 세션 생성 (시간 제한 없음, 종료 시 기록 제로)
  createVirtualRoundSession(courseId?: string): RoundSession {
    const all = this.getAllCourses();
    const targetCourseId = courseId || this.getHomeCourseId();
    const targetCourse = all.find((c) => c.id === targetCourseId) || all[0];
    const selfName = this.getUserDisplayName();

    const virtualId = `virtual_${Date.now()}`;
    const selectedHoles = [1, 2, 3, 4, 5, 6, 7, 8, 9];

    const virtualSession: RoundSession = {
      id: virtualId,
      courseId: targetCourse.id,
      courseName: targetCourse.name,
      startedAt: new Date().toISOString(),
      currentHole: 1,
      totalHoles: 9,
      selectedCourseLetters: ['A'],
      selectedHoleNumbers: selectedHoles,
      confirmedHoles: [],
      players: [
        {
          id: 'p_self',
          name: selfName,
          isLeader: true,
          isSelf: true,
          scores: { 1: 3 },
          obCount: { 1: 0 },
          totalStrokes: 3,
          totalParDiff: 0,
        },
        {
          id: 'p_v1',
          name: '[예시] 홍길동',
          isLeader: false,
          isSelf: false,
          scores: { 1: 3 },
          obCount: { 1: 0 },
          totalStrokes: 3,
          totalParDiff: 0,
        },
        {
          id: 'p_v2',
          name: '[체험용] 김파크',
          isLeader: false,
          isSelf: false,
          scores: { 1: 4 },
          obCount: { 1: 0 },
          totalStrokes: 4,
          totalParDiff: 1,
        },
        {
          id: 'p_v3',
          name: '[SAMPLE] 이온',
          isLeader: false,
          isSelf: false,
          scores: { 1: 3 },
          obCount: { 1: 0 },
          totalStrokes: 3,
          totalParDiff: 0,
        },
      ],
      status: 'IN_PROGRESS',
      isOfficial: false,
      isVirtual: true,
    };

    this.saveCurrentRound(virtualSession);
    return virtualSession;
  },

  clearCurrentRound(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_ROUND);
  },

  // 3. Completed Rounds
  getCompletedRounds(): RoundSession[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.COMPLETED_ROUNDS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCompletedRound(session: RoundSession): void {
    if (typeof window === 'undefined') return;
    // 가상 라운딩(체험 모드)인 경우 영구 기록/전적에 저장하지 않고 종료 (기록 제로 보장)
    if (session.isVirtual) {
      this.clearCurrentRound();
      return;
    }
    try {
      const existing = this.getCompletedRounds();
      const updated = [session, ...existing.filter((r) => r.id !== session.id)].slice(0, 50);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_ROUNDS, JSON.stringify(updated));
      this.clearCurrentRound();
    } catch (e) {
      console.error('Failed to save completed round:', e);
    }
  },

  saveCompletedRounds(rounds: RoundSession[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED_ROUNDS, JSON.stringify(rounds.slice(0, 100)));
    } catch (e) {
      console.error('Failed to save completed rounds:', e);
    }
  },

  deleteCompletedRound(roundId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const existing = this.getCompletedRounds();
      const updated = existing.filter((r) => r.id !== roundId);
      localStorage.setItem(STORAGE_KEYS.COMPLETED_ROUNDS, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to delete completed round:', e);
    }
  },

  clearCompletedRounds(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEYS.COMPLETED_ROUNDS);
    } catch (e) {
      console.error('Failed to clear completed rounds:', e);
    }
  },

  // 4. Courses (Defaults + Custom Created / Modified + Crowdsourced Specs)
  getAllCourses(): Course[] {
    if (typeof window === 'undefined') return DEFAULT_COURSES;
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
      const customCourses: Course[] = customData ? JSON.parse(customData) : [];
      const crowdSpecs = this.getCrowdsourcedHoleSpecs();

      // Apply crowdsourced specs (Par, distance) onto any course's holes
      const applyCrowdSpecs = (c: Course): Course => {
        const cleanName = c.name.replace(/\s+/g, '');
        const holes = (c.holesMetadata || generateStandardHoles(c.totalHoles)).map((h) => {
          const numHole = Number(h.hole);
          const key1 = `${c.id}_hole_${numHole}`;
          const key2 = `${cleanName}_hole_${numHole}`;
          const crowd = crowdSpecs[key1] || crowdSpecs[key2];
          if (crowd) {
            return {
              ...h,
              par: Number(crowd.par),
              distanceMeter: Number(crowd.distanceMeter),
            };
          }
          return h;
        });
        return { ...c, holesMetadata: holes };
      };

      // Map customized courses by id and by normalized name
      const customMap = new Map(customCourses.map((c) => [c.id, c]));
      const customNameMap = new Map(customCourses.map((c) => [c.name.replace(/\s+/g, ''), c]));

      // Apply customized overrides onto default courses
      const defaults = DEFAULT_COURSES.map((d) => {
        const cleanName = d.name.replace(/\s+/g, '');
        const custom = customMap.get(d.id) || customNameMap.get(cleanName);
        if (custom) {
          const userHoles = custom.totalHoles || d.totalHoles;
          const userCourses = custom.totalCourses || Math.max(1, Math.round(userHoles / 9));
          const holes = (custom.holesMetadata && custom.holesMetadata.length >= userHoles)
            ? custom.holesMetadata.slice(0, userHoles)
            : (d.holesMetadata && d.holesMetadata.length >= userHoles
                ? d.holesMetadata.slice(0, userHoles)
                : generateStandardHoles(userHoles));

          return applyCrowdSpecs({
            ...d,
            ...custom,
            id: d.id, // preserve canonical id
            totalCourses: userCourses,
            totalHoles: userHoles,
            holesMetadata: holes,
          });
        }
        return applyCrowdSpecs(d);
      });

      // Pure custom courses that are not matched to any default course
      const pureCustom = customCourses.filter((c) => {
        const cleanName = c.name.replace(/\s+/g, '');
        return !DEFAULT_COURSES.some(
          (d) => d.id === c.id || d.name.replace(/\s+/g, '') === cleanName
        );
      }).map(applyCrowdSpecs);

      return [...pureCustom, ...defaults];
    } catch {
      return DEFAULT_COURSES;
    }
  },

  // 5. Crowdsourced Hole Specs (Big Data Flywheel)
  getCrowdsourcedHoleSpecs(): Record<string, CrowdsourcedHoleSpec> {
    if (typeof window === 'undefined') return {};
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CROWD_HOLE_SPECS);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  },

  saveCrowdsourcedHoleSpec(
    courseId: string,
    courseName: string,
    hole: number,
    par: number,
    distanceMeter: number,
    forceConsensus: boolean = false
  ): CrowdSpecSaveResult {
    const numHole = Number(hole);
    const numPar = Number(par);
    const numDist = Number(distanceMeter);
    const holeInCourse = ((numHole - 1) % 9) + 1;

    if (typeof window === 'undefined') {
      return {
        isInitial: false,
        isOfficialUpdated: false,
        officialPar: numPar,
        officialDist: numDist,
        votesForThisSpec: 1,
        requiredVotes: 10,
        message: '저장 완료',
      };
    }

    try {
      const specs = this.getCrowdsourcedHoleSpecs();
      const cleanName = courseName.replace(/\s+/g, '');
      const key1 = `${courseId}_hole_${numHole}`;
      const key2 = `${cleanName}_hole_${numHole}`;

      const existing: CrowdsourcedHoleSpec | undefined = specs[key1] || specs[key2];

      let isInitial = false;
      let isOfficialUpdated = false;
      let officialPar = numPar;
      let officialDist = numDist;
      let votesForThisSpec = 1;
      let message = '';

      // [규칙 1] 최초 등록자 여부 검사: 최초 등록자는 무조건 100% 즉시 전국 빅데이터 공식 제원으로 확정!
      if (!existing || !existing.isInitialRegistered) {
        isInitial = true;
        isOfficialUpdated = true;
        votesForThisSpec = 1;

        const newItem: CrowdsourcedHoleSpec = {
          courseId,
          courseName,
          hole: numHole,
          par: numPar,
          distanceMeter: numDist,
          updatedAt: new Date().toISOString(),
          contributorCount: 1,
          isInitialRegistered: true,
          proposals: [],
        };
        specs[key1] = newItem;
        specs[key2] = newItem;
        localStorage.setItem(STORAGE_KEYS.CROWD_HOLE_SPECS, JSON.stringify(specs));
        message = `🎉 최초 등록자 확인 완료! ${holeInCourse}번 홀 제원(Par ${numPar}, ${numDist}m)이 전국 빅데이터 공식 제원으로 즉시 정립되었습니다!`;
      } else {
        // [규칙 2] 이미 정립된 공식 제원이 존재하는 경우
        officialPar = existing.par;
        officialDist = existing.distanceMeter;

        const isSameAsOfficial = existing.par === numPar && existing.distanceMeter === numDist;

        if (isSameAsOfficial) {
          // 기존 공식 제원을 확인/보증 투표
          existing.contributorCount = (existing.contributorCount || 1) + 1;
          existing.updatedAt = new Date().toISOString();
          isOfficialUpdated = true;
          votesForThisSpec = existing.contributorCount;
          specs[key1] = existing;
          specs[key2] = existing;
          localStorage.setItem(STORAGE_KEYS.CROWD_HOLE_SPECS, JSON.stringify(specs));
          message = `👍 공식 제원 확인 투표가 반영되었습니다. (총 ${votesForThisSpec}명 일치 검증 보증)`;
        } else {
          // 다른 제원으로 변경 제안 -> 장난 방지 10인 상호 검증 룰 적용
          if (!existing.proposals) {
            existing.proposals = [];
          }

          let prop = existing.proposals.find(
            (p) => p.par === numPar && p.distanceMeter === numDist
          );
          if (!prop) {
            prop = {
              par: numPar,
              distanceMeter: numDist,
              votes: forceConsensus ? 10 : 1,
              updatedAt: new Date().toISOString(),
            };
            existing.proposals.push(prop);
          } else {
            prop.votes = forceConsensus ? Math.max(10, prop.votes + 1) : prop.votes + 1;
            prop.updatedAt = new Date().toISOString();
          }

          votesForThisSpec = prop.votes;

          if (prop.votes >= 10) {
            // 10명 이상 일치 확인 달성 -> 공식 제원 승인 및 교체!
            existing.par = numPar;
            existing.distanceMeter = numDist;
            existing.contributorCount = prop.votes;
            existing.updatedAt = new Date().toISOString();
            isOfficialUpdated = true;
            officialPar = numPar;
            officialDist = numDist;
            message = `🏆 10명 이상 일치 검증 달성! ${holeInCourse}번 홀의 공식 제원이 Par ${numPar}, ${numDist}m로 정식 승인·교체되었습니다.`;
          } else {
            // 10명 미만 -> 장난 방지 보호 모드 유지
            isOfficialUpdated = false;
            message = `🛡️ 빅데이터 장난 방지 보호: 본인 스코어보드에는 즉시 반영되었습니다. 전국 공식 구장 제원 변경은 10명 이상(현재 ${prop.votes}/10명)이 확인했을 때 자동으로 공식 승인됩니다.`;
          }

          specs[key1] = existing;
          specs[key2] = existing;
          localStorage.setItem(STORAGE_KEYS.CROWD_HOLE_SPECS, JSON.stringify(specs));
        }
      }

      // 공식 제원이 정립/업데이트된 경우 캐시 코스 제원도 동기화
      if (isOfficialUpdated) {
        const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
        let list: Course[] = customData ? JSON.parse(customData) : [];
        let target = list.find(
          (c) => c.id === courseId || c.name.replace(/\s+/g, '') === cleanName
        );

        if (!target) {
          const def = DEFAULT_COURSES.find(
            (d) => d.id === courseId || d.name.replace(/\s+/g, '') === cleanName
          );
          if (def) {
            target = {
              ...def,
              holesMetadata: generateStandardHoles(def.totalHoles),
            };
            list.push(target);
          }
        }

        if (target) {
          if (!target.holesMetadata || target.holesMetadata.length === 0) {
            target.holesMetadata = generateStandardHoles(target.totalHoles || 18);
          }
          let found = false;
          target.holesMetadata = target.holesMetadata.map((h) => {
            if (Number(h.hole) === numHole) {
              found = true;
              return {
                ...h,
                par: numPar,
                distanceMeter: numDist,
              };
            }
            return h;
          });
          if (!found) {
            target.holesMetadata.push({ hole: numHole, par: numPar, distanceMeter: numDist });
          }
          this.updateCourse(target);
        }
      }

      return {
        isInitial,
        isOfficialUpdated,
        officialPar,
        officialDist,
        votesForThisSpec,
        requiredVotes: 10,
        message,
      };
    } catch (e) {
      console.error('Failed to save crowdsourced hole spec:', e);
      return {
        isInitial: false,
        isOfficialUpdated: false,
        officialPar: numPar,
        officialDist: numDist,
        votesForThisSpec: 1,
        requiredVotes: 10,
        message: '저장 처리 중 오류가 발생했습니다.',
      };
    }
  },

  addCustomCourse(course: Course): void {
    if (typeof window === 'undefined') return;
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
      const list: Course[] = customData ? JSON.parse(customData) : [];
      list.unshift(course);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COURSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to add custom course:', e);
    }
  },

  updateCourse(updatedCourse: Course): void {
    if (typeof window === 'undefined') return;
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
      let list: Course[] = customData ? JSON.parse(customData) : [];
      const idx = list.findIndex(
        (c) => c.id === updatedCourse.id || c.name.replace(/\s+/g, '') === updatedCourse.name.replace(/\s+/g, '')
      );
      if (idx >= 0) {
        list[idx] = updatedCourse;
      } else {
        list.push(updatedCourse);
      }
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COURSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to update course:', e);
    }
  },

  deleteCustomCourse(courseId: string): void {
    if (typeof window === 'undefined') return;
    try {
      const customData = localStorage.getItem(STORAGE_KEYS.CUSTOM_COURSES);
      if (!customData) return;
      let list: Course[] = JSON.parse(customData);
      list = list.filter((c) => c.id !== courseId);
      localStorage.setItem(STORAGE_KEYS.CUSTOM_COURSES, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to delete custom course:', e);
    }
  },

  // 5. Course Condition Vote State (실전 3대 잔디 지표: 구름성, 수분, 잔디길이)
  getConditionState(courseId: string): CourseConditionState {
    const today = new Date().toISOString().split('T')[0];

    const emptyState: CourseConditionState = {
      courseId,
      condition: 'NORMAL',
      votes: { good: 0, normal: 0, bad: 0 },
      speed: 'NORMAL',
      moisture: 'NORMAL',
      length: 'MEDIUM',
      speedVotes: { very_fast: 0, fast: 0, normal: 0, slow: 0, very_slow: 0 },
      moistureVotes: { very_dry: 0, dry: 0, normal: 0, wet: 0, very_wet: 0 },
      lengthVotes: { very_short: 0, short: 0, medium: 0, long: 0, very_long: 0 },
      myVotes: {},
      lastUpdated: today,
      lastUpdatedTime: '',
      recentLogs: [],
    };

    if (typeof window === 'undefined') return emptyState;
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.COURSE_CONDITIONS}_${courseId}`);
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.lastUpdated === today) {
          // 기존 가상 목업 로그(init_로 시작하는 데이터) 완전 배제
          const cleanLogs: ConditionVoteLog[] = Array.isArray(parsed.recentLogs)
            ? parsed.recentLogs.filter((l: ConditionVoteLog) => l && l.id && !l.id.startsWith('init_'))
            : [];

          if (cleanLogs.length === 0) {
            return emptyState;
          }

          // 실제 참여 로그 기반 투표수 실시간 재집계
          const speedVotes = { very_fast: 0, fast: 0, normal: 0, slow: 0, very_slow: 0 };
          const moistureVotes = { very_dry: 0, dry: 0, normal: 0, wet: 0, very_wet: 0 };
          const lengthVotes = { very_short: 0, short: 0, medium: 0, long: 0, very_long: 0 };

          cleanLogs.forEach((log) => {
            if (log.category === 'speed') {
              const k = log.value.toLowerCase() as keyof typeof speedVotes;
              if (speedVotes[k] !== undefined) speedVotes[k]++;
            } else if (log.category === 'moisture') {
              const k = log.value.toLowerCase() as keyof typeof moistureVotes;
              if (moistureVotes[k] !== undefined) moistureVotes[k]++;
            } else if (log.category === 'length') {
              const k = log.value.toLowerCase() as keyof typeof lengthVotes;
              if (lengthVotes[k] !== undefined) lengthVotes[k]++;
            }
          });

          return {
            ...emptyState,
            speedVotes,
            moistureVotes,
            lengthVotes,
            myVotes: parsed.myVotes || {},
            lastUpdated: today,
            lastUpdatedTime: parsed.lastUpdatedTime || '',
            recentLogs: cleanLogs,
          };
        }
      }
    } catch {
      // fallback
    }
    return emptyState;
  },

  getConditionEvaluation(courseId: string): CourseConditionEvaluation {
    const state = this.getConditionState(courseId);
    const now = Date.now();
    const nowDate = new Date(now);
    const THREE_HOURS = 3 * 60 * 60 * 1000;

    // 현재 정확한 날짜 및 시각 (예: 9월 12일(토), 07:50)
    const month = nowDate.getMonth() + 1;
    const day = nowDate.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][nowDate.getDay()];
    const hours = String(nowDate.getHours()).padStart(2, '0');
    const minutes = String(nowDate.getMinutes()).padStart(2, '0');
    const formattedCurrentDate = `${month}월 ${day}일(${dayOfWeek})`;
    const formattedCurrentTime = `${hours}:${minutes}`;

    const todayLogs = state.recentLogs || [];
    const threeHourLogs = todayLogs.filter((l) => now - l.timestamp <= THREE_HOURS);

    if (threeHourLogs.length > 0) {
      // 3시간 이내 실제 유저 리포트가 있는 경우: 3시간 이내 최신 데이터 다수결 집계
      const speedCounts: Record<RollSpeed, number> = {
        VERY_FAST: 0,
        FAST: 0,
        NORMAL: 0,
        SLOW: 0,
        VERY_SLOW: 0,
      };
      const moistureCounts: Record<MoistureLevel, number> = {
        VERY_DRY: 0,
        DRY: 0,
        NORMAL: 0,
        WET: 0,
        VERY_WET: 0,
      };
      const lengthCounts: Record<GrassLength, number> = {
        VERY_SHORT: 0,
        SHORT: 0,
        MEDIUM: 0,
        LONG: 0,
        VERY_LONG: 0,
      };

      let latestTimestamp = 0;
      let latestTimeStr = '';

      threeHourLogs.forEach((log) => {
        if (log.timestamp > latestTimestamp) {
          latestTimestamp = log.timestamp;
          latestTimeStr = log.timeStr;
        }
        if (log.category === 'speed') {
          speedCounts[log.value as RollSpeed] = (speedCounts[log.value as RollSpeed] || 0) + 1;
        }
        if (log.category === 'moisture') {
          moistureCounts[log.value as MoistureLevel] = (moistureCounts[log.value as MoistureLevel] || 0) + 1;
        }
        if (log.category === 'length') {
          lengthCounts[log.value as GrassLength] = (lengthCounts[log.value as GrassLength] || 0) + 1;
        }
      });

      const getWinner = <T extends string>(counts: Record<T, number>, fallback: T): T => {
        let max = 0;
        let winner = fallback;
        for (const [key, val] of Object.entries(counts) as [T, number][]) {
          if (val > max) {
            max = val;
            winner = key;
          }
        }
        return winner;
      };

      const speed = getWinner(speedCounts, 'NORMAL');
      const moisture = getWinner(moistureCounts, 'NORMAL');
      const length = getWinner(lengthCounts, 'MEDIUM');

      const minutesAgo = Math.max(0, Math.floor((now - latestTimestamp) / 60000));
      let elapsedTimeText = '방금 전';
      if (minutesAgo < 1) {
        elapsedTimeText = '방금 전';
      } else if (minutesAgo < 60) {
        elapsedTimeText = `${minutesAgo}분 전`;
      } else {
        const h = Math.floor(minutesAgo / 60);
        const m = minutesAgo % 60;
        elapsedTimeText = m === 0 ? `${h}시간 전` : `${h}시간 ${m}분 전`;
      }

      const reportPrefix = elapsedTimeText === '방금 전' ? '방금 전' : `${elapsedTimeText}에`;
      const statusBadgeText = `🟢 ${reportPrefix} 리포트했음 (${threeHourLogs.length}건)`;

      return {
        state: {
          ...state,
          speed,
          moisture,
          length,
        },
        hasActiveReport: true,
        isRealtime1Hour: true,
        active1HourVotesCount: threeHourLogs.length,
        latestVoteTimeStr: latestTimeStr,
        formattedCurrentDate,
        formattedCurrentTime,
        minutesAgo,
        statusBadgeText,
      };
    } else {
      // 3시간 이내 리포트가 전혀 없는 경우: '3시간 내 잔디 리포트 없음' 정확히 표시
      return {
        state,
        hasActiveReport: false,
        isRealtime1Hour: false,
        active1HourVotesCount: 0,
        latestVoteTimeStr: '',
        formattedCurrentDate,
        formattedCurrentTime,
        statusBadgeText: '⏱️ 최근 3시간 내 잔디 리포트 없음',
      };
    }
  },

  voteFieldCondition(
    courseId: string,
    category: 'speed' | 'moisture' | 'length',
    value: string
  ): CourseConditionState {
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    const timeStr = new Date().toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const state = this.getConditionState(courseId);
    state.lastUpdated = today;
    state.lastUpdatedTime = timeStr;
    if (!state.myVotes) state.myVotes = {};

    // 1시간 타임윈도우 로그 추가
    if (!state.recentLogs) state.recentLogs = [];
    state.recentLogs.push({
      id: `${now}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: now,
      timeStr,
      category,
      value,
    });
    if (state.recentLogs.length > 100) {
      state.recentLogs = state.recentLogs.slice(-100);
    }

    if (category === 'speed') {
      const prev = state.myVotes.speed;
      type SpeedVoteKey = 'very_fast' | 'fast' | 'normal' | 'slow' | 'very_slow';
      if (prev && prev !== value) {
        const pKey = prev.toLowerCase() as SpeedVoteKey;
        if (state.speedVotes[pKey] !== undefined) {
          state.speedVotes[pKey] = Math.max(0, state.speedVotes[pKey] - 1);
        }
      }
      if (prev !== value) {
        const nKey = value.toLowerCase() as SpeedVoteKey;
        if (state.speedVotes[nKey] === undefined) {
          state.speedVotes[nKey] = 0;
        }
        state.speedVotes[nKey] += 1;
        state.myVotes.speed = value as RollSpeed;
      }
      const stages: { type: RollSpeed; key: SpeedVoteKey }[] = [
        { type: 'VERY_FAST', key: 'very_fast' },
        { type: 'FAST', key: 'fast' },
        { type: 'NORMAL', key: 'normal' },
        { type: 'SLOW', key: 'slow' },
        { type: 'VERY_SLOW', key: 'very_slow' },
      ];
      let maxVotes = -1;
      let winningStage: RollSpeed = 'FAST';
      for (const stage of stages) {
        const votes = state.speedVotes[stage.key] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          winningStage = stage.type;
        }
      }
      state.speed = winningStage;
    } else if (category === 'moisture') {
      const prev = state.myVotes.moisture;
      type MoistureVoteKey = 'very_dry' | 'dry' | 'normal' | 'wet' | 'very_wet';
      if (prev && prev !== value) {
        const pKey = prev.toLowerCase() as MoistureVoteKey;
        if (state.moistureVotes[pKey] !== undefined) {
          state.moistureVotes[pKey] = Math.max(0, state.moistureVotes[pKey] - 1);
        }
      }
      if (prev !== value) {
        const nKey = value.toLowerCase() as MoistureVoteKey;
        if (state.moistureVotes[nKey] === undefined) {
          state.moistureVotes[nKey] = 0;
        }
        state.moistureVotes[nKey] += 1;
        state.myVotes.moisture = value as MoistureLevel;
      }
      const stages: { type: MoistureLevel; key: MoistureVoteKey }[] = [
        { type: 'VERY_DRY', key: 'very_dry' },
        { type: 'DRY', key: 'dry' },
        { type: 'NORMAL', key: 'normal' },
        { type: 'WET', key: 'wet' },
        { type: 'VERY_WET', key: 'very_wet' },
      ];
      let maxVotes = -1;
      let winningStage: MoistureLevel = 'DRY';
      for (const stage of stages) {
        const votes = state.moistureVotes[stage.key] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          winningStage = stage.type;
        }
      }
      state.moisture = winningStage;
    } else if (category === 'length') {
      const prev = state.myVotes.length;
      type LengthVoteKey = 'very_short' | 'short' | 'medium' | 'long' | 'very_long';
      if (prev && prev !== value) {
        const pKey = prev.toLowerCase() as LengthVoteKey;
        if (state.lengthVotes[pKey] !== undefined) {
          state.lengthVotes[pKey] = Math.max(0, state.lengthVotes[pKey] - 1);
        }
      }
      if (prev !== value) {
        const nKey = value.toLowerCase() as LengthVoteKey;
        if (state.lengthVotes[nKey] === undefined) {
          state.lengthVotes[nKey] = 0;
        }
        state.lengthVotes[nKey] += 1;
        state.myVotes.length = value as GrassLength;
      }
      const stages: { type: GrassLength; key: LengthVoteKey }[] = [
        { type: 'VERY_SHORT', key: 'very_short' },
        { type: 'SHORT', key: 'short' },
        { type: 'MEDIUM', key: 'medium' },
        { type: 'LONG', key: 'long' },
        { type: 'VERY_LONG', key: 'very_long' },
      ];
      let maxVotes = -1;
      let winningStage: GrassLength = 'SHORT';
      for (const stage of stages) {
        const votes = state.lengthVotes[stage.key] || 0;
        if (votes > maxVotes) {
          maxVotes = votes;
          winningStage = stage.type;
        }
      }
      state.length = winningStage;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEYS.COURSE_CONDITIONS}_${courseId}`, JSON.stringify(state));
    }
    return state;
  },

  voteCondition(courseId: string, type: 'GOOD' | 'NORMAL' | 'BAD'): CourseConditionState {
    const today = new Date().toISOString().split('T')[0];
    const state = this.getConditionState(courseId);
    state.votes[type.toLowerCase() as 'good' | 'normal' | 'bad'] += 1;
    state.condition = type;
    state.lastUpdated = today;
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${STORAGE_KEYS.COURSE_CONDITIONS}_${courseId}`, JSON.stringify(state));
    }
    return state;
  },

  // 햇빛 쨍쨍 고대비 모드
  getSunlightMode(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(STORAGE_KEYS.SUNLIGHT_MODE) === 'true';
    } catch {
      return false;
    }
  },

  setSunlightMode(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.SUNLIGHT_MODE, enabled ? 'true' : 'false');
    } catch (e) {
      console.error('Failed to save sunlight mode:', e);
    }
  },

  // 데이터 안전 백업 (카카오톡 나에게 보내기 또는 복사용 암호화 문자열)
  exportUserData(): string {
    if (typeof window === 'undefined') return '';
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      completedRounds: this.getCompletedRounds(),
      userProfile: this.getUserProfile(),
      favoriteHomeCourseIds: this.getFavoriteHomeCourseIds(),
      homeCourseId: this.getHomeCourseId(),
    };
    try {
      const json = JSON.stringify(payload);
      return `PARKON_BACKUP_v1_${btoa(unescape(encodeURIComponent(json)))}`;
    } catch (e) {
      console.error('Failed to export user data:', e);
      return '';
    }
  },

  // 백업 데이터 복원
  importUserData(raw: string): { success: boolean; message: string; count: number } {
    if (typeof window === 'undefined') return { success: false, message: '클라이언트 환경이 아닙니다.', count: 0 };
    try {
      let jsonStr = raw.trim();
      if (jsonStr.startsWith('PARKON_BACKUP_v1_')) {
        const b64 = jsonStr.replace('PARKON_BACKUP_v1_', '');
        jsonStr = decodeURIComponent(escape(atob(b64)));
      }
      const data = JSON.parse(jsonStr);
      if (!data || !Array.isArray(data.completedRounds)) {
        return { success: false, message: '올바른 파크온 백업 데이터 형식이 아닙니다.', count: 0 };
      }

      // Merge completed rounds by ID
      const existing = this.getCompletedRounds();
      const existingIds = new Set(existing.map((r) => r.id));
      const merged = [...existing];
      let newCount = 0;
      for (const r of data.completedRounds) {
        if (!existingIds.has(r.id)) {
          merged.push(r);
          newCount++;
        }
      }
      this.saveCompletedRounds(merged);

      if (data.userProfile && data.userProfile.userName) {
        this.saveUserProfile(data.userProfile);
      }
      if (Array.isArray(data.favoriteHomeCourseIds) && data.favoriteHomeCourseIds.length > 0) {
        this.setFavoriteHomeCourseIds(data.favoriteHomeCourseIds);
      }
      if (data.homeCourseId) {
        this.setHomeCourseId(data.homeCourseId);
      }

      return {
        success: true,
        message: `백업 데이터 복원 완료! 총 ${merged.length}회(신규 ${newCount}회)의 전적이 안전하게 복구되었습니다.`,
        count: merged.length,
      };
    } catch (e: any) {
      return { success: false, message: `복원 중 오류가 발생했습니다: ${e?.message || '형식 오류'}`, count: 0 };
    }
  },

  // 11. 구장별 100위 랭킹 산출 (공인 실력 1~100위 vs 필드 활동 1~100위 엄격 이분화)
  getCourseLeaderboard100(
    courseId: string,
    courseName: string,
    customUserName?: string
  ): {
    skillTop100: CourseSkillRankItem[];
    activityTop100: CourseActivityRankItem[];
    userSkillStatus: {
      hasOfficialMatch: boolean;
      officialRank: number | null;
      officialScore: number | null;
      hasCasualRound: boolean;
      casualScore: number | null;
      casualRankEquivalent: number | null;
      isOutRank: boolean;
      message: string;
    };
    userActivityStatus: {
      rank: number;
      roundsCount30Days: number;
      tier: string;
      message: string;
    };
  } {
    const validCourseId = this.normalizeCourseId(courseId);
    const profile = this.getUserProfile();
    const myName = customUserName || profile.userName || '나이스버디';
    const myClub = profile.clubName || '소속 클럽 미지정';

    // 1. 유저의 해당 구장 완료 라운드 분석
    const allCompleted = this.getCompletedRounds();
    const courseRounds = allCompleted.filter(
      (r) => this.normalizeCourseId(r.courseId) === validCourseId && r.isOfficial !== false
    );

    // 최근 30일 이내 완주 라운드 (활동 지수는 정규/일반/솔로/하루 N회 무관하게 100% 카운트)
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const user30DaysRounds = courseRounds.filter(
      (r) => new Date(r.completedAt || r.startedAt).getTime() >= thirtyDaysAgo
    );
    const userRoundsCount = user30DaysRounds.length;

    // 공식 클럽전/대회 라운드 vs 개인 친선 라운드 판별
    const officialMatches = courseRounds.filter(
      (r) => r.matchType === 'CLUB_MATCH' || r.matchType === 'TOURNAMENT' || !!r.clubRoomId
    );
    const casualMatches = courseRounds.filter(
      (r) => !(r.matchType === 'CLUB_MATCH' || r.matchType === 'TOURNAMENT' || !!r.clubRoomId)
    );

    // 18홀 환산 타수 추출 헬퍼
    const getBestScore = (rounds: RoundSession[]): number | null => {
      let best: number | null = null;
      rounds.forEach((r) => {
        const me = r.players[0];
        if (!me || !me.totalStrokes || me.totalStrokes <= 0) return;
        const holesCount = Object.keys(me.scores || {}).length || r.totalHoles || 9;
        if (holesCount > 0) {
          const score18 = Math.round((me.totalStrokes / holesCount) * 18);
          if (best === null || score18 < best) best = score18;
        }
      });
      return best;
    };

    const myOfficialBest = getBestScore(officialMatches);
    const myCasualBest = getBestScore(casualMatches);

    // 2. [공인 실력 랭킹 1~100위] 베이스 시드 생성 (클럽전·공식 대회 참가자 기반)
    const SEED_CLUBS = [
      '구미사랑클럽', '수성버디클럽', '동락파크사랑방', '칠곡힐링클럽', '대구수성클럽',
      '양포버디클럽', '비산파크골프', '형곡에이스클럽', '옥성단풍클럽', '선산강변클럽',
      '해평철새클럽', '인동초클럽', '봉곡어울림', '상모사곡클럽', '원평드림클럽',
      '황상에이스', '진미행복클럽', '양호물결클럽', '송정그린클럽', '도량한마음'
    ];
    const SEED_NAMES = [
      '김동식', '이재홍', '최민호', '박상철', '김영환', '정태호', '권영미', '윤미경', '오세진', '배준호',
      '장석호', '최경숙', '송철원', '정다혜', '김말선', '박진태', '백운기', '한상우', '서미정', '류승완',
      '홍길동', '김현수', '이진호', '송인철', '서정민', '오성근', '이정숙', '황보경', '차명석', '고두환',
      '유재선', '임동혁', '문병호', '노영진', '배성철', '강진수', '신동호', '안태양', '남궁민', '허정우',
      '서진영', '조광현', '구자철', '민태식', '전명환', '배기준', '손성훈', '추승우', '곽도원', '탁재훈',
      '변상일', '하태경', '주동수', '채정호', '엄기준', '원상필', '심형래', '석진호', '양경원', '천상욱',
      '표동철', '나기주', '도재명', '어성호', '염동진', '용환수', '기우제', '라상준', '모영철', '사공민',
      '우형태', '옥동열', '진병규', '팽기태', '함은호', '황명석', '길병우', '단재완', '마상훈', '방기호',
      '사도진', '안병기', '제갈원', '풍성철', '호준혁', '공선우', '구명준', '노희철', '문도현', '민상훈',
      '복성수', '선우진', '소병훈', '시동환', '예종석', '옥재민', '원도연', '위선우', '은상일', '임형찬'
    ];

    const baseSkillScores = [
      48, 48, 49, 49, 50, 50, 51, 51, 51, 52,
      52, 52, 53, 53, 53, 54, 54, 54, 54, 55,
      55, 55, 55, 56, 56, 56, 56, 57, 57, 57,
      57, 58, 58, 58, 58, 59, 59, 59, 59, 60,
      60, 60, 60, 61, 61, 61, 61, 62, 62, 62,
      62, 62, 63, 63, 63, 63, 64, 64, 64, 64,
      64, 65, 65, 65, 65, 66, 66, 66, 66, 66,
      67, 67, 67, 67, 68, 68, 68, 68, 68, 69,
      69, 69, 69, 70, 70, 70, 70, 70, 71, 71,
      71, 71, 72, 72, 72, 72, 73, 73, 74, 75
    ];

    const getGradeByScore = (sc: number): string => {
      if (sc <= 54) return '5스타 마스터';
      if (sc <= 58) return '4스타 상급';
      if (sc <= 62) return '3스타 중급';
      if (sc <= 66) return '2스타 중초급';
      if (sc <= 72) return '1스타 초급';
      return '일반 루키';
    };

    let skillTop100: CourseSkillRankItem[] = baseSkillScores.map((score, idx) => {
      const rank = idx + 1;
      const name = SEED_NAMES[idx % SEED_NAMES.length];
      const club = SEED_CLUBS[idx % SEED_CLUBS.length];
      const mType: '클럽전' | '정규대회' = idx % 3 === 0 ? '정규대회' : '클럽전';
      const mMonth = Math.max(1, 9 - Math.floor(idx / 15));
      const mDay = ((idx * 7) % 28) + 1;
      const dateStr = `2026.${String(mMonth).padStart(2, '0')}.${String(mDay).padStart(2, '0')}`;

      return {
        rank,
        rankLabel: `${rank}위`,
        name: `[예시] ${name}`,
        clubName: club,
        score,
        grade: getGradeByScore(score),
        date: dateStr,
        matchType: mType,
        isMe: false,
        isOutRank: false,
      };
    });

    // 만약 유저가 공식 클럽전 기록이 있다면, 해당 순위에 유저를 정확히 삽입/정렬
    let userOfficialRank: number | null = null;
    if (myOfficialBest !== null) {
      const myItem: CourseSkillRankItem = {
        rank: 1,
        rankLabel: '1위',
        name: `${myName} (본인)`,
        clubName: myClub,
        score: myOfficialBest,
        grade: getGradeByScore(myOfficialBest),
        date: '2026.09.16 (최신)',
        matchType: '클럽전',
        isMe: true,
        isOutRank: false,
      };

      const insertIdx = skillTop100.findIndex((it) => it.score > myOfficialBest);
      if (insertIdx !== -1) {
        skillTop100.splice(insertIdx, 0, myItem);
      } else {
        skillTop100.push(myItem);
      }
      skillTop100 = skillTop100.slice(0, 100).map((it, idx) => ({
        ...it,
        rank: idx + 1,
        rankLabel: `${idx + 1}위`,
      }));
      const foundMe = skillTop100.find((it) => it.isMe);
      userOfficialRank = foundMe ? foundMe.rank : null;
    }

    // 유저가 비공식 친선으로 친 경우: 등외 점수 산출 (100위권 안 점수라면 등외 순위 표기)
    let userCasualRankEquivalent: number | null = null;
    let isOutRank = false;
    let skillMessage = '';

    if (myOfficialBest !== null) {
      skillMessage = `공식 클럽전 출전 기록으로 ${userOfficialRank}위에 공인 랭크되었습니다.`;
    } else if (myCasualBest !== null) {
      const eqIdx = skillTop100.findIndex((it) => it.score >= myCasualBest);
      userCasualRankEquivalent = eqIdx !== -1 ? eqIdx + 1 : 101;
      isOutRank = true;
      skillMessage = `내 최고 기록: ${myCasualBest}타 [등외 점수 (비공식 친선)] - 공식 대회(클럽전)에 출전하시면 상위 ${userCasualRankEquivalent}위권으로 공식 랭킹에 즉시 등록됩니다!`;
    } else {
      skillMessage = '아직 이 구장에서의 라운드 기록이 없습니다. 라운드를 시작해 보세요!';
    }

    // 3. [필드 활동 랭킹 1~100위] 베이스 시드 생성 (일반/친선/솔로/하루 3번 모두 100% 반영)
    const baseActivityRounds = [
      54, 52, 48, 47, 45, 44, 42, 41, 40, 38,
      38, 37, 36, 35, 34, 33, 33, 32, 31, 30,
      29, 29, 28, 28, 27, 26, 26, 25, 25, 24,
      24, 23, 23, 22, 22, 21, 21, 20, 20, 19,
      19, 18, 18, 18, 17, 17, 16, 16, 15, 15,
      15, 14, 14, 14, 13, 13, 13, 12, 12, 12,
      11, 11, 11, 10, 10, 10, 9, 9, 9, 8,
      8, 8, 8, 7, 7, 7, 7, 6, 6, 6,
      6, 5, 5, 5, 5, 4, 4, 4, 4, 3,
      3, 3, 3, 2, 2, 2, 2, 1, 1, 1
    ];

    const getActivityTier = (cnt: number): string => {
      if (cnt >= 40) return '하루 2~3게임 열정왕';
      if (cnt >= 25) return '매일 라운딩';
      if (cnt >= 15) return '주 3~4회 완주';
      if (cnt >= 8) return '주 1~2회 정기';
      if (cnt >= 3) return '월 3~4회 즐김';
      return '새싹 골퍼';
    };

    let activityTop100: CourseActivityRankItem[] = baseActivityRounds.map((rounds, idx) => {
      const rank = idx + 1;
      const name = SEED_NAMES[(idx + 13) % SEED_NAMES.length];
      const club = SEED_CLUBS[(idx + 5) % SEED_CLUBS.length];

      return {
        rank,
        name: `[예시] ${name}`,
        clubName: club,
        rounds,
        tier: getActivityTier(rounds),
        isMe: false,
      };
    });

    // 유저의 실제 활동 횟수 (정규/친선/혼자/하루 3번 무관 100% 반영) 삽입
    let userActivityRank = 100;
    if (userRoundsCount > 0) {
      const myActItem: CourseActivityRankItem = {
        rank: 1,
        name: `${myName} (본인)`,
        clubName: myClub,
        rounds: userRoundsCount,
        tier: getActivityTier(userRoundsCount),
        isMe: true,
      };

      const actInsertIdx = activityTop100.findIndex((it) => it.rounds <= userRoundsCount);
      if (actInsertIdx !== -1) {
        activityTop100.splice(actInsertIdx, 0, myActItem);
      } else {
        activityTop100.push(myActItem);
      }

      activityTop100 = activityTop100.slice(0, 100).map((it, idx) => ({
        ...it,
        rank: idx + 1,
      }));

      const foundAct = activityTop100.find((it) => it.isMe);
      userActivityRank = foundAct ? foundAct.rank : 101;
    }

    return {
      skillTop100,
      activityTop100,
      userSkillStatus: {
        hasOfficialMatch: myOfficialBest !== null,
        officialRank: userOfficialRank,
        officialScore: myOfficialBest,
        hasCasualRound: myCasualBest !== null,
        casualScore: myCasualBest,
        casualRankEquivalent: userCasualRankEquivalent,
        isOutRank,
        message: skillMessage,
      },
      userActivityStatus: {
        rank: userActivityRank,
        roundsCount30Days: userRoundsCount,
        tier: getActivityTier(userRoundsCount),
        message: userRoundsCount > 0
          ? `최근 30일 동안 총 ${userRoundsCount}회 완주하여 활동 ${userActivityRank}위에 랭크되었습니다.`
          : '아직 이번 달 완주 기록이 없습니다. 자유롭게 필드를 돌아보세요!',
      },
    };
  },
};

// WakeLock Safeguard (화면 꺼짐 방지)
let wakeLockSentinel: any = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof window === 'undefined' || !('wakeLock' in navigator)) return false;
  try {
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    console.warn('Wake Lock request failed:', err);
    return false;
  }
}

export function releaseWakeLock(): void {
  if (wakeLockSentinel) {
    wakeLockSentinel.release();
    wakeLockSentinel = null;
  }
}
