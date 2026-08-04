"use client";

import { ArrowDown, ArrowUp, Ellipsis, Plus } from "lucide-react";
import { useState } from "react";

import { CopyField } from "@/components/data/copy-field";
import { ErrorState } from "@/components/data/error-state";
import { ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { CodeInput, INVITE_CODE_HINT } from "@/components/form/code-input";
import { DateField } from "@/components/form/date-field";
import { Field } from "@/components/form/field";
import { BottomSheet } from "@/components/layout/bottom-sheet";
import { ConfirmSheet } from "@/components/layout/confirm-sheet";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { AmountInput } from "@/components/money/amount-input";
import { Button } from "@/components/ui/button";
import { PAYER_LABEL, PAYERS, type Payer } from "@/lib/domain";

const PAYER_OPTIONS = PAYERS.map((value) => ({ value, label: PAYER_LABEL[value] }));

const ROLE_OPTIONS = [
  { value: "groom" as const, label: "예랑" },
  { value: "bride" as const, label: "예신" },
];

/* 갤러리의 D-day가 날마다 바뀌지 않도록 기준일을 고정한다.
   ISO 문자열이 아니라 로컬 생성자로 만든다 — `daysUntil`이 로컬 날짜로 비교하므로
   "2026-07-31T00:00:00Z"는 UTC보다 뒤진 시간대에서 하루 전으로 읽힌다. */
const DEMO_TODAY = new Date(2026, 6, 31);

export function SegmentedControlDemo() {
  const [payer, setPayer] = useState<Payer>("bride");
  return (
    <SegmentedControl
      tone="rose"
      label="결제자 (데모)"
      options={PAYER_OPTIONS}
      value={payer}
      onChange={setPayer}
    />
  );
}

/** 온보딩의 역할 선택 — 기본값 없이 시작한다. 미리 고르면 절반이 잘못 배정된다. */
export function SegmentedControlEmptyDemo() {
  const [role, setRole] = useState<"groom" | "bride" | null>(null);

  return (
    <div className="flex w-full flex-col gap-3">
      <Field
        error={role === null ? "예랑과 예신 중 하나를 골라 주세요" : undefined}
        id="demo-role"
        help={role === null ? undefined : "나중에 설정에서 바꿀 수 있어요"}
        label="나는"
      >
        {(control) => (
          <SegmentedControl
            describedBy={control["aria-describedby"]}
            id={control.id}
            invalid={role === null}
            label="나의 역할"
            onChange={setRole}
            options={ROLE_OPTIONS}
            tone="rose"
            value={role}
          />
        )}
      </Field>
      <button
        className="min-h-11 self-start text-body-sm text-muted-foreground underline underline-offset-4"
        onClick={() => setRole(null)}
        type="button"
      >
        미선택으로 되돌리기
      </button>
    </div>
  );
}

export function AmountInputDemo() {
  const [amount, setAmount] = useState(220_000);
  return <AmountInput value={amount} onChange={setAmount} label="금액 (데모)" />;
}

/** 총예산·저축 목표용 프리셋. expense로 2,600만 원을 채우려면 +100만을 26번 눌러야 한다. */
export function AmountInputBudgetDemo() {
  const [amount, setAmount] = useState(26_000_000);
  return (
    <AmountInput
      label="총 가용예산 (데모)"
      onChange={setAmount}
      steps="budget"
      value={amount}
    />
  );
}

export function DateFieldDemo() {
  const [value, setValue] = useState("");

  return (
    <div className="flex w-full flex-col gap-4">
      <DateField
        help="아직 안 정했다면 대략적인 날짜여도 괜찮아요"
        id="demo-date-empty"
        label="예식일 — 빈 상태"
        onChange={setValue}
        today={DEMO_TODAY}
        value={value}
      />
      <DateField
        id="demo-date-picked"
        label="예식일 — 선택됨"
        onChange={() => {}}
        today={DEMO_TODAY}
        value="2027-03-20"
      />
      <DateField
        id="demo-date-past"
        label="예식일 — 지난 날짜 (제출은 막지 않는다)"
        onChange={() => {}}
        today={DEMO_TODAY}
        value="2026-07-19"
      />
    </div>
  );
}

export function CodeInputDemo() {
  const [code, setCode] = useState("");

  return (
    <div className="flex w-full flex-col gap-4">
      {/* 직접 쳐 보는 칸. "BK7 QX2" / "bk7-qx2"를 붙여넣어도 BK7QX2가 된다. */}
      <Field help="카카오톡으로 받은 6자리를 붙여넣어 주세요" id="demo-code" label="초대 코드 — 빈 상태">
        {(control) => (
          <CodeInput
            describedBy={control["aria-describedby"]}
            id={control.id}
            label="초대 코드"
            onChange={setCode}
            value={code}
          />
        )}
      </Field>

      <Field id="demo-code-typing" label="초대 코드 — 입력 중">
        {(control) => (
          <CodeInput
            describedBy={control["aria-describedby"]}
            id={control.id}
            label="초대 코드"
            onChange={() => {}}
            value="BK7"
          />
        )}
      </Field>

      <Field error={INVITE_CODE_HINT} id="demo-code-error" label="초대 코드 — 에러">
        {(control) => (
          <CodeInput
            describedBy={control["aria-describedby"]}
            id={control.id}
            invalid
            label="초대 코드"
            onChange={() => {}}
            value="0OI1AB"
          />
        )}
      </Field>
    </div>
  );
}

export function BottomSheetDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>바텀시트 열기</Button>
      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="바텀시트"
        description="Radix Dialog 위에 직접 만든 하단 시트입니다."
        titleAction={
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="min-h-11 px-1 text-body-sm text-muted-foreground"
          >
            취소
          </button>
        }
        footer={
          <Button size="lg" className="w-full" onClick={() => setOpen(false)}>
            저장
          </Button>
        }
      >
        <p className="text-body text-muted-foreground">
          최대 높이 85dvh, 본문만 스크롤, 하단은 safe-area만큼 패딩이 붙습니다. 바깥 탭 · ESC로
          닫힙니다.
        </p>
        <p className="text-body-sm text-muted-foreground">
          드래그 핸들은 현재 시각 표식만입니다 — 제스처로 내리는 동작은 P3에서 붙입니다.
        </p>
      </BottomSheet>
    </>
  );
}

/**
 * 초대 코드 표시 + 복사/공유. 실물은 `/settings/invite`가 쓴다.
 *
 * **공유 버튼은 `navigator.share`가 있을 때만 보인다** — 데스크톱 브라우저에서 이 데모를 열면
 * 복사 하나가 전폭으로 뜨는 게 정상이다. 세로 높이는 두 경우가 같다(둘 다 h-12 한 줄).
 * 복사가 막힌 환경(비-HTTPS)에서는 버튼을 눌러 실패 문구까지 확인할 수 있다.
 */
export function CopyFieldDemo() {
  return (
    <CopyField
      badge={
        <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-1 text-caption text-muted-foreground">
          예신 자리
        </span>
      }
      caption={
        <p className="num text-body-sm text-muted-foreground">8월 3일 (일) 15:24까지 · 1회용</p>
      }
      hint="코드를 받은 사람은 우리 가계부를 함께 보게 돼요. 실수로 다른 사람이 들어왔다면 24시간 안에 설정에서 내보낼 수 있어요."
      label="초대 코드"
      shareText={"WedMate 결혼 준비 가계부에 초대할게요.\n초대 코드: K7X2M9\n48시간 안에 한 번만 쓸 수 있어요."}
      value="K7X2M9"
    />
  );
}

/**
 * 되돌리기 어려운 동작의 확인 시트. 오른쪽 것만 **게이트 체크박스**를 갖는다 —
 * 스페이스 삭제처럼 cascade로 원장이 사라지는 동작에만 붙인다.
 */
export function ConfirmSheetDemo() {
  const [open, setOpen] = useState<"regenerate" | "delete" | "failed" | null>(null);

  return (
    <div className="flex w-full flex-wrap gap-2">
      <Button onClick={() => setOpen("regenerate")} size="sm" variant="secondary">
        재발급 확인
      </Button>
      <Button onClick={() => setOpen("delete")} size="sm" variant="secondary">
        삭제 확인 — 게이트
      </Button>
      <Button onClick={() => setOpen("failed")} size="sm" variant="secondary">
        확인 후 실패
      </Button>

      {/* 실패해도 닫지 않는다 — 무엇을 확인하던 중이었는지가 시트 안에 남아야 한다. */}
      <ConfirmSheet
        action={() => {}}
        alert="보관하지 못했어요. 잠시 뒤 다시 시도해 주세요."
        body="'폐백' — 새 지출을 기록할 때 목록에서 빠져요. 이미 기록한 지출은 그대로 남고, 언제든 다시 꺼낼 수 있어요."
        cancelLabel="그대로 둘게요"
        confirmLabel="보관할게요"
        onOpenChange={(next) => setOpen(next ? "failed" : null)}
        open={open === "failed"}
        pendingLabel="보관하는 중…"
        title="소분류를 보관할까요?"
      />

      <ConfirmSheet
        action={() => setOpen(null)}
        body="지금 코드 K7X2M9는 즉시 쓸 수 없게 돼요. 이미 상대에게 보냈다면 그 코드로는 들어올 수 없어요."
        cancelLabel="그대로 둘게요"
        confirmLabel="새 코드 만들기"
        onOpenChange={(next) => setOpen(next ? "regenerate" : null)}
        open={open === "regenerate"}
        pendingLabel="코드 만드는 중…"
        title="새 코드를 만들까요?"
      />

      <ConfirmSheet
        acknowledge="예산·지출·하객 기록이 모두 지워지는 걸 이해했어요"
        action={() => setOpen(null)}
        body="예산·지출·하객·카테고리가 모두 지워져요. 되돌릴 수 없어요. 삭제하면 처음 화면으로 돌아가 새로 시작하게 돼요."
        cancelLabel="그대로 둘게요"
        confirmLabel="스페이스 삭제"
        onOpenChange={(next) => setOpen(next ? "delete" : null)}
        open={open === "delete"}
        pendingLabel="삭제하는 중…"
        title="스페이스를 삭제할까요?"
      />
    </div>
  );
}

/**
 * 카테고리 관리의 행 구조. `ListRow`의 `titleBadge` · `actionLabel` · 기본 `›`가 쓰이는 자리다.
 *
 * 🔴 **행에는 조작부가 없다** (→ D-075). 이전 버전은 행 우측에 ↑↓ 두 개를 상시로 달고
 * (`trailingAction`, D-066) `›`를 껐다 — 그 결과 "행이 눌린다"는 신호가 스크린리더
 * 전용 라벨에만 남았다. 지금은 **소분류 행 = `›`, 그룹 헤더 = `⋯`** 이고 **둘 다 같은
 * 편집 시트**를 연다 (→ D-076). 순서변경은 형제 목록 전체를 담은 별도 시트로 갔다.
 *
 * 중분류 헤더 이름은 `text-foreground`다. `text-muted-foreground`는 `bg-muted`
 * (#f4f4f5) 위에서 4.40:1로 AA 미달이다 — 토큰 주석의 4.83:1은 **흰 배경 기준**이다.
 */
export function CategoryRowsDemo() {
  const [log, setLog] = useState("아직 누른 것 없음");

  const badge = (
    <span className="shrink-0 rounded-lg border border-border bg-muted px-2 py-0.5 text-caption text-muted-foreground">
      보관됨
    </span>
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <Panel flush>
        <ul>
          <li className="border-b border-border/60">
            {/* 그룹 헤더의 이름은 **라벨이지 버튼이 아니다** — 그룹 제목이 눌리는 관례가
                없어서 버튼으로 두면 소분류 행보다 더 안 눌려 보인다. 조작은 `⋯`가 진다. */}
            <div className="flex min-h-12 items-center bg-muted pr-1.5 pl-4">
              <div className="flex min-w-0 flex-1 items-center gap-1.5 py-2">
                <span className="truncate text-body-sm font-bold">예식</span>
              </div>
              <Button
                aria-label="중분류 예식 편집"
                className="shrink-0 text-muted-foreground"
                onClick={() => setLog("중분류 예식 편집")}
                size="icon"
                variant="ghost"
              >
                <Ellipsis aria-hidden strokeWidth={2} />
              </Button>
            </div>

            <ul>
              <ListRow
                actionLabel="소분류 웨딩홀 대관 이름 변경 · 보관"
                className="pl-4"
                onClick={() => setLog("소분류 웨딩홀 대관 편집")}
                title="웨딩홀 대관"
              />
              {/* 배지는 `meta`(제목 아래)가 아니라 `titleBadge`(제목 옆)다 —
                  `meta`에 두면 이 행만 56 → 66px로 자라 세로 리듬이 쪼개진다. */}
              <ListRow
                actionLabel="소분류 폐백 이름 변경 · 보관"
                className="pl-4"
                onClick={() => setLog("소분류 폐백 편집")}
                title={<span className="text-muted-foreground">폐백</span>}
                titleBadge={badge}
              />
              <li>
                <button
                  aria-label="예식에 소분류 추가"
                  className="flex min-h-12 w-full items-center gap-2 py-2 pr-4 pl-8 text-left text-body font-medium active:bg-muted"
                  onClick={() => setLog("소분류 추가")}
                  type="button"
                >
                  <Plus aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                  소분류 추가
                </button>
              </li>
            </ul>
          </li>
        </ul>
      </Panel>

      {/* 순서 시트의 한 행. 최대 6행이라 스크롤이 없고, 재배열은 로컬이라 즉시 움직인다.
          첫 행의 ↑는 버튼만 빠지고 `size-11` 자리는 남는다 — D-067의 원칙은 폐기가
          아니라 이 시트로 이사했다. */}
      <ul className="border-y border-border">
        <li className="flex min-h-14 items-center gap-2 border-b border-border/60 pr-2 pl-4">
          <span aria-hidden className="num w-5 shrink-0 text-body-sm font-medium text-muted-foreground">
            1
          </span>
          <span className="min-w-0 flex-1 truncate text-body">웨딩홀 대관</span>
          <span aria-hidden className="size-11 shrink-0" />
          <Button
            aria-label="웨딩홀 대관 아래로"
            className="shrink-0 text-muted-foreground"
            onClick={() => setLog("웨딩홀 대관 아래로")}
            size="icon"
            variant="ghost"
          >
            <ArrowDown aria-hidden strokeWidth={2} />
          </Button>
        </li>
        <li className="flex min-h-14 items-center gap-2 pr-2 pl-4">
          <span aria-hidden className="num w-5 shrink-0 text-body-sm font-medium text-muted-foreground">
            2
          </span>
          <span className="min-w-0 flex-1 truncate text-body">폐백</span>
          <Button
            aria-label="폐백 위로"
            className="shrink-0 text-muted-foreground"
            onClick={() => setLog("폐백 위로")}
            size="icon"
            variant="ghost"
          >
            <ArrowUp aria-hidden strokeWidth={2} />
          </Button>
          <span aria-hidden className="size-11 shrink-0" />
        </li>
      </ul>

      <p className="px-0.5 text-caption text-muted-foreground">눌린 것: {log}</p>
    </div>
  );
}

/** 재시도가 실제로 동작하는 것을 보이기 위한 데모. 실물은 `(app)/error.tsx`가 쓴다. */
export function ErrorStateDemo() {
  const [tries, setTries] = useState(0);

  return (
    <ErrorState
      description="네트워크가 끊겼거나 서버가 응답하지 않았습니다. 잠시 후 다시 시도해 주세요."
      detail={`오류 코드 3f9a2c · 재시도 ${tries}회`}
      onRetry={() => setTries((prev) => prev + 1)}
      title="결산을 불러오지 못했어요"
    />
  );
}
