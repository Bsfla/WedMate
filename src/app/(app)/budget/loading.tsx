import { Panel } from "@/components/data/panel";
import {
  HeroPanelSkeleton,
  ScreenSkeleton,
  SectionHeaderSkeleton,
} from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 예산 탭 로딩 골격. 그룹 기본값(`(app)/loading.tsx` → 스탯 2칸 + 리스트)은
 * 이 화면에 없는 블록이라, 데이터가 오는 순간 통째로 갈아끼워지며 화면이 튀었다.
 *
 * 접힌 `MajorCard` 한 장의 실측 높이를 그대로 따온다:
 * 테두리 2 + 패딩 32 + 헤더 26 + 10 + 막대 7 + 10 + 금액 두 줄 46 = 133px.
 */
function MajorCardSkeleton() {
  return (
    <Panel flush>
      <div className="flex flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2 py-0.5">
          <Skeleton className="h-[22px] w-24 rounded" />
          <Skeleton className="h-[22px] w-16 rounded" />
        </div>
        <Skeleton className="h-[7px] w-full rounded-full" />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-10 rounded" />
            <Skeleton className="h-5 w-24 rounded" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-5 w-20 rounded" />
            <Skeleton className="h-5 w-28 rounded" />
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function BudgetLoading() {
  return (
    <ScreenSkeleton header={{ subtitle: false, action: "button" }}>
      <HeroPanelSkeleton />
      <SectionHeaderSkeleton />
      {Array.from({ length: 4 }, (_, index) => (
        <MajorCardSkeleton key={index} />
      ))}
    </ScreenSkeleton>
  );
}
