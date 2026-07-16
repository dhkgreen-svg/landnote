-- ────────────────────────────────────────────
-- Part A: customer_inquiries에 좌표 컬럼 추가
-- (property_listings와 동일 패턴)
-- ────────────────────────────────────────────

ALTER TABLE customer_inquiries
  ADD COLUMN latitude  DOUBLE PRECISION,
  ADD COLUMN longitude DOUBLE PRECISION;

ALTER TABLE customer_inquiries
  ADD COLUMN location GEOGRAPHY(POINT, 4326)
    GENERATED ALWAYS AS (
      CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ELSE NULL
      END
    ) STORED;

CREATE INDEX idx_inquiries_location
  ON customer_inquiries USING GIST(location);

-- 거리 일괄 계산 RPC (매칭 시 1회 호출)
CREATE OR REPLACE FUNCTION get_listing_distances(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_listing_ids UUID[]
)
RETURNS TABLE(listing_id UUID, distance_meters DOUBLE PRECISION)
LANGUAGE sql STABLE
AS $$
  SELECT
    pl.id AS listing_id,
    ST_Distance(
      pl.location,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_meters
  FROM property_listings pl
  WHERE pl.id = ANY(p_listing_ids)
    AND pl.location IS NOT NULL;
$$;

-- ────────────────────────────────────────────
-- Part B: push_subscriptions 테이블
-- ────────────────────────────────────────────

CREATE TABLE push_subscriptions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id    UUID        NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  endpoint    TEXT        NOT NULL,
  auth_key    TEXT        NOT NULL,
  p256dh_key  TEXT        NOT NULL,
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(agent_id, endpoint)
);

CREATE INDEX idx_push_subs_agent
  ON push_subscriptions(agent_id) WHERE is_active = TRUE;

CREATE TRIGGER trigger_push_subs_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY push_subs_select_own ON push_subscriptions FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY push_subs_insert_own ON push_subscriptions FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY push_subs_update_own ON push_subscriptions FOR UPDATE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY push_subs_delete_own ON push_subscriptions FOR DELETE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
