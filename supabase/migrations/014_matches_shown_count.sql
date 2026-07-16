ALTER TABLE matches
ADD COLUMN shown_count INT NOT NULL DEFAULT 0;

-- 기존 is_shown이 TRUE였던 데이터 마이그레이션
UPDATE matches SET shown_count = 1 WHERE is_shown = TRUE;

-- is_shown 컬럼 삭제
ALTER TABLE matches DROP COLUMN is_shown;

-- 인덱스 변경 (pending 판단: shown_count = 0)
DROP INDEX idx_matches_pending;
CREATE INDEX idx_matches_pending ON matches(agent_id, shown_count) WHERE shown_count = 0;
