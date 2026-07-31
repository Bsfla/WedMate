import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

// 접미사를 여기 붙이지 않는다. 루트 layout의 `template: "%s · WedMate"`가 붙여 준다 —
// 여기에 "로그인 · WedMate"라고 적으면 "로그인 · WedMate · WedMate"가 된다.
export const metadata: Metadata = {
  title: "로그인",
};

export default async function LoginPage() {
  // 이미 로그인한 사람이 /login을 열면 되돌려보낸다.
  // proxy는 '미인증 → /login'만 막으므로 반대 방향은 여기서 처리한다.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="flex flex-col gap-8 pt-12 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <BrandLockup tagline="둘이 함께 쓰는 결혼 준비 가계부" />
      <LoginForm />
    </main>
  );
}
