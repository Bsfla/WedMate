"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { SectionHeader } from "@/components/data/section-header";
import { DateField } from "@/components/form/date-field";
import { CountField } from "@/components/form/count-field";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { FormSuccess } from "@/components/form/form-success";
import { AmountInput } from "@/components/money/amount-input";
import { Button } from "@/components/ui/button";
import { focusFieldControl } from "@/lib/focus-field";

import { updateWeddingInfoAction } from "./actions";
import {
  WEDDING_INFO_COPY,
  WEDDING_INFO_IDLE,
  type SavedWeddingInfo,
  type WeddingInfoField,
  type WeddingInfoState,
} from "./types";

/**
 * 예식 정보 편집 폼.
 *
 * 온보딩 폼과 다른 점이 둘 있고, 둘 다 **이 화면이 조정 루프 안에 있기 때문**이다 —
 * 사람은 저장하고 하객 탭을 보러 갔다가 되돌아와 숫자를 다시 만진다.
 *
 * 1. 성공을 화면에 **남긴다.** 온보딩은 성공하면 리다이렉트해서 폼이 사라지지만 여기는
 *    같은 자리에 머문다. 아무 변화가 없으면 저장이 됐는지 알 수 없다.
 * 2. 그 성공 블록은 **값을 다시 만지면 저절로 사라진다**(`isSaved`). 낡은 "저장했어요"가
 *    수정 중인 값 옆에 붙어 있으면, 아직 안 보낸 값을 보낸 것으로 읽힌다.
 *
 * 입력값은 `initial`(서버가 읽은 DB 값)로 초기화하고 그 뒤로는 클라이언트가 쥔다.
 * 저장에 성공해도 `revalidatePath`가 이 폼을 리마운트하지는 않으므로(같은 라우트),
 * 화면의 값과 DB의 값은 그대로 일치한 채 남는다.
 */
export function WeddingInfoForm({ initial }: { initial: SavedWeddingInfo }) {
  const [state, submit, pending] = useActionState<WeddingInfoState, FormData>(
    updateWeddingInfoAction,
    WEDDING_INFO_IDLE,
  );

  const [weddingDate, setWeddingDate] = useState(initial.weddingDate);
  const [totalBudget, setTotalBudget] = useState(initial.totalBudget);
  const [guestMinGuarantee, setGuestMinGuarantee] = useState(initial.guestMinGuarantee);
  const [mealCostPerHead, setMealCostPerHead] = useState(initial.mealCostPerHead);
  const [avgGiftAmount, setAvgGiftAmount] = useState(initial.avgGiftAmount);

  const alertRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  /* 포커스 이동이 곧 낭독이다(→ D-037). 실패는 고칠 입력으로, 성공은 확인 블록으로 옮긴다.
     성공까지 옮기지 않으면 스크린리더 사용자에게는 저장이 아무 일도 아니게 된다. */
  useEffect(() => {
    if (state.status === "saved") {
      successRef.current?.focus();
      return;
    }
    if (state.status !== "error") return;
    if (state.field && focusFieldControl(state.field)) return;
    alertRef.current?.focus();
  }, [state]);

  // 제출 중에는 직전 결과를 감춘다 — 지금 보내는 값의 결과로 읽히기 때문이다.
  const shown = pending ? WEDDING_INFO_IDLE : state;
  const errorFor = (field: WeddingInfoField) =>
    shown.status === "error" && shown.field === field ? shown.fieldMessage : undefined;

  /* 저장 직후의 값과 지금 화면의 값이 같을 때만 확인 블록이 남는다. */
  const saved = shown.status === "saved" ? shown.saved : undefined;
  const isSaved =
    saved !== undefined &&
    saved.weddingDate === weddingDate &&
    saved.totalBudget === totalBudget &&
    saved.guestMinGuarantee === guestMinGuarantee &&
    saved.mealCostPerHead === mealCostPerHead &&
    saved.avgGiftAmount === avgGiftAmount;

  return (
    /* 블록 간격을 `Screen`과 같은 16px로 둔다 — `SectionHeader`가 위 20 / 아래 8로
       스스로 당겨 붙는 계산이 그 리듬을 전제로 한다(→ D-039). 여기서 gap-5를 쓰면
       섹션 제목이 위아래 어느 블록에도 안 붙는다. */
    <form action={submit} className="flex flex-col gap-4">
      {shown.status === "error" && shown.alert && (
        <FormAlert ref={alertRef}>{shown.alert}</FormAlert>
      )}

      <SectionHeader title={WEDDING_INFO_COPY.basicTitle} />

      <div className="flex flex-col gap-4">
        <DateField
          error={errorFor("weddingDate")}
          help={WEDDING_INFO_COPY.weddingDateHelp}
          id="weddingDate"
          label={WEDDING_INFO_COPY.weddingDateLabel}
          name="weddingDate"
          onChange={setWeddingDate}
          value={weddingDate}
        />

        <Field
          error={errorFor("totalBudget")}
          /* 0은 "0원"이 아니라 "아직 안 정함"이다(→ D-052). 그래서 도움말이 두 벌이다 —
             비어 있을 때는 비워 둬도 된다는 사실이, 값이 있을 때는 그 값이 무엇을 만드는지가 급하다. */
          help={
            totalBudget === 0
              ? WEDDING_INFO_COPY.totalBudgetZeroHelp
              : WEDDING_INFO_COPY.totalBudgetHelp
          }
          id="totalBudget"
          label={WEDDING_INFO_COPY.totalBudgetLabel}
        >
          {(control) => (
            <AmountInput
              describedBy={control["aria-describedby"]}
              id={control.id}
              invalid={control["aria-invalid"]}
              label={WEDDING_INFO_COPY.totalBudgetLabel}
              onChange={setTotalBudget}
              // 수천만 원 단위. 여기만 큰 프리셋이고 아래 둘은 1인당 금액이라 `unit`이다.
              steps="budget"
              value={totalBudget}
              // 금액 필드가 셋인 화면이라 히어로를 쓰지 않는다 — 로즈 상자 셋은 위계가 아니다.
              variant="field"
            />
          )}
        </Field>
        {/* AmountInput·CountField는 제어 컴포넌트라 자기 값을 FormData에 싣지 않는다. */}
        <input name="totalBudget" type="hidden" value={totalBudget} />
      </div>

      <SectionHeader
        description={WEDDING_INFO_COPY.guestDescription}
        title={WEDDING_INFO_COPY.guestTitle}
      />

      <div className="flex flex-col gap-4">
        <CountField
          error={errorFor("guestMinGuarantee")}
          help={
            guestMinGuarantee === 0
              ? WEDDING_INFO_COPY.guestMinGuaranteeZeroHelp
              : WEDDING_INFO_COPY.guestMinGuaranteeHelp
          }
          id="guestMinGuarantee"
          label={WEDDING_INFO_COPY.guestMinGuaranteeLabel}
          onChange={setGuestMinGuarantee}
          unit="명"
          value={guestMinGuarantee}
        />
        <input name="guestMinGuarantee" type="hidden" value={guestMinGuarantee} />

        <Field
          error={errorFor("mealCostPerHead")}
          help={
            mealCostPerHead === 0
              ? WEDDING_INFO_COPY.mealCostPerHeadZeroHelp
              : WEDDING_INFO_COPY.mealCostPerHeadHelp
          }
          id="mealCostPerHead"
          label={WEDDING_INFO_COPY.mealCostPerHeadLabel}
        >
          {(control) => (
            <AmountInput
              describedBy={control["aria-describedby"]}
              id={control.id}
              invalid={control["aria-invalid"]}
              label={WEDDING_INFO_COPY.mealCostPerHeadLabel}
              onChange={setMealCostPerHead}
              steps="unit"
              value={mealCostPerHead}
              variant="field"
            />
          )}
        </Field>
        <input name="mealCostPerHead" type="hidden" value={mealCostPerHead} />

        <Field
          error={errorFor("avgGiftAmount")}
          help={
            avgGiftAmount === 0
              ? WEDDING_INFO_COPY.avgGiftAmountZeroHelp
              : WEDDING_INFO_COPY.avgGiftAmountHelp
          }
          id="avgGiftAmount"
          label={WEDDING_INFO_COPY.avgGiftAmountLabel}
        >
          {(control) => (
            <AmountInput
              describedBy={control["aria-describedby"]}
              id={control.id}
              invalid={control["aria-invalid"]}
              label={WEDDING_INFO_COPY.avgGiftAmountLabel}
              onChange={setAvgGiftAmount}
              steps="unit"
              value={avgGiftAmount}
              variant="field"
            />
          )}
        </Field>
        <input name="avgGiftAmount" type="hidden" value={avgGiftAmount} />
      </div>

      {/* CTA를 fixed로 띄우지 않는다. 흐름에 두어야 키보드가 올라와도 겹치지 않는다. */}
      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? WEDDING_INFO_COPY.submitting : WEDDING_INFO_COPY.submit}
      </Button>

      {/* 🔴 버튼 **아래**다. 제출 직후 눈과 손가락이 화면 바닥에 있고, 버튼 위에 끼우면
          블록이 버튼을 밀어내려 다음 탭이 빗나간다 (form-success.tsx 주석). */}
      {isSaved && (
        <FormSuccess ref={successRef} title={WEDDING_INFO_COPY.savedTitle}>
          {WEDDING_INFO_COPY.savedBody}
        </FormSuccess>
      )}
    </form>
  );
}
