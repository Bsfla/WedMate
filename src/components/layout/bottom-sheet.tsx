"use client";

import { Dialog } from "radix-ui";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** 제목 오른쪽 슬롯 (취소 버튼, 상태 배지 등) */
  titleAction?: ReactNode;
  /** 스크린리더용 설명. 화면에는 보이지 않는다. */
  description?: string;
  children: ReactNode;
  /** 시트 하단에 고정되는 영역 (저장 버튼). 본문만 스크롤된다. */
  footer?: ReactNode;
  className?: string;
};

/**
 * 하단 슬라이드업 시트.
 *
 * shadcn `drawer`를 쓰지 않는다 — 현재 shadcn drawer는 Base UI 기반이라
 * `-b radix`로 init한 이 프로젝트에 두 번째 프리미티브 라이브러리를 끌고 들어온다.
 * 이미 설치된 radix-ui의 Dialog 위에 직접 만들어 44px·safe-area·최대높이를 통제한다.
 *
 * 드래그 핸들은 현재 **시각 표식만**이다. 제스처로 내리는 동작은 P3에서 붙인다.
 * (바깥 탭 · ESC · 취소 버튼으로는 닫힌다.)
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  titleAction,
  description,
  children,
  footer,
  className,
}: BottomSheetProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-foreground/40",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "motion-reduce:animate-none",
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[85dvh] w-full max-w-[480px] flex-col",
            "rounded-t-[20px] border-t border-border bg-card outline-none",
            "shadow-[0_-8px_40px_-8px_rgba(0,0,0,0.28)]",
            "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom",
            "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom",
            "motion-reduce:animate-none",
            className,
          )}
        >
          <div className="shrink-0 px-4 pt-2">
            <div aria-hidden className="mx-auto mt-1 mb-1.5 h-1 w-10 rounded-full bg-border" />
            <div className="flex items-center justify-between gap-3 py-1">
              <Dialog.Title className="text-money-md tracking-tight">{title}</Dialog.Title>
              {titleAction}
            </div>
            {description ? (
              <Dialog.Description className="sr-only">{description}</Dialog.Description>
            ) : (
              // Radix가 aria-describedby 누락 경고를 내지 않도록 명시적으로 끊는다.
              <Dialog.Description className="hidden" />
            )}
          </div>

          <div className="flex flex-col gap-3.5 overflow-y-auto px-4 pt-2 pb-4">{children}</div>

          {footer && (
            <div className="shrink-0 border-t border-border px-4 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const BottomSheetClose = Dialog.Close;
