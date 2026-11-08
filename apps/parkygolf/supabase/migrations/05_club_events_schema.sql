-- ============================================================================
-- 05_club_events_schema.sql
-- 파크골프 올인원 (ParkGolf All-in-One) 공식 클럽 월례회 & 대회 영구 저장 스키마
-- ============================================================================

CREATE TABLE IF NOT EXISTS club_events (
  id VARCHAR(100) PRIMARY KEY,
  club_id VARCHAR(100) NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  club_name VARCHAR(150),
  tournament_type VARCHAR(50) DEFAULT 'CLUB_INTERNAL', -- 'CLUB_INTERNAL' | 'CLUB_MATCH' | 'REGIONAL_OPEN'
  title VARCHAR(200) NOT NULL,
  course_id VARCHAR(100) NOT NULL,
  course_name VARCHAR(150) NOT NULL,
  host_name VARCHAR(100) NOT NULL,
  selected_course_letters JSONB DEFAULT '["A", "B"]',
  total_holes INT DEFAULT 18,
  target_total_players INT,
  entry_fee INT DEFAULT 0,
  bank_account VARCHAR(150),
  game_mode VARCHAR(50) DEFAULT 'NEW_PERIO', -- 'STROKE' | 'NEW_PERIO' | 'SCRAMBLE' | 'STABLEFORD' | 'CASUAL'
  game_mode_title VARCHAR(150),
  game_rule_notes TEXT,
  near_pin_hole INT,
  longest_hole INT,
  award_config JSONB,
  -- 🔒 신페리오 공정성 암호학적 봉인 필드
  hidden_holes_hash VARCHAR(100),
  sealed_secret TEXT,
  is_unsealed BOOLEAN DEFAULT FALSE,
  unsealed_holes JSONB DEFAULT '[]',
  -- 조 편성 및 대기 풀 데이터
  groups JSONB DEFAULT '[]',
  waiting_pool JSONB DEFAULT '[]',
  grouping_method VARCHAR(50),
  status VARCHAR(30) DEFAULT 'RECRUITING', -- 'RECRUITING' | 'PLAYING' | 'FINISHED'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_club_events_club_id ON club_events(club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_status ON club_events(status);
CREATE INDEX IF NOT EXISTS idx_club_events_updated_at ON club_events(updated_at DESC);
