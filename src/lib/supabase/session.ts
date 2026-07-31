import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";
import type { Database } from "./types";

/**
 * 로그인 없이 열리는 경로. 그 외는 전부 `/login`으로 보낸다.
 *
 * `/design`이 공개인 것은 의도적이다 — 앱과 같은 컴포넌트를 렌더하는 살아 있는 스타일가이드라
 * 로그인을 끼우면 참조로서의 쓸모가 줄어든다. 커플 데이터를 하나도 읽지 않는 화면이라 안전하다.
 */
const PUBLIC_PATHS = ["/login", "/auth", "/design"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

/**
 * 매 요청마다 만료된 액세스 토큰을 갱신하고 갱신된 쿠키를 응답에 실어 보낸다.
 * 서버 컴포넌트는 쿠키를 쓸 수 없으므로 이 갱신은 반드시 proxy(구 middleware)에서 해야 한다.
 *
 * **여기서는 인증 여부만 본다.** 커플 스페이스 유무로 `/onboarding`에 보내는 판정은
 * `(app)/layout.tsx`가 한다 — 이 함수는 모든 요청에서 도는데 스페이스 조회는 DB 왕복이라
 * 요청마다 붙이면 비싸다. 레이아웃은 어차피 커플 데이터를 읽으므로 거기서는 공짜다. (→ D-034)
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // 아직 Supabase 프로젝트를 연결하지 않은 P0 단계에서는 그냥 통과시킨다.
  if (!isSupabaseConfigured) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser()를 호출해야 토큰 갱신이 실제로 일어난다. 이 줄을 지우면 세션이 조용히 만료된다.
  // getSession()으로 대체하면 안 된다 — 쿠키를 그대로 믿을 뿐 JWT 서명을 검증하지 않는다.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublic(request.nextUrl.pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }

  return response;
}
