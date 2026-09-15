// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  decryptOAuthToken,
  encryptOAuthToken,
} from "@/lib/auth/token-crypto";

const originalSecret = process.env.OAUTH_STATE_SECRET;

beforeEach(() => {
  process.env.OAUTH_STATE_SECRET = "test-secret-that-is-definitely-longer-than-32-characters";
});

afterEach(() => {
  if (originalSecret === undefined) delete process.env.OAUTH_STATE_SECRET;
  else process.env.OAUTH_STATE_SECRET = originalSecret;
});

describe("OAuth token encryption", () => {
  it("round-trips without storing the plaintext in the ciphertext", () => {
    const plaintext = "gho_super-secret-token";
    const encrypted = encryptOAuthToken(plaintext);

    expect(encrypted).toMatch(/^enc:v1:/);
    expect(encrypted).not.toContain(plaintext);
    expect(decryptOAuthToken(encrypted)).toBe(plaintext);
  });

  it("keeps pre-encryption rows readable until the user reconnects", () => {
    expect(decryptOAuthToken("legacy-plaintext-token")).toBe(
      "legacy-plaintext-token",
    );
  });

  it("rejects tampered ciphertext", () => {
    const encrypted = encryptOAuthToken("secret");
    const tampered = `${encrypted.slice(0, -1)}x`;

    expect(() => decryptOAuthToken(tampered)).toThrow(
      "저장된 OAuth 토큰을 복호화할 수 없습니다.",
    );
  });
});
