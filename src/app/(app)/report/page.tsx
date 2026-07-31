import { ArrowRight, ChartPie, Download } from "lucide-react";
import Link from "next/link";

import { MonthlyTimeline } from "@/components/charts/monthly-timeline";
import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { EmptyState } from "@/components/data/empty-state";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { SectionHeader } from "@/components/data/section-header";
import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { Button } from "@/components/ui/button";
import { PAYER_LABEL, PAYER_TOKEN, type Payer } from "@/lib/domain";
import { clampedPercent, formatWon, toISODate } from "@/lib/format";
import { MOCK_TODAY, getMockReport, resolveFixtureKey } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

/**
 * 결산 화면.
 *
 * **결론이 맨 위다.** 이 화면에서 사용자가 가장 먼저 알고 싶은 건
 * "누가 누구에게 얼마 보내면 되나" 하나다 — 소진율·소분류·타임라인은 그 결론을
 * 뒷받침하는 근거라 아래로 내렸다. (→ 기획서 목차 순서를 화면 순서로 쓰지 않는다)
 *
 * 섹션 제목도 목차 번호(① ② ③ ④)를 떼고 사용자에게 하는 말로 바꿨다.
 */
export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const report = getMockReport(resolveFixtureKey(params.fixture));

  // 기준일은 목업 고정일에서 파생시킨다 — 문자열로 적어두면 fixture를 바꿔도 안 따라온다.
  const asOf = toISODate(
    MOCK_TODAY.getUTCFullYear(),
    MOCK_TODAY.getUTCMonth() + 1,
    MOCK_TODAY.getUTCDate(),
  ).replace(/-/g, ".");

  const spentLines = report.lines.filter((line) => line.spent > 0);
  const untouched = report.lines.filter((line) => line.spent === 0);
  const untouchedBudget = untouched.reduce((sum, line) => sum + line.amount, 0);
  const allocatedTotal = report.majors.reduce((sum, major) => sum + major.allocation, 0);

  const { settlement } = report;
  const { from, to, transferAmount, total: coupleTotal } = settlement;
  // `from`/`to`를 지역 const로 풀어야 아래 분기에서 null이 좁혀진다.
  const needsTransfer = transferAmount > 0 && from !== null && to !== null;

  // 막대 폭은 반올림하지 않은 값으로 그린다 — 두 조각이 정확히 100%를 채워야
  // 가운데에 1px 틈이 생기지 않는다. 라벨만 반올림한다.
  const groomShareExact = clampedPercent(settlement.groomBurden, coupleTotal);
  const groomShare = Math.round(groomShareExact);

  return (
    <Screen
      header={
        <AppHeader
          title="결산"
          subtitle={`확정 지출 기준 · ${asOf}`}
          action={
            // 아직 동작하지 않는 자리표시자다(제품 오너 판단으로 유지). 내보내기는 P6.
            <HeaderIconLink href="/report" label="결산 내려받기">
              <Download aria-hidden className="size-[21px]" strokeWidth={1.9} />
            </HeaderIconLink>
          }
        />
      }
    >
      {report.isEmpty ? (
        <EmptyState
          bordered
          action={
            <Button asChild size="sm">
              <Link href="/expenses">첫 지출 기록하기</Link>
            </Button>
          }
          description="지출을 기록하면 분담 정산·소진율·월별 흐름이 자동으로 계산됩니다"
          icon={ChartPie}
          title="결산할 지출이 없어요"
        />
      ) : (
        <>
          {/* ── 히어로: 정산 결론 ─────────────────────────────────────
              세 상태가 서로 다른 문장을 갖는다.
              보낼 돈 있음(accent) / 이미 균등(success) / 커플 지출 0(muted). */}
          {needsTransfer ? (
            <Panel className="gap-2.5" tone="accent">
              <span className="text-caption text-muted-foreground">둘이 절반씩 맞추려면</span>

              <div className="flex flex-col gap-2">
                {/* 칩 두 개를 스크린리더가 "예신 예랑"으로 읽으면 방향이 사라진다.
                    시각 요소는 감추고 문장 하나를 따로 읽힌다. */}
                <span className="sr-only">
                  {PAYER_LABEL[from]}이 {PAYER_LABEL[to]}에게 보낼 금액
                </span>
                <span aria-hidden className="flex items-center gap-1.5">
                  <PayerChip payer={from} />
                  <ArrowRight className="size-4 text-muted-foreground" strokeWidth={2.2} />
                  <PayerChip payer={to} />
                </span>
                <MoneyText size="display" value={transferAmount} />
              </div>

              <p className="text-body-sm text-muted-foreground">
                보내면 각자{" "}
                <b className="num font-semibold text-foreground">
                  {formatWon(settlement.perPerson)}
                </b>
                씩 부담한 게 됩니다
              </p>
            </Panel>
          ) : coupleTotal > 0 ? (
            <Panel className="gap-1.5" tone="success">
              <span className="text-caption text-muted-foreground">분담 정산</span>
              <p className="text-title">이미 절반씩 부담하고 있어요</p>
              <p className="num text-body-sm text-muted-foreground">
                각자 {formatWon(settlement.perPerson)}씩 · 지금 보낼 돈은 없습니다
              </p>
            </Panel>
          ) : (
            <Panel className="gap-1.5" tone="muted">
              <span className="text-caption text-muted-foreground">분담 정산</span>
              <p className="text-title">둘이 낸 확정 지출이 없어요</p>
              <p className="text-body-sm text-muted-foreground">
                {settlement.otherTotal > 0
                  ? `기타(제3자)가 낸 ${formatWon(settlement.otherTotal)}은 분담 정산에서 빠집니다`
                  : "결제일이 정해진 지출이 생기면 여기에 정산 금액이 계산됩니다"}
              </p>
            </Panel>
          )}

          {/* ── 근거 1: 누가 얼마 냈나 ───────────────────────────────── */}
          <SectionHeader
            description="공동계좌 지출은 양쪽에 절반씩 나눠 넣었어요"
            title="둘이 얼마씩 냈나"
          />
          <Panel>
            <div className="grid grid-cols-2 gap-2.5">
              <BurdenTile
                burden={settlement.groomBurden}
                direct={settlement.groomDirect}
                joint={settlement.jointTotal}
                payer="groom"
              />
              <BurdenTile
                burden={settlement.brideBurden}
                direct={settlement.brideDirect}
                joint={settlement.jointTotal}
                payer="bride"
              />
            </div>

            {/* 2색 막대는 색만으로 비율을 말한다 — 위에 텍스트 라벨을 항상 병기한다. (→ D-006) */}
            {coupleTotal > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2 text-body-sm">
                  <span className="flex items-center gap-1.5">
                    <ShareDot payer="groom" />
                    <span className="text-muted-foreground">{PAYER_LABEL.groom}</span>
                    <b className="num font-semibold">{groomShare}%</b>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{PAYER_LABEL.bride}</span>
                    <b className="num font-semibold">{100 - groomShare}%</b>
                    <ShareDot payer="bride" />
                  </span>
                </div>
                <div aria-hidden className="flex h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-payer-groom" style={{ width: `${groomShareExact}%` }} />
                  <div
                    className="h-full bg-payer-bride"
                    style={{ width: `${100 - groomShareExact}%` }}
                  />
                </div>
              </div>
            )}

            {settlement.otherTotal > 0 && (
              <div className="flex items-center justify-between gap-2.5 rounded-xl bg-payer-other-soft px-3 py-2.5">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-caption text-payer-other-strong">기타 · 제3자 지원</span>
                  <span className="text-body-sm text-muted-foreground">분담 정산에서 제외</span>
                </span>
                <MoneyText size="sm" value={settlement.otherTotal} />
              </div>
            )}

            <DataRowGroup divided>
              {settlement.jointTotal > 0 && (
                <DataRow label="공동계좌 결제" value={settlement.jointTotal} />
              )}
              <DataRow label="커플 부담 합계" value={coupleTotal} />
              <DataRow label="1인 목표 (절반)" tone="muted" value={settlement.perPerson} />
            </DataRowGroup>
          </Panel>

          {/* ── 근거 2: 대분류별 소진율 ──────────────────────────────── */}
          <SectionHeader
            description={`확정 지출 ${formatWon(report.confirmedTotal)} / 배분 예산 ${formatWon(allocatedTotal)}`}
            title="대분류별 소진율"
          />
          <Panel className="gap-4">
            {report.majors.map((major) => (
              <div className="flex flex-col gap-2" key={major.key}>
                <div className="flex items-baseline justify-between gap-2.5">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <i
                      aria-hidden
                      className="size-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: major.color }}
                    />
                    <span className="truncate text-body font-semibold">{major.label}</span>
                  </span>
                  <span className="num shrink-0 text-body-sm text-muted-foreground">
                    <b className="font-semibold text-foreground">{formatWon(major.spent)}</b> /{" "}
                    {formatWon(major.allocation)}
                  </span>
                </div>
                <ProgressBar
                  thin
                  color={major.color}
                  label={`${major.label} 소진율 ${major.percent}%`}
                  total={major.allocation}
                  value={major.spent}
                />
              </div>
            ))}
          </Panel>

          {/* ── 근거 3: 소분류 진행 상황 ─────────────────────────────
              가로 3분할 12px은 손가락으로 짚기에도, 눈으로 읽기에도 작았다.
              「라벨 — 값」 표준(DataRow)으로 세로로 편다. */}
          <SectionHeader
            description={
              untouched.length > 0
                ? `아직 지출이 없는 ${untouched.length}개(예산 ${formatWon(untouchedBudget)})는 제외했어요`
                : undefined
            }
            meta={`${spentLines.length}개`}
            title="소분류 진행 상황"
          />
          {spentLines.length > 0 ? (
            <Panel flush>
              <ul>
                {spentLines.map((line) => {
                  const tight = line.percent >= 90 || line.remaining < 0;

                  return (
                    <li
                      className="flex flex-col gap-2.5 border-b border-border/60 px-4 py-3.5 last:border-b-0"
                      key={line.minor}
                    >
                      <div className="flex items-baseline justify-between gap-2.5">
                        <span className="min-w-0 truncate text-body font-semibold">
                          {line.minor}
                        </span>
                        <span
                          className={cn(
                            "num shrink-0 text-money-sm font-bold",
                            tight ? "text-warning-strong" : "text-foreground",
                          )}
                        >
                          {line.percent}%
                        </span>
                      </div>

                      <ProgressBar
                        thin
                        color={tight ? "var(--warning)" : "var(--primary)"}
                        // 퍼센트는 바로 위에 텍스트로 있고 aria-valuenow가 다시 읽는다 —
                        // 라벨에 또 넣으면 세 번 읽힌다.
                        label={`${line.minor} 진행률`}
                        total={line.amount}
                        value={line.spent}
                      />

                      <DataRowGroup>
                        <DataRow label="예산" value={line.amount} />
                        <DataRow label="지출" value={line.spent} />
                        <DataRow
                          label="잔액"
                          tone={tight ? "warning" : "default"}
                          value={line.remaining}
                        />
                      </DataRowGroup>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          ) : (
            <Panel>
              <p className="py-3 text-center text-body-sm text-muted-foreground">
                결제일이 정해진 지출이 아직 없어 진행률을 계산할 수 없어요
              </p>
            </Panel>
          )}

          {/* ── 근거 4: 월별 지출 흐름 (이 앱에서 Recharts를 쓰는 유일한 자리) ── */}
          <SectionHeader title="월별 지출 흐름" />
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

/** 분담 막대 라벨의 색 점. 막대 조각과 같은 토큰을 쓴다. */
function ShareDot({ payer }: { payer: Payer }) {
  return (
    <i
      aria-hidden
      className="size-2.5 shrink-0 rounded-[3px]"
      style={{ backgroundColor: PAYER_TOKEN[payer].dot }}
    />
  );
}

/**
 * 예랑/예신 한 사람의 부담 타일.
 *
 * 공동계좌가 0인데 "+ 공동 ½"을 계속 달면 없는 계산을 있는 것처럼 읽게 된다 —
 * 보조 문구를 세 갈래로 나눈다.
 */
function BurdenTile({
  payer,
  burden,
  direct,
  joint,
}: {
  payer: Payer;
  burden: number;
  direct: number;
  joint: number;
}) {
  const token = PAYER_TOKEN[payer];
  const hint =
    joint > 0
      ? `직접 ${formatWon(direct)} + 공동 ½`
      : direct > 0
        ? "전액 직접 결제"
        : "아직 낸 돈이 없어요";

  return (
    <div className={cn("flex flex-col gap-0.5 rounded-xl p-3", token.soft)}>
      <span className={cn("text-caption", token.text)}>{PAYER_LABEL[payer]} 부담</span>
      <MoneyText compact="auto" size="md" value={burden} />
      <span className="num text-body-sm text-muted-foreground">{hint}</span>
    </div>
  );
}
