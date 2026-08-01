"use client";

import { DoorOpen, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";

import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { FormAlert } from "@/components/form/form-alert";
import { ConfirmSheet } from "@/components/layout/confirm-sheet";

import { deleteCoupleAction, leaveCoupleAction } from "./actions";
import { SPACE_ACTION_IDLE, SPACE_COPY, type SpaceActionState } from "./types";

/**
 * 나가기 · 삭제. **둘은 배타적이다** (→ D-058).
 *
 * 혼자면 나갈 수 없다 — 마지막 멤버가 나가면 아무도 접근 못 하는 스페이스가 남는다.
 * 그때 올바른 동작은 "빠지기"가 아니라 **cascade 삭제**라 결과가 다르고, 그래서 버튼 이름도
 * 다르다. 두 개를 나란히 놓고 하나를 비활성으로 두지 않는 이유가 그것이다 —
 * 지금 할 수 있는 하나만 보인다.
 *
 * 내보내기는 여기 없다. 그건 **멤버 행에 붙는 동작**이라 `member-list.tsx`가 갖는다.
 */
export function SpaceActions({ alone }: { alone: boolean }) {
  const [leaveState, leave, leavePending] = useActionState<SpaceActionState, FormData>(
    leaveCoupleAction,
    SPACE_ACTION_IDLE,
  );
  const [deleteState, remove, deletePending] = useActionState<SpaceActionState, FormData>(
    deleteCoupleAction,
    SPACE_ACTION_IDLE,
  );
  const [open, setOpen] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  const state = alone ? deleteState : leaveState;
  const pending = alone ? deletePending : leavePending;

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  // 성공하면 서버 액션이 `/onboarding`으로 리다이렉트한다 — 화면이 닫을 것도 지울 것도 없다.
  const shown = state.status === "error" && !pending ? state : SPACE_ACTION_IDLE;

  return (
    <>
      {shown.alert && <FormAlert ref={alertRef}>{shown.alert}</FormAlert>}

      <Panel flush>
        <ul>
          <ListRow
            leading={
              alone ? (
                <Trash2 aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.8} />
              ) : (
                <DoorOpen
                  aria-hidden
                  className="size-5 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                />
              )
            }
            meta={
              <span className="text-body-sm text-muted-foreground">
                {alone ? SPACE_COPY.deleteCaption : SPACE_COPY.leaveCaption}
              </span>
            }
            onClick={() => setOpen(true)}
            title={alone ? SPACE_COPY.delete : SPACE_COPY.leave}
          />
        </ul>
      </Panel>

      <ConfirmSheet
        // 되돌릴 수 없는 쪽에만 게이트를 건다. 나가기는 상대에게 새 코드를 받아 되돌아올 수 있다.
        acknowledge={alone ? SPACE_COPY.deleteAcknowledge : undefined}
        action={alone ? remove : leave}
        body={alone ? SPACE_COPY.deleteBody : SPACE_COPY.leaveBody}
        cancelLabel={SPACE_COPY.cancel}
        confirmLabel={alone ? SPACE_COPY.delete : SPACE_COPY.leave}
        onOpenChange={setOpen}
        open={open}
        pending={pending}
        pendingLabel={alone ? SPACE_COPY.deleting : SPACE_COPY.leaving}
        title={alone ? SPACE_COPY.deleteTitle : SPACE_COPY.leaveTitle}
      />
    </>
  );
}
