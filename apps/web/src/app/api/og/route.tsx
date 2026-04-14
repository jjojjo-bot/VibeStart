import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="M 16,24 L 38,40 L 16,56" fill="none" stroke="#c4b5fd" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><line x1="42" y1="56" x2="64" y2="56" stroke="#c4b5fd" stroke-width="8" stroke-linecap="round"/></svg>`;
const LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

const CHECK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>`;
const CHECK_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(CHECK_SVG)}`;

// Google Fonts CSS API에서 특정 weight + 사용 글자만 서브셋 받아 ArrayBuffer로 반환.
// User-Agent를 모던 브라우저로 위장해야 woff2를 돌려준다 (Satori는 woff2 OK).
async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family,
  )}:wght@${weight}&text=${encodeURIComponent(text)}`;
  const cssRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\(([^)]+)\)\s*format/);
  if (!match) {
    throw new Error(`Font URL not found in Google Fonts CSS for ${family}`);
  }
  const fontRes = await fetch(match[1]);
  return fontRes.arrayBuffer();
}

export async function GET(req: NextRequest): Promise<ImageResponse> {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  if (type === "share") {
    return renderShareCard(searchParams);
  }
  return renderDefaultCard();
}

/**
 * 기본 OG 카드 — 전체 사이트 공유용.
 */
async function renderDefaultCard(): Promise<ImageResponse> {
  const wordmarkText = "VibeStart";
  const latinText = "VibeStart vibe-start.com 123&";
  const koreanText = "바이브코딩, 여기서 시작하세요간단한 질문맞춤 안내복사 & 붙여넣기";

  const [geistBold, geistMedium, notoKrMedium] = await Promise.all([
    loadGoogleFont("Geist", 800, wordmarkText),
    loadGoogleFont("Geist", 500, latinText),
    loadGoogleFont("Noto Sans KR", 500, koreanText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist, 'Noto Sans KR'",
          position: "relative",
          background:
            "linear-gradient(135deg, #0f0820 0%, #1f1347 50%, #0f0820 100%)",
        }}
      >
        {/* 중앙 글로우 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 42%, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.15) 30%, transparent 60%)",
          }}
        />

        {/* 로고 + 워드마크 락업 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 28,
            marginBottom: 28,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URL} width={132} height={132} alt="" />
          <div
            style={{
              fontSize: 104,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-3px",
              display: "flex",
            }}
          >
            VibeStart
          </div>
        </div>

        {/* 태그라인 */}
        <div
          style={{
            fontSize: 34,
            color: "#c4b5fd",
            marginBottom: 56,
            display: "flex",
            letterSpacing: "-0.5px",
            fontWeight: 500,
          }}
        >
          바이브코딩, 여기서 시작하세요
        </div>

        {/* 스텝 카드 */}
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { num: "1", text: "간단한 질문" },
            { num: "2", text: "맞춤 안내" },
            { num: "3", text: "복사 & 붙여넣기" },
          ].map((step) => (
            <div
              key={step.num}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(167,139,250,0.3)",
                borderRadius: 16,
                padding: "16px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(167,139,250,0.25)",
                  color: "#c4b5fd",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {step.num}
              </div>
              <span
                style={{
                  color: "#e2e0e8",
                  fontSize: 22,
                  fontWeight: 500,
                }}
              >
                {step.text}
              </span>
            </div>
          ))}
        </div>

        {/* 도메인 */}
        <div
          style={{
            position: "absolute",
            bottom: 36,
            right: 44,
            fontSize: 20,
            color: "rgba(196,181,253,0.55)",
            display: "flex",
            letterSpacing: "0.5px",
            fontWeight: 500,
          }}
        >
          vibe-start.com
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: geistBold, weight: 800, style: "normal" },
        { name: "Geist", data: geistMedium, weight: 500, style: "normal" },
        {
          name: "Noto Sans KR",
          data: notoKrMedium,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}

/**
 * 자랑 카드 — 사용자가 첫 사이트를 배포했을 때 "N님이 방금 배포했어요" 형식.
 * 쿼리: project, user, url (모두 선택적, 누락 시 기본값으로 렌더)
 * 사용자가 직접 제어하는 값이라 HTML 이스케이프는 Satori(JSX)가 알아서 처리.
 */
async function renderShareCard(
  searchParams: URLSearchParams,
): Promise<ImageResponse> {
  const projectName = truncate(searchParams.get("project") ?? "my-portfolio", 40);
  const userName = truncate(searchParams.get("user") ?? "someone", 24);
  const rawUrl = searchParams.get("url") ?? `${projectName}.vercel.app`;
  const displayUrl = truncate(stripProtocol(rawUrl), 56);

  // 서브셋 로딩: 실제 들어갈 텍스트만 fetch해서 경량화.
  const latinText = `VibeStart${projectName}${userName}${displayUrl}vibe-start.com !'`;
  const koreanText = "님이 방금 첫 사이트를 인터넷에 띄웠어요로 시작했습니다배포 완료";

  const [geistBold, geistMedium, notoKrBold, notoKrMedium] = await Promise.all([
    loadGoogleFont("Geist", 800, latinText),
    loadGoogleFont("Geist", 500, latinText),
    loadGoogleFont("Noto Sans KR", 800, koreanText),
    loadGoogleFont("Noto Sans KR", 500, koreanText),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Geist, 'Noto Sans KR'",
          position: "relative",
          background:
            "linear-gradient(135deg, #0f0820 0%, #1f1347 50%, #0f0820 100%)",
          padding: "80px 60px",
        }}
      >
        {/* 중앙 글로우 */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 45%, rgba(52,211,153,0.25) 0%, rgba(124,58,237,0.2) 30%, transparent 65%)",
          }}
        />

        {/* 체크 + 헤드라인 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 999,
              background: "rgba(52,211,153,0.15)",
              border: "3px solid rgba(52,211,153,0.55)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={CHECK_DATA_URL} width={44} height={44} alt="" />
          </div>
          <div
            style={{
              fontSize: 34,
              fontWeight: 500,
              color: "#86efac",
              display: "flex",
              letterSpacing: "-0.5px",
            }}
          >
            배포 완료
          </div>
        </div>

        {/* 메인 텍스트 — 사용자 이름 강조 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 36,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              display: "flex",
              textAlign: "center",
            }}
          >
            {userName}님이 방금
          </div>
          <div
            style={{
              fontSize: 56,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: "-2px",
              display: "flex",
              textAlign: "center",
              marginTop: 4,
            }}
          >
            첫 사이트를 인터넷에 띄웠어요
          </div>
        </div>

        {/* URL 칩 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(167,139,250,0.4)",
            borderRadius: 14,
            padding: "18px 32px",
            marginBottom: 44,
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#34d399",
              display: "flex",
            }}
          />
          <div
            style={{
              fontSize: 32,
              fontWeight: 500,
              color: "#f5f3ff",
              display: "flex",
              fontFamily: "Geist",
              letterSpacing: "-0.5px",
            }}
          >
            {displayUrl}
          </div>
        </div>

        {/* 하단 VibeStart 브랜딩 */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URL} width={32} height={32} alt="" />
          <div
            style={{
              fontSize: 22,
              fontWeight: 500,
              color: "rgba(196,181,253,0.75)",
              display: "flex",
              letterSpacing: "0.5px",
            }}
          >
            VibeStart로 시작했어요 · vibe-start.com
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Geist", data: geistBold, weight: 800, style: "normal" },
        { name: "Geist", data: geistMedium, weight: 500, style: "normal" },
        { name: "Noto Sans KR", data: notoKrBold, weight: 800, style: "normal" },
        {
          name: "Noto Sans KR",
          data: notoKrMedium,
          weight: 500,
          style: "normal",
        },
      ],
    },
  );
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
