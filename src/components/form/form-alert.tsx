import { CircleAlert } from "lucide-react";
import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

/**
 * 폼 **전체**에 걸리는 에러. 특정 입력에 귀속되지 않는 것만 여기로 온다
 * (자격 증명 오류, 이미 가입된 이메일, rate limit 등).
 * 입력에 귀속되는 에러는 `Field`의 `error`로 내려가 해당 필드 밑에 뜬다.
 *
 * 시각 사양은 `data/warning-banner.tsx`의 `tone="info"`를 그대로 복제했다 —
 * 새 색을 팔레트에 들이지 않으려는 것이다. `--warning`은 대비 미달이라 텍스트로 못 쓴다(D-007).
 *
 * `WarningBanner`를 재사용하지 않는 이유: `role`·`ref`·`tabIndex`를 받지 않고,
 * 아이콘이 `Info`(안내)라 의미가 어긋난다. 여기는 조치가 필요한 실패다.
 */
export function FormAlert({
  children,
  className,
  ref,
}: {
  children: ReactNode;
  className?: string;
  /** 제출 실패 시 포커스를 옮기기 위한 참조. React 19라 forwardRef가 필요 없다. */
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary-soft p-3.5",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
      ref={ref}
      role="alert"
      // 포커스를 프로그램적으로 옮기기 위한 것. 탭 순서에는 들어가지 않는다.
      tabIndex={-1}
    >
      <CircleAlert aria-hidden className="mt-px size-[18px] shrink-0 text-primary" strokeWidth={1.9} />
      <p className="text-body-sm font-medium text-primary">{children}</p>
    </div>
  );
}
