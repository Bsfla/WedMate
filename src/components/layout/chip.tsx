import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ChipProps = {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  /**
   * `soft` — 필터처럼 여러 개가 나란히 켜졌다 꺼졌다 하는 자리(기본).
   * `solid` — 최근 분류처럼 선택이 곧 입력값이 되는 자리. 대비를 더 준다.
   */
  variant?: "soft" | "solid";
  /** 앞에 붙는 색 점·아이콘. 결제자 필터처럼 색 축이 있는 자리에 쓴다. */
  leading?: ReactNode;
  className?: string;
};

/**
 * 필터·선택 칩. 높이 36px + `ChipRow`의 8px 간격으로 44px 터치 영역을 만든다(D-031).
 *
 * 지출 필터와 빠른입력 최근분류가 각자 다른 칩(h-9 소프트 / h-8 솔리드, 라디우스도 다름)을
 * 들고 있었다. 같은 화면 흐름 안에서 같은 제스처인데 생김새가 달라 학습이 이어지지 않는다.
 * **선택 구분은 색이 아니라 테두리 굵기와 면**으로도 살아 있다 — 그레이스케일 대응(D-006).
 */
export function Chip({
  children,
  selected = false,
  onClick,
  variant = "soft",
  leading,
  className,
}: ChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] border px-3",
        "text-body-sm font-medium whitespace-nowrap transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? variant === "solid"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-primary bg-primary-soft text-primary"
          : "border-border bg-card text-muted-foreground active:bg-muted",
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {leading}
      {children}
    </button>
  );
}

/**
 * 칩을 담는 가로 스크롤 줄. `Screen`의 좌우 패딩(16px)을 밖으로 빼내
 * 칩이 화면 가장자리까지 흐르게 하고, 스크롤바는 감춘다.
 *
 * `role="group"` + 라벨을 붙인다 — 칩 하나하나는 `aria-pressed`만 갖고 있어서
 * 무엇을 거르는 스위치인지 스크린리더가 알 방법이 없었다.
 */
export function ChipRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      aria-label={label}
      className={cn("no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5", className)}
      role="group"
    >
      {children}
    </div>
  );
}

/** 칩 줄 안의 구분선. 결제자 필터와 확정/예상 필터처럼 축이 바뀌는 자리에 넣는다. */
export function ChipDivider() {
  return <span aria-hidden className="my-1.5 w-px shrink-0 bg-border" />;
}
