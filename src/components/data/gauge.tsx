import { clampedPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

type GaugeProps = {
  value: number;
  /** 눈금 최대치. 보통 목표치보다 살짝 크게 잡아 마커가 끝에 붙지 않게 한다. */
  max: number;
  /** 점선 마커로 표시할 기준선 (최소보증인원 등) */
  marker?: number;
  label: string;
  caption: string;
  className?: string;
};

/** 예상 참석 vs 최소보증인원처럼 '기준선 대비 현재값'을 보여준다. */
export function Gauge({ value, max, marker, label, caption, className }: GaugeProps) {
  const percent = clampedPercent(value, max);
  const markerPercent = marker === undefined ? null : clampedPercent(marker, max);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("relative h-[34px] overflow-hidden rounded-[10px] bg-muted", className)}
    >
      <div
        className="absolute inset-y-0 left-0 border-r-2 border-primary bg-primary/15"
        style={{ width: `${percent}%` }}
      />
      {markerPercent !== null && (
        <div
          aria-hidden
          className="absolute -inset-y-0.5 border-l-2 border-dashed border-warning"
          style={{ left: `${markerPercent}%` }}
        />
      )}
      <span className="num absolute inset-0 flex items-center px-3 text-body-sm font-semibold tracking-tight">
        {caption}
      </span>
    </div>
  );
}
