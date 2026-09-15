-- OAuth 연결 토큰 저장 방식 문서화.
--
-- 신규/재연결 토큰은 앱 서버에서 AES-256-GCM 암호화한 뒤 기존 text 컬럼에
-- 저장한다. 스키마 변경은 없으며, 배포 전 평문 row는 사용자가 다시 연결할
-- 때 암호문으로 교체된다.

comment on column public.oauth_connections.access_token is
  '앱 서버 AES-256-GCM 암호문. 배포 전 legacy row는 재연결 전까지 평문일 수 있음';
comment on column public.oauth_connections.refresh_token is
  '앱 서버 AES-256-GCM 암호문 또는 null. 배포 전 legacy row는 평문일 수 있음';
