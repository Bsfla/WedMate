import { Skeleton } from "@/components/ui/skeleton";

/**
 * 온보딩 로딩 골격. **레이아웃 점프 0이 유일한 성공 조건이다**(D-043) —
 * 높이를 눈대중으로 잡지 않고 실제 컴포넌트에서 그대로 따왔다.
 *
 * | 조각 | 흉내 내는 것 | 높이 |
 * |---|---|---|
 * | 로크업 | `BrandLockup layout="inline"` | 36 (size-9 플레이트) |
 * | 단계 점 | `StepDots` | 6 |
 * | 제목 | `text-display` 2줄 | 37 × 2 (32px × 1.15) |
 * | 세그먼트 | `SegmentedControl` | 44 (38 + p-[3px]×2) |
 * | 필드 | `Field` 라벨 17 + gap 6 + `Input` 48 | 71 |
 * | CTA | `Button size="lg"` | 48 |
 *
 * 이 골격은 `/onboarding`(1단계) 모양이다. 2단계는 자기 `loading.tsx`가 없어 이걸 쓰지만,
 * 2단계로 넘어가는 주 경로는 `startTransition` 안의 `router.push`라 폴백이 뜨지 않는다
 * — 실제로 이게 보이는 순간은 **주소창으로 바로 들어온 첫 진입**이다.
 */
export default function OnboardingLoading() {
  return (
    <main aria-busy="true" className="flex flex-col gap-6 pt-10 pb-8">
      <span className="sr-only">불러오는 중</span>

      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-9 shrink-0 rounded-xl" />
          <Skeleton className="h-[26px] w-32 rounded" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-1.5 w-[26px] rounded-full" />
          {/* display 2줄. 줄 사이 간격을 주지 않는다 — line-height 안에 이미 들어 있다. */}
          <div className="flex flex-col">
            <div className="flex h-[37px] items-center">
              <Skeleton className="h-[26px] w-full rounded" />
            </div>
            <div className="flex h-[37px] items-center">
              <Skeleton className="h-[26px] w-2/5 rounded" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-[19px] w-4/5 rounded" />
        </div>

        <div className="flex flex-col gap-4">
          {[0, 1].map((index) => (
            <div className="flex flex-col gap-1.5" key={index}>
              <Skeleton className="h-[17px] w-16 rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </div>
    </main>
  );
}
