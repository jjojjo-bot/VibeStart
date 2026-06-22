# 시장 경쟁력 검증 — 딥리서치 (2026-06-22)

> 딥리서치 워크플로우 결과(`/deep-research`). **107 에이전트 · 25 소스 · 118 클레임 → 3표 적대 검증 18 confirmed / 7 killed**.
> ⚠️ **2026 H1 스냅샷** — Anthropic 제품·Lovable 지표·한국 강의 카탈로그 모두 빠르게 변함. 전략 commit 전 재검증할 것.

## 질문

VibeStart(비개발자 절대초보가 로컬에 Claude Code 등 AI 코딩 환경을 무실패로 설치·학습하도록 돕고, 5분 체험 템플릿 빌더로 입문시키는 한국어 우선 웹서비스)의 2026 상반기 시장 경쟁력 검증. (1) 제로설치 브라우저형 AI 앱 빌더 경쟁 강도 (2) 락인 없는 자립 교육 직접 경쟁자 (3) Claude Code 초보 온보딩 진화(플랫폼 의존 리스크) (4) 한국 비개발자 AI 앱제작 플레이어 (5) 절대초보 빌드 세그먼트 크기·결제의향. **목표: "앱을 준다(Lovable에 패배)" vs "직접 만들 능력을 준다(틈새)" 중 방어 가능한 포지션 판단.**

## 결론

**"직접 만들 능력을 준다(틈새)" 웨지는 방어 가능한 블루오션이 아니다** — VibeStart의 *정확한* 타겟(한국 비개발자)에서 이미 유료로 팔리는 **포화 카테고리**다. 반대편 "앱을 준다" 레인은 Lovable이 압도 방어. **둘 다 깨끗한 승리는 없고**, 방어 가능한 건 *좁은 조합 틈새 + 프롬프팅 갭*뿐이며, **수익화 모델이 미해결**.

## 핵심 발견 (confirmed)

| # | 발견 | 신뢰 | 핵심 근거 |
|---|---|---|---|
| 1 | **"능력을 준다" 포지션은 한국서 포화·유료** — VibeStart 차별점이 유니크하지 않음 | high (3-0) | FastCampus '클로드코드 뽀개기'(₩241k) 비개발자에 맥/윈 설치 + "원하는 결과를 스스로 만들어내는 실력". FastCampus 3~5강, Inflearn 다강좌(₩165k 등), 잔재미·retn.kr(₩100k)·Udemy·wikidocs·조태호책 |
| 2 | 영어권 직접 경쟁자 존재(부분 중첩) | med (2-1) | claudefordesigners($25~70 + Pro별도) "zero coding background, Claude Code가 코딩" 앱 9개 배포 교육 — 단 *디자이너·맥·영어* 한정 |
| 3 | **Claude Code 온보딩이 설치장벽을 직접 제거 (플랫폼 리스크 🔴)** | high (3-0) | 공식문서(v2.1.x): 무터미널 데스크톱 GUI(맥+윈), "Node.js·CLI 별도 설치 불필요", 원라인 네이티브 설치(npm은 'Advanced'로 강등) |
| 4 | Anthropic 비개발자 온보딩 투자 + Cowork 다운마켓 | high (3-0) | "터미널 처음이어도 OK" 가이드, "코딩 몰라도 됨". Claude Cowork(2026-01 출시, 4월 맥+윈 GA) "비기술 작업용, 기술 배경 불필요" |
| 5 | **설치 쉬워짐 ≠ 초보 성공 (프롬프팅 갭은 잔존)** | high (3-0) | Builder.io: "깔고 막연히 prompt → 결과 별로 → overhyped라 단정". 5+ 소스: 출력 품질 = 입력 구체성/구조에 좌우. *설치*는 Anthropic이 없애도 *프롬프팅*은 못 없앰 |
| 6 | 초보친화(데스크톱 GUI) 경로는 $20+/월 페이월 | high (2-1) | "Code 탭은 Pro/Max/Team/Enterprise 구독 필요". (CLI+API키 종량제 경로는 있으나 비개발자엔 비현실적) |
| 7 | Dyad = 무료 오픈소스 로컬 빌더(락인0) | high (3-0) | dyad.sh: "Zero lock-in, 내 머신에서, 내 코드". Apache 2.0 ~21k stars, 오프라인(Ollama). **단 비개발자 타겟 아님(0-3 기각), BYO-key 정렬 약함(1-2 기각)** |
| 8 | "앱을 준다" 레인은 Lovable 압도 — 정면승부 금지 | high (3-0) | $400M ARR(2/26), +$100M/월, 146명, 비개발자 자기식별 ~80%, "코딩 교육 아닌 완성 앱 제공" (3월 $500M/8M users) |
| 9 | 한국 세그먼트 WTP는 입증됨 (단, 곧 포화의 증거) | high (3-0 / 13k는 2-1) | Inflearn "13,000+ 클코 학습". 강의 ₩11k~264k. **WTP=있음, 그러나 같은 신호가 카테고리 포화를 증명** |

## 방어 가능한 좁은 틈새 (있긴 함)

1. **무료 × 한국어 × 윈도우우선 × 절대제로 × 5분템플릿 — 이 *조합 전체*를 복제한 경쟁자는 없음.** 한국 강의=유료·강사주도, claudefordesigners=영어·맥·디자이너, Anthropic GUI=$20+/월 페이월·개발자 프레이밍. → **단 각 축은 개별 점유돼 "얇은 조합 해자"지 유니크 포지션 아님.**
2. **프롬프팅/학습 갭 = 진짜 웨지.** 설치 도우미를 넘는 **가이드/학습 레이어**. (갭은 *개발자* 대상 입증; "비개발자에 더 큼"은 합리적 추론, 직접 측정 아님)

## 🚨 수익화 역설 (핵심 미해결)

- VibeStart 방침 = **자체 유료 AI 금지**(AI는 사용자 몫)
- Anthropic 온보딩 = 무마찰이지만 **유료 게이트**
- 한국 강의 = WTP를 ₩11k~264k로 **이미 선점**
- 무료 Dyad류 도구 = **존재**

→ **VibeStart는 "포화된 유료 강의판 + 무료 도구"가 *안 주는* 무엇을 파는가?**

## 적대 검증에서 *기각*된 주장 (과장 금지)

- ❌ "Claude Code 완전 무료 없음" (0-3) — API키 CLI 종량제 경로 존재(초보엔 비현실적). *초보친화 GUI 경로*가 페이월인 건 사실.
- ❌ "Dyad가 비개발자 타겟" (0-3)
- ❌ "영어 경쟁자가 finish-vs-start 축으로 v0/Bolt와 차별화" (0-3)
- ⚠️ "Anthropic이 normie 정조준" (1-2) → "다운마켓 *방향성*"으로만 표현
- ⚠️ "Claude Code 온보딩이 기술역량 가정" (0-3) → 오히려 초보 가이드 강화 중

## 열린 질문 (전략 결정 전 채워야)

1. **무료 가이드 설치 *후* 절대초보의 전환/잔존** — 진짜 앱까지 가나, 프롬프팅 갭에서 이탈하나? (데이터 없음)
2. **한국 13,000 학습자 중 *진짜 지식0 초보* 비율** vs 업스킬 개발자? (페르소나 중첩 미측정)
3. **Anthropic이 (무료티어+한국어+초보가이드) 붙이면 웨지 붕괴** — 그 전에 한국어 무료 선점이 먼저인가?
4. **수익화 경로** (위 역설) — 무엇을 팔 것인가?

## 통계

5 angles · 25 sources fetched · 118 claims → 25 verified (18 confirmed / 7 killed) → 9 synthesized. 107 agent calls.

## 소스 (각도별)

- **브라우저형 빌더**: techcrunch(Lovable $100M/월), altar.io(빌더 비교), rocket.new, neurohive(클코 입문)
- **락인없는 자립교육**: claudefordesigners, digitalmarketer.co.kr, pasqualepillitteri(빌더 비교 2026), xda(Google Opal), builder.io(클코 사용법), nxcode(opencode vs 클코)
- **플랫폼 리스크**: code.claude.com/docs(desktop-quickstart·setup), anthropic.com/claude-cowork, docs.anthropic.com/setup, opencowork.chat(윈도우), simonwillison(cowork), aragonresearch(cowork)
- **한국 플레이어**: inflearn/claudecode2026, retn.kr, fastcampus/biz_online_claudecode, waveon.io(노코드)
- **세그먼트 사이징**: zdnet.co.kr, wowtale(2건), findskill.ai(vibe-coding by numbers), dyad.sh
