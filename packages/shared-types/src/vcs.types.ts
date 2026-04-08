/**
 * Phase 2 — Version Control (현재 GitHub) 데이터 형태.
 *
 * 어댑터는 GitHub API 응답을 이 타입으로 정규화해 도메인에 전달한다.
 * 다른 VCS(GitLab/Bitbucket)로 갈아끼울 때도 이 형태를 유지한다.
 */

export interface VcsRepo {
  id: string;
  name: string;
  /** 'owner/name' 형태 */
  fullName: string;
  htmlUrl: string;
  cloneUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
}

export interface CreateRepoOptions {
  name: string;
  description: string;
  isPrivate: boolean;
}
