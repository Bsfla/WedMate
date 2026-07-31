import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 대분류 색을 쓰는 2글자 카테고리 표식. 리스트 행 왼쪽에 놓인다. */
export function CategoryMark({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-[10px] text-caption font-bold tracking-tight",
        className,
      )}
      style={{
        color,
        // 같은 색을 아주 옅게 깔아 대분류를 면으로도 구분한다.
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}

type ListRowProps = {
  leading?: ReactNode;
  title: ReactNode;
  /** 제목 아래 칩·배지 줄 */
  meta?: ReactNode;
  /** 오른쪽 위 (보통 금액) */
  trailing?: ReactNode;
  /** 오른쪽 아래 보조 텍스트 */
  trailingCaption?: ReactNode;
  /** 예상 지출이면 사선 배경이 깔린다 */
  estimated?: boolean;
  /** 넘기면 행 전체가 링크가 된다. 44px는 행 높이(56px)가 이미 만족한다. */
  href?: string;
  /** 넘기면 행 전체가 버튼이 된다 (바텀시트 열기 등). 클라이언트 컴포넌트에서만 쓴다. */
  onClick?: () => void;
  /** 이동을 뜻하는 › 표식. 기본값은 "이동 가능한데 오른쪽에 금액이 없을 때". */
  chevron?: boolean;
  className?: string;
};

const ROW = "flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left";

/**
 * 좌 표식 · 중앙 설명 · 우 금액. 최소 높이 56px.
 *
 * `href`/`onClick`을 주면 행 전체가 터치 타깃이 된다 — 설정 메뉴·카테고리 관리처럼
 * "누르면 들어가는 행"을 화면마다 손으로 다시 짜지 않게 하려는 것이다.
 * 누름 상태는 색만이 아니라 `active:` 배경 변화로도 준다.
 */
export function ListRow({
  leading,
  title,
  meta,
  trailing,
  trailingCaption,
  estimated = false,
  href,
  onClick,
  chevron,
  className,
}: ListRowProps) {
  const interactive = Boolean(href || onClick);
  const showChevron = chevron ?? (interactive && !trailing);

  const body = (
    <>
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn("truncate text-body font-medium", estimated && "text-muted-foreground")}>
          {title}
        </p>
        {meta && <div className="flex flex-wrap items-center gap-1.5">{meta}</div>}
      </div>
      {(trailing || trailingCaption) && (
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          {trailing}
          {trailingCaption && (
            <span className="num text-body-sm text-muted-foreground">{trailingCaption}</span>
          )}
        </div>
      )}
      {showChevron && (
        <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
      )}
    </>
  );

  const interactiveClass = cn(
    ROW,
    "transition-colors active:bg-muted",
    "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:-outline-offset-2 focus-visible:outline-none",
  );

  return (
    <li
      className={cn(
        "border-b border-border/60 last:border-b-0",
        estimated && "hatch-estimate",
        !interactive && ROW,
        className,
      )}
    >
      {href ? (
        <Link className={interactiveClass} href={href}>
          {body}
        </Link>
      ) : onClick ? (
        <button className={interactiveClass} onClick={onClick} type="button">
          {body}
        </button>
      ) : (
        body
      )}
    </li>
  );
}
