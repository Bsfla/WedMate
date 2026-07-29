import { Receipt, Settings } from "lucide-react";

import { DualProgressBar } from "@/components/data/dual-progress-bar";
import { EmptyState } from "@/components/data/empty-state";
import { CategoryMark, ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { SectionHeader } from "@/components/data/section-header";
import { StatTile } from "@/components/data/stat-tile";
import { WarningBanner } from "@/components/data/warning-banner";
import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { StageBadge } from "@/components/money/stage-badge";
import { MAJORS, type MajorKey } from "@/lib/domain";
import { formatDday, formatPercent, formatWon } from "@/lib/format";
import { MOCK_TODAY, getMockHome, resolveFixtureKey } from "@/lib/mock/fixtures";

const fullDate = new Intl.DateTimeFormat("ko-KR", { dateStyle: "full", timeZone: "UTC" });

function majorColor(key: MajorKey): string {
  return MAJORS.find((major) => major.key === key)?.color ?? "var(--chart-5)";
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const home = getMockHome(resolveFixtureKey(params.fixture));
  const dday = formatDday(home.weddingDate, MOCK_TODAY);

  return (
    <Screen
      header={
        <AppHeader
          title={home.coupleName}
          subtitle={fullDate.format(new Date(`${home.weddingDate}T00:00:00Z`))}
          action={
            <HeaderIconLink href="/settings" label="설정">
              <Settings aria-hidden className="size-[21px]" strokeWidth={1.8} />
            </HeaderIconLink>
          }
        />
      }
    >
      {home.isEmpty ? (
        <Panel flush>
          <EmptyState
            icon={Receipt}
            title="아직 준비를 시작하지 않았어요"
            description="총 예산을 정하고 대분류에 배분하는 것부터 시작해보세요"
          />
        </Panel>
      ) : (
        <>
          {/* 총 예산 소진 — 확정을 크게, 예상을 보조로 둔다. */}
          <Panel className="gap-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-caption text-muted-foreground">결혼식까지</span>
              {dday && (
                <span className="inline-flex h-[22px] items-center rounded-md bg-primary px-2 text-caption font-bold text-primary-foreground">
                  {dday}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-caption text-muted-foreground">총 예산 대비 지출</span>
              <MoneyText value={home.confirmedSpent} size="display" />
              <p className="text-body-sm text-muted-foreground">
                전체 예산 {formatWon(home.totalBudget)} 중{" "}
                <b className="font-semibold text-foreground">
                  {formatPercent(home.confirmedSpent, home.totalBudget)}
                </b>{" "}
                집행
              </p>
            </div>

            <DualProgressBar
              confirmed={home.confirmedSpent}
              estimated={home.estimatedSpent}
              total={home.totalBudget}
              label="총 예산 소진율"
            />
          </Panel>

          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              label="남은 예산"
              value={home.remaining}
              valueClassName="text-success-strong"
              caption={`예상 반영 시 ${formatWon(home.remainingAfterEstimate)}`}
            />
            <StatTile
              label={`이번 달 (${home.thisMonthLabel})`}
              value={home.thisMonthConfirmed}
              caption={
                home.thisMonthEstimated > 0
                  ? `예상 +${formatWon(home.thisMonthEstimated)}`
                  : "예상 지출 없음"
              }
            />
          </div>

          {home.unpaidBalances.length > 0 && (
            <WarningBanner
              title={`잔금 미납 ${home.unpaidBalances.length}건`}
              description={`${home.unpaidBalances
                .map((expense) => `${expense.minor} ${formatWon(expense.amount)}`)
                .join(" · ")} — 날짜가 아직 미정입니다`}
            />
          )}

          <SectionHeader
            title="최근 지출"
            action={
              <a href="/expenses" className="text-body-sm font-semibold text-primary">
                전체 보기
              </a>
            }
          />
          <Panel flush>
            <ul>
              {home.recentExpenses.map((expense) => (
                <ListRow
                  key={expense.id}
                  estimated={expense.isEstimated}
                  leading={
                    <CategoryMark label={expense.mid.slice(0, 2)} color={majorColor(expense.major)} />
                  }
                  title={expense.vendor ? `${expense.minor} · ${expense.vendor}` : expense.minor}
                  meta={
                    <>
                      {expense.isEstimated && <EstimateBadge />}
                      <PayerChip payer={expense.payer} />
                      <StageBadge stage={expense.stage} />
                    </>
                  }
                  trailing={
                    <MoneyText value={expense.amount} size="md" muted={expense.isEstimated} />
                  }
                  trailingCaption={
                    expense.day === null
                      ? `${expense.month}월 중`
                      : `${String(expense.month).padStart(2, "0")}.${String(expense.day).padStart(2, "0")}`
                  }
                />
              ))}
            </ul>
          </Panel>

          {home.savingsGoals.length > 0 && (
            <>
              <SectionHeader title="저축 목표" />
              {home.savingsGoals.map((goal) => (
                <Panel key={goal.label}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-money-md">{goal.label}</span>
                    <span className="num text-money-sm text-muted-foreground">{goal.percent}%</span>
                  </div>
                  <ProgressBar
                    thin
                    value={goal.currentAmount}
                    total={goal.targetAmount}
                    color="var(--success)"
                    label={`${goal.label} 진행률`}
                  />
                  <div className="flex justify-between gap-2">
                    <span className="num text-body-sm text-muted-foreground">
                      {formatWon(goal.currentAmount)} / {formatWon(goal.targetAmount)}
                    </span>
                    <span className="num text-body-sm text-muted-foreground">
                      매달 {formatWon(goal.monthlyAmount)}
                    </span>
                  </div>
                </Panel>
              ))}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
