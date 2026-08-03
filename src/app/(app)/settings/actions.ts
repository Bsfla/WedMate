"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { rpcCode, unexpectedMessage } from "@/lib/rpc-error";
import { createClient } from "@/lib/supabase/server";

import { SPACE_COPY, type SpaceActionState } from "./types";

/* ⚠️ 이 파일은 `"use server"`다. **async 함수만** export할 수 있다 — 문구·타입은 `./types`에 있다. */

/**
 * 상대 내보내기 (→ D-058).
 *
 * DB가 두 겹으로 막는다 — **나보다 늦게 들어온 사람**만, **가입 후 24시간 이내**에만.
 * 화면의 `canRemove`는 버튼을 그릴지 정하는 근거일 뿐이고 **최종 판정은 여기가 아니라 DB다.**
 * 렌더와 제출 사이에 창이 닫힐 수 있어서 `REMOVE_WINDOW_CLOSED`를 반드시 문구로 받는다.
 */
export async function removeMemberAction(
  _prev: SpaceActionState,
  formData: FormData,
): Promise<SpaceActionState> {
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return { status: "error", alert: SPACE_COPY.removeNotMember };

  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", { p_user_id: userId });

  if (error) {
    const failure = rpcCode(error);
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "REMOVE_WINDOW_CLOSED":
        return { status: "error", alert: SPACE_COPY.removeWindowClosed };
      case "NOT_REMOVABLE":
        return { status: "error", alert: SPACE_COPY.removeNotAllowed };
      case "NOT_A_MEMBER":
        return { status: "error", alert: SPACE_COPY.removeNotMember };
      case "USE_LEAVE_INSTEAD":
        return { status: "error", alert: SPACE_COPY.removeSelf };
      case "NO_COUPLE":
        return { status: "error", alert: SPACE_COPY.noCouple };
      default:
        return {
          status: "error",
          alert: unexpectedMessage("내보내지", error.code || error.message),
        };
    }
  }

  // 멤버 목록은 설정·초대 두 화면에 있고 `getSpaceContext()`가 레이아웃에서도 쓰인다.
  revalidatePath("/", "layout");
  return { status: "idle" };
}

/**
 * 내가 나가기.
 *
 * 혼자일 때는 막힌다 — 마지막 멤버가 나가면 아무도 접근할 수 없는 스페이스가 남기 때문이다.
 * 그 경우의 올바른 동작은 삭제이고, 결과가 다르므로 이름도 버튼도 다르다.
 */
/* 인자를 받지 않는다. 읽을 입력이 없고, 미사용 인자를 남기면 lint가 경고한다
   (`no-unused-vars`가 `after-used`라 뒤쪽 인자는 `_` 접두사로도 면제되지 않는다).
   `useActionState`는 인자가 적은 함수를 그대로 받는다. */
export async function leaveCoupleAction(): Promise<SpaceActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_couple");

  if (error) {
    const failure = rpcCode(error);
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "LAST_MEMBER":
        return { status: "error", alert: SPACE_COPY.leaveLastMember };
      case "NO_COUPLE":
        return { status: "error", alert: SPACE_COPY.noCouple };
      default:
        return { status: "error", alert: unexpectedMessage("나가지", error.code || error.message) };
    }
  }

  // 스페이스가 사라졌다. 빠뜨리면 `(app)` 레이아웃 가드가 낡은 판정으로 이 화면을 다시 그린다.
  revalidatePath("/", "layout");
  redirect("/onboarding");
}

/**
 * 스페이스 삭제. **혼자일 때만** 허용된다 — 둘이 쓰는 데이터를 한 사람이 지울 수 없다.
 * 예산·지출·하객·카테고리가 cascade로 전부 사라진다. 되돌릴 수 없다.
 */
export async function deleteCoupleAction(): Promise<SpaceActionState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_couple");

  if (error) {
    const failure = rpcCode(error);
    if (failure === "AUTH_REQUIRED") redirect("/login");

    switch (failure) {
      case "NOT_ALONE":
        return { status: "error", alert: SPACE_COPY.deleteNotAlone };
      case "NO_COUPLE":
        return { status: "error", alert: SPACE_COPY.noCouple };
      default:
        return {
          status: "error",
          alert: unexpectedMessage("스페이스를 삭제하지", error.code || error.message),
        };
    }
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}
