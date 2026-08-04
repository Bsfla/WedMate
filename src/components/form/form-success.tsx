import { CircleCheck } from "lucide-react";
import type { ReactNode, Ref } from "react";

import { cn } from "@/lib/utils";

/**
 * 폼 제출이 **성공했다**는 확인. `FormAlert`(실패)의 짝이다.
 *
 * 🔴 **제출 버튼 아래에 둔다.** 저장 버튼은 키보드에 가려지지 않으려고 흐름 안 맨 아래에
 * 있으므로(fixed CTA를 안 쓰는 이유), 제출 직후 사람의 눈은 화면 바닥에 있다. 상단 배너는
 * 스크롤 밖이라 아무도 못 보고, 버튼 **위**에 뜨면 확인 블록이 버튼을 밀어내려 다음 탭이
 * 빗나간다. 아래에 두면 위쪽이 하나도 안 움직이고 새 블록이 손가락 바로 밑에 나타난다.
 *
 * 🔴 **포커스를 여기로 옮긴다.** 이 저장소는 `aria-live`를 쓰지 않고 포커스 이동으로
 * 낭독시키는 규약이라(→ D-037), 성공만 예외로 두면 스크린리더 사용자에게는 아무 일도
 * 일어나지 않는다. `tabIndex={-1}`은 프로그램적 포커스만 받고 탭 순서에는 안 들어간다.
 *
 * `WarningBanner tone="info"`를 쓰지 않는 이유는 색이다 — info 톤은 로즈(`--primary`)인데
 * 그 값이 `--destructive`와 같은 hex라, 성공 확인이 한눈에 실패로 읽힌다.
 * `role`도 `alert`(assertive)가 아니라 `status`(polite)여야 맞다.
 *
 * 문구 규칙: **"즉시"·"바로"를 쓰지 않는다.** `revalidatePath`는 이 사용자의 캐시만
 * 무효화하므로 상대 화면은 "다시 열었을 때" 새 값을 받는다.
 */
export function FormSuccess({
  title,
  children,
  className,
  ref,
}: {
  title: ReactNode;
  /** 무엇이 어디에 반영됐는지. 한 문장이면 충분하다. */
  children?: ReactNode;
  className?: string;
  /** 저장 성공 시 포커스를 옮기기 위한 참조. React 19라 forwardRef가 필요 없다. */
  ref?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-[14px] border border-success/35 bg-success-soft p-4",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
      )}
      ref={ref}
      role="status"
      tabIndex={-1}
    >
      <CircleCheck aria-hidden className="mt-0.5 size-5 shrink-0 text-success" strokeWidth={1.8} />
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* 제목은 `--foreground`다. `--success`는 흰 배경 AA 미달이라 텍스트로 쓰지 않는다(D-007) —
            초록은 아이콘과 테두리·면이 지고, 글자는 본문 색 그대로 둔다. */}
        <p className="text-body font-semibold">{title}</p>
        {children && <p className="text-body-sm text-muted-foreground">{children}</p>}
      </div>
    </div>
  );
}
