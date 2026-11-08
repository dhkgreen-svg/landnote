-- 7. 라운드 룸 테이블 (Supabase Realtime & Serverless 공유 DB)
CREATE TABLE IF NOT EXISTS round_rooms (
  room_id VARCHAR(100) PRIMARY KEY,
  leader_name VARCHAR(100),
  course_id VARCHAR(100),
  course_name VARCHAR(100),
  course_letter VARCHAR(10),
  start_hole_index INT DEFAULT 1,
  player_count INT DEFAULT 4,
  players JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'WAITING',
  round_id VARCHAR(100),
  round_session JSONB,
  updated_at BIGINT
);

CREATE INDEX IF NOT EXISTS idx_round_rooms_updated_at ON round_rooms(updated_at DESC);
