import Link from "next/link";
import { CircleCheck } from "lucide-react";

import { ErrorState } from "@/components/data/error-state";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";
import { getActiveInvite } from "@/lib/supabase/invite";
import { getSpaceContext } from "@/lib/supabase/space";

import { MemberList } from "../member-list";
import { SPACE_COPY } from "../types";
import { InviteBlock } from "./invite-block";
import { INVITE_COPY, INVITE_URGENT_HOURS } from "./types";

const SIDES: readonly Side[] = ["groom", "bride"] as const;

/**
 * 만료 시각 표기. **`timeZone`을 반드시 박는다** — 서버(Vercel = UTC)와 브라우저(KST)가
 * 갈리면 같은 코드의 만료가 9시간 다르게 찍힌다. 여기서 만든 **문자열**을 클라이언트 섬에
 * prop으로 내려보내므로 하이드레이션 불일치도 생기지 않는다.
 * `hourCycle: "h23"`은 자정이 "24:00"으로 나오는 것을 막는다.
 */
const expiryFormat = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "Asia/Seoul",
});

/**
 * 커플 초대 — 코드 발급 · 복사 · 공유 · 멤버.
 *
 * `redeem_invite()`(코드로 참여)는 온보딩에 이미 있었지만 **코드를 발급할 화면이 없어**
 * 2인 스페이스를 실제로 만들 수 없었다. 이 화면이 그 유일한 출구다.
 *
 * `/settings/*` 하위 화면의 첫 사례라 셸이 여기서 굳는다 — 헤더 좌측 뒤로가기(경로),
 * 우측은 비움, 하단 탭은 유지 (→ D-063).
 */
export default async function InvitePage() {
  // 둘 다 `cache()`라 왕복은 요청당 1회씩이다. 순서 의존이 없어 병렬로 연다.
  const [context, inviteResult] = await Promise.all([getSpaceContext(), getActiveInvite()]);

  const header = <AppHeader action={null} back="/settings" title={INVITE_COPY.title} />;

  // 레이아웃 가드가 `none`(→ 온보딩) · `anonymous`(→ 로그인)를 이미 걸러낸다.
  // 여기 남는 갈래는 `ok`와 `unavailable`뿐이고, 후자는 **누가 있는지 모르는 상태**다.
  // 이미 두 사람인지 모르면서 코드를 뿌리게 할 수 없어 발급 자체를 그리지 않는다.
  if (context.status !== "ok") {
    const unconfigured = context.status === "unavailable" && context.reason === "unconfigured";
    return (
      <Screen header={header}>
        <ErrorState
          description={unconfigured ? INVITE_COPY.unconfiguredBody : INVITE_COPY.spaceFailedBody}
          secondaryAction={
            <Button asChild size="sm" variant="secondary">
              <Link href="/settings">{INVITE_COPY.backToSettings}</Link>
            </Button>
          }
          title={INVITE_COPY.spaceFailedTitle}
        />
      </Screen>
    );
  }

  const { members, membersUnavailable } = context.space;
  const invite = inviteResult.status === "ok" ? inviteResult.invite : null;
  const lookupFailed = inviteResult.status === "unavailable";

  // 멤버를 못 읽었으면 "이미 둘"인지 알 수 없다. 그때는 발급 블록을 남기고 서버 RPC가
  // COUPLE_FULL로 막게 둔다 — 화면이 추측으로 기능을 없애는 쪽이 더 나쁘다.
  const full = !membersUnavailable && members.length >= 2;

  const taken = new Set(members.map((member) => member.side));
  const openSide = membersUnavailable ? null : (SIDES.find((side) => !taken.has(side)) ?? null);
  // 코드가 있으면 그 코드의 side가 진실이다. 없으면 남은 자리로 미리 알려 준다.
  const codeSide = invite?.side ?? openSide;

  const urgent = invite ? invite.hoursLeft <= INVITE_URGENT_HOURS : false;
  const expiryText = invite
    ? urgent
      ? INVITE_COPY.expiresUrgent(Math.max(1, invite.hoursLeft))
      : INVITE_COPY.expires(expiryFormat.format(new Date(invite.expiresAt)))
    : null;

  // 이미 두 사람이면 이 화면의 결론은 "다 됐다"이므로 멤버 목록이 맨 위로 올라온다 (→ D-045).
  if (full) {
    return (
      <Screen header={header}>
        <SectionHeader title={SPACE_COPY.membersTitle} />
        <Panel>
          <MemberList members={members} unavailable={membersUnavailable} />
        </Panel>

        <Panel tone="muted">
          <div className="flex items-start gap-3">
            <CircleCheck
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-success"
              strokeWidth={1.8}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body font-semibold">{INVITE_COPY.bothConnected}</p>
              <p className="text-body-sm text-muted-foreground">{INVITE_COPY.bothConnectedBody}</p>
            </div>
          </div>
        </Panel>
      </Screen>
    );
  }

  return (
    <Screen header={header}>
      <InviteBlock
        code={invite?.code ?? null}
        expiryText={expiryText}
        lookupFailed={lookupFailed}
        sideLabel={codeSide ? SIDE_LABEL[codeSide] : null}
        urgent={urgent}
      />

      <SectionHeader title={SPACE_COPY.membersTitle} />
      <Panel>
        <MemberList
          members={members}
          pendingHint={INVITE_COPY.memberPendingHint}
          pendingLabel={INVITE_COPY.memberPending}
          pendingSide={invite?.side ?? null}
          unavailable={membersUnavailable}
        />
      </Panel>
    </Screen>
  );
}
