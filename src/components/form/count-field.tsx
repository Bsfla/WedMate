import type { ReactNode } from "react";

import { Field } from "@/components/form/field";
import { Input } from "@/components/ui/input";
import { formatNumber, parseAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

type CountFieldProps = {
  id: string;
  label: string;
  /** 0 이상의 정수. 0은 빈 칸으로 보이고, 그 의미는 `help`가 말한다. */
  value: number;
  onChange: (value: number) => void;
  /** 값 뒤에 붙는 단위 — "명", "개", "월". 낭독은 라벨이 하므로 `aria-hidden`이다. */
  unit: string;
  help?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  autoFocus?: boolean;
  /** 안쪽 `<input>`에 붙는다. */
  className?: string;
};

/**
 * 단위 접미사가 붙는 정수 입력 — 최소보증인원(명) 같은 자리.
 *
 * **금액이 아니다.** `AmountInput`은 "원"을 박아 두고 있어 인원에는 쓸 수 없고,
 * 반대로 여기에 퀵버튼을 달지 않는다 — 보증 인원은 계약서에서 그대로 옮겨 적는 값이라
 * 더하는 제스처가 필요 없다.
 *
 * 🔴 **접미사를 그리려고 `ui/input.tsx`의 클래스 문자열을 복제하지 않는다.**
 * `Input`은 맨 `<input>`이라 형제를 안에 넣을 수 없는데, 박스를 직접 그리면
 * h-12 · 포커스 링 · `aria-invalid` · 다크 대응이 **두 벌**이 되고 다음 `npx shadcn add`
 * 때 한쪽만 어긋난다. 그래서 `Input`은 그대로 두고 접미사를 그 위에 겹친다 —
 * `pointer-events-none`이라 눌러도 아래 `<input>`이 포커스를 받고 탭 순서에도 안 들어간다.
 *
 * 🔴 **값을 FormData에 싣지 않는다.** 보이는 입력에는 콤마가 들어 있어(`1,200`)
 * 그대로 실으면 서버의 `Number()`가 `NaN`을 본다. `AmountInput`과 같은 규약으로,
 * 화면이 hidden 입력을 짝지어 숫자를 보낸다.
 */
export function CountField({
  id,
  label,
  value,
  onChange,
  unit,
  help,
  error,
  placeholder = "0",
  autoFocus,
  className,
}: CountFieldProps) {
  return (
    <Field error={error} help={help} id={id} label={label}>
      {(control) => (
        <div className="relative">
          <Input
            {...control}
            autoFocus={autoFocus}
            className={cn("num text-money-md pr-11", className)}
            // 소수점 없는 숫자 키패드. 인원은 음수가 없으므로 부호도 받지 않는다.
            inputMode="numeric"
            onChange={(event) => onChange(Math.max(0, parseAmount(event.target.value)))}
            placeholder={placeholder}
            type="text"
            value={value === 0 ? "" : formatNumber(value)}
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-money-md text-muted-foreground"
          >
            {unit}
          </span>
        </div>
      )}
    </Field>
  );
}
