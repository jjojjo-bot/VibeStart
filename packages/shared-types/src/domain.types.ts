/**
 * Phase 2 — 도메인(Cloudflare Registrar) 데이터 형태.
 *
 * 도메인 구매 자체는 사용자가 Cloudflare 대시보드에서 직접 결제한다.
 * vibestart는 검색/필요 DNS 레코드 안내/연결 검증을 책임진다.
 */

export interface DomainSuggestion {
  name: string;
  available: boolean;
  pricePerYearKrw: number;
}

export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'TXT';

export interface DnsRecord {
  type: DnsRecordType;
  name: string;
  value: string;
}

export interface DomainConnectionStatus {
  connected: boolean;
  reason: string | null;
}
