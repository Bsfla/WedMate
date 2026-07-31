import { Panel } from "@/components/data/panel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * 로딩 골격. **레이아웃이 점프하지 않는 것이 유일한 성공 조건이다** —
 * 자리표시자의 높이가 실제 콘텐츠와 다르면 데이터가 도착하는 순간 화면이 튀어
 * 스켈레톤을 안 쓰느니만 못하다. 그래서 높이를 전부 실제 컴포넌트에서 따왔다.
 *
 * | 조각 | 흉내 내는 것 | 고정 높이 |
 * |---|---|---|
 * | `HeaderSkeleton` | `AppHeader` | 52px + 패딩 |
 * | `HeroPanelSkeleton` | 홈·예산의 대표 금액 패널 | display 32px + 진행률 |
 * | `StatGridSkeleton` | `StatTile` 2칸 | |
 * | `ListSkeleton` | `ListRow` n행 | 행당 56px |
 * | `SectionHeaderSkeleton` | `SectionHeader` | |
 *
 * 텍스트가 아니므로 스크린리더에는 노출하지 않는다 — 바깥 컨테이너가
 * `aria-busy`와 `sr-only` 문구 하나를 갖는다(`ScreenSkeleton`).
 */

export function HeaderSkeleton({
  subtitle = true,
  action = "icon",
}: {
  subtitle?: boolean;
  /** 헤더 우측이 아이콘 버튼인지(size-11), 텍스트 버튼인지(h-9), 비었는지. */
  action?: "icon" | "button" | false;
}) {
  return (
    <div className="sticky top-0 z-30 flex min-h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 pt-1.5 pb-3">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-[18px] w-28 rounded" />
        {subtitle && <Skeleton className="h-[13px] w-40 rounded" />}
      </div>
      {action === "icon" && <Skeleton className="size-11 shrink-0 rounded-xl" />}
      {action === "button" && <Skeleton className="h-9 w-[76px] shrink-0 rounded-[10px]" />}
    </div>
  );
}

export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("mt-1 -mb-2 px-0.5", className)}>
      <Skeleton className="h-[22px] w-24 rounded" />
    </div>
  );
}

/**
 * 홈·예산 상단의 대표 금액 패널. 라벨 → 32px 금액 → 보조문구 → 진행률 바.
 *
 * `rows`는 진행률 바 아래 구분선 + `DataRow` n줄을 더한다. 홈 히어로가 남은 예산을
 * 패널 안으로 끌어들이면서 실제 높이가 ~60px 길어졌다 — 맞추지 않으면 그만큼 점프한다.
 */
export function HeroPanelSkeleton({ rows = 0 }: { rows?: number }) {
  return (
    <Panel className="gap-3.5">
      <Skeleton className="h-[17px] w-20 rounded" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-[37px] w-48 rounded-lg" />
        <Skeleton className="h-[19px] w-56 rounded" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      {rows > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-current/12 pt-2.5">
          {Array.from({ length: rows }, (_, index) => (
            <div className="flex items-center justify-between gap-3" key={index}>
              <Skeleton className="h-[19px] w-24 rounded" />
              <Skeleton className="h-[19px] w-28 rounded" />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/** `StatTile` 2칸 그리드. */
export function StatGridSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {Array.from({ length: count }, (_, index) => (
        <Panel className="gap-1.5 p-3.5" key={index}>
          <Skeleton className="h-[17px] w-16 rounded" />
          <Skeleton className="h-[29px] w-full rounded" />
          <Skeleton className="h-[19px] w-20 rounded" />
        </Panel>
      ))}
    </div>
  );
}

/** `ListRow` n행. 행 높이 56px을 그대로 맞춘다. */
export function ListSkeleton({
  rows = 4,
  leading = true,
  trailing = true,
}: {
  rows?: number;
  leading?: boolean;
  /** 우측 금액 자리. 설정 메뉴처럼 오른쪽이 비어 있는 목록은 끈다. */
  trailing?: boolean;
}) {
  return (
    <Panel flush>
      <ul>
        {Array.from({ length: rows }, (_, index) => (
          <li
            className="flex min-h-14 items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
            key={index}
          >
            {leading && <Skeleton className="size-9 shrink-0 rounded-[10px]" />}
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton className="h-[17px] w-2/5 rounded" />
              <Skeleton className="h-[15px] w-3/5 rounded" />
            </div>
            {trailing && <Skeleton className="h-[20px] w-20 shrink-0 rounded" />}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** 필터 칩 줄. */
export function ChipRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-hidden px-4 py-0.5">
      {Array.from({ length: count }, (_, index) => (
        <Skeleton className="h-9 w-20 shrink-0 rounded-[10px]" key={index} />
      ))}
    </div>
  );
}

/**
 * 탭 전환의 기본 골격. 라우트별 `loading.tsx`가 자기 화면에 맞는 조합을
 * 따로 쓰기 전까지 `(app)/loading.tsx`가 이걸 쓴다.
 */
export function ScreenSkeleton({
  children,
  header,
}: {
  children?: React.ReactNode;
  /** 그 화면 `AppHeader`의 실제 모양. 부제·우측 액션이 다르면 로드 직후 헤더가 튄다. */
  header?: Parameters<typeof HeaderSkeleton>[0];
}) {
  return (
    <>
      <HeaderSkeleton {...header} />
      <main
        aria-busy="true"
        className="flex flex-1 flex-col gap-4 px-4 pt-4 pb-[calc(3.5rem+1.5rem+env(safe-area-inset-bottom))]"
      >
        <span className="sr-only">불러오는 중</span>
        {children ?? (
          <>
            <HeroPanelSkeleton />
            <StatGridSkeleton />
            <SectionHeaderSkeleton />
            <ListSkeleton rows={4} />
          </>
        )}
      </main>
    </>
  );
}
