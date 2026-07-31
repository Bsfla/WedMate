"use client";

import { useState } from "react";

import { ErrorState } from "@/components/data/error-state";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { AmountInput } from "@/components/money/amount-input";
import { Button } from "@/components/ui/button";
import { PAYER_LABEL, PAYERS, type Payer } from "@/lib/domain";

const PAYER_OPTIONS = PAYERS.map((value) => ({ value, label: PAYER_LABEL[value] }));

export function SegmentedControlDemo() {
  const [payer, setPayer] = useState<Payer>("bride");
  return (
    <SegmentedControl
      tone="rose"
      label="결제자 (데모)"
      options={PAYER_OPTIONS}
      value={payer}
      onChange={setPayer}
    />
  );
}

export function AmountInputDemo() {
  const [amount, setAmount] = useState(220_000);
  return <AmountInput value={amount} onChange={setAmount} label="금액 (데모)" />;
}

export function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="바텀시트"
        description="Radix Dialog 위에 직접 만든 하단 시트입니다."
        titleAction={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 px-1 text-body-sm text-muted-foreground"
          >
            취소
          </button>
        }
        footer={
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            저장
          </Button>
        }
      >
        <p className="text-body text-muted-foreground">
          최대 높이 85dvh, 본문만 스크롤, 하단은 safe-area만큼 패딩이 붙습니다. 바깥 탭 · ESC로
          닫힙니다.
        </p>
        <p className="text-body-sm text-muted-foreground">
          드래그 핸들은 현재 시각 표식만입니다 — 제스처로 내리는 동작은 P3에서 붙입니다.
        </p>
      </BottomSheet>
    </>
  );
}

/** 재시도가 실제로 동작하는 것을 보이기 위한 데모. 실물은 `(app)/error.tsx`가 쓴다. */
export function ErrorStateDemo() {
  const [tries, setTries] = useState(0);

  return (
    <ErrorState
      description="네트워크가 끊겼거나 서버가 응답하지 않았습니다. 잠시 후 다시 시도해 주세요."
      detail={`오류 코드 3f9a2c · 재시도 ${tries}회`}
      onRetry={() => setTries((prev) => prev + 1)}
      title="결산을 불러오지 못했어요"
    />
  );
}
