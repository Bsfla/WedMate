import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 앱의 카드 표면. 시안의 14px 라디우스 + 1px 테두리를 한 곳에 모은다.
 *
 * shadcn `components/ui/card.tsx`(ring 기반 + --card-spacing 하위 컴포넌트 체계)와는
 * 별개다 — 그쪽은 나중에 shadcn 블록을 붙일 때를 위해 그대로 둔다.
 */
export type PanelTone = "default" | "accent" | "success" | "warning" | "muted";

/**
 * 강조 패널의 면·테두리. 화면에서 `bg-success-soft border-success/35`를 손으로
 * 적으면 탭마다 알파값이 달라진다 — 여기 한 곳에서만 정한다.
 * 텍스트 색은 담지 않는다: `-soft` 면 위 본문은 `--foreground`가 그대로 통과하고,
 * 강조가 필요하면 호출부가 `-strong` 토큰을 쓴다(D-007).
 */
const TONE: Record<PanelTone, string> = {
  default: "border-border bg-card",
  accent: "border-primary/25 bg-primary-soft",
  success: "border-success/35 bg-success-soft",
  warning: "border-warning/30 bg-warning-soft",
  muted: "border-border bg-muted",
};

export function Panel({
  children,
  className,
  tone = "default",
  /** 리스트를 담을 때처럼 내부 요소가 가장자리까지 닿아야 하면 켠다. */
  flush = false,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: PanelTone;
  flush?: boolean;
} & Omit<React.ComponentProps<"div">, "children" | "className">) {
  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-[14px] border",
        TONE[tone],
        flush ? "gap-0" : "gap-3 p-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
