"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { FormAlert } from "@/components/form/form-alert";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

type ConfirmSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** "새 코드를 만들까요?" — 물음으로 끝낸다. 무엇이 일어날지는 `body`가 말한다. */
  title: string;
  /** **무엇을 잃는지 구체적으로.** "정말 하시겠습니까?"는 확인이 아니라 소음이다. */
  body: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  pending?: boolean;
  /**
   * 확인을 눌렀는데 실패했을 때의 문구.
   *
   * 🔴 실패했다고 시트를 닫지 않는다 — 무엇을 확인하던 중이었는지가 사라진다.
   * `body`는 `<p>` 안이라 여기에 배너를 끼울 수 없어서 슬롯을 따로 둔다.
   * 뜨는 순간 포커스를 옮겨 낭독시킨다 (`aria-live`를 쓰지 않는 이유 → D-037).
   */
  alert?: string;
  /** `useActionState`의 submit을 그대로 넘긴다. 확인 버튼이 이 폼을 제출한다. */
  action: (formData: FormData) => void;
  /** 액션에 실어 보낼 값. 시트 안에서 폼이 만들어지므로 hidden input으로 넣는다. */
  hidden?: Record<string, string>;
  /**
   * 켜야 확인 버튼이 열리는 문구. **되돌릴 수 없는 동작에만** 쓴다(스페이스 삭제).
   *
   * D-061("누를 수 없는 버튼을 비활성으로 남기지 않는다")과 충돌하지 않는다 —
   * 그 규칙은 사용자가 **아무것도 할 수 없는** 비활성을 금지한 것이고,
   * 여기는 바로 위에 여는 방법이 보이는 의도적인 게이트다.
   */
  acknowledge?: string;
};

/**
 * 되돌리기 어려운 동작 하나를 확인받는 바텀시트.
 *
 * 네 곳이 같은 모양을 쓴다 — 초대 코드 재발급 · 상대 내보내기 · 스페이스 나가기 · 삭제.
 * `window.confirm`을 쓰지 않는 이유는 스타일링이 아니라 **문구다**: 네이티브 확인창은
 * 무엇을 잃는지 두 문단으로 설명할 자리가 없고, 일부 브라우저는 아예 무시한다.
 *
 * - **제출 중에는 닫히지 않는다.** ESC·바깥 탭·취소 전부 막는다 — 서버 왕복 중에 시트가
 *   사라지면 사용자는 취소된 줄 안다.
 * - 닫을 때 `acknowledge` 체크를 되돌린다. 다시 열었을 때 게이트가 이미 풀려 있으면 안 된다.
 */
export function ConfirmSheet({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  pending = false,
  alert,
  action,
  hidden,
  acknowledge,
}: ConfirmSheetProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const acknowledgeId = useId();
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  function handleOpenChange(next: boolean) {
    if (pending) return;
    if (!next) setAcknowledged(false);
    onOpenChange(next);
  }

  const blocked = pending || (Boolean(acknowledge) && !acknowledged);

  return (
    <BottomSheet
      // `description`을 넘기지 않는다 — 제목과 같은 문장을 sr-only로 한 번 더 읽히게 할 뿐이다.
      // 본문 문단은 다이얼로그 안의 보이는 내용이라 그대로 낭독된다.
      footer={
        <form action={action} className="flex flex-col gap-2">
          {hidden &&
            Object.entries(hidden).map(([name, value]) => (
              <input key={name} name={name} type="hidden" value={value} />
            ))}

          <Button className="w-full" disabled={blocked} size="lg" type="submit">
            {pending ? pendingLabel : confirmLabel}
          </Button>
          <Button
            className="w-full"
            disabled={pending}
            onClick={() => handleOpenChange(false)}
            type="button"
            variant="ghost"
          >
            {cancelLabel}
          </Button>
        </form>
      }
      onOpenChange={handleOpenChange}
      open={open}
      title={title}
    >
      <p className="text-body text-muted-foreground">{body}</p>

      {alert && <FormAlert ref={alertRef}>{alert}</FormAlert>}

      {acknowledge && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-muted px-3.5 py-1">
          <Checkbox
            checked={acknowledged}
            id={acknowledgeId}
            onCheckedChange={(checked) => setAcknowledged(checked === true)}
          />
          <Label className="text-body-sm font-normal" htmlFor={acknowledgeId}>
            {acknowledge}
          </Label>
        </div>
      )}
    </BottomSheet>
  );
}
