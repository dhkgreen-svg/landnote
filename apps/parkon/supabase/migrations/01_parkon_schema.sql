-- ==============================================================================
-- [파크온 (ParkOn)] 통합 데이터베이스 스키마 (Supabase PostgreSQL)
-- 1인 오토파일럿 파크골프 플랫폼 6대 핵심 테이블 정의
-- ==============================================================================

-- 1. 유저 및 권한 테이블
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nickname VARCHAR(50) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'USER', -- 'SUPER_ADMIN', 'COURSE_MANAGER', 'COACH', 'USER'
  assigned_course_id UUID,
  karma_points INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 전국 구장 테이블 (크라우드소싱 & 홀별 로컬룰/제원)
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  total_holes INT DEFAULT 18,
  holes_metadata JSONB DEFAULT '[]', -- [{hole: 1, par: 3, distance: 45, local_rule: "..."}]
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 홀별 공략 팁 테이블 (트랭글식 추천 및 순위)
CREATE TABLE IF NOT EXISTS hole_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  hole_index INT NOT NULL,
  user_id UUID REFERENCES users(id),
  tip_text TEXT NOT NULL,
  warning_text TEXT,
  upvotes INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 공인 레슨 코치 테이블
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(50) NOT NULL,
  title VARCHAR(100) NOT NULL, -- e.g. "협회 1급 공인 지도자"
  main_courses UUID[],
  specialty VARCHAR(100), -- e.g. "30m 어프로치, 슬라이스 교정"
  contact_phone VARCHAR(30) NOT NULL,
  price_info VARCHAR(100),
  is_verified BOOLEAN DEFAULT FALSE,
  membership_status VARCHAR(20) DEFAULT 'ACTIVE'
);

-- 5. 당일 구장 컨디션 테이블 (일일 자동 리셋)
CREATE TABLE IF NOT EXISTS course_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  report_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL, -- 'GOOD', 'NORMAL', 'BAD'
  tags TEXT[],
  official_notice TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 라운드 및 스코어 테이블 (대회 및 4인 라운드 동기화)
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  join_code VARCHAR(6) NOT NULL,
  course_id UUID REFERENCES courses(id),
  start_hole INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS', -- 'IN_PROGRESS', 'COMPLETED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS round_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_number INT DEFAULT 1,
  player_name VARCHAR(50) NOT NULL,
  claimed_user_id UUID REFERENCES users(id),
  strokes JSONB DEFAULT '[]', -- [{hole: 1, strokes: 3, ob: 0}]
  total_score INT DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_courses_region ON courses(region);
CREATE INDEX IF NOT EXISTS idx_hole_tips_course_hole ON hole_tips(course_id, hole_index);
CREATE INDEX IF NOT EXISTS idx_course_conditions_date ON course_conditions(course_id, report_date);
CREATE INDEX IF NOT EXISTS idx_round_players_tournament ON round_players(tournament_id);
