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
