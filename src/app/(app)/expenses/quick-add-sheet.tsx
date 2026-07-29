"use client";

import { Calendar, Check } from "lucide-react";
import { useState } from "react";

import { WarningBanner } from "@/components/data/warning-banner";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { AmountInput } from "@/components/money/amount-input";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { Button } from "@/components/ui/button";
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="pl-0.5 text-caption text-muted-foreground">{children}</span>;
}

/** select·text 입력의 겉모습. 48px 높이 + 16px 폰트(iOS 자동 확대 방지). */
function FieldBox({
  children,
  trailing,
  muted = false,
  disabled = false,
}: {
  children: React.ReactNode;
  trailing?: React.ReactNode;
  muted?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 text-base tracking-tight",
        muted && "text-muted-foreground",
        disabled && "border-dashed opacity-45",
      )}
    >
      {children}
      {trailing}
    </div>
  );
}

/**
 * 빠른입력 바텀시트 — 상담 현장에서 한 손으로 끝나야 하는 화면.
 *
 * 퍼블리싱 단계라 저장은 로컬 상태만 갱신하고 시트를 닫는다.
 * 실제 쓰기는 P3에서 Server Action으로 붙인다.
 */
export function QuickAddSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [payer, setPayer] = useState<Payer>("bride");
  const [method, setMethod] = useState<Method>("cash");
  const [stage, setStage] = useState<Stage>("deposit");
  const [category, setCategory] = useState(RECENT_CATEGORIES[0]);
  const [dateUnknown, setDateUnknown] = useState(false);

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="지출 추가"
      description="금액·분류·결제자·단계·날짜를 입력해 지출을 기록합니다."
      titleAction={
        dateUnknown ? (
          <EstimateBadge label="예상 지출로 저장됩니다" />
        ) : (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="min-h-11 px-1 text-body-sm text-muted-foreground"
          >
            취소
          </button>
        )
      }
      footer={
        <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
          저장
        </Button>
      }
    >
      <div className="flex flex-col gap-1.5">
        <FieldLabel>금액</FieldLabel>
        <AmountInput value={amount} onChange={setAmount} label="지출 금액" autoFocus />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>분류 · 최근</FieldLabel>
        <div className="flex flex-wrap gap-1.5">
          {RECENT_CATEGORIES.map((item) => {
            const selected = item.minor === category.minor;
            return (
              <button
                key={item.minor}
                type="button"
                onClick={() => setCategory(item)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex h-8 items-center rounded-full border px-3 text-body-sm font-medium transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {item.mid} › {item.minor}
              </button>
            );
          })}
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <FieldBox>{category.mid}</FieldBox>
          <FieldBox>{category.minor}</FieldBox>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>결제자</FieldLabel>
        <SegmentedControl
          tone="rose"
          label="결제자"
          options={PAYER_OPTIONS}
          value={payer}
          onChange={setPayer}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>수단</FieldLabel>
        <SegmentedControl label="결제수단" options={METHOD_OPTIONS} value={method} onChange={setMethod} />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>단계</FieldLabel>
        <SegmentedControl label="결제단계" options={STAGE_OPTIONS} value={stage} onChange={setStage} />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>날짜</FieldLabel>
        <FieldBox
          disabled={dateUnknown}
          muted={dateUnknown}
          trailing={<Calendar aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />}
        >
          <span className="num">{dateUnknown ? "—" : "2026-07-27"}</span>
        </FieldBox>

        <button
          type="button"
          role="checkbox"
          aria-checked={dateUnknown}
          onClick={() => setDateUnknown((prev) => !prev)}
          className="flex min-h-11 items-center gap-2.5 text-left text-[0.9rem] tracking-tight focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <span
            className={cn(
              "grid size-[22px] shrink-0 place-items-center rounded-md border-[1.6px] transition-colors",
              dateUnknown ? "border-primary bg-primary" : "border-border",
            )}
          >
            {dateUnknown && (
              <Check aria-hidden className="size-3.5 text-primary-foreground" strokeWidth={3} />
            )}
          </span>
          <span className={cn(!dateUnknown && "text-muted-foreground")}>
            날짜 미정 — 예상 지출로 기록
          </span>
        </button>

        {/* 저장 전에 이 건이 예상 지출이 된다는 사실이 화면에 드러나야 한다. */}
        {dateUnknown && (
          <WarningBanner
            tone="info"
            title="월별 예상 금액에 반영됩니다"
            description="확정 지출 합계·소진율에는 포함되지 않습니다. 날짜가 정해지면 확정으로 전환하세요."
          />
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>업체</FieldLabel>
        <FieldBox muted>선택 입력</FieldBox>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>메모</FieldLabel>
        <FieldBox muted>선택 입력</FieldBox>
      </div>
    </BottomSheet>
  );
}
