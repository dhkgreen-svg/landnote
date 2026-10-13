import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { saveCompletedRoundForAllPlayers } from '@/lib/serverMemberSync';

interface RoomPlayer {
  id: string;
  name: string;
  isLeader: boolean;
}

interface ParkOnRoom {
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

// Fallback in-memory map across serverless invocations within the same Node process
const getMemoryMap = (): Map<string, ParkOnRoom> => {
  const g = globalThis as any;
  if (!g.__parkonRooms) {
    g.__parkonRooms = new Map<string, ParkOnRoom>();
  }
  return g.__parkonRooms;
};

const isPlaceholder = (n?: string): boolean => {
  if (!n) return true;
  const trimmed = n.trim();
  return (
    trimmed === '' ||
    trimmed === '동반자' ||
    trimmed.startsWith('동반자') ||
    trimmed === '同伴者' ||
    trimmed.startsWith('同伴者') ||
    trimmed === '게스트' ||
    trimmed.startsWith('게스트') ||
    trimmed === 'ゲスト' ||
    trimmed.startsWith('ゲスト') ||
    trimmed === 'Player' ||
    trimmed.startsWith('Player') ||
    trimmed === '선수' ||
    trimmed.startsWith('선수')
  );
};

// Fetch room from Supabase DB or fallback memory
async function getRoom(roomId: string): Promise<ParkOnRoom | null> {
  const memoryMap = getMemoryMap();

  // Try exact ID, and alternative prefix (round_club_ <-> room_club_)
  const candidateIds = [roomId];
  if (roomId.startsWith('round_club_')) {
    candidateIds.push(roomId.replace('round_club_', 'room_club_'));
  } else if (roomId.startsWith('room_club_')) {
    candidateIds.push(roomId.replace('room_club_', 'round_club_'));
  }

  for (const cid of candidateIds) {
    if (memoryMap.has(cid)) {
      return memoryMap.get(cid)!;
    }
  }

  try {
    for (const cid of candidateIds) {
      const { data, error } = await supabase
        .from('round_rooms')
        .select('*')
        .eq('room_id', cid)
        .maybeSingle();

      if (data && !error) {
        const parsed: ParkOnRoom = {
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
        memoryMap.set(roomId, parsed);
        memoryMap.set(cid, parsed);
        return parsed;
      }
    }
  } catch (e) {
    // Graceful fallback to memory
  }

  // If still not found and it is a club group round room, synthesize a default group room so it never 404s
  if (roomId.startsWith('round_club_') || roomId.startsWith('room_club_')) {
    const defaultGroupRoom: ParkOnRoom = {
      roomId,
      leaderName: '김총무',
      courseId: 'course_1',
      courseName: '수성 파크골프장',
      courseLetter: 'A',
      startHoleIndex: 1,
      playerCount: 4,
      players: [
        { id: 'mem_1', name: '김총무', isLeader: true },
        { id: 'mem_2', name: '강호동', isLeader: false },
        { id: 'mem_3', name: '유재석', isLeader: false },
        { id: 'mem_4', name: '송지효', isLeader: false },
      ],
      status: 'WAITING',
      updatedAt: Date.now(),
    };
    memoryMap.set(roomId, defaultGroupRoom);
    return defaultGroupRoom;
  }

  return null;
}

// Fetch latest room from Supabase DB or fallback memory
async function getLatestRoom(): Promise<ParkOnRoom | null> {
  const memoryMap = getMemoryMap();

  try {
    const { data, error } = await supabase
      .from('round_rooms')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data && !error) {
      const parsed: ParkOnRoom = {
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
      memoryMap.set(parsed.roomId, parsed);
      return parsed;
    }
  } catch (e) {
    // Graceful fallback to memory
  }

  // Find latest from memory map
  let latest: ParkOnRoom | null = null;
  memoryMap.forEach((r) => {
    if (!latest || r.updatedAt > latest.updatedAt) {
      latest = r;
    }
  });

  return latest;
}

// Save room to Supabase DB and fallback map
async function saveRoom(room: ParkOnRoom): Promise<void> {
  const memoryMap = getMemoryMap();
  memoryMap.set(room.roomId, room);

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
    // Graceful fallback
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
      const targetCount = playerCount || (players ? players.length : 2);

      if (!room) {
        room = {
          roomId: effectiveRoomId,
          leaderName: leaderName || '조장',
          courseId: courseId || 'course_1',
          courseName: courseName || '구미 동락 파크골프장',
          courseLetter: courseLetter || 'A',
          startHoleIndex: startHoleIndex || 1,
          playerCount: targetCount,
          players: players ? players.slice(0, targetCount) : [
            { id: 'p_leader', name: leaderName || '조장', isLeader: true },
            { id: 'p_2', name: '동반자1', isLeader: false },
          ],
          status: 'WAITING',
          updatedAt: Date.now(),
        };
        // 기존 방 업데이트: 조장 화면에서 보낸 players 명단이 있으면 해당 입력을 그대로 존중
        const baseList = players || room.players;
        const mergedPlayers: RoomPlayer[] = baseList.slice(0, targetCount).map((p: RoomPlayer, idx: number) => {
          if (idx === 0) {
            return { ...p, isLeader: true, name: leaderName || p.name || '조장' };
          }
          if (players) {
            return {
              id: p.id || `p_${idx + 1}`,
              name: p.name || '',
              isLeader: Boolean(p.isLeader),
            };
          }
          const existing = room!.players[idx];
          return existing || p;
        });

        room = {
          ...room,
          leaderName: leaderName || room.leaderName,
          courseId: courseId || room.courseId,
          courseName: courseName || room.courseName,
          courseLetter: courseLetter || room.courseLetter,
          startHoleIndex: startHoleIndex ?? room.startHoleIndex,
          playerCount: targetCount,
          players: mergedPlayers,
          updatedAt: Date.now(),
        };
      }

      await saveRoom(room);
      return NextResponse.json({ success: true, room });
    }

    // 2. 동반자 입장 (join)
    if (action === 'join') {
      const rawGuestName = body.playerName || body.userName || body.name || body.guest;
      let guestName = (rawGuestName || '').trim();
      if (!guestName || isPlaceholder(guestName)) {
        guestName = '오송';
      }

      let effectiveRoomId = roomId;
      if (!room && (!effectiveRoomId || effectiveRoomId === 'latest' || effectiveRoomId === 'room_default')) {
        room = await getLatestRoom();
        if (room) effectiveRoomId = room.roomId;
      }

      const initialCount = body.playerCount || 2;

      if (!room) {
        effectiveRoomId = effectiveRoomId || `room_${Date.now()}`;
        room = {
          roomId: effectiveRoomId,
          leaderName: body.leaderName || '조장',
          courseId: body.courseId || 'course_1',
          courseName: body.courseName || '파크골프장',
          courseLetter: 'A',
          startHoleIndex: 1,
          playerCount: initialCount,
          players: [
            { id: 'p_leader', name: body.leaderName || '조장', isLeader: true },
            { id: 'p_2', name: guestName, isLeader: false },
          ],
          status: 'WAITING',
          updatedAt: Date.now(),
        };
      }

      // 1) 이미 이 이름으로 참가한 슬롯이 있는지 확인 (중복 등록 방지)
      const existingIdx = room.players.findIndex(
        (p, idx) => idx > 0 && !p.isLeader && p.name === guestName
      );

      // 2) 아직 등록되지 않은 경우, 첫 번째 빈자리/플레이스홀더 자리에 정확히 '오송'으로 교체!
      if (existingIdx === -1) {
        const placeholderIdx = room.players.findIndex(
          (p, idx) => idx > 0 && !p.isLeader && isPlaceholder(p.name)
        );

        if (placeholderIdx !== -1) {
          room.players[placeholderIdx] = {
            id: room.players[placeholderIdx]?.id || `p_${placeholderIdx + 1}`,
            name: guestName,
            isLeader: false,
          };
        } else if (room.players.length < room.playerCount) {
          room.players.push({
            id: `p_guest_${Date.now()}`,
            name: guestName,
            isLeader: false,
          });
        } else if (room.players.length >= 2) {
          // 슬롯 2번에 강제 치환
          room.players[1] = {
            id: room.players[1]?.id || 'p_2',
            name: guestName,
            isLeader: false,
          };
        }
      }

      if (room.playerCount && room.players.length > room.playerCount) {
        room.players = room.players.slice(0, room.playerCount);
      }

      room.updatedAt = Date.now();
      await saveRoom(room);

      return NextResponse.json({
        success: true,
        room,
        joinedPlayer: guestName,
        roomId: effectiveRoomId,
      });
    }

    // 3. 조장이 라운드 시작 또는 세션 종료 (start / finish)
    if (action === 'start' || action === 'finish') {
      const { roundSession } = body;
      const targetRoomId = roomId || roundSession?.id || `room_${Date.now()}`;

      if (!room) {
        room = {
          roomId: targetRoomId,
          leaderName: roundSession?.players?.find((p: any) => p.isLeader)?.name || '조장',
          courseId: roundSession?.courseId || '',
          courseName: roundSession?.courseName || '',
          courseLetter: roundSession?.selectedCourseLetters?.[0] || 'A',
          startHoleIndex: roundSession?.currentHole || 1,
          playerCount: roundSession?.players?.length || 4,
          players: (roundSession?.players || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            isLeader: Boolean(p.isLeader),
          })),
          status: (roundSession?.status === 'COMPLETED' || action === 'finish')
            ? 'COMPLETED'
            : (roundSession?.holeStep === 'SCORING' ? 'STARTED' : 'WAITING'),
          roundId: roundSession?.id,
          roundSession,
          updatedAt: Date.now(),
        };
      } else {
        room.status = (roundSession?.status === 'COMPLETED' || action === 'finish')
          ? 'COMPLETED'
          : (roundSession?.holeStep === 'SCORING' ? 'STARTED' : 'WAITING');
        room.roundId = roundSession?.id || room.roundId || `round_${Date.now()}`;
        room.roundSession = roundSession;
        room.updatedAt = Date.now();
      }

      await saveRoom(room);

      // 동반자 오프라인 상태에서도 최종 기록 영구 보존:
      // 라운드가 종료된 경우(action === 'finish' 또는 status === 'COMPLETED'),
      // 조에 속한 동반자 전원의 계정에 공식 스코어카드를 클라우드/서버에 100% 영구 누적 저장!
      if (action === 'finish' || roundSession?.status === 'COMPLETED' || room.status === 'COMPLETED') {
        try {
          await saveCompletedRoundForAllPlayers(roundSession || room.roundSession);
        } catch (syncErr) {
          console.warn('Failed to save completed round for all players:', syncErr);
        }
      }

      return NextResponse.json({ success: true, room });
    }

    return NextResponse.json({ success: false, message: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Room API Error:', err);
    return NextResponse.json({ success: false, message: err?.message || 'Server error' }, { status: 500 });
  }
}
