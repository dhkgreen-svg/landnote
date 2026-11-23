import { Course, HoleMetadata } from '@/types/parkon';

export type CourseSpecStatus = 'OFFICIAL_ADMIN' | 'CROWD_VERIFIED' | 'ONLINE_AUTO' | 'UNVERIFIED_TEMPLATE';
export type CourseSpecSource =
  | 'PHOTO_OCR'
  | 'BATCH_EDIT'
  | 'SCORECARD_DIFF'
  | 'TEEBOX'
  | 'ADMIN_DIRECT'
  | 'ONLINE_IMAGE_AI';
export type SubmissionStatus = 'PENDING' | 'AUTO_PROMOTED' | 'APPROVED' | 'REJECTED';

export interface OnlineScanHistoryItem {
  courseId: string;
  courseName: string;
  lastScannedAt: string;
  outcome: 'QUEUED' | 'NO_DATA_COOLDOWN';
  sourceUrl?: string;
  note?: string;
}

export interface AutoScanDashboardStatus {
  lifecycleMode: 'PHASE_1_DAILY_CONQUEST' | 'PHASE_2_MONTHLY_RADAR';
  dailyBatchSize: number;
  eligibleUnverifiedCount: number;
  cooldown30dCount: number;
  pendingQueueCount: number;
  lastRunAt?: string;
}

export function formatHoleDistance(distanceMeter?: number | null): string {
  const d = Number(distanceMeter) || 0;
  return d > 0 ? `${d}m` : '__m';
}

export interface MasterCourseSpec {
  courseId: string;
  courseName: string;
  region?: string;
  totalCourses: number;
  totalHoles: number;
  holesMetadata: HoleMetadata[];
  specStatus: 'OFFICIAL_ADMIN' | 'CROWD_VERIFIED' | 'ONLINE_AUTO';
  verifiedBy: string;
  evidencePhotoUrl?: string;
  strikeCount: number;
  updatedAt: string;
}

export interface CourseSpecSubmission {
  id: string;
  courseId: string;
  courseName: string;
  region?: string;
  prevTotalCourses?: number;
  prevHolesMetadata?: HoleMetadata[];
  proposedTotalCourses: number;
  proposedTotalHoles: number;
  proposedHolesMetadata: HoleMetadata[];
  signature: string;
  evidencePhotoUrl?: string;
  source: CourseSpecSource;
  contributorName: string;
  memberCode?: string;
  isExecutive?: boolean;
  status: SubmissionStatus;
  reviewNote?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface CourseSpecAuditSummary {
  totalCourses: number;
  officialAdminCount: number;
  crowdVerifiedCount: number;
  onlineAutoCount?: number;
  unverifiedTemplateCount: number;
  pendingSubmissionsCount: number;
  verifiedPercent: number;
}

export const COURSE_LETTERS_12 = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

export const PRE_VERIFIED_REAL_COURSE_NAMES = new Set(['수성파크골프장', '동락파크골프장']);

/**
 * 과거 더미 템플릿(77m/45m/76m...) 또는 구버전 Par 터치 시 자동 주입된 가짜 50m/56m 캐시를 정밀 제거합니다.
 * 오직 ① 수성·동락 공인 실측 구장, ② 중앙 마스터 DB(OFFICIAL_ADMIN/CROWD_VERIFIED/ONLINE_AUTO),
 * 또는 ③ 유저가 실제로 거리를 입력해 distanceVerifiedAt 스탬프가 찍힌 홀만 거리(>0m)를 유지합니다.
 */
export function sanitizeLegacyDummyCourse<T extends Partial<Course>>(course: T): T {
  if (!course) return course;
  const cname = (course.name || '').trim();
  if (PRE_VERIFIED_REAL_COURSE_NAMES.has(cname)) {
    return course;
  }
  if (course.specStatus === 'OFFICIAL_ADMIN' || course.specStatus === 'CROWD_VERIFIED' || course.specStatus === 'ONLINE_AUTO') {
    return course;
  }

  const rawHoles = Array.isArray(course.holesMetadata) ? course.holesMetadata : [];
  let hasAnyGenuineVerifiedHole = false;
  const cleanedHoles = rawHoles.map((h) => {
    const hasGenuineDist = Boolean(h?.distanceVerifiedAt && Number(h?.distanceMeter) > 0);
    if (hasGenuineDist) {
      hasAnyGenuineVerifiedHole = true;
      return { ...h, isVerified: true };
    }
    return {
      ...h,
      distanceMeter: 0,
      isVerified: false,
    };
  });

  return {
    ...course,
    holesMetadata: cleanedHoles,
    isVerified: hasAnyGenuineVerifiedHole,
    isSpecsVerified: hasAnyGenuineVerifiedHole,
    specStatus: hasAnyGenuineVerifiedHole ? 'CROWD_VERIFIED' : 'UNVERIFIED_TEMPLATE',
  };
}

export function sanitizeLegacyCrowdSpecsMap(crowdSpecs: Record<string, any> | undefined | null): Record<string, any> {
  if (!crowdSpecs || typeof crowdSpecs !== 'object') return {};
  const cleaned: Record<string, any> = {};
  for (const [k, v] of Object.entries(crowdSpecs)) {
    if (!k || !v || typeof v !== 'object') continue;
    const cname = String(v.courseName || '').trim();
    const keepDist = PRE_VERIFIED_REAL_COURSE_NAMES.has(cname) || Boolean(v.distanceVerifiedAt && Number(v.distanceMeter) > 0);
    cleaned[k] = {
      ...v,
      distanceMeter: keepDist ? Number(v.distanceMeter) : 0,
    };
  }
  return cleaned;
}

export function isDummyTemplateCourse(course: Pick<Course, 'name' | 'holesMetadata' | 'specStatus' | 'isSpecsVerified'>): boolean {
  if (course.name && PRE_VERIFIED_REAL_COURSE_NAMES.has(course.name.trim())) {
    return false;
  }
  if (
    course.specStatus === 'OFFICIAL_ADMIN' ||
    course.specStatus === 'CROWD_VERIFIED' ||
    course.specStatus === 'ONLINE_AUTO'
  ) {
    return false;
  }
  const holes = course.holesMetadata || [];
  if (holes.length === 0) return true;
  // 실제 distanceVerifiedAt 스탬프가 찍힌 홀이 하나도 없으면 미점검 구장으로 판별!
  const hasRealStampedHole = holes.some((h) => Boolean(h?.distanceVerifiedAt && Number(h?.distanceMeter) > 0));
  return !hasRealStampedHole;
}

export function resolveCourseSpecStatus(course: Pick<Course, 'name' | 'holesMetadata' | 'specStatus' | 'isSpecsVerified'>): CourseSpecStatus {
  if (course.specStatus === 'OFFICIAL_ADMIN') return 'OFFICIAL_ADMIN';
  if (course.specStatus === 'CROWD_VERIFIED') return 'CROWD_VERIFIED';
  if (course.specStatus === 'ONLINE_AUTO') return 'ONLINE_AUTO';
  if (isDummyTemplateCourse(course)) return 'UNVERIFIED_TEMPLATE';
  return 'CROWD_VERIFIED';
}

export function getCourseSpecBadge(status: CourseSpecStatus): {
  label: string;
  shortLabel: string;
  tone: 'emerald' | 'blue' | 'amber';
} {
  if (status === 'OFFICIAL_ADMIN') {
    return { label: '✅ 공식 확정 제원', shortLabel: '공식 확정', tone: 'emerald' };
  }
  if (status === 'CROWD_VERIFIED') {
    return { label: '🥇 유저 현장 실입력 제원 (최우선)', shortLabel: '유저 실입력', tone: 'emerald' };
  }
  if (status === 'ONLINE_AUTO') {
    return { label: '🌐 온라인 파수 자동반영 (현장 입력 시 즉시 갱신)', shortLabel: '온라인 자동', tone: 'blue' };
  }
  return { label: '⚠️ 제원 자동탐색 대기 (거리 __m)', shortLabel: '자동탐색 대기', tone: 'amber' };
}

/**
 * 2-Strike 동일 제보 매칭용 정규화 서명(코스 수 + 전 홀 Par 배열)
 */
export function computeSpecSignature(totalCourses: number, holesMetadata: HoleMetadata[]): string {
  const expectedHoles = totalCourses * 9;
  const pars = Array.from({ length: expectedHoles }, (_, i) => {
    const found = holesMetadata.find((h) => Number(h.hole) === i + 1);
    return Number(found?.par) || 3;
  });
  return `C${totalCourses}|${pars.join(',')}`;
}

/**
 * 코스별 9홀 파수 합계 계산 (대한파크골프협회 표준 9홀 33타)
 */
export function getCourseParBreakdown(totalCourses: number, holesMetadata: HoleMetadata[]) {
  return Array.from({ length: totalCourses }, (_, idx) => {
    const letter = COURSE_LETTERS_12[idx] || `${idx + 1}`;
    const start = idx * 9 + 1;
    const end = start + 8;
    let parSum = 0;
    let distSum = 0;
    for (let h = start; h <= end; h++) {
      const meta = holesMetadata.find((m) => Number(m.hole) === h);
      parSum += Number(meta?.par) || 3;
      distSum += Number(meta?.distanceMeter) || 0;
    }
    return {
      courseIndex: idx,
      courseLetter: letter,
      parSum,
      distSum,
      isStandard33: parSum === 33,
    };
  });
}

/**
 * 장난·오기입 원천 차단용 서버/클라이언트 공통 Sanity Check
 */
export function validateCourseSpecPayload(input: {
  totalCourses: number;
  holesMetadata: HoleMetadata[];
}): { valid: boolean; error?: string; warnings: string[]; normalizedHoles: HoleMetadata[] } {
  const warnings: string[] = [];
  const totalCourses = Math.round(Number(input.totalCourses));
  if (!Number.isFinite(totalCourses) || totalCourses < 1 || totalCourses > 12) {
    return { valid: false, error: '코스 수는 1코스(9홀) ~ 12코스(108홀) 사이여야 합니다.', warnings, normalizedHoles: [] };
  }

  const totalHoles = totalCourses * 9;
  const rawList = Array.isArray(input.holesMetadata) ? input.holesMetadata : [];
  if (rawList.length < totalHoles) {
    return {
      valid: false,
      error: `${totalCourses}코스(${totalHoles}홀) 기준 전 홀 제원이 필요합니다. (현재 ${rawList.length}홀)`,
      warnings,
      normalizedHoles: [],
    };
  }

  const normalizedHoles: HoleMetadata[] = [];
  for (let h = 1; h <= totalHoles; h++) {
    const src = rawList.find((m) => Number(m.hole) === h) || rawList[h - 1];
    const par = Number(src?.par);
    if (par !== 3 && par !== 4 && par !== 5) {
      return { valid: false, error: `${h}번홀 파수(${par})는 3, 4, 5 중 하나여야 합니다.`, warnings, normalizedHoles: [] };
    }
    const rawDist = Number(src?.distanceMeter) || 0;
    if (rawDist !== 0 && (rawDist < 15 || rawDist > 250)) {
      return {
        valid: false,
        error: `${h}번홀 거리(${rawDist}m)가 파크골프 허용 범위(15~250m)를 벗어났습니다.`,
        warnings,
        normalizedHoles: [],
      };
    }
    normalizedHoles.push({
      hole: h,
      par,
      distanceMeter: rawDist,
      localRule: src?.localRule,
      tip: src?.tip,
      isVerified: true,
      distanceVerifiedAt: rawDist > 0 ? (src?.distanceVerifiedAt || new Date().toISOString()) : undefined,
      contributedBy: src?.contributedBy,
    });
  }

  const breakdown = getCourseParBreakdown(totalCourses, normalizedHoles);
  for (const b of breakdown) {
    if (b.parSum < 27 || b.parSum > 38) {
      return {
        valid: false,
        error: `${b.courseLetter}코스 9홀 파 합계(${b.parSum}타)가 비정상 범위(27~38타)입니다.`,
        warnings,
        normalizedHoles: [],
      };
    }
    if (b.parSum !== 33) {
      warnings.push(`${b.courseLetter}코스 파 합계 ${b.parSum}타 (표준 33타와 ${b.parSum > 33 ? '+' : ''}${b.parSum - 33}타 차이)`);
    }
  }

  return { valid: true, warnings, normalizedHoles };
}
