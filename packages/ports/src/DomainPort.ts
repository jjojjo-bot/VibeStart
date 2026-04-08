/**
 * DomainPort — 진짜 도메인 연결 (Phase 2 1순위 어댑터: Cloudflare Registrar).
 *
 * M5 마일스톤. 도메인 구매(결제)는 사용자가 Cloudflare 대시보드에서 직접
 * 한다. vibestart는 검색·필요 DNS 레코드 안내·연결 검증을 책임진다.
 */

import type {
  DnsRecord,
  DomainConnectionStatus,
  DomainSuggestion,
} from '@vibestart/shared-types';

export interface DomainPort {
  /**
   * 사용자가 입력한 키워드와 TLD 후보로 가용 도메인을 검색한다.
   */
  searchAvailable(query: string): Promise<DomainSuggestion[]>;

  /**
   * Vercel 프로젝트에 도메인을 붙이려면 어떤 DNS 레코드가 필요한지 계산한다.
   * 사용자는 이 결과를 보고 Cloudflare DNS에 직접 추가하거나, Cloudflare
   * OAuth가 연결되어 있으면 어댑터가 자동 적용한다.
   */
  getRequiredDnsRecords(
    deployProjectId: string,
    domain: string,
  ): Promise<DnsRecord[]>;

  /**
   * 도메인이 실제로 Vercel 프로젝트에 연결되었는지 확인한다.
   * SSL 발급까지 포함해 5~30분이 걸리므로 마일스톤 화면에서 폴링한다.
   */
  verifyDomainConnected(
    deployProjectId: string,
    domain: string,
  ): Promise<DomainConnectionStatus>;
}
