import type { OS } from "./onboarding";

export type AiTool = "claude" | "codex";

export interface AiToolProvider {
  id: AiTool;
  displayName: string;
  command: string;
  installUrl: string;
  installShell: "bash" | "sh";
  loginCommand: string;
  authCheckCommand: string;
  extensionId: string;
  instructionFile: "CLAUDE.md" | "AGENTS.md";
  setupTranslationKey: "aiSetup" | "aiSetupCodex";
  authTranslationKey: "auth" | "authCodex";
  extensionTranslationKey: "extensions" | "extensionsCodex";
}

export const AI_TOOL_PROVIDERS: Record<AiTool, AiToolProvider> = {
  claude: {
    id: "claude",
    displayName: "Claude Code",
    command: "claude",
    installUrl: "https://claude.ai/install.sh",
    installShell: "bash",
    loginCommand: "claude auth login",
    authCheckCommand: "claude auth status --text",
    extensionId: "anthropic.claude-code",
    instructionFile: "CLAUDE.md",
    setupTranslationKey: "aiSetup",
    authTranslationKey: "auth",
    extensionTranslationKey: "extensions",
  },
  codex: {
    id: "codex",
    displayName: "Codex",
    command: "codex",
    installUrl: "https://chatgpt.com/codex/install.sh",
    installShell: "sh",
    loginCommand: "codex login",
    authCheckCommand: "codex login status",
    extensionId: "openai.chatgpt",
    instructionFile: "AGENTS.md",
    setupTranslationKey: "aiSetupCodex",
    authTranslationKey: "authCodex",
    extensionTranslationKey: "extensionsCodex",
  },
};

export function aiToolProvider(aiTool: AiTool): AiToolProvider {
  return AI_TOOL_PROVIDERS[aiTool];
}

export function nativeAiInstallScript(aiTool: AiTool, os: OS): string {
  const provider = aiToolProvider(aiTool);
  const profile = os === "windows" ? "$HOME/.bashrc" : "$HOME/.zprofile";
  return [
    "set -o pipefail",
    'export PATH="$HOME/.local/bin:$PATH"',
    `(command -v ${provider.command} >/dev/null 2>&1 || curl -fsSL ${provider.installUrl} | ${provider.installShell})`,
    `(grep -Fq '.local/bin' "${profile}" 2>/dev/null || printf '%s\\n' 'export PATH="$HOME/.local/bin:$PATH"' >> "${profile}")`,
    `${provider.command} --version`,
  ].join(" && ");
}
