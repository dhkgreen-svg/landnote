-- ==============================================================================
-- [파크골프 올인원 (ParkGolf All-in-One)] 클럽 및 동호회 전용 스키마
-- 모바일 클럽(동호회) 관리 및 월례회 자동화를 위한 핵심 테이블 정의
-- ==============================================================================

-- 1. 파크골프 클럽 마스터 테이블
CREATE TABLE IF NOT EXISTS clubs (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  region VARCHAR(100) NOT NULL,
  home_course_id VARCHAR(100),
  home_course_name VARCHAR(150),
  description TEXT,
  president_name VARCHAR(50),
  manager_name VARCHAR(50),
  contact_phone VARCHAR(50),
  bank_name VARCHAR(50),
  bank_account VARCHAR(100),
  bank_holder VARCHAR(50),
  member_count INT DEFAULT 1,
  is_public BOOLEAN DEFAULT TRUE,
  is_parkon_club BOOLEAN DEFAULT FALSE,
  recruit_status VARCHAR(20) DEFAULT 'ALWAYS',
  recruit_quota INT DEFAULT 50,
  annual_dues_amount INT DEFAULT 50000,
  badge_color VARCHAR(30) DEFAULT 'emerald',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 클럽 회원 명부 테이블 (PKY-XXXX 회원 식별자 기반)
CREATE TABLE IF NOT EXISTS club_members (
  id VARCHAR(100) PRIMARY KEY,
  club_id VARCHAR(100) REFERENCES clubs(id) ON DELETE CASCADE,
  member_code VARCHAR(30) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(30) DEFAULT 'MEMBER', -- 'PRESIDENT', 'VICE_PRESIDENT', 'MANAGER', 'AUDITOR', 'MEMBER'
  custom_role_name VARCHAR(50),
  phone VARCHAR(30),
  diamond_tier VARCHAR(30) DEFAULT 'BRONZE',
  completed_9holes INT DEFAULT 0,
  dues_paid BOOLEAN DEFAULT FALSE,
  dues_paid_at VARCHAR(30),
  joined_at VARCHAR(30),
  status VARCHAR(20) DEFAULT 'ACTIVE', -- 'ACTIVE', 'PENDING', 'ARCHIVED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_club_member_code UNIQUE (club_id, member_code)
);

-- 3. 클럽 가입 신청 대기열 테이블
CREATE TABLE IF NOT EXISTS club_join_applications (
  id VARCHAR(100) PRIMARY KEY,
  club_id VARCHAR(100) REFERENCES clubs(id) ON DELETE CASCADE,
  member_code VARCHAR(30) NOT NULL,
  name VARCHAR(50) NOT NULL,
  phone VARCHAR(30),
  message TEXT,
  status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_clubs_region ON clubs(region);
CREATE INDEX IF NOT EXISTS idx_club_members_club_id ON club_members(club_id);
CREATE INDEX IF NOT EXISTS idx_club_members_member_code ON club_members(member_code);
CREATE INDEX IF NOT EXISTS idx_club_join_applications_club_id ON club_join_applications(club_id, status);
