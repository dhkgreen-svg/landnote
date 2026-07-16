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
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 7  THEN '1주이내'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 14 THEN '1~2주'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 30 THEN '2~4주'
      WHEN EXTRACT(DAY FROM updated_at - created_at) <= 90 THEN '1~3개월'
      ELSE '3개월이상'
    END,
    COUNT(*)
  FROM customer_inquiries
  WHERE agent_id = p_agent_id AND status = 'contracted'
  GROUP BY 1 ORDER BY MIN(EXTRACT(DAY FROM updated_at - created_at));
$$;
