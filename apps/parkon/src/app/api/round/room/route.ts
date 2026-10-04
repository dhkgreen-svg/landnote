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
  status: 'WAITING' | 'STARTED' | 'COMPLETED';
  roundId?: string;
  roundSession?: any;
  updatedAt: number;
}

// Temporary file for cross-process/serverless persistence fallback
const ROOMS_CACHE_FILE = path.join(os.tmpdir(), 'parkon_rooms_cache.json');
const LATEST_ROOM_FILE = path.join(os.tmpdir(), 'parkon_latest_room_id.txt');

const getLatestRoomId = (): string | null => {
  const g = globalThis as any;
  if (g.__parkonLatestRoomId) return g.__parkonLatestRoomId;
  try {
    if (fs.existsSync(LATEST_ROOM_FILE)) {
      return fs.readFileSync(LATEST_ROOM_FILE, 'utf-8').trim();
    }
  } catch (e) {}
  return null;
};

const setLatestRoomId = (rid: string) => {
  const g = globalThis as any;
  g.__parkonLatestRoomId = rid;
  try {
    fs.writeFileSync(LATEST_ROOM_FILE, rid, 'utf-8');
  } catch (e) {}
};

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
  let roomId = searchParams.get('roomId');

  if (!roomId || roomId === 'latest' || roomId === 'room_default') {
    roomId = getLatestRoomId() || roomId || '';
  }

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
    let { action, roomId } = body;

    if (!roomId || roomId === 'latest' || roomId === 'room_default') {
      const lat = getLatestRoomId();
      if (lat) roomId = lat;
    }

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
        const isPlaceholder = (n?: string) => {
          if (!n) return true;
          const trimmed = n.trim();
          return trimmed.startsWith('동반자') || trimmed.startsWith('同伴者') || trimmed.startsWith('ゲスト') || trimmed.startsWith('Player');
        };

        // 기존 방 업데이트: 동반자가 이미 입장해서 입력한 실제 이름은 절대 덮어쓰지 않음
        const mergedPlayers: RoomPlayer[] = (players || room.players).map((p: RoomPlayer, idx: number) => {
          if (idx === 0) {
            return { ...p, isLeader: true, name: leaderName || p.name || '조장' };
          }
          const existing = room!.players[idx];
          if (existing && !isPlaceholder(existing.name) && isPlaceholder(p.name)) {
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
      setLatestRoomId(roomId);
      return NextResponse.json({ success: true, room });
    }

    // 2. 동반자 입장 (join)
    if (action === 'join') {
      const { playerName } = body;
      let guestName = (playerName || '동반자').trim();
      if (!guestName) guestName = '동반자';

      let effectiveRoomId = roomId;
      if (!effectiveRoomId || effectiveRoomId === 'latest' || effectiveRoomId === 'room_default') {
        const lat = getLatestRoomId();
        if (lat) effectiveRoomId = lat;
      }

      if (!room && effectiveRoomId !== roomId) {
        room = rooms.get(effectiveRoomId);
        if (!room && fs.existsSync(ROOMS_CACHE_FILE)) {
          try {
            const raw = fs.readFileSync(ROOMS_CACHE_FILE, 'utf-8');
            const parsed = JSON.parse(raw);
            if (parsed && parsed[effectiveRoomId]) {
              room = parsed[effectiveRoomId];
              rooms.set(effectiveRoomId, room!);
            }
          } catch (e) {}
        }
      }

      if (!room) {
        // 현재 실제로 조장이 개설하여 대기 중인 가장 최신의 WAITING 방이 있다면 그 방으로 자동 합류!
        let newestWaitingRoom: ParkOnRoom | null = null;
        rooms.forEach((r) => {
          if (r.status === 'WAITING' && (!newestWaitingRoom || r.updatedAt > newestWaitingRoom.updatedAt)) {
            newestWaitingRoom = r;
          }
        });

        if (newestWaitingRoom) {
          room = newestWaitingRoom;
          effectiveRoomId = (newestWaitingRoom as ParkOnRoom).roomId;
        }
      }

      if (!room) {
        // 새 방 생성: 조장 + 깨끗한 빈 동반자 슬롯 3개
        room = {
          roomId: effectiveRoomId,
          leaderName: body.leaderName || '조장',
          courseId: body.courseId || 'course_1',
          courseName: body.courseName || '파크골프장',
          courseLetter: 'A',
          startHoleIndex: 1,
          playerCount: 4,
          players: [
            { id: 'p_leader', name: body.leaderName || '조장', isLeader: true },
            { id: 'p_2', name: '동반자1', isLeader: false },
            { id: 'p_3', name: '동반자2', isLeader: false },
            { id: 'p_4', name: '동반자3', isLeader: false },
          ],
          status: 'WAITING',
          updatedAt: Date.now(),
        };
      }

      const isPlaceholder = (n?: string) => {
        if (!n) return true;
        const trimmed = n.trim();
        return (
          trimmed.startsWith('동반자') ||
          trimmed.startsWith('同伴者') ||
          trimmed.startsWith('ゲスト') ||
          trimmed.startsWith('Player') ||
          trimmed === ''
        );
      };

      // 1) 이미 이 이름으로 참가한 슬롯이 있는지 확인 (중복 등록 방지)
      const existingIdx = room.players.findIndex(
        (p, idx) => idx > 0 && !p.isLeader && p.name === guestName
      );

      // 2) 아직 등록되지 않은 경우, 첫 번째 빈 슬롯에 정확히 1개만 배정!
      if (existingIdx === -1) {
        const placeholderIdx = room.players.findIndex(
          (p, idx) => idx > 0 && !p.isLeader && isPlaceholder(p.name)
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
      }

      room.updatedAt = Date.now();
      rooms.set(effectiveRoomId, room);
      persistRooms(rooms);
      setLatestRoomId(effectiveRoomId);

      return NextResponse.json({ success: true, room, joinedPlayer: guestName, roomId: effectiveRoomId });
    }

    // 3. 조장이 라운드 시작 또는 세션 동기화/종료 (start / finish)
    if (action === 'start' || action === 'finish') {
      const { roundSession } = body;
      if (!room) {
        return NextResponse.json({ success: false, message: 'ROOM_NOT_FOUND' }, { status: 404 });
      }

      room.status = (roundSession?.status === 'COMPLETED' || action === 'finish') ? 'COMPLETED' : 'STARTED';
      room.roundId = roundSession?.id || `round_${Date.now()}`;
      room.roundSession = roundSession;
      room.updatedAt = Date.now();

      rooms.set(roomId, room);
      persistRooms(rooms);
      setLatestRoomId(roomId);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Room API Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
