import { isValidProjectName } from "@/lib/onboarding";

/**
 * 현재 터미널의 Next.js 프로젝트를 지정된 GitHub 저장소로 올리는 명령.
 * 로컬 절대 경로를 수집하지 않으며, 프로젝트가 아닌 폴더에서는 아무것도 바꾸지 않는다.
 */
export function buildGitPushScript(
  projectName: string,
  githubUsername: string | null,
): string {
  if (!isValidProjectName(projectName)) {
    throw new Error("Invalid project name");
  }
  if (
    githubUsername &&
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(githubUsername)
  ) {
    throw new Error("Invalid GitHub username");
  }

  const username = githubUsername ?? "YOUR_GITHUB_USERNAME";
  const repoUrl = `https://github.com/${username}/${projectName}.git`;

  return `if { [ -f package.json ] && grep -Eq '"next"[[:space:]]*:' package.json; } || { [ -f frontend/package.json ] && grep -Eq '"next"[[:space:]]*:' frontend/package.json; }; then
  if [ -f frontend/package.json ] && grep -Eq '"next"[[:space:]]*:' frontend/package.json; then
    rm -rf frontend/.git
  fi
  grep -qxF ".DS_Store" .gitignore 2>/dev/null || echo ".DS_Store" >> .gitignore
  git init
  git config user.name "${githubUsername ?? "VibeStart User"}"
  git config user.email "${githubUsername ?? "vibestart"}@users.noreply.github.com"
  git add .
  git commit -m "first commit"
  git remote get-url origin >/dev/null 2>&1 && git remote set-url origin ${repoUrl} || git remote add origin ${repoUrl}
  git branch -M main
  git push -u origin main
else
  echo "VibeStart: open a terminal in your Next.js project folder and try again."
fi`;
}
