/**
 * 시안·퍼블리싱 단계의 목업 데이터.
 *
 * 화면은 반드시 `getMockHome()` 같은 선택자 함수 하나만 호출한다.
 * P2~P5에서 이 함수들의 본문만 Supabase 쿼리로 바꾸면 화면 코드는 손대지 않는다.
 *
 * 집계는 전부 원시 배열(budgets / expenses / guests)에서 파생시킨다.
 * 합계를 손으로 적어두면 항목을 하나 고칠 때마다 숫자가 어긋나기 때문이다.
 * 덕분에 `sheet` 세트는 시트 실측치를 자동으로 재현한다.
 */

import { ratio } from "@/lib/format";
import {
  MAJOR_LABEL,
  MAJORS,
  type Major,
  type MajorKey,
  type Method,
  type Payer,
  type Side,
  type Stage,
} from "@/lib/domain";

/* ─────────────────────────────  타입  ───────────────────────────── */

export type FixtureKey = "rich" | "sheet" | "empty";

type RawBudget = {
  major: MajorKey;
  /** 중분류 */
  mid: string;
  /** 소분류 — fixture 안에서 유일하며 지출과 이어주는 키다. */
  minor: string;
  amount: number;
  vendor?: string;
  referenceUrl?: string;
  note?: string;
};

type RawExpense = {
  id: string;
  major: MajorKey;
  mid: string;
  minor: string;
  amount: number;
  year: number;
  month: number;
  /** null = 일자 미정 = 예상 지출. 시트에서 '일'을 비워두는 규칙 그대로다. */
  day: number | null;
  payer: Payer;
  method: Method;
  stage: Stage;
  vendor?: string;
  memo?: string;
};

type RawGuest = {
  id: string;
  side: Side;
  name: string;
  companionCount: number;
  /** [과거 경조사 참석, 청첩장 모임, 친분] — 하나라도 true면 참석 예상 */
  signals: [boolean, boolean, boolean];
};

type RawSavingsGoal = {
  label: string;
  accountName: string;
  targetAmount: number;
  currentAmount: number;
  monthlyAmount: number;
};

type RawFixture = {
  coupleName: string;
  weddingDate: string;
  totalBudget: number;
  guestMinGuarantee: number;
  avgGiftAmount: number;
  /** 최소보증인원 미달 시 1인당 추가로 물게 되는 식대 */
  mealCostPerHead: number;
  allocations: Record<MajorKey, number>;
  budgets: RawBudget[];
  expenses: RawExpense[];
  guests: RawGuest[];
  savingsGoals: RawSavingsGoal[];
};

/* ─────────────────────────────  상수  ───────────────────────────── */

/**
 * D-day를 `new Date()`로 계산하면 정적 프리렌더 시점에 얼어붙어 배포 뒤 값이 어긋난다.
 * 목업 단계에서는 기준일을 고정해 결정적으로 만든다. 실제 데이터가 붙는 P6에서 걷어낸다.
 */
export const MOCK_TODAY = new Date("2026-07-29T00:00:00Z");

/* ───────────────────────  원시 데이터: rich  ─────────────────────── */

/**
 * 결혼식 소분류는 시트 `1.예산`의 실측 항목(상견례 식사·청모·드레스·주례·스튜디오 스냅)을
 * 그대로 쓰고, 나머지는 합계가 13,380,000이 되도록 채운 **가정값**이다.
 * 결혼식 외 3개 대분류의 배분액도 기획안에 없어 시안용 **가정값**이다.
 */
const RICH_BUDGETS: RawBudget[] = [
  // ── 결혼식 (합계 13,380,000 — 배분 13,000,000보다 380,000 많다: 초과 경고 대상)
  {
    major: "wedding",
    mid: "상견례",
    minor: "상견례 식사",
    amount: 400_000,
    vendor: "한일관",
    note: "8인 예약, 룸 확정",
  },
  { major: "wedding", mid: "상견례", minor: "청첩장 모임", amount: 500_000, note: "범수 포함 3회" },
  {
    major: "wedding",
    mid: "스드메",
    minor: "드레스",
    amount: 1_100_000,
    vendor: "마리에르",
    referenceUrl: "https://example.com/review/dress",
    note: "가봉 2회 포함",
  },
  {
    major: "wedding",
    mid: "스드메",
    minor: "스튜디오 스냅",
    amount: 710_000,
    vendor: "모스앤코튼",
    referenceUrl: "https://example.com/review/studio",
    note: "원본 전체 + 보정 15장",
  },
  { major: "wedding", mid: "스드메", minor: "신부 메이크업", amount: 700_000, vendor: "제니하우스" },
  { major: "wedding", mid: "스드메", minor: "본식 스냅", amount: 550_000 },
  { major: "wedding", mid: "스드메", minor: "부케", amount: 170_000 },
  {
    major: "wedding",
    mid: "예식",
    minor: "웨딩홀 대관",
    amount: 5_200_000,
    vendor: "라비돌",
    note: "단독홀, 최소보증 220명",
  },
  { major: "wedding", mid: "예식", minor: "주례", amount: 1_000_000, note: "후보 미정" },
  { major: "wedding", mid: "예식", minor: "청첩장", amount: 250_000 },
  { major: "wedding", mid: "예식", minor: "폐백", amount: 300_000 },
  { major: "wedding", mid: "예식", minor: "사회·축가", amount: 400_000 },
  { major: "wedding", mid: "예식", minor: "주차·기타", amount: 600_000 },
  { major: "wedding", mid: "예단", minor: "예단·예물", amount: 1_500_000 },

  // ── 신혼여행 (합계 4,900,000)
  { major: "honeymoon", mid: "항공", minor: "항공권", amount: 1_900_000, vendor: "대한항공" },
  { major: "honeymoon", mid: "숙박", minor: "리조트 숙박", amount: 2_200_000, note: "6박 8일" },
  { major: "honeymoon", mid: "현지", minor: "현지 경비", amount: 800_000 },

  // ── 혼수 (합계 4,650,000)
  { major: "household", mid: "가전", minor: "냉장고", amount: 1_800_000 },
  { major: "household", mid: "가전", minor: "세탁기", amount: 1_200_000 },
  { major: "household", mid: "가구", minor: "침대", amount: 900_000 },
  { major: "household", mid: "가구", minor: "소파", amount: 750_000 },

  // ── 신혼집 (합계 2,800,000)
  { major: "home", mid: "인테리어", minor: "도배·장판", amount: 1_200_000 },
  { major: "home", mid: "인테리어", minor: "조명", amount: 400_000 },
  { major: "home", mid: "이사", minor: "이사비", amount: 700_000 },
  { major: "home", mid: "이사", minor: "입주청소", amount: 500_000 },
];

/** 시트 `2.지출`의 실측 1건 + 화면 밀도 확인을 위한 가정값 7건. */
const SHEET_EXPENSE: RawExpense = {
  id: "e-studio",
  major: "wedding",
  mid: "스드메",
  minor: "스튜디오 스냅",
  amount: 220_000,
  year: 2026,
  month: 7,
  day: 27,
  payer: "bride",
  method: "cash",
  stage: "deposit",
  vendor: "모스앤코튼",
  memo: "원본 전체 포함 조건으로 계약",
};

const RICH_EXPENSES: RawExpense[] = [
  {
    id: "e-meal",
    major: "wedding",
    mid: "상견례",
    minor: "상견례 식사",
    amount: 384_000,
    year: 2026,
    month: 7,
    day: 5,
    payer: "groom",
    method: "card",
    stage: "full",
    vendor: "한일관",
  },
  {
    id: "e-dress",
    major: "wedding",
    mid: "스드메",
    minor: "드레스",
    amount: 300_000,
    year: 2026,
    month: 7,
    day: 12,
    payer: "groom",
    method: "card",
    stage: "deposit",
    vendor: "마리에르",
  },
  {
    id: "e-hall-deposit",
    major: "wedding",
    mid: "예식",
    minor: "웨딩홀 대관",
    amount: 1_000_000,
    year: 2026,
    month: 7,
    day: 18,
    payer: "joint",
    method: "account",
    stage: "deposit",
    vendor: "라비돌",
  },
  SHEET_EXPENSE,
  {
    id: "e-invitation",
    major: "wedding",
    mid: "예식",
    minor: "청첩장",
    amount: 250_000,
    year: 2026,
    month: 7,
    day: null,
    payer: "bride",
    method: "card",
    stage: "full",
  },
  {
    id: "e-flight",
    major: "honeymoon",
    mid: "항공",
    minor: "항공권",
    amount: 1_840_000,
    year: 2026,
    month: 8,
    day: 14,
    payer: "joint",
    method: "account",
    stage: "full",
    vendor: "대한항공",
  },
  {
    id: "e-snap-balance",
    major: "wedding",
    mid: "스드메",
    minor: "본식 스냅",
    amount: 550_000,
    year: 2026,
    month: 8,
    day: null,
    payer: "bride",
    method: "card",
    stage: "balance",
  },
  {
    id: "e-hall-balance",
    major: "wedding",
    mid: "예식",
    minor: "웨딩홀 대관",
    amount: 4_200_000,
    year: 2026,
    month: 9,
    day: null,
    payer: "joint",
    method: "account",
    stage: "balance",
    vendor: "라비돌",
  },
];

/** 참석 예상 합계가 시트 실측치인 207명이 되도록 구성했다. */
const RICH_GUESTS: RawGuest[] = [
  { id: "g-church", side: "groom", name: "교회 청년부", companionCount: 149, signals: [true, true, true] },
  { id: "g-beomsu", side: "groom", name: "범수네 가족", companionCount: 19, signals: [true, true, true] },
  { id: "g-highschool", side: "groom", name: "고등학교 친구들", companionCount: 7, signals: [true, false, true] },
  { id: "g-club", side: "groom", name: "동호회", companionCount: 3, signals: [false, false, false] },
  { id: "g-exwork", side: "groom", name: "前 직장 동료", companionCount: 1, signals: [false, false, false] },
  { id: "g-aunt", side: "bride", name: "큰이모", companionCount: 3, signals: [true, true, false] },
  { id: "g-marketing", side: "bride", name: "회사 마케팅팀", companionCount: 11, signals: [false, true, false] },
  { id: "g-father", side: "bride", name: "아버지 지인", companionCount: 12, signals: [true, false, false] },
  { id: "g-univ", side: "bride", name: "대학 동기 (지방)", companionCount: 2, signals: [false, false, false] },
  { id: "g-cousin", side: "bride", name: "사촌 형", companionCount: 0, signals: [false, false, false] },
  { id: "g-parents", side: "bride", name: "부모님 지인", companionCount: 5, signals: [false, false, false] },
];

const RICH_SAVINGS: RawSavingsGoal[] = [
  {
    label: "예식 자금 통장",
    accountName: "신한 커플적금",
    targetAmount: 20_000_000,
    currentAmount: 12_000_000,
    monthlyAmount: 1_500_000,
  },
];

const BASE_ALLOCATIONS: Record<MajorKey, number> = {
  wedding: 13_000_000,
  honeymoon: 5_000_000,
  household: 5_000_000,
  home: 3_000_000,
};

const FIXTURES: Record<FixtureKey, RawFixture> = {
  rich: {
    coupleName: "우리 결혼",
    weddingDate: "2026-11-14",
    totalBudget: 26_000_000,
    guestMinGuarantee: 220,
    avgGiftAmount: 80_000,
    mealCostPerHead: 70_000,
    allocations: BASE_ALLOCATIONS,
    budgets: RICH_BUDGETS,
    expenses: RICH_EXPENSES,
    guests: RICH_GUESTS,
    savingsGoals: RICH_SAVINGS,
  },
  // 기획안 "검증 방법"의 시트 실측치를 그대로 재현하는 회귀 세트.
  sheet: {
    coupleName: "우리 결혼",
    weddingDate: "2026-11-14",
    totalBudget: 26_000_000,
    guestMinGuarantee: 220,
    avgGiftAmount: 80_000,
    mealCostPerHead: 70_000,
    allocations: BASE_ALLOCATIONS,
    budgets: RICH_BUDGETS,
    expenses: [SHEET_EXPENSE],
    guests: RICH_GUESTS,
    savingsGoals: RICH_SAVINGS,
  },
  empty: {
    coupleName: "우리 결혼",
    weddingDate: "2026-11-14",
    totalBudget: 0,
    guestMinGuarantee: 0,
    avgGiftAmount: 0,
    mealCostPerHead: 0,
    allocations: { wedding: 0, honeymoon: 0, household: 0, home: 0 },
    budgets: [],
    expenses: [],
    guests: [],
    savingsGoals: [],
  },
};

/* ────────────────────────  fixture 해석  ───────────────────────── */

const FIXTURE_KEYS: readonly FixtureKey[] = ["rich", "sheet", "empty"];

/** `?fixture=` 쿼리값을 검증한다. 알 수 없는 값이면 기본 세트로 떨어진다. */
export function resolveFixtureKey(value: string | string[] | undefined): FixtureKey {
  const raw = Array.isArray(value) ? value[0] : value;
  return FIXTURE_KEYS.includes(raw as FixtureKey) ? (raw as FixtureKey) : "rich";
}

function fixture(key: FixtureKey): RawFixture {
  return FIXTURES[key];
}

/* ───────────────────────────  파생 집계  ─────────────────────────── */

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

const isConfirmed = (expense: RawExpense): boolean => expense.day !== null;

export type ExpenseView = {
  id: string;
  major: MajorKey;
  majorLabel: string;
  mid: string;
  minor: string;
  amount: number;
  year: number;
  month: number;
  day: number | null;
  isEstimated: boolean;
  payer: Payer;
  method: Method;
  stage: Stage;
  vendor?: string;
  memo?: string;
};

function toExpenseView(expense: RawExpense): ExpenseView {
  return {
    ...expense,
    majorLabel: MAJOR_LABEL[expense.major],
    isEstimated: !isConfirmed(expense),
  };
}

function confirmedTotal(data: RawFixture): number {
  return sum(data.expenses.filter(isConfirmed).map((expense) => expense.amount));
}

function estimatedTotal(data: RawFixture): number {
  return sum(data.expenses.filter((expense) => !isConfirmed(expense)).map((expense) => expense.amount));
}

/** 소분류별 확정 지출 합. 진행률·잔액의 분자가 된다. */
function spentByMinor(data: RawFixture): Map<string, number> {
  const map = new Map<string, number>();
  for (const expense of data.expenses.filter(isConfirmed)) {
    map.set(expense.minor, (map.get(expense.minor) ?? 0) + expense.amount);
  }
  return map;
}

function spentByMajor(data: RawFixture): Record<MajorKey, number> {
  const result: Record<MajorKey, number> = { wedding: 0, honeymoon: 0, household: 0, home: 0 };
  for (const expense of data.expenses.filter(isConfirmed)) {
    result[expense.major] += expense.amount;
  }
  return result;
}

function budgetSumByMajor(data: RawFixture): Record<MajorKey, number> {
  const result: Record<MajorKey, number> = { wedding: 0, honeymoon: 0, household: 0, home: 0 };
  for (const budget of data.budgets) {
    result[budget.major] += budget.amount;
  }
  return result;
}

/* ─────────────────────────────  홈  ──────────────────────────────── */

export type HomeView = {
  coupleName: string;
  weddingDate: string;
  totalBudget: number;
  confirmedSpent: number;
  estimatedSpent: number;
  remaining: number;
  remainingAfterEstimate: number;
  thisMonthConfirmed: number;
  thisMonthEstimated: number;
  thisMonthLabel: string;
  /** 잔금 단계인데 아직 날짜가 안 잡힌 건 — 홈 경고 배너의 근거 */
  unpaidBalances: ExpenseView[];
  recentExpenses: ExpenseView[];
  savingsGoals: (RawSavingsGoal & { percent: number })[];
  isEmpty: boolean;
};

export function getMockHome(key: FixtureKey): HomeView {
  const data = fixture(key);
  const confirmed = confirmedTotal(data);
  const estimated = estimatedTotal(data);

  const month = MOCK_TODAY.getUTCMonth() + 1;
  const year = MOCK_TODAY.getUTCFullYear();
  const inThisMonth = data.expenses.filter(
    (expense) => expense.year === year && expense.month === month,
  );

  // 확정 건은 최근 날짜순, 날짜 미정(예상)은 그 뒤로 민다.
  const recent = [...data.expenses]
    .sort((a, b) => {
      if (a.day === null && b.day !== null) return 1;
      if (a.day !== null && b.day === null) return -1;
      return b.year - a.year || b.month - a.month || (b.day ?? 0) - (a.day ?? 0);
    })
    .slice(0, 5)
    .map(toExpenseView);

  return {
    coupleName: data.coupleName,
    weddingDate: data.weddingDate,
    totalBudget: data.totalBudget,
    confirmedSpent: confirmed,
    estimatedSpent: estimated,
    remaining: data.totalBudget - confirmed,
    remainingAfterEstimate: data.totalBudget - confirmed - estimated,
    thisMonthConfirmed: sum(inThisMonth.filter(isConfirmed).map((expense) => expense.amount)),
    thisMonthEstimated: sum(
      inThisMonth.filter((expense) => !isConfirmed(expense)).map((expense) => expense.amount),
    ),
    thisMonthLabel: `${month}월`,
    unpaidBalances: data.expenses
      .filter((expense) => expense.stage === "balance" && !isConfirmed(expense))
      .map(toExpenseView),
    recentExpenses: recent,
    savingsGoals: data.savingsGoals.map((goal) => ({
      ...goal,
      percent: Math.round(ratio(goal.currentAmount, goal.targetAmount) * 100),
    })),
    isEmpty: data.expenses.length === 0 && data.budgets.length === 0,
  };
}

/* ────────────────────────────  예산  ─────────────────────────────── */

export type BudgetLine = {
  minor: string;
  mid: string;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  vendor?: string;
  referenceUrl?: string;
  note?: string;
};

export type BudgetMajorView = Major & {
  allocation: number;
  budgetSum: number;
  spent: number;
  percent: number;
  /** 세부 예산 합이 배분액을 넘은 금액. 0이면 정상. */
  overBy: number;
  lines: BudgetLine[];
};

export type BudgetView = {
  totalBudget: number;
  allocatedTotal: number;
  unallocated: number;
  majors: BudgetMajorView[];
  overAllocated: BudgetMajorView[];
  isEmpty: boolean;
};

export function getMockBudget(key: FixtureKey): BudgetView {
  const data = fixture(key);
  const spentMinor = spentByMinor(data);
  const spentMajor = spentByMajor(data);
  const budgetSums = budgetSumByMajor(data);

  const majors: BudgetMajorView[] = MAJORS.map((major) => {
    const allocation = data.allocations[major.key];
    const budgetSum = budgetSums[major.key];
    const spent = spentMajor[major.key];

    return {
      ...major,
      allocation,
      budgetSum,
      spent,
      percent: Math.round(ratio(spent, allocation) * 100),
      overBy: Math.max(0, budgetSum - allocation),
      lines: data.budgets
        .filter((budget) => budget.major === major.key)
        .map((budget) => {
          const lineSpent = spentMinor.get(budget.minor) ?? 0;
          return {
            minor: budget.minor,
            mid: budget.mid,
            amount: budget.amount,
            spent: lineSpent,
            remaining: budget.amount - lineSpent,
            percent: Math.round(ratio(lineSpent, budget.amount) * 100),
            vendor: budget.vendor,
            referenceUrl: budget.referenceUrl,
            note: budget.note,
          };
        })
        .sort((a, b) => b.percent - a.percent || b.amount - a.amount),
    };
  });

  const allocatedTotal = sum(MAJORS.map((major) => data.allocations[major.key]));

  return {
    totalBudget: data.totalBudget,
    allocatedTotal,
    unallocated: data.totalBudget - allocatedTotal,
    majors,
    overAllocated: majors.filter((major) => major.overBy > 0),
    isEmpty: data.budgets.length === 0,
  };
}

/* ────────────────────────────  지출  ─────────────────────────────── */

export type ExpenseMonthGroup = {
  year: number;
  month: number;
  label: string;
  confirmed: number;
  estimated: number;
  total: number;
  expenses: ExpenseView[];
};

export type ExpensesView = {
  count: number;
  confirmedTotal: number;
  estimatedTotal: number;
  groups: ExpenseMonthGroup[];
  isEmpty: boolean;
};

export function getMockExpenses(key: FixtureKey): ExpensesView {
  const data = fixture(key);
  const buckets = new Map<string, RawExpense[]>();

  for (const expense of data.expenses) {
    const bucketKey = `${expense.year}-${String(expense.month).padStart(2, "0")}`;
    const bucket = buckets.get(bucketKey);
    if (bucket) bucket.push(expense);
    else buckets.set(bucketKey, [expense]);
  }

  const groups: ExpenseMonthGroup[] = [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([bucketKey, items]) => {
      const [year, month] = bucketKey.split("-").map(Number);
      const confirmed = sum(items.filter(isConfirmed).map((expense) => expense.amount));
      const estimated = sum(items.filter((expense) => !isConfirmed(expense)).map((expense) => expense.amount));

      return {
        year,
        month,
        label: `${year}년 ${month}월`,
        confirmed,
        estimated,
        total: confirmed + estimated,
        // 확정 건을 날짜 내림차순으로 먼저, 날짜 미정은 맨 뒤로.
        expenses: [...items]
          .sort((a, b) => {
            if (a.day === null && b.day !== null) return 1;
            if (a.day !== null && b.day === null) return -1;
            return (b.day ?? 0) - (a.day ?? 0);
          })
          .map(toExpenseView),
      };
    });

  return {
    count: data.expenses.length,
    confirmedTotal: confirmedTotal(data),
    estimatedTotal: estimatedTotal(data),
    groups,
    isEmpty: data.expenses.length === 0,
  };
}

/* ────────────────────────────  결산  ─────────────────────────────── */

export type SettlementView = {
  groomDirect: number;
  brideDirect: number;
  jointTotal: number;
  groomBurden: number;
  brideBurden: number;
  total: number;
  perPerson: number;
  /** 정산해야 할 금액. 0이면 이미 균등하다. */
  transferAmount: number;
  from: Payer | null;
  to: Payer | null;
};

export type TimelinePoint = {
  label: string;
  confirmed: number;
  estimated: number;
};

export type ReportView = {
  confirmedTotal: number;
  estimatedTotal: number;
  majors: BudgetMajorView[];
  lines: BudgetLine[];
  settlement: SettlementView;
  timeline: TimelinePoint[];
  isEmpty: boolean;
};

export function getMockReport(key: FixtureKey): ReportView {
  const data = fixture(key);
  const budget = getMockBudget(key);
  const confirmed = data.expenses.filter(isConfirmed);

  const groomDirect = sum(confirmed.filter((e) => e.payer === "groom").map((e) => e.amount));
  const brideDirect = sum(confirmed.filter((e) => e.payer === "bride").map((e) => e.amount));
  const jointTotal = sum(confirmed.filter((e) => e.payer === "joint").map((e) => e.amount));

  // 공동계좌 지출은 양쪽에 1/2씩 귀속시킨다.
  const groomBurden = groomDirect + jointTotal / 2;
  const brideBurden = brideDirect + jointTotal / 2;
  const total = groomDirect + brideDirect + jointTotal;
  const perPerson = total / 2;
  const gap = groomBurden - perPerson;

  // 월별 타임라인은 지출이 있는 달만 뽑되, 확정·예상 2계열로 나눈다.
  const monthKeys = [
    ...new Set(data.expenses.map((e) => `${e.year}-${String(e.month).padStart(2, "0")}`)),
  ].sort();

  const timeline: TimelinePoint[] = monthKeys.map((monthKey) => {
    const [year, month] = monthKey.split("-").map(Number);
    const items = data.expenses.filter((e) => e.year === year && e.month === month);
    return {
      label: `${month}월`,
      confirmed: sum(items.filter(isConfirmed).map((e) => e.amount)),
      estimated: sum(items.filter((e) => !isConfirmed(e)).map((e) => e.amount)),
    };
  });

  return {
    confirmedTotal: confirmedTotal(data),
    estimatedTotal: estimatedTotal(data),
    majors: budget.majors,
    lines: budget.majors
      .flatMap((major) => major.lines)
      .filter((line) => line.spent > 0 || line.amount > 0)
      .sort((a, b) => b.percent - a.percent || b.amount - a.amount),
    settlement: {
      groomDirect,
      brideDirect,
      jointTotal,
      groomBurden,
      brideBurden,
      total,
      perPerson,
      transferAmount: Math.abs(Math.round(gap)),
      from: gap === 0 ? null : gap > 0 ? "bride" : "groom",
      to: gap === 0 ? null : gap > 0 ? "groom" : "bride",
    },
    timeline,
    isEmpty: data.expenses.length === 0,
  };
}

/* ────────────────────────────  하객  ─────────────────────────────── */

export type GuestView = {
  id: string;
  side: Side;
  name: string;
  companionCount: number;
  headCount: number;
  signals: [boolean, boolean, boolean];
  signalCount: number;
  expectedAttend: boolean;
};

export type GuestsView = {
  teamCount: number;
  guests: GuestView[];
  expectedHeadCount: number;
  minGuarantee: number;
  /** 양수면 최소보증인원에 미달 — 경고 대상 */
  gap: number;
  shortfallCost: number;
  avgGiftAmount: number;
  expectedGift: number;
  actualGift: number;
  weddingBudget: number;
  netBeforeShortfall: number;
  netAfterShortfall: number;
  isEmpty: boolean;
};

export function getMockGuests(key: FixtureKey): GuestsView {
  const data = fixture(key);

  const guests: GuestView[] = data.guests.map((guest) => {
    const signalCount = guest.signals.filter(Boolean).length;
    return {
      ...guest,
      headCount: 1 + guest.companionCount,
      signalCount,
      // 신호가 하나라도 있으면 참석으로 본다 (시트의 판정 규칙 그대로).
      expectedAttend: signalCount > 0,
    };
  });

  const expectedHeadCount = sum(
    guests.filter((guest) => guest.expectedAttend).map((guest) => guest.headCount),
  );
  const gap = Math.max(0, data.guestMinGuarantee - expectedHeadCount);
  const expectedGift = expectedHeadCount * data.avgGiftAmount;
  const weddingBudget = budgetSumByMajor(data).wedding;
  const shortfallCost = gap * data.mealCostPerHead;

  return {
    teamCount: guests.length,
    guests,
    expectedHeadCount,
    minGuarantee: data.guestMinGuarantee,
    gap,
    shortfallCost,
    avgGiftAmount: data.avgGiftAmount,
    expectedGift,
    // 실제 축의금은 예식 당일 입력한다. 목업에서는 아직 0.
    actualGift: 0,
    weddingBudget,
    netBeforeShortfall: expectedGift - weddingBudget,
    netAfterShortfall: expectedGift - weddingBudget - shortfallCost,
    isEmpty: guests.length === 0,
  };
}
