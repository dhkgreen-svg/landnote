-- agents INSERT 정책 추가
-- SERVICE_ROLE_KEY가 정상이면 RLS 우회되므로 이 정책은 무관
-- SERVICE_ROLE_KEY 누락/오류 시 방어적으로 본인 행 삽입 허용
CREATE POLICY agents_insert_own ON agents FOR INSERT
  WITH CHECK (user_id = auth.uid());
