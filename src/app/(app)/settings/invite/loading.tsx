import { Panel } from "@/components/data/panel";
import { ScreenSkeleton, SectionHeaderSkeleton } from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 초대 화면의 로딩 골격.
 *
 * 부모(`settings/loading.tsx`)를 그대로 물려받으면 **설정 홈의 모양**(스페이스 카드 + 메뉴 5행)이
 * 잠깐 떴다가 통째로 갈린다. 높이는 전부 실제 컴포넌트에서 따왔다 —
 * 코드 블록 58px · 복사/공유 48px · 재발급 44px.
 *
 * 헤더에 `back`을 켜는 것이 핵심이다. 빼면 데이터가 도착할 때 제목이 44px 오른쪽으로 튄다.
 */
export default function InviteLoading() {
  return (
    <ScreenSkeleton header={{ back: true, subtitle: false, action: false }}>
      <Panel>
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-[17px] w-16 rounded" />
          <Skeleton className="h-[26px] w-16 rounded-lg" />
        </div>
        <Skeleton className="h-[58px] w-full rounded-xl" />
        <Skeleton className="h-[19px] w-52 rounded" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-[19px] w-full rounded" />
          <Skeleton className="h-[19px] w-3/5 rounded" />
        </div>
      </Panel>

      <Skeleton className="h-11 w-full rounded-lg" />

      <SectionHeaderSkeleton />
      <Panel>
        {[0, 1].map((index) => (
          <div className="flex items-baseline justify-between gap-3" key={index}>
            <Skeleton className="h-[17px] w-10 rounded" />
            <Skeleton className="h-[20px] w-24 rounded" />
          </div>
        ))}
      </Panel>
    </ScreenSkeleton>
  );
}
