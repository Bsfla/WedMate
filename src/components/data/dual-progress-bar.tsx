import { clampedPercent, formatWon, ratio } from "@/lib/format";
import { cn } from "@/lib/utils";

type DualProgressBarProps = {
  confirmed: number;
  estimated: number;
  total: number;
  label: string;
  /** 범례를 함께 낸다. 카드 안에서 한 번만 보이면 되는 경우 끈다. */
  showLegend?: boolean;
  className?: string;
};

/**
 * 확정(채운 막대) + 예상(사선 패턴) 2계열.
 * 색이 아니라 **채움 방식**으로 구분해 그레이스케일에서도 읽힌다.
 */
export function DualProgressBar({
  confirmed,
  estimated,
  total,
  label,
  showLegend = true,
  className,
}: DualProgressBarProps) {
  const confirmedPercent = clampedPercent(confirmed, total);
  // 확정분을 채우고 남은 폭 안에서만 예상분을 그린다.
  const estimatedPercent = Math.min(
    Math.max(0, 100 - confirmedPercent),
    ratio(estimated, total) * 100,
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={Math.round(confirmedPercent + estimatedPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
        className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted"
      >
        <div className="h-full bg-primary" style={{ width: `${confirmedPercent}%` }} />
        <div
          className="hatch-estimate-strong h-full border-l border-dashed border-primary/60"
          style={{ width: `${estimatedPercent}%` }}
        />
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <LegendItem kind="confirmed">확정 {formatWon(confirmed)}</LegendItem>
          <LegendItem kind="estimated">예상 {formatWon(estimated)}</LegendItem>
        </div>
      )}
    </div>
  );
}

function LegendItem({
  kind,
  children,
}: {
  kind: "confirmed" | "estimated";
  children: React.ReactNode;
}) {
  return (
    <span className="num flex items-center gap-1.5 text-caption text-muted-foreground">
      <i
        aria-hidden
        className={cn(
          "size-2.5 shrink-0 rounded-[3px]",
          kind === "confirmed"
            ? "bg-primary"
            : "hatch-estimate-strong border border-dashed border-primary/65",
        )}
      />
      {children}
    </span>
  );
}
