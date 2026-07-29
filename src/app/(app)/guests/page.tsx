import { Plus, Users } from "lucide-react";

import { EmptyState } from "@/components/data/empty-state";
import { Gauge } from "@/components/data/gauge";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { StatTile } from "@/components/data/stat-tile";
import { WarningBanner } from "@/components/data/warning-banner";
import { AppHeader, HeaderIconLink } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { MoneyText } from "@/components/money/money-text";
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
              />
            )}
          </Panel>

          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              label="예상 축의금"
              value={guests.expectedGift}
              caption={`${guests.expectedHeadCount}명 × ${formatWon(guests.avgGiftAmount)}`}
            />
            <StatTile
              label="실제 수령"
              value={guests.actualGift}
              valueClassName="text-muted-foreground"
              caption="예식 후 입력"
            />
          </div>

          <GuestList guests={guests.guests} />

          {/* 이 앱의 차별점 — 축의금과 결혼식 지출을 연결해 손익을 낸다.
              예식 전이라 지출이 아직 안 끝났으므로 '결혼식 예산 합계'와 견준다. */}
          <SectionHeader title="최종 손익" />
          <Panel className="border-success/35 bg-success-soft">
            <span className="text-caption text-muted-foreground">예상 축의금 − 결혼식 예산</span>
            <MoneyText
              value={guests.netBeforeShortfall}
              size="display"
              signed
              className="text-success-strong"
            />

            <div className="flex flex-col gap-1.5 border-t border-success/20 pt-2.5">
              <div className="flex justify-between gap-2">
                <span className="text-body-sm text-muted-foreground">예상 축의금</span>
                <span className="num text-money-sm">{formatWon(guests.expectedGift)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-body-sm text-muted-foreground">결혼식 예산 합계</span>
                <span className="num text-money-sm">−{formatWon(guests.weddingBudget)}</span>
              </div>
              {guests.shortfallCost > 0 && (
                <div className="flex justify-between gap-2">
                  <span className="text-body-sm text-muted-foreground">보증인원 부족 추가분</span>
                  <span className="num text-money-sm text-warning-strong">
                    −{formatWon(guests.shortfallCost)}
                  </span>
                </div>
              )}
            </div>

            {guests.shortfallCost > 0 && (
              <p className="text-body-sm text-muted-foreground">
                보증인원 미달분까지 반영하면{" "}
                <b className="num font-semibold text-success-strong">
                  {guests.netAfterShortfall > 0 ? "+" : ""}
                  {formatWon(guests.netAfterShortfall)}
                </b>
              </p>
            )}
          </Panel>
        </>
      )}
    </Screen>
  );
}
