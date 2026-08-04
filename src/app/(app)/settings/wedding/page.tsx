import Link from "next/link";

import { ErrorState } from "@/components/data/error-state";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { getSpaceContext } from "@/lib/supabase/space";

import { WEDDING_INFO_COPY } from "./types";
import { WeddingInfoForm } from "./wedding-info-form";

/**
 * 예식 정보 편집 — 예식일 · 총 가용예산 · 최소보증인원 · 1인 식대 · 평균 축의금.
 *
 * 온보딩은 예식일·총예산 둘만 받고 나머지 셋은 DB 기본값(200 / 80,000 / 70,000)으로 둔다
 * (→ D-028). **이 화면이 그 셋을 고칠 수 있는 유일한 경로다.** 실제 계약은 홀마다 달라서
 * (보증 150명, 식대 9만 원) 그때까지는 아무도 확인하지 않은 숫자가 하객 탭의 갭 경고 ·
 * 예상 축의금 · 최종 손익을 만들고 있다.
 *
 * 셸은 `/settings/invite`가 굳힌 규격 그대로다 — `back` 경로 헤더 · 우측 비움 ·
 * 하단 탭 유지 (→ D-063).
 */
export default async function WeddingInfoPage() {
  const context = await getSpaceContext();

  const header = <AppHeader action={null} back="/settings" title={WEDDING_INFO_COPY.title} />;

  // 레이아웃 가드가 `none`(→ 온보딩) · `anonymous`(→ 로그인)를 이미 걸러낸다.
  // 여기 남는 갈래는 `ok`와 `unavailable`뿐이고, 후자는 **지금 값이 무엇인지 모르는 상태**다.
  // 빈 폼을 그리면 사람이 그대로 저장해 멀쩡한 값을 0으로 덮어쓴다.
  if (context.status !== "ok") {
    const unconfigured = context.status === "unavailable" && context.reason === "unconfigured";
    return (
      <Screen header={header}>
        <ErrorState
          description={
            unconfigured ? WEDDING_INFO_COPY.unconfiguredBody : WEDDING_INFO_COPY.loadFailedBody
          }
          secondaryAction={
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings">{WEDDING_INFO_COPY.backToSettings}</Link>
            </Button>
          }
          title={WEDDING_INFO_COPY.loadFailedTitle}
        />
      </Screen>
    );
  }

  const { weddingDate, totalBudget, guestMinGuarantee, mealCostPerHead, avgGiftAmount } =
    context.space;

  return (
    <Screen header={header}>
      <WeddingInfoForm
        initial={{ weddingDate, totalBudget, guestMinGuarantee, mealCostPerHead, avgGiftAmount }}
      />
    </Screen>
  );
}
