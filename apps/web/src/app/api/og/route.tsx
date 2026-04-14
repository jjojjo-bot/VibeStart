import { ImageResponse } from "next/og";

export const runtime = "edge";

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><path d="M 16,24 L 38,40 L 16,56" fill="none" stroke="#c4b5fd" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><line x1="42" y1="56" x2="64" y2="56" stroke="#c4b5fd" stroke-width="8" stroke-linecap="round"/></svg>`;
const LOGO_DATA_URL = `data:image/svg+xml;utf8,${encodeURIComponent(LOGO_SVG)}`;

export async function GET(): Promise<ImageResponse> {
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
          fontFamily: "sans-serif",
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
          }}
        >
          vibe-start.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
