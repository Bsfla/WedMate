/**
 * Supabase 프로젝트를 아직 만들지 않아도 앱이 기동되도록, 환경변수 존재 여부를
 * 한 곳에서 판별한다. P1에서 실제 프로젝트를 연결하면 isSupabaseConfigured가 true가 된다.
 */

// NEXT_PUBLIC_* 는 빌드 시 정적으로 치환되므로 반드시 이렇게 통째로 참조해야 한다.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase 환경변수가 없습니다. .env.local.example 을 .env.local 로 복사한 뒤 " +
        "NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_ANON_KEY 를 채워주세요.",
    );
  }
}
