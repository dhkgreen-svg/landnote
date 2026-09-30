-- ==============================================================================
-- [파크온 (ParkOn)] 영구 방문자 분석 및 접속 통계 테이블
-- Vercel 서버리스 재부팅과 무관하게 100년 동안 영구 보존되는 통계 테이블
-- ==============================================================================

CREATE TABLE IF NOT EXISTS parkon_analytics_logs (
  id VARCHAR(64) PRIMARY KEY,
  ip VARCHAR(64),
  "userAgent" TEXT,
  path TEXT,
  referrer TEXT,
  timestamp BIGINT,
  "dateStr" VARCHAR(20),
  "timeStr" VARCHAR(20),
  "userRegion" VARCHAR(100),
  "homeCourse" VARCHAR(100),
  "userName" VARCHAR(100),
  "isAppInstall" BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parkon_analytics_date ON parkon_analytics_logs("dateStr");
CREATE INDEX IF NOT EXISTS idx_parkon_analytics_timestamp ON parkon_analytics_logs(timestamp);

-- 권한 및 보안 설정 (접속자 로깅 및 관리자 대시보드 조회 허용)
ALTER TABLE parkon_analytics_logs DISABLE ROW LEVEL SECURITY;
GRANT ALL ON parkon_analytics_logs TO anon, authenticated, service_role;

