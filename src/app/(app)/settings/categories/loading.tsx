import { Panel } from "@/components/data/panel";
import { ScreenSkeleton, SectionHeaderSkeleton } from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 카테고리 관리의 로딩 골격.
 *
 * `ListSkeleton`을 쓰지 않는다 — 그쪽 우측 자리표시자는 20px 금액 바 하나라, 44px 화살표
 * 두 개가 도착하는 순간 행의 오른쪽이 통째로 어긋난다. 높이는 전부 실물에서 따왔다:
 * 중분류 헤더 48 · 소분류 행 56 · 추가 행 48 · 화살표 44.
 *
 * 🔴 **보관 토글 줄을 그리지 않는다.** 보관이 0개면 그 패널이 아예 없는데(시드 직후의 기본
 * 상태다) 골격에 넣으면 가장 흔한 경우에 76px가 통째로 사라지는 점프가 난다.
 * 항상 있는 안내 한 줄만 자리를 잡는다.
 *
 * 헤더에 `back`을 켜는 것을 빠뜨리지 않는다 — 빼면 제목이 44px 오른쪽으로 튄다.
 */
export default function CategoriesLoading() {
  return (
    <ScreenSkeleton header={{ back: true, subtitle: false, action: false }}>
      <Skeleton className="h-[19px] w-4/5 rounded" />

      {/* 첫 화면에 보이는 만큼만 그린다 — 대분류 2장. */}
      {[0, 1].map((panel) => (
        <div className="flex flex-col gap-4" key={panel}>
          <SectionHeaderSkeleton />
          <Panel flush>
            <div className="flex min-h-12 items-center border-b border-border/60 bg-muted px-4">
              <Skeleton className="h-[15px] w-14 rounded" />
            </div>

            {[0, 1, 2].map((row) => (
              <div
                className="flex min-h-14 items-center gap-2 border-b border-border/60 py-2.5 pr-4 pl-8"
                key={row}
              >
                <Skeleton className="h-[17px] w-2/5 rounded" />
                <span className="flex-1" />
                <Skeleton className="size-11 shrink-0 rounded-xl" />
                <Skeleton className="size-11 shrink-0 rounded-xl" />
              </div>
            ))}

            <div className="flex min-h-12 items-center pr-4 pl-8">
              <Skeleton className="h-[17px] w-24 rounded" />
            </div>
          </Panel>
        </div>
      ))}
    </ScreenSkeleton>
  );
}
