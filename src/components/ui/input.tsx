import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * ⚠️ shadcn 업스트림 파일이다. `npx shadcn add input`을 다시 돌리면 아래 규격이 덮어써진다.
 * radix-nova 프리셋은 데스크톱 밀도라 폼 필드 규격(design-system.md 6-b)을 지킬 수 없어 손봤다.
 *
 * 바꾼 것 — 덮어써졌다면 다시 적용할 것:
 *   h-8(32px)      → h-12(48px)      44px 터치 타깃 + 여유
 *   px-2.5 py-1    → px-3.5 py-2     높아진 만큼 좌우도 넓힌다
 *   file:h-6       → file:h-8
 *   md:text-sm     → 삭제            16px 미만이면 iOS가 포커스 시 자동 확대한다.
 *                                    확대 봉인은 접근성 위반이라 폰트로 푼다
 *
 * 에러 상태는 손대지 않았다 — `--destructive`(#e11d48)가 `--primary`와 같은 값이라
 * `aria-invalid:border-destructive`가 규격의 "테두리 border-primary"와 이미 일치한다.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-lg border border-input bg-transparent px-3.5 py-2 text-base transition-colors outline-none file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
