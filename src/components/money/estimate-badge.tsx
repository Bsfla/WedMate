import { cn } from "@/lib/utils";

/**
 * 날짜 미정 = 예상 지출 표식.
 * 점선 테두리가 본체다 — 그레이스케일로 렌더해도 확정 건과 구분되어야 한다.
 */
export function EstimateBadge({ className, label = "예상" }: { className?: string; label?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-md border border-dashed px-2 text-caption font-semibold",
        "border-primary/55 bg-primary-soft text-primary",
        className,
      )}
    >
      {label}
    </span>
  );
}
