import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand/brand-lockup";
import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { InlineError } from "@/components/data/error-state";
import { Panel } from "@/components/data/panel";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";
import { formatDday, formatFullDate } from "@/lib/format";
import { getSpaceContext, type Space } from "@/lib/supabase/space";

import { StepDots } from "../step-dots";
import { MAX_DISPLAY_NAME } from "../types";
import { WeddingForm } from "./wedding-form";

export const metadata: Metadata = {
  title: "예식 정보",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

/**
 * 2단계. **커플 유무로 한 라우트가 두 화면이 된다.**
 *
 * 커플이 있으면 되돌려보내는 가드를 걸지 않는다 — 코드로 막 참여한 사람이 정확히 이 주소로 온다.
 * 그 사람에게 이 화면은 입력 폼이 아니라 **"어느 스페이스에 들어왔는지" 확인하는 화면**이다.
 * 초대 테이블은 RPC 밖에서 읽을 수 없어(D-017) 참여 **전에는** 알 방법이 없다.
 */
export default async function WeddingPage({ searchParams }: { searchParams: SearchParams }) {
  const context = await getSpaceContext();

  if (context.status === "anonymous") redirect("/login");
  if (context.status === "ok") return <SpaceConfirm space={context.space} />;

  /* `none`(스페이스 없음)과 `unavailable`(조회 실패)이 여기로 온다.
     `unavailable`을 에러 화면으로 덮지 않는 이유: 판정을 못 했을 뿐이고, 정말 스페이스가 있었다면
     RPC가 ALREADY_IN_COUPLE로 답하며 [홈으로 가기]를 준다. 확인 못 한 값 때문에 길을 막지 않는다. */
  const params = await searchParams;
  const rawSide = first(params.side);
  const name = first(params.name).trim().slice(0, MAX_DISPLAY_NAME);

  // 1단계를 건너뛰고 들어온 경우. 조용히 되돌린다 — 여기서 에러를 띄워도 고칠 방법이 이 화면에 없다.
  if (rawSide !== "groom" && rawSide !== "bride") redirect("/onboarding");
  // 이름이 비면 `create_couple`이 DISPLAY_NAME_REQUIRED로 막는데, 그걸 고칠 입력이 이 화면엔 없다.
  // 역할은 살려서 되돌려 준다.
  if (!name) redirect(`/onboarding?side=${rawSide}`);

  const side: Side = rawSide;

  return (
    <main className="flex flex-col gap-6 pt-10 pb-8">
      <div className="flex flex-col gap-5">
        <BrandLockup as="p" layout="inline" />
        <div className="flex flex-col gap-2">
          <StepDots current={2} />
          <h1 className="text-display">예식 정보</h1>
          <p className="text-body text-muted-foreground">
            홈의 D-day와 예산 화면이 이 두 값으로 계산돼요.
          </p>
        </div>
      </div>

      <WeddingForm name={name} side={side} />
    </main>
  );
}

/* ─────────────────────────────  확인 화면  ───────────────────────────── */

/** `DataRow`의 값 칸은 `shrink-0`이라 긴 이름이 라벨을 밀어낸다. 폭을 묶어 둔다. */
function Clamp({ children }: { children: React.ReactNode }) {
  return <span className="block max-w-[180px] truncate">{children}</span>;
}

/**
 * 코드로 막 참여한 사람이 보는 화면. **제목이 곧 결론이다** (D-045) —
 * "내가 어느 쪽으로, 어느 스페이스에 들어왔는가"가 32px로 먼저 오고 세부는 패널로 내려간다.
 *
 * 이 화면은 **잘못된 스페이스에 들어갔음을 알아챌 유일한 지점이다.** `leave_couple()` RPC가
 * 없어 되돌릴 수는 없지만, 최소한 지금 알아야 상대에게 연락이라도 할 수 있다.
 */
function SpaceConfirm({ space }: { space: Space }) {
  const me = space.members.find((member) => member.isMe) ?? null;
  const partner = space.members.find((member) => !member.isMe) ?? null;
  // 혼자면 방금 **만든** 사람이다(뒤로가기로 이 주소에 다시 올 수 있다). 참여했다고 말하면 거짓말이다.
  const joined = space.members.length >= 2;

  const title = me
    ? `${SIDE_LABEL[me.side]}으로 ${joined ? "참여했어요" : "만들었어요"}`
    : "스페이스가 준비됐어요";

  const hasBudget = space.totalBudget > 0;
  const fullDate = formatFullDate(space.weddingDate);
  const dday = formatDday(space.weddingDate);

  return (
    <main className="flex flex-col gap-6 pt-10 pb-8">
      <div className="flex flex-col gap-5">
        <BrandLockup as="p" layout="inline" />
        <div className="flex flex-col gap-2">
          <StepDots current={2} />
          <h1 className="text-display">{title}</h1>
          <p className="text-body text-muted-foreground">
            {joined
              ? "아래가 지금 들어온 스페이스예요. 다르면 코드를 보낸 분에게 확인해 주세요."
              : "예식 정보는 설정에서 언제든 바꿀 수 있어요."}
          </p>
        </div>
      </div>

      <Panel>
        <DataRowGroup>
          <DataRow label="스페이스" value={<Clamp>{space.name}</Clamp>} />
          <DataRow
            label="예식일"
            value={<Clamp>{fullDate ?? space.weddingDate}</Clamp>}
          />
          <DataRow label="예식까지" value={dday ?? "—"} />
          {/* 0은 "0원"이 아니라 미설정이다. ₩0으로 렌더하면 정하지도 않은 예산을 확정처럼 보여준다. (D-052) */}
          <DataRow
            label="총 가용예산"
            tone={hasBudget ? "default" : "muted"}
            value={hasBudget ? space.totalBudget : "아직 정하지 않았어요"}
          />
        </DataRowGroup>

        {/* 멤버 조회만 실패한 부분 실패. 스페이스 자체는 살아 있으므로 이 한 줄만 대체하고
            CTA는 남겨 둔다 — 참여는 이미 끝났고, 홈으로 갈 길을 막을 이유가 없다. */}
        {space.membersUnavailable ? (
          <InlineError message="함께 쓰는 사람을 불러오지 못했어요. 홈에서 다시 확인할 수 있어요." />
        ) : (
          <DataRowGroup divided>
            <DataRow
              label="함께 쓰는 사람"
              tone={partner ? "default" : "muted"}
              value={
                partner ? (
                  <Clamp>
                    {partner.displayName} · {SIDE_LABEL[partner.side]}
                  </Clamp>
                ) : (
                  "아직 참여 전이에요"
                )
              }
            />
          </DataRowGroup>
        )}
      </Panel>

      <Button asChild className="w-full" size="lg">
        <Link href="/">시작하기</Link>
      </Button>
    </main>
  );
}
