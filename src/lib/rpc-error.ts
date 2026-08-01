/**
 * Postgres RPC가 `raise exception`으로 던지는 토큰을 알아내는 유일한 경로.
 *
 * 🔴 **`error.code`(SQLSTATE)로 분기하면 안 된다.** 여러 실패가 같은 코드를 공유한다 —
 * `ALREADY_IN_COUPLE`·`COUPLE_FULL`이 둘 다 `23505`고,
 * `INVALID_CODE`·`INVALID_SIDE`·`DISPLAY_NAME_REQUIRED`·`WEDDING_DATE_REQUIRED`·
 * `USE_LEAVE_INSTEAD`·`NOT_A_MEMBER`가 전부 `22023`,
 * `AUTH_REQUIRED`·`NO_COUPLE`·`NOT_REMOVABLE`·`REMOVE_WINDOW_CLOSED`·`NOT_ALONE`이 `42501`이다.
 * 구분은 메시지에 실려 오는 토큰으로만 가능하다.
 *
 * 원본은 `supabase/migrations/0007_space_rpcs.sql` · `0008_membership_recovery.sql`이다.
 * 온보딩 → 초대 → 스페이스 관리, 세 곳이 같은 규칙을 쓰게 되어 여기로 올렸다.
 */

export const RPC_CODES = [
  "AUTH_REQUIRED",
  "ALREADY_IN_COUPLE",
  "COUPLE_FULL",
  "INVALID_CODE",
  "INVALID_SIDE",
  "DISPLAY_NAME_REQUIRED",
  "WEDDING_DATE_REQUIRED",
  "NO_COUPLE",
  // 0008 — 오참여 복구
  "LAST_MEMBER",
  "NOT_ALONE",
  "NOT_A_MEMBER",
  "NOT_REMOVABLE",
  "REMOVE_WINDOW_CLOSED",
  "USE_LEAVE_INSTEAD",
] as const;

export type RpcCode = (typeof RPC_CODES)[number];

/**
 * PostgREST는 `raise` 문구를 `message`에 싣지만, 드라이버·버전에 따라 `details`/`hint`로도 온다.
 * 셋을 모두 뒤진다.
 *
 * 토큰끼리 부분 문자열 관계가 없어야 `find`가 안전하다. 새 토큰을 추가할 때
 * 기존 토큰을 포함하는 이름(예: `NO_COUPLE_FOUND`)을 만들지 않는다.
 */
export function rpcCode(error: {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
}): RpcCode | null {
  const haystack = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toUpperCase();
  return RPC_CODES.find((code) => haystack.includes(code)) ?? null;
}

/**
 * 매핑하지 않은 서버 오류. **삼키지 않는다** — 원인을 알 수 없는 실패가 가장 고치기 어렵다.
 * `lead`는 "참여하지" · "스페이스를 만들지"처럼 문장 앞부분을 통째로 받는다
 * (한국어라 어간만 받으면 "만들지하지 못했어요"가 된다).
 */
export function unexpectedMessage(lead: string, code: string): string {
  return `${lead} 못했어요. 잠시 뒤 다시 시도해 주세요. (${code})`;
}
