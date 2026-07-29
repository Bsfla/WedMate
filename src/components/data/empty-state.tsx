import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 데이터 0건. `?fixture=empty`에서 5탭 전부 이 상태가 된다. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-2.5 px-5 py-9 text-center", className)}>
      <span className="grid size-13 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-6" strokeWidth={1.7} />
      </span>
      <p className="text-body font-semibold">{title}</p>
      <p className="max-w-[24ch] text-body-sm text-muted-foreground">{description}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
