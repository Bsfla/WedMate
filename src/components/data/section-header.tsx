import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: ReactNode;
  /** 제목 아래 한 줄 설명. 섹션이 무엇을 세는지 애매할 때만 쓴다. */
  description?: ReactNode;
  /** 우측 보조 수치 — "12팀 · 참석 예상 34명", 월 합계 금액 등. 액션보다 앞에 놓인다. */
  meta?: ReactNode;
  /** 우측 액션 (링크·버튼). */
  action?: ReactNode;
  /**
   * `sub` — 월 그룹 헤더처럼 섹션 안에서 한 번 더 나누는 자리.
   * 제목이 13px 볼드 뮤티드가 되어 `section`(16px) 헤더와 위계가 갈린다.
   */
  level?: "section" | "sub";
  className?: string;
};

/**
 * 섹션 제목 + 보조 수치 + 액션. 카드 바깥, 목록 위에 놓인다.
 *
 * **간격은 이 컴포넌트가 갖는다.** `Screen`의 기본 블록 리듬은 16px인데,
 * 헤더가 위아래 같은 간격으로 뜨면 어느 블록에 속한 제목인지 읽히지 않는다.
 * 그래서 위 20px / 아래 8px로 스스로 당겨 붙는다 — 화면에서 `mt-*`를 덧대지 않는다. (→ D-039)
 */
export function SectionHeader({
  title,
  description,
  meta,
  action,
  level = "section",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mt-1 -mb-2 flex flex-col gap-0.5 px-0.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <h2
          className={cn(
            "min-w-0 truncate",
            level === "section" ? "text-section" : "text-body-sm font-bold text-muted-foreground",
          )}
        >
          {title}
        </h2>
        {(meta || action) && (
          <div className="flex shrink-0 items-baseline gap-2.5">
            {meta && (
              <span className="num text-body-sm font-medium text-muted-foreground">{meta}</span>
            )}
            {action}
          </div>
        )}
      </div>
      {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
