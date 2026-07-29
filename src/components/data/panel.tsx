import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 앱의 카드 표면. 시안의 14px 라디우스 + 1px 테두리를 한 곳에 모은다.
 *
 * shadcn `components/ui/card.tsx`(ring 기반 + --card-spacing 하위 컴포넌트 체계)와는
 * 별개다 — 그쪽은 나중에 shadcn 블록을 붙일 때를 위해 그대로 둔다.
 */
export function Panel({
  children,
  className,
  /** 리스트를 담을 때처럼 내부 요소가 가장자리까지 닿아야 하면 켠다. */
  flush = false,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] border border-border bg-card",
        flush ? "gap-0" : "gap-3 p-4",
        className,
      )}
    >
      {children}
    </div>
  );
}
