import {
  ChipRowSkeleton,
  ListSkeleton,
  ScreenSkeleton,
  SectionHeaderSkeleton,
} from "@/components/data/skeletons";

/**
 * 지출 원장 전용 로딩 골격. 공통 `(app)/loading.tsx`는 히어로 패널 + 스탯 2칸이라
 * 이 화면과 모양이 다르다 — 그대로 두면 데이터가 도착할 때 화면 전체가 한 번 튄다.
 *
 * 조각의 높이는 실제 컴포넌트에서 따온 것이라(`skeletons.tsx`) 여기서는 **순서와 개수**만 정한다.
 * 월 그룹을 두 덩이 그리는 이유는 812px 뷰포트가 한 덩이로는 채워지지 않아서다.
 */
export default function ExpensesLoading() {
  return (
    <ScreenSkeleton>
      <ChipRowSkeleton count={5} />
      <SectionHeaderSkeleton />
      <ListSkeleton rows={6} />
      <SectionHeaderSkeleton />
      <ListSkeleton rows={3} />
    </ScreenSkeleton>
  );
}
