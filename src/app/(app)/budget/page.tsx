import { Wallet } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/data/empty-state";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { SectionHeader } from "@/components/data/section-header";
import { WarningBanner } from "@/components/data/warning-banner";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { MoneyText } from "@/components/money/money-text";
import { Button } from "@/components/ui/button";
import { formatWon } from "@/lib/format";
import { getMockBudget, resolveFixtureKey } from "@/lib/mock/fixtures";

import { MajorCard, RevealMajorButton } from "./major-card";

/** 경고 배너 → 해당 카드 앵커. 페이지가 id를 소유해 카드와 배너가 같은 문자열을 본다. */
function majorCardId(key: string): string {
  return `budget-major-${key}`;
}

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const budget = getMockBudget(resolveFixtureKey(params.fixture));

  // 배분 합이 총 예산을 넘은 금액. `unallocated`가 음수로 내려가면
  // "미배분 ₩-380,000 남음"이 되어 읽히지 않는다.
  const overAllocatedTotal = Math.max(0, -budget.unallocated);
  const overSum = budget.overAllocated.reduce((acc, major) => acc + major.overBy, 0);
  const [firstOver] = budget.overAllocated;

  return (
    <Screen
      header={
        <AppHeader
          action={
            <Button size="sm" variant="secondary">
              배분 편집
            </Button>
          }
          title="예산"
        />
      }
    >
      {budget.isEmpty ? (
        <EmptyState
          action={
            <Button asChild size="sm">
              <Link href="/settings">총 가용예산 정하기</Link>
            </Button>
          }
          bordered
          description="총 가용예산을 정하면 결혼식 · 신혼여행 · 혼수 · 신혼집 네 갈래로 나눠 담을 수 있어요"
          icon={Wallet}
          title="예산을 아직 세우지 않았어요"
        />
      ) : (
        <>
          <Panel className="gap-2">
            <span className="text-caption text-muted-foreground">총 가용예산</span>
            <MoneyText size="display" value={budget.totalBudget} />
            <ProgressBar
              color={overAllocatedTotal > 0 ? "var(--warning)" : undefined}
              label="총 예산 대비 배분 완료 비율"
              thin
              total={budget.totalBudget}
              value={budget.allocatedTotal}
            />
            {budget.totalBudget === 0 ? (
              <p className="text-body-sm text-muted-foreground">
                총 가용예산이 아직 0원이에요. 설정에서 먼저 정해 주세요.
              </p>
            ) : overAllocatedTotal > 0 ? (
              <p className="text-body-sm text-warning-strong">
                배분 합이 총 예산보다{" "}
                <b className="num font-semibold">{formatWon(overAllocatedTotal)}</b> 많아요
              </p>
            ) : budget.unallocated > 0 ? (
              <p className="text-body-sm text-muted-foreground">
                미배분 <b className="num font-semibold text-foreground">{formatWon(budget.unallocated)}</b>{" "}
                남음
              </p>
            ) : (
              <p className="text-body-sm text-muted-foreground">
                {budget.majors.length}개 대분류에{" "}
                <b className="num font-semibold text-foreground">{formatWon(budget.allocatedTotal)}</b>{" "}
                전액 배분 완료
              </p>
            )}
          </Panel>

          {/* 시트에는 없던 개선분 — 배분액 대비 세부 예산 합 초과를 실시간으로 경고한다.
              대분류마다 배너를 쌓으면 최대 4장이 첫 화면을 채워 정작 카드가 안 보인다.
              한 장으로 합치고, 조치는 '해당 카드로 점프'라는 실제로 되는 동작을 준다. */}
          {firstOver && (
            <WarningBanner
              action={
                <RevealMajorButton targetId={majorCardId(firstOver.key)}>
                  {budget.overAllocated.length === 1
                    ? `${firstOver.label} 세부 예산 보기`
                    : "초과 항목 보기"}
                </RevealMajorButton>
              }
              description={
                budget.overAllocated.length === 1
                  ? `배분 ${formatWon(firstOver.allocation)} · 세부 합 ${formatWon(
                      firstOver.budgetSum,
                    )}. 세부 항목 금액을 줄이거나, 미배분에서 배분액을 늘려야 총 예산이 맞습니다.`
                  : `${budget.overAllocated
                      .map((major) => major.label)
                      .join(" · ")} — 합계 ${formatWon(
                      overSum,
                    )} 초과. 세부 항목 금액을 줄이거나, 미배분에서 배분액을 늘려야 총 예산이 맞습니다.`
              }
              title={
                budget.overAllocated.length === 1
                  ? `${firstOver.label} 세부 예산이 배분액보다 ${formatWon(firstOver.overBy)} 많습니다`
                  : `대분류 ${budget.overAllocated.length}곳의 세부 예산이 배분액을 넘었습니다`
              }
            />
          )}

          <SectionHeader meta={`${budget.majors.length}개`} title="대분류 배분" />
          {/* 4장 모두 접어 둔다 — 이 화면의 목적은 배분 전체 조망이다. 초과 카드를
              자동으로 펼치면 소분류 14행이 첫 화면을 2,400px로 만들어 나머지 대분류가
              화면 밖으로 밀려난다. 문제 카드로 가는 길은 위 경고 배너가 준다. (→ D-051) */}
          {budget.majors.map((major) => (
            <MajorCard id={majorCardId(major.key)} key={major.key} major={major} />
          ))}
        </>
      )}
    </Screen>
  );
}
