-- Add premium optional fields to vip_leads table
ALTER TABLE vip_leads 
ADD COLUMN purchase_purpose text,
ADD COLUMN briefing_preference text;
