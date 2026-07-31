"use client"

import * as React from "react"
import { Label as LabelPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

/**
 * ⚠️ shadcn 업스트림 파일이다. `npx shadcn add label`을 다시 돌리면 아래 규격이 덮어써진다.
 *
 * 바꾼 것 — 덮어써졌다면 다시 적용할 것:
 *   text-sm(14px) → text-body(15px)   앱의 본문 스케일에 맞춘다
 *   min-h-11 추가                      체크박스·스위치 옆 라벨이 곧 터치 타깃이다.
 *                                      라벨이 짧아도 행 높이가 44px 밑으로 안 내려간다
 *
 * **폼 필드 라벨(6-b의 `text-caption text-muted-foreground`)은 여기가 아니다.**
 * 그 규격은 `components/form/field.tsx`가 className으로 얹는다 —
 * 이 프리미티브는 체크박스·스위치 옆 라벨로도 쓰이므로 중립으로 둔다.
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex min-h-11 items-center gap-2 text-body leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Label }
