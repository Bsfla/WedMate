"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  CodeInput,
  INVITE_CODE_HINT,
  isInviteCode,
  normalizeInviteCode,
} from "@/components/form/code-input";
import { Field } from "@/components/form/field";
import { TextField } from "@/components/form/text-field";
import { SegmentedControl, type SegmentOption } from "@/components/layout/segmented-control";
import { Button } from "@/components/ui/button";
import { SIDE_LABEL, type Side } from "@/lib/domain";

import { redeemInviteAction } from "./actions";
import { focusFieldControl } from "./focus-field";
import { FormTop } from "./form-top";
import {
  MAX_DISPLAY_NAME,
  ONBOARDING_COPY,
  ONBOARDING_IDLE,
  type OnboardingState,
} from "./types";

type Mode = "create" | "join";

const MODES: readonly SegmentOption<Mode>[] = [
  { value: "create", label: "새로 만들기" },
  { value: "join", label: "초대로 참여" },
];

/** 세그먼트 아래 한 줄. 두 분기가 **무엇이 다른지**를 고르기 전에 말한다. */
const MODE_HINT: Record<Mode, string> = {
  create: "예식일만 정하면 바로 시작할 수 있어요. 상대는 나중에 초대 코드로 부르면 돼요.",
  join: "상대가 만든 스페이스에 들어갑니다. 예랑·예신은 코드에 담겨 있어 자동으로 정해져요.",
};

const SIDE_OPTIONS: readonly SegmentOption<Side>[] = [
  { value: "groom", label: SIDE_LABEL.groom },
  { value: "bride", label: SIDE_LABEL.bride },
];

/**
 * 1단계 폼. 세그먼트로 **새로 만들기 / 초대로 참여**를 가른다.
 *
 * 두 분기를 서로 다른 컴포넌트로 둔 이유는 로그인(`login-form.tsx`)과 같다 —
 * 탭을 바꾸면 통째로 언마운트돼 **이전 분기의 에러가 따라오지 않는다.**
 * 다만 `name`만은 부모가 들고 있다. 이름은 두 분기 공통이라 리마운트로 날리면
 * 탭을 잘못 눌렀던 사람이 이름을 다시 쳐야 한다.
 */
export function OnboardingForm({
  initialName,
  initialSide,
}: {
  /** 2단계에서 "고치기"로 돌아왔을 때 복원되는 값. 쿼리 파라미터가 출처다. */
  initialName: string;
  initialSide: Side | null;
}) {
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState(initialName);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {/* tone="rose" — 선택 상태의 의미가 "아래 로즈 CTA가 무엇을 할 것인가"라서
            세그먼트와 CTA가 같은 색으로 합의해야 한다. 선택 구분은 색이 아니라
            흰 알약 + 그림자라 그레이스케일에서도 살아남는다(D-006). */}
        <SegmentedControl
          label="스페이스를 새로 만들지, 초대로 참여할지"
          onChange={setMode}
          options={MODES}
          tone="rose"
          value={mode}
        />
        <p className="text-body-sm text-muted-foreground">{MODE_HINT[mode]}</p>
      </div>

      {mode === "create" ? (
        <CreateBranch initialSide={initialSide} name={name} onNameChange={setName} />
      ) : (
        <JoinBranch name={name} onNameChange={setName} />
      )}
    </div>
  );
}

/* ─────────────────────────────  공통 조각  ───────────────────────────── */

function NameField({
  error,
  onChange,
  value,
}: {
  error?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <TextField
      autoComplete="name"
      error={error}
      help="상대 화면에 이렇게 표시돼요."
      id="displayName"
      label="내 이름"
      // DB에 길이 제약이 없다. 여기서 자르지 않으면 2단계로 넘기는 URL이 무한정 길어진다.
      maxLength={MAX_DISPLAY_NAME}
      name="displayName"
      onChange={(event) => onChange(event.target.value)}
      placeholder="이름 또는 애칭"
      value={value}
    />
  );
}

/* ─────────────────────────────  새로 만들기  ───────────────────────────── */

/**
 * 이 분기의 CTA는 **서버를 부르지 않는다.** 2단계로 이동만 한다.
 *
 * 그래서 `useTransition` 안에서 `router.push`한다 — 그냥 push하면 라우트가 커밋되기 전에
 * 버튼이 즉시 되살아나 두 번 눌린다(그러면 2단계가 두 번 쌓인다).
 */
function CreateBranch({
  initialSide,
  name,
  onNameChange,
}: {
  initialSide: Side | null;
  name: string;
  onNameChange: (value: string) => void;
}) {
  const router = useRouter();
  const [side, setSide] = useState<Side | null>(initialSide);
  const [state, setState] = useState<OnboardingState>(ONBOARDING_IDLE);
  const [pending, startTransition] = useTransition();
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field && focusFieldControl(state.field)) return;
    alertRef.current?.focus();
  }, [state]);

  function handleNext() {
    const displayName = name.trim();

    if (!displayName) {
      setState({
        status: "error",
        field: "displayName",
        fieldMessage: ONBOARDING_COPY.nameRequired,
      });
      return;
    }
    // 기본값을 미리 켜 두지 않았다 — 켜 두면 절반이 잘못 배정된다(SegmentedControl의 value: null).
    if (!side) {
      setState({ status: "error", field: "side", fieldMessage: ONBOARDING_COPY.sideRequired });
      return;
    }

    setState(ONBOARDING_IDLE);
    startTransition(() => {
      // sessionStorage가 아니라 쿼리 파라미터다. 새로고침·뒤로가기·딥링크에서 살아남고,
      // 2단계의 **서버 컴포넌트**가 읽을 수 있는 유일한 통로이기도 하다.
      router.push(`/onboarding/wedding?side=${side}&name=${encodeURIComponent(displayName)}`);
    });
  }

  // 제출 중에는 이전 에러를 감춘다. 재시도 중에 낡은 문구가 남아 있지 않게.
  const shown = state.status === "error" && !pending ? state : ONBOARDING_IDLE;

  return (
    <form action={handleNext} className="flex flex-col gap-4">
      <FormTop alertRef={alertRef} state={shown} />

      <NameField
        error={shown.field === "displayName" ? shown.fieldMessage : undefined}
        onChange={onNameChange}
        value={name}
      />

      <Field
        error={shown.field === "side" ? shown.fieldMessage : undefined}
        help="상대는 자동으로 반대쪽이 돼요."
        id="side"
        label="내 역할"
      >
        {(control) => (
          <SegmentedControl
            describedBy={control["aria-describedby"]}
            id={control.id}
            invalid={control["aria-invalid"]}
            label="내 역할"
            onChange={setSide}
            options={SIDE_OPTIONS}
            tone="rose"
            value={side}
          />
        )}
      </Field>

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? "예식 정보 여는 중…" : "다음 — 예식 정보 입력"}
      </Button>
    </form>
  );
}

/* ─────────────────────────────  초대로 참여  ───────────────────────────── */

/**
 * 코드 형식 검증을 **여기(클라이언트)에서** 한다. `isInviteCode`·`INVITE_CODE_HINT`가
 * `"use client"` 모듈에 있어 서버 액션이 부를 수 없기도 하지만, 더 큰 이유는
 * O/0·I/1 오독 같은 형식 실수에 왕복을 쓸 이유가 없어서다.
 *
 * 형식이 맞는 코드만 `redeemInviteAction`으로 내려간다.
 */
async function joinAction(
  prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const code = normalizeInviteCode(String(formData.get("code") ?? ""));

  if (!isInviteCode(code)) {
    return {
      status: "error",
      field: "code",
      fieldMessage: INVITE_CODE_HINT,
      // 형식 실패는 INVALID_CODE가 아니다. 연속 실패 카운트를 건드리지 않는다.
      invalidCodeStreak: prev.invalidCodeStreak,
      codeResetToken: prev.codeResetToken,
    };
  }

  formData.set("code", code);

  // 성공하면 서버 액션이 리다이렉트하므로 이 promise는 값을 돌려주지 않는다.
  // 내비게이션이 커밋되기 전 한 프레임을 위해 이전 상태를 유지한다.
  const next: OnboardingState | undefined = await redeemInviteAction(prev, formData);
  return next ?? prev;
}

function JoinBranch({
  name,
  onNameChange,
}: {
  name: string;
  onNameChange: (value: string) => void;
}) {
  const [state, submit, pending] = useActionState<OnboardingState, FormData>(
    joinAction,
    ONBOARDING_IDLE,
  );
  const alertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status !== "error") return;
    if (state.field && focusFieldControl(state.field)) return;
    alertRef.current?.focus();
  }, [state]);

  const shown = state.status === "error" && !pending ? state : ONBOARDING_IDLE;

  return (
    <form action={submit} className="flex flex-col gap-4">
      <FormTop alertRef={alertRef} state={shown} />

      {/* key가 바뀌면 코드 입력이 리마운트되며 비워진다. COUPLE_FULL일 때만 바뀐다 —
          같은 코드를 다시 넣을 이유가 없는 유일한 실패다.
          (effect 안 setState로 비우지 않는 이유는 types.ts의 codeResetToken 주석 참조.) */}
      <InviteCodeField
        error={shown.field === "code" ? shown.fieldMessage : undefined}
        key={state.codeResetToken ?? 0}
      />

      <NameField
        error={shown.field === "displayName" ? shown.fieldMessage : undefined}
        onChange={onNameChange}
        value={name}
      />

      {/* 🔴 참여는 되돌릴 수 없다 — 스페이스를 나가는 RPC가 없다.
          버튼 바로 위에 두는 이유가 그것이다. 누르기 직전에 읽히는 자리다. */}
      <p className="text-body-sm text-muted-foreground">코드를 보낸 사람이 맞는지 확인해 주세요</p>

      <Button className="w-full" disabled={pending} size="lg" type="submit">
        {pending ? "참여하는 중…" : "참여하기"}
      </Button>
    </form>
  );
}

function InviteCodeField({ error }: { error?: string }) {
  const [code, setCode] = useState("");

  return (
    <Field
      error={error}
      /* 만료·1회성은 **상시** 노출한다. RPC가 오타·만료·사용됨을 구분해 주지 않으므로
         (코드를 긁는 쪽에 힌트를 주지 않으려는 의도다), 실패한 뒤에 알려 줄 방법이 없다. */
      help="코드는 7일 동안 한 번만 쓸 수 있어요. 안 되면 상대에게 새 코드를 받아 주세요."
      id="code"
      label="초대 코드"
    >
      {(control) => (
        <CodeInput
          describedBy={control["aria-describedby"]}
          id={control.id}
          invalid={control["aria-invalid"]}
          label="초대 코드"
          name="code"
          onChange={setCode}
          value={code}
        />
      )}
    </Field>
  );
}
