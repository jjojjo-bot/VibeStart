/**
 * 첫 배포용 Next.js 랜딩 파일 세트 생성.
 *
 * (라)-4의 정적 `index.html` 방식을 대체한다. Vercel 프로젝트는
 * `framework: "nextjs"`로 생성되므로 저장소에 `next` 의존성이 없으면
 * "No Next.js version detected" 빌드 에러가 난다. 이 함수는 Vercel이 바로
 * 빌드할 수 있는 **최소 Next.js 16 + React 19 App Router 프로젝트** 파일
 * 세트를 반환한다.
 *
 * 경로 구조(`src/app/page.tsx`, `src/lib/*`, `@/*` alias)는 (마)-5 Auth UI
 * 설치 단계의 `auth-ui-nextjs-template.ts`와 맞춰 M2에서 `page.tsx`를
 * 덮어쓰며 자연스럽게 이어진다.
 *
 * 의존성 없는 순수 함수 — 테스트 가능.
 */

export interface NextJsLandingInput {
  projectName: string;
}

export interface FileToPush {
  path: string;
  content: string;
}

/**
 * Next.js 16 + React 19 최소 프로젝트 파일 세트.
 *
 * 포함 파일:
 *   - `package.json` (next / react / react-dom / typescript)
 *   - `tsconfig.json` (`@/*` → `./src/*` alias, M2와 호환)
 *   - `next-env.d.ts` (create-next-app이 생성하는 타입 레퍼런스)
 *   - `src/app/layout.tsx` (required root layout)
 *   - `src/app/page.tsx` (프로젝트 이름 인사 랜딩)
 *   - `.gitignore`
 */
export function buildNextJsLandingFiles(input: NextJsLandingInput): FileToPush[] {
  const projectNameLiteral = JSON.stringify(input.projectName);

  const packageJson = `{
  "name": "vibestart-project",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^16.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0"
  }
}
`;

  const tsconfigJson = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

  const nextEnvDts = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

  const layoutTsx = `export const metadata = {
  title: ${projectNameLiteral},
  description: "Built with VibeStart",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          backgroundColor: "#020617",
          color: "#ffffff",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
`;

  const pageTsx = `export default function Page() {
  const projectName = ${projectNameLiteral};

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "32rem" }}>
        <div
          style={{
            display: "inline-block",
            marginBottom: "1.5rem",
            padding: "0.375rem 1rem",
            borderRadius: "9999px",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            color: "#34d399",
            fontSize: "0.875rem",
          }}
        >
          Live on the internet
        </div>
        <h1
          style={{
            fontSize: "3.75rem",
            fontWeight: 700,
            letterSpacing: "-0.025em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          {projectName}
        </h1>
        <p
          style={{
            marginTop: "1rem",
            fontSize: "1.125rem",
            color: "#9ca3af",
          }}
        >
          Coming soon...
        </p>
        <p
          style={{
            marginTop: "3rem",
            fontSize: "0.75rem",
            color: "#4b5563",
          }}
        >
          Built with{" "}
          <a
            href="https://vibestart.com"
            style={{
              color: "inherit",
              textDecoration: "underline",
              textUnderlineOffset: "0.2em",
            }}
          >
            VibeStart
          </a>
        </p>
      </div>
    </div>
  );
}
`;

  const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files
.env*.local
.env

# typescript
*.tsbuildinfo
`;

  return [
    { path: "package.json", content: packageJson },
    { path: "tsconfig.json", content: tsconfigJson },
    { path: "next-env.d.ts", content: nextEnvDts },
    { path: "src/app/layout.tsx", content: layoutTsx },
    { path: "src/app/page.tsx", content: pageTsx },
    { path: ".gitignore", content: gitignore },
  ];
}
