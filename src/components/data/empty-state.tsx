import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 데이터 0건. `?fixture=empty`에서 5탭 전부 이 상태가 된다.
 *
 * **빈 상태는 다음 행동이 있어야 끝난다.** 설명만 있고 누를 것이 없으면 막다른 길이다 —
 * `action`에 그 화면에서 가장 먼저 해야 할 일 하나를 넣는다. (→ D-042)
 *
 * `bordered`를 켜면 점선 테두리 상자를 스스로 그린다. 실선 카드(`Panel`)는
 * "내용이 있는 표면"의 신호라, 비어 있음을 담는 그릇으로는 점선이 맞다.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  bordered = false,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
  /** 다음 행동 하나. `Button size="sm"` 또는 링크. */
  action?: ReactNode;
  bordered?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 px-5 py-10 text-center",
        bordered && "rounded-[14px] border border-dashed border-border bg-card/40",
        className,
      )}
    >
      <span className="grid size-13 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-6" strokeWidth={1.7} />
      </span>
      <p className="text-body font-semibold">{title}</p>
      <p className="max-w-[26ch] text-body-sm text-balance text-muted-foreground">{description}</p>
      {action && <div className="pt-1.5">{action}</div>}
    </div>
  );
}
