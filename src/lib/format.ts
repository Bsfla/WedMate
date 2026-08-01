/**
 * 통화 · 비율 · 날짜 포맷을 이 파일 한 곳에 모은다.
 * 화면마다 제각각인 ₩ 표기를 막기 위해, 금액 렌더링은 반드시 여기를 거친다.
 */

const wonFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("ko-KR", {
  maximumFractionDigits: 0,
});

/** 1234567 -> "₩1,234,567" */
export function formatWon(value: number | null | undefined): string {
  return wonFormatter.format(Math.round(value ?? 0));
}

/** 1234567 -> "1,234,567" (입력 필드의 천단위 콤마용) */
export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(Math.round(value ?? 0));
}

function trimTrailingZero(text: string): string {
  return text.replace(/\.0$/, "");
}

/**
 * 좁은 화면의 카드·차트 축 라벨용 축약 표기.
 * 13380000 -> "1,338만", 220000 -> "22만", 126000000 -> "1.3억"
 */
export function formatCompactWon(value: number | null | undefined): string {
  const amount = Math.round(value ?? 0);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 100_000_000) {
    return `${sign}${trimTrailingZero((abs / 100_000_000).toFixed(1))}억`;
  }
  if (abs >= 10_000) {
    const man = abs / 10_000;
    return `${sign}${numberFormatter.format(Math.round(man))}만`;
  }
  return `${sign}${numberFormatter.format(abs)}`;
}

/** "1,234,000원", "12만" 등 사용자가 친 문자열에서 숫자만 뽑는다. */
export function parseAmount(input: string): number {
  const negative = input.trim().startsWith("-");
  const digits = input.replace(/[^\d]/g, "");
  if (digits === "") return 0;
  const value = Number.parseInt(digits, 10);
  return negative ? -value : value;
}

/** total이 0 이하면 0을 돌려준다 (예산 미설정 항목의 0 나눗셈 방지). */
export function ratio(part: number, total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return part / total;
}

/** 220000 / 710000 -> "31%" (시트 결산의 반올림 규칙과 동일) */
export function formatPercent(part: number, total: number): string {
  return `${Math.round(ratio(part, total) * 100)}%`;
}

/** 진행률 바 width용. 100을 넘지 않도록 자른다. */
export function clampedPercent(part: number, total: number): number {
  return Math.min(100, Math.max(0, ratio(part, total) * 100));
}

export type YearMonthDay = {
  year: number;
  month: number;
  /** 일자 미정 = 예상 지출. 시트에서 '일'을 비워두는 규칙을 그대로 따른다. */
  day: number | null;
};

/** 2026, 7, 27 -> "2026-07-27" */
export function toISODate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

/** "2026-07-27" -> { year: 2026, month: 7, day: 27 } */
export function parseISODate(iso: string): YearMonthDay | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

/** "2026년 7월" */
export function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

/** 확정 지출은 "7월 27일", 일자 미정(예상)은 "7월 중" */
export function formatDateLabel({ month, day }: YearMonthDay): string {
  return day === null ? `${month}월 중` : `${month}월 ${day}일`;
}

/* 요일까지 읽어 주는 확인용 포맷. `timeZone: "UTC"`가 핵심이다 — 아래에서 날짜를
   UTC 자정으로 만들기 때문에, 이게 없으면 UTC보다 뒤진 시간대에서 하루 전날로 찍힌다. */
const fullDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
  timeZone: "UTC",
});

/**
 * "2027-03-20" -> "2027년 3월 20일 토요일".
 * 날짜 입력의 **확인용 리드아웃** 전용이다 — 리스트·카드의 날짜는 `formatDateLabel`을 쓴다.
 * 형식이 어긋나거나 존재하지 않는 날짜("2027-02-31")면 null을 돌려준다.
 */
export function formatFullDate(isoDate: string): string | null {
  const parsed = parseISODate(isoDate);
  if (!parsed) return null;

  const date = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day ?? 1));
  // Date.UTC는 2월 31일을 3월 3일로 굴려 버린다. 굴러갔으면 입력이 틀린 것이다.
  if (date.getUTCMonth() !== parsed.month - 1) return null;

  return fullDateFormatter.format(date);
}

/** 시각을 버리고 날짜만으로 비교한다 (타임존 경계에서 D-day가 흔들리지 않게). */
export function daysUntil(isoDate: string, from: Date = new Date()): number | null {
  const target = parseISODate(isoDate);
  if (!target) return null;
  const targetUtc = Date.UTC(target.year, target.month - 1, target.day ?? 1);
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((targetUtc - fromUtc) / 86_400_000);
}

/** "D-120" / "D-DAY" / "D+3" */
export function formatDday(isoDate: string, from: Date = new Date()): string | null {
  const diff = daysUntil(isoDate, from);
  if (diff === null) return null;
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
}
