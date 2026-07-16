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
