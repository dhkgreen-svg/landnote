ALTER TABLE customer_inquiries ADD COLUMN area_land NUMERIC(8,2);
ALTER TABLE customer_inquiries ADD COLUMN area_building NUMERIC(8,2);
ALTER TABLE property_listings ADD COLUMN area_land NUMERIC(8,2);
ALTER TABLE property_listings ADD COLUMN area_building NUMERIC(8,2);