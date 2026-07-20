-- Update listing_status_t ENUM to include 6 states: active, premium, in_progress, error, contracted, closed.
-- pending is mapped to in_progress.

-- 1. Rename existing ENUM
ALTER TYPE listing_status_t RENAME TO listing_status_t_old;

-- 2. Create new ENUM
CREATE TYPE listing_status_t AS ENUM ('active', 'premium', 'in_progress', 'error', 'contracted', 'closed');

-- 3. Alter table to use the new ENUM with mapping
ALTER TABLE property_listings
  ALTER COLUMN status TYPE listing_status_t
  USING (
    CASE
      WHEN status::text = 'pending' THEN 'in_progress'::listing_status_t
      ELSE status::text::listing_status_t
    END
  );

-- 4. Drop the old ENUM
DROP TYPE listing_status_t_old;
