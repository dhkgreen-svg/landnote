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
