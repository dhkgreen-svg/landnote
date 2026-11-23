import fs from 'fs';
import path from 'path';
import os from 'os';
import { getSupabaseClient } from '@/lib/serverMemberSync';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import {
  AutoScanDashboardStatus,
  CourseSpecAuditSummary,
  CourseSpecSource,
  CourseSpecSubmission,
  MasterCourseSpec,
  OnlineScanHistoryItem,
  computeSpecSignature,
  isDummyTemplateCourse,
  validateCourseSpecPayload,
} from '@/lib/courseSpecShared';
import { HoleMetadata } from '@/types/parkon';

const LOCAL_STORE_FILE = path.join(os.tmpdir(), 'parkon_course_master_specs_store_v1.json');

interface LocalSpecStore {
  masterSpecs: Record<string, MasterCourseSpec>;
  submissions: CourseSpecSubmission[];
  onlineScanHistory: Record<string, OnlineScanHistoryItem>;
  lastAutoScanRunAt?: string;
}

function getMemoryStore(): LocalSpecStore {
  const g = globalThis as any;
  if (!g.__parkonCourseSpecStore) {
    let loaded: LocalSpecStore = { masterSpecs: {}, submissions: {}, onlineScanHistory: {} } as any;
    loaded.submissions = [];
    try {
      if (fs.existsSync(LOCAL_STORE_FILE)) {
        const parsed = JSON.parse(fs.readFileSync(LOCAL_STORE_FILE, 'utf-8'));
        if (parsed && typeof parsed === 'object') {
          loaded = {
            masterSpecs: parsed.masterSpecs || {},
            submissions: Array.isArray(parsed.submissions) ? parsed.submissions : [],
            onlineScanHistory: parsed.onlineScanHistory || {},
            lastAutoScanRunAt: parsed.lastAutoScanRunAt,
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
          onlineScanHistory: store.onlineScanHistory || {},
          lastAutoScanRunAt: store.lastAutoScanRunAt,
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
            specStatus: row.spec_status === 'OFFICIAL_ADMIN' ? 'OFFICIAL_ADMIN' : row.spec_status === 'ONLINE_AUTO' ? 'ONLINE_AUTO' : 'CROWD_VERIFIED',
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
  promotedReason?: 'USER_FIELD_PRIORITY' | 'ONLINE_FULL_AUTO' | 'TWO_STRIKE' | 'EXECUTIVE_PHOTO' | null;
  skippedProtected?: boolean;
  strikeCount?: number;
}> {
  const validation = validateCourseSpecPayload({
    totalCourses: params.totalCourses,
    holesMetadata: params.holesMetadata,
  });
  if (!validation.valid) {
    return { ok: false, error: validation.error };
  }

  const allMasters = await loadAllMasterSpecs();
  const existingMaster = allMasters[params.courseId];
  const isOnlineAi = params.source === 'ONLINE_IMAGE_AI';

  // 🔒 [절대 원칙 1]: 이미 유저 현장 실입력(CROWD_VERIFIED) 또는 관리자 확정(OFFICIAL_ADMIN)이 있는 구장은 온라인 AI가 절대 덮어쓰지 못함!
  if (
    isOnlineAi &&
    existingMaster &&
    (existingMaster.specStatus === 'CROWD_VERIFIED' || existingMaster.specStatus === 'OFFICIAL_ADMIN')
  ) {
    return {
      ok: true,
      skippedProtected: true,
      masterSpec: existingMaster,
      promotedReason: null,
      strikeCount: existingMaster.strikeCount,
    };
  }

  const totalCourses = Math.round(Number(params.totalCourses));
  const totalHoles = totalCourses * 9;
  const contributorName = (params.contributorName || '현장 골퍼').trim() || '현장 골퍼';

  // 기존 실측 거리(distanceMeter > 0)가 있고 새 입력의 거리가 0('__m')이면 기존 실측 거리 보존!
  const prevHoleMap = new Map((existingMaster?.holesMetadata || []).map((h) => [Number(h.hole), h]));
  const normalizedHoles = validation.normalizedHoles.map((h) => {
    const prev = prevHoleMap.get(Number(h.hole));
    const mergedDist =
      Number(h.distanceMeter) > 0
        ? Number(h.distanceMeter)
        : Number(prev?.distanceMeter) > 0
          ? Number(prev!.distanceMeter)
          : 0;
    return {
      ...h,
      distanceMeter: mergedDist,
      isVerified: true,
      contributedBy: contributorName,
    };
  });

  const signature = computeSpecSignature(totalCourses, normalizedHoles);
  const nowIso = new Date().toISOString();
  const hasPhoto = Boolean(params.evidencePhotoUrl && params.evidencePhotoUrl.length > 40);

  // 🚀 [절대 원칙 2]: 완전자동 무인 반영!
  // - 유저 현장 실입력(isOnlineAi === false): 즉시 최우선 CROWD_VERIFIED로 전국 반영!
  // - 온라인 안내판 AI(isOnlineAi === true): 미점검 구장에 한해 즉시 ONLINE_AUTO로 전국 무인 반영!
  const promotedReason = isOnlineAi ? 'ONLINE_FULL_AUTO' : 'USER_FIELD_PRIORITY';
  const nextStatus: MasterCourseSpec['specStatus'] = isOnlineAi ? 'ONLINE_AUTO' : 'CROWD_VERIFIED';

  const submission: CourseSpecSubmission = {
    id: `spec_sub_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    courseId: params.courseId,
    courseName: params.courseName.trim(),
    region: params.region,
    prevTotalCourses: existingMaster?.totalCourses ?? params.prevTotalCourses,
    prevHolesMetadata: existingMaster?.holesMetadata ?? params.prevHolesMetadata,
    proposedTotalCourses: totalCourses,
    proposedTotalHoles: totalHoles,
    proposedHolesMetadata: normalizedHoles,
    signature,
    evidencePhotoUrl: hasPhoto ? params.evidencePhotoUrl : undefined,
    source: params.source || 'BATCH_EDIT',
    contributorName,
    memberCode: params.memberCode,
    isExecutive: Boolean(params.isExecutive),
    status: 'AUTO_PROMOTED',
    reviewNote: isOnlineAi
      ? '🌐 온라인 안내판 AI 무인 자동 반영 (현장 유저 실입력 시 즉시 우선 덮어씀)'
      : '🥇 유저 현장 실입력 최우선 즉시 전국 반영',
    createdAt: nowIso,
    reviewedAt: nowIso,
  };

  await upsertSubmission(submission);

  const masterSpec: MasterCourseSpec = {
    courseId: submission.courseId,
    courseName: submission.courseName,
    region: submission.region,
    totalCourses,
    totalHoles,
    holesMetadata: normalizedHoles,
    specStatus: nextStatus,
    verifiedBy: isOnlineAi ? '온라인 안내판 AI 자동반영' : `${contributorName} (현장 실입력)`,
    evidencePhotoUrl: submission.evidencePhotoUrl || existingMaster?.evidencePhotoUrl,
    strikeCount: isOnlineAi ? 1 : (existingMaster?.strikeCount || 0) + 1,
    updatedAt: nowIso,
  };
  await upsertMasterSpec(masterSpec);

  return {
    ok: true,
    warnings: validation.warnings,
    submission,
    masterSpec,
    promotedReason,
    strikeCount: masterSpec.strikeCount,
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
  let onlineAutoCount = 0;
  let unverifiedTemplateCount = 0;

  for (const c of DEFAULT_COURSES) {
    const master = masterSpecs[c.id];
    if (master?.specStatus === 'OFFICIAL_ADMIN') {
      officialAdminCount++;
    } else if (master?.specStatus === 'CROWD_VERIFIED') {
      crowdVerifiedCount++;
    } else if (master?.specStatus === 'ONLINE_AUTO') {
      onlineAutoCount++;
    } else if (isDummyTemplateCourse(c)) {
      unverifiedTemplateCount++;
    } else {
      crowdVerifiedCount++;
    }
  }

  const totalCourses = DEFAULT_COURSES.length;
  const verifiedTotal = officialAdminCount + crowdVerifiedCount + onlineAutoCount;
  const pendingSubmissionsCount = submissions.filter((s) => s.status === 'PENDING').length;

  return {
    summary: {
      totalCourses,
      officialAdminCount,
      crowdVerifiedCount,
      onlineAutoCount,
      unverifiedTemplateCount,
      pendingSubmissionsCount,
      verifiedPercent: totalCourses > 0 ? Math.round((verifiedTotal / totalCourses) * 1000) / 10 : 0,
    },
    masterSpecs,
    submissions,
  };
}

const COOLDOWN_30D_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * 2단계 스마트 주기 엔진:
 * - 미점검 구장(더미 템플릿) 중 ① 이미 검증된 구장 제외, ② 대기열(PENDING) 구장 제외, ③ 최근 30일 내 자료없음(NO_DATA_COOLDOWN) 구장 제외
 * - 남은 대상이 1곳 이상이면 PHASE_1_DAILY_CONQUEST (일 15곳 순차 정복)
 * - 남은 대상이 0곳이면 PHASE_2_MONTHLY_RADAR (완주 후 매월 1일 유지관리 모드 자동 전환!)
 */
export async function getAutoScanStatusAndNextBatch(batchSize = 15) {
  const store = getMemoryStore();
  const [masterSpecs, submissions] = await Promise.all([
    loadAllMasterSpecs(),
    loadAllSubmissions(),
  ]);

  const pendingCourseIds = new Set(
    submissions.filter((s) => s.status === 'PENDING').map((s) => s.courseId)
  );

  const now = Date.now();
  let cooldown30dCount = 0;
  const eligible = [];

  for (const c of DEFAULT_COURSES) {
    if (masterSpecs[c.id]) continue; // 이미 공식 확정 또는 집단지성 검증 완료 -> 영구 제외!
    if (!isDummyTemplateCourse(c)) continue; // 고유 실측 제원 구장 -> 제외!
    if (pendingCourseIds.has(c.id)) continue; // 이미 승인 대기 중 -> 중복 제외!

    const hist = store.onlineScanHistory?.[c.id];
    if (hist && hist.outcome === 'NO_DATA_COOLDOWN') {
      const elapsed = now - new Date(hist.lastScannedAt).getTime();
      if (elapsed < COOLDOWN_30D_MS) {
        cooldown30dCount++;
        continue; // 30일 쿨다운 중 -> 중복 호출 차단!
      }
    }
    eligible.push(c);
  }

  const status: AutoScanDashboardStatus = {
    lifecycleMode: eligible.length > 0 ? 'PHASE_1_DAILY_CONQUEST' : 'PHASE_2_MONTHLY_RADAR',
    dailyBatchSize: 15,
    eligibleUnverifiedCount: eligible.length,
    cooldown30dCount,
    pendingQueueCount: pendingCourseIds.size,
    lastRunAt: store.lastAutoScanRunAt,
  };

  return {
    status,
    nextBatch: eligible.slice(0, Math.max(1, batchSize)),
  };
}

export async function recordOnlineScanOutcome(item: {
  courseId: string;
  courseName: string;
  outcome: 'QUEUED' | 'NO_DATA_COOLDOWN';
  sourceUrl?: string;
  note?: string;
}): Promise<void> {
  const store = getMemoryStore();
  const nowIso = new Date().toISOString();
  store.onlineScanHistory = store.onlineScanHistory || {};
  store.onlineScanHistory[item.courseId] = {
    courseId: item.courseId,
    courseName: item.courseName,
    lastScannedAt: nowIso,
    outcome: item.outcome,
    sourceUrl: item.sourceUrl,
    note: item.note,
  };
  store.lastAutoScanRunAt = nowIso;
  persistMemoryStore(store);
}
