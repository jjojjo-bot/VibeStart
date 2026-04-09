/**
 * Vercel API 어댑터 환경 상수.
 *
 * (라)-3는 PAT(Personal Access Token) 방식이라 우리쪽 client_id/secret이
 * 없다. 사용자는 https://vercel.com/account/tokens 에서 토큰을 직접 발급해
 * 우리 폼에 붙여넣고, 우리는 그 토큰으로 Vercel API를 호출한다.
 *
 * (라)-4 이후 team scoping이 필요해지면 VERCEL_TEAM_ID 등을 여기에 추가.
 */

export const VERCEL_API_BASE = "https://api.vercel.com";
