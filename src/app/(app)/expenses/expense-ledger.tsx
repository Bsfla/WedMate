"use client";

import { Receipt } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/data/empty-state";
import { CategoryMark, ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { Fab } from "@/components/layout/fab";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { StageBadge } from "@/components/money/stage-badge";
import { MAJORS, METHOD_LABEL, PAYER_LABEL, PAYERS, type MajorKey, type Payer } from "@/lib/domain";
import { formatWon } from "@/lib/format";
import type { ExpenseMonthGroup } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

import { QuickAddSheet } from "./quick-add-sheet";

type PayerFilter = Payer | "all";
type StatusFilter = "all" | "confirmed" | "estimated";

const PAYER_FILTERS: { value: PayerFilter; label: string }[] = [
  { value: "all", label: "전체" },
  ...PAYERS.map((value) => ({ value: value as PayerFilter, label: PAYER_LABEL[value] })),
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "confirmed", label: "확정" },
  { value: "estimated", label: "예상" },
];

function majorColor(key: MajorKey): string {
  return MAJORS.find((major) => major.key === key)?.color ?? "var(--chart-5)";
}

function FilterChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        // 높이 36px + 바깥 8px 간격으로 44px 터치 영역을 확보한다.
        "inline-flex h-9 shrink-0 items-center rounded-[10px] border px-3 text-body-sm font-medium transition-colors",
        "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

/**
 * 지출 원장. 월 단위로 묶고 결제자·확정여부로 거른다.
 * 필터는 넘겨받은 목록 위에서만 동작한다 — 서버 쿼리 필터는 P3에서 붙인다.
 */
export function ExpenseLedger({ groups }: { groups: ExpenseMonthGroup[] }) {
  const [payerFilter, setPayerFilter] = useState<PayerFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = groups
    .map((group) => ({
      ...group,
      expenses: group.expenses.filter((expense) => {
        if (payerFilter !== "all" && expense.payer !== payerFilter) return false;
        if (statusFilter === "confirmed" && expense.isEstimated) return false;
        if (statusFilter === "estimated" && !expense.isEstimated) return false;
        return true;
      }),
    }))
    .filter((group) => group.expenses.length > 0)
    // 필터 후 남은 건들로 월 합계를 다시 잡는다.
    .map((group) => ({
      ...group,
      confirmed: group.expenses
        .filter((expense) => !expense.isEstimated)
        .reduce((sum, expense) => sum + expense.amount, 0),
      estimated: group.expenses
        .filter((expense) => expense.isEstimated)
        .reduce((sum, expense) => sum + expense.amount, 0),
    }));

  // 기록 자체가 없을 때는 필터 바를 내보내지 않는다 — 거를 대상이 없는 컨트롤이라 소음이다.
  const hasAnyExpense = groups.length > 0;

  return (
    <>
      {hasAnyExpense && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 py-0.5">
          {PAYER_FILTERS.map((filter) => (
            <FilterChip
              key={filter.value}
              selected={payerFilter === filter.value}
              onClick={() => setPayerFilter(filter.value)}
            >
              {filter.value === "all" ? "결제자 전체" : filter.label}
            </FilterChip>
          ))}
          <span aria-hidden className="my-1 w-px shrink-0 bg-border" />
          {STATUS_FILTERS.map((filter) => (
            <FilterChip
              key={filter.value}
              selected={statusFilter === filter.value}
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </FilterChip>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <Panel flush>
          <EmptyState
            icon={Receipt}
            title={hasAnyExpense ? "조건에 맞는 지출이 없어요" : "아직 기록한 지출이 없어요"}
            description={
              hasAnyExpense
                ? "필터를 바꾸거나 오른쪽 아래 + 버튼으로 지출을 남겨보세요"
                : "오른쪽 아래 + 버튼으로 첫 지출을 남겨보세요"
            }
          />
        </Panel>
      ) : (
        filtered.map((group) => (
          <section key={`${group.year}-${group.month}`} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-2 px-0.5 pt-1.5">
              <h2 className="text-body-sm font-bold text-muted-foreground">{group.label}</h2>
              <span className="num text-body-sm font-semibold text-muted-foreground">
                {formatWon(group.confirmed + group.estimated)}
              </span>
            </div>

            <Panel flush>
              <ul>
                {group.expenses.map((expense) => (
                  <ListRow
                    key={expense.id}
                    estimated={expense.isEstimated}
                    leading={
                      <CategoryMark
                        label={expense.mid.slice(0, 2)}
                        color={majorColor(expense.major)}
                      />
                    }
                    title={expense.minor}
                    meta={
                      <>
                        {expense.isEstimated && <EstimateBadge />}
                        {expense.vendor && (
                          <span className="text-body-sm text-muted-foreground">{expense.vendor}</span>
                        )}
                        <PayerChip payer={expense.payer} />
                        <StageBadge stage={expense.stage} />
                      </>
                    }
                    trailing={
                      <MoneyText value={expense.amount} size="md" muted={expense.isEstimated} />
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
        ))
      )}

      <Fab label="지출 추가" onClick={() => setSheetOpen(true)} />
      <QuickAddSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
