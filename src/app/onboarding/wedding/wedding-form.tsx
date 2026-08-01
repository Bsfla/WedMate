"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";

import { DateField } from "@/components/form/date-field";
import { Field } from "@/components/form/field";
import { AmountInput } from "@/components/money/amount-input";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";

import { createCoupleAction } from "../actions";
import { focusFieldControl } from "../focus-field";
import { FormTop } from "../form-top";
import { ONBOARDING_COPY, ONBOARDING_IDLE, type OnboardingState } from "../types";

/**
 * 예식일이 비었을 때는 왕복하지 않고 여기서 잡는다. 네이티브 `required`를 쓰지 않는 이유는
 * 브라우저 기본 문구("이 입력란을 작성하세요")가 **무엇을 왜 고쳐야 하는지** 말하지 않아서다 —
 * 이 화면의 예식일은 그냥 필수값이 아니라 홈 D-day의 분모다. 그 사실을 문구가 말해야 한다.
 *
 * 나머지 검증(역할·이름·금액 상한)은 서버 액션이 한다. 여기 없는 입력이거나, DB 제약과
 * 같은 값이어야 하는 것들이다.
 */
async function weddingAction(
  prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const weddingDate = String(formData.get("weddingDate") ?? "").trim();

  if (!weddingDate) {
    return {
      status: "error",
      field: "weddingDate",
      fieldMessage: ONBOARDING_COPY.weddingDateRequired,
    };
  }

  // 성공하면 서버 액션이 홈으로 리다이렉트하므로 값을 돌려주지 않는다.
  const next: OnboardingState | undefined = await createCoupleAction(prev, formData);
  return next ?? prev;
}

/**
 * 2단계 · 생성 분기. 1단계 값(`side`·`name`)은 쿼리 파라미터로 받아 **hidden으로 다시 실어 보낸다** —
 * 이 폼에는 그 두 값을 고칠 입력이 없고, 고치려면 1단계로 돌아가야 하기 때문이다.
 *
 * 되돌아가는 길을 `router.back()`으로 하지 않는다. 주소창으로 바로 들어온 사람에게는
 * 돌아갈 히스토리가 없고, 있더라도 1단계에 값이 복원된다는 보장이 없다.
 * 링크에 값을 실어 보내면 어느 경로로 왔든 같은 화면으로 돌아간다.
 */
export function WeddingForm({ name, side }: { name: string; side: Side }) {
  const [state, submit, pending] = useActionState<OnboardingState, FormData>(
    weddingAction,
    ONBOARDING_IDLE,
  );
  const [weddingDate, setWeddingDate] = useState("");
  const [totalBudget, setTotalBudget] = useState(0);
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field && focusFieldControl(state.field)) return;
    alertRef.current?.focus();
  }, [state]);

  // 제출 중에는 이전 에러를 감춘다.
  const shown = state.status === "error" && !pending ? state : ONBOARDING_IDLE;
  const backHref = `/onboarding?side=${side}&name=${encodeURIComponent(name)}`;

  return (
    <form action={submit} className="flex flex-col gap-5">
      <FormTop alertRef={alertRef} state={shown} />

      <input name="side" type="hidden" value={side} />
      <input name="displayName" type="hidden" value={name} />

      <div className="flex flex-col gap-4">
        <DateField
          error={shown.field === "weddingDate" ? shown.fieldMessage : undefined}
          help="아직 확정 전이면 예정일을 넣어 주세요. 나중에 바꿀 수 있어요."
          id="weddingDate"
          label="예식일"
          name="weddingDate"
          onChange={setWeddingDate}
          value={weddingDate}
        />

        <Field
          error={shown.field === "totalBudget" ? shown.fieldMessage : undefined}
          /* 선택 입력이라는 사실을 라벨과 도움말이 **둘 다** 말한다. 라벨의 "(선택)"만으로는
             큰 입력창을 본 사람이 "비워도 되나?"를 확신하지 못한다. 0은 미설정으로 저장된다(D-052). */
          help="지금 비워 둬도 괜찮아요. 나중에 설정에서 정할 수 있어요."
          id="totalBudget"
          label="총 가용예산 (선택)"
        >
          {(control) => (
            <AmountInput
              describedBy={control["aria-describedby"]}
              id={control.id}
              invalid={control["aria-invalid"]}
              label="총 가용예산"
              onChange={setTotalBudget}
              // 총예산은 수천만 원 단위다. expense 프리셋(+1만)으로는 26번을 눌러야 한다.
              steps="budget"
              value={totalBudget}
            />
          )}
        </Field>
        {/* AmountInput은 제어 컴포넌트라 자기 값을 FormData에 싣지 않는다. */}
        <input name="totalBudget" type="hidden" value={totalBudget} />
      </div>

      <div className="flex flex-col gap-3">
        {/* 1단계에서 정한 값을 한 줄로 되읽어 준다. 이 화면에서 마지막으로 확인할 수 있는 지점이고,
            역할은 한번 정하면 상대의 역할까지 같이 결정된다. */}
        <div className="flex items-center justify-between gap-2">
          <p className="min-w-0 truncate text-caption text-muted-foreground">
            <span className="font-semibold text-foreground">{name}</span> · {SIDE_LABEL[side]}으로
            만들어요
          </p>
          <Button asChild className="shrink-0" size="sm" variant="ghost">
            <Link href={backHref}>고치기</Link>
          </Button>
        </div>

        {/* CTA를 fixed로 띄우지 않는다. 흐름에 두어야 키보드가 올라와도 겹치지 않는다. */}
        <Button className="w-full" disabled={pending} size="lg" type="submit">
          {pending ? "스페이스 만드는 중…" : "스페이스 만들고 시작하기"}
        </Button>
      </div>
    </form>
  );
}
