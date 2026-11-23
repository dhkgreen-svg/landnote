import fs from 'fs';
import path from 'path';
import os from 'os';
import { getSupabaseClient } from '@/lib/serverMemberSync';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import {
  CourseSpecAuditSummary,
  CourseSpecSource,
  CourseSpecSubmission,
  MasterCourseSpec,
  computeSpecSignature,
  isDummyTemplateCourse,
  validateCourseSpecPayload,
} from '@/lib/courseSpecShared';
import { HoleMetadata } from '@/types/parkon';

const LOCAL_STORE_FILE = path.join(os.tmpdir(), 'parkon_course_master_specs_store_v1.json');

interface LocalSpecStore {
  masterSpecs: Record<string, MasterCourseSpec>;
  submissions: CourseSpecSubmission[];
}

function getMemoryStore(): LocalSpecStore {
  const g = globalThis as any;
  if (!g.__parkonCourseSpecStore) {
    let loaded: LocalSpecStore = { masterSpecs: {}, submissions: [] };
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
          loaded = {
            masterSpecs: parsed.masterSpecs || {},
            submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
          };
        }
      }
    } catch {
      // ignore disk errors
    }
    g.__parkonCourseSpecStore = loaded;
  }
  return g.__parkonCourseSpecStore as LocalSpecStore;
}

function persistMemoryStore(store: LocalSpecStore) {
  try {
    fs.writeFileSync(
      LOCAL_STORE_FILE,
      JSON.stringify(
        {
          masterSpecs: store.masterSpecs,
          submissions: store.submissions.slice(-500),
        },
        null,
        2
      ),
      'utf-8'
    );
  } catch {
    // ignore serverless read-only errors
  }
}

export async function loadAllMasterSpecs(): Promise<Record<string, MasterCourseSpec>> {
  const store = getMemoryStore();
  const merged: Record<string, MasterCourseSpec> = { ...store.masterSpecs };

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('parkon_course_master_specs')
        .select('*')
        .limit(1000);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const spec: MasterCourseSpec = {
            courseId: String(row.course_id),
            courseName: String(row.course_name),
            region: row.region || undefined,
            totalCourses: Number(row.total_courses) || 2,
            totalHoles: Number(row.total_holes) || 18,
            holesMetadata: Array.isArray(row.holes_metadata) ? row.holes_metadata : [],
            specStatus: row.spec_status === 'OFFICIAL_ADMIN' ? 'OFFICIAL_ADMIN' : 'CROWD_VERIFIED',
            verifiedBy: String(row.verified_by || '현장 검증'),
            evidencePhotoUrl: row.evidence_photo_url || undefined,
            strikeCount: Number(row.strike_count) || 1,
            updatedAt: String(row.updated_at || new Date().toISOString()),
          };
          merged[spec.courseId] = spec;
          store.masterSpecs[spec.courseId] = spec;
        }
        persistMemoryStore(store);
      }
    }
  } catch {
    // graceful fallback when Supabase table is not provisioned yet
  }

  return merged;
}

export async function loadAllSubmissions(): Promise<CourseSpecSubmission[]> {
  const store = getMemoryStore();
  const byId = new Map<string, CourseSpecSubmission>();
  for (const s of store.submissions) byId.set(s.id, s);

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('parkon_course_spec_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);
      if (!error && Array.isArray(data)) {
        for (const row of data) {
          const sub: CourseSpecSubmission = {
            id: String(row.id),
            courseId: String(row.course_id),
            courseName: String(row.course_name),
            region: row.region || undefined,
            prevTotalCourses: row.prev_total_courses ? Number(row.prev_total_courses) : undefined,
            prevHolesMetadata: Array.isArray(row.prev_holes_metadata) ? row.prev_holes_metadata : undefined,
            proposedTotalCourses: Number(row.proposed_total_courses) || 2,
            proposedTotalHoles: Number(row.proposed_total_holes) || 18,
            proposedHolesMetadata: Array.isArray(row.proposed_holes_metadata) ? row.proposed_holes_metadata : [],
            signature: String(row.signature || ''),
            evidencePhotoUrl: row.evidence_photo_url || undefined,
            source: (row.source || 'BATCH_EDIT') as CourseSpecSource,
            contributorName: String(row.contributor_name || '현장 골퍼'),
            memberCode: row.member_code || undefined,
            isExecutive: Boolean(row.is_executive),
            status: (row.status || 'PENDING') as CourseSpecSubmission['status'],
            reviewNote: row.review_note || undefined,
            createdAt: String(row.created_at || new Date().toISOString()),
            reviewedAt: row.reviewed_at || undefined,
          };
          byId.set(sub.id, sub);
        }
        store.submissions = Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        persistMemoryStore(store);
      }
    }
  } catch {
    // graceful fallback
  }

  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function upsertMasterSpec(spec: MasterCourseSpec): Promise<void> {
  const store = getMemoryStore();
  store.masterSpecs[spec.courseId] = spec;
  persistMemoryStore(store);

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('parkon_course_master_specs').upsert(
        {
          course_id: spec.courseId,
          course_name: spec.courseName,
          region: spec.region || null,
          total_courses: spec.totalCourses,
          total_holes: spec.totalHoles,
          holes_metadata: spec.holesMetadata,
          spec_status: spec.specStatus,
          verified_by: spec.verifiedBy,
          evidence_photo_url: spec.evidencePhotoUrl || null,
          strike_count: spec.strikeCount,
          updated_at: spec.updatedAt,
        },
        { onConflict: 'course_id' }
      );
    }
  } catch {
    // fallback already saved
  }
}

async function upsertSubmission(sub: CourseSpecSubmission): Promise<void> {
  const store = getMemoryStore();
  const idx = store.submissions.findIndex((s) => s.id === sub.id);
  if (idx >= 0) store.submissions[idx] = sub;
  else store.submissions.unshift(sub);
  persistMemoryStore(store);

  try {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.from('parkon_course_spec_submissions').upsert(
        {
          id: sub.id,
          course_id: sub.courseId,
          course_name: sub.courseName,
          region: sub.region || null,
          prev_total_courses: sub.prevTotalCourses ?? null,
          prev_holes_metadata: sub.prevHolesMetadata || null,
          proposed_total_courses: sub.proposedTotalCourses,
          proposed_total_holes: sub.proposedTotalHoles,
          proposed_holes_metadata: sub.proposedHolesMetadata,
          signature: sub.signature,
          evidence_photo_url: sub.evidencePhotoUrl || null,
          source: sub.source,
          contributor_name: sub.contributorName,
          member_code: sub.memberCode || null,
          is_executive: Boolean(sub.isExecutive),
          status: sub.status,
          review_note: sub.reviewNote || null,
          created_at: sub.createdAt,
          reviewed_at: sub.reviewedAt || null,
        },
        { onConflict: 'id' }
      );
    }
  } catch {
    // fallback already saved
  }
}

/**
 * 현장 제보 접수 + 2-Strike 집단지성 자동 승격 & 총무+사진 패스트트랙 판정
 */
export async function submitCourseSpecReport(params: {
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
  ok: boolean;
  error?: string;
  warnings?: string[];
  submission?: CourseSpecSubmission;
  masterSpec?: MasterCourseSpec;
  promotedReason?: 'TWO_STRIKE' | 'EXECUTIVE_PHOTO' | null;
  strikeCount?: number;
}> {
  const validation = validateCourseSpecPayload({
    totalCourses: params.totalCourses,
    holesMetadata: params.holesMetadata,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const totalCourses = Math.round(Number(params.totalCourses));
  const totalHoles = totalCourses * 9;
  const contributorName = (params.contributorName || '현장 골퍼').trim() || '현장 골퍼';
  const normalizedHoles = validation.normalizedHoles.map((h) => ({
    ...h,
    isVerified: true,
    contributedBy: contributorName,
  }));
  const signature = computeSpecSignature(totalCourses, normalizedHoles);
  const nowIso = new Date().toISOString();

  // Check existing submissions for 2-Strike consensus
  const existingSubs = await loadAllSubmissions();
  const sameSigSubs = existingSubs.filter(
    (s) => s.courseId === params.courseId && s.signature === signature && s.status !== 'REJECTED'
  );
  const submitterIdentity = (params.memberCode || contributorName).trim().toLowerCase();
  const distinctSubmitters = new Set(
    sameSigSubs.map((s) => (s.memberCode || s.contributorName || '').trim().toLowerCase())
  );
  distinctSubmitters.add(submitterIdentity);
  const strikeCount = distinctSubmitters.size;

  // Auto-promotion rules:
  // Rule A: 2-Strike (2+ distinct golfers/teams submit exact same course count + hole pars)
  // Rule B: Club Executive (총무/회장) + Photo Evidence attached
  const hasPhoto = Boolean(params.evidencePhotoUrl && params.evidencePhotoUrl.length > 40);
  let promotedReason: 'TWO_STRIKE' | 'EXECUTIVE_PHOTO' | null = null;
  if (strikeCount >= 2) {
    promotedReason = 'TWO_STRIKE';
  } else if (params.isExecutive && hasPhoto) {
    promotedReason = 'EXECUTIVE_PHOTO';
  }

  const submission: CourseSpecSubmission = {
    id: `spec_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    courseId: params.courseId,
    courseName: params.courseName.trim(),
    region: params.region,
    prevTotalCourses: params.prevTotalCourses,
    prevHolesMetadata: params.prevHolesMetadata,
    proposedTotalCourses: totalCourses,
    proposedTotalHoles: totalHoles,
    proposedHolesMetadata: normalizedHoles,
    signature,
    evidencePhotoUrl: hasPhoto ? params.evidencePhotoUrl : undefined,
    source: params.source || 'BATCH_EDIT',
    contributorName,
    memberCode: params.memberCode,
    isExecutive: Boolean(params.isExecutive),
    status: promotedReason ? 'AUTO_PROMOTED' : 'PENDING',
    reviewNote:
      promotedReason === 'TWO_STRIKE'
        ? `2-Strike 집단지성 일치 (${strikeCount}팀) 자동 승격`
        : promotedReason === 'EXECUTIVE_PHOTO'
          ? '클럽 임원진 + 현장 증빙 사진 자동 승격'
          : undefined,
    createdAt: nowIso,
    reviewedAt: promotedReason ? nowIso : undefined,
  };

  await upsertSubmission(submission);

  let masterSpec: MasterCourseSpec | undefined;
  if (promotedReason) {
    // Also mark previous PENDING submissions with same signature as AUTO_PROMOTED
    for (const prev of sameSigSubs) {
      if (prev.status === 'PENDING') {
        await upsertSubmission({
          ...prev,
          status: 'AUTO_PROMOTED',
          reviewedAt: nowIso,
          reviewNote: `2-Strike 일치 자동 승격 (${submission.id})`,
        });
      }
    }

    masterSpec = {
      courseId: submission.courseId,
      courseName: submission.courseName,
      region: submission.region,
      totalCourses,
      totalHoles,
      holesMetadata: normalizedHoles,
      specStatus: 'CROWD_VERIFIED',
      verifiedBy:
        promotedReason === 'TWO_STRIKE'
          ? `${contributorName} 외 ${strikeCount - 1}명 (2-Strike 검증)`
          : `${contributorName} (총무·사진 인증)`,
      evidencePhotoUrl: submission.evidencePhotoUrl,
      strikeCount,
      updatedAt: nowIso,
    };
    await upsertMasterSpec(masterSpec);
  }

  return {
    ok: true,
    warnings: validation.warnings,
    submission,
    masterSpec,
    promotedReason,
    strikeCount,
  };
}

/**
 * 관리자 1초 승인 / 반려 / 직접 공식 확정
 */
export async function adminReviewCourseSpec(params: {
  action: 'APPROVE' | 'REJECT' | 'DIRECT_SAVE';
  submissionId?: string;
  reviewNote?: string;
  adminName?: string;
  // For DIRECT_SAVE:
  courseId?: string;
  courseName?: string;
  region?: string;
  totalCourses?: number;
  holesMetadata?: HoleMetadata[];
  evidencePhotoUrl?: string;
}): Promise<{
  ok: boolean;
  error?: string;
  masterSpec?: MasterCourseSpec;
  submission?: CourseSpecSubmission;
}> {
  const adminName = (params.adminName || '총괄 관리자').trim();
  const nowIso = new Date().toISOString();

  if (params.action === 'DIRECT_SAVE') {
    if (!params.courseId || !params.courseName || !params.totalCourses || !params.holesMetadata) {
      return { ok: false, error: '필수 구장 제원 정보가 누락되었습니다.' };
    }
    const validation = validateCourseSpecPayload({
      totalCourses: params.totalCourses,
      holesMetadata: params.holesMetadata,
    });
    if (!validation.valid) return { ok: false, error: validation.error };

    const totalCourses = Math.round(Number(params.totalCourses));
    const totalHoles = totalCourses * 9;
    const normalizedHoles = validation.normalizedHoles.map((h) => ({
      ...h,
      isVerified: true,
      contributedBy: `${adminName} (공식 확정)`,
    }));

    const masterSpec: MasterCourseSpec = {
      courseId: params.courseId,
      courseName: params.courseName.trim(),
      region: params.region,
      totalCourses,
      totalHoles,
      holesMetadata: normalizedHoles,
      specStatus: 'OFFICIAL_ADMIN',
      verifiedBy: `${adminName} (공식 확정)`,
      evidencePhotoUrl: params.evidencePhotoUrl,
      strikeCount: 99,
      updatedAt: nowIso,
    };
    await upsertMasterSpec(masterSpec);

    const sub: CourseSpecSubmission = {
      id: `spec_admin_${Date.now()}`,
      courseId: masterSpec.courseId,
      courseName: masterSpec.courseName,
      region: masterSpec.region,
      proposedTotalCourses: totalCourses,
      proposedTotalHoles: totalHoles,
      proposedHolesMetadata: normalizedHoles,
      signature: computeSpecSignature(totalCourses, normalizedHoles),
      evidencePhotoUrl: params.evidencePhotoUrl,
      source: 'ADMIN_DIRECT',
      contributorName: adminName,
      isExecutive: true,
      status: 'APPROVED',
      reviewNote: params.reviewNote || '관리자 직접 공식 확정',
      createdAt: nowIso,
      reviewedAt: nowIso,
    };
    await upsertSubmission(sub);

    return { ok: true, masterSpec, submission: sub };
  }

  // APPROVE or REJECT existing submission
  if (!params.submissionId) {
    return { ok: false, error: 'submissionId가 필요합니다.' };
  }
  const allSubs = await loadAllSubmissions();
  const target = allSubs.find((s) => s.id === params.submissionId);
  if (!target) {
    return { ok: false, error: '해당 제보 내역을 찾을 수 없습니다.' };
  }

  if (params.action === 'REJECT') {
    const updated: CourseSpecSubmission = {
      ...target,
      status: 'REJECTED',
      reviewNote: params.reviewNote || '관리자 반려',
      reviewedAt: nowIso,
    };
    await upsertSubmission(updated);
    return { ok: true, submission: updated };
  }

  // APPROVE -> Promote to OFFICIAL_ADMIN master spec!
  const updatedSub: CourseSpecSubmission = {
    ...target,
    status: 'APPROVED',
    reviewNote: params.reviewNote || `${adminName} 공식 승인`,
    reviewedAt: nowIso,
  };
  await upsertSubmission(updatedSub);

  const masterSpec: MasterCourseSpec = {
    courseId: target.courseId,
    courseName: target.courseName,
    region: target.region,
    totalCourses: target.proposedTotalCourses,
    totalHoles: target.proposedTotalHoles,
    holesMetadata: target.proposedHolesMetadata.map((h) => ({ ...h, isVerified: true })),
    specStatus: 'OFFICIAL_ADMIN',
    verifiedBy: `${target.contributorName} 제보 · ${adminName} 승인`,
    evidencePhotoUrl: target.evidencePhotoUrl,
    strikeCount: 99,
    updatedAt: nowIso,
  };
  await upsertMasterSpec(masterSpec);

  return { ok: true, masterSpec, submission: updatedSub };
}

/**
 * 전국 553개 구장 제원 점검 현황 집계 (관리자 대시보드용)
 */
export async function computeNationalSpecAudit(): Promise<{
  summary: CourseSpecAuditSummary;
  masterSpecs: Record<string, MasterCourseSpec>;
  submissions: CourseSpecSubmission[];
}> {
  const [masterSpecs, submissions] = await Promise.all([
    loadAllMasterSpecs(),
    loadAllSubmissions(),
  ]);

  let officialAdminCount = 0;
  let crowdVerifiedCount = 0;
  let unverifiedTemplateCount = 0;

  for (const c of DEFAULT_COURSES) {
    const master = masterSpecs[c.id];
    if (master?.specStatus === 'OFFICIAL_ADMIN') {
      officialAdminCount++;
    } else if (master?.specStatus === 'CROWD_VERIFIED') {
      crowdVerifiedCount++;
    } else if (isDummyTemplateCourse(c)) {
      unverifiedTemplateCount++;
    } else {
      crowdVerifiedCount++;
    }
  }

  const totalCourses = DEFAULT_COURSES.length;
  const verifiedTotal = officialAdminCount + crowdVerifiedCount;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING').length;

  return {
    summary: {
      totalCourses,
      officialAdminCount,
      crowdVerifiedCount,
      unverifiedTemplateCount,
      pendingSubmissionsCount,
      verifiedPercent: totalCourses > 0 ? Math.round((verifiedTotal / totalCourses) * 1000) / 10 : 0,
    },
    masterSpecs,
    submissions,
  };
}
