import { NextRequest, NextResponse } from 'next/server';
import {
  adminReviewCourseSpec,
  computeNationalSpecAudit,
  loadAllMasterSpecs,
  submitCourseSpecReport,
} from '@/lib/courseSpecServer';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeAdmin = searchParams.get('includeAdmin') === '1';

    if (includeAdmin) {
      const audit = await computeNationalSpecAudit();
      return NextResponse.json({
        success: true,
        summary: audit.summary,
        masterSpecs: audit.masterSpecs,
        submissions: audit.submissions,
      });
    }

    const masterSpecs = await loadAllMasterSpecs();
    return NextResponse.json({
      success: true,
      masterSpecs,
      count: Object.keys(masterSpecs).length,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '마스터 구장 제원 조회 오류' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.courseId || !body?.courseName || !body?.totalCourses || !Array.isArray(body?.holesMetadata)) {
      return NextResponse.json(
        { success: false, message: '구장 ID, 구장명, 코스 수, 홀별 제원 정보가 모두 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await submitCourseSpecReport({
      courseId: String(body.courseId),
      courseName: String(body.courseName),
      region: body.region ? String(body.region) : undefined,
      prevTotalCourses: typeof body.prevTotalCourses === 'number' ? body.prevTotalCourses : undefined,
      prevHolesMetadata: Array.isArray(body.prevHolesMetadata) ? body.prevHolesMetadata : undefined,
      totalCourses: Number(body.totalCourses),
      holesMetadata: body.holesMetadata,
      evidencePhotoUrl: typeof body.evidencePhotoUrl === 'string' ? body.evidencePhotoUrl : undefined,
      source: body.source || 'BATCH_EDIT',
      contributorName: body.contributorName ? String(body.contributorName) : '현장 골퍼',
      memberCode: body.memberCode ? String(body.memberCode) : undefined,
      isExecutive: Boolean(body.isExecutive),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      warnings: result.warnings || [],
      submission: result.submission,
      masterSpec: result.masterSpec,
      promotedReason: result.promotedReason,
      strikeCount: result.strikeCount,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '구장 제원 제보 처리 오류' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    if (action !== 'APPROVE' && action !== 'REJECT' && action !== 'DIRECT_SAVE') {
      return NextResponse.json({ success: false, message: '지원하지 않는 관리자 작업입니다.' }, { status: 400 });
    }

    const result = await adminReviewCourseSpec({
      action,
      submissionId: body.submissionId ? String(body.submissionId) : undefined,
      reviewNote: body.reviewNote ? String(body.reviewNote) : undefined,
      adminName: body.adminName ? String(body.adminName) : '총괄 관리자',
      courseId: body.courseId ? String(body.courseId) : undefined,
      courseName: body.courseName ? String(body.courseName) : undefined,
      region: body.region ? String(body.region) : undefined,
      totalCourses: typeof body.totalCourses === 'number' ? body.totalCourses : undefined,
      holesMetadata: Array.isArray(body.holesMetadata) ? body.holesMetadata : undefined,
      evidencePhotoUrl: typeof body.evidencePhotoUrl === 'string' ? body.evidencePhotoUrl : undefined,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      masterSpec: result.masterSpec,
      submission: result.submission,
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, message: e?.message || '관리자 제원 승인 처리 오류' },
      { status: 500 }
    );
  }
}
