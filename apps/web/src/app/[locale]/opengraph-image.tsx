import { ImageResponse } from "next/og";

export const alt = "VibeStart — 바이브코딩, 여기서 시작하세요";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a1025 0%, #2d1b69 50%, #1a1025 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
        }}
      >
        {/* 로고 */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 16,
            display: "flex",
          }}
        >
          VibeStart
        </div>

        {/* 태그라인 */}
        <div
          style={{
            fontSize: 32,
            color: "#c4b5fd",
            marginBottom: 48,
            display: "flex",
          }}
        >
          바이브코딩, 여기서 시작하세요
        </div>

        {/* 스텝 카드 */}
        <div
          style={{
            display: "flex",
            gap: 24,
          }}
        >
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
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
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
                  background: "rgba(167,139,250,0.2)",
                  color: "#a78bfa",
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                {step.num}
              </div>
              <span style={{ color: "#e2e0e8", fontSize: 22, fontWeight: 500 }}>
                {step.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
