"use client";

import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: string;
};

type SegmentedControlProps<T extends string> = {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /** 선택 상태를 로즈로 강조한다. 결제자·측 선택처럼 의미가 있는 자리에 쓴다. */
  tone?: "neutral" | "rose";
  className?: string;
};

/**
 * 2~4분기 선택. 예랑|예신|공동|기타, 확정|예상 등.
 * 버튼 높이는 38px이지만 컨테이너 패딩 3px을 더해 44px 터치 영역을 만든다.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = "neutral",
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn("flex gap-[3px] rounded-xl bg-muted p-[3px]", className)}
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
              "flex h-[38px] flex-1 items-center justify-center rounded-[9px] text-sm font-semibold tracking-tight transition-colors",
              "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
              selected
                ? cn(
                    "bg-card shadow-[0_1px_3px_rgba(0,0,0,0.09)]",
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
