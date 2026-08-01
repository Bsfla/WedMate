import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/(auth)/login/actions";
import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getSpaceContext } from "@/lib/supabase/space";

/**
 * 온보딩 셸. `(auth)`와 **같은 `AuthShell`**을 쓴다 — 로그인에서 넘어온 사람에게
 * 화면 폭·여백·웨시가 그대로 이어져야 "다음 단계"로 읽힌다.
 *
 * **푸터가 로그아웃인 이유**: 온보딩에는 하단 탭이 없다. 남의 계정으로 로그인한 채
 * 여기 도착한 사람에게는 이게 유일한 출구다. 없으면 스페이스를 만드는 것 말고 할 수 있는 일이 없다.
 *
 * 스페이스 유무로 리다이렉트하지 **않는다.** `/onboarding`은 스페이스가 있으면 홈으로 보내지만
 * `/onboarding/wedding`은 스페이스가 있어도 정당하게 들어온다(참여 직후 확인 화면).
 * 두 규칙이 다르므로 각 페이지가 스스로 판단한다.
 */
export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const context = await getSpaceContext();

  // proxy가 이미 막지만, matcher가 바뀌면 여기로 미인증 요청이 들어온다.
  if (context.status === "anonymous") redirect("/login");

  // `unavailable`은 사용자까지 못 읽었을 수 있다(Supabase 미연결이면 null).
  const email = context.status === "unavailable" ? (context.user?.email ?? null) : context.user.email;

  return (
    <AuthShell
      footer={
        <div className="flex flex-col gap-3 pt-8 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <Separator />
          <div className="flex items-center justify-between gap-3">
            {/* 이메일은 확인용 정보다. 이 화면의 주인공(스페이스 만들기)보다 작아야 한다. */}
            <p className="min-w-0 truncate text-caption text-muted-foreground">
              {email ?? "로그인한 계정"}
            </p>
            <form action={signOutAction}>
              <Button className="shrink-0" size="sm" type="submit" variant="ghost">
                로그아웃
              </Button>
            </form>
          </div>
        </div>
      }
    >
      {children}
    </AuthShell>
  );
}
