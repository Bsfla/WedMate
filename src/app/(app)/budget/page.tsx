import { Wallet } from "lucide-react";

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

import { MajorCard } from "./major-card";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const budget = getMockBudget(resolveFixtureKey(params.fixture));

  return (
    <Screen
      header={
        <AppHeader
          title="예산"
          action={
            <Button size="sm" variant="secondary">
              배분 편집
            </Button>
          }
        />
      }
    >
      {budget.isEmpty ? (
        <Panel flush>
          <EmptyState
            icon={Wallet}
            title="예산을 아직 세우지 않았어요"
            description="총 가용예산을 정하고 대분류 4개에 나눠보세요"
          />
        </Panel>
      ) : (
        <>
          <Panel className="gap-2">
            <span className="text-caption text-muted-foreground">총 가용예산</span>
            <MoneyText value={budget.totalBudget} size="display" />
            <ProgressBar
              thin
              value={budget.allocatedTotal}
              total={budget.totalBudget}
              label="배분 완료 비율"
            />
            <p className="text-body-sm text-muted-foreground">
              {budget.unallocated === 0
                ? `4개 대분류에 ${formatWon(budget.allocatedTotal)} 전액 배분 완료`
                : `미배분 ${formatWon(budget.unallocated)} 남음`}
            </p>
          </Panel>

          {/* 시트에는 없던 개선분 — 배분액 대비 세부 예산 합 초과를 실시간으로 경고한다. */}
          {budget.overAllocated.map((major) => (
            <WarningBanner
              key={major.key}
              title={`${major.label} 세부 예산이 배분액을 초과합니다`}
              description={`배분 ${formatWon(major.allocation)} · 세부 합 ${formatWon(
                major.budgetSum,
              )} — ${formatWon(major.overBy)} 초과. 배분액을 늘리거나 세부 항목을 줄이세요.`}
            />
          ))}

          <SectionHeader title="대분류 배분" />
          {budget.majors.map((major, index) => (
            // 첫 카드만 펼쳐 둔다 — 소분류 편집이 어떻게 생겼는지 바로 보이게.
            <MajorCard key={major.key} major={major} defaultOpen={index === 0} />
          ))}
        </>
      )}
    </Screen>
  );
}
