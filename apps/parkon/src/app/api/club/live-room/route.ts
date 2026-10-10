import { NextRequest, NextResponse } from 'next/server';
import { ClubEventRoom, ClubPlayer, ClubGroup } from '@/types/club';

// 10인 모의 정기전 데이터
const MEMBERS = [
  { id: 'mem_1', name: '김총무(조장1)', role: 'MANAGER', gender: 'M' as const },
  { id: 'mem_2', name: '강호동', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_3', name: '유재석', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_4', name: '송지효', role: 'MEMBER', gender: 'F' as const },
  { id: 'mem_5', name: '하동훈(조장2)', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_6', name: '신동엽', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_7', name: '이수근', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_8', name: '서장훈(조장3)', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_9', name: '김희철', role: 'MEMBER', gender: 'M' as const },
  { id: 'mem_10', name: '조세호', role: 'MEMBER', gender: 'M' as const },
];

const HOLE_PARS: Record<number, number> = {
  1: 3, 2: 4, 3: 3, 4: 5, 5: 3, 6: 4, 7: 3, 8: 4, 9: 4
};

function getRoomStateForStep(step: number): ClubEventRoom {
  const baseRoom: ClubEventRoom = {
    id: 'tourney-10p-live',
    title: '2026 가을맞이 클럽 10인 친선 정기전',
    courseId: 'course-gumi-dongrak',
    courseName: '구미 동락 파크골프장 A코스',
    hostName: '김총무(조장1)',
    selectedCourseLetters: ['A'],
    totalHoles: 9,
    targetTotalPlayers: 10,
    gameMode: 'NEW_PERIO',
    gameModeTitle: '신페리오 방식 (핸디캡 적용)',
    hiddenHolesHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sealedSecret: 'eyJob2xlcyI6WzMsNiw4XSwic2FsdCI6InBhcmtpMjAyNiJ9',
    isUnsealed: false,
    unsealedHoles: [],
    waitingPool: [],
    groups: [],
    status: 'RECRUITING',
    createdAt: '2026-10-09T21:40:00.000Z'
  };

  if (step === 1) {
    // [1단계: 모집/출석 확인] (10명 전원 출석 대기실 입장, 아직 조 번호 없음)
    baseRoom.waitingPool = MEMBERS.map((m, idx) => ({
      id: m.id,
      name: m.name,
      isLeader: idx === 0,
      scores: {},
      totalStrokes: 0,
      parDiff: 0,
      holesCompleted: 0,
      gender: m.gender,
      handicapTier: 'INTERMEDIATE'
    }));
    baseRoom.groups = [];
    baseRoom.groupingStatus = 'WAITING';
    baseRoom.groupingConfirmed = false;
    baseRoom.status = 'RECRUITING';
    return baseRoom;
  }

  // 3개 조 구성 (1조 4인, 2조 3인, 3조 3인)
  const group1Players: ClubPlayer[] = MEMBERS.slice(0, 4).map((m, idx) => ({
    id: m.id,
    name: m.name,
    isLeader: idx === 0,
    scores: {},
    totalStrokes: 0,
    parDiff: 0,
    holesCompleted: 0,
    gender: m.gender,
    handicapTier: 'INTERMEDIATE'
  }));

  const group2Players: ClubPlayer[] = MEMBERS.slice(4, 7).map((m, idx) => ({
    id: m.id,
    name: m.name,
    isLeader: idx === 0,
    scores: {},
    totalStrokes: 0,
    parDiff: 0,
    holesCompleted: 0,
    gender: m.gender,
    handicapTier: 'INTERMEDIATE'
  }));

  const group3Players: ClubPlayer[] = MEMBERS.slice(7, 10).map((m, idx) => ({
    id: m.id,
    name: m.name,
    isLeader: idx === 0,
    scores: {},
    totalStrokes: 0,
    parDiff: 0,
    holesCompleted: 0,
    gender: m.gender,
    handicapTier: 'INTERMEDIATE'
  }));

  const groups: ClubGroup[] = [
    { groupNumber: 1, name: '1조 (4인)', startCourseLetter: 'A', leaderName: group1Players[0].name, players: group1Players, status: 'WAITING' },
    { groupNumber: 2, name: '2조 (3인)', startCourseLetter: 'A', leaderName: group2Players[0].name, players: group2Players, status: 'WAITING' },
    { groupNumber: 3, name: '3조 (3인)', startCourseLetter: 'A', leaderName: group3Players[0].name, players: group3Players, status: 'WAITING' }
  ];

  baseRoom.groups = groups;
  baseRoom.waitingPool = [];

  if (step === 2) {
    // [2단계: 스마트 조 편성 실행 & 가편성 결과 미리보기] (총무만 미리보기, 회원은 아직 대기실)
    baseRoom.groupingStatus = 'PREVIEW';
    baseRoom.groupingConfirmed = false;
    baseRoom.status = 'RECRUITING';
    return baseRoom;
  }

  // 3단계: 조 편성 최종 확정 완료 (회원 화면 2조 배정 안내 전환, 경기 시작 전 대기)
  baseRoom.groupingStatus = 'CONFIRMED';
  baseRoom.groupingConfirmed = true;
  baseRoom.status = 'GROUPED';

  if (step === 3) {
    return baseRoom;
  }

  // 4단계 & 5단계: 타수 입력 진행 (1~9번 홀)
  // 박진감 넘치는 점수 분포 (동타 백카운트 검증 포함)
  for (let hole = 1; hole <= 9; hole++) {
    const par = HOLE_PARS[hole];
    groups.forEach((grp, gIdx) => {
      grp.players.forEach((p) => {
        let stroke = par;
        if (p.name === '하동훈(조장2)') {
          stroke = hole === 9 ? par - 1 : par; // 9번홀 버디
        } else if (p.name === '서장훈(조장3)') {
          stroke = hole === 8 ? par - 1 : par; // 8번홀 버디
        } else if (p.name === '강호동') {
          stroke = hole === 1 ? par - 1 : par; // 1번홀 버디
        } else {
          const delta = ((p.name.charCodeAt(0) * hole + gIdx) % 3) - 1;
          stroke = Math.max(1, par + delta);
        }
        p.scores[hole] = stroke;
        p.totalStrokes = Object.values(p.scores).reduce((a, b) => a + b, 0);
        p.parDiff = p.totalStrokes - Object.keys(p.scores).reduce((acc, h) => acc + HOLE_PARS[Number(h)], 0);
        p.holesCompleted = Object.keys(p.scores).length;
      });
    });
  }

  if (step === 4) {
    // 4단계: 9홀 전 홀 타수 입력 완료 및 전광판 집계 상태 (신페리오 봉인 유지)
    return baseRoom;
  }

  // 5단계: 신페리오 봉인 해제 및 최종 시상 확정
  baseRoom.isUnsealed = true;
  baseRoom.unsealedHoles = [3, 6, 8];
  baseRoom.status = 'FINISHED';
  return baseRoom;
}

// 글로벌 인메모리 보관소
const getLiveMap = (): Map<string, { room: ClubEventRoom; step: number }> => {
  const g = globalThis as any;
  if (!g.__pakiLiveClubRooms) {
    g.__pakiLiveClubRooms = new Map();
  }
  return g.__pakiLiveClubRooms;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || 'tourney-10p-live';
  const stepParam = searchParams.get('step');
  const liveMap = getLiveMap();

  let entry = liveMap.get(id);

  if (stepParam) {
    const stepNum = parseInt(stepParam, 10);
    if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 5) {
      const room = getRoomStateForStep(stepNum);
      entry = { room, step: stepNum };
      liveMap.set(id, entry);
      return NextResponse.json({ success: true, room, step: stepNum });
    }
  }

  if (!entry) {
    // 기본적으로 1단계 상태로 시작
    const room = getRoomStateForStep(1);
    entry = { room, step: 1 };
    liveMap.set(id, entry);
  }

  return NextResponse.json({ success: true, room: entry.room, step: entry.step });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const liveMap = getLiveMap();
    const roomId = body.roomId || (body.room && body.room.id) || 'tourney-10p-live';

    if (body.action === 'START_MATCH') {
      let entry = liveMap.get(roomId);
      if (!entry) {
        const room = getRoomStateForStep(3);
        entry = { room, step: 3 };
      }
      entry.room.status = 'PLAYING';
      entry.room.groupingStatus = 'CONFIRMED';
      entry.room.groupingConfirmed = true;
      if (body.groups && body.groups.length > 0) {
        entry.room.groups = body.groups;
        entry.room.waitingPool = [];
      }
      entry.room.groups.forEach((g) => {
        g.status = 'PLAYING';
      });
      entry.step = 4;
      liveMap.set(roomId, entry);
      return NextResponse.json({ success: true, room: entry.room, message: '경기 시작 전 조 출발 확정!' });
    }

    if (body.action === 'CONFIRM_GROUPING') {
      let entry = liveMap.get(roomId);
      if (!entry) {
        const room = getRoomStateForStep(3);
        entry = { room, step: 3 };
      }
      entry.room.groupingStatus = 'CONFIRMED';
      entry.room.groupingConfirmed = true;
      entry.room.status = 'GROUPED';
      if (body.groups && body.groups.length > 0) {
        entry.room.groups = body.groups;
        entry.room.waitingPool = [];
      }
      entry.step = 3;
      liveMap.set(roomId, entry);
      return NextResponse.json({ success: true, room: entry.room, message: '조 편성 확정 및 회원들에게 전송 완료!' });
    }

    if (body.action === 'EXECUTE_AUTO_GROUP' || body.action === 'UPDATE_GROUPS_PREVIEW') {
      let entry = liveMap.get(roomId);
      if (!entry) {
        const room = getRoomStateForStep(2);
        entry = { room, step: 2 };
      }
      entry.room.groupingStatus = 'PREVIEW';
      entry.room.groupingConfirmed = false;
      if (body.groups && body.groups.length > 0) {
        entry.room.groups = body.groups;
        entry.room.waitingPool = [];
      }
      entry.step = 2;
      liveMap.set(roomId, entry);
      return NextResponse.json({ success: true, room: entry.room, message: '가편성 결과 생성 완료' });
    }

    if (body.action === 'RESET_TO_STAGE1') {
      const room = getRoomStateForStep(1);
      liveMap.set(roomId, { room, step: 1 });
      return NextResponse.json({ success: true, room, message: '1단계(모집/출석 확인)로 초기화되었습니다.' });
    }

    if (body.action === 'ADD_GUEST') {
      let entry = liveMap.get(roomId);
      if (!entry) {
        const room = getRoomStateForStep(1);
        entry = { room, step: 1 };
      }
      const guestName = body.name || `게스트${(entry.room.waitingPool?.length || 0) + 1}`;
      const newGuest: ClubPlayer = {
        id: `guest_${Date.now()}`,
        name: guestName,
        isLeader: false,
        scores: {},
        totalStrokes: 0,
        parDiff: 0,
        holesCompleted: 0,
        gender: body.gender || 'M',
        handicapTier: body.handicapTier || 'INTERMEDIATE'
      };
      if (!entry.room.waitingPool) entry.room.waitingPool = [];
      entry.room.waitingPool.push(newGuest);
      liveMap.set(roomId, entry);
      return NextResponse.json({ success: true, room: entry.room, message: `${guestName} 님이 출석 대기실에 추가되었습니다.` });
    }

    if (body.action === 'RECORD_HOLE') {
      let entry = liveMap.get(roomId);
      if (!entry) {
        const room = getRoomStateForStep(3);
        entry = { room, step: 3 };
      }
      const room = entry.room;
      const groupNum = body.groupNumber;
      const hole = Number(body.hole);
      const playerScores: Record<string, number> = body.scores || {};

      const targetGroup = room.groups.find((g) => g.groupNumber === groupNum);
      if (targetGroup) {
        targetGroup.players.forEach((p) => {
          const score = playerScores[p.id] ?? playerScores[p.name];
          if (typeof score === 'number') {
            p.scores[hole] = score;
            p.totalStrokes = Object.values(p.scores).reduce((a, b) => a + b, 0);
            p.parDiff = p.totalStrokes - Object.keys(p.scores).reduce((acc, h) => acc + (HOLE_PARS[Number(h)] || 3), 0);
            p.holesCompleted = Object.keys(p.scores).length;
          }
        });
      }

      // 10명 전원의 총 진행 홀 수 체크
      const allPlayers = room.groups.flatMap((g) => g.players);
      const allFinished9 = allPlayers.length > 0 && allPlayers.every((p) => p.holesCompleted >= 9);
      if (allFinished9) {
        room.status = 'PLAYING';
      }

      liveMap.set(roomId, { room, step: 4 });
      return NextResponse.json({ success: true, room, message: `${groupNum}조 ${hole}번 홀 타수 저장 완료` });
    }

    if (body.step) {
      const stepNum = parseInt(body.step, 10);
      const room = getRoomStateForStep(stepNum);
      liveMap.set(room.id, { room, step: stepNum });
      return NextResponse.json({ success: true, room, step: stepNum });
    }

    if (body.room && body.room.id) {
      liveMap.set(body.room.id, { room: body.room, step: 0 });
      return NextResponse.json({ success: true, room: body.room });
    }

    return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
