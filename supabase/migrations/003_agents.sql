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

  -- 구독
  subscription_plan     subscription_plan_t   NOT NULL DEFAULT 'starter',
  subscription_status   subscription_status_t NOT NULL DEFAULT 'trial',
  selected_categories   category_code_t[]     NOT NULL DEFAULT '{}'::category_code_t[],
  pending_plan          subscription_plan_t,
  category_changed_at   TIMESTAMPTZ,
  trial_ends_at         TIMESTAMPTZ,
  cancelled_at          TIMESTAMPTZ,

  -- 결제
  billing_key           TEXT,
  billing_card_info     JSONB,
  subscription_start    TIMESTAMPTZ,
  subscription_end      TIMESTAMPTZ,
  next_billing_date     TIMESTAMPTZ,
  billing_day           INTEGER               NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),

  created_at            TIMESTAMPTZ           NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ           NOT NULL DEFAULT now()
);

-- agent_code 자동 생성
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
