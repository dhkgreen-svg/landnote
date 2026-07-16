ALTER TABLE customer_inquiries ADD COLUMN price_jeonse NUMERIC(15,0);
ALTER TABLE property_listings ADD COLUMN price_jeonse NUMERIC(15,0);

-- 제약 조건 수정
ALTER TABLE property_listings DROP CONSTRAINT IF EXISTS chk_jeonse_price;
ALTER TABLE property_listings ADD CONSTRAINT chk_jeonse_price CHECK (NOT ('jeonse' = ANY(transaction_types)) OR (price_jeonse IS NOT NULL AND price_jeonse > 0));