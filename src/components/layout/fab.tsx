import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * 우하단 플로팅 버튼. 하단 탭(56px) + safe-area 위 16px에 뜬다.
 * 56px이라 44px 터치 타깃 규칙을 넉넉히 넘긴다.
 */
export function Fab({
  label,
  className,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "fixed right-4 z-40 grid size-14 place-items-center rounded-[18px] bg-primary text-primary-foreground",
        "shadow-[0_6px_20px_-4px_color-mix(in_srgb,var(--primary)_50%,transparent)]",
        "transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        "bottom-[calc(3.5rem+1rem+env(safe-area-inset-bottom))]",
        className,
      )}
      {...props}
    >
      <Plus aria-hidden className="size-6.5" strokeWidth={2.4} />
    </button>
  );
}
