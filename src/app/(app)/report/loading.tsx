import { Panel } from "@/components/data/panel";
import { HeaderSkeleton, SectionHeaderSkeleton } from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 결산 로딩 골격.
 *
 * 이 화면은 공통 `ScreenSkeleton`으로 덮을 수 없다 — 히어로(정산 결론)·2칸 부담 타일·
 * 진행률 목록·Recharts 차트가 전부 높이가 다르고, **차트는 클라이언트에서
 * 한 번 더 그려지는 유일한 블록**이라 자리를 비워두면 도착 순간 화면이 크게 튄다.
 *
 * 높이는 전부 실물에서 따왔다:
 * 히어로 = caption 17 + 칩 22 + display 37 + 보조 19,
 * 소분류 행 = 제목 20 + 바 7 + DataRow 3줄,
 * 차트 = `MonthlyTimeline`의 `h-[168px]` 그대로.
 */
export default function ReportLoading() {
  return (
    <>
      <HeaderSkeleton />
      <main
        aria-busy="true"
        className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]"
      >
        <span className="sr-only">결산을 계산하는 중</span>

        {/* 히어로 — 정산 결론 */}
        <Panel className="gap-2.5">
          <Skeleton className="h-[17px] w-24 rounded" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-[22px] w-32 rounded-md" />
            <Skeleton className="h-[37px] w-44 rounded-lg" />
          </div>
          <Skeleton className="h-[19px] w-56 rounded" />
        </Panel>

        {/* 둘이 얼마씩 냈나 */}
        <SectionHeaderSkeleton />
        <Panel>
          <div className="grid grid-cols-2 gap-2.5">
            <Skeleton className="h-[86px] rounded-xl" />
            <Skeleton className="h-[86px] rounded-xl" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="flex flex-col gap-1.5 border-t border-border/70 pt-2.5">
            <Skeleton className="h-[20px] w-full rounded" />
            <Skeleton className="h-[20px] w-full rounded" />
          </div>
        </Panel>

        {/* 대분류별 소진율 — 4개 고정 */}
        <SectionHeaderSkeleton />
        <Panel className="gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="flex flex-col gap-2" key={index}>
              <div className="flex items-center justify-between gap-2.5">
                <Skeleton className="h-[19px] w-20 rounded" />
                <Skeleton className="h-[17px] w-32 rounded" />
              </div>
              <Skeleton className="h-[7px] w-full rounded-full" />
            </div>
          ))}
        </Panel>

        {/* 소분류 진행 상황 */}
        <SectionHeaderSkeleton />
        <Panel flush>
          <ul>
            {Array.from({ length: 3 }, (_, index) => (
              <li
                className="flex flex-col gap-2.5 border-b border-border/60 px-4 py-3.5 last:border-b-0"
                key={index}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <Skeleton className="h-[20px] w-28 rounded" />
                  <Skeleton className="h-[18px] w-10 rounded" />
                </div>
                <Skeleton className="h-[7px] w-full rounded-full" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-[20px] w-full rounded" />
                  <Skeleton className="h-[20px] w-full rounded" />
                  <Skeleton className="h-[20px] w-full rounded" />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 월별 지출 흐름 — 차트 자리를 실제 높이 그대로 비워둔다 */}
        <SectionHeaderSkeleton />
        <Panel>
          <Skeleton className="h-[168px] w-full rounded-lg" />
          <div className="flex gap-4">
            <Skeleton className="h-[17px] w-16 rounded" />
            <Skeleton className="h-[17px] w-24 rounded" />
          </div>
        </Panel>
      </main>
    </>
  );
}
