'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Edit3,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  XCircle,
  ZoomIn,
} from 'lucide-react';
import { DEFAULT_COURSES } from '@/lib/defaultCourses';
import { Course } from '@/types/parkon';
import { useBackHandler } from '@/lib/backNavigation';
import {
  COURSE_LETTERS_12,
  CourseSpecAuditSummary,
  CourseSpecStatus,
  CourseSpecSubmission,
  MasterCourseSpec,
  getCourseParBreakdown,
  getCourseSpecBadge,
  isDummyTemplateCourse,
} from '@/lib/courseSpecShared';
import {
  adminActionCourseSpec,
  fetchAdminCourseSpecDashboard,
} from '@/lib/courseSpecClient';
import { CourseSpecVerifyModal } from '@/components/CourseSpecVerifyModal';

interface AdminCourseSpecReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  popularCourseIds?: string[];
}

export function AdminCourseSpecReviewModal({
  isOpen,
  onClose,
  popularCourseIds = [],
}: AdminCourseSpecReviewModalProps) {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'COURSES'>('QUEUE');
  const [queueFilter, setQueueFilter] = useState<'PENDING' | 'ALL'>('PENDING');
  const [courseFilter, setCourseFilter] = useState<'UNVERIFIED' | 'OFFICIAL' | 'CROWD' | 'ALL'>('UNVERIFIED');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [summary, setSummary] = useState<CourseSpecAuditSummary | null>(null);
  const [masterSpecs, setMasterSpecs] = useState<Record<string, MasterCourseSpec>>({});
  const [submissions, setSubmissions] = useState<CourseSpecSubmission[]>([]);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);
  const [directEditCourse, setDirectEditCourse] = useState<Course | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useBackHandler(isOpen, onClose);
  useBackHandler(Boolean(zoomPhotoUrl), () => setZoomPhotoUrl(null));

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetchAdminCourseSpecDashboard();
      if (res.success) {
        if (res.summary) setSummary(res.summary);
        if (res.masterSpecs) setMasterSpecs(res.masterSpecs);
        if (res.submissions) setSubmissions(res.submissions);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadDashboard();
    }
  }, [isOpen]);

  const showToastMsg = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleReviewAction = async (submissionId: string, action: 'APPROVE' | 'REJECT') => {
    setBusyId(submissionId);
    try {
      const res = await adminActionCourseSpec({
        action,
        submissionId,
        adminName: '대표님 (총괄 관제)',
      });
      if (res.success) {
        showToastMsg(
          action === 'APPROVE'
            ? '✅ 공식 제원으로 승인 완료! 전국 모든 파키 앱 사용자에게 즉시 반영됩니다.'
            : '❌ 해당 제보를 반려 처리했습니다.'
        );
        await loadDashboard();
      } else {
        showToastMsg(`⚠️ ${res.message || '처리 실패'}`);
      }
    } finally {
      setBusyId(null);
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => (queueFilter === 'PENDING' ? s.status === 'PENDING' : true));
  }, [submissions, queueFilter]);

  const popularRankMap = useMemo(() => {
    const m = new Map<string, number>();
    popularCourseIds.forEach((id, idx) => m.set(id, idx));
    return m;
  }, [popularCourseIds]);

  const enrichedCourses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = DEFAULT_COURSES.map((base) => {
      const master = masterSpecs[base.id];
      const status: CourseSpecStatus =
        master?.specStatus === 'OFFICIAL_ADMIN'
          ? 'OFFICIAL_ADMIN'
          : master?.specStatus === 'CROWD_VERIFIED'
            ? 'CROWD_VERIFIED'
            : isDummyTemplateCourse(base)
              ? 'UNVERIFIED_TEMPLATE'
              : 'CROWD_VERIFIED';

      const merged: Course = master
        ? {
            ...base,
            totalCourses: master.totalCourses,
            totalHoles: master.totalHoles,
            holesMetadata: master.holesMetadata,
            isSpecsVerified: true,
            specStatus: master.specStatus,
            specContributorName: master.verifiedBy,
            specUpdatedAt: master.updatedAt,
          }
        : { ...base, specStatus: status };

      return { course: merged, status, popIdx: popularRankMap.get(base.id) ?? 9999 };
    });

    return list
      .filter((item) => {
        if (courseFilter === 'UNVERIFIED' && item.status !== 'UNVERIFIED_TEMPLATE') return false;
        if (courseFilter === 'OFFICIAL' && item.status !== 'OFFICIAL_ADMIN') return false;
        if (courseFilter === 'CROWD' && item.status !== 'CROWD_VERIFIED') return false;
        if (q) {
          const hit =
            item.course.name.toLowerCase().includes(q) ||
            (item.course.region || '').toLowerCase().includes(q);
          if (!hit) return false;
        }
        return true;
      })
      .sort((a, b) => a.popIdx - b.popIdx || a.course.name.localeCompare(b.course.name, 'ko'));
  }, [masterSpecs, courseFilter, searchQuery, popularRankMap]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="modal-admin-course-spec-review"
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] shadow-2xl border border-stone-200 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-stone-900 text-white p-4 sm:p-5 flex items-center justify-between gap-2 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="font-black text-base sm:text-lg tracking-tight">
                ⛳ 전국 구장 제원 점검 · 1초 승인 관제
              </h3>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              현장 제보 Diff + 증빙 사진 검수 ➔ 승인 즉시 전국 파키 앱 회원에게 실시간 반영
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={loadDashboard}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary KPI Bar */}
        {summary && (
          <div className="p-3.5 bg-stone-50 border-b border-stone-200 space-y-2.5 shrink-0">
            <div className="grid grid-cols-4 gap-2">
              <div className="bg-white rounded-xl p-2 border border-emerald-200 text-center">
                <div className="text-[10px] font-bold text-stone-500">공식 확정</div>
                <div className="text-base font-black text-emerald-700">{summary.officialAdminCount}곳</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-sky-200 text-center">
                <div className="text-[10px] font-bold text-stone-500">실측 검증</div>
                <div className="text-base font-black text-sky-700">{summary.crowdVerifiedCount}곳</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-amber-200 text-center">
                <div className="text-[10px] font-bold text-stone-500">미점검(템플릿)</div>
                <div className="text-base font-black text-amber-600">{summary.unverifiedTemplateCount}곳</div>
              </div>
              <div className="bg-white rounded-xl p-2 border border-rose-200 text-center">
                <div className="text-[10px] font-bold text-stone-500">승인 대기</div>
                <div
                  data-testid="admin-pending-submissions-count"
                  className="text-base font-black text-rose-600"
                >
                  {summary.pendingSubmissionsCount}건
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-black text-stone-700">
                <span>전국 {summary.totalCourses}개 구장 실측 정복률</span>
                <span className="text-emerald-700">{summary.verifiedPercent}%</span>
              </div>
              <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 transition-all"
                  style={{ width: `${Math.min(100, Math.max(2, summary.verifiedPercent))}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div className="mx-3.5 mt-2.5 p-2.5 rounded-xl bg-emerald-900 text-white text-xs font-black text-center">
            {toast}
          </div>
        )}

        {/* Tabs */}
        <div className="px-3.5 pt-3 flex gap-2 shrink-0">
          <button
            type="button"
            data-testid="tab-admin-spec-queue"
            onClick={() => setActiveTab('QUEUE')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 cursor-pointer transition ${
              activeTab === 'QUEUE'
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : 'bg-white border-stone-200 text-stone-600'
            }`}
          >
            📥 제보 승인 대기열 ({summary?.pendingSubmissionsCount ?? 0}건)
          </button>
          <button
            type="button"
            data-testid="tab-admin-spec-courses"
            onClick={() => setActiveTab('COURSES')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black border-2 cursor-pointer transition ${
              activeTab === 'COURSES'
                ? 'bg-emerald-700 border-emerald-700 text-white'
                : 'bg-white border-stone-200 text-stone-600'
            }`}
          >
            🔍 전국 구장 검색 · 직접 확정 ({DEFAULT_COURSES.length}곳)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-3 overscroll-contain">
          {activeTab === 'QUEUE' ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQueueFilter('PENDING')}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      queueFilter === 'PENDING' ? 'bg-rose-600 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    승인 대기만
                  </button>
                  <button
                    type="button"
                    onClick={() => setQueueFilter('ALL')}
                    className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                      queueFilter === 'ALL' ? 'bg-stone-800 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    전체 이력 ({submissions.length})
                  </button>
                </div>
              </div>

              {filteredSubmissions.length === 0 ? (
                <div className="py-10 text-center bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                  <div className="text-2xl">✨</div>
                  <div className="text-sm font-black text-stone-700">
                    {queueFilter === 'PENDING' ? '승인 대기 중인 구장 제보가 없습니다.' : '아직 접수된 제보 이력이 없습니다.'}
                  </div>
                  <div className="text-xs text-stone-500">
                    오른쪽 [전국 구장 검색 · 직접 확정] 탭에서 인기 구장을 직접 공식 확정할 수도 있습니다.
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredSubmissions.map((sub) => {
                    const prevMap = new Map((sub.prevHolesMetadata || []).map((h) => [Number(h.hole), h]));
                    const changedPars = sub.proposedHolesMetadata
                      .filter((h) => {
                        const prev = prevMap.get(Number(h.hole));
                        return !prev || Number(prev.par) !== Number(h.par);
                      })
                      .slice(0, 12);
                    const breakdown = getCourseParBreakdown(sub.proposedTotalCourses, sub.proposedHolesMetadata);
                    const isPending = sub.status === 'PENDING';

                    return (
                      <div
                        key={sub.id}
                        data-testid={`submission-card-${sub.id}`}
                        className="rounded-2xl border-2 border-stone-200 bg-white p-3.5 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-black text-sm text-stone-900">{sub.courseName}</span>
                              <span
                                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                  sub.status === 'PENDING'
                                    ? 'bg-rose-100 text-rose-700'
                                    : sub.status === 'APPROVED'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : sub.status === 'AUTO_PROMOTED'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-stone-200 text-stone-600'
                                }`}
                              >
                                {sub.status === 'PENDING'
                                  ? '승인 대기'
                                  : sub.status === 'APPROVED'
                                    ? '공식 승인됨'
                                    : sub.status === 'AUTO_PROMOTED'
                                      ? '자동 승격됨'
                                      : '반려됨'}
                              </span>
                              {sub.isExecutive && (
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                  👑 총무·임원
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                              제보자: {sub.contributorName} · 코스:{' '}
                              <span className="text-stone-400">{sub.prevTotalCourses || '?'}코스</span> ➔{' '}
                              <span className="text-emerald-700 font-black">
                                {sub.proposedTotalCourses}코스({sub.proposedTotalHoles}홀)
                              </span>
                            </div>
                          </div>

                          {sub.evidencePhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setZoomPhotoUrl(sub.evidencePhotoUrl!)}
                              className="relative w-16 h-12 rounded-xl overflow-hidden border-2 border-emerald-400 shrink-0 cursor-pointer group"
                              title="증빙 사진 크게 보기"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={sub.evidencePhotoUrl} alt="증빙" className="w-full h-full object-cover" />
                              <span className="absolute inset-0 bg-black/30 flex items-center justify-center text-white opacity-90">
                                <ZoomIn className="w-4 h-4" />
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Course Par Breakdown */}
                        <div className="flex flex-wrap gap-1">
                          {breakdown.map((b) => (
                            <span
                              key={b.courseLetter}
                              className={`text-[10.5px] font-black px-2 py-0.5 rounded-lg border ${
                                b.isStandard33
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : 'bg-amber-50 border-amber-300 text-amber-900'
                              }`}
                            >
                              {b.courseLetter}코스 {b.parSum}타
                            </span>
                          ))}
                        </div>

                        {/* Diff Chips */}
                        {changedPars.length > 0 && (
                          <div className="bg-stone-50 rounded-xl p-2 space-y-1">
                            <div className="text-[10px] font-black text-stone-500">
                              파수 변경 Diff (최대 12홀 표시)
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {changedPars.map((h) => {
                                const prev = prevMap.get(Number(h.hole));
                                const cIdx = Math.floor((Number(h.hole) - 1) / 9);
                                const label = `${COURSE_LETTERS_12[cIdx] || cIdx + 1}-${((Number(h.hole) - 1) % 9) + 1}`;
                                return (
                                  <span
                                    key={h.hole}
                                    className="text-[10px] font-black px-1.5 py-0.5 rounded bg-white border border-rose-200 text-stone-800"
                                  >
                                    {label}:{' '}
                                    <span className="text-stone-400 line-through">P{prev?.par ?? '-'}</span>➔
                                    <span className="text-rose-600">P{h.par}</span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {isPending && (
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button
                              type="button"
                              data-testid={`btn-approve-sub-${sub.id}`}
                              disabled={busyId === sub.id}
                              onClick={() => handleReviewAction(sub.id, 'APPROVE')}
                              className="py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-4 h-4 text-amber-300" />
                              <span>✅ 승인 · 전국 즉시 반영</span>
                            </button>
                            <button
                              type="button"
                              data-testid={`btn-reject-sub-${sub.id}`}
                              disabled={busyId === sub.id}
                              onClick={() => handleReviewAction(sub.id, 'REJECT')}
                              className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black text-xs flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>❌ 반려</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Search + Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    data-testid="input-admin-course-search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="구장명 또는 지역 검색 (예: 해평, 동락, 수성, 구미...)"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-900"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {(
                    [
                      ['UNVERIFIED', '⚠️ 미점검 우선'],
                      ['OFFICIAL', '✅ 공식 확정'],
                      ['CROWD', '🤝 실측 검증'],
                      ['ALL', '전체'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCourseFilter(key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black cursor-pointer ${
                        courseFilter === key ? 'bg-emerald-700 text-white' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                {enrichedCourses.slice(0, 60).map(({ course, status }) => {
                  const badge = getCourseSpecBadge(status);
                  return (
                    <div
                      key={course.id}
                      className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-black text-xs sm:text-sm text-stone-900 truncate">
                            {course.name}
                          </span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                              badge.tone === 'emerald'
                                ? 'bg-emerald-100 text-emerald-800'
                                : badge.tone === 'blue'
                                  ? 'bg-sky-100 text-sky-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {badge.shortLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 font-bold mt-0.5">
                          {course.region} · {course.totalCourses || Math.round(course.totalHoles / 9)}코스 ({course.totalHoles}홀)
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`btn-admin-direct-edit-${course.id}`}
                        onClick={() => setDirectEditCourse(course)}
                        className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-black flex items-center gap-1 shrink-0 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-300" />
                        <span>직접 확정</span>
                      </button>
                    </div>
                  );
                })}
                {enrichedCourses.length > 60 && (
                  <div className="text-center text-[11px] text-stone-500 py-2">
                    상위 60개 구장 표시 중 — 검색어로 원하는 구장을 바로 찾아보세요.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 증빙 사진 확대 팝업 */}
      {zoomPhotoUrl && (
        <div
          onClick={() => setZoomPhotoUrl(null)}
          className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4"
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-lg w-full space-y-2">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setZoomPhotoUrl(null)}
                className="px-3 py-1.5 rounded-xl bg-white/20 text-white text-xs font-black cursor-pointer"
              >
                ✕ 닫기
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={zoomPhotoUrl} alt="증빙 사진 확대" className="w-full rounded-2xl border-2 border-white/30" />
          </div>
        </div>
      )}

      {/* 관리자 직접 공식 확정 모달 */}
      <CourseSpecVerifyModal
        isOpen={Boolean(directEditCourse)}
        course={directEditCourse}
        mode="ADMIN"
        initialSource="ADMIN_DIRECT"
        onClose={() => setDirectEditCourse(null)}
        onUpdated={(_, msg) => {
          showToastMsg(msg);
          loadDashboard();
        }}
      />
    </div>
  );
}
