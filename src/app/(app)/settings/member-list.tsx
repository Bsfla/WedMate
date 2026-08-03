"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { InlineError } from "@/components/data/error-state";
import { FormAlert } from "@/components/form/form-alert";
import { ConfirmSheet } from "@/components/layout/confirm-sheet";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";
import type { SpaceMember } from "@/lib/supabase/space";

import { removeMemberAction } from "./actions";
import { SPACE_ACTION_IDLE, SPACE_COPY, type SpaceActionState } from "./types";

const SIDES: readonly Side[] = ["groom", "bride"] as const;

type MemberListProps = {
  members: SpaceMember[];
  /** 멤버 조회만 실패했다. 스페이스 자체는 살아 있으므로 이 자리에만 안내를 둔다. */
  unavailable: boolean;
  /** 위에 다른 블록이 있는 패널 안이면 켠다 (설정 홈의 스페이스 카드). */
  divided?: boolean;
  /** 발급된 코드가 향하는 자리. 초대 화면만 넘긴다 — 빈 쪽 값이 "초대 중"으로 바뀐다. */
  pendingSide?: Side | null;
  pendingLabel?: string;
  pendingHint?: string;
};

/**
 * 예랑·예신 두 줄 + (조건부) 내보내기.
 *
 * **같은 목록이 설정 홈과 초대 화면 두 곳에 있다.** 두 벌로 그리면 이름 잘림 규칙과
 * 내보내기 유무가 화면마다 갈린다. 내보내기를 두 곳 모두에 두는 이유는
 * `canRemove`가 참인 시간이 **최대 24시간**이기 때문이다(→ D-058) — 그 짧은 창에서
 * 사용자가 어느 화면에 있든 조치할 수 있어야 하고, 평소에는 버튼도 안내문도 아예 없다.
 *
 * 버튼은 `canRemove`가 거짓이면 **비활성이 아니라 렌더 자체를 안 한다** (→ D-061).
 * 최종 판정은 DB가 하므로, 렌더와 제출 사이에 창이 닫히면 `removeWindowClosed` 문구를 받는다.
 */
export function MemberList({
  members,
  unavailable,
  divided = false,
  pendingSide = null,
  pendingLabel,
  pendingHint,
}: MemberListProps) {
  const [state, submit, pending] = useActionState<SpaceActionState, FormData>(
    removeAction,
    SPACE_ACTION_IDLE,
  );
  const [target, setTarget] = useState<SpaceMember | null>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  async function removeAction(prev: SpaceActionState, formData: FormData) {
    const next = await removeMemberAction(prev, formData);
    // 성공하면 목록이 revalidate로 다시 내려온다. 시트는 여기서 닫는다 —
    // 효과 안에서 닫으면 `set-state-in-effect`에 걸리고, 언제 닫히는지도 흐려진다.
    if (next.status === "idle") setTarget(null);
    return next;
  }

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  if (unavailable) return <InlineError message={SPACE_COPY.membersFailed} />;

  const bySide = new Map<Side, SpaceMember>();
  for (const member of members) bySide.set(member.side, member);

  const removable = members.find((member) => member.canRemove) ?? null;
  const shown = state.status === "error" && !pending ? state : SPACE_ACTION_IDLE;

  return (
    <>
      <DataRowGroup divided={divided}>
        {SIDES.map((side) => {
          const member = bySide.get(side);
          const waiting = !member && pendingSide === side;

          return (
            <DataRow
              hint={waiting ? pendingHint : undefined}
              key={side}
              label={SIDE_LABEL[side]}
              tone={member ? "default" : "muted"}
              value={
                <span className="inline-flex items-baseline gap-1">
                  {/* 표시 이름은 DB에 길이 상한이 없다. 폭을 묶어 라벨을 밀어내지 않게 한다. */}
                  <span className="block max-w-[150px] truncate">
                    {member
                      ? member.displayName
                      : waiting
                        ? (pendingLabel ?? SPACE_COPY.memberNone)
                        : SPACE_COPY.memberNone}
                  </span>
                  {member?.isMe && <span className="text-body-sm text-muted-foreground">· 나</span>}
                </span>
              }
            />
          );
        })}
      </DataRowGroup>

      {removable && (
        <div className="flex items-center justify-between gap-3 border-t border-current/12 pt-3">
          <p className="min-w-0 text-caption text-muted-foreground">{SPACE_COPY.removeStripHint}</p>
          <Button
            className="shrink-0"
            onClick={() => setTarget(removable)}
            size="sm"
            type="button"
            variant="secondary"
          >
            {SPACE_COPY.remove}
          </Button>
        </div>
      )}

      {shown.alert && <FormAlert ref={alertRef}>{shown.alert}</FormAlert>}

      {removable && (
        <ConfirmSheet
          action={submit}
          body={SPACE_COPY.removeBody}
          cancelLabel={SPACE_COPY.cancel}
          confirmLabel={SPACE_COPY.remove}
          hidden={{ userId: target?.userId ?? "" }}
          onOpenChange={(next) => setTarget(next ? removable : null)}
          open={target !== null}
          pending={pending}
          pendingLabel={SPACE_COPY.removing}
          title={SPACE_COPY.removeTitle(target?.displayName ?? removable.displayName)}
        />
      )}
    </>
  );
}
