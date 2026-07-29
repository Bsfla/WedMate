import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * 화면 본문 래퍼. 하단 고정 탭(56px) + safe-area만큼 아래 여백을 확보한다.
 * 헤더는 화면마다 부제·액션이 달라 각 page가 직접 넘긴다.
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
          "flex flex-1 flex-col gap-3.5 px-4 pt-4",
          "pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]",
          className,
        )}
      >
        {children}
      </main>
    </>
  );
}
