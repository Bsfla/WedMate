"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { CopyField } from "@/components/data/copy-field";
import { InlineError } from "@/components/data/error-state";
import { Panel } from "@/components/data/panel";
import { WarningBanner } from "@/components/data/warning-banner";
import { FormAlert } from "@/components/form/form-alert";
import { ConfirmSheet } from "@/components/layout/confirm-sheet";
import { Button } from "@/components/ui/button";

import { createInviteAction } from "./actions";
import { INVITE_COPY, INVITE_IDLE, type InviteState } from "./types";

type InviteBlockProps = {
  /** 살아 있는 코드. `null`은 "없다"이고, 그 판단이 불가능하면 `lookupFailed`가 참이다. */
  code: string | null;
  /** 코드가 향하는 자리 ("예신"). 코드가 없을 때도 남은 역할로 미리 알 수 있다. */
  sideLabel: string | null;
  /** 이미 조립된 만료 문구. **서버가 만든 문자열을 그대로 받는다** — 여기서 다시 포맷하면 하이드레이션이 어긋난다. */
  expiryText: string | null;
  urgent: boolean;
  lookupFailed: boolean;
};

/**
 * 코드 발급 · 표시 · 재발급.
 *
 * 🔴 **재발급은 이미 보낸 코드를 화면에 아무 흔적 없이 죽인다.** 이 화면에서 유일하게
 * 조용히 망가지는 동작이라 확인 시트를 거친다. 반대로 최초 발급은 잃을 것이 없어
 * 확인을 붙이면 마찰만 남는다 — 확인 비용은 잃을 것이 있을 때만 낸다. (→ D-060)
 *
 * 조회 실패(`lookupFailed`)도 확인을 거친다. 살아 있는 코드가 있는지 **모르는** 상태라
 * 바로 발급하면 멀쩡한 코드를 죽일 수 있다. (→ D-059)
 */
export function InviteBlock({
  code,
  sideLabel,
  expiryText,
  urgent,
  lookupFailed,
}: InviteBlockProps) {
  const [state, submit, pending] = useActionState<InviteState, FormData>(issue, INVITE_IDLE);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const alertRef = useRef<HTMLDivElement>(null);

  async function issue(prev: InviteState, formData: FormData) {
    const next = await createInviteAction(prev, formData);
    // 성공하면 새 코드가 revalidate로 내려온다. 시트는 그때 닫는다.
    if (next.status === "idle") setConfirmOpen(false);
    return next;
  }

  useEffect(() => {
    if (state.status === "error") alertRef.current?.focus();
  }, [state]);

  // 제출 중에는 이전 에러를 감춘다 — 재시도 중에 낡은 문구가 남아 있지 않게.
  const shown = state.status === "error" && !pending ? state : INVITE_IDLE;
  // 서버가 COUPLE_FULL을 돌려준 뒤에는 발급이 구조적으로 불가능하다. 버튼을 비활성으로
  // 남기지 않고 걷어낸다 (→ D-061).
  const canIssue = !state.full;
  const needsConfirm = Boolean(code) || lookupFailed;

  const sideBadge = sideLabel ? (
    <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-1 text-caption text-muted-foreground">
      {INVITE_COPY.sideSlot(sideLabel)}
    </span>
  ) : null;

  return (
    <>
      {shown.alert && <FormAlert ref={alertRef}>{shown.alert}</FormAlert>}

      {/* 최초 발급에는 띄우지 않는다 — 잃은 것이 없다. 재발급에만 뜬다. */}
      {state.regenerated && !pending && (
        <WarningBanner
          description={INVITE_COPY.regeneratedBody}
          title={INVITE_COPY.regeneratedTitle}
          tone="info"
        />
      )}

      <Panel>
        {code ? (
          <CopyField
            badge={sideBadge}
            caption={
              expiryText ? (
                <p
                  className={
                    urgent
                      ? "num text-body-sm font-medium text-warning-strong"
                      : "num text-body-sm text-muted-foreground"
                  }
                >
                  {expiryText}
                </p>
              ) : null
            }
            copiedLabel={INVITE_COPY.copied}
            copyFailedMessage={INVITE_COPY.copyFailed}
            copyLabel={INVITE_COPY.copy}
            hint={INVITE_COPY.shareWarning}
            label={INVITE_COPY.codeLabel}
            shareLabel={INVITE_COPY.share}
            shareText={INVITE_COPY.shareText(code)}
            value={code}
          />
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-caption text-muted-foreground">{INVITE_COPY.codeLabel}</span>
              {sideBadge}
            </div>
            {/* 조회에 실패했을 때는 "없어요"라고 말하지 않는다 — 있는지 모르는 것이다. */}
            {lookupFailed ? (
              <InlineError className="mt-1" message={INVITE_COPY.lookupFailed} />
            ) : (
              <>
                <p className="text-body font-semibold">{INVITE_COPY.noneTitle}</p>
                <p className="text-body-sm text-muted-foreground">{INVITE_COPY.noneBody}</p>
              </>
            )}
          </div>
        )}

        {/* 코드가 없을 때의 발급 CTA는 패널 안에 전폭 48px로 둔다 — 이 화면의 주 행동이다. */}
        {!code && canIssue && !needsConfirm && (
          <form action={submit}>
            <Button className="w-full" disabled={pending} size="lg" type="submit">
              {pending ? INVITE_COPY.creating : INVITE_COPY.create}
            </Button>
          </form>
        )}

        {!code && canIssue && needsConfirm && (
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            size="lg"
            type="button"
          >
            {pending ? INVITE_COPY.creating : INVITE_COPY.create}
          </Button>
        )}
      </Panel>

      {/* 재발급은 부 행동이라 패널 밖 44px secondary다. 주 행동(복사·공유)과 무게가 갈린다. */}
      {code && canIssue && (
        <div className="flex flex-col gap-1.5">
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            type="button"
            variant="secondary"
          >
            {pending ? INVITE_COPY.creating : INVITE_COPY.regenerate}
          </Button>
          <p className="px-0.5 text-caption text-muted-foreground">
            {INVITE_COPY.regenerateHint}
          </p>
        </div>
      )}

      <ConfirmSheet
        action={submit}
        body={code ? INVITE_COPY.regenerateBody(code) : INVITE_COPY.lookupFailedConfirm}
        cancelLabel={INVITE_COPY.cancel}
        confirmLabel={code ? INVITE_COPY.regenerate : INVITE_COPY.create}
        // 조회에 실패했을 때도 1로 보낸다. 코드가 있었다면 배너가 반드시 필요하고,
        // 없었다면 "이전 코드는 못 써요"가 한 번 헛나갈 뿐이다 — 손해가 비대칭이다.
        hidden={{ had_code: "1" }}
        onOpenChange={setConfirmOpen}
        open={confirmOpen}
        pending={pending}
        pendingLabel={INVITE_COPY.creating}
        title={INVITE_COPY.regenerateTitle}
      />
    </>
  );
}
