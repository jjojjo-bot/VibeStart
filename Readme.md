<div align="center">

# VibeStart

**비전공자가 AI 코딩을 시작하는 가장 빠른 길**
*The fastest path for non-developers to start AI-assisted coding*

[![Live Site](https://img.shields.io/badge/Live-vibe--start.com-7c3aed)](https://vibe-start.com)
[![Blog](https://img.shields.io/badge/Blog-1daymillion.com-22c55e)](https://1daymillion.com/category/vibe-coding/)
[![Made with Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs)](https://nextjs.org)
[![Deploys on Vercel](https://img.shields.io/badge/Deploys-Vercel-black?logo=vercel)](https://vercel.com)
[![Languages](https://img.shields.io/badge/i18n-6%20locales-3b82f6)]()

[**🌐 Live Site**](https://vibe-start.com) · [**📖 Blog**](https://1daymillion.com/category/vibe-coding/) · [**🎯 30분 시작하기**](https://vibe-start.com/onboarding)

</div>

---

## What is VibeStart

VibeStart는 비전공자가 **AI 코딩(vibe coding)**을 처음 시작할 때 가장 큰 벽인 *개발 환경 세팅*을 자동화하는 웹 서비스입니다. Git, Node.js, VS Code, Cursor 같은 도구를 OS·목적·경험 수준에 맞춰 하나하나 안내하고, 복사·붙여넣기만으로 30분 안에 첫 Next.js 프로젝트를 띄울 수 있게 합니다.

VibeStart helps non-developers cross the single hardest barrier in AI-assisted coding — *setting up a local development environment*. Pick your OS and goal, paste the generated commands, and you have Git, Node.js, VS Code, Cursor, and a deployable Next.js project ready in 30 minutes.

### Why this matters

- **2026년 한국 IT 채용 시장이 'AI 네이티브'를 명시적으로 요구하기 시작했지만**, 비전공자 이탈의 60%가 "환경 설치 단계"에서 발생합니다 (실제 비전공자 워크스루 데이터)
- ChatGPT·Claude·Cursor 같은 AI 도구는 "코딩"보다 "환경 세팅"에서 더 많이 막힙니다 — 그 격차가 진입 장벽
- VibeStart는 그 격차를 메워 비전공자가 *진짜 코딩으로* 빠르게 진입하게 합니다

---

## Live experience

```
1. https://vibe-start.com 접속
2. OS · 목표 · 경험 수준 선택 (30초)
3. 생성된 명령어 복사 → 터미널 붙여넣기 → 실행
4. Git · Node.js · VS Code · Cursor 자동 설치 (10분)
5. Next.js 프로젝트 생성 + npm run dev (5분)
6. 브라우저에서 첫 페이지 확인 → 완료
```

총 30분 이내. 100% 무료. **재부팅 없이.**

---

## Features

### Phase 1 — 환경 세팅 (현재 출시)
- 🪟 **Windows·🍎 macOS 지원** — OS별 최적화된 명령어 자동 생성
- 🎯 **4개 트랙** — 정적·동적·AI·이커머스 (다른 트랙은 곧 제공)
- 📋 **단계별 스크립트** — 복사/붙여넣기만으로 끝나는 검증된 명령어
- 🌍 **6개 언어** — 한국어·English·日本語·中文·Español·हिन्दी
- 🛡 **사용자 승인 기반** — 임의 명령 실행 X, allowlist Task Catalog만

### Phase 2 — 배포까지 (베타)
- 🚀 **GitHub + Vercel 자동 배포** — 첫 라이브 URL 30분 안에
- 🔐 **Google OAuth + Supabase Auth** — 로그인 기능 1클릭 추가
- 🤖 **바이브코딩 실전 마일스톤** — Cursor·Claude Code로 AI에게 수정 요청

### 콘텐츠 자산
- 📝 **개발자 심화 블로그** (한·영) — Vercel AI SDK · OWASP ASI · Lakera Guard 등 실코드 가이드
- 📖 **비전공자 입문 블로그** ([1daymillion.com](https://1daymillion.com/category/vibe-coding/)) — 매일 업데이트

---

## Tech stack

| 영역 | 기술 |
|------|-----|
| 프레임워크 | Next.js 16 (App Router) · React 19 |
| 스타일 | Tailwind CSS 4 · shadcn/ui |
| 모노레포 | pnpm workspaces |
| i18n | next-intl (`localePrefix: as-needed`) |
| DB | Supabase (Postgres + Auth) |
| 배포 | Vercel (Edge + Functions) |
| AI | Vercel AI Gateway (OIDC) · Anthropic Claude · Google Gemini |
| 아키텍처 | 헥사고날 (Port & Adapter) |
| 테스트 | Vitest |

---

## Project structure

```
.
├── apps/
│   └── web/              # Next.js 웹앱 (메인 진입점)
│       ├── src/
│       │   ├── app/      # App Router (locale 별 라우팅)
│       │   ├── components/
│       │   └── lib/
│       ├── content/blog/ # MDX 블로그 (ko/en)
│       ├── messages/     # 6개 언어 i18n
│       └── public/
│
├── packages/
│   ├── shared-types/     # 공유 TypeScript 타입
│   ├── task-catalog/     # 허용된 Task 정의 (allowlist)
│   ├── policy-engine/    # 실행 정책 검증
│   ├── script-generator/ # OS별 셸 스크립트 조립
│   ├── ports/            # 헥사고날 Port 인터페이스
│   └── track-catalog/    # 4개 트랙 카탈로그
│
└── supabase/
    └── migrations/       # DB 스키마 (Phase 2 OAuth·프로젝트)
```

### 헥사고날 아키텍처 원칙
- **도메인은 Port(인터페이스)에만 의존**, 외부 시스템(DB·OS·UI)에 직접 의존 X
- **어댑터끼리 직접 참조 금지**, 모든 통신은 Port 경유
- 새 외부 연동은 **Port 정의 → Adapter 구현** 순서

---

## Quick start

### 사전 요구사항
- Node.js 18+
- pnpm 8+
- Supabase 프로젝트 (Phase 2 기능 사용 시)

### 설치
```bash
git clone https://github.com/jjojjo-bot/VibeStart.git
cd VibeStart
pnpm install
```

### 환경변수
```bash
cp apps/web/.env.example apps/web/.env.local
# .env.local 안 값을 채워주세요 (Supabase URL/key, GitHub OAuth, etc.)
```

### 개발 서버
```bash
pnpm dev:web        # localhost:3000
```

### 기타 명령
```bash
pnpm typecheck      # 전체 타입 체크
pnpm build          # 전체 빌드
pnpm -r test        # 전체 테스트
```

---

## Conventions

### 패키지 매니저
**pnpm만 사용** — npm·yarn 사용 금지

### 커밋 메시지
```
<type>(<scope>): <subject>

type:  feat | fix | refactor | test | docs | chore | perf
scope: web | shared-types | task-catalog | policy-engine | script-generator
```

### TypeScript
- `any` 금지 (불가피하면 `unknown` + 타입 가드)
- 모든 공개 함수에 반환 타입 명시
- `strict: true` 유지

### i18n
- 모든 UI 텍스트는 `apps/web/messages/{locale}.json`에 정의
- 한국어가 원본 — KO 변경 시 나머지 5개 언어 동시 반영

자세한 규칙은 [`CLAUDE.md`](./CLAUDE.md)를 참고하세요.

---

## Roadmap

- ✅ Phase 1 — 환경 세팅 (web-nextjs / web-python / web-java 트랙)
- ✅ Phase 2 M1~M3 — 배포 / 인증 / 바이브코딩 (베타)
- ⏳ Phase 2 M4~M6 — Analytics / Sentry / 도메인 (보류, 사용자 피드백 기반 재개)
- 🔜 Windows 네이티브 Claude Code(claude.exe) 경로 (WSL 재부팅 이슈 해소)
- 🔜 data-ai · mobile 트랙 추가
- 🔜 AI 에디터 Port 추출 (opinionated default + swappable internals)

---

## Related

- 🌐 **[vibe-start.com](https://vibe-start.com)** — 메인 서비스
- 📖 **[1daymillion.com/category/vibe-coding](https://1daymillion.com/category/vibe-coding/)** — 비전공자용 입문 블로그 (매일 1편)
- 📝 **[vibe-start.com/blog](https://vibe-start.com/blog)** — 개발자 심화 블로그 (한·영)

---

## License

이 저장소의 라이선스는 추후 결정됩니다. 현재는 reference 용도로 공개되어 있으며, 상업적 사용·재배포 전엔 [issue로 문의](https://github.com/jjojjo-bot/VibeStart/issues) 부탁드립니다.

---

<div align="center">

**Made with care for non-developers stepping into the AI coding era.**

[⭐ Star this repo](https://github.com/jjojjo-bot/VibeStart) if VibeStart helped you.

</div>
