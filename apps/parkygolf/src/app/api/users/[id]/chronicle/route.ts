import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = params.id || 'self';

  // Chronicle Clean Data Structure (실제 기록 기반)
  const chronicleData = {
    userId,
    userName: '김대희',
    careerStartDate: null,
    firstCourse: null,
    stats: {
      totalRounds: 0,
      totalHoles: 0,
      lifetimeBestScore: null,
      lifetimeBestCourse: null,
      averageStrokes18: null,
      totalHoleInOnes: 0,
      totalEagles: 0,
      totalBirdies: 0,
    },
    topCompanions: [],
    conqueredCourses: [],
    achievements: [],
    timeline: [],
  };

  return NextResponse.json(chronicleData);
}
