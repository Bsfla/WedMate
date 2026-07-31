"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/data/error-state";

/**
 * 5탭 공통 에러 경계. 하단 탭은 `(app)/layout.tsx`에 있으므로 **그대로 남는다** —
 * 한 탭이 실패해도 다른 탭으로 빠져나갈 수 있어야 한다.
 *
 * 문구는 "오류가 발생했습니다"가 아니라 **무엇이 실패했고 무엇을 하면 되는지**를 쓴다.
 * 화면별로 더 구체적인 문구가 필요하면 그 라우트에 `error.tsx`를 따로 둔다.
 */
export default function AppError({
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
    <main className="flex flex-1 flex-col justify-center px-4 pt-4 pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]">
      <ErrorState
        description="잠시 후 다시 시도해 주세요. 계속 같은 화면이 나오면 아래 탭에서 다른 화면을 먼저 열어 보세요."
        detail={error.digest ? `오류 코드 ${error.digest}` : undefined}
        onRetry={reset}
        title="화면을 불러오지 못했어요"
      />
    </main>
  );
}
