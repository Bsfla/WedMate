/**
 * 커플 스페이스 판정의 **단일 출처**.
 *
 * `(app)/layout.tsx`(가드) · `onboarding/*`(역방향 가드) · `settings`(표시) 세 곳이
 * 반드시 이 파일의 함수를 쓴다. 서로 다른 쿼리로 같은 질문에 답하면
 * "레이아웃은 없다고 보고 온보딩은 있다고 보는" 리다이렉트 루프가 난다.
 *
 * `cache()`로 감싸 **요청당 한 번만** 왕복한다. 레이아웃 → 페이지 → 선택자 함수가
 * 각자 불러도 실제 쿼리는 1회다 (React `cache`는 요청 스코프다).
 */

import { cache } from "react";

import type { Side } from "@/lib/domain";

import { isSupabaseConfigured } from "./env";
import { createClient } from "./server";

export type SessionUser = {
  id: string;
  email: string | null;
};

export type SpaceMember = {
  side: Side;
  displayName: string;
  /** 지금 로그인한 사람인가. 설정 화면의 "· 나" 표기에 쓴다. */
  isMe: boolean;
};

export type Space = {
  id: string;
  name: string;
  /** "YYYY-MM-DD". `couples.wedding_date`는 NOT NULL이라 항상 있다 (→ D-028). */
  weddingDate: string;
  /**
   * 0은 **"0원"이 아니라 "아직 정하지 않음"**이다 — 온보딩에서 총예산은 선택 입력이다.
   * 화면은 이 값을 그대로 렌더하지 말고 `> 0` 여부로 분기한다. (→ D-052)
   */
  totalBudget: number;
  guestMinGuarantee: number;
  avgGiftAmount: number;
  mealCostPerHead: number;
  members: SpaceMember[];
  /** 멤버 조회만 실패했다. 스페이스 자체는 살아 있으므로 화면 전체를 에러로 덮지 않는다. */
  membersUnavailable: boolean;
};

/**
 * 네 갈래를 구분하는 이유는 **"없다"와 "확인할 수 없다"가 다른 행동을 부르기** 때문이다.
 * `none`만 온보딩으로 보낸다. 조회 실패로 보내면 DB가 잠깐 흔들릴 때
 * 멀쩡한 스페이스를 가진 사람이 온보딩에 갇힌다.
 */
export type SpaceContext =
  | { status: "ok"; user: SessionUser; space: Space }
  | { status: "none"; user: SessionUser }
  | { status: "anonymous" }
  | { status: "unavailable"; reason: "unconfigured" | "error"; user: SessionUser | null };

function toMembers(
  rows: { side: string; display_name: string; user_id: string }[],
  userId: string,
): SpaceMember[] {
  const members: SpaceMember[] = [];
  for (const row of rows) {
    // side는 text + CHECK라 타입 생성기가 string으로 준다. 여기서 좁힌다.
    if (row.side !== "groom" && row.side !== "bride") continue;
    members.push({
      side: row.side,
      displayName: row.display_name,
      isMe: row.user_id === userId,
    });
  }
  return members;
}

/**
 * 로그인 사용자 + 그가 속한 스페이스를 한 번에 읽는다.
 *
 * `couples`와 `couple_members`를 **임베딩 대신 병렬 2쿼리**로 나눈 이유:
 * 임베딩하면 둘 중 하나가 실패할 때 전부 실패한다. 멤버 목록이 안 와도
 * 예식일·총예산은 보여줄 수 있어야 한다(부분 실패).
 * 왕복은 병렬이라 지연이 늘지 않는다.
 */
export const getSpaceContext = cache(async (): Promise<SpaceContext> => {
  // Supabase를 아직 연결하지 않은 환경(P0 셸·로컬 클론). 여기서 온보딩으로 보내면
  // 목업만으로 화면을 보던 흐름이 통째로 막힌다.
  if (!isSupabaseConfigured) {
    return { status: "unavailable", reason: "unconfigured", user: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return { status: "anonymous" };

  const sessionUser: SessionUser = { id: user.id, email: user.email ?? null };

  // RLS가 이미 내 스페이스로 좁힌다 — couple_id를 조건에 넣지 않는다.
  const [coupleResult, memberResult] = await Promise.all([
    supabase
      .from("couples")
      .select(
        "id, name, wedding_date, total_budget, guest_min_guarantee, avg_gift_amount, meal_cost_per_head",
      )
      .maybeSingle(),
    supabase.from("couple_members").select("side, display_name, user_id"),
  ]);

  if (coupleResult.error) {
    return { status: "unavailable", reason: "error", user: sessionUser };
  }
  // 0건 = 아직 스페이스를 안 만든 사람. 이 갈래만 온보딩으로 보낸다.
  if (!coupleResult.data) {
    return { status: "none", user: sessionUser };
  }

  const row = coupleResult.data;

  return {
    status: "ok",
    user: sessionUser,
    space: {
      id: row.id,
      name: row.name,
      weddingDate: row.wedding_date,
      totalBudget: row.total_budget,
      guestMinGuarantee: row.guest_min_guarantee,
      avgGiftAmount: row.avg_gift_amount,
      mealCostPerHead: row.meal_cost_per_head,
      members: toMembers(memberResult.data ?? [], sessionUser.id),
      membersUnavailable: Boolean(memberResult.error),
    },
  };
});

/**
 * 스페이스 유무만 필요한 자리(가드)의 지름길.
 *
 * **`null`은 "없음"이 아니라 "지금 이 요청에서 쓸 수 있는 스페이스가 없음"이다.**
 * 미인증·조회 실패도 `null`로 뭉개지므로, 리다이렉트 판단처럼 갈래를 구분해야 하는 곳은
 * `getSpaceContext()`의 `status`를 직접 본다.
 */
export async function getCurrentCoupleId(): Promise<string | null> {
  const context = await getSpaceContext();
  return context.status === "ok" ? context.space.id : null;
}
