"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/data/error-state";
import { Button } from "@/components/ui/button";

/**
 * 루트 에러 경계 — **세그먼트 레이아웃이 던진 오류를 받는 곳.**
 *
 * `error.tsx`는 자기 세그먼트의 `layout.tsx`가 던진 오류를 잡지 못한다(경계가 그 레이아웃
 * 안쪽에 있기 때문). 그런데 `(app)/layout.tsx`와 `onboarding/layout.tsx`는 둘 다
 * `getSpaceContext()`를 await한다 — Supabase가 흔들리면 그 위 경계까지 올라온다.
 * 이 파일이 없으면 그때 Next 기본 에러 페이지가 그대로 사용자에게 나간다.
 *
 * 하단 탭도 온보딩 셸도 없는 자리라 **탈출구를 직접 준다** — 재시도 + 로그인 화면.
 * (로그아웃 Server Action은 쓰지 않는다. 이 경계는 세션 조회 자체가 실패했을 수도 있다.)
 */
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col justify-center px-6 py-10">
      <ErrorState
        description="네트워크가 끊겼거나 서버가 잠시 응답하지 못했어요. 다시 시도해도 같으면 로그인 화면에서 처음부터 열어 주세요."
        detail={error.digest ? `오류 코드 ${error.digest}` : undefined}
        onRetry={reset}
        secondaryAction={
          <Button asChild size="sm" variant="secondary">
            {/* next/link가 아니라 <a>다 — 라우터 자체가 깨진 상태일 수 있어 전체 리로드가 안전하다. */}
            <a href="/login">로그인 화면으로</a>
          </Button>
        }
        title="앱을 여는 중 문제가 생겼어요"
      />
    </main>
  );
}
