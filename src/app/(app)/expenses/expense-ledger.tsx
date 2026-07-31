"use client";

import { Receipt } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { CategoryMark, ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { Chip, ChipDivider, ChipRow } from "@/components/layout/chip";
import { Fab } from "@/components/layout/fab";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { StageBadge } from "@/components/money/stage-badge";
import { Button } from "@/components/ui/button";
import {
  majorColor,
  METHOD_LABEL,
  PAYER_LABEL,
  PAYER_TOKEN,
  PAYERS,
  type Payer,
} from "@/lib/domain";
import { formatWon } from "@/lib/format";
import type { ExpenseMonthGroup } from "@/lib/mock/fixtures";

import { QuickAddSheet } from "./quick-add-sheet";

type PayerFilter = Payer | "all";
type StatusFilter = "all" | "confirmed" | "estimated";

const PAYER_FILTERS: { value: PayerFilter; label: string }[] = [
  { value: "all", label: "결제자 전체" },
  ...PAYERS.map((value) => ({ value: value as PayerFilter, label: PAYER_LABEL[value] })),
];

/**
 * 두 번째 축의 "전체"를 그냥 `전체`라고 쓰면 구분선 하나 건너에 있는 `결제자 전체`와
 * 무엇이 다른지 읽히지 않는다. 무엇을 포함하는지를 라벨에 적는다.
 */
const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "확정·예상" },
  { value: "confirmed", label: "확정만" },
  { value: "estimated", label: "예상만" },
];

/**
 * 한 번에 펼치는 월 그룹 수. 200건이 쌓이면 월 그룹이 10개를 넘어가는데,
 * 원장은 위에서 아래로 시간순이라 최신 달을 보려면 그만큼을 지나쳐야 한다.
 * 오래된 달은 접어 두고 필요할 때만 3개월씩 더 연다.
 */
const MONTHS_PER_STEP = 3;

/**
 * 지출 원장. 월 단위로 묶고 결제자·확정여부로 거른다.
 * 필터는 넘겨받은 목록 위에서만 동작한다 — 서버 쿼리 필터는 P3에서 붙인다.
 */
export function ExpenseLedger({ groups }: { groups: ExpenseMonthGroup[] }) {
  const [payerFilter, setPayerFilter] = useState<PayerFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [visibleMonths, setVisibleMonths] = useState(MONTHS_PER_STEP);

  const filtered = useMemo(
    () =>
      groups
        .map((group) => {
          const expenses = group.expenses.filter((expense) => {
            if (payerFilter !== "all" && expense.payer !== payerFilter) return false;
            if (statusFilter === "confirmed" && expense.isEstimated) return false;
            if (statusFilter === "estimated" && !expense.isEstimated) return false;
            return true;
          });

          // 필터 후 남은 건들로 월 합계를 다시 잡는다. `total`까지 다시 세지 않으면
          // 스프레드로 넘어온 원본 합계가 헤더에 그대로 남는다.
          const confirmed = expenses
            .filter((expense) => !expense.isEstimated)
            .reduce((sum, expense) => sum + expense.amount, 0);
          const estimated = expenses
            .filter((expense) => expense.isEstimated)
            .reduce((sum, expense) => sum + expense.amount, 0);

          return { ...group, expenses, confirmed, estimated, total: confirmed + estimated };
        })
        .filter((group) => group.expenses.length > 0),
    [groups, payerFilter, statusFilter],
  );

  // 기록 자체가 없을 때는 필터 바를 내보내지 않는다 — 거를 대상이 없는 컨트롤이라 소음이다.
  const hasAnyExpense = groups.length > 0;
  const isFiltered = payerFilter !== "all" || statusFilter !== "all";
  const totalCount = groups.reduce((count, group) => count + group.expenses.length, 0);
  const visibleCount = filtered.reduce((count, group) => count + group.expenses.length, 0);

  // fixtures가 오래된 달을 앞에 둔다. 접히는 쪽은 배열 앞(과거)이라 「더 보기」도 목록 위에 온다.
  const hiddenMonths = Math.max(0, filtered.length - visibleMonths);
  const shown = hiddenMonths > 0 ? filtered.slice(hiddenMonths) : filtered;

  const clearFilters = () => {
    setPayerFilter("all");
    setStatusFilter("all");
  };

  return (
    <>
      {hasAnyExpense && (
        <ChipRow label="지출 필터">
          {PAYER_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              leading={
                filter.value === "all" ? undefined : (
                  <i
                    aria-hidden
                    className="size-[7px] shrink-0 rounded-[2px]"
                    style={{ backgroundColor: PAYER_TOKEN[filter.value as Payer].dot }}
                  />
                )
              }
              onClick={() => setPayerFilter(filter.value)}
              selected={payerFilter === filter.value}
            >
              {filter.label}
            </Chip>
          ))}
          <ChipDivider />
          {STATUS_FILTERS.map((filter) => (
            <Chip
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              selected={statusFilter === filter.value}
            >
              {filter.label}
            </Chip>
          ))}
        </ChipRow>
      )}

      {/* 칩을 눌러 목록이 줄어든 사실은 시각적으로는 아래 요약 줄이 말해 주지만,
          스크린리더에는 아무 변화도 전달되지 않는다. `sr-only`는 position:absolute라
          flex 아이템이 아니어서 `Screen`의 16px 리듬에 빈칸을 만들지 않는다. */}
      {hasAnyExpense && (
        <p aria-live="polite" className="sr-only">
          {isFiltered ? `전체 ${totalCount}건 중 ${visibleCount}건 표시` : ""}
        </p>
      )}

      {/* 필터가 걸린 채로 화면을 떠났다 돌아오면 "왜 이것밖에 없지"가 된다.
          지금 몇 건이 감춰져 있는지와 되돌리는 방법을 목록 바로 위에 둔다. */}
      {isFiltered && visibleCount > 0 && (
        <div className="flex items-center justify-between gap-3 px-0.5">
          <p className="text-body-sm text-muted-foreground">
            전체 <span className="num font-semibold text-foreground">{totalCount}건</span> 중{" "}
            <span className="num font-semibold text-foreground">{visibleCount}건</span> 표시
          </p>
          {/* 가로 광학 정렬 보정 — 고스트 버튼의 좌우 패딩만큼 카드 모서리로 당긴다. */}
          <Button className="-mr-2 shrink-0" onClick={clearFilters} size="sm" variant="ghost">
            필터 지우기
          </Button>
        </div>
      )}

      {filtered.length === 0 ? (
        isFiltered ? (
          <EmptyState
            action={
              <Button onClick={clearFilters} size="sm" variant="outline">
                필터 지우기
              </Button>
            }
            bordered
            description={`기록한 ${totalCount}건 가운데 이 조건에 맞는 지출이 없어요. 필터를 지우면 전부 다시 보입니다.`}
            icon={Receipt}
            title="조건에 맞는 지출이 없어요"
          />
        ) : (
          <EmptyState
            action={
              <Button onClick={() => setSheetOpen(true)} size="sm">
                첫 지출 기록하기
              </Button>
            }
            bordered
            description="계약금부터 남겨 보세요. 금액과 분류만 있으면 기록됩니다."
            icon={Receipt}
            title="아직 기록한 지출이 없어요"
          />
        )
      ) : (
        <>
          {hiddenMonths > 0 && (
            <Button
              className="w-full"
              onClick={() => setVisibleMonths((months) => months + MONTHS_PER_STEP)}
              variant="outline"
            >
              이전 기록 더 보기 · <span className="num">{hiddenMonths}개월</span>
            </Button>
          )}

          {shown.map((group) => (
            <section className="flex flex-col gap-4" key={`${group.year}-${group.month}`}>
              <SectionHeader level="sub" meta={formatWon(group.total)} title={group.label} />

              <Panel flush>
                <ul>
                  {group.expenses.map((expense) => (
                    <ListRow
                      estimated={expense.isEstimated}
                      key={expense.id}
                      leading={
                        <CategoryMark
                          color={majorColor(expense.major)}
                          label={expense.mid.slice(0, 2)}
                        />
                      }
                      meta={
                        <>
                          {expense.isEstimated && <EstimateBadge />}
                          {expense.vendor && (
                            // 업체명이 길면 배지 줄이 3줄까지 늘어나 행 높이가 들쭉날쭉해진다.
                            <span className="max-w-[11ch] truncate text-body-sm text-muted-foreground">
                              {expense.vendor}
                            </span>
                          )}
                          <PayerChip payer={expense.payer} />
                          <StageBadge stage={expense.stage} />
                        </>
                      }
                      title={expense.minor}
                      trailing={
                        <MoneyText muted={expense.isEstimated} size="md" value={expense.amount} />
                      }
                      trailingCaption={
                        expense.day === null
                          ? "날짜 미정"
                          : `${String(expense.month).padStart(2, "0")}.${String(expense.day).padStart(2, "0")} · ${METHOD_LABEL[expense.method]}`
                      }
                    />
                  ))}
                </ul>
              </Panel>
            </section>
          ))}
        </>
      )}

      <Fab label="지출 추가" onClick={() => setSheetOpen(true)} />
      <QuickAddSheet onOpenChange={setSheetOpen} open={sheetOpen} />
    </>
  );
}
