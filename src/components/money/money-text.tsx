import { formatCompactWon, formatWon } from "@/lib/format";
import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  display: "text-display",
  lg: "text-money-lg",
  md: "text-money-md",
  sm: "text-money-sm",
} as const;

export type MoneySize = keyof typeof SIZE_CLASS;

/**
 * `compact="auto"`가 축약으로 넘어가는 지점. 1억부터는 자릿수가 11자를 넘어
 * 375px 2칸 그리드(내부 폭 ≈138px)에서 `money-lg`가 잘린다.
 * 타입 스케일이 9단 고정이라 글자를 줄여 맞출 수 없으므로 표기를 줄인다.
 */
const AUTO_COMPACT_FROM = 100_000_000;

type MoneyTextProps = {
  value: number;
  size?: MoneySize;
  /**
   * 좁은 칩·축 라벨용 축약 표기 (1,338만).
   * `"auto"`는 1억 이상일 때만 축약한다 — 좁은 칸에서 잘리느니 자리수를 줄인다.
   */
  compact?: boolean | "auto";
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
  const useCompact =
    compact === "auto" ? Math.abs(value) >= AUTO_COMPACT_FROM : Boolean(compact);
  const text = useCompact ? formatCompactWon(value) : formatWon(value);
  const prefix = signed && value > 0 ? "+" : "";

  return (
    <span
      // 축약했으면 정확한 금액을 title로 남긴다 — 축약은 표시상의 타협이지
      // 정보를 버리는 것이 아니다.
      className={cn("num", SIZE_CLASS[size], muted && "text-muted-foreground", className)}
      title={useCompact ? formatWon(value) : undefined}
    >
      {prefix}
      {text}
    </span>
  );
}
