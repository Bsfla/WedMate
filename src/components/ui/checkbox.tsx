"use client"

import * as React from "react"
import { Checkbox as CheckboxPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"
import { CheckIcon } from "lucide-react"

/**
 * ⚠️ shadcn 업스트림 파일이다. `npx shadcn add checkbox`를 다시 돌리면 아래 규격이 덮어써진다.
 *
 * 바꾼 것 — 덮어써졌다면 다시 적용할 것:
 *   size-4(16px) → size-5(20px)
 *   after:-inset-x-3 after:-inset-y-2 → after:-inset-3
 *
 * 두 번째 줄이 핵심이다. 상자 자체는 20px이지만 `after` 의사요소가 히트 영역을
 * 사방 12px씩 넓혀 **20+24 = 44px 정사각**을 만든다. 원래 값(-inset-y-2)은
 * 세로가 32px밖에 안 나온다. 상자를 44px로 키우는 대신 이 방식을 쓰는 이유는
 * 체크박스가 리스트 행 안에서 텍스트와 나란히 서기 때문이다 — 시각적으로 20px,
 * 손가락에는 44px.
 */
function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer relative flex size-5 shrink-0 items-center justify-center rounded-[5px] border border-input transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-3 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-4"
      >
        <CheckIcon
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
