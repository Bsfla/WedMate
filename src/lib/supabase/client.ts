import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./env";
import type { Database } from "./types";

/** 브라우저(클라이언트 컴포넌트)용 Supabase 클라이언트. Realtime 구독은 이쪽을 쓴다. */
export function createClient() {
  assertSupabaseConfigured();
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
