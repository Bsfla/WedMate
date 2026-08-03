import { Receipt, Settings, Wallet } from "lucide-react";
import Link from "next/link";

import { DataRow, DataRowGroup } from "@/components/data/data-row";
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
import { Button } from "@/components/ui/button";
import { majorColor } from "@/lib/domain";
import { formatPercent, formatWon } from "@/lib/format";
import { getMockHome, resolveFixtureKey } from "@/lib/mock/fixtures";

/**
 * 헤더 부제의 예식일. `dateStyle: "full"`은 "2026년 11월 14일 토요일"이라 길기만 하고,
 * 라벨이 없어 "오늘"인지 "예식일"인지 읽히지 않았다 — 접두어를 붙이고 요일을 괄호로 줄인다.
 */
const weddingDateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" });

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const home = await getMockHome(resolveFixtureKey(params.fixture));
  const { dday } = home;
  const weddingDay = new Date(`${home.weddingDate}T00:00:00Z`);
  const overBudget = home.remainingAfterEstimate < 0;

  // 총 예산을 안 정하고 들어온 사람(온보딩에서 선택 입력). 분모가 없으므로 소진율·남은 예산은
  // 계산 자체가 성립하지 않는다 — 0%짜리 막대와 음수 잔액을 그리면 그건 정보가 아니라 거짓말이다.
  const budgetUnset = !home.hasTotalBudget;

  // 잔금이 여러 건이면 전부 이어붙인 문장이 배너를 세 줄 넘게 밀어낸다 — 두 건까지만 이름을 쓴다.
  const unpaidPreview =
    home.unpaidBalances
      .slice(0, 2)
      .map((expense) => `${expense.minor} ${formatWon(expense.amount)}`)
      .join(" · ") + (home.unpaidBalances.length > 2 ? ` 외 ${home.unpaidBalances.length - 2}건` : "");

  return (
    <Screen
      header={
        <AppHeader
          title={home.coupleName}
          subtitle={`예식 ${weddingDateFormat.format(weddingDay)} (${weekdayFormat.format(weddingDay)})`}
          action={
            <HeaderIconLink href="/settings" label="설정">
              <Settings aria-hidden className="size-[21px]" strokeWidth={1.8} />
            </HeaderIconLink>
          }
        />
      }
    >
      {home.isEmpty ? (
        <EmptyState
          bordered
          icon={Wallet}
          title="아직 준비를 시작하지 않았어요"
          description="총 예산을 정하고 대분류에 배분하면, 여기에 남은 예산이 나타납니다"
          action={
            <Button asChild size="sm">
              <Link href="/budget">예산 세우기</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/*
            히어로 하나가 "얼마 썼고 얼마 남았나"를 끝까지 답한다.
            남은 예산은 총 예산 소진과 같은 문장이라 별도 카드로 떼면 두 번 읽어야 했다 —
            같은 패널 안, 구분선 아래 내역으로 붙인다.
          */}
          <Panel className="gap-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-caption text-muted-foreground">지금까지 쓴 돈</span>
              {dday && (
                <span
                  aria-label={`결혼식까지 ${dday}`}
                  className="inline-flex h-[22px] items-center rounded-md bg-primary px-2 text-caption font-bold text-primary-foreground"
                >
                  {dday}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <MoneyText value={home.confirmedSpent} size="display" />
              <p className="text-body-sm text-muted-foreground">
                {budgetUnset ? (
                  "총 예산을 아직 정하지 않아 소진율을 계산할 수 없어요"
                ) : (
                  <>
                    전체 예산 {formatWon(home.totalBudget)} 중{" "}
                    <b className="font-semibold text-foreground">
                      {formatPercent(home.confirmedSpent, home.totalBudget)}
                    </b>{" "}
                    집행
                  </>
                )}
              </p>
            </div>

            {/*
              분모가 없을 때는 막대와 잔액 두 줄을 통째로 뺀다.
              `ratio()`가 0으로 떨어져 NaN은 안 나지만, 0%짜리 막대는 "아직 안 썼다"로 읽히고
              `0 − 확정지출`은 예산 초과 경고로 읽힌다 — 둘 다 사실이 아니다.
              대신 화면에서 유일하게 참인 수치(예상 지출)만 남긴다.
            */}
            {budgetUnset ? (
              home.estimatedSpent > 0 && (
                <DataRowGroup divided>
                  <DataRow
                    hint="결제일이 아직 안 잡힌 건"
                    label="예상 지출"
                    tone="muted"
                    value={home.estimatedSpent}
                  />
                </DataRowGroup>
              )
            ) : (
              <>
                <DualProgressBar
                  confirmed={home.confirmedSpent}
                  estimated={home.estimatedSpent}
                  total={home.totalBudget}
                  label="총 예산 소진율"
                />

                <DataRowGroup divided>
                  <DataRow
                    label="남은 예산"
                    tone={home.remaining < 0 ? "warning" : "success"}
                    value={home.remaining}
                  />
                  <DataRow
                    hint={overBudget ? "예산 초과 예상" : undefined}
                    label="예상까지 반영하면"
                    tone={overBudget ? "warning" : "muted"}
                    value={home.remainingAfterEstimate}
                  />
                </DataRowGroup>
              </>
            )}
          </Panel>

          {/*
            미설정은 잘못이 아니라 미완이라 `info` 톤이다(앰버는 조치가 급한 것에만 쓴다).
            빈 상태와 마찬가지로 다음 행동이 있어야 끝난다 — 지금 실제로 이동 가능한 곳은
            설정 화면이다. `/settings/wedding`이 붙으면 이 href를 거기로 바꾼다. (→ D-042)
          */}
          {budgetUnset && (
            <WarningBanner
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/settings">설정 열기</Link>
                </Button>
              }
              description="설정에서 총 예산을 정하면 소진율과 남은 예산이 이 자리에 계산됩니다"
              title="총 예산을 아직 정하지 않았어요"
              tone="info"
            />
          )}

          {/* 조치가 필요한 경고는 히어로 바로 다음이다 — 목록 아래에 두면 스크롤해야 보인다. */}
          {home.unpaidBalances.length > 0 && (
            <WarningBanner
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/expenses">잔금 보기</Link>
                </Button>
              }
              description={`${unpaidPreview} — 결제일을 넣으면 확정 지출로 반영됩니다`}
              title={`결제일이 비어 있는 잔금 ${home.unpaidBalances.length}건`}
            />
          )}

          <StatTile
            /* 금액 뒤에 조사를 붙이지 않는다 — 끝자리에 따라 이/가가 갈려 문장이 틀린다. */
            caption={
              home.thisMonthEstimated > 0
                ? `예상 지출 ${formatWon(home.thisMonthEstimated)} 별도`
                : "예상 지출 없음"
            }
            label={`이번 달 (${home.thisMonthLabel}) 확정 지출`}
            value={home.thisMonthConfirmed}
          />

          <SectionHeader
            action={
              <Link
                className="relative text-body-sm font-semibold text-primary after:absolute after:-inset-3 after:content-['']"
                href="/expenses"
              >
                전체 보기
              </Link>
            }
            title="최근 지출"
          />
          {home.recentExpenses.length === 0 ? (
            /* 예산만 세우고 지출은 아직 없는 상태. 빈 `Panel`은 높이 0의 테두리만 남는다. */
            <EmptyState
              bordered
              action={
                <Button asChild size="sm" variant="outline">
                  <Link href="/expenses">지출 기록하기</Link>
                </Button>
              }
              description="계약금·잔금을 기록하면 남은 예산이 바로 반영됩니다"
              icon={Receipt}
              title="아직 기록한 지출이 없어요"
            />
          ) : (
            <Panel flush>
              <ul>
                {home.recentExpenses.map((expense) => (
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
                        <PayerChip payer={expense.payer} />
                        <StageBadge stage={expense.stage} />
                      </>
                    }
                    title={expense.vendor ? `${expense.minor} · ${expense.vendor}` : expense.minor}
                    trailing={
                      <MoneyText muted={expense.isEstimated} size="md" value={expense.amount} />
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
          )}

          {home.savingsGoals.length > 0 && (
            <>
              <SectionHeader
                meta={home.savingsGoals.length > 1 ? `${home.savingsGoals.length}개` : undefined}
                title="저축 목표"
              />
              {home.savingsGoals.map((goal) => {
                const left = Math.max(0, goal.targetAmount - goal.currentAmount);

                return (
                  <Panel className="gap-2.5" key={goal.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0 truncate text-body font-semibold">{goal.label}</span>
                      <span className="num shrink-0 text-money-sm text-muted-foreground">
                        {goal.percent}%
                      </span>
                    </div>

                    <ProgressBar
                      color="var(--success)"
                      label={`${goal.label} 진행률`}
                      thin
                      total={goal.targetAmount}
                      value={goal.currentAmount}
                    />

                    <DataRowGroup>
                      <DataRow
                        hint={goal.accountName}
                        label="모은 금액"
                        value={goal.currentAmount}
                      />
                      <DataRow
                        label={left === 0 ? "목표" : "목표까지"}
                        tone={left === 0 ? "success" : "muted"}
                        value={left === 0 ? "달성" : left}
                      />
                      <DataRow label="매달 저축" tone="muted" value={goal.monthlyAmount} />
                    </DataRowGroup>
                  </Panel>
                );
              })}
            </>
          )}
        </>
      )}
    </Screen>
  );
}
