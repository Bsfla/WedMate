import {
  CalendarHeart,
  CreditCard,
  HeartHandshake,
  LogOut,
  Palette,
  PiggyBank,
  Tags,
  UserRoundPlus,
  type LucideIcon,
} from "lucide-react";

import { signOutAction } from "@/app/(auth)/login/actions";
import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { InlineError } from "@/components/data/error-state";
import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";
import { formatDday } from "@/lib/format";
import { getSpaceContext } from "@/lib/supabase/space";

/** 예식일 표기. 홈 헤더와 같은 규칙을 쓴다 — "2026년 11월 14일 (토)". */
const weddingDateFormat = new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "UTC" });
const weekdayFormat = new Intl.DateTimeFormat("ko-KR", { weekday: "short", timeZone: "UTC" });

/**
 * 관리 진입점. 하위 화면이 아직 없어 **누를 수 없는 행**이다.
 *
 * 그래서 `href`를 주지 않는다 — `ListRow`는 이동 가능할 때만 › 를 그리므로
 * "눌러도 아무 일 없는 셰브런"이라는 거짓 어포던스가 생기지 않는다.
 * 하위 화면이 붙으면 `href` 한 줄만 채우면 되고 셰브런은 저절로 돌아온다.
 */
const MENU: { label: string; caption: string; icon: LucideIcon }[] = [
  { label: "카테고리 관리", caption: "대분류 · 중분류 · 소분류", icon: Tags },
  { label: "결제수단 관리", caption: "결제자 × 현금 · 카드 · 상품권 · 계좌", icon: CreditCard },
  { label: "커플 초대", caption: "초대 코드로 배우자를 같은 스페이스에 연결", icon: UserRoundPlus },
  { label: "저축 목표", caption: "목표액 · 월 납입액 · 계좌", icon: PiggyBank },
  { label: "예식 정보", caption: "예식일 · 최소보증인원 · 평균 축의금", icon: CalendarHeart },
];

const SIDES: readonly Side[] = ["groom", "bride"] as const;

function MenuIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />;
}

export default async function SettingsPage() {
  // 판정은 `getSpaceContext()` 하나만 쓴다 — 레이아웃 가드와 다른 쿼리를 쓰면
  // "레이아웃은 있다고 보고 이 화면은 없다고 보는" 어긋남이 생긴다. `cache()`로 감싸여
  // 있어 레이아웃이 이미 부른 요청에서는 왕복이 더 일어나지 않는다.
  const context = await getSpaceContext();

  // 레이아웃 가드가 `none`(→ 온보딩) · `anonymous`(→ 로그인)를 이미 걸러낸다.
  // 여기 남는 갈래는 `ok`와 `unavailable`(조회 실패 · Supabase 미연결)뿐이다.
  const user = context.status === "anonymous" ? null : context.user;
  const space = context.status === "ok" ? context.space : null;
  const spaceFailed = context.status === "unavailable" && context.reason === "error";
  const membersFailed = space?.membersUnavailable ?? false;

  const memberBySide = new Map<Side, { name: string; isMe: boolean }>();
  for (const member of space?.members ?? []) {
    memberBySide.set(member.side, { name: member.displayName, isMe: member.isMe });
  }

  const weddingDay = space ? new Date(`${space.weddingDate}T00:00:00Z`) : null;
  const dday = space ? formatDday(space.weddingDate) : null;

  return (
    <Screen header={<AppHeader title="설정" action={null} />}>
      <SectionHeader title="우리 스페이스" />

      {/*
        이 화면의 첫 정보는 "언제 결혼하고, 누구와 같이 쓰고 있는가"다.
        계정 이메일은 확인용 정보라 맨 아래로 내렸다.
      */}
      {spaceFailed ? (
        <InlineError message="스페이스 정보를 불러오지 못했어요. 화면을 새로고침하면 다시 시도합니다." />
      ) : space && weddingDay ? (
        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-body font-semibold">{space.name}</p>
              <p className="num truncate text-body-sm text-muted-foreground">
                예식 {weddingDateFormat.format(weddingDay)} ({weekdayFormat.format(weddingDay)})
              </p>
            </div>
            {dday && (
              <span className="num shrink-0 rounded-lg bg-muted px-2.5 py-1 text-body-sm font-bold">
                {dday}
              </span>
            )}
          </div>

          {membersFailed ? (
            <InlineError message="함께 쓰는 사람을 불러오지 못했어요. 화면을 새로고침하면 다시 시도합니다." />
          ) : (
            <DataRowGroup divided>
              {SIDES.map((side) => {
                const member = memberBySide.get(side);
                return (
                  <DataRow
                    key={side}
                    label={SIDE_LABEL[side]}
                    tone={member ? "default" : "muted"}
                    value={
                      <span className="inline-flex items-baseline gap-1">
                        {/* 표시 이름은 DB에 길이 상한이 없다. 폭을 묶어 라벨을 밀어내지 않게 한다. */}
                        <span className="block max-w-[150px] truncate">
                          {member ? member.name : "아직 연결 안 됨"}
                        </span>
                        {member?.isMe && (
                          <span className="text-body-sm text-muted-foreground">· 나</span>
                        )}
                      </span>
                    }
                  />
                );
              })}
            </DataRowGroup>
          )}
        </Panel>
      ) : (
        /*
          `EmptyState`를 쓰지 않았다. 그쪽은 "다음 행동 하나"를 전제로 하는데
          스페이스 만들기(온보딩)가 아직 없어 넣을 버튼이 없다 — 누를 것 없는 200px 빈 상자가
          설정 화면 맨 위를 차지하면 아래 정보가 전부 밀린다. 온보딩이 붙으면
          `EmptyState` + "스페이스 만들기"로 갈아 끼운다.
        */
        <Panel tone="muted">
          <div className="flex items-start gap-3">
            <HeartHandshake
              aria-hidden
              className="mt-0.5 size-5 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className="text-body font-semibold">아직 커플 스페이스가 없어요</p>
              <p className="text-body-sm text-muted-foreground">
                예식일과 총 예산을 정하면 이 자리에 예식일과 배우자 연결 상태가 나타나요
              </p>
            </div>
          </div>
        </Panel>
      )}

      <SectionHeader title="관리" />
      <Panel flush>
        <ul>
          {MENU.map((item) => (
            <ListRow
              key={item.label}
              leading={<MenuIcon icon={item.icon} />}
              meta={<span className="text-body-sm text-muted-foreground">{item.caption}</span>}
              title={item.label}
            />
          ))}
        </ul>
      </Panel>

      {/* 스타일가이드는 개발자용이다. 프로덕션 번들에서는 이 분기 자체가 사라진다. */}
      {process.env.NODE_ENV === "development" && (
        <>
          <SectionHeader title="개발용" />
          <Panel flush>
            <ul>
              <ListRow
                href="/design"
                leading={<MenuIcon icon={Palette} />}
                meta={
                  <span className="text-body-sm text-muted-foreground">
                    토큰 · 타입 스케일 · 밀도 규칙 · 컴포넌트 갤러리
                  </span>
                }
                title="스타일 가이드"
              />
            </ul>
          </Panel>
        </>
      )}

      <SectionHeader title="계정" />
      <Panel flush>
        <ul>
          <ListRow
            meta={
              <span className="text-body-sm break-all text-muted-foreground">
                {user?.email ?? "확인할 수 없음"}
              </span>
            }
            title="로그인한 계정"
          />
          {/*
            로그아웃은 파괴적인 동작이 아니다. 전폭 버튼으로 두면 이 화면에서 가장 강한 요소가
            되어 버려서, 목록의 마지막 행 높이(56px)에 맞춘 ghost 버튼으로 낮춘다.
            Server Action이라 <form> 제출 구조는 그대로 둔다.
            2계정 테스트(P1 완료 판정)를 하려면 같은 브라우저에서 계정을 바꿔야 한다.
          */}
          <li>
            <form action={signOutAction}>
              <Button
                className="h-14 w-full justify-start gap-3 rounded-none px-4 font-medium active:bg-muted"
                type="submit"
                variant="ghost"
              >
                <LogOut aria-hidden className="size-5 text-muted-foreground" strokeWidth={1.8} />
                로그아웃
              </Button>
            </form>
          </li>
        </ul>
      </Panel>
    </Screen>
  );
}
