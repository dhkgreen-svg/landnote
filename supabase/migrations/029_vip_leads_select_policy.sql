CREATE POLICY "Allow authenticated users to read VIP leads" 
ON vip_leads 
FOR SELECT 
TO authenticated 
USING (true);
