"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { rpcCode, unexpectedMessage } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";

import { INVITE_COPY, type InviteState } from "./types";

/* ⚠️ 이 파일은 `"use server"`다. **async 함수만** export할 수 있다 — 문구·타입은 `./types`에 있다. */

/**
 * 초대 코드 발급 · 재발급.
 *
 * 🔴 재발급이면 **이전 코드가 즉시 무효**가 된다(`create_invite()`가 미사용 코드를 폐기한다).
 * 그래서 화면은 재발급일 때만 확인 시트를 거치고, 성공 뒤 배너로 한 번 더 알린다 (→ D-060).
 * `had_code`는 그 분기를 위해 폼이 실어 보내는 값이다.
 *
 * 반환값에 새 코드를 담지 않는다 — `revalidatePath`로 셀렉터가 다시 읽으므로,
 * 상태에도 담으면 같은 사실의 진실 소스가 두 벌이 된다.
 */
export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const regenerated = formData.get("had_code") === "1";

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_invite");

  if (error) {
    const failure = rpcCode(error);
    // 문구를 띄우지 않는다. 세션이 끊긴 것이라 사용자가 이 화면에서 할 수 있는 일이 없다.
    // switch 안에 두면 `redirect()`가 never를 던지는 걸 eslint의 no-fallthrough가 모른다.
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "COUPLE_FULL":
        // 발급이 구조적으로 불가능해졌다. 화면은 버튼을 걷어내고 멤버 목록을 위로 올린다.
        return { status: "error", alert: INVITE_COPY.full, full: true };
      case "NO_COUPLE":
        return { status: "error", alert: INVITE_COPY.noCouple };
      default:
        return {
          status: "error",
          alert: unexpectedMessage("초대 코드를 만들지", error.code || error.message),
        };
    }
  }

  // 스페이스 판정은 바뀌지 않으므로 레이아웃까지 무효화하지 않는다.
  revalidatePath("/settings/invite");
  return { status: "idle", regenerated };
}
