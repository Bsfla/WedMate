/**
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 * 상수 하나라도 같이 내보내면 빌드가 `invalid-use-server-value`로 실패한다.
 */

/** 에러를 특정 입력에 귀속시킬 수 있을 때의 그 입력. */
export type AuthField = "email" | "password";

export type AuthState = {
  status: "idle" | "error" | "check-email";
  message?: string;
  /**
   * 에러가 특정 입력에 귀속될 때만 채운다. 비어 있으면 폼 상단 알림으로 뜬다.
   *
   * 자격 증명 오류에 이 값을 채우지 않는 건 의도적이다 — 어느 쪽이 틀렸는지 추측해 표시하면
   * **그 이메일로 가입된 계정이 있는지**가 새어 나간다.
   */
  field?: AuthField;
};

export const AUTH_IDLE: AuthState = { status: "idle" };
