import type { ReactNode } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** `Field`가 자식 입력에 그대로 펼쳐 넣으라고 건네주는 접근성 속성들. */
export type FieldControlProps = {
  id: string;
  "aria-describedby": string | undefined;
  "aria-invalid": true | undefined;
};

type FieldProps = {
  /** 라벨과 입력을 잇는 id. 도움말·에러 문구의 id도 여기서 파생된다. */
  id: string;
  label: string;
  /** 필드 아래 회색 보조 문구. 에러가 있으면 에러가 이 자리를 대신한다. */
  help?: ReactNode;
  /** 에러 문구. 무엇이 잘못됐고 어떻게 고치는지 쓴다 (design-system.md 6-b). */
  error?: ReactNode;
  children: (props: FieldControlProps) => ReactNode;
  className?: string;
};

/**
 * 라벨 + 입력 + 도움말/에러. design-system.md 6-b의 폼 필드 규격을 담는 자리다.
 *
 * 라벨 스타일(`text-caption text-muted-foreground`)을 `ui/label.tsx`가 아니라 여기서
 * 얹는 이유는 D-032에 있다 — 같은 프리미티브가 체크박스 옆 라벨로도 쓰이기 때문이다.
 *
 * **입력을 렌더 프롭으로 받는다.** `id`·`aria-describedby`·`aria-invalid`를 자식에게
 * 내려줘야 하는데, children을 그냥 ReactNode로 받으면 넘길 방법이 없어서다.
 * `Input`이든 `AmountInput`이든 `Select`든 같은 라벨·간격·에러 규격을 쓰게 된다.
 */
export function Field({ id, label, help, error, children, className }: FieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="min-h-0 text-caption text-muted-foreground" htmlFor={id}>
        {label}
      </Label>

      {children({
        id,
        "aria-describedby": error ? errorId : help ? helpId : undefined,
        "aria-invalid": error ? true : undefined,
      })}

      {error ? (
        // aria-live를 쓰지 않는다. 라이브 리전은 내용이 바뀌기 **전에** DOM에 있어야 읽히는데
        // 이 <p>는 에러와 동시에 마운트돼 상당수 AT 조합에서 침묵한다.
        // 대신 제출 실패 시 해당 입력에 포커스를 옮긴다 — 그러면 위에서 붙인
        // aria-describedby가 포커스 시점에 확실히 낭독된다. (login-form.tsx 참조)
        <p className="text-body-sm text-primary" id={errorId}>
          {error}
        </p>
      ) : help ? (
        <p id={helpId} className="text-body-sm text-muted-foreground">
          {help}
        </p>
      ) : null}
    </div>
  );
}
