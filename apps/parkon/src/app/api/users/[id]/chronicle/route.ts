import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id || 'self';

  // Chronicle Aggregation Data Structure
  const chronicleData = {
    userId,
    userName: '김대희',
    careerStartDate: '2024-03-15',
    firstCourse: '구미 동락 파크골프장 (A코스)',
    stats: {
      totalRounds: 38,
      totalHoles: 684,
      lifetimeBestScore: 54, // -6 언더파
      lifetimeBestCourse: '구미 동락 파크골프장',
      averageStrokes18: 59.4,
      totalHoleInOnes: 2,
      totalEagles: 7,
      totalBirdies: 42,
    },
    topCompanions: [
      { id: 'comp_1', name: '이영호', count: 14, lastCourse: '구미 동락 구장', memo: '드라이버 굿샷 파트너' },
      { id: 'comp_2', name: '박철수', count: 9, lastCourse: '구미 양호 구장', memo: '어프로치 명수' },
      { id: 'comp_3', name: '정순자', count: 7, lastCourse: '구미 지산 구장', memo: '주말 오전 동반' },
    ],
    conqueredCourses: [
      { id: 'course-gumi-dongrak', name: '구미 동락 파크골프장', region: '경북', holes: 36, visits: 22, bestScore: 54 },
      { id: 'course-gumi-yangho', name: '구미 양호 파크골프장', region: '경북', holes: 36, visits: 9, bestScore: 57 },
      { id: 'course-gumi-jisan', name: '구미 지산 파크골프장', region: '경북', holes: 63, visits: 5, bestScore: 59 },
      { id: 'course-daegu-suseong', name: '대구 수성 파크골프장', region: '대구', holes: 27, visits: 2, bestScore: 61 },
    ],
    achievements: [
      { id: 'ach_1', title: '첫 홀인원의 영광 ⛳', date: '2024-08-20', course: '구미 동락 A-3홀 (42m)', desc: '그림 같은 티샷으로 1타 홀인원 달성' },
      { id: 'ach_2', title: '라이프타임 최저타 54타 🏆', date: '2025-05-12', course: '구미 동락 파크골프장', desc: '18홀 합계 -6 언더파 클럽 신기록' },
      { id: 'ach_3', title: '구미 3대 명문구장 완주 훈장', date: '2025-09-03', course: '동락·양호·지산 3대 구장', desc: '지역 메이저 구장 전 코스 스탬프 완주' },
    ],
    timeline: [
      { id: 'tl_1', date: '2026-09-15', courseName: '구미 동락 파크골프장', holes: 18, strokes: 57, companions: ['이영호', '박철수', '정순자'], rank: 1 },
      { id: 'tl_2', date: '2026-09-12', courseName: '구미 양호 파크골프장', holes: 18, strokes: 60, companions: ['이영호', '최명길'], rank: 2 },
      { id: 'tl_3', date: '2026-09-08', courseName: '구미 지산 파크골프장', holes: 36, strokes: 118, companions: ['박철수', '정순자'], rank: 1 },
    ],
  };

  return NextResponse.json(chronicleData);
}
