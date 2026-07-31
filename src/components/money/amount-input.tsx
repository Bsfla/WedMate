"use client";

import { formatNumber, parseAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_STEPS = [
  { label: "+1만", amount: 10_000 },
  { label: "+10만", amount: 100_000 },
  { label: "+100만", amount: 1_000_000 },
] as const;

type AmountInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  autoFocus?: boolean;
  className?: string;
  /**
   * 아래 셋은 `Field`가 넘겨 주는 것을 **안쪽 `<input>`까지** 내리기 위한 통로다.
   * 바깥 래퍼가 들고 있으면 포커스가 input에 있을 때 에러 문구가 낭독되지 않는다 —
   * `aria-describedby`는 포커스된 요소의 것만 읽히기 때문이다.
   */
  id?: string;
  describedBy?: string;
  invalid?: boolean;
};

/**
 * 금액 입력. 숫자 키패드 + 천단위 자동 콤마 + 퀵버튼.
 *
 * 폰트를 26px로 키운 건 크기 때문만이 아니다 — 입력 필드가 16px 미만이면
 * iOS가 포커스 시 화면을 자동 확대한다. 그걸 막으려고 `maximum-scale=1`로
 * 확대를 봉인하면 접근성이 깨지므로, 폰트 쪽을 키워 해결한다.
 */
export function AmountInput({
  value,
  onChange,
  label,
  autoFocus = false,
  className,
  id,
  describedBy,
  invalid,
}: AmountInputProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "flex min-h-[58px] items-center gap-2 rounded-xl border border-primary bg-card px-3.5",
          "ring-3 ring-primary-soft",
        )}
      >
        <input
          // 소수점 없는 숫자 키패드를 띄운다.
          inputMode="numeric"
          type="text"
          // 바깥에 보이는 <label for={id}>가 있으면 그쪽이 이름이다. aria-label을 같이 두면
          // 눈에 보이는 라벨과 낭독되는 이름이 갈리므로, id를 받은 경우엔 얹지 않는다.
          aria-label={id ? undefined : label}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          id={id}
          autoFocus={autoFocus}
          value={value === 0 ? "" : formatNumber(value)}
          placeholder="0"
          onChange={(event) => onChange(parseAmount(event.target.value))}
          className="num min-w-0 flex-1 bg-transparent text-[1.625rem] leading-tight font-bold tracking-tight outline-none placeholder:text-muted-foreground/60"
        />
        <span className="shrink-0 text-money-md text-muted-foreground">원</span>
      </div>

      <div className="flex gap-1.5">
        {QUICK_STEPS.map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => onChange(value + step.amount)}
            className="h-9 flex-1 rounded-[10px] border border-border text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {step.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="h-9 flex-1 rounded-[10px] border border-border text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          지우기
        </button>
      </div>
    </div>
  );
}
