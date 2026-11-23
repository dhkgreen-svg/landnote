'use client';

import { HoleMetadata } from '@/types/parkon';
import {
  AutoScanDashboardStatus,
  CourseSpecAuditSummary,
  CourseSpecSource,
  CourseSpecSubmission,
  MasterCourseSpec,
} from '@/lib/courseSpecShared';

export const MASTER_SPECS_CACHE_KEY = 'parkon_master_course_specs_v1';
const MASTER_SPECS_SYNCED_AT_KEY = 'parkon_master_course_specs_synced_at_v1';
const SYNC_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export function getCachedMasterCourseSpecs(): Record<string, MasterCourseSpec> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MASTER_SPECS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveCachedMasterCourseSpecs(map: Record<string, MasterCourseSpec>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MASTER_SPECS_CACHE_KEY, JSON.stringify(map));
    localStorage.setItem(MASTER_SPECS_SYNCED_AT_KEY, String(Date.now()));
  } catch {
    // ignore storage quota errors
  }
}

export function upsertSingleCachedMasterSpec(spec: MasterCourseSpec): void {
  const cur = getCachedMasterCourseSpecs();
  cur[spec.courseId] = spec;
  saveCachedMasterCourseSpecs(cur);
}

/**
 * 중앙 공식 제원 DB(Supabase / 서버)에서 승인된 최신 구장 제원을 전역 동기화합니다.
 */
export async function syncMasterCourseSpecsFromServer(force = false): Promise<Record<string, MasterCourseSpec>> {
  if (typeof window === 'undefined') return {};
  try {
    if (!force) {
      const last = Number(localStorage.getItem(MASTER_SPECS_SYNCED_AT_KEY) || 0);
      if (Date.now() - last < SYNC_THROTTLE_MS) {
        return getCachedMasterCourseSpecs();
      }
    }
    const res = await fetch('/api/course/master-specs', { cache: 'no-store' });
    if (!res.ok) return getCachedMasterCourseSpecs();
    const data = await res.json();
    if (data?.success && data.masterSpecs && typeof data.masterSpecs === 'object') {
      saveCachedMasterCourseSpecs(data.masterSpecs);
      return data.masterSpecs;
    }
  } catch {
    // silent fallback to local cache
  }
  return getCachedMasterCourseSpecs();
}

export async function submitCourseSpecVerification(payload: {
  courseId: string;
  courseName: string;
  region?: string;
  prevTotalCourses?: number;
  prevHolesMetadata?: HoleMetadata[];
  totalCourses: number;
  holesMetadata: HoleMetadata[];
  evidencePhotoUrl?: string;
  source?: CourseSpecSource;
  contributorName?: string;
  memberCode?: string;
  isExecutive?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  warnings?: string[];
  submission?: CourseSpecSubmission;
  masterSpec?: MasterCourseSpec;
  promotedReason?: 'USER_FIELD_PRIORITY' | 'ONLINE_FULL_AUTO' | 'TWO_STRIKE' | 'EXECUTIVE_PHOTO' | null;
  strikeCount?: number;
}> {
  try {
    const memberCode =
      payload.memberCode ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('parkon_member_code') || localStorage.getItem('parkon_member_code_v1') || undefined
        : undefined);
    const res = await fetch('/api/course/master-specs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, memberCode }),
    });
    const data = await res.json();
    if (data?.success && data.masterSpec) {
      upsertSingleCachedMasterSpec(data.masterSpec);
    }
    return data;
  } catch (e: any) {
    return { success: false, message: e?.message || '서버 전송 중 오류가 발생했습니다.' };
  }
}

export async function fetchAdminCourseSpecDashboard(): Promise<{
  success: boolean;
  summary?: CourseSpecAuditSummary;
  masterSpecs?: Record<string, MasterCourseSpec>;
  submissions?: CourseSpecSubmission[];
}> {
  try {
    const res = await fetch('/api/course/master-specs?includeAdmin=1', { cache: 'no-store' });
    const data = await res.json();
    if (data?.success && data.masterSpecs) {
      saveCachedMasterCourseSpecs(data.masterSpecs);
    }
    return data;
  } catch {
    return { success: false };
  }
}

export async function adminActionCourseSpec(payload: {
  action: 'APPROVE' | 'REJECT' | 'DIRECT_SAVE';
  submissionId?: string;
  reviewNote?: string;
  adminName?: string;
  courseId?: string;
  courseName?: string;
  region?: string;
  totalCourses?: number;
  holesMetadata?: HoleMetadata[];
  evidencePhotoUrl?: string;
}): Promise<{
  success: boolean;
  message?: string;
  masterSpec?: MasterCourseSpec;
  submission?: CourseSpecSubmission;
}> {
  try {
    const res = await fetch('/api/course/master-specs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data?.success && data.masterSpec) {
      upsertSingleCachedMasterSpec(data.masterSpec);
    }
    return data;
  } catch (e: any) {
    return { success: false, message: e?.message || '관리자 처리 중 오류' };
  }
}

export async function extractCourseSpecsFromPhoto(params: {
  image?: string;
  courseNameHint?: string;
  sampleMode?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  courseName?: string;
  totalCourses?: number;
  holesMetadata?: HoleMetadata[];
  note?: string;
}> {
  try {
    const res = await fetch('/api/course/spec-ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e?.message || '사진 제원 판독 중 오류' };
  }
}

export async function fetchAutoScanStatus(): Promise<AutoScanDashboardStatus | null> {
  try {
    const res = await fetch('/api/admin/course-auto-scan?statusOnly=1', { cache: 'no-store' });
    const data = await res.json();
    return data?.success ? data.autoScanStatus || null : null;
  } catch {
    return null;
  }
}

export async function runOnlineCourseParScan(params: {
  courseId?: string;
  batchSize?: number;
  simulateDemo?: boolean;
}): Promise<{
  success: boolean;
  message?: string;
  scannedCount?: number;
  queuedCount?: number;
  cooldownCount?: number;
  results?: Array<{ courseId: string; courseName: string; queued: boolean; note: string }>;
  autoScanStatus?: AutoScanDashboardStatus;
}> {
  try {
    const res = await fetch('/api/admin/course-auto-scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return await res.json();
  } catch (e: any) {
    return { success: false, message: e?.message || '온라인 파수 탐색 중 오류' };
  }
}
