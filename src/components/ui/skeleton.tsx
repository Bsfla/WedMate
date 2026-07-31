import { cn } from "@/lib/utils"

/**
 * ⚠️ shadcn 업스트림 파일이다. `npx shadcn add skeleton`을 다시 돌리면 덮어써진다.
 *
 * | 항목 | shadcn 기본값 | 이 저장소 | 이유 |
 * |---|---|---|---|
 * | 모션 | `animate-pulse` | `animate-pulse motion-reduce:animate-none` | 로딩 스켈레톤은 화면 전체가 동시에 깜빡인다. 전정기관 민감 사용자에게 가장 부담이 큰 모션이라 OS 설정을 따른다 |
 *
 * 크기는 호출부가 정하므로 밀도 문제는 없다.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)}
      {...props}
    />
  )
}

export { Skeleton }
