"use client";

import { useEffect } from "react";

import { signOutAction } from "@/app/(auth)/login/actions";
import { ErrorState } from "@/components/data/error-state";
import { Button } from "@/components/ui/button";

/**
 * 온보딩 에러 경계.
 *
 * `(app)/error.tsx`는 **하단 탭이 살아남는다**는 전제로 "다른 화면을 먼저 열어 보세요"라고 말한다.
 * 여기엔 탭이 없다 — 스페이스가 없으니 갈 곳도 없다. 그래서 다시 시도 옆에 **로그아웃**을 둔다.
 * (레이아웃 푸터에도 로그아웃이 있지만 화면 맨 아래라, 실패 화면에서 곧바로 보이는 출구가 하나 더 필요하다.)
 *
 * ⚠️ 이 경계는 `layout.tsx`가 던진 오류는 잡지 못한다(같은 세그먼트의 레이아웃은 경계 바깥이다).
 * 그 경우를 덮으려면 `src/app/error.tsx`가 필요하다 — 이 작업 범위 밖이라 조율자에게 남긴다.
 */
export default function OnboardingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 서버 로그에는 이미 남는다. 브라우저 콘솔에도 남겨 두 쪽을 digest로 잇는다.
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col justify-center pt-10 pb-8">
      <ErrorState
        description="잠시 후 다시 시도해 주세요. 계속 같은 화면이 나오면 로그아웃한 뒤 다시 로그인해 주세요."
        detail={error.digest ? `오류 코드 ${error.digest}` : undefined}
        onRetry={reset}
        secondaryAction={
          <form action={signOutAction}>
            <Button size="sm" type="submit" variant="ghost">
              로그아웃
            </Button>
          </form>
        }
        title="스페이스 화면을 불러오지 못했어요"
      />
    </main>
  );
}
