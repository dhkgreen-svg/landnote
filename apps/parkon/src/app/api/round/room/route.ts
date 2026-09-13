import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

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

// Temporary file for cross-process/serverless persistence fallback
const ROOMS_CACHE_FILE = path.join(os.tmpdir(), 'parkon_rooms_cache.json');

// In-memory cache
const getRoomsMap = (): Map<string, ParkOnRoom> => {
  const g = globalThis as any;
  if (!g.__parkonRooms) {
    g.__parkonRooms = new Map<string, ParkOnRoom>();
    // Load from disk if exists
    try {
      if (fs.existsSync(ROOMS_CACHE_FILE)) {
        const raw = fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        for (const [k, v] of Object.entries(parsed)) {
          g.__parkonRooms.set(k, v as ParkOnRoom);
        }
      }
    } catch (e) {
      console.error('Failed to load rooms from disk:', e);
    }
  }
  return g.__parkonRooms;
};

// Save to disk
const persistRooms = (rooms: Map<string, ParkOnRoom>) => {
  try {
    const obj: Record<string, ParkOnRoom> = {};
    rooms.forEach((v, k) => {
      obj[k] = v;
    });
    fs.writeFileSync(ROOMS_CACHE_FILE, JSON.stringify(obj), 'utf-8');
  } catch (e) {
    console.error('Failed to persist rooms to disk:', e);
  }
};

// GET /api/round/room?roomId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');

  if (!roomId) {
    return NextResponse.json({ success: false, message: 'roomId is required' }, { status: 400 });
  }

  const rooms = getRoomsMap();
  let room = rooms.get(roomId);

  // If not in memory, re-check disk file
  if (!room) {
    try {
      if (fs.existsSync(ROOMS_CACHE_FILE)) {
        const raw = fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed[roomId]) {
          room = parsed[roomId];
          rooms.set(roomId, room!);
        }
      }
    } catch (e) {
      console.error('Disk read error:', e);
    }
  }

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

    // If not in memory, check disk
    if (!room) {
      try {
        if (fs.existsSync(ROOMS_CACHE_FILE)) {
          const raw = fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed[roomId]) {
            room = parsed[roomId];
            rooms.set(roomId, room!);
          }
        }
      } catch (e) {
        console.error('Disk read error:', e);
      }
    }

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
        // 기존 방 업데이트: 동반자가 이미 입장해서 입력한 실제 이름은 절대 덮어쓰지 않음
        const mergedPlayers: RoomPlayer[] = (players || room.players).map((p: RoomPlayer, idx: number) => {
          if (idx === 0) {
            return { ...p, isLeader: true, name: leaderName || p.name || '조장' };
          }
          const existing = room!.players[idx];
          if (existing && !existing.name.startsWith('동반자') && p.name.startsWith('동반자')) {
            return existing;
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
      persistRooms(rooms);
      return NextResponse.json({ success: true, room });
    }

    // 2. 동반자 입장 (join)
    if (action === 'join') {
      const { playerName } = body;
      let guestName = (playerName || '동반자').trim();
      if (!guestName) guestName = '동반자';

      if (!room) {
        // 방이 없으면 즉시 생성
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
        // 첫 번째 빈 슬롯(동반자1, 동반자2...)에 게스트를 즉시 배치
        const placeholderIdx = room.players.findIndex(
          (p, idx) => idx > 0 && !p.isLeader && (p.name.startsWith('동반자') || !p.name.trim())
        );

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
        room.updatedAt = Date.now();
      }

      rooms.set(roomId, room);
      persistRooms(rooms);
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
      persistRooms(rooms);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Room API Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
