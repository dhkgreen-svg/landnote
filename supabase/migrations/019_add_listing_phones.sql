ALTER TABLE property_listings
ADD COLUMN owner_phone VARCHAR(20) NOT NULL DEFAULT '',
ADD COLUMN contract_party_phone VARCHAR(20);

-- 이전에 등록된 매물들 중 owner_phone이 비어있는 경우(새로 필수값이므로 임시값)
-- 실무에서는 NOT NULL을 적용하기 전 기존 데이터 마이그레이션이 필요합니다.
-- 여기서는 일단 추가 시 DEFAULT ''를 부여했습니다.
