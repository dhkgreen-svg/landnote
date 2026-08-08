-- VIP 랜딩페이지 전용 고객 DB 테이블 생성
CREATE TABLE vip_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  source text NOT NULL DEFAULT 'beomeo-160',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 외부 랜딩페이지에서 폼 제출(Insert)을 허용하도록 보안(RLS) 해제 또는 정책 추가
ALTER TABLE vip_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous inserts for VIP leads" ON vip_leads FOR INSERT TO anon WITH CHECK (true);
