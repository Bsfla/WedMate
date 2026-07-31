"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

import { Field } from "@/components/form/field";
import { FormAlert } from "@/components/form/form-alert";
import { Panel } from "@/components/data/panel";
import { SegmentedControl } from "@/components/layout/segmented-control";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { signInAction, signUpAction } from "./actions";
import { AUTH_IDLE, type AuthState } from "./types";

type Mode = "signin" | "signup";

const MODES = [
  { value: "signin" as const, label: "로그인" },
  { value: "signup" as const, label: "가입하기" },
];

function SubmitButton({ children }: { children: string }) {
  // useFormStatus는 <form>의 자식에서만 값을 읽는다. 그래서 별도 컴포넌트로 뺐다.
  const { pending } = useFormStatus();

  return (
    <Button className="w-full" disabled={pending} size="lg" type="submit">
      {pending ? "잠시만요…" : children}
    </Button>
  );
}

/** 제출 중에는 이전 에러를 감춘다. 재시도 중에 낡은 문구가 남아 있지 않게. */
function PendingAwareAlert({
  children,
  ref,
}: {
  children: string;
  ref: React.Ref<HTMLDivElement>;
}) {
  const { pending } = useFormStatus();
  if (pending) return null;
  return <FormAlert ref={ref}>{children}</FormAlert>;
}

/**
 * `mode`마다 **리마운트**된다(`key={mode}`). 그래서 `useActionState`가 한 벌만 있으면 되고,
 * 탭을 바꾸면 상태가 `AUTH_IDLE`로 초기화된다.
 *
 * 이전 구조는 `useActionState`를 두 벌 두고 `<form key={mode}>`만 리마운트했는데,
 * 훅은 부모에 남아 있어서 **로그인 실패 → 가입 탭 → 로그인 탭으로 돌아오면
 * 입력은 비었는데 예전 에러가 다시 떴다.**
 */
function AuthForm({ mode }: { mode: Mode }) {
  const [state, submit] = useActionState<AuthState, FormData>(
    mode === "signin" ? signInAction : signUpAction,
    AUTH_IDLE,
  );

  const formRef = useRef<HTMLFormElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);

  // 제출 실패 시 포커스를 옮긴다. 필드 귀속이면 그 입력으로 — 이때 Field가 붙여 둔
  // aria-describedby가 포커스 시점에 낭독되므로 라이브 리전이 필요 없다.
  useEffect(() => {
    if (state.status !== "error") return;

    if (state.field) {
      const control = formRef.current?.elements.namedItem(state.field);
      // 이름이 중복되면 RadioNodeList가 오므로 가드가 필요하다. 빼지 말 것.
      if (control instanceof HTMLInputElement) {
        control.focus();
        control.select();
      }
      return;
    }
    alertRef.current?.focus();
  }, [state]);

  const fieldError = (field: "email" | "password") =>
    state.status === "error" && state.field === field ? state.message : undefined;

  if (state.status === "check-email") {
    return (
      <Panel>
        <h2 className="text-section">메일함을 확인해 주세요</h2>
        <p className="text-body text-muted-foreground">{state.message}</p>
        {/* 이 상태는 막다른 길이었다. 폼으로 돌아갈 길을 준다 — 리마운트 구조라
            탭을 다시 누르면 상태가 초기화된다. */}
        <p className="text-body-sm text-muted-foreground">
          주소를 잘못 적었다면 위에서 탭을 다시 눌러 처음부터 진행해 주세요.
        </p>
      </Panel>
    );
  }

  return (
    <form action={submit} className="flex flex-col gap-4" ref={formRef}>
      {state.status === "error" && !state.field && (
        <PendingAwareAlert ref={alertRef}>{state.message ?? ""}</PendingAwareAlert>
      )}

      <Field error={fieldError("email")} id="email" label="이메일">
        {(control) => (
          <Input
            {...control}
            autoComplete="email"
            inputMode="email"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        )}
      </Field>

      <Field
        error={fieldError("password")}
        help={mode === "signup" ? "6자 이상" : undefined}
        id="password"
        label="비밀번호"
      >
        {(control) => (
          <Input
            {...control}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            name="password"
            required
            type="password"
          />
        )}
      </Field>

      <SubmitButton>{mode === "signin" ? "로그인" : "가입하고 시작하기"}</SubmitButton>
    </form>
  );
}

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");

  return (
    <div className="flex flex-col gap-6">
      {/* tone="rose" — 선택 상태의 의미가 "아래 로즈 CTA가 무엇을 할 것인가"라서
          세그먼트와 CTA가 같은 색으로 합의해야 한다.
          선택 구분 자체는 색이 아니라 흰 알약 + 그림자라 그레이스케일에서도 살아남는다(D-006). */}
      <SegmentedControl
        label="로그인 또는 가입"
        onChange={setMode}
        options={MODES}
        tone="rose"
        value={mode}
      />
      <AuthForm key={mode} mode={mode} />
    </div>
  );
}
