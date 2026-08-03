"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { rpcCode, unexpectedMessage } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";

import { MAX_TOTAL_BUDGET, ONBOARDING_COPY, type OnboardingState } from "./types";

/* ⚠️ 이 파일은 `"use server"`다. **async 함수만** export할 수 있다 —
   타입·상수는 전부 `./types`에 있다. */

/* RPC 토큰 분기는 `@/lib/rpc-error`로 올렸다 — 온보딩·초대·스페이스 관리 셋이 같은 규칙을 쓴다.
   SQLSTATE로 나누면 안 되는 이유는 그 파일 주석에 있다. */

function fail(state: Omit<OnboardingState, "status">): OnboardingState {
  return { status: "error", ...state };
}

/* ─────────────────────────────  초대 코드로 참여  ───────────────────────────── */

/**
 * 🔴 **되돌릴 수 없다.** `leave_couple()` RPC가 없어서, 잘못된 스페이스에 들어가면
 * 복구 수단이 없다. 그래서 화면은 참여 버튼 위에 확인 문구를 두고,
 * 참여 직후에는 홈이 아니라 **확인 화면**(`/onboarding/wedding`)으로 보낸다.
 *
 * 코드 형식(6자리·혼동문자 제외)은 화면이 `isInviteCode`로 먼저 거른다 —
 * 그 함수는 `"use client"` 모듈에 있어 서버에서 호출할 수 없다.
 * 여기서는 형식이 맞는 코드가 **DB에 없을 때**만 다룬다.
 */
export async function redeemInviteAction(
  prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const code = String(formData.get("code") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "").trim();
  const streak = prev.invalidCodeStreak ?? 0;
  const codeResetToken = prev.codeResetToken;

  if (!displayName) {
    return fail({
      field: "displayName",
      fieldMessage: ONBOARDING_COPY.nameRequired,
      invalidCodeStreak: streak,
      codeResetToken,
    });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_invite", {
    p_code: code,
    p_display_name: displayName,
  });

  if (error) {
    const failure = rpcCode(error);
    // 문구를 띄우지 않는다. 세션이 끊긴 것이라 사용자가 폼에서 할 수 있는 일이 없다.
    // switch 안에 두면 `redirect()`가 never를 던지는 걸 eslint의 no-fallthrough가 모른다.
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "ALREADY_IN_COUPLE":
        return fail({
          alert: ONBOARDING_COPY.alreadyInCoupleJoin,
          offerHome: true,
          invalidCodeStreak: 0,
          codeResetToken,
        });
      case "DISPLAY_NAME_REQUIRED":
        return fail({
          field: "displayName",
          fieldMessage: ONBOARDING_COPY.nameRequired,
          invalidCodeStreak: streak,
          codeResetToken,
        });
      case "INVALID_CODE": {
        // 2회 연속 실패부터 만료·1회성 가능성을 덧붙인다. 첫 실패에 그걸 말하면
        // 그냥 오타를 낸 사람이 상대에게 새 코드를 조르러 간다.
        const next = streak + 1;
        return fail({
          field: "code",
          fieldMessage: ONBOARDING_COPY.codeNotFound,
          alert: next >= 2 ? ONBOARDING_COPY.codeStale : undefined,
          invalidCodeStreak: next,
          codeResetToken,
        });
      }
      case "COUPLE_FULL":
        // 코드는 맞았지만 자리가 없다. 같은 코드를 다시 넣을 이유가 없으므로 필드를 비운다.
        return fail({
          alert: ONBOARDING_COPY.coupleFull,
          invalidCodeStreak: 0,
          codeResetToken: (codeResetToken ?? 0) + 1,
        });
      default:
        return fail({
          alert: unexpectedMessage("참여하지", error.code || error.message),
          invalidCodeStreak: streak,
          codeResetToken,
        });
    }
  }

  // 빠뜨리면 `(app)` 레이아웃 가드가 낡은 판정으로 다시 `/onboarding`으로 튕긴다.
  revalidatePath("/", "layout");
  // 홈이 아니라 확인 화면으로 보낸다 — 어느 스페이스에 들어갔는지 알아챌 유일한 기회다.
  redirect("/onboarding/wedding");
}

/* ─────────────────────────────  스페이스 만들기  ───────────────────────────── */

/**
 * `p_name`은 비워 보낸다 — RPC가 `'우리 결혼 준비'`로 채운다. 온보딩에서 스페이스 이름까지
 * 물으면 입력이 하나 더 늘고, 이 시점에 정할 이유가 있는 값이 아니다(설정에서 바꾼다).
 */
export async function createCoupleAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const side = String(formData.get("side") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const weddingDate = String(formData.get("weddingDate") ?? "").trim();
  const totalBudget = Math.max(0, Math.round(Number(formData.get("totalBudget") ?? 0) || 0));

  // 아래 둘은 이 화면에 입력이 없다(1단계 값을 hidden으로 받는다). 그래서 필드가 아니라
  // 상단 알림으로 띄운다 — 고칠 곳이 바로 아래 "고치기" 링크이기 때문이다.
  if (side !== "groom" && side !== "bride") return fail({ alert: ONBOARDING_COPY.sideRequired });
  if (!displayName) return fail({ alert: ONBOARDING_COPY.nameRequired });

  if (!weddingDate) {
    return fail({ field: "weddingDate", fieldMessage: ONBOARDING_COPY.weddingDateRequired });
  }
  if (totalBudget > MAX_TOTAL_BUDGET) {
    return fail({ field: "totalBudget", fieldMessage: ONBOARDING_COPY.budgetTooLarge });
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_couple", {
    p_name: "",
    p_wedding_date: weddingDate,
    p_total_budget: totalBudget,
    p_display_name: displayName,
    p_side: side,
  });

  if (error) {
    const failure = rpcCode(error);
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "ALREADY_IN_COUPLE":
        return fail({ alert: ONBOARDING_COPY.alreadyInCoupleCreate, offerHome: true });
      case "INVALID_SIDE":
        return fail({ alert: ONBOARDING_COPY.sideRequired });
      case "DISPLAY_NAME_REQUIRED":
        return fail({ alert: ONBOARDING_COPY.nameRequired });
      case "WEDDING_DATE_REQUIRED":
        return fail({ field: "weddingDate", fieldMessage: ONBOARDING_COPY.weddingDateRequired });
      default:
        return fail({ alert: unexpectedMessage("스페이스를 만들지", error.code || error.message) });
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}
