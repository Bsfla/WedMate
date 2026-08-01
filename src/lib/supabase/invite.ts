/**
 * 살아 있는 초대 코드 조회.
 *
 * 🔴 **"코드가 없다"와 "코드를 못 읽었다"를 절대 합치지 않는다** (→ D-059).
 * 조회 실패를 `null`로 뭉개면 화면이 "아직 코드가 없어요 → [만들기]"를 그리고,
 * 사용자가 그 버튼을 눌러 **살아 있는 코드를 죽인다** — `create_invite()`가
 * 기존 미사용 코드를 폐기하기 때문이다. 조회 실패가 데이터 손실로 번지는 유일한 경로다.
 */

import { cache } from "react";

import type { Side } from "@/lib/domain";

import { isSupabaseConfigured } from "./env";
import { createClient } from "./server";

/* `INVITE_TTL_HOURS`는 `@/lib/membership`에 있다 — 화면 문구가 쓰는 값이라
   `next/headers`에 닿는 이 모듈에 두면 클라이언트 번들이 깨진다. */

export type ActiveInvite = {
  /** 6자리. 혼동 문자 `0 O 1 I`를 뺀 32자 알파벳이다. */
  code: string;
  /** 초대받는 쪽. 남은 역할로 고정 발급되므로 발급자에게 선택권이 없다. */
  side: Side;
  /** ISO 8601 원본. 절대 시각 문구는 화면이 `Intl`로 만든다. */
  expiresAt: string;
  /**
   * 남은 시간(시). 만료가 48시간이라 "일"로는 눈금이 두 칸뿐이라 시로 준다.
   * 음수가 될 일은 없다 — `active_invite()`가 만료된 코드를 이미 걸러낸다.
   */
  hoursLeft: number;
};

export type ActiveInviteResult =
  /** `invite: null`은 **"지금 쓸 수 있는 코드가 없다"**. 미발급과 만료를 구분하지 않는다. */
  | { status: "ok"; invite: ActiveInvite | null }
  /** 조회 자체가 실패했다. 화면은 발급 버튼을 그리되 재발급 확인을 강제해야 한다. */
  | { status: "unavailable" };

function toSide(value: string): Side | null {
  return value === "groom" || value === "bride" ? value : null;
}

export const getActiveInvite = cache(async (): Promise<ActiveInviteResult> => {
  if (!isSupabaseConfigured) return { status: "unavailable" };

  const supabase = await createClient();
  // `.maybeSingle()`를 붙이지 않는다 — 생성 타입이 `isOneToOne: true`라 이미 단일 행이고,
  // 거기 다시 붙이면 결과 타입이 `never`로 좁혀진다.
  // 살아 있는 코드가 없으면 SQL 함수가 NULL을 돌려주므로 `data`는 null이 될 수 있다.
  const { data, error } = await supabase.rpc("active_invite");

  if (error) return { status: "unavailable" };
  if (!data) return { status: "ok", invite: null };

  const side = toSide(data.side);
  // side는 text + CHECK라 생성 타입이 string이다. 좁히지 못하면 화면이 라벨을 못 고르므로
  // "없음"이 아니라 "못 읽음"으로 돌린다 — 이 상태에서 새로 발급하면 멀쩡한 코드가 죽는다.
  if (!side) return { status: "unavailable" };

  const remainingMs = new Date(data.expires_at).getTime() - Date.now();

  return {
    status: "ok",
    invite: {
      code: data.code,
      side,
      expiresAt: data.expires_at,
      hoursLeft: Math.max(0, Math.ceil(remainingMs / 3_600_000)),
    },
  };
});
