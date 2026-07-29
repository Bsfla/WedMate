import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./env";
import type { Database } from "./types";

/**
 * 매 요청마다 만료된 액세스 토큰을 갱신하고 갱신된 쿠키를 응답에 실어 보낸다.
 * 서버 컴포넌트는 쿠키를 쓸 수 없으므로 이 갱신은 반드시 proxy(구 middleware)에서 해야 한다.
 * 라우트 보호(미로그인 리디렉트)는 인증을 붙이는 P1에서 이 함수 안에 추가한다.
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
  await supabase.auth.getUser();

  return response;
}
