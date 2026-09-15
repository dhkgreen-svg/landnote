import {
  RoundSession,
  Course,
  CourseConditionState,
  GrassLength,
  RollSpeed,
  MoistureLevel,
  ConditionVoteLog,
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
  nationalGrade: '★★★★ 4스타 (상급)',
  clubName: '동락 파크골프 클럽',
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
  getHomeCourseId(): string {
    if (typeof window === 'undefined') return DEFAULT_COURSES[0].id;
    return localStorage.getItem(STORAGE_KEYS.HOME_COURSE_ID) || DEFAULT_COURSES[0].id;
  },

  setHomeCourseId(courseId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.HOME_COURSE_ID, courseId);
    // 선택된 구장을 홈구장 목록에도 자동 포함
    this.addFavoriteHomeCourse(courseId);
  },

  // 1-1. 복수 홈구장 관리 (최대 5개)
  getFavoriteHomeCourseIds(): string[] {
    if (typeof window === 'undefined') return [DEFAULT_COURSES[0].id];
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAVORITE_HOME_COURSES);
      if (data) {
        const parsed: string[] = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    // 기본 즐겨찾기 홈구장 시드 (양호, 동락, 지산)
    const curHome = this.getHomeCourseId();
    const defaults = [curHome];
    for (const d of ['course-gumi-yangho', 'course-gumi-dongrak', 'course-gumi-jisan']) {
      if (!defaults.includes(d) && defaults.length < 3) {
        defaults.push(d);
      }
    }
    this.setFavoriteHomeCourseIds(defaults);
    return defaults;
  },

  setFavoriteHomeCourseIds(courseIds: string[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITE_HOME_COURSES, JSON.stringify(courseIds));
    } catch (e) {
      console.error('Failed to save favorite home courses:', e);
    }
  },

  addFavoriteHomeCourse(courseId: string): string[] {
    const list = this.getFavoriteHomeCourseIds();
    if (!list.includes(courseId)) {
      if (list.length >= 5) {
        list.pop(); // 최대 5개 유지
      }
      list.push(courseId);
      this.setFavoriteHomeCourseIds(list);
    }
    return list;
  },

  removeFavoriteHomeCourse(courseId: string): string[] {
    let list = this.getFavoriteHomeCourseIds().filter((id) => id !== courseId);
    if (list.length === 0) {
      list = [courseId]; // 최소 1개 유지
    }
    this.setFavoriteHomeCourseIds(list);
    if (this.getHomeCourseId() === courseId) {
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
