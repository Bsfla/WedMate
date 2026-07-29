import { formatCompactWon, formatWon } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  display: "text-display",
  lg: "text-money-lg",
  md: "text-money-md",
  sm: "text-money-sm",
} as const;

export type MoneySize = keyof typeof SIZE_CLASS;

type MoneyTextProps = {
  value: number;
  size?: MoneySize;
  /** 좁은 칩·축 라벨용 축약 표기 (1,338만) */
  compact?: boolean;
  /** 양수에 +를 붙인다. 최종 손익처럼 부호가 의미를 갖는 자리에만 쓴다. */
  signed?: boolean;
  /** 예상 지출처럼 확정이 아닌 금액은 톤을 낮춘다. */
  muted?: boolean;
  className?: string;
};

/**
 * 금액 렌더의 단일 통로. 화면마다 제각각인 ₩ 표기를 막기 위해
 * 금액은 반드시 이 컴포넌트(또는 lib/format)를 거친다.
 */
export function MoneyText({
  value,
  size = "md",
  compact = false,
  signed = false,
  muted = false,
  className,
}: MoneyTextProps) {
  const text = compact ? formatCompactWon(value) : formatWon(value);
  const prefix = signed && value > 0 ? "+" : "";

  return (
    <span className={cn("num", SIZE_CLASS[size], muted && "text-muted-foreground", className)}>
      {prefix}
      {text}
    </span>
  );
}
