import { STAGE_LABEL, type Stage } from "@/lib/domain";
import { cn } from "@/lib/utils";

/** 계약금·중도금·잔금·전액. 추적이 필요한 '잔금'만 앰버로 승격시킨다. */
export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  const isBalance = stage === "balance";

  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center rounded-md px-2 text-caption font-semibold",
        isBalance
          ? "bg-warning-soft text-warning-strong"
          : "bg-payer-joint-soft text-muted-foreground",
        className,
      )}
    >
      {STAGE_LABEL[stage]}
    </span>
  );
}
