import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 섹션 제목 + 우측 액션. 카드 바깥, 목록 위에 놓인다. */
export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-3 px-0.5 pt-1", className)}>
      <h2 className="text-section">{title}</h2>
      {action}
    </div>
  );
}
