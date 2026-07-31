"use client";

import { UserRoundX } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, SIDE_SHORT, type Side } from "@/lib/domain";
import type { GuestView } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

type SideFilter = Side | "all";

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "groom", label: SIDE_LABEL.groom },
  { value: "bride", label: SIDE_LABEL.bride },
];

/**
 * 한 번에 그리는 팀 수. 하객은 200팀까지 갈 수 있는데 전량 렌더하면
 * 세로가 11,000px을 넘어 아래 블록이 사실상 도달 불가가 된다.
 * 스크롤 위치를 잃지 않도록 무한스크롤이 아니라 명시적인 "더 보기"로 늘린다.
 */
const PAGE_SIZE = 50;

/**
 * 하객 명단. 세그먼트는 **명단만** 거른다 —
 * 위쪽 보증인원 게이지·축의금은 예식 전체 기준이라 필터와 무관하다.
 */
export function GuestList({ guests }: { guests: GuestView[] }) {
  const [side, setSide] = useState<SideFilter>("all");
  const [limit, setLimit] = useState(PAGE_SIZE);

  function changeSide(next: SideFilter) {
    setSide(next);
    // 필터를 바꾸면 목록이 통째로 달라진다. 이전 필터에서 눌러 둔 "더 보기"를
    // 이어받으면 3팀짜리 결과에 500팀치 limit이 걸려 있는 셈이라 의미가 없다.
    setLimit(PAGE_SIZE);
  }

  const visible = side === "all" ? guests : guests.filter((guest) => guest.side === side);
  const visibleHeadCount = visible
    .filter((guest) => guest.expectedAttend)
    .reduce((sum, guest) => sum + guest.headCount, 0);

  const shown = visible.slice(0, limit);
  const remaining = visible.length - shown.length;

  return (
    <>
      <SegmentedControl
        tone="rose"
        label="하객 구분"
        options={SIDE_OPTIONS}
        value={side}
        onChange={changeSide}
      />

      <SectionHeader
        title="명단"
        meta={
          visible.length === 0
            ? undefined
            : `${visible.length}팀 · 참석 예상 ${visibleHeadCount}명`
        }
      />

      {visible.length === 0 ? (
        <EmptyState
          bordered
          icon={UserRoundX}
          title={side === "all" ? "명단이 비어 있어요" : `${SIDE_LABEL[side]} 측 명단이 없어요`}
          description="이 구분으로 등록된 팀이 아직 없습니다"
          action={
            <Button onClick={() => changeSide("all")} size="sm" variant="outline">
              전체 보기
            </Button>
          }
        />
      ) : (
        <Panel flush>
          <ul>
            {shown.map((guest) => (
              <ListRow
                key={guest.id}
                className={cn(!guest.expectedAttend && "opacity-60")}
                leading={
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-9 shrink-0 place-items-center rounded-[10px] text-caption font-bold",
                      guest.side === "groom"
                        ? "bg-payer-groom-soft text-payer-groom-strong"
                        : "bg-payer-bride-soft text-payer-bride-strong",
                    )}
                  >
                    {SIDE_SHORT[guest.side]}
                  </span>
                }
                title={guest.name}
                meta={
                  <>
                    <span
                      className={cn(
                        "inline-flex h-[22px] shrink-0 items-center rounded-md px-2 text-caption font-semibold",
                        guest.signalCount > 0
                          ? "bg-success-soft text-success-strong"
                          : "bg-payer-joint-soft text-muted-foreground",
                      )}
                    >
                      신호 {guest.signalCount}/3
                    </span>
                    <span className="num text-body-sm text-muted-foreground">
                      본인 + 동행 {guest.companionCount}
                    </span>
                  </>
                }
                trailing={
                  <span className="num text-money-md">
                    {guest.expectedAttend ? `${guest.headCount}명` : "—"}
                  </span>
                }
                trailingCaption={
                  <span className={guest.expectedAttend ? "text-success-strong" : undefined}>
                    {guest.expectedAttend ? "참석 예상" : "불참 예상"}
                  </span>
                }
              />
            ))}
          </ul>
        </Panel>
      )}

      {remaining > 0 && (
        <Button
          className="w-full"
          onClick={() => setLimit((current) => current + PAGE_SIZE)}
          variant="outline"
        >
          {Math.min(PAGE_SIZE, remaining)}팀 더 보기
          <span className="num font-normal text-muted-foreground">(남은 {remaining}팀)</span>
        </Button>
      )}
    </>
  );
}
