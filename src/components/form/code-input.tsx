"use client";

import { cn } from "@/lib/utils";

/** 초대 코드 길이. 서버 스키마(`couple_invites.code`)와 같은 값이다. */
export const INVITE_CODE_LENGTH = 6;

/**
 * 혼동 문자 `0` `O` `1` `I`를 뺀 32자 알파벳에서 6자리.
 * `supabase/migrations/0001_couples_and_members.sql`의 CHECK 제약과 **같은 정규식**이다.
 * 한쪽만 고치면 클라이언트는 통과시키고 DB가 거절하는 조합이 생긴다.
 */
export const INVITE_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{6}$/;

/**
 * 형식이 틀렸을 때 보여 줄 문구. "올바르지 않습니다"가 아니라 **가르친다** —
 * 이 화면에서 실제로 일어나는 실수는 O/0, I/1 오독이기 때문이다.
 */
export const INVITE_CODE_HINT =
  "코드는 숫자와 영문 6자리예요. 0 · O · 1 · I는 쓰이지 않으니 다시 확인해 주세요.";

/**
 * 화면에 넣을 값으로 다듬는다. **알파벳 밖 문자를 지우지 않는다** —
 * 방금 친 글자가 화면에 안 나타나면 사용자는 오타가 아니라 입력창이 고장 났다고 읽는다.
 * 형식 검증은 제출 시점에 `isInviteCode`로 한 번만 하고, 거기서 위 문구로 가르친다.
 *
 * 공백과 하이픈만 지운다 — 카카오톡에서 "BK7 QX2", "BK7-QX2" 꼴로 붙여넣는 일이 흔하다.
 */
export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[\s-]/g, "").slice(0, INVITE_CODE_LENGTH);
}

export function isInviteCode(value: string): boolean {
  return INVITE_CODE_PATTERN.test(value);
}

/* 자간. 마지막 글자 **뒤에도** 붙기 때문에 text-center가 그 폭만큼 왼쪽으로 밀려 보인다.
   같은 값을 왼쪽 패딩으로 되돌려 광학적 중앙을 맞춘다.
   인라인 스타일인 이유: `text-display`가 letter-spacing(-0.02em)을 함께 싣고 있어
   유틸리티 출력 순서에 기대고 싶지 않았다. — 보정량은 실물 확인 필요. */
const CODE_TRACKING = "0.28em";

type CodeInputProps = {
  value: string;
  onChange: (value: string) => void;
  label: string;
  name?: string;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
  /**
   * 아래 셋은 `Field`가 넘겨 주는 것을 **안쪽 `<input>`까지** 내리기 위한 통로다.
   * `AmountInput`과 같은 규약이다.
   */
  id?: string;
  describedBy?: string;
  invalid?: boolean;
};

/**
 * 6자리 초대 코드 입력 — **한 칸이다.**
 *
 * 분할 6칸을 쓰지 않은 이유: 이 화면의 주 경로가 **카카오톡에서 받은 코드 붙여넣기**인데,
 * 분할 칸은 붙여넣기 분배·백스페이스 역이동·중간 글자 정정·IME·스크린리더 낭독을 전부
 * 직접 구현해야 하고 정확히 거기서 깨진다. 한 칸이면 브라우저가 전부 공짜로 해 준다.
 * 잃는 것은 "6칸이 보여서 6자리인 줄 안다"뿐이고, 그건 자간 + 라벨로 대신한다.
 *
 * 높이 58px는 `AmountInput`과 **같은 값이다.** 화면에서 단 하나뿐인 히어로 입력이라는
 * 위계를 두 컴포넌트가 같은 규격으로 나눠 갖는다 (design-system.md 6-b).
 *
 * 모노스페이스를 쓰지 않는다 — 알파벳에 `0 O 1 I`가 없어 혼동 글리프 문제가 애초에 없고,
 * Pretendard 밖으로 나가면 이 한 컴포넌트만 다른 서체가 된다.
 */
export function CodeInput({
  value,
  onChange,
  label,
  name,
  autoFocus = false,
  placeholder = "------",
  className,
  id,
  describedBy,
  invalid,
}: CodeInputProps) {
  return (
    <div
      className={cn(
        "flex min-h-[58px] items-center rounded-xl border border-primary bg-card px-3.5",
        "ring-3 ring-primary-soft",
        className,
      )}
    >
      <input
        // 바깥에 보이는 <label for={id}>가 있으면 그쪽이 이름이다. aria-label을 같이 두면
        // 눈에 보이는 라벨과 낭독되는 이름이 갈리므로, id를 받은 경우엔 얹지 않는다.
        aria-label={id ? undefined : label}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        autoCapitalize="characters"
        // one-time-code를 쓰지 않는다. SMS 자동완성을 부르는데 이 코드는 카톡으로 온다 —
        // 뜨지 않는 제안 배너가 키보드 위 한 줄을 차지할 뿐이다.
        autoComplete="off"
        autoCorrect="off"
        autoFocus={autoFocus}
        id={id}
        // 숫자·영문이 섞이므로 numeric 키패드를 띄우면 절반을 칠 수 없다.
        inputMode="text"
        // maxLength를 걸지 않는다. 걸면 브라우저가 **붙여넣기를 먼저 자른다** —
        // "BK7-QX2"(7자)가 "BK7-QX"로 잘린 뒤 하이픈이 빠져 "BK7QX"(5자)가 된다.
        // 길이는 normalizeInviteCode가 하이픈·공백을 지운 **뒤에** 자른다.
        name={name}
        onChange={(event) => onChange(normalizeInviteCode(event.target.value))}
        placeholder={placeholder}
        spellCheck={false}
        style={{ letterSpacing: CODE_TRACKING, paddingLeft: CODE_TRACKING }}
        type="text"
        value={value}
        className="num w-full min-w-0 bg-transparent text-center text-display uppercase outline-none placeholder:text-muted-foreground/40"
      />
    </div>
  );
}
