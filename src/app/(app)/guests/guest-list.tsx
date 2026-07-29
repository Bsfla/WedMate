"use client";

import { useState } from "react";

import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { SIDE_LABEL, type Side } from "@/lib/domain";
import type { GuestView } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

type SideFilter = Side | "all";

const SIDE_OPTIONS: { value: SideFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "groom", label: SIDE_LABEL.groom },
  { value: "bride", label: SIDE_LABEL.bride },
];

/**
 * 하객 명단. 세그먼트는 **명단만** 거른다 —
 * 위쪽 보증인원 게이지·축의금은 예식 전체 기준이라 필터와 무관하다.
 */
export function GuestList({ guests }: { guests: GuestView[] }) {
  const [side, setSide] = useState<SideFilter>("all");

  const visible = side === "all" ? guests : guests.filter((guest) => guest.side === side);
  const visibleHeadCount = visible
    .filter((guest) => guest.expectedAttend)
    .reduce((sum, guest) => sum + guest.headCount, 0);

  return (
    <>
      <SegmentedControl
        tone="rose"
        label="하객 구분"
        options={SIDE_OPTIONS}
        value={side}
        onChange={setSide}
      />

      <div className="flex items-center justify-between gap-2 px-0.5 pt-1">
        <h2 className="text-section">명단</h2>
        <span className="num text-body-sm text-muted-foreground">
          {visible.length}팀 · 참석 예상 {visibleHeadCount}명
        </span>
      </div>

      <Panel flush>
        <ul>
          {visible.map((guest) => (
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
                      : "bg-payer-bride-soft text-primary",
                  )}
                >
                  {SIDE_LABEL[guest.side].slice(1)}
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
    </>
  );
}
