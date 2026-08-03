import type { ComponentProps, ReactNode } from "react";

import { Field } from "@/components/form/field";
import { Input } from "@/components/ui/input";

type TextFieldProps = Omit<
  ComponentProps<"input">,
  // 이 셋은 `Field`가 만들어 내려 준다. 바깥에서 덮어쓰면 라벨·에러 연결이 끊긴다.
  "id" | "aria-describedby" | "aria-invalid"
> & {
  id: string;
  label: string;
  help?: ReactNode;
  /** 무엇이 잘못됐고 **어떻게 고치는지** 쓴다 (design-system.md 6-b). */
  error?: ReactNode;
  /** 바깥 `Field` 래퍼에 붙는다. `className`은 안쪽 `<input>`으로 간다. */
  fieldClassName?: string;
};

/**
 * 한 줄 텍스트 필드 = `Field` + `Input`.
 *
 * `Field`를 렌더 프롭으로 직접 쓰는 것과 결과가 같지만, 온보딩 2곳 + `/settings/*` 다수가
 * 같은 세 줄을 반복하게 된다. 반복되면 어느 화면에선가 `aria-describedby`를 빠뜨린다 —
 * 그 실수를 구조적으로 못 하게 막는 것이 이 컴포넌트의 존재 이유다.
 */
export function TextField({
  id,
  label,
  help,
  error,
  fieldClassName,
  ...inputProps
}: TextFieldProps) {
  return (
    <Field className={fieldClassName} error={error} help={help} id={id} label={label}>
      {(control) => <Input {...control} {...inputProps} />}
    </Field>
  );
}
