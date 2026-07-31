import type { ReactNode } from "react";

import { Panel } from "@/components/data/panel";
import { MoneyText, type MoneySize } from "@/components/money/money-text";
import { cn } from "@/lib/utils";

type StatTileProps = {
  label: ReactNode;
  value: number;
  size?: MoneySize;
  /** 값 아래 보조 설명 */
  caption?: ReactNode;
  /** 라벨 오른쪽 배지 (D-day 등) */
  badge?: ReactNode;
  signed?: boolean;
  valueClassName?: string;
  className?: string;
};

/** 라벨 + 큰 금액 + 보조 수치. 홈·하객의 요약 칸에 쓴다. */
export function StatTile({
  label,
  value,
  size = "lg",
  caption,
  badge,
  signed = false,
  valueClassName,
  className,
}: StatTileProps) {
  return (
    <Panel className={cn("gap-1.5 p-3.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-caption text-muted-foreground">{label}</span>
        {badge}
      </div>
      {/* 2칸 그리드의 내부 폭은 375px에서 ≈138px이라 1억 이상은 잘린다.
          `compact="auto"`가 그 지점부터만 축약한다(정확한 금액은 title로 남는다). */}
      <MoneyText className={valueClassName} compact="auto" signed={signed} size={size} value={value} />
      {caption && <p className="text-body-sm text-muted-foreground">{caption}</p>}
    </Panel>
  );
}
