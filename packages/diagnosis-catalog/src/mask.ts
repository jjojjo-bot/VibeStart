/**
 * 에스컬레이션 마스킹 — 사용자가 붙여넣은 터미널 출력에서 개인정보를 가린다.
 *
 * 진단은 로컬에서 raw 출력으로 수행하지만, 도움 요청 번들은 외부로 전송될 수
 * 있으므로(전역 데이터 보호 원칙) 복사/전송 전에 홈 경로·이메일·IP를 치환한다.
 * 결정론적·순수 함수 — 같은 입력이면 같은 출력.
 */
export function maskSensitive(text: string): string {
  return (
    text
      // Windows 사용자 경로: C:\Users\brandon → C:\Users\<user>
      .replace(/([A-Za-z]:\\Users\\)[^\\/\s"']+/g, '$1<user>')
      // Unix/WSL 홈: /home/brandon → /home/<user>
      .replace(/(\/home\/)[^/\s"']+/g, '$1<user>')
      // macOS 홈(및 /mnt/c/Users/...): /Users/brandon → /Users/<user>
      .replace(/(\/Users\/)[^/\s"']+/g, '$1<user>')
      // 이메일
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, '<email>')
      // IPv4 (4옥텟 — 버전 표기 x.y.z는 매칭 안 됨)
      .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, '<ip>')
  );
}
