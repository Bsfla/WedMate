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
  className?: string;
};

/** 좌 표식 · 중앙 설명 · 우 금액. 최소 높이 56px. */
export function ListRow({
  leading,
  title,
  meta,
  trailing,
  trailingCaption,
  estimated = false,
  className,
}: ListRowProps) {
  return (
    <li
      className={cn(
        "flex min-h-14 items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0",
        estimated && "hatch-estimate",
        className,
      )}
    >
      {leading}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p
          className={cn(
            "truncate text-body font-medium",
            estimated && "text-muted-foreground",
          )}
        >
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
    </li>
  );
}
