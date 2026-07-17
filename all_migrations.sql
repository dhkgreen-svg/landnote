CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- DB ?àÎ≤®?êÏÑú ?§Ì?¬∑Î∂àÏùºÏπ??úÍ±∞
CREATE TYPE subscription_plan_t   AS ENUM ('starter','pro');
CREATE TYPE subscription_status_t AS ENUM ('trial','active','expired','cancelled');
CREATE TYPE category_code_t       AS ENUM ('residential','commercial','industrial','land');
CREATE TYPE transaction_type_t    AS ENUM ('sale','jeonse','monthly_rent','premium_transfer');
CREATE TYPE inquiry_status_t      AS ENUM ('new','contacted','viewing','negotiating','contracted','closed');
CREATE TYPE listing_status_t      AS ENUM ('active','pending','contracted','closed');
CREATE TABLE agents (
  id                    UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID                  UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 VARCHAR(255)          NOT NULL,
  agent_name            VARCHAR(50)           NOT NULL,
  license_number        VARCHAR(20)           UNIQUE NOT NULL,
  office_name           VARCHAR(100),
  phone                 VARCHAR(20),
  agent_code            VARCHAR(10)           UNIQUE NOT NULL DEFAULT '',
  profile_image_url     TEXT,

  -- Íµ¨ÎèÖ
  subscription_plan     subscription_plan_t   NOT NULL DEFAULT 'starter',
  subscription_status   subscription_status_t NOT NULL DEFAULT 'trial',
  selected_categories   category_code_t[]     NOT NULL DEFAULT '{}'::category_code_t[],
  pending_plan          subscription_plan_t,
  category_changed_at   TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  -- Í≤∞Ï†ú
  billing_key           TEXT,
  billing_card_info     JSONB,
  subscription_start    TIMESTAMPTZ,
  subscription_end      TIMESTAMPTZ,
  next_billing_date     TIMESTAMPTZ,
  billing_day           INTEGER               NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),

  created_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- agent_code ?êÎèô ?ùÏÑ±
CREATE OR REPLACE FUNCTION generate_agent_code()
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE v_code TEXT;
BEGIN
  LOOP
    v_code := 'A' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 4));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM agents WHERE agent_code = v_code);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION set_agent_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.agent_code = '' OR NEW.agent_code IS NULL THEN
    NEW.agent_code := generate_agent_code();
  END IF;
  IF NEW.trial_ends_at IS NULL THEN
    NEW.trial_ends_at := now() + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agent_defaults
  BEFORE INSERT ON agents
  FOR EACH ROW EXECUTE FUNCTION set_agent_defaults();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TABLE customer_inquiries (
  id                  UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id            UUID               NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  inquiry_type        VARCHAR(20)        NOT NULL CHECK (inquiry_type IN ('looking_for','listing')),
  customer_name       VARCHAR(50),
  customer_phone      TEXT,
  customer_email      VARCHAR(100),

  category_codes      category_code_t[]    NOT NULL DEFAULT '{}'::category_code_t[],
  subcategory_codes   TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  tags                TEXT[]               NOT NULL DEFAULT '{}'::TEXT[],
  transaction_types   transaction_type_t[] NOT NULL DEFAULT '{}'::transaction_type_t[],

  detailed_conditions JSONB              NOT NULL DEFAULT '{}',

  images              JSONB              NOT NULL DEFAULT '[]',

  status              inquiry_status_t   NOT NULL DEFAULT 'new',
  priority            INTEGER            NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),
  agent_memo          TEXT,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE INDEX idx_inquiries_agent_status
  ON customer_inquiries(agent_id, status, created_at DESC);

CREATE INDEX idx_inquiries_categories
  ON customer_inquiries USING GIN(category_codes);

CREATE TRIGGER trigger_inquiries_updated_at
  BEFORE UPDATE ON customer_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TABLE property_listings (
  id                        UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id                  UUID                   NOT NULL REFERENCES agents(id) ON DELETE CASCADE,

  category_codes            category_code_t[]      NOT NULL DEFAULT '{}'::category_code_t[],
  subcategory_codes         TEXT[]                 NOT NULL DEFAULT '{}'::TEXT[],
  tags                      TEXT[]                 NOT NULL DEFAULT '{}'::TEXT[],
  transaction_types         transaction_type_t[]   NOT NULL DEFAULT '{}'::transaction_type_t[],

  address_full              TEXT,
  address_road              TEXT,
  address_jibun             TEXT,
  dong_name                 VARCHAR(50),

  latitude                  DOUBLE PRECISION,
  longitude                 DOUBLE PRECISION,
  location                  GEOGRAPHY(POINT, 4326)
    GENERATED ALWAYS AS (
      CASE
        WHEN latitude IS NOT NULL AND longitude IS NOT NULL
        THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
        ELSE NULL
      END
    ) STORED,

  price_sale                NUMERIC(15,0),
  deposit                   NUMERIC(15,0),
  monthly_rent              NUMERIC(10,0),
  maintenance_fee           NUMERIC(10,0),
  premium_price             NUMERIC(15,0),
  premium_floor             NUMERIC(15,0),
  premium_facility          NUMERIC(15,0),
  premium_business          NUMERIC(15,0),
  contract_remaining_months INTEGER,
  area_supply               NUMERIC(8,2),
  area_exclusive            NUMERIC(8,2),
  floor_current             SMALLINT,
  floor_total               SMALLINT,
  built_year                SMALLINT,
  direction                 VARCHAR(10)
                            CHECK (direction IN
                              ('?®Ìñ•','?®Îèô??,'?®ÏÑú??,'?ôÌñ•','?úÌñ•','Î∂ÅÌñ•','Î∂ÅÎèô??,'Î∂ÅÏÑú??)),

  images                    JSONB                  NOT NULL DEFAULT '[]',
  detail_info               JSONB                  NOT NULL DEFAULT '{}',
  status                    listing_status_t       NOT NULL DEFAULT 'active',
  agent_memo                TEXT,
  source_inquiry_id         UUID REFERENCES customer_inquiries(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ            NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ            NOT NULL DEFAULT now(),

  CONSTRAINT chk_sale_price
    CHECK (NOT ('sale' = ANY(transaction_types))
           OR (price_sale IS NOT NULL AND price_sale > 0)),
  CONSTRAINT chk_jeonse_price
    CHECK (NOT ('jeonse' = ANY(transaction_types))
           OR (deposit IS NOT NULL AND deposit > 0 AND maintenance_fee IS NOT NULL)),
  CONSTRAINT chk_monthly_rent_price
    CHECK (NOT ('monthly_rent' = ANY(transaction_types))
           OR (deposit IS NOT NULL
               AND monthly_rent IS NOT NULL AND monthly_rent > 0
               AND maintenance_fee IS NOT NULL)),
  CONSTRAINT chk_premium_transfer_price
    CHECK (NOT ('premium_transfer' = ANY(transaction_types))
           OR (deposit IS NOT NULL
               AND monthly_rent IS NOT NULL AND monthly_rent > 0
               AND maintenance_fee IS NOT NULL
               AND premium_price IS NOT NULL AND premium_price >= 0
               AND contract_remaining_months IS NOT NULL AND contract_remaining_months > 0))
);

CREATE INDEX idx_listings_agent_status
  ON property_listings(agent_id, status, created_at DESC);

CREATE INDEX idx_listings_location
  ON property_listings USING GIST(location);

CREATE INDEX idx_listings_categories
  ON property_listings USING GIN(category_codes);

CREATE TRIGGER trigger_listings_updated_at
  BEFORE UPDATE ON property_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TABLE matches (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID          NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  inquiry_id      UUID          NOT NULL REFERENCES customer_inquiries(id) ON DELETE CASCADE,
  property_id     UUID          NOT NULL REFERENCES property_listings(id) ON DELETE CASCADE,
  score           NUMERIC(4,3)  NOT NULL CHECK (score BETWEEN 0 AND 1),
  score_breakdown JSONB         NOT NULL DEFAULT '{}',
  is_shown        BOOLEAN       NOT NULL DEFAULT FALSE,
  is_liked        BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  UNIQUE (inquiry_id, property_id)
);

CREATE INDEX idx_matches_agent_inquiry
  ON matches(agent_id, inquiry_id, score DESC);

CREATE INDEX idx_matches_pending
  ON matches(agent_id, is_shown) WHERE is_shown = FALSE;
CREATE TABLE billing_histories (
  id              UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID                  NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  order_id        TEXT                  UNIQUE NOT NULL,
  payment_key     TEXT,
  plan            subscription_plan_t   NOT NULL,
  amount          INTEGER               NOT NULL CHECK (amount > 0),
  status          VARCHAR(20)           NOT NULL
                  CHECK (status IN ('success','failed','cancelled','refunded')),
  failure_reason  TEXT,
  billed_at       TIMESTAMPTZ           NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE INDEX idx_billing_agent_date
  ON billing_histories(agent_id, billed_at DESC);
CREATE OR REPLACE FUNCTION get_inquiry_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (month TEXT, total BIGINT, looking_for BIGINT, listing BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM'),
    COUNT(*),
    COUNT(*) FILTER (WHERE inquiry_type = 'looking_for'),
    COUNT(*) FILTER (WHERE inquiry_type = 'listing')
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY DATE_TRUNC('month', created_at) ORDER BY 1;
$$;

CREATE OR REPLACE FUNCTION get_funnel_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (status TEXT, count BIGINT, ratio NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH total AS (
    SELECT COUNT(*) AS cnt FROM customer_inquiries
    WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  )
  SELECT status::TEXT, COUNT(*),
    ROUND(COUNT(*) * 100.0 / NULLIF((SELECT cnt FROM total), 0), 1)
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY status
  ORDER BY ARRAY_POSITION(
    ARRAY['new','contacted','viewing','negotiating','contracted','closed']::TEXT[], status::TEXT
  );
$$;

CREATE OR REPLACE FUNCTION get_listing_status_stats(p_agent_id UUID)
RETURNS TABLE (status TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT status::TEXT, COUNT(*) FROM property_listings
  WHERE agent_id = p_agent_id GROUP BY status;
$$;

CREATE OR REPLACE FUNCTION get_listing_category_stats(
  p_agent_id UUID, p_start TIMESTAMPTZ, p_end TIMESTAMPTZ
)
RETURNS TABLE (month TEXT, category TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
    UNNEST(category_codes)::TEXT AS category,
    COUNT(*)
  FROM property_listings
  WHERE agent_id = p_agent_id AND created_at BETWEEN p_start AND p_end
  GROUP BY 1, 2 ORDER BY 1, 2;
$$;

CREATE OR REPLACE FUNCTION get_contract_duration_stats(p_agent_id UUID)
RETURNS TABLE (duration_range TEXT, count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    CASE
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 7  THEN '1Ï£ºÏù¥??
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 14 THEN '1~2Ï£?
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 30 THEN '2~4Ï£?
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 90 THEN '1~3Í∞úÏõî'
      ELSE '3Í∞úÏõî?¥ÏÉÅ'
    END,
    COUNT(*)
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND status = 'contracted'
  GROUP BY 1 ORDER BY MIN(EXTRACT(DAY FROM updated_at - created_at));
$$;
CREATE OR REPLACE FUNCTION cleanup_cancelled_agents()
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_count INTEGER;
BEGIN
  DELETE FROM agents
  WHERE subscription_status = 'cancelled'
    AND cancelled_at < now() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- agents
-- INSERT ?ïÏ±Ö: 013?êÏÑú Ï∂îÍ? (Î∞©Ïñ¥???àÏö©, user_id = auth.uid())
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_own ON agents FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY agents_update_own ON agents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- customer_inquiries
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY inquiries_select_own ON customer_inquiries FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_insert_own ON customer_inquiries FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_update_own ON customer_inquiries FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY inquiries_delete_own ON customer_inquiries FOR DELETE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- property_listings
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
ALTER TABLE property_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY listings_select_own ON property_listings FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_insert_own ON property_listings FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_update_own ON property_listings FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY listings_delete_own ON property_listings FOR DELETE
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- matches
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_select_own ON matches FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_insert_own ON matches FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_update_own ON matches FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- billing_histories
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
ALTER TABLE billing_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_select_own ON billing_histories FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- Storage (Î≤ÑÌÇ∑: landnote-media, private)
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
CREATE POLICY storage_insert_own ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'landnote-media'
    AND (storage.foldername(name))[2] = (
      SELECT id::TEXT FROM agents WHERE user_id = auth.uid()
    )
  );
CREATE POLICY storage_delete_own ON storage.objects FOR DELETE
  USING (
    bucket_id = 'landnote-media'
    AND (storage.foldername(name))[2] = (
      SELECT id::TEXT FROM agents WHERE user_id = auth.uid()
    )
  );
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- Part A: customer_inquiries??Ï¢åÌëú Ïª¨Îüº Ï∂îÍ?
-- (property_listings?Ä ?ôÏùº ?®ÌÑ¥)
-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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

-- Í±∞Î¶¨ ?ºÍ¥Ñ Í≥ÑÏÇ∞ RPC (Îß§Ïπ≠ ??1???∏Ï∂ú)
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

-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä
-- Part B: push_subscriptions ?åÏù¥Î∏?-- ?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä?Ä

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
-- =============================================
-- 012_admin.sql ??Í¥ÄÎ¶¨Ïûê ?úÏä§???åÏù¥Î∏?-- =============================================

-- Í¥ÄÎ¶¨Ïûê Í≥ÑÏ†ï ?åÏù¥Î∏?CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin',  -- 'superadmin' | 'admin'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ?ëÏÜç Î°úÍ∑∏ ?åÏù¥Î∏?(Ï§ëÍ∞ú??API ?∏Ï∂ú Ï∂îÏ†Å)
CREATE TABLE access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  action VARCHAR(10) NOT NULL,   -- 'GET', 'POST', 'PATCH', 'DELETE'
  path VARCHAR(255) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Í¥ÄÎ¶¨Ïûê Í∞êÏÇ¨ Î°úÍ∑∏ (Í¥ÄÎ¶¨Ïûê ?∞Í∏∞ ?ëÏóÖ Ï∂îÏ†Å)
CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,          -- 'change_agent_status', 'change_agent_plan' ??  target_type VARCHAR(50) NOT NULL,      -- 'agent', 'billing' ??  target_id UUID NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ?∏Îç±??CREATE INDEX idx_access_logs_agent_created ON access_logs(agent_id, created_at);
CREATE INDEX idx_access_logs_created ON access_logs(created_at);
CREATE INDEX idx_admin_audit_created ON admin_audit_logs(created_at);

-- RLS: ?ïÏ±Ö ?ÜÏùå ??SERVICE_ROLE_KEYÎß??ëÍ∑º Í∞Ä??ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- access_logs 90??Î≥¥Í? ?ïÎ¶¨ ?®Ïàò
CREATE OR REPLACE FUNCTION cleanup_old_access_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
  DELETE FROM access_logs WHERE created_at < now() - (retention_days || ' days')::INTERVAL;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
-- agents INSERT ?ïÏ±Ö Ï∂îÍ?
-- SERVICE_ROLE_KEYÍ∞Ä ?ïÏÉÅ?¥Î©¥ RLS ?∞Ìöå?òÎ?Î°????ïÏ±Ö?Ä Î¨¥Í?
-- SERVICE_ROLE_KEY ?ÑÎùΩ/?§Î•ò ??Î∞©Ïñ¥?ÅÏúºÎ°?Î≥∏Ïù∏ ???ΩÏûÖ ?àÏö©
CREATE POLICY agents_insert_own ON agents FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE TABLE customer_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone VARCHAR(20) NOT NULL,
  code VARCHAR(6) NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_customer_otps_phone ON customer_otps(phone);
ALTER TABLE customer_inquiries ADD COLUMN complex_name VARCHAR(100), ADD COLUMN building_num VARCHAR(20), ADD COLUMN room_num VARCHAR(20);
ALTER TABLE property_listings ADD COLUMN complex_name VARCHAR(100), ADD COLUMN building_num VARCHAR(20), ADD COLUMN room_num VARCHAR(20);
ALTER TABLE customer_inquiries ADD COLUMN price_jeonse NUMERIC(15,0);
ALTER TABLE property_listings ADD COLUMN price_jeonse NUMERIC(15,0);

-- ?úÏïΩ Ï°∞Í±¥ ?òÏ†ï
ALTER TABLE property_listings DROP CONSTRAINT IF EXISTS chk_jeonse_price;
ALTER TABLE property_listings ADD CONSTRAINT chk_jeonse_price CHECK (NOT ('jeonse' = ANY(transaction_types)) OR (price_jeonse IS NOT NULL AND price_jeonse > 0));
ALTER TABLE customer_inquiries ADD COLUMN area_land NUMERIC(8,2);
ALTER TABLE customer_inquiries ADD COLUMN area_building NUMERIC(8,2);
ALTER TABLE property_listings ADD COLUMN area_land NUMERIC(8,2);
ALTER TABLE property_listings ADD COLUMN area_building NUMERIC(8,2);
ALTER TABLE customer_inquiries ADD COLUMN area_contract NUMERIC(8,2);
ALTER TABLE property_listings ADD COLUMN area_contract NUMERIC(8,2);
ALTER TABLE property_listings
ADD COLUMN owner_phone VARCHAR(20) NOT NULL DEFAULT '',
ADD COLUMN contract_party_phone VARCHAR(20);

-- ?¥Ï†Ñ???±Î°ù??Îß§Î¨º??Ï§?owner_phone??ÎπÑÏñ¥?àÎäî Í≤ΩÏö∞(?àÎ°ú ?ÑÏàòÍ∞íÏù¥ÎØÄÎ°??ÑÏãúÍ∞?
-- ?§Î¨¥?êÏÑú??NOT NULL???ÅÏö©?òÍ∏∞ ??Í∏∞Ï°¥ ?∞Ïù¥??ÎßàÏù¥Í∑∏Î†à?¥ÏÖò???ÑÏöî?©Îãà??
-- ?¨Í∏∞?úÎäî ?ºÎã® Ï∂îÍ? ??DEFAULT ''Î•?Î∂Ä?¨Ìñà?µÎãà??
ALTER TABLE matches
ADD COLUMN shown_count INT NOT NULL DEFAULT 0;

-- Í∏∞Ï°¥ is_shown??TRUE?Ä???∞Ïù¥??ÎßàÏù¥Í∑∏Î†à?¥ÏÖò
UPDATE matches SET shown_count = 1 WHERE is_shown = TRUE;

-- is_shown Ïª¨Îüº ??†ú
ALTER TABLE matches DROP COLUMN is_shown;

-- ?∏Îç±??Î≥ÄÍ≤?(pending ?êÎã®: shown_count = 0)
DROP INDEX IF EXISTS idx_matches_pending;
CREATE INDEX idx_matches_pending ON matches(agent_id, shown_count) WHERE shown_count = 0;
