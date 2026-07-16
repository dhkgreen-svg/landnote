-- ────────────────────────────────────────────
-- agents
-- INSERT 정책: 013에서 추가 (방어적 허용, user_id = auth.uid())
-- ────────────────────────────────────────────
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY agents_select_own ON agents FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY agents_update_own ON agents FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ────────────────────────────────────────────
-- customer_inquiries
-- ────────────────────────────────────────────
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

-- ────────────────────────────────────────────
-- property_listings
-- ────────────────────────────────────────────
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

-- ────────────────────────────────────────────
-- matches
-- ────────────────────────────────────────────
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY matches_select_own ON matches FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_insert_own ON matches FOR INSERT
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));
CREATE POLICY matches_update_own ON matches FOR UPDATE
  USING  (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()))
  WITH CHECK (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ────────────────────────────────────────────
-- billing_histories
-- ────────────────────────────────────────────
ALTER TABLE billing_histories ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_select_own ON billing_histories FOR SELECT
  USING (agent_id = (SELECT id FROM agents WHERE user_id = auth.uid()));

-- ────────────────────────────────────────────
-- Storage (버킷: landnote-media, private)
-- ────────────────────────────────────────────
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
