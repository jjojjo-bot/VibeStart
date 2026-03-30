/**
 * 템플릿 변수 맵.
 * script-generator의 VariableMap과 동일한 형태이지만,
 * 순환 의존 방지를 위해 독립 정의한다.
 */
export interface VariableMap {
  workspacePath: string;
  homePath: string;
  projectName: string;
  [key: string]: string;
}
