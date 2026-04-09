/**
 * Vercel REST API 어댑터.
 *
 * Phase 2a (라)-3: fetchVercelUser — Personal Access Token을 검증하고
 *                  사용자 메타데이터(uid, username, name)를 반환한다.
 *
 * Vercel은 일반 사용자가 OAuth Integration을 만들 수 없도록 (Marketplace
 * 파트너 프로그램만) 변경했기 때문에 (라)-3는 PAT 붙여넣기 방식으로 동작.
 * GitHub과 달리 client_id/secret 기반 토큰 교환이 없으므로 begin/complete
 * Authorize 메서드는 (라)-3에서 정의하지 않는다. (라)-4 이후 createProject /
 * triggerDeployment 등이 추가되면 이 파일에서 같이 export해 어댑터로 성장.
 *
 * Vercel API 참고:
 *   https://vercel.com/docs/rest-api/endpoints/user
 */

import "server-only";

import { VERCEL_API_BASE } from "./vercel-env";

/**
 * `oauth_connections.metadata`에 저장할 사용자 식별 정보.
 * GitHub 어댑터의 metadata 형태와 키 이름을 맞춰서 저장 후 OAuthConnectionRow
 * 매핑에서 분기 없이 동일하게 처리되도록 한다.
 */
export interface VercelUserMeta {
  providerUserId: string;
  providerUsername: string;
  providerDisplayName: string;
  providerAvatarUrl: string | null;
}

/**
 * Vercel /v2/user 응답. Vercel은 리비전에 따라 응답을 `{ user: {...} }`로
 * 한 번 감싸기도 하고 그대로 보내기도 하므로 두 모양을 모두 받는다.
 *
 * Vercel User 객체의 식별자 필드는 `id` (과거 일부 문서에 `uid`로 표기된
 * 적이 있어 fallback도 같이 시도).
 */
interface VercelUserResponseRaw {
  id?: string;
  uid?: string;
  username?: string;
  name?: string | null;
  email?: string | null;
}
interface VercelUserResponseWrapped {
  user?: VercelUserResponseRaw;
}
type VercelUserResponse = VercelUserResponseRaw & VercelUserResponseWrapped;

/**
 * 토큰을 받아 /v2/user를 호출하고 사용자 메타데이터를 반환한다.
 * 응답 코드별 에러 메시지는 URL-safe 코드 문자열(`vercel:invalid_token` 등)
 * 으로 throw해 server action이 에러 redirect 쿼리에 그대로 실어 보낸다.
 */
export async function fetchVercelUser(
  accessToken: string,
): Promise<VercelUserMeta> {
  const res = await fetch(`${VERCEL_API_BASE}/v2/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "User-Agent": "VibeStart",
    },
  });

  if (res.status === 401) {
    throw new Error("vercel:invalid_token");
  }
  if (res.status === 403) {
    throw new Error("vercel:forbidden");
  }
  if (res.status >= 500) {
    throw new Error("vercel:service_unavailable");
  }
  if (!res.ok) {
    throw new Error(`vercel:http_${res.status}`);
  }

  const data = (await res.json()) as VercelUserResponse;
  const user: VercelUserResponseRaw = data.user ?? data;

  const userId = user.id ?? user.uid;
  if (!userId || !user.username) {
    throw new Error("vercel:malformed_response");
  }

  return {
    providerUserId: String(userId),
    providerUsername: user.username,
    providerDisplayName: user.name ?? user.username,
    providerAvatarUrl: null,
  };
}
