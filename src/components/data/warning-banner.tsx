import { TriangleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type WarningBannerProps = {
  title: ReactNode;
  description?: ReactNode;
  /** info는 경고가 아니라 안내 — 예상 지출 설명처럼 로즈 톤을 쓰는 자리. */
  tone?: "warning" | "info";
  className?: string;
};

/** 배분 초과 · 보증인원 부족 · 잔금 미납처럼 조치가 필요한 상태를 알린다. */
export function WarningBanner({
  title,
  description,
  tone = "warning",
  className,
}: WarningBannerProps) {
  const Icon = tone === "warning" ? TriangleAlert : Info;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border p-3.5",
        tone === "warning"
          ? "border-warning/30 bg-warning-soft"
          : "border-primary/25 bg-primary-soft",
        className,
      )}
    >
      <Icon
        aria-hidden
        strokeWidth={1.9}
        className={cn("mt-px size-[18px] shrink-0", tone === "warning" ? "text-warning" : "text-primary")}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        <p
          className={cn(
            "text-body-sm font-semibold",
            tone === "warning" ? "text-warning-strong" : "text-primary",
          )}
        >
          {title}
        </p>
        {description && <p className="text-caption font-normal text-muted-foreground">{description}</p>}
      </div>
    </div>
  );
}
