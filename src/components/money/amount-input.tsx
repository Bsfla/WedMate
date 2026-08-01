"use client";

import { formatNumber, parseAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 퀵버튼 프리셋. 자릿수가 두 단위나 다른 두 종류의 금액이 이 컴포넌트를 공유한다 —
 * 지출 한 건(수십만 원)과 총 가용예산·저축 목표(수천만 원)다.
 * `expense` 프리셋으로 2,600만 원을 채우려면 +100만을 26번 눌러야 한다.
 */
const STEP_PRESETS = {
  expense: [
    { label: "+1만", amount: 10_000 },
    { label: "+10만", amount: 100_000 },
    { label: "+100만", amount: 1_000_000 },
  ],
  budget: [
    { label: "+100만", amount: 1_000_000 },
    { label: "+500만", amount: 5_000_000 },
    { label: "+1,000만", amount: 10_000_000 },
  ],
} as const;

type AmountInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  autoFocus?: boolean;
  /** 퀵버튼 단위. 총예산·저축 목표처럼 자릿수가 큰 자리에 `budget`을 쓴다. */
  steps?: keyof typeof STEP_PRESETS;
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
  steps = "expense",
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
        {STEP_PRESETS[steps].map((step) => (
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
