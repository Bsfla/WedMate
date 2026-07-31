import { Panel } from "@/components/data/panel";
import {
  HeaderSkeleton,
  ListSkeleton,
  SectionHeaderSkeleton,
} from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 하객 탭 전용 골격. 공통 `ScreenSkeleton`은 「대표 금액 → 2칸 타일 → 목록」이라
 * 이 화면(게이지 패널 → 손익 패널 → 세그먼트 → 목록)과 블록 순서가 어긋난다.
 * 순서가 다르면 데이터 도착 시 화면이 통째로 재배치되어 스켈레톤이 오히려 해가 된다.
 *
 * 높이는 실제 컴포넌트에서 그대로 따왔다:
 * 게이지 34px · display 금액 37px · `SegmentedControl` 44px · `ListRow` 56px.
 */
export default function GuestsLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main
        aria-busy="true"
        className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]"
      >
        <span className="sr-only">불러오는 중</span>

        {/* 참석 인원 게이지 패널 */}
        <Panel>
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2">
              <Skeleton className="h-[17px] w-24 rounded" />
              <Skeleton className="h-[23px] w-14 rounded" />
            </div>
            <Skeleton className="h-[34px] w-full rounded-[10px]" />
          </div>
        </Panel>

        {/* 최종 손익 */}
        <SectionHeaderSkeleton />
        <Panel>
          <Skeleton className="h-[17px] w-36 rounded" />
          <Skeleton className="h-[37px] w-44 rounded-lg" />
          <div className="flex flex-col gap-2.5 border-t border-border/70 pt-2.5">
            <Skeleton className="h-[21px] w-full rounded" />
            <Skeleton className="h-[21px] w-full rounded" />
          </div>
        </Panel>

        {/* 측 세그먼트 + 명단 */}
        <Skeleton className="h-11 w-full rounded-xl" />
        <SectionHeaderSkeleton />
        <ListSkeleton rows={6} />
      </main>
    </>
  );
}
