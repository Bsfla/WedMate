"use client";

import { Calendar } from "lucide-react";
import { useState, useTransition } from "react";

import { WarningBanner } from "@/components/data/warning-banner";
import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { Chip, ChipRow } from "@/components/layout/chip";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { AmountInput } from "@/components/money/amount-input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  METHOD_LABEL,
  METHODS,
  PAYER_LABEL,
  PAYERS,
  STAGE_LABEL,
  STAGES,
  type Method,
  type Payer,
  type Stage,
} from "@/lib/domain";
import { cn } from "@/lib/utils";

const PAYER_OPTIONS = PAYERS.map((value) => ({ value, label: PAYER_LABEL[value] }));
const METHOD_OPTIONS = METHODS.map((value) => ({ value, label: METHOD_LABEL[value] }));
const STAGE_OPTIONS = STAGES.map((value) => ({ value, label: STAGE_LABEL[value] }));

/** 최근 사용한 분류. P3에서 실제 사용 이력으로 대체된다. */
const RECENT_CATEGORIES = [
  { mid: "스드메", minor: "스튜디오 스냅" },
  { mid: "예식", minor: "웨딩홀 대관" },
  { mid: "스드메", minor: "드레스" },
];

/** P3에서 날짜 선택기로 대체된다. 지금은 표시만 하는 값이라 상수로 둔다. */
const TODAY = "2026-07-27";

/**
 * 상한. 결혼 준비 지출 한 건이 10억을 넘는 경우는 없다고 보고,
 * 0을 더 눌러 자릿수가 밀린 입력을 잡아 준다.
 */
const MAX_AMOUNT = 1_000_000_000;

type SaveError = { field?: "amount"; message: string };

/**
 * 빠른입력 바텀시트 — 상담 현장에서 한 손으로 끝나야 하는 화면.
 *
 * 라벨·도움말·에러 규격은 `components/form/field.tsx`가 갖는다(D-032).
 * 이 파일에 폼 라벨 스타일을 다시 적지 않는다 — 로그인 폼과 규격이 갈리면
 * 저장소에 폼 규격이 두 벌 생긴다.
 *
 * 퍼블리싱 단계라 저장은 시트를 닫기만 한다. 실제 쓰기는 P3에서 Server Action으로 붙는다 —
 * `useTransition`을 미리 둔 이유가 그것이다. `startTransition` 본문만 갈아끼우면
 * 제출 중 상태(버튼 비활성 + "저장 중…")가 그대로 작동한다.
 */
export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState(0);
  // 결제자·수단·단계·분류는 시트를 닫아도 유지한다. 같은 업체에서 계약금·중도금을
  // 연달아 넣는 게 이 화면의 실제 사용 패턴이라, 매번 초기화하면 손이 더 간다.
  const [payer, setPayer] = useState<Payer>("bride");
  const [method, setMethod] = useState<Method>("cash");
  const [stage, setStage] = useState<Stage>("deposit");
  const [category, setCategory] = useState(RECENT_CATEGORIES[0]);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [error, setError] = useState<SaveError | null>(null);
  const [pending, startTransition] = useTransition();


  // 시트를 다시 열면 금액·날짜미정·에러는 반드시 비어 있어야 한다.
  // 닫을 때 지우면 슬라이드아웃 중에 값이 사라지는 게 보이므로, 열리는 렌더에서 맞춘다
  // (React 공식 "렌더 중 상태 조정" 패턴 — 추가 렌더가 페인트 전에 끝난다).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAmount(0);
      setDateUnknown(false);
      setError(null);
    }
  }

  const focusAmount = () => {
    document.getElementById("quick-amount")?.focus();
  };

  const handleSave = () => {
    // 재시도를 시작하는 순간 이전 에러를 지운다. 낡은 문구가 남아 있으면
    // 방금 누른 저장이 또 실패한 것처럼 보인다.
    setError(null);

    if (amount <= 0) {
      setError({
        field: "amount",
        message: "금액이 0원이에요. 실제 결제한 금액을 입력해 주세요",
      });
      focusAmount();
      return;
    }

    if (amount > MAX_AMOUNT) {
      setError({
        field: "amount",
        message: "10억원을 넘는 금액이에요. 0을 더 누르지 않았는지 자릿수를 확인해 주세요",
      });
      focusAmount();
      return;
    }

    startTransition(() => {
      // P3: 여기에 Server Action 호출이 들어간다. 실패하면
      // setError({ message: "…" })로 폼 전체 에러(FormAlert)를 띄운다.
      onOpenChange(false);
    });
  };

  const amountError = error?.field === "amount" ? error.message : undefined;
  const formError = error && !error.field ? error.message : undefined;

  return (
    <BottomSheet
      description="금액·분류·결제자·단계·날짜를 입력해 지출을 기록합니다."
      onOpenChange={onOpenChange}
      open={open}
      title="지출 추가"
      titleAction={
        // 취소는 어떤 상태에서도 사라지지 않는다. 이전 구현은 '날짜 미정'을 켜면
        // 이 자리가 배지로 바뀌어 시트를 빠져나갈 버튼이 없어졌다.
        <button
          className="flex min-h-11 items-center px-2 text-body-sm text-muted-foreground"
          onClick={() => onOpenChange(false)}
          type="button"
        >
          취소
        </button>
      }
      footer={
        <Button className="w-full" disabled={pending} onClick={handleSave} size="lg">
          {/* 버튼이 무슨 일이 벌어질지를 말한다 — '날짜 미정'이면 이 건은 예상 지출이 된다. */}
          {pending ? "저장 중…" : dateUnknown ? "예상 지출로 저장" : "저장"}
        </Button>
      }
    >
      {formError && <FormAlert>{formError}</FormAlert>}

      <Field error={amountError} id="quick-amount" label="금액">
        {(control) => (
          <AmountInput
            autoFocus
            describedBy={control["aria-describedby"]}
            id={control.id}
            invalid={Boolean(amountError)}
            label="지출 금액"
            onChange={setAmount}
            value={amount}
          />
        )}
      </Field>

      <Field help="최근 쓴 분류에서 골라 주세요" id="quick-category-mid" label="분류">
        {(control) => (
          <>
            <ChipRow label="최근 쓴 분류">
              {RECENT_CATEGORIES.map((item) => (
                <Chip
                  key={item.minor}
                  onClick={() => setCategory(item)}
                  selected={item.minor === category.minor}
                  variant="solid"
                >
                  {item.mid} › {item.minor}
                </Chip>
              ))}
            </ChipRow>

            <div className="grid grid-cols-2 gap-2.5">
              <Input {...control} readOnly value={category.mid} />
              <Input aria-label="소분류" readOnly value={category.minor} />
            </div>
          </>
        )}
      </Field>

      {/* 세그먼트는 자기 `label`로 이미 접근성 이름을 갖고, Field는 라벨의 **생김새와 간격**을
          맡는다 — 화면마다 caption 라벨을 손으로 적지 않기 위함.
          이전에는 렌더 프롭을 통째로 버려서 세 필드 모두 `id`·`aria-describedby`가 끊겨
          있었다. 지금은 그대로 내려보낸다(SegmentedControl이 통로를 받는다). */}
      <Field id="quick-payer" label="결제자">
        {(control) => (
          <SegmentedControl
            describedBy={control["aria-describedby"]}
            id={control.id}
            label="결제자"
            onChange={setPayer}
            options={PAYER_OPTIONS}
            tone="rose"
            value={payer}
          />
        )}
      </Field>

      <Field id="quick-method" label="수단">
        {(control) => (
          <SegmentedControl
            describedBy={control["aria-describedby"]}
            id={control.id}
            label="결제수단"
            onChange={setMethod}
            options={METHOD_OPTIONS}
            value={method}
          />
        )}
      </Field>

      <Field id="quick-stage" label="단계">
        {(control) => (
          <SegmentedControl
            describedBy={control["aria-describedby"]}
            id={control.id}
            label="결제단계"
            onChange={setStage}
            options={STAGE_OPTIONS}
            value={stage}
          />
        )}
      </Field>

      <div className="flex flex-col gap-2">
        <Field id="quick-date" label="날짜">
          {(control) => (
            <div className="relative">
              <Input
                {...control}
                className="num pr-11"
                disabled={dateUnknown}
                placeholder="날짜 미정"
                readOnly
                value={dateUnknown ? "" : TODAY}
              />
              <Calendar
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground",
                  dateUnknown && "opacity-50",
                )}
                strokeWidth={1.9}
              />
            </div>
          )}
        </Field>

        {/* 상자는 20px, 히트 영역은 44px(D-031). Label도 min-h-11이라 문구 쪽을 눌러도 켜진다. */}
        <div className="flex items-center gap-3">
          <Checkbox
            checked={dateUnknown}
            id="quick-date-unknown"
            onCheckedChange={(checked) => setDateUnknown(checked === true)}
          />
          <Label
            className={cn("text-body font-normal", !dateUnknown && "text-muted-foreground")}
            htmlFor="quick-date-unknown"
          >
            날짜 미정 — 예상 지출로 기록
          </Label>
        </div>

        {/* 저장 전에 이 건이 예상 지출이 된다는 사실이 화면에 드러나야 한다. */}
        {dateUnknown && (
          <WarningBanner
            description="확정 지출 합계·소진율에는 포함되지 않습니다. 날짜가 정해지면 확정으로 전환하세요."
            title="월별 예상 금액에 반영됩니다"
            tone="info"
          />
        )}
      </div>

      <Field id="quick-vendor" label="업체">
        {(control) => <Input {...control} placeholder="선택 입력" readOnly />}
      </Field>

      <Field id="quick-memo" label="메모">
        {(control) => <Input {...control} placeholder="선택 입력" readOnly />}
      </Field>
    </BottomSheet>
  );
}
