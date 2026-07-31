import { Panel } from "@/components/data/panel";
import { ListSkeleton, ScreenSkeleton, SectionHeaderSkeleton } from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 설정 화면의 로딩 골격. 이 화면은 6개 중 유일하게 실제 Supabase를 읽어서
 * (스페이스 · 멤버 · 계정) 공통 `ScreenSkeleton`이 실제로 눈에 보인다.
 *
 * 공통 골격의 히어로 + 통계 2칸 조합은 이 화면에 없는 모양이라 그대로 쓰면
 * 데이터가 도착할 때 화면이 통째로 튄다 — 스페이스 패널 · 관리 5행 · 계정 2행으로 바꿔 끼운다.
 */
export default function SettingsLoading() {
  return (
    <ScreenSkeleton header={{ subtitle: false, action: false }}>
      <SectionHeaderSkeleton />

      {/* 스페이스 패널: 이름 + 예식일 + D-day 칩 / 구분선 아래 예랑 · 예신 2행 */}
      <Panel>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-[19px] w-28 rounded" />
            <Skeleton className="h-[17px] w-44 rounded" />
          </div>
          <Skeleton className="h-[26px] w-14 shrink-0 rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5 border-t border-border/70 pt-2.5">
          {[0, 1].map((index) => (
            <div className="flex items-baseline justify-between gap-3" key={index}>
              <Skeleton className="h-[17px] w-10 rounded" />
              <Skeleton className="h-[20px] w-24 rounded" />
            </div>
          ))}
        </div>
      </Panel>

      <SectionHeaderSkeleton />
      <ListSkeleton rows={5} trailing={false} />

      <SectionHeaderSkeleton />
      <ListSkeleton leading={false} rows={2} trailing={false} />
    </ScreenSkeleton>
  );
}
