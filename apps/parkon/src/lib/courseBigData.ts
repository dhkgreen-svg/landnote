'use client';

export interface CourseBigDataPayload {
  eventType: 'HOLE_SPEC_EDIT' | 'COURSE_INFO_EDIT' | 'ADD_ZONE_COURSE';
  courseId: string;
  courseName: string;
  aliases?: string[];
  region?: string;
  totalCourses?: number;
  totalHoles?: number;
  holeNumber?: number;
  courseLetter?: string;
  holeInCourse?: number;
  par?: number;
  distanceMeter?: number;
  contributorName?: string;
}

/**
 * 구장명·별칭·코스 수·구역 분리·홀별 파수/거리 수정 내역을
 * 공용 빅데이터 수집 API(/api/course/specs-log)로 비동기 전송합니다.
 * (나만의 공략집/공략메모는 개인 비공개 원칙에 따라 절대 전송하지 않음)
 */
export function reportCourseBigDataLog(payload: CourseBigDataPayload): void {
  if (typeof window === 'undefined') return;
  try {
    const memberCode = localStorage.getItem('parkon_member_code_v1') || undefined;
    fetch('/api/course/specs-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, memberCode }),
      keepalive: true,
    }).catch(() => {
      // silent background fail — never block user flow
    });
  } catch {
    // ignore
  }
}

/**
 * 구장명 + 별칭 + 지역 통합 검색 매칭 헬퍼
 */
export function matchesCourseAliases(aliases: string[] | undefined, queryLower: string): boolean {
  if (!Array.isArray(aliases) || aliases.length === 0 || !queryLower) return false;
  const noSpaceQ = queryLower.replace(/\s+/g, '');
  return aliases.some((alias) => {
    const a = (alias || '').toLowerCase();
    return a.includes(queryLower) || a.replace(/\s+/g, '').includes(noSpaceQ);
  });
}
