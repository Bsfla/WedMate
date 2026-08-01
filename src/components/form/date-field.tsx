"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { Field } from "@/components/form/field";
import { Input } from "@/components/ui/input";
import { daysUntil, formatDday, formatFullDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type DateFieldProps = {
  id: string;
  label: string;
  /** "YYYY-MM-DD" 또는 빈 문자열. 네이티브 date 입력이 내는 값 그대로다. */
  value: string;
  onChange: (value: string) => void;
  name?: string;
  /** 값이 없을 때만 보인다. 값이 들어오면 리드아웃이 이 자리를 차지한다. */
  help?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  autoFocus?: boolean;
  /** 안쪽 `<input>`에 붙는다. */
  className?: string;
  /** D-day 기준일. 갤러리·테스트에서 "지난 날짜"를 고정 재현하기 위한 통로다. */
  today?: Date;
};

/* 서버 렌더에서는 false, 하이드레이션이 끝난 뒤에는 true. 구독할 외부 스토어가 없으므로
   subscribe는 빈 해지 함수만 돌려준다 (React 공식 "클라이언트 전용 값" 패턴).
   useEffect + setState로 하면 같은 결과지만 react-compiler 린트가 막는다. */
const neverChanges = () => () => {};
const useHydrated = () => useSyncExternalStore(neverChanges, () => true, () => false);

/**
 * 날짜 필드 — 네이티브 `input[type=date]`.
 *
 * **`min`/`max`로 막지 않는다.** 예식일은 "아직 안 정했지만 대충 내년 봄"인 상태로도 입력되고,
 * 지난 날짜를 넣는 사람은 대개 결혼식을 이미 치른 뒤 정산하려는 사람이다. 둘 다 정상 사용이라
 * 제출을 막는 대신 **값을 다시 읽어 준다** — 필드 아래 "2027년 3월 20일 토요일 · D-232".
 * 요일을 붙이는 이유가 핵심이다. 예식일 오타는 자릿수가 아니라 **요일**에서 잡힌다.
 *
 * 지난 날짜는 같은 자리에서 `text-warning-strong`으로 알리되 제출은 통과시킨다.
 * (`--warning`은 흰 배경 3.18:1로 텍스트 대비 미달 → 반드시 `-strong`. D-007)
 */
export function DateField({
  id,
  label,
  value,
  onChange,
  name,
  help,
  error,
  required,
  autoFocus,
  className,
  today,
}: DateFieldProps) {
  /* 날짜 문자열 자체("2027년 3월 20일 토요일")는 시간대와 무관하지만 **D-day는 아니다** —
     서버(UTC)와 브라우저(KST)의 "오늘"이 갈리면 하이드레이션에서 텍스트가 어긋난다.
     그래서 D-day만 하이드레이션 뒤에 붙인다. 전체 날짜는 첫 페인트부터 보이므로
     "잠깐 비었다가 뜨는" 깜빡임은 없고, D-day 한 조각만 뒤늦게 따라붙는다.
     `today`를 명시로 받으면 결정적이라 바로 켠다. */
  const ready = useHydrated() || today !== undefined;

  const fullDate = formatFullDate(value);
  const diff = ready ? daysUntil(value, today) : null;
  const dday = ready ? formatDday(value, today) : null;
  const past = diff !== null && diff < 0;

  /* 리드아웃을 `Field`의 help 슬롯에 태운다 — 자리·간격 규격을 다시 적지 않아도 되고,
     `aria-describedby`가 자동으로 걸려 포커스 시 스크린리더가 요일까지 읽는다.
     에러가 생기면 `Field`가 알아서 에러로 덮는다(그때는 에러가 더 급한 정보다). */
  const readout = fullDate ? (
    past ? (
      <span className="num text-warning-strong">지난 날짜예요 · {dday}</span>
    ) : (
      <span className="num">{dday ? `${fullDate} · ${dday}` : fullDate}</span>
    )
  ) : null;

  return (
    <Field error={error} help={readout ?? help} id={id} label={label}>
      {(control) => (
        <Input
          {...control}
          autoFocus={autoFocus}
          className={cn(
            "num",
            /* ⚠️ iOS Safari는 값 텍스트를 `::-webkit-date-and-time-value` 안에 그린다.
               그 의사요소의 기본값이 `text-align: center` + `line-height: 0`이라,
               손대지 않으면 h-12 안에서 값이 **가운데로 몰리고 위로 붙어** 보인다.
               아래 세 줄이 좌측·수직 가운데로 되돌린다. 데스크톱 크롬에는 무해하다.
               — 실기기 확인 필요(에뮬레이터는 이 의사요소를 재현하지 않는다). */
            "[&::-webkit-date-and-time-value]:min-h-[1.5em]",
            "[&::-webkit-date-and-time-value]:text-left",
            "[&::-webkit-date-and-time-value]:leading-[1.5]",
            className,
          )}
          name={name}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          type="date"
          value={value}
        />
      )}
    </Field>
  );
}
