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
                              ('남향','남동향','남서향','동향','서향','북향','북동향','북서향')),

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
