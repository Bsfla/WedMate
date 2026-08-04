"use client";

import { formatNumber, parseAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * 퀵버튼 프리셋. 자릿수가 세 단위나 다른 금액들이 이 컴포넌트를 공유한다 —
 * 1인당 금액(수만 원) · 지출 한 건(수십만 원) · 총 가용예산(수천만 원)이다.
 * 각 프리셋은 `1× / 5× / 10×` 한 벌이고 base만 다르다.
 *
 * `unit`이 따로 있는 이유는 자릿수 때문만이 아니다. **1인 식대·평균 축의금은 채우는 값이
 * 아니라 조정하는 값이다** — DB 기본값(70,000 / 80,000)이 이미 들어 있고 실제 편집은
 * `7만 → 9만`이거나 `7만 → 7만 7천`(부가세 포함 견적)이다. 여기에 `expense`를 쓰면
 * +100만을 한 번 잘못 눌러도 1인 식대가 107만 원이 되고, 그 값은 부족분 식대를 거쳐
 * 하객 탭에 억 단위 헛경고로 나온다.
 */
const STEP_PRESETS = {
  unit: [
    { label: "+1천", amount: 1_000 },
    { label: "+5천", amount: 5_000 },
    { label: "+1만", amount: 10_000 },
  ],
  expense: [
    { label: "+1만", amount: 10_000 },
    { label: "+10만", amount: 100_000 },
    { label: "+100만", amount: 1_000_000 },
  ],
  budget: [
    { label: "+100만", amount: 1_000_000 },
    { label: "+500만", amount: 5_000_000 },
    { label: "+1,000만", amount: 10_000_000 },
  ],
} as const;

type AmountInputProps = {
  value: number;
  onChange: (value: number) => void;
  label: string;
  autoFocus?: boolean;
  /** 퀵버튼 단위. 총예산·저축 목표처럼 자릿수가 큰 자리에 `budget`을 쓴다. */
  steps?: keyof typeof STEP_PRESETS;
  /**
   * `hero`(기본) — 58px · 26px 볼드 · 로즈 테두리 상시. **화면에 하나뿐인 주인공 입력.**
   * `field` — 48px · 17px. 여러 값을 한 벌로 받는 폼에서 쓴다.
   *
   * 로즈 테두리 + `ring-3`는 포커스 표시가 아니라 "이 화면에서 칠 곳은 여기"라는 표식이라
   * 정의상 한 화면에 하나만 성립한다. 금액 필드가 셋인 화면에서 그대로 쓰면 위계 없는
   * 로즈 상자 세 개가 된다 — 그때는 히어로를 조용하게 만드는 게 아니라 **히어로를 없앤다.**
   */
  variant?: "hero" | "field";
  className?: string;
  /**
   * 아래 셋은 `Field`가 넘겨 주는 것을 **안쪽 `<input>`까지** 내리기 위한 통로다.
   * 바깥 래퍼가 들고 있으면 포커스가 input에 있을 때 에러 문구가 낭독되지 않는다 —
   * `aria-describedby`는 포커스된 요소의 것만 읽히기 때문이다.
   */
  id?: string;
  describedBy?: string;
  invalid?: boolean;
};

/**
 * 금액 입력. 숫자 키패드 + 천단위 자동 콤마 + 퀵버튼.
 *
 * 두 밀도를 갖는다(`variant`). 둘 다 값 글자가 **16px 이상**인 것이 규격의 핵심이다 —
 * 입력 필드가 16px 미만이면 iOS가 포커스 시 화면을 자동 확대한다. 그걸 막으려고
 * `maximum-scale=1`로 확대를 봉인하면 접근성이 깨지므로, 폰트 쪽을 키워 해결한다.
 * `hero`는 26px, `field`는 `text-money-md`(17px)다.
 */
export function AmountInput({
  value,
  onChange,
  label,
  autoFocus = false,
  steps = "expense",
  variant = "hero",
  className,
  id,
  describedBy,
  invalid,
}: AmountInputProps) {
  const hero = variant === "hero";

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border px-3.5",
          hero
            ? "min-h-[58px] border-primary bg-card ring-3 ring-primary-soft"
            : /* `ui/input.tsx`와 같은 규격이다. 포커스 링을 바깥 상자가 지므로 `focus-within`이고,
                 안쪽 <input>은 `outline-none`이라 링이 두 겹으로 겹치지 않는다. */
              [
                "min-h-12 border-input bg-transparent dark:bg-input/30",
                "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
                invalid &&
                  "border-destructive ring-3 ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
              ],
        )}
      >
        <input
          // 소수점 없는 숫자 키패드를 띄운다.
          inputMode="numeric"
          type="text"
          // 바깥에 보이는 <label for={id}>가 있으면 그쪽이 이름이다. aria-label을 같이 두면
          // 눈에 보이는 라벨과 낭독되는 이름이 갈리므로, id를 받은 경우엔 얹지 않는다.
          aria-label={id ? undefined : label}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          id={id}
          autoFocus={autoFocus}
          value={value === 0 ? "" : formatNumber(value)}
          placeholder="0"
          onChange={(event) => onChange(parseAmount(event.target.value))}
          className={cn(
            "num min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60",
            hero
              ? "text-[1.625rem] leading-tight font-bold tracking-tight"
              : "text-money-md",
          )}
        />
        <span className="shrink-0 text-money-md text-muted-foreground">원</span>
      </div>

      <div className="flex gap-1.5">
        {STEP_PRESETS[steps].map((step) => (
          <button
            key={step.label}
            type="button"
            onClick={() => onChange(value + step.amount)}
            className="h-9 flex-1 rounded-[10px] border border-border text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {step.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange(0)}
          className="h-9 flex-1 rounded-[10px] border border-border text-body-sm font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          지우기
        </button>
      </div>
    </div>
  );
}
