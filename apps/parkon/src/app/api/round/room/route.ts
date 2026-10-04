import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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

// Fallback in-memory map for build-time or offline development
const memoryFallbackMap = new Map<string, ParkOnRoom>();
let memoryLatestRoomId: string | null = null;

// Fetch room from Supabase DB or fallback
async function getRoom(roomId: string): Promise<ParkOnRoom | null> {
  try {
    const { data, error } = await supabase
      .from('round_rooms')
      .select('*')
      .eq('room_id', roomId)
      .maybeSingle();

    if (data && !error) {
      return {
        roomId: data.room_id,
        leaderName: data.leader_name,
        courseId: data.course_id,
        courseName: data.course_name,
        courseLetter: data.course_letter,
        startHoleIndex: data.start_hole_index,
        playerCount: data.player_count,
        players: data.players || [],
        status: data.status,
        roundId: data.round_id,
        roundSession: data.round_session,
        updatedAt: Number(data.updated_at || Date.now()),
      };
    }
  } catch (e) {
    console.error('DB fetch room error:', e);
  }
  return memoryFallbackMap.get(roomId) || null;
}

// Fetch latest room from Supabase DB or fallback
async function getLatestRoom(): Promise<ParkOnRoom | null> {
  try {
    const { data, error } = await supabase
      .from('round_rooms')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      return {
        roomId: data.room_id,
        leaderName: data.leader_name,
        courseId: data.course_id,
        courseName: data.course_name,
        courseLetter: data.course_letter,
        startHoleIndex: data.start_hole_index,
        playerCount: data.player_count,
        players: data.players || [],
        status: data.status,
        roundId: data.round_id,
        roundSession: data.round_session,
        updatedAt: Number(data.updated_at || Date.now()),
      };
    }
  } catch (e) {
    console.error('DB fetch latest room error:', e);
  }
  if (memoryLatestRoomId) {
    return memoryFallbackMap.get(memoryLatestRoomId) || null;
  }
  return null;
}

// Save room to Supabase DB and fallback map
async function saveRoom(room: ParkOnRoom): Promise<void> {
  memoryFallbackMap.set(room.roomId, room);
  memoryLatestRoomId = room.roomId;

  try {
    const payload = {
      room_id: room.roomId,
      leader_name: room.leaderName,
      course_id: room.courseId,
      course_name: room.courseName,
      course_letter: room.courseLetter,
      start_hole_index: room.startHoleIndex,
      player_count: room.playerCount,
      players: room.players,
      status: room.status,
      round_id: room.roundId || null,
      round_session: room.roundSession || null,
      updated_at: room.updatedAt || Date.now(),
    };

    await supabase
      .from('round_rooms')
      .upsert(payload, { onConflict: 'room_id' });
  } catch (e) {
    console.error('DB save room error:', e);
  }
}

// GET /api/round/room?roomId=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let roomId = searchParams.get('roomId');

  let room: ParkOnRoom | null = null;

  if (!roomId || roomId === 'latest' || roomId === 'room_default') {
    room = await getLatestRoom();
  } else {
    room = await getRoom(roomId);
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

    let room: ParkOnRoom | null = null;

    if (!roomId || roomId === 'latest' || roomId === 'room_default') {
      room = await getLatestRoom();
      if (room) {
        roomId = room.roomId;
      }
    } else {
      room = await getRoom(roomId);
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

      const effectiveRoomId = roomId || `room_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      if (!room) {
        room = {
          roomId: effectiveRoomId,
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
          return (
            trimmed.startsWith('동반자') ||
            trimmed.startsWith('同伴者') ||
            trimmed.startsWith('ゲスト') ||
            trimmed.startsWith('Player')
          );
        };

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

      await saveRoom(room);
      return NextResponse.json({ success: true, room });
    }

    // 2. 동반자 입장 (join)
    if (action === 'join') {
      const { playerName } = body;
      let guestName = (playerName || '동반자').trim();
      if (!guestName) guestName = '동반자';

      let effectiveRoomId = roomId;
      if (!room && (!effectiveRoomId || effectiveRoomId === 'latest' || effectiveRoomId === 'room_default')) {
        room = await getLatestRoom();
        if (room) effectiveRoomId = room.roomId;
      }

      if (!room) {
        effectiveRoomId = effectiveRoomId || `room_${Date.now()}`;
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

      const existingIdx = room.players.findIndex(
        (p, idx) => idx > 0 && !p.isLeader && p.name === guestName
      );

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
      await saveRoom(room);

      return NextResponse.json({ success: true, room, joinedPlayer: guestName, roomId: effectiveRoomId });
    }

    // 3. 조장이 라운드 시작 또는 세션 종료 (start / finish)
    if (action === 'start' || action === 'finish') {
      const { roundSession } = body;
      if (!room) {
        return NextResponse.json({ success: false, message: 'ROOM_NOT_FOUND' }, { status: 404 });
      }

      room.status = (roundSession?.status === 'COMPLETED' || action === 'finish') ? 'COMPLETED' : 'STARTED';
      room.roundId = roundSession?.id || `round_${Date.now()}`;
      room.roundSession = roundSession;
      room.updatedAt = Date.now();

      await saveRoom(room);
      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Room API Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
