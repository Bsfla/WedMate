import { Panel } from "@/components/data/panel";
import {
  HeroPanelSkeleton,
  ListSkeleton,
  ScreenSkeleton,
  SectionHeaderSkeleton,
} from "@/components/data/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * 그룹 기본 로딩 골격. 라우트 폴더에 자기 `loading.tsx`가 있으면 그쪽이 이긴다 —
 * 지금은 예산·지출·하객·결산·설정이 전부 자기 것을 갖고 있어 **실질적으로 홈의 골격**이다.
 * 그래서 홈의 블록 순서(히어로 + 내역 2줄 → 전폭 통계 → 최근 지출)를 그대로 흉내 낸다.
 *
 * P2~P5에서 목업이 Supabase 쿼리로 바뀌면 이 파일이 실제로 보이기 시작한다.
 * 지금은 목업이 동기라 거의 스치지만, 없으면 그때 가서 화면마다 다시 만들게 된다.
 */
export default function AppLoading() {
  return (
    <ScreenSkeleton>
      {/* 히어로: 남은 예산 / 예상까지 반영하면 두 줄이 구분선 아래에 붙는다 */}
      <HeroPanelSkeleton rows={2} />

      {/* 이번 달 확정 지출 — 2칸 그리드가 아니라 전폭 한 장이다 */}
      <Panel className="gap-1.5">
        <Skeleton className="h-[17px] w-32 rounded" />
        <Skeleton className="h-[29px] w-44 rounded" />
        <Skeleton className="h-[19px] w-36 rounded" />
      </Panel>

      <SectionHeaderSkeleton />
      <ListSkeleton rows={5} />
    </ScreenSkeleton>
  );
}
