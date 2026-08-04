"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { MAX_GUEST_GUARANTEE, MAX_TOTAL_BUDGET, MAX_UNIT_AMOUNT } from "@/lib/couple-limits";
import { formatFullDate } from "@/lib/format";
import { unexpectedMessage } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";

import {
  WEDDING_INFO_COPY,
  type SavedWeddingInfo,
  type WeddingInfoField,
  type WeddingInfoState,
} from "./types";

/* ⚠️ 이 파일은 `"use server"`다. **async 함수만** export할 수 있다 — 문구·타입은 `./types`에 있다. */

function fail(field: WeddingInfoField, fieldMessage: string): WeddingInfoState {
  return { status: "error", field, fieldMessage };
}

/**
 * 금액·인원 파싱. 온보딩(`onboarding/actions.ts`)과 같은 접기 규칙이다 —
 * 음수·`NaN`·`"abc"`가 전부 0으로 접힌다.
 *
 * `Number.isSafeInteger`를 따로 보는 이유: `"1e30"`은 `Number`도 `Math.round`도 통과시켜
 * Postgres에 `1e+30`으로 도착한다. 상한 비교보다 **먼저** 걸러야 한다.
 */
function parseCount(raw: FormDataEntryValue | null): number | null {
  const value = Math.max(0, Math.round(Number(raw ?? 0) || 0));
  return Number.isSafeInteger(value) ? value : null;
}

/**
 * 예식 정보 5필드 저장.
 *
 * RPC를 쓰지 않는다 — `couples`에 UPDATE 정책과 GRANT가 이미 있고(`0001`, → D-025 계열),
 * RLS가 `id = current_couple_id()`로 좁히므로 `.eq("id", …)`도 필요 없다.
 * 그래서 `rpcCode()`도 쓰지 않는다: PostgREST 오류에는 토큰이 없어 항상 null이 나온다.
 *
 * 🔴 **5필드는 전부 아니면 전무다.** UPDATE 한 번으로 다섯 컬럼을 함께 쓴다.
 * 셋만 저장되고 둘이 안 된 상태가 생기면 사람은 무엇이 저장됐는지 알 방법이 없는데,
 * 이 값들은 하객 탭 손익을 만드는 유일한 입구다.
 *
 * 🔴 **상한을 넘겨도 조용히 잘라 저장하지 않는다.** 잘라 저장하면 화면의 입력값과 DB 값이
 * 갈리고, 성공 블록이 **사람이 치지 않은 값**을 저장했다고 확인해 준다.
 */
export async function updateWeddingInfoAction(
  _prev: WeddingInfoState,
  formData: FormData,
): Promise<WeddingInfoState> {
  const weddingDate = String(formData.get("weddingDate") ?? "").trim();
  if (!weddingDate) {
    return fail("weddingDate", WEDDING_INFO_COPY.weddingDateRequired);
  }
  // `formatFullDate`는 존재하지 않는 날짜("2026-02-31")에 null을 준다. FormData는 위조되므로
  // 네이티브 date 입력이 막아 준다고 믿지 않는다 — 여기서 안 잡으면 Postgres가 22008을 낸다.
  if (formatFullDate(weddingDate) === null) {
    return fail("weddingDate", WEDDING_INFO_COPY.weddingDateInvalid);
  }

  const totalBudget = parseCount(formData.get("totalBudget"));
  const guestMinGuarantee = parseCount(formData.get("guestMinGuarantee"));
  const mealCostPerHead = parseCount(formData.get("mealCostPerHead"));
  const avgGiftAmount = parseCount(formData.get("avgGiftAmount"));

  if (totalBudget === null) return fail("totalBudget", WEDDING_INFO_COPY.totalBudgetTooLarge);
  if (guestMinGuarantee === null) {
    return fail("guestMinGuarantee", WEDDING_INFO_COPY.guaranteeTooLarge);
  }
  if (mealCostPerHead === null) return fail("mealCostPerHead", WEDDING_INFO_COPY.perHeadTooLarge);
  if (avgGiftAmount === null) return fail("avgGiftAmount", WEDDING_INFO_COPY.perHeadTooLarge);

  if (totalBudget > MAX_TOTAL_BUDGET) {
    return fail("totalBudget", WEDDING_INFO_COPY.totalBudgetTooLarge);
  }
  if (guestMinGuarantee > MAX_GUEST_GUARANTEE) {
    return fail("guestMinGuarantee", WEDDING_INFO_COPY.guaranteeTooLarge);
  }
  if (mealCostPerHead > MAX_UNIT_AMOUNT) {
    return fail("mealCostPerHead", WEDDING_INFO_COPY.perHeadTooLarge);
  }
  if (avgGiftAmount > MAX_UNIT_AMOUNT) {
    return fail("avgGiftAmount", WEDDING_INFO_COPY.perHeadTooLarge);
  }

  const saved: SavedWeddingInfo = {
    weddingDate,
    totalBudget,
    guestMinGuarantee,
    mealCostPerHead,
    avgGiftAmount,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // 세션이 끊긴 것이라 이 화면에서 사용자가 할 수 있는 일이 없다. 문구를 띄우지 않는다.
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("couples")
    .update({
      wedding_date: weddingDate,
      total_budget: totalBudget,
      guest_min_guarantee: guestMinGuarantee,
      avg_gift_amount: avgGiftAmount,
      meal_cost_per_head: mealCostPerHead,
    })
    // RLS가 이미 내 스페이스로 좁힌다. `select`는 **몇 행이 바뀌었는지** 보려고 붙인다 —
    // 스페이스가 없으면 UPDATE가 조용히 0행으로 끝나고 오류도 안 난다.
    .select("id");

  if (error) {
    // 23514 = CHECK 위반. UI로는 닿을 수 없지만(음수는 위에서 0으로 접힌다) 위조된 제출이
    // 여기까지 오면 "잠시 뒤 다시" 대신 고칠 곳을 말해 준다.
    if (error.code === "23514") {
      return { status: "error", alert: WEDDING_INFO_COPY.negative };
    }
    return {
      status: "error",
      alert: unexpectedMessage("예식 정보를 저장하지", error.code || error.message),
    };
  }

  if (!data || data.length === 0) {
    return { status: "error", alert: WEDDING_INFO_COPY.noCouple };
  }

  /* 다섯 값이 흘러가는 곳이 홈·예산·하객·설정 넷이고, `(app)/layout.tsx`도 `getSpaceContext()`를
     읽는다. 경로를 열거하면 여섯 번째 화면이 생길 때 조용히 낡은 값을 낸다 — 그 실패는
     컴파일에 안 잡힌다. `settings/actions.ts`가 같은 이유로 레이아웃을 무효화한다. */
  revalidatePath("/", "layout");
  return { status: "saved", saved };
}
