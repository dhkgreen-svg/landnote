-- add new values to enum (if they don't exist yet, we can't do IF NOT EXISTS directly in postgres 11 but supabase supports it usually, or we can just run it)
ALTER TYPE subscription_plan_t ADD VALUE IF NOT EXISTS 'minimal' BEFORE 'pro';
ALTER TYPE subscription_plan_t ADD VALUE IF NOT EXISTS 'standard' BEFORE 'pro';

-- migrate any existing 'starter' agents to 'pro' for now (the admin account)
UPDATE agents SET subscription_plan = 'pro' WHERE subscription_plan = 'starter';
UPDATE agents SET pending_plan = 'pro' WHERE pending_plan = 'starter';

-- update billing histories
UPDATE billing_histories SET plan = 'pro' WHERE plan = 'starter';
