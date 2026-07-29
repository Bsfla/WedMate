/**
 * P1에서 스키마를 만든 뒤 아래 명령의 출력으로 이 파일을 통째로 교체한다.
 *   npx supabase gen types typescript --project-id <project-ref> > src/lib/supabase/types.ts
 * 그전까지는 클라이언트가 제네릭을 요구하므로 빈 스키마 형태만 유지한다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
