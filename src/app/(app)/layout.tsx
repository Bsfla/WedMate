import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";

/**
 * 모바일 셸. 375px 뷰포트를 기준으로 설계하고, 넓은 화면에서는 480px로 잡아 가운데 정렬한다.
 * 헤더와 본문 여백은 각 화면의 `<Screen>`이 담당한다.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-border sm:border-x">
      {children}
      <BottomNav />
    </div>
  );
}
