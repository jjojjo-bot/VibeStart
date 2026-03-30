import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 — VibeStart",
  description: "VibeStart 개인정보처리방침",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold tracking-tight">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        시행일: 2026년 3월 30일
      </p>

      <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. 개인정보의 수집 항목 및 방법
          </h2>
          <p>
            VibeStart는 서비스 제공을 위해 아래와 같은 정보를 자동으로
            수집합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>접속 로그(IP 주소, 접속 시간, 브라우저 종류)</li>
            <li>서비스 이용 기록(선택한 OS, 목적, 진행 단계)</li>
          </ul>
          <p className="mt-2">
            VibeStart는 회원가입을 요구하지 않으며, 이름·이메일 등 개인
            식별정보를 직접 수집하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. 개인정보의 수집 및 이용 목적
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>서비스 이용 통계 분석 및 품질 개선</li>
            <li>서비스 오류 탐지 및 안정성 확보</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. 개인정보의 보유 및 이용 기간
          </h2>
          <p>
            수집된 정보는 수집일로부터 <strong>1년간</strong> 보유하며,
            보유 기간 경과 후 지체 없이 파기합니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            4. 개인정보의 제3자 제공
          </h2>
          <p>
            VibeStart는 수집한 정보를 제3자에게 제공하지 않습니다. 다만
            아래의 경우는 예외로 합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>법령에 의해 요구되는 경우</li>
            <li>이용자의 사전 동의가 있는 경우</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            5. 쿠키 및 분석 도구
          </h2>
          <p>
            VibeStart는 서비스 개선을 위해 Google Analytics 등 웹 분석
            도구를 사용할 수 있으며, 이 과정에서 쿠키가 사용될 수 있습니다.
            브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 일부 서비스
            이용에 제한이 있을 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            6. 이용자의 권리
          </h2>
          <p>
            이용자는 언제든지 수집된 정보의 열람, 정정, 삭제를 요청할 수
            있습니다. 아래 연락처로 문의해 주세요.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            7. 개인정보 보호책임자
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              이메일:{" "}
              <a
                href="mailto:dearlune2100@gmail.com"
                className="text-primary hover:underline"
              >
                dearlune2100@gmail.com
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            8. 방침 변경에 관한 사항
          </h2>
          <p>
            본 개인정보처리방침은 법령·정책 또는 서비스 변경에 따라 수정될 수
            있으며, 변경 시 본 페이지를 통해 공지합니다.
          </p>
        </section>
      </div>
    </main>
  );
}
