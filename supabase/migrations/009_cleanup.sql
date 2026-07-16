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
