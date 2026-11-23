-- 파키 앱 (PARKY APP) 구장 제원 점검 · 2-Strike 자동 승격 · 관리자 공식 확정 스키마
-- Supabase SQL Editor에서 1회 실행하면 영구 클라우드 동기화가 활성화됩니다.
-- (미실행 시에도 서버 로컬 캐시 폴백으로 정상 동작합니다.)

create table if not exists public.parkon_course_master_specs (
  course_id text primary key,
  course_name text not null,
  region text,
  total_courses integer not null default 2,
  total_holes integer not null default 18,
  holes_metadata jsonb not null default '[]'::jsonb,
  spec_status text not null default 'CROWD_VERIFIED', -- 'OFFICIAL_ADMIN' | 'CROWD_VERIFIED'
  verified_by text,
  evidence_photo_url text,
  strike_count integer not null default 1,
  updated_at timestamptz not null default now()
);

create table if not exists public.parkon_course_spec_submissions (
  id text primary key,
  course_id text not null,
  course_name text not null,
  region text,
  prev_total_courses integer,
  prev_holes_metadata jsonb,
  proposed_total_courses integer not null,
  proposed_total_holes integer not null,
  proposed_holes_metadata jsonb not null default '[]'::jsonb,
  signature text not null,
  evidence_photo_url text,
  source text not null default 'BATCH_EDIT', -- 'PHOTO_OCR' | 'BATCH_EDIT' | 'SCORECARD_DIFF' | 'TEEBOX' | 'ADMIN_DIRECT'
  contributor_name text not null default '현장 골퍼',
  member_code text,
  is_executive boolean not null default false,
  status text not null default 'PENDING', -- 'PENDING' | 'AUTO_PROMOTED' | 'APPROVED' | 'REJECTED'
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_course_spec_sub_course on public.parkon_course_spec_submissions (course_id, status);
create index if not exists idx_course_spec_sub_status on public.parkon_course_spec_submissions (status, created_at desc);
