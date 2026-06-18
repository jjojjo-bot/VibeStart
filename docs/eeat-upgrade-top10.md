# E-E-A-T 업그레이드 체크리스트 — 상위 10개 글

> 2026-06-18 작성. 색인 요청 상위 10개 글에 **실제 스크린샷 + 1차 경험 + 권위 링크 + 고유 관점**을 박아 "AI 재탕 → 직접 해본 글"로 전환.
> 분량은 이미 충분(중앙값 6,142자) → 글자 추가 말고 아래 증거만 보강.
> 각 글 공통: 인트로 "이 글에서는~" 템플릿 제거 → 구체 훅으로 시작. 근거 없는 "10분/월 $1~5" 단언 → 실측·추정 구분.

---

## 1. claude-code-beginner-guide
- [ ] 📸 캡처: `npm i -g @anthropic-ai/claude-code` 실행 화면 / `claude` 첫 로그인 / API 키 입력 후 첫 응답 / (가능하면) EACCES·권한 에러 화면
- [ ] ✍️ 경험: 실제 설치~첫 응답 소요 시간, 맥 `-g` 권한 에러 → nvm 재설치 해결담, 첫 달 실제 토큰 비용(실측)
- [ ] 🔗 출처: docs.anthropic.com Claude Code 문서, Node.js LTS 페이지
- [ ] 💡 고유 관점: Cursor 대신 Claude Code가 안 맞는 경우 1가지

## 2. cursor-install-first-project
- [ ] 📸 캡처: cursor.com 다운로드 / 첫 실행 / VS Code 설정 import 다이얼로그 / Cmd+K(Composer) 첫 코드 생성
- [ ] ✍️ 경험: VS Code 확장 import 시 안 옮겨진 것, 첫 프로젝트까지 실제 시간
- [ ] 🔗 출처: cursor.com 공식, VS Code 마이그레이션 문서
- [ ] 💡 고유 관점: 무료 플랜으로 어디까지 실제 되는지 체감

## 3. vibe-coding-nextjs-project-create
- [ ] 📸 캡처: `npx create-next-app` 옵션 선택 프롬프트 / 설치 로그 / `npm run dev` 후 localhost:3000 기본 화면
- [ ] ✍️ 경험: TS/Tailwind/App Router 실제 고른 값과 이유, 설치 소요 시간
- [ ] 🔗 출처: nextjs.org create-next-app 문서
- [ ] 💡 고유 관점: 비전공자가 첫 선택에서 가장 헷갈리는 옵션 1개

## 4. vibe-coding-vercel-free-deploy
- [ ] 📸 캡처: Vercel GitHub import 화면 / 빌드 로그 / 배포 완료 + 라이브 URL / (가능하면) 빌드 실패 로그
- [ ] ✍️ 경험: 첫 배포 빌드 실패(예: 환경변수 누락) → 해결 과정, 배포 소요 시간
- [ ] 🔗 출처: vercel.com/docs 배포 문서
- [ ] 💡 고유 관점: 무료 플랜 한계에 실제로 부딪히는 지점

## 5. google-ai-studio-vibe-coding
- [ ] 📸 캡처: aistudio.google.com 첫 화면 / 프롬프트+응답 / API 키 발급 화면
- [ ] ✍️ 경험: 무료 한도 실제 체감, 어떤 작업까지 공짜로 됐는지
- [ ] 🔗 출처: ai.google.dev 공식
- [ ] 💡 고유 관점: 유료 도구로 넘어가야 할 시점

## 6. localhost-3000-not-working-fix
- [ ] 📸 캡처: 실제 에러 화면(ERR_CONNECTION_REFUSED/포트 점유) / `lsof -i :3000` 결과 / 해결 후 정상 화면
- [ ] ✍️ 경험: 본인이 실제 겪은 케이스(포트 점유 프로세스 kill 등) 재현 조건
- [ ] 🔗 출처: Next.js·Node 포트 문서
- [ ] 💡 고유 관점: 5가지 원인 중 비전공자에게 가장 흔한 것

## 7. npm-install-error-solutions
- [ ] 📸 캡처: 실제 npm 에러 로그(EACCES/ERESOLVE/네트워크) / 해결 명령(`npm cache clean --force` 등) 실행 화면
- [ ] ✍️ 경험: 실제 만난 에러 1~2개 + 재현 조건
- [ ] 🔗 출처: docs.npmjs.com
- [ ] 💡 고유 관점: 에러 메시지 안 읽고 검색부터 하는 습관 경고

## 8. create-next-app-error-solutions
- [ ] 📸 캡처: 실제 create-next-app 실패 로그 / 해결 후 성공 화면
- [ ] ✍️ 경험: 실제 케이스(네트워크/권한/버전 충돌) + 해결
- [ ] 🔗 출처: nextjs.org
- [ ] 💡 고유 관점: 에러보다 사전 예방(노드 버전) 강조

## 9. github-signup-repository-guide
- [ ] 📸 캡처: GitHub 가입 폼 / 이메일 인증 / 첫 repo 생성 화면 / repo 초기 화면
- [ ] ✍️ 경험: 2FA 설정 실제 경험, 첫 repo까지 시간
- [ ] 🔗 출처: docs.github.com
- [ ] 💡 고유 관점: 비전공자가 처음에 헷갈리는 public/private 선택

## 10. mcp-beginner-guide
- [ ] 📸 캡처: Claude/Cursor에 MCP 서버 추가하는 설정 파일(JSON) 화면 / 실제 MCP 도구 호출 결과 화면
- [ ] ✍️ 경험: 실제로 붙여본 MCP 서버 1개 + 동작 결과·걸린 시간
- [ ] 🔗 출처: modelcontextprotocol.io 공식
- [ ] 💡 고유 관점: MCP가 아직 과한 경우(언제 안 써도 되는지)

---

## 진행 팁
- 색인 요청과 묶어서: **요청 전에 해당 글을 먼저 보강**하면 구글이 첫 크롤에서 좋은 신호를 본다.
- 스크린샷은 캡처 → `cwebp -q 85`로 WebP 변환 → WP 미디어 업로드(§3 파이프라인).
- 한 번에 다 말고 하루 1~2개씩. 10개 끝나면 그게 "이 사이트는 진짜다"의 증거 코어가 된다.
- 향후 새 글은 BLOG_WRITING_GUIDE_WP.md §13 "E-E-A-T — 1차 경험 증거"가 강제하므로 처음부터 박고 작성.
