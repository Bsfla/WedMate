import { clampedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type ProgressBarProps = {
  value: number;
  total: number;
  /** 막대 색. 대분류 색 등 CSS 변수를 그대로 넘긴다. */
  color?: string;
  thin?: boolean;
  label: string;
  className?: string;
};

/**
 * 단일 진행률 바. Recharts를 쓰지 않는다 — div가 더 가볍고,
 * 스크린리더가 값을 읽고, 다크 모드 대응이 자동이다.
 */
export function ProgressBar({
  value,
  total,
  color = "var(--primary)",
  thin = false,
  label,
  className,
}: ProgressBarProps) {
  const percent = clampedPercent(value, total);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-muted",
        thin ? "h-[7px]" : "h-2.5",
        className,
      )}
    >
      <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: color }} />
    </div>
  );
}
