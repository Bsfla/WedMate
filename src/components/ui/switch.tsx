"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * ⚠️ shadcn 업스트림 파일이다. `npx shadcn add switch`를 다시 돌리면 아래 규격이 덮어써진다.
 *
 * 바꾼 것 — 덮어써졌다면 다시 적용할 것:
 *   default  h-[18.4px] w-[32px] / thumb size-4 → h-6 w-10 / thumb size-5
 *   sm       h-[14px] w-[24px]   / thumb size-3 → h-5 w-8  / thumb size-4
 *   히트 영역 after:-inset-y-2 → after:-inset-y-2.5 (24+20 = 44px)
 *
 * **트랙 너비는 thumb의 정확히 2배여야 한다.** thumb 이동량이
 * `translate-x-[calc(100%-2px)]` = (thumb − 2px)로 하드코딩돼 있어서,
 * 트랙 = 2 × thumb 일 때만 오른쪽 끝에 정확히 닿는다
 * (내부 폭 = 트랙 − 2px 테두리 = 2·thumb − 2, 이동량 = 내부 폭 − thumb = thumb − 2).
 * 너비를 바꾸려면 이 관계를 같이 지킬 것.
 */
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2.5 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-full bg-background ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-[calc(100%-2px)] group-data-[size=sm]/switch:data-checked:translate-x-[calc(100%-2px)] dark:data-checked:bg-primary-foreground group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
