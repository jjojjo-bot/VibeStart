// Phase 2a — 정적 트랙(M1~M5)에 필요한 7개 포트
export type { AuthPort } from './AuthPort';
export type { VcsPort } from './VcsPort';
export type { DeployPort } from './DeployPort';
export type { ErrorMonitorPort } from './ErrorMonitorPort';
export type { AnalyticsPort } from './AnalyticsPort';
export type { DomainPort } from './DomainPort';
export type { IdeBridgePort } from './IdeBridgePort';

// Phase 2b/2c에서 추가 예정:
//   DataStorePort, FileStoragePort, MailerPort, AiProviderPort, PaymentPort
