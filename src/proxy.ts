import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/session";

// Next 16에서 middleware 파일 규약이 proxy로 대체되었다.
export default async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // 정적 파일과 이미지 최적화 요청은 세션 갱신이 필요 없다.
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
