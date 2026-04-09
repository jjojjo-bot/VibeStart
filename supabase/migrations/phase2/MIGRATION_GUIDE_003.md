# Phase 2a 통계 통합 가이드 (003)

`vibestart` (통계 전용) 프로젝트를 폐기하고 모든 통계 테이블을
`vibestart-auth` (Phase 2 사용자 데이터) 프로젝트로 합친다. 목적은
Supabase Free 플랜의 organization당 active 프로젝트 2개 한도에서
1슬롯을 확보해 (마)-2 단계의 사용자 사이트 DB 자동 생성을 가능하게 함.

> **위험**: 데이터 이관 중 통계가 잠시 불일치할 수 있다. 트래픽이 적은
> 시간대에 진행. 실패해도 옛 vibestart 프로젝트를 살려두면 롤백 가능.

---

## 1. 사전 준비 — 백업

옛 `vibestart` Supabase 프로젝트의 SQL Editor에서 다음 쿼리로 데이터를
그대로 복사해 둔다 (텍스트로 저장 권장).

```sql
-- daily_stats 전체 export
select format(
  'insert into public.daily_stats (date, visitors, completions) values (%L, %s, %s) on conflict (date) do update set visitors = excluded.visitors, completions = excluded.completions;',
  date, visitors, completions
)
from public.daily_stats
order by date;

-- daily_country_stats 전체 export
select format(
  'insert into public.daily_country_stats (date, country_code, visitors, completions) values (%L, %L, %s, %s) on conflict (date, country_code) do update set visitors = excluded.visitors, completions = excluded.completions;',
  date, country_code, visitors, completions
)
from public.daily_country_stats
order by date, country_code;
```

각 결과를 모두 복사 (텍스트 컬럼 1개로 출력됨). 저장 위치: 로컬
파일 또는 메모장.

---

## 2. 새 스키마 + 함수 생성

`vibestart-auth` 프로젝트의 SQL Editor에서 `003_stats_consolidation.sql`
전체 내용을 복사 → 실행. 에러 없이 끝나면 다음 객체가 생긴다:

- 테이블 `public.daily_stats`, `public.daily_country_stats`
- 함수 `public.increment_daily_stat(text)`, `public.increment_daily_country_stat(text, text)`
- 두 테이블 모두 RLS 활성화 + "익명 SELECT 허용" policy
- 두 함수 모두 anon/authenticated에 execute 권한

---

## 3. 데이터 import

1단계에서 export한 SQL 텍스트를 `vibestart-auth` SQL Editor에 붙여넣고
실행. `daily_stats`부터 → `daily_country_stats` 순.

검증:
```sql
select count(*) from public.daily_stats;
select count(*) from public.daily_country_stats;
select * from public.daily_stats order by date desc limit 10;
```

---

## 4. 코드 전환 (이미 적용됨)

`apps/web/src/lib/supabase.ts`가 `NEXT_PUBLIC_AUTH_SUPABASE_*` 환경
변수를 사용하도록 코드는 이미 수정됐다. 다음 단계는 로컬 환경변수에서
옛 키를 제거하는 것.

---

## 5. `.env.local` 정리

로컬 `apps/web/.env.local`에서 다음 두 줄을 **삭제** 또는 주석 처리:

```bash
# NEXT_PUBLIC_SUPABASE_URL=https://gwzzymrusfwwqnuogcym.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

남겨도 동작에는 영향 없지만 더 이상 사용 안 함.

dev 서버 재시작 (`Ctrl+C → pnpm dev:web`).

---

## 6. 검증

- http://localhost:3000 접속 → 랜딩 페이지의 통계 패널이 정상 표시되는지
  (오늘 시작자/완료자, 차트, 국가별 TOP)
- 페이지 새로고침 → `/api/track` POST가 200 반환 → `vibestart-auth` SQL
  Editor에서 `select * from public.daily_stats where date = (now() at
  time zone 'Asia/Seoul')::date;` 카운트가 +1
- 브라우저 dev tools Network 탭에서 supabase 요청 URL이 `nnomhdipnfns...`
  (vibestart-auth)인지 확인

---

## 7. Vercel 프로덕션 환경변수 정리

https://vercel.com/dashboard → vibestart 프로젝트 → Settings → Environment
Variables:
- `NEXT_PUBLIC_SUPABASE_URL` 삭제
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 삭제
- `NEXT_PUBLIC_AUTH_SUPABASE_URL` / `NEXT_PUBLIC_AUTH_SUPABASE_ANON_KEY` /
  `AUTH_SUPABASE_SERVICE_ROLE_KEY`는 그대로 유지

저장 후 vercel 배포가 자동 트리거됨. 프로덕션 사이트에서 통계 작동
확인.

---

## 8. 옛 `vibestart` 프로젝트 삭제

검증 끝났으면 https://supabase.com/dashboard → 옛 `vibestart` 프로젝트
→ Settings → General → Delete project.

이제 organization의 active 프로젝트 슬롯이 1개 비었다. (마)-2 단계의
Supabase 프로젝트 자동 생성이 가능해진다.

---

## 롤백

문제가 생기면:
1. `apps/web/src/lib/supabase.ts`를 git revert해 옛 env 변수 사용
2. `.env.local`의 옛 키 복원 (백업 필요)
3. 옛 `vibestart` 프로젝트가 살아있다면 그대로 사용

`vibestart-auth`에 추가된 통계 테이블/함수는 삭제하지 않아도 무방
(공간만 차지).
