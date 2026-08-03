"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  /**
   * `null`이면 **아무것도 고르지 않은 상태**다. 필수 선택인데 기본값을 정할 근거가 없는
   * 자리(온보딩의 역할 — 예랑/예신)에 쓴다. 미리 하나를 켜 두면 절반이 잘못 배정된다.
   */
  value: T | null;
  onChange: (value: T) => void;
  label: string;
  /** 선택 상태를 로즈로 강조한다. 결제자·측 선택처럼 의미가 있는 자리에 쓴다. */
  tone?: "neutral" | "rose";
  /**
   * 아래 셋은 `Field`가 넘겨 주는 것을 받는 통로다 (`AmountInput`과 같은 규약).
   * 이게 없으면 `Field` 안에 넣어도 라벨의 에러 문구가 컨트롤에 연결되지 않는다.
   */
  id?: string;
  describedBy?: string;
  invalid?: boolean;
  className?: string;
};

/**
 * 2~4분기 선택. 예랑|예신|공동|기타, 확정|예상 등.
 * 버튼 높이는 38px이지만 컨테이너 패딩 3px을 더해 44px 터치 영역을 만든다.
 *
 * **`Field`와 함께 쓸 때** — `id`를 받으면 컨테이너(radiogroup)에 붙는다. `Field`가 그리는
 * 보이는 라벨의 `for`가 이 그룹을 가리키게 되고, 그룹 이름은 `aria-label`이 따로 준다.
 * (div는 labelable 요소가 아니라 라벨 클릭으로 포커스가 옮겨가지는 않는다 — 감수한 지점이다.
 *  얻는 것은 `aria-describedby`로 에러가 그룹에 붙고 `aria-invalid`가 서는 것이다.)
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "neutral",
  id,
  describedBy,
  invalid,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-describedby={describedBy}
      aria-invalid={invalid || undefined}
      aria-label={label}
      className={cn(
        "flex gap-[3px] rounded-xl bg-muted p-[3px]",
        // 에러 링. --destructive가 --primary와 같은 값이라 ui/input의 aria-invalid 규격과
        // 색이 일치한다. 미선택 자체는 색으로 말하지 않는다 — 알약이 없다는 사실이 곧 신호다.
        invalid && "ring-3 ring-destructive/20 dark:ring-destructive/40",
        className,
      )}
      id={id}
      role="radiogroup"
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[38px] min-w-0 flex-1 items-center justify-center rounded-[9px] px-1",
              "truncate text-body font-semibold transition-colors",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              selected
                ? cn(
                    // 그림자 값을 직접 적지 않는다 — 라이트의 검정 알파는 어두운 바탕에서
                    // 사라져 선택 상태가 색으로만 남는다(D-006 위반). 토큰이 테마별로 다르다.
                    "bg-card shadow-raised",
                    tone === "rose" ? "text-primary" : "text-foreground",
                  )
                : "text-muted-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
