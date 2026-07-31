"use client";

import { ChevronDown, ExternalLink, ListPlus } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { EmptyState } from "@/components/data/empty-state";
import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { MoneyText } from "@/components/money/money-text";
import { Button } from "@/components/ui/button";
import { formatWon } from "@/lib/format";
import type { BudgetLine, BudgetMajorView } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

/**
 * 경고 배너 → 해당 카드로 보내는 신호. 배너는 페이지(서버 컴포넌트)에 있고 카드는
 * 각자 자기 `open` 상태를 들고 있어, 둘을 잇는 가장 가벼운 방법이 이 이벤트다.
 *
 * 순수 앵커(`href="#id"`)로는 스크롤만 되고 카드가 접힌 채로 남는다. 반대로 상태를
 * 페이지로 끌어올리면 목록 전체가 클라이언트 컴포넌트가 된다.
 */
const REVEAL_EVENT = "budget:reveal-major";

/**
 * 경고 배너의 조치 버튼. 대상 카드를 펼치고, 스크롤하고, 포커스를 옮긴다.
 * 스크롤만 하고 포커스를 두면 키보드 사용자는 방금 무엇이 열렸는지 알 수 없다.
 */
export function RevealMajorButton({
  children,
  targetId,
}: {
  children: ReactNode;
  targetId: string;
}) {
  return (
    <Button
      onClick={() => {
        window.dispatchEvent(new CustomEvent(REVEAL_EVENT, { detail: targetId }));
        document.getElementById(targetId)?.scrollIntoView({
          // 카드가 펼쳐지며 높이가 변하므로 이동을 보여 준다. 단, 모션 축소는 존중한다.
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "auto"
            : "smooth",
          block: "start",
        });
      }}
      size="sm"
      type="button"
      variant="secondary"
    >
      {children}
    </Button>
  );
}

/**
 * 소분류 한 줄의 우측 보조 문구. 세 갈래다.
 * - 지출 0 → "미집행"
 * - 초과 → "초과 ₩x" (`remaining`이 음수면 "잔액 ₩-x"가 되어 읽히지 않는다)
 * - 그 외 → "잔액 ₩x", 90% 넘으면 톤을 올린다
 *
 * 톤은 어디까지나 보조다 — 초과·미집행은 글자로도 구분된다(D-006).
 */
function lineStatus(line: BudgetLine): { text: string; alert: boolean } {
  if (line.spent === 0) return { text: "미집행", alert: false };
  if (line.remaining < 0) return { text: `초과 ${formatWon(-line.remaining)}`, alert: true };
  return { text: `잔액 ${formatWon(line.remaining)}`, alert: line.percent >= 90 };
}

/**
 * 대분류 배분 카드. 탭하면 소분류 예산(업체·후기링크·메모)이 펼쳐진다.
 *
 * **세부 합이 배분액을 넘으면 카드가 `tone="warning"`으로 승격된다.** 4장이 전부 같은
 * 무게로 놓이면 어느 대분류가 위험한지 스캔으로는 알 수 없어, 문제 있는 카드만 면 색으로
 * 끌어올린다. 색만으로 전달하지 않도록 헤더 우측 배지가 초과 금액을 글자로 적는다
 * (`%`를 밀어낸다 — 소진율은 진행률 바가 계속 들고 있다).
 *
 * 접기/펴기 버튼은 **헤더 행만** 감싼다. 진행률 바(`role="progressbar"`)와 금액 행이
 * 버튼 안에 있으면 인터랙티브 요소 안에 역할이 중첩되어 스크린리더가 버튼 이름을
 * 금액까지 통째로 읽는다. 대신 헤더 행이 26px밖에 안 되므로 `after:` 오버레이로
 * 히트 영역만 46px로 넓힌다(D-031).
 *
 * **처음에는 4장 모두 접혀 있다.** 초과 카드를 자동으로 펼쳤더니 소분류가 14행이라
 * 첫 화면이 2,400px가 되어 나머지 대분류가 보이지 않았다 — 이 화면의 목적인
 * "배분 전체 조망"이 사라진다. 문제 카드로 가는 길은 경고 배너가 준다. (→ D-051)
 */
export function MajorCard({
  major,
  id,
}: {
  major: BudgetMajorView;
  /** 경고 배너가 펼침 신호를 보내는 대상. 페이지가 소유한다. */
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const over = major.overBy > 0;
  const linesId = `${id}-lines`;

  useEffect(() => {
    const reveal = () => {
      setOpen(true);
      // 스크롤은 배너 버튼이 맡는다. 여기서 또 움직이면 두 번 튄다.
      toggleRef.current?.focus({ preventScroll: true });
    };

    const onReveal = (event: Event) => {
      if ((event as CustomEvent<string>).detail === id) reveal();
    };

    // 최초 해시(`#budget-major-*`)를 여기서 읽어 펼치지 않는다. 효과 안에서 동기로
    // setState 하면 연쇄 렌더가 되고(react-hooks/set-state-in-effect), 초기 상태로
    // 옮기면 SSR과 값이 갈려 하이드레이션이 어긋난다. 배너 버튼은 해시를 만들지 않으므로
    // 이 경로는 지금 발생하지도 않는다 — 딥링크가 필요해지면 그때 서버에서 판단해 내려보낸다.
    window.addEventListener(REVEAL_EVENT, onReveal);
    return () => window.removeEventListener(REVEAL_EVENT, onReveal);
  }, [id]);

  return (
    <Panel
      className="scroll-mt-16"
      flush
      id={id}
      tone={over ? "warning" : "default"}
    >
      <div className="flex flex-col gap-2.5 p-4">
        <button
          aria-controls={linesId}
          aria-expanded={open}
          className={cn(
            "relative -mx-1 flex items-center justify-between gap-2 rounded-md px-1 py-0.5 text-left",
            // 보이는 크기는 그대로 두고 손가락에만 46px을 준다 — 헤더를 키우면
            // 카드 상단 여백이 무너진다.
            "after:absolute after:-inset-x-3 after:-inset-y-2.5 after:content-['']",
            "transition-colors active:bg-muted",
            "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          )}
          onClick={() => setOpen((prev) => !prev)}
          ref={toggleRef}
          type="button"
        >
          <span className="flex min-w-0 items-center gap-2">
            <i
              aria-hidden
              className="size-[9px] shrink-0 rounded-[3px]"
              style={{ backgroundColor: major.color }}
            />
            <span className="truncate text-money-md">{major.label}</span>
          </span>

          <span className="flex shrink-0 items-center gap-1.5">
            {over ? (
              // 면은 `bg-card`다. `bg-warning/15`는 color-mix를 못 쓰는 환경에서
              // 불투명 `--warning`으로 되돌아가 글자가 사라진다(D-012와 같은 함정).
              // 앰버 패널 위에 흰 칩이 떠 있는 편이 대비도 더 확실하다.
              <span className="num inline-flex h-[22px] shrink-0 items-center rounded-md border border-warning/45 bg-card px-2 text-caption font-semibold whitespace-nowrap text-warning-strong">
                초과 {formatWon(major.overBy)}
              </span>
            ) : (
              <span className="text-body-sm text-muted-foreground">
                소진{" "}
                <b
                  className={cn(
                    "num font-semibold",
                    major.percent >= 100 ? "text-warning-strong" : "text-foreground",
                  )}
                >
                  {major.percent}%
                </b>
              </span>
            )}
            <ChevronDown
              aria-hidden
              className={cn(
                "size-4 text-muted-foreground transition-transform motion-reduce:transition-none",
                open && "rotate-180",
              )}
              strokeWidth={2.2}
            />
          </span>
        </button>

        <ProgressBar
          color={major.color}
          label={`${major.label} 배분액 소진율`}
          thin
          total={major.allocation}
          value={major.spent}
        />

        <DataRowGroup>
          <DataRow label="배분" value={major.allocation} />
          <DataRow
            label="세부 예산 합"
            tone={over ? "warning" : "default"}
            value={major.budgetSum}
          />
        </DataRowGroup>
      </div>

      {/* 닫혀 있어도 DOM에 남긴다 — `aria-controls`가 가리키는 대상이 사라지면
          참조가 깨지고, 브라우저 페이지 내 찾기에서도 항목이 사라진다.

          초과 카드라도 **소분류 목록은 앰버를 벗는다.** 앰버는 "이 대분류에 문제가 있다"는
          요약의 신호이지 항목 하나하나의 상태가 아니고, 다크 모드에서 `--border`(#2a272b)가
          `--warning-soft`(#2a200d) 위에 얹히면 행 구분선이 사실상 사라진다. */}
      <div
        className={cn("border-t", over ? "border-warning/30 bg-card" : "border-border")}
        hidden={!open}
        id={linesId}
      >
        {major.lines.length === 0 ? (
          <div className="p-4">
            <EmptyState
              action={
                <Button size="sm" variant="secondary">
                  소분류 추가
                </Button>
              }
              bordered
              className="gap-2 px-4 py-6"
              description={`${major.label}에 들어갈 항목과 예상 금액을 적으면 배분액과 자동으로 비교돼요`}
              icon={ListPlus}
              title="소분류가 아직 없어요"
            />
          </div>
        ) : (
          <ul>
            {major.lines.map((line) => {
              const status = lineStatus(line);

              return (
                <ListRow
                  key={line.minor}
                  meta={
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="min-w-0 truncate text-body-sm text-muted-foreground">
                        {[line.vendor, line.note].filter(Boolean).join(" · ") || line.mid}
                      </span>
                      {line.referenceUrl && (
                        <a
                          aria-label={`${line.minor} 후기 링크 열기 (새 창)`}
                          // ⚠️ 조건부가 없으므로 일부러 `cn()`을 쓰지 않는다. tailwind-merge가
                          // 커스텀 타입 스케일(`text-caption`)을 색 클래스로 오인해
                          // `text-muted-foreground`와 충돌시키면 글자 크기가 통째로 사라진다.
                          // 24px 칩에 15px 본문이 들어가 행이 깨진다.
                          className="relative inline-flex h-6 shrink-0 items-center gap-1 rounded-md border border-border px-1.5 text-caption font-medium text-muted-foreground transition-colors after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-[''] active:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                          href={line.referenceUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink aria-hidden className="size-3" strokeWidth={2} />
                          후기
                        </a>
                      )}
                    </div>
                  }
                  title={line.minor}
                  trailing={<MoneyText size="md" value={line.amount} />}
                  trailingCaption={
                    status.alert ? (
                      <span className="text-warning-strong">{status.text}</span>
                    ) : (
                      status.text
                    )
                  }
                />
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
