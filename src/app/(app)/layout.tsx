import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";
import { getSpaceContext } from "@/lib/supabase/space";

/**
 * 모바일 셸. 375px 뷰포트를 기준으로 설계하고, 넓은 화면에서는 480px로 잡아 가운데 정렬한다.
 * 헤더와 본문 여백은 각 화면의 `<Screen>`이 담당한다.
 *
 * **스페이스 가드도 여기 있다** (→ D-034). 인증 여부는 `proxy.ts`가 보고, 커플 스페이스
 * 유무는 이 레이아웃이 본다. proxy는 모든 요청에서 도는데 스페이스 조회는 DB 왕복이라
 * 요청마다 붙이면 비싸고, 이 레이아웃 아래 화면들은 어차피 커플 데이터를 읽는다.
 *
 * 조회는 `getSpaceContext()`가 `cache()`로 감싸고 있어 자식 페이지가 다시 불러도 왕복은 1회다.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const context = await getSpaceContext();

  // 스페이스가 "없다"고 확인된 경우에만 온보딩으로 보낸다.
  // `unavailable`(조회 실패 · Supabase 미연결)은 보내지 않는다 — DB가 잠깐 흔들릴 때
  // 멀쩡한 스페이스를 가진 사람이 온보딩에 갇히고, 거기서 되돌아올 길이 없다.
  if (context.status === "none") redirect("/onboarding");

  // proxy가 이미 막지만, matcher가 바뀌어 이 레이아웃이 미인증 요청을 받으면
  // 아래 화면들이 빈 목업을 "내 데이터"처럼 보여주게 된다. 방어적으로 한 번 더 막는다.
  if (context.status === "anonymous") redirect("/login");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col border-border sm:border-x">
      {children}
      <BottomNav />
    </div>
  );
}
