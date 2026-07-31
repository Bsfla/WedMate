import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 화면 본문 래퍼. 하단 고정 탭(56px) + safe-area만큼 아래 여백을 확보한다.
 * 헤더는 화면마다 부제·액션이 달라 각 page가 직접 넘긴다.
 *
 * **블록 리듬 16px** — 본문 직계 자식 사이 간격은 여기 한 곳에서만 정한다.
 * 화면이 `mt-*`/`pt-*`로 간격을 덧대기 시작하면 탭마다 리듬이 어긋난다.
 * 섹션 헤더만 예외로 자기 아래 요소에 8px로 붙는다(`SectionHeader`가 스스로 처리). (→ D-039)
 */
export function Screen({
  header,
  children,
  className,
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <>
      {header}
      <main
        className={cn(
          "flex flex-1 flex-col gap-4 px-4 pt-4",
          "pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}
