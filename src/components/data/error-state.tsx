"use client";

import { RotateCcw, TriangleAlert, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  /** 무엇이 안 됐는지. "오류가 발생했습니다"가 아니라 실패한 일을 쓴다. */
  title: string;
  /** **어떻게 고치는지.** 사용자가 할 수 있는 행동이 반드시 한 문장 들어간다. */
  description: ReactNode;
  /** 다시 시도. `error.tsx`의 `reset`을 그대로 넘긴다. */
  onRetry?: () => void;
  retryLabel?: string;
  /** 재시도 말고 다른 길 (설정으로 가기, 다시 로그인 등). */
  secondaryAction?: ReactNode;
  /** 개발자용 식별자. 화면 맨 아래 아주 작게 붙는다. */
  detail?: string;
  tone?: "error" | "offline";
  className?: string;
};

/**
 * 화면 단위 실패. 부분 실패(패널 하나만 못 불러옴)는 이걸 쓰지 않는다 —
 * 나머지가 살아 있어야 하므로 그 자리에만 작은 안내를 둔다(`InlineError`).
 *
 * 문구 규칙은 폼 에러와 같다: **무엇이 잘못됐고 어떻게 고치는지.**
 * "올바르지 않습니다" 류는 쓰지 않는다. (design-system.md 6-b)
 */
export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "다시 시도",
  secondaryAction,
  detail,
  tone = "error",
  className,
}: ErrorStateProps) {
  const Icon = tone === "offline" ? WifiOff : TriangleAlert;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2.5 rounded-[14px] border border-warning/30 bg-warning-soft px-5 py-10 text-center",
        className,
      )}
      role="alert"
    >
      <span className="grid size-13 place-items-center rounded-2xl bg-card text-warning">
        <Icon aria-hidden className="size-6" strokeWidth={1.8} />
      </span>
      <p className="text-body font-semibold text-warning-strong">{title}</p>
      <p className="max-w-[28ch] text-body-sm text-balance text-muted-foreground">{description}</p>

      {(onRetry || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1.5">
          {onRetry && (
            <Button onClick={onRetry} size="sm" type="button" variant="secondary">
              <RotateCcw aria-hidden className="size-4" strokeWidth={2} />
              {retryLabel}
            </Button>
          )}
          {secondaryAction}
        </div>
      )}

      {detail && <p className="num pt-1 text-caption text-muted-foreground/70">{detail}</p>}
    </div>
  );
}

/**
 * 부분 실패. 패널 하나가 못 불러와졌을 때 **그 자리에만** 놓는다 —
 * 나머지 화면은 계속 쓸 수 있어야 한다.
 */
export function InlineError({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border border-dashed border-warning/40 bg-warning-soft px-3.5 py-3",
        className,
      )}
      role="alert"
    >
      <span className="flex min-w-0 items-start gap-2">
        <TriangleAlert aria-hidden className="mt-px size-4 shrink-0 text-warning" strokeWidth={1.9} />
        <span className="text-body-sm text-warning-strong">{message}</span>
      </span>
      {onRetry && (
        <button
          className="min-h-11 shrink-0 px-1 text-body-sm font-semibold text-warning-strong underline underline-offset-2 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          onClick={onRetry}
          type="button"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}
