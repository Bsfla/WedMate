import { Plus, Users } from "lucide-react";
import Link from "next/link";

import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { EmptyState } from "@/components/data/empty-state";
import { Gauge } from "@/components/data/gauge";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { WarningBanner } from "@/components/data/warning-banner";
import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { MoneyText } from "@/components/money/money-text";
import { Button } from "@/components/ui/button";
import { formatWon } from "@/lib/format";
import { getMockGuests, resolveFixtureKey } from "@/lib/mock/fixtures";

import { GuestList } from "./guest-list";

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const guests = getMockGuests(resolveFixtureKey(params.fixture));

  // 게이지 눈금은 목표치보다 살짝 크게 잡아 마커가 오른쪽 끝에 붙지 않게 한다.
  const gaugeMax = Math.max(guests.minGuarantee, guests.expectedHeadCount) * 1.14;
  const inProfit = guests.netBeforeShortfall >= 0;

  return (
    <Screen
      header={
        <AppHeader
          title="하객"
          subtitle={
            guests.isEmpty
              ? "명단이 비어 있어요"
              : `${guests.teamCount}팀 · 예상 ${guests.expectedHeadCount}명`
          }
          action={
            <HeaderIconLink href="/guests" label="하객 추가">
              <Plus aria-hidden className="size-[22px]" strokeWidth={2.2} />
            </HeaderIconLink>
          }
        />
      }
    >
      {guests.isEmpty ? (
        <Panel flush>
          <EmptyState
            icon={Users}
            title="하객 명단이 비어 있어요"
            description="명단을 넣으면 예상 참석 인원과 축의금이 자동으로 계산됩니다"
            action={
              <Button asChild size="sm">
                <Link href="/guests">명단 추가하기</Link>
              </Button>
            }
          />
        </Panel>
      ) : (
        <>
          <Panel>
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-caption text-muted-foreground">예상 참석 인원</span>
                <span className="num text-money-md">{guests.expectedHeadCount}명</span>
              </div>
              <Gauge
                value={guests.expectedHeadCount}
                max={gaugeMax}
                marker={guests.minGuarantee}
                label={`예상 참석 ${guests.expectedHeadCount}명, 최소보증 ${guests.minGuarantee}명`}
                caption={`${guests.expectedHeadCount} / 최소보증 ${guests.minGuarantee}`}
              />
            </div>

            {guests.gap > 0 && (
              <WarningBanner
                title={`최소보증인원보다 ${guests.gap}명 부족`}
                description={`부족분 식대 ${formatWon(guests.shortfallCost)}이 추가로 청구됩니다`}
                // 명단을 늘리는 것 말고 앱이 실제로 도울 수 있는 조치는
                // 보증인원·평균 축의금을 다시 잡는 것 하나뿐이다(설정 › 예식 정보).
                action={
                  <Button asChild size="sm" variant="outline">
                    <Link href="/settings">예식 정보 수정</Link>
                  </Button>
                }
              />
            )}
          </Panel>

          {/* 이 앱의 차별점 — 축의금과 결혼식 지출을 연결해 손익을 낸다.
              예식 전이라 지출이 아직 안 끝났으므로 '결혼식 예산 합계'와 견준다.
              **이 화면의 결론이므로 명단(최대 200팀) 위에 둔다** — 아래에 두면
              스크롤을 다 내려야만 답이 나온다. */}
          <SectionHeader title="최종 손익" />
          <Panel tone={inProfit ? "success" : "warning"}>
            <span className="text-caption text-muted-foreground">예상 축의금 − 결혼식 예산</span>
            <MoneyText
              value={guests.netBeforeShortfall}
              size="display"
              signed
              className={inProfit ? "text-success-strong" : "text-warning-strong"}
            />

            <DataRowGroup divided>
              <DataRow
                label="예상 축의금"
                hint={`${guests.expectedHeadCount}명 × ${formatWon(guests.avgGiftAmount)}`}
                value={guests.expectedGift}
              />
              <DataRow label="결혼식 예산 합계" minus value={guests.weddingBudget} />
              {guests.shortfallCost > 0 && (
                <DataRow
                  label="보증인원 부족 추가분"
                  minus
                  tone="warning"
                  value={guests.shortfallCost}
                />
              )}
            </DataRowGroup>

            <DataRowGroup divided>
              {guests.shortfallCost > 0 && (
                <DataRow
                  label="부족분까지 반영하면"
                  tone={guests.netAfterShortfall >= 0 ? "success" : "warning"}
                  value={<MoneyText signed size="sm" value={guests.netAfterShortfall} />}
                />
              )}
              <DataRow
                label="실제 수령 축의금"
                hint="예식 후 입력"
                tone="muted"
                value={guests.actualGift > 0 ? guests.actualGift : "미입력"}
              />
            </DataRowGroup>
          </Panel>

          <GuestList guests={guests.guests} />
        </>
      )}
    </Screen>
  );
}
