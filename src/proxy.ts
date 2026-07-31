import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

// Next 16에서 middleware 파일 규약이 proxy로 대체되었다.
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일과 이미지 최적화 요청은 세션 갱신이 필요 없다.
    //
    // ⚠️ `apple-icon` 등 **확장자 없는 메타데이터 라우트**를 반드시 함께 제외한다.
    // Next가 만드는 아이콘 라우트는 `/apple-icon` 처럼 확장자가 없어 아래 `\.(svg|png|…)$`
    // 절에 걸리지 않는다. 빠뜨리면 로그아웃 상태의 아이콘 요청이 전부 `/login`으로 307되고,
    // iOS가 홈 화면에 추가할 때 아이콘 대신 로그인 HTML을 받아 간다.
    "/((?!_next/static|_next/image|favicon\\.ico|manifest\\.webmanifest|apple-icon|icon|opengraph-image|twitter-image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
