import { NextRequest, NextResponse } from 'next/server';

export interface RoomPlayer {
  id: string;
  name: string;
  isLeader: boolean;
}

export interface ParkOnRoom {
  roomId: string;
  leaderName: string;
  courseId: string;
  courseName: string;
  courseLetter: string;
  startHoleIndex: number;
  playerCount: number;
  players: RoomPlayer[];
  status: 'WAITING' | 'STARTED';
  roundId?: string;
  roundSession?: any;
  updatedAt: number;
}

// Global in-memory storage for rooms (persists during Next.js server runtime)
const getRoomsMap = (): Map<string, ParkOnRoom> => {
  const g = globalThis as any;
  if (!g.__parkonRooms) {
    g.__parkonRooms = new Map<string, ParkOnRoom>();
  }
  return g.__parkonRooms;
};

// GET /api/round/room?roomId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ success: false, message: 'roomId is required' }, { status: 400 });
  }

  const rooms = getRoomsMap();
  const room = rooms.get(roomId);

  if (!room) {
    return NextResponse.json({ success: false, message: 'ROOM_NOT_FOUND' }, { status: 404 });
  }

  return NextResponse.json({ success: true, room });
}

// POST /api/round/room
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, roomId } = body;

    if (!roomId) {
      return NextResponse.json({ success: false, message: 'roomId is required' }, { status: 400 });
    }

    const rooms = getRoomsMap();
    let room = rooms.get(roomId);

    // 1. 조장 화면 설정 동기화 (sync)
    if (action === 'sync') {
      const {
        leaderName,
        courseId,
        courseName,
        courseLetter,
        startHoleIndex,
        playerCount,
        players,
      } = body;

      if (!room) {
        // 새 방 생성
        room = {
          roomId,
          leaderName: leaderName || '조장',
          courseId: courseId || 'course_1',
          courseName: courseName || '구미 동락 파크골프장',
          courseLetter: courseLetter || 'A',
          startHoleIndex: startHoleIndex || 1,
          playerCount: playerCount || 4,
          players: players || [
            { id: 'p_leader', name: leaderName || '조장', isLeader: true },
            { id: 'p_2', name: '동반자1', isLeader: false },
            { id: 'p_3', name: '동반자2', isLeader: false },
            { id: 'p_4', name: '동반자3', isLeader: false },
          ],
          status: 'WAITING',
          updatedAt: Date.now(),
        };
      } else {
        // 기존 방 업데이트 (조장이 코스, 홀, 인원수 등을 변경할 때)
        // 주의: 동반자가 이미 조인해서 입력한 실제 이름이 있다면 보존
        const mergedPlayers: RoomPlayer[] = (players || room.players).map((p: RoomPlayer, idx: number) => {
          const existing = room!.players[idx];
          if (existing && !existing.isLeader && !existing.name.startsWith('동반자') && p.name.startsWith('동반자')) {
            return { ...p, name: existing.name };
          }
          return p;
        });

        room = {
          ...room,
          leaderName: leaderName || room.leaderName,
          courseId: courseId || room.courseId,
          courseName: courseName || room.courseName,
          courseLetter: courseLetter || room.courseLetter,
          startHoleIndex: startHoleIndex ?? room.startHoleIndex,
          playerCount: playerCount ?? room.playerCount,
          players: mergedPlayers,
          updatedAt: Date.now(),
        };
      }

      rooms.set(roomId, room);
      return NextResponse.json({ success: true, room });
    }

    // 2. 동반자 입장 (join)
    if (action === 'join') {
      const { playerName } = body;
      const guestName = (playerName || '동반자').trim();

      if (!room) {
        // 방이 아직 없으면 초기 생성
        room = {
          roomId,
          leaderName: body.leaderName || '조장',
          courseId: body.courseId || 'course_1',
          courseName: body.courseName || '파크골프장',
          courseLetter: 'A',
          startHoleIndex: 1,
          playerCount: 4,
          players: [
            { id: 'p_leader', name: body.leaderName || '조장', isLeader: true },
            { id: `p_guest_${Date.now()}`, name: guestName, isLeader: false },
            { id: 'p_3', name: '동반자2', isLeader: false },
            { id: 'p_4', name: '동반자3', isLeader: false },
          ],
          status: 'WAITING',
          updatedAt: Date.now(),
        };
      } else {
        // 이미 참여했는지 확인
        const alreadyJoined = room.players.some((p) => p.name === guestName);
        if (!alreadyJoined) {
          // 동반자1, 동반자2 등 기본 플레이스홀더를 교체하거나 추가
          const placeholderIdx = room.players.findIndex((p) => !p.isLeader && (p.name.startsWith('동반자') || !p.name.trim()));
          if (placeholderIdx !== -1) {
            room.players[placeholderIdx] = {
              ...room.players[placeholderIdx],
              name: guestName,
            };
          } else if (room.players.length < 6) {
            room.players.push({
              id: `p_guest_${Date.now()}`,
              name: guestName,
              isLeader: false,
            });
            room.playerCount = room.players.length;
          }
        }
        room.updatedAt = Date.now();
      }

      rooms.set(roomId, room);
      return NextResponse.json({ success: true, room, joinedPlayer: guestName });
    }

    // 3. 조장이 라운드 시작 (start)
    if (action === 'start') {
      const { roundSession } = body;
      if (!room) {
        return NextResponse.json({ success: false, message: 'ROOM_NOT_FOUND' }, { status: 404 });
      }

      room.status = 'STARTED';
      room.roundId = roundSession?.id || `round_${Date.now()}`;
      room.roundSession = roundSession;
      room.updatedAt = Date.now();

      rooms.set(roomId, room);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Room API Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
