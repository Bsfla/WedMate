import type { ReactNode } from "react";

import { MoneyText } from "@/components/money/money-text";
import { cn } from "@/lib/utils";

type DataRowTone = "default" | "muted" | "warning" | "success";

const VALUE_TONE: Record<DataRowTone, string> = {
  default: "text-foreground",
  muted: "text-muted-foreground",
  warning: "text-warning-strong",
  success: "text-success-strong",
};

type DataRowProps = {
  label: ReactNode;
  /**
   * 숫자를 넘기면 `MoneyText size="sm"`으로 렌더한다 — 화면이 `formatWon`을
   * 직접 부르지 않게 하는 통로다. 인원수·퍼센트처럼 원화가 아닌 값은 노드로 넘긴다.
   */
  value: ReactNode | number;
  /** 차감 항목. 값 앞에 −를 붙인다 (`-1234`를 넘겨 음수로 만들지 않는다). */
  minus?: boolean;
  tone?: DataRowTone;
  /** 라벨 아래 한 줄 설명. */
  hint?: ReactNode;
  className?: string;
};

/**
 * "라벨 — 값" 한 줄. 손익 내역 · 배분 대비 세부합 · 저축 목표 진행 수치처럼
 * 패널 안에서 항목을 나열하는 자리에 쓴다.
 *
 * 이 조립은 홈·예산·하객·결산 네 화면이 각자 `flex justify-between` +
 * `text-body-sm text-muted-foreground`로 다시 짜고 있었다. 라벨 크기와 값 크기가
 * 화면마다 반칸씩 달라 같은 정보가 다른 무게로 보였다. (→ D-040)
 */
export function DataRow({ label, value, minus = false, tone = "default", hint, className }: DataRowProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-sm text-muted-foreground">{label}</span>
        {hint && <span className="truncate text-caption text-muted-foreground">{hint}</span>}
      </div>
      <span className={cn("num shrink-0 text-money-sm", VALUE_TONE[tone])}>
        {minus && "−"}
        {typeof value === "number" ? <MoneyText value={value} size="sm" /> : value}
      </span>
    </div>
  );
}

/**
 * `DataRow` 묶음. `divided`를 켜면 위에 구분선이 생겨 대표 금액과 내역이 갈린다.
 */
export function DataRowGroup({
  children,
  divided = false,
  className,
}: {
  children: ReactNode;
  divided?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5",
        // `border-border`가 아니라 `current`인 이유: 이 묶음은 틴트 패널(`Panel tone`) 안에도
        // 들어간다. 고정 회색선은 success-soft·warning-soft 면 위에서 거의 사라진다.
        // current는 본문 색이라 라이트/다크·틴트 여부와 무관하게 같은 세기로 보인다.
        divided && "border-t border-current/12 pt-2.5",
        className,
      )}
    >
      {children}
    </div>
  );
}
