/**
 * 도메인 어휘 — 대분류 · 분류 단계 · 결제자 · 결제수단 · 결제단계 · 예랑/예신.
 *
 * 컴포넌트가 `lib/mock/fixtures`를 직접 import 하지 않게 하려고 따로 뺐다.
 * P1에서 Supabase 스키마가 붙어도 이 어휘는 그대로 살아남는다.
 */

export type MajorKey = "wedding" | "honeymoon" | "household" | "home";

/**
 * 카테고리 트리의 단계. `categories.level`이 text + CHECK라 생성 타입이 `string`으로 나오므로
 * 앱 경계에서 이 타입으로 좁힌다 (`lib/supabase/categories.ts`).
 *
 * 🔴 `lib/supabase/*`가 아니라 여기 두는 이유 — 설정 › 카테고리의 문구 모듈이 시트 제목
 * ("중분류 추가")에 이 라벨을 쓰는데, 그 모듈은 클라이언트 컴포넌트가 import한다.
 * `next/headers`에 닿는 모듈에서 가져오면 번들이 깨진다. (같은 처방 → D-064)
 */
export type CategoryLevel = "major" | "mid" | "minor";

export const CATEGORY_LEVEL_LABEL: Record<CategoryLevel, string> = {
  major: "대분류",
  mid: "중분류",
  minor: "소분류",
};
/**
 * `other`는 부모님 등 **제3자가 낸 돈**이다. 커플 돈이 아니므로 분담 정산에서 제외된다
 * (`joint`는 커플 공동계좌라 양쪽에 절반씩 귀속된다 — 둘은 다른 개념이다). → D-023
 */
export type Payer = "groom" | "bride" | "joint" | "other";
export type Method = "cash" | "card" | "voucher" | "account";
export type Stage = "deposit" | "interim" | "balance" | "full";
export type Side = "groom" | "bride";

export type Major = {
  key: MajorKey;
  label: string;
  /** Recharts와 인라인 style 양쪽에서 쓰는 CSS 변수. 다크 모드가 자동으로 따라온다. */
  color: string;
};

/** 순서가 곧 화면 표시 순서다. */
export const MAJORS: readonly Major[] = [
  { key: "wedding", label: "결혼식", color: "var(--chart-1)" },
  { key: "honeymoon", label: "신혼여행", color: "var(--chart-2)" },
  { key: "household", label: "혼수", color: "var(--chart-3)" },
  { key: "home", label: "신혼집", color: "var(--chart-4)" },
] as const;

/** 대분류의 CSS 변수 색. 화면마다 같은 헬퍼를 다시 만들지 않게 여기 둔다. */
export function majorColor(key: MajorKey): string {
  return MAJORS.find((major) => major.key === key)?.color ?? "var(--chart-5)";
}

export const MAJOR_LABEL: Record<MajorKey, string> = {
  wedding: "결혼식",
  honeymoon: "신혼여행",
  household: "혼수",
  home: "신혼집",
};

export const PAYER_LABEL: Record<Payer, string> = {
  groom: "예랑",
  bride: "예신",
  joint: "공동",
  other: "기타",
};

/** 분담 정산에 들어가는 결제자 — `other`(제3자)는 빠진다. */
export const SETTLED_PAYERS: readonly Payer[] = ["groom", "bride", "joint"] as const;

export const METHOD_LABEL: Record<Method, string> = {
  cash: "현금",
  card: "카드",
  voucher: "상품권",
  account: "계좌",
};

export const STAGE_LABEL: Record<Stage, string> = {
  deposit: "계약금",
  interim: "중도금",
  balance: "잔금",
  full: "전액",
};

export const SIDE_LABEL: Record<Side, string> = {
  groom: "예랑",
  bride: "예신",
};

/**
 * 좁은 칸(세그먼트·칩)에서 쓰는 한 글자 축약.
 * `SIDE_LABEL[side].slice(1)`로 만들지 않는다 — 라벨을 고치면 조용히 깨진다.
 */
export const SIDE_SHORT: Record<Side, string> = {
  groom: "랑",
  bride: "신",
};

export const PAYERS: readonly Payer[] = ["groom", "bride", "joint", "other"] as const;
export const METHODS: readonly Method[] = ["cash", "card", "voucher", "account"] as const;
export const STAGES: readonly Stage[] = ["deposit", "interim", "balance", "full"] as const;

/**
 * 결제자별 색 토큰. 텍스트에는 반드시 `-strong`을 쓴다 —
 * 예랑의 기본색(#0EA5E9)은 흰 배경에서 2.77:1이라 본문 대비에 못 미친다.
 */
export const PAYER_TOKEN: Record<Payer, { dot: string; text: string; soft: string }> = {
  groom: {
    dot: "var(--payer-groom)",
    text: "text-payer-groom-strong",
    soft: "bg-payer-groom-soft",
  },
  bride: {
    dot: "var(--payer-bride)",
    text: "text-payer-bride-strong",
    soft: "bg-payer-bride-soft",
  },
  joint: {
    dot: "var(--payer-joint)",
    text: "text-payer-joint-strong",
    soft: "bg-payer-joint-soft",
  },
  other: {
    dot: "var(--payer-other)",
    text: "text-payer-other-strong",
    soft: "bg-payer-other-soft",
  },
};
