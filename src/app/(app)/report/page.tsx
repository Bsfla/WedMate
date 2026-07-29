import { ChartPie, Download } from "lucide-react";

import { MonthlyTimeline } from "@/components/charts/monthly-timeline";
import { EmptyState } from "@/components/data/empty-state";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { SectionHeader } from "@/components/data/section-header";
import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { MoneyText } from "@/components/money/money-text";
import { PAYER_LABEL } from "@/lib/domain";
import { clampedPercent, formatWon } from "@/lib/format";
import { getMockReport, resolveFixtureKey } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const report = getMockReport(resolveFixtureKey(params.fixture));

  const spentLines = report.lines.filter((line) => line.spent > 0);
  const untouched = report.lines.filter((line) => line.spent === 0);
  const untouchedBudget = untouched.reduce((sum, line) => sum + line.amount, 0);

  const { settlement } = report;
  const groomShare = clampedPercent(settlement.groomBurden, settlement.total);

  return (
    <Screen
      header={
        <AppHeader
          title="결산"
          subtitle="확정 지출 기준 · 2026.07.29"
          action={
            <HeaderIconLink href="/report" label="결산 내려받기">
              <Download aria-hidden className="size-[21px]" strokeWidth={1.9} />
            </HeaderIconLink>
          }
        />
      }
    >
      {report.isEmpty ? (
        <Panel flush>
          <EmptyState
            icon={ChartPie}
            title="결산할 지출이 없어요"
            description="지출을 기록하면 소진율·분담 정산·타임라인이 자동으로 계산됩니다"
          />
        </Panel>
      ) : (
        <>
          {/* ① 대분류 소진율 */}
          <SectionHeader title="① 대분류 소진율" />
          <Panel className="gap-4">
            {report.majors.map((major) => (
              <div key={major.key} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <i
                      aria-hidden
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: major.color }}
                    />
                    <span className="text-money-sm">{major.label}</span>
                  </span>
                  <span className="num text-body-sm text-muted-foreground">
                    <b className="font-semibold text-foreground">{formatWon(major.spent)}</b> /{" "}
                    {formatWon(major.allocation)}
                  </span>
                </div>
                <ProgressBar
                  thin
                  value={major.spent}
                  total={major.allocation}
                  color={major.color}
                  label={`${major.label} 소진율 ${major.percent}%`}
                />
              </div>
            ))}
          </Panel>

          {/* ② 소분류 상세 — 가로 스크롤 없이 2행으로 접는다. */}
          <SectionHeader title="② 소분류 상세" />
          <Panel flush>
            <ul>
              {spentLines.map((line) => (
                <li
                  key={line.minor}
                  className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 last:border-b-0"
                >
                  <div className="flex items-baseline justify-between gap-2.5">
                    <span className="truncate text-[0.9rem] font-semibold tracking-tight">
                      {line.minor}
                    </span>
                    <span
                      className={cn(
                        "num shrink-0 text-body-sm font-bold",
                        line.percent >= 90 ? "text-warning-strong" : "text-foreground",
                      )}
                    >
                      {line.percent}%
                    </span>
                  </div>

                  <ProgressBar
                    thin
                    value={line.spent}
                    total={line.amount}
                    color={line.percent >= 90 ? "var(--warning)" : "var(--primary)"}
                    label={`${line.minor} 진행률`}
                  />

                  <div className="flex justify-between gap-2.5">
                    <span className="num text-caption font-normal text-muted-foreground">
                      예산 <b className="font-semibold text-foreground">{formatWon(line.amount)}</b>
                    </span>
                    <span className="num text-caption font-normal text-muted-foreground">
                      지출 <b className="font-semibold text-foreground">{formatWon(line.spent)}</b>
                    </span>
                    <span className="num text-caption font-normal text-muted-foreground">
                      잔액{" "}
                      <b
                        className={cn(
                          "font-semibold",
                          line.percent >= 90 ? "text-warning-strong" : "text-foreground",
                        )}
                      >
                        {formatWon(line.remaining)}
                      </b>
                    </span>
                  </div>
                </li>
              ))}

              {untouched.length > 0 && (
                <li className="flex items-center justify-between gap-2 px-4 py-3 text-body-sm text-muted-foreground">
                  <span>미집행 소분류 {untouched.length}건</span>
                  <span className="num">예산 합 {formatWon(untouchedBudget)}</span>
                </li>
              )}
            </ul>
          </Panel>

          {/* ③ 분담 정산 — 공동계좌 지출은 양쪽에 1/2씩 귀속시킨다. */}
          <SectionHeader title="③ 분담 정산" />
          <Panel>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-0.5 rounded-xl bg-payer-groom-soft p-3">
                <span className="text-caption text-payer-groom-strong">예랑 부담</span>
                <MoneyText value={settlement.groomBurden} size="md" />
                <span className="num text-body-sm text-muted-foreground">
                  직접 {formatWon(settlement.groomDirect)} + 공동 ½
                </span>
              </div>
              <div className="flex flex-col gap-0.5 rounded-xl bg-payer-bride-soft p-3">
                <span className="text-caption text-primary">예신 부담</span>
                <MoneyText value={settlement.brideBurden} size="md" />
                <span className="num text-body-sm text-muted-foreground">
                  직접 {formatWon(settlement.brideDirect)} + 공동 ½
                </span>
              </div>
            </div>

            <div
              role="img"
              aria-label={`예랑 ${Math.round(groomShare)}% · 예신 ${100 - Math.round(groomShare)}%`}
              className="flex h-2.5 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full bg-payer-groom" style={{ width: `${groomShare}%` }} />
              <div className="h-full bg-payer-bride" style={{ width: `${100 - groomShare}%` }} />
            </div>

            <div className="rounded-xl border border-primary/25 bg-primary-soft p-3.5">
              {settlement.transferAmount === 0 || !settlement.from || !settlement.to ? (
                <p className="text-[0.9rem] tracking-tight">이미 절반씩 부담하고 있습니다</p>
              ) : (
                <p className="text-[0.9rem] leading-relaxed tracking-tight">
                  절반씩 나누려면{" "}
                  <b className="num font-bold text-primary">
                    {PAYER_LABEL[settlement.from]} → {PAYER_LABEL[settlement.to]}{" "}
                    {formatWon(settlement.transferAmount)}
                  </b>{" "}
                  보내면 정산 완료
                </p>
              )}
              <p className="num mt-1 text-body-sm text-muted-foreground">
                총 확정 지출 {formatWon(settlement.total)} · 1인 목표 {formatWon(settlement.perPerson)}
              </p>
            </div>
          </Panel>

          {/* ④ 월별 타임라인 */}
          <SectionHeader title="④ 월별 타임라인" />
          <Panel>
            <MonthlyTimeline data={report.timeline} />
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <i aria-hidden className="size-2.5 shrink-0 rounded-[3px] bg-primary" />
                확정
              </span>
              <span className="flex items-center gap-1.5 text-caption text-muted-foreground">
                <i
                  aria-hidden
                  className="hatch-estimate-strong size-2.5 shrink-0 rounded-[3px] border border-dashed border-primary/65"
                />
                예상(날짜 미정)
              </span>
            </div>
            {report.estimatedTotal > 0 && (
              <p className="num text-body-sm text-muted-foreground">
                예상 지출 합계 {formatWon(report.estimatedTotal)} — 확정 지출과 소진율에는 포함되지
                않습니다
              </p>
            )}
          </Panel>
        </>
      )}
    </Screen>
  );
}
