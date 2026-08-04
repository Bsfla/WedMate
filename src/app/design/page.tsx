import { Receipt } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DataRow, DataRowGroup } from "@/components/data/data-row";
import { DualProgressBar } from "@/components/data/dual-progress-bar";
import { EmptyState } from "@/components/data/empty-state";
import { InlineError } from "@/components/data/error-state";
import { Gauge } from "@/components/data/gauge";
import { CategoryMark, ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { SectionHeader } from "@/components/data/section-header";
import {
  HeroPanelSkeleton,
  ListSkeleton,
  SectionHeaderSkeleton,
  StatGridSkeleton,
} from "@/components/data/skeletons";
import { WarningBanner } from "@/components/data/warning-banner";
import { Chip, ChipDivider, ChipRow } from "@/components/layout/chip";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { StageBadge } from "@/components/money/stage-badge";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { BrandMark } from "@/components/brand/brand-mark";
import { FormAlert } from "@/components/form/form-alert";
import { TextField } from "@/components/form/text-field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MAJORS, PAYER_LABEL, PAYERS, STAGES } from "@/lib/domain";
import { formatCompactWon, formatWon } from "@/lib/format";

import {
  AmountInputBudgetDemo,
  AmountInputDemo,
  BottomSheetDemo,
  CategoryRowsDemo,
  CodeInputDemo,
  ConfirmSheetDemo,
  CopyFieldDemo,
  DateFieldDemo,
  ErrorStateDemo,
  SegmentedControlDemo,
  SegmentedControlEmptyDemo,
} from "./gallery-demos";

export const metadata: Metadata = { title: "스타일 가이드" };

/* ── 대비비는 구현 전에 직접 계산해 둔 값이다 (WCAG 2.1 상대휘도 기준, 흰 배경). ── */
const COLOR_TOKENS = [
  {
    token: "--foreground",
    hex: "#18181B",
    ratio: "17.7:1",
    pass: true,
    usage: "본문 · 제목 전부",
    fallback: null,
  },
  {
    token: "--muted-foreground",
    hex: "#71717A",
    ratio: "4.83:1",
    pass: true,
    usage: "보조 설명 · 라벨 (공동 결제자 색 겸용)",
    fallback: null,
  },
  {
    token: "--primary",
    hex: "#E11D48",
    ratio: "4.70:1",
    pass: true,
    usage: "CTA · 활성 탭 · 진행 바 · 금액 강조",
    fallback: null,
  },
  {
    token: "--warning",
    hex: "#D97706",
    ratio: "3.18:1",
    pass: false,
    usage: "배너 면 · 아이콘 · 테두리",
    fallback: "--warning-strong #B45309 (5.02:1)",
  },
  {
    token: "--success",
    hex: "#059669",
    ratio: "3.77:1",
    pass: false,
    usage: "잔액 여유 바 · 손익 아이콘",
    fallback: "--success-strong #047857 (5.48:1)",
  },
  {
    token: "--payer-groom",
    hex: "#0EA5E9",
    ratio: "2.77:1",
    pass: false,
    usage: "칩의 점 · 차트 면",
    fallback: "--payer-groom-strong #0369A1 (5.93:1)",
  },
  {
    token: "--payer-bride",
    hex: "#E11D48",
    ratio: "4.70:1",
    pass: true,
    usage: "칩 · 차트. primary · chart-1과 같은 색",
    fallback: null,
  },
  {
    token: "--payer-joint",
    hex: "#71717A",
    ratio: "4.83:1",
    pass: true,
    usage: "칩 · 차트 · 텍스트 전부",
    fallback: null,
  },
  {
    token: "--payer-other",
    hex: "#8B5CF6",
    ratio: "4.06:1",
    pass: false,
    usage: "칩의 점 · 차트 면. chart-5와 같은 색",
    fallback: "--payer-other-strong #6D28D9 (7.10:1)",
  },
] as const;

const TYPE_SCALE = [
  { name: "display", spec: "32 / 1.15 · 700 · -0.02em", cls: "text-display", sample: "₩26,000,000" },
  { name: "title", spec: "20 / 1.30 · 600 · -0.02em", cls: "text-title", sample: "우리 결혼 준비" },
  { name: "section", spec: "16 / 1.40 · 600 · -0.01em", cls: "text-section", sample: "대분류별 소진율" },
  {
    name: "body",
    spec: "15 / 1.55 · 400 · -0.01em",
    cls: "text-body",
    sample: "스튜디오 스냅 계약금을 모스앤코튼에 결제했습니다.",
  },
  {
    name: "body-sm",
    spec: "13 / 1.45 · 400",
    cls: "text-body-sm",
    sample: "날짜를 비워두면 예상 지출로 기록되어 월별 현금 흐름에 반영됩니다.",
  },
  { name: "caption", spec: "12 / 1.40 · 500", cls: "text-caption", sample: "예신 · 현금 · 계약금" },
  { name: "money-lg", spec: "24 / 1.20 · 700 · -0.02em", cls: "text-money-lg num", sample: "₩3,744,000" },
  { name: "money-md", spec: "17 / 1.30 · 600 · -0.01em", cls: "text-money-md num", sample: "₩1,840,000" },
  { name: "money-sm", spec: "15 / 1.30 · 500 · -0.01em", cls: "text-money-sm num", sample: "₩220,000" },
] as const;

const DENSITY = [
  { label: "기존 default · h-8", px: 32, old: true },
  { label: "기존 lg · h-9", px: 36, old: true },
  { label: "신규 sm · h-9", px: 36, old: false },
  { label: "신규 default · h-11", px: 44, old: false },
  { label: "신규 lg · h-12", px: 48, old: false },
  { label: "리스트 행 최소", px: 56, old: false },
];

function Section({
  num,
  title,
  description,
  children,
}: {
  num: string;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 pt-12">
      <div className="flex flex-col gap-1.5 border-b border-border pb-3">
        <span className="font-mono text-[11px] tracking-[0.14em] text-primary uppercase">{num}</span>
        <h2 className="text-2xl font-bold tracking-tight text-balance">{title}</h2>
        {description && <p className="max-w-[62ch] text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Cell({ name, caption, children }: { name: string; caption: string; children: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border">
      <div className="flex flex-col gap-0.5 border-b border-border px-3.5 py-2.5">
        <span className="font-mono text-[11px] text-foreground">{name}</span>
        <span className="text-[11.5px] text-muted-foreground">{caption}</span>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2.5 bg-background p-4">{children}</div>
    </div>
  );
}

export default function DesignPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 pb-24">
      <header className="flex flex-col gap-4 pt-16">
        <span className="font-mono text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
          Phase PD · 스타일 가이드
        </span>
        <h1 className="text-4xl font-extrabold tracking-tighter text-balance sm:text-5xl">
          WedMate 디자인 시스템
        </h1>
        <p className="max-w-[64ch] text-body text-muted-foreground">
          5탭 화면이 실제로 쓰는 토큰·타입·밀도 규칙과 컴포넌트 갤러리입니다. 아래 조각들은 앱과{" "}
          <b className="font-semibold text-foreground">같은 컴포넌트를 그대로 렌더</b>하므로 화면과
          어긋날 수 없습니다.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {[
            { href: "/?fixture=rich", label: "rich — 기본" },
            { href: "/?fixture=sheet", label: "sheet — 시트 실측치" },
            { href: "/?fixture=empty", label: "empty — 빈 상태" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border px-3 py-2 font-mono text-[11.5px] text-muted-foreground transition-colors hover:border-primary hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      {/* ── 01 컬러 ── */}
      <Section
        num="01 / COLOR"
        title="컬러 토큰과 대비 검증"
        description={
          <>
            토큰 세 개는 흰 배경에서 WCAG AA(본문 4.5:1)에 미달합니다. 면·테두리·아이콘 전용으로
            쓰고, 텍스트가 필요한 자리에는 <code className="font-mono text-xs">-strong</code> 토큰을
            씁니다.
          </>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[680px] border-collapse text-body-sm">
            <thead>
              <tr className="border-b border-border">
                {["", "토큰", "HEX", "흰 배경 대비", "사용 범위", "본문용 대체"].map((head) => (
                  <th
                    key={head}
                    className="px-3.5 py-2.5 text-left font-mono text-[10.5px] font-medium tracking-[0.1em] text-muted-foreground uppercase"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COLOR_TOKENS.map((row) => (
                <tr key={row.token + row.usage} className="border-b border-border/60 last:border-b-0">
                  <td className="px-3.5 py-2.5">
                    <span
                      className="inline-block h-5 w-8 rounded border border-foreground/10"
                      style={{ backgroundColor: row.hex }}
                    />
                  </td>
                  <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap">{row.token}</td>
                  <td className="px-3.5 py-2.5 font-mono text-xs whitespace-nowrap">{row.hex}</td>
                  <td
                    className={`px-3.5 py-2.5 font-mono text-xs font-bold whitespace-nowrap ${
                      row.pass ? "text-success-strong" : "text-warning-strong"
                    }`}
                  >
                    {row.ratio} {row.pass ? "✓" : "✗"}
                  </td>
                  <td className="px-3.5 py-2.5 text-muted-foreground">{row.usage}</td>
                  <td className="px-3.5 py-2.5 font-mono text-xs text-muted-foreground">
                    {row.fallback ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {MAJORS.map((major) => (
            <div key={major.key} className="flex flex-col gap-1.5 rounded-xl border border-border p-3">
              <span className="h-10 rounded-lg" style={{ backgroundColor: major.color }} />
              <span className="text-body-sm font-semibold">{major.label}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{major.color}</span>
            </div>
          ))}
        </div>

        <Panel className="gap-2">
          <p className="text-body font-semibold">색만으로 정보를 전달하지 않는다</p>
          <p className="text-body-sm text-muted-foreground">
            구분해야 할 축이 세 개(확정/예상 · 결제자 3종 · 대분류 4종)라 색에만 기대면 색각 이상
            사용자에게 무너집니다. 확정은 <b className="text-foreground">채운 막대</b>, 예상은{" "}
            <b className="text-foreground">점선 + 45° 사선 패턴 + &quot;예상&quot; 배지</b>로 구분하고,
            결제자와 대분류는 색과 함께 <b className="text-foreground">텍스트 라벨을 항상 병기</b>
            합니다. 그레이스케일로 렌더해도 모든 구분이 살아남습니다.
          </p>
        </Panel>
      </Section>

      {/* ── 02 타이포 ── */}
      <Section
        num="02 / TYPE"
        title="타이포그래피 — Pretendard 9단 스케일"
        description={
          <>
            한글은 라틴보다 크게 잡아야 읽힙니다. 본문 15px 기준, 금액은 별도 3단. 전역으로{" "}
            <code className="font-mono text-xs">word-break: keep-all</code>과 금액{" "}
            <code className="font-mono text-xs">tabular-nums</code>를 겁니다.
          </>
        }
      >
        <div className="flex flex-col overflow-hidden rounded-xl border border-border">
          {TYPE_SCALE.map((row) => (
            <div
              key={row.name}
              className="grid gap-2 border-b border-border/60 px-4 py-3.5 last:border-b-0 sm:grid-cols-[168px_1fr] sm:items-baseline sm:gap-5"
            >
              <div className="font-mono text-[11px] leading-relaxed text-muted-foreground">
                <b className="block font-semibold tracking-[0.04em] text-primary">{row.name}</b>
                {row.spec}
              </div>
              <div className={row.cls}>{row.sample}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── 03 밀도 ── */}
      <Section
        num="03 / DENSITY"
        title="밀도 — 44px 규칙"
        description={
          <>
            radix-nova 프리셋은 데스크톱 밀도(default 32px, lg 36px)라 &quot;터치 타깃 최소 44px&quot;
            원칙을 지킬 수 없어 <code className="font-mono text-xs">ui/button.tsx</code>의 size
            variant를 교체했습니다.
          </>
        }
      >
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-border p-5">
          {DENSITY.map((item) => (
            <div key={item.label} className="flex flex-col items-start gap-2">
              <span className="font-mono text-[10.5px] tracking-wider text-muted-foreground">
                {item.label}
              </span>
              <div
                className={`flex items-center justify-center rounded-lg px-4 font-mono text-[11px] font-semibold text-primary-foreground ${
                  item.old ? "bg-muted-foreground" : "bg-primary"
                }`}
                style={{ height: item.px }}
              >
                {item.px}
              </div>
            </div>
          ))}
        </div>

        <WarningBanner
          title="ui/button.tsx는 shadcn 업스트림 파일입니다"
          description="npx shadcn add button을 다시 돌리면 size variant가 덮어써집니다. 파일 상단 주석에 같은 경고를 남겨 두었습니다."
        />

        <Panel className="gap-1.5">
          <p className="text-body-sm text-muted-foreground">
            · sm(36px) 칩·필터는 바깥 간격 8px을 더해 44px 터치 영역을 확보합니다.
          </p>
          <p className="text-body-sm text-muted-foreground">· 인접 터치 타깃 사이 최소 8px 간격.</p>
          <p className="text-body-sm text-muted-foreground">
            · 입력 필드 폰트는 16px 이상 — iOS가 포커스 시 화면을 자동 확대하지 않게 합니다. 덕분에
            확대를 봉인(<code className="font-mono text-xs">maximum-scale=1</code>)하지 않아도 됩니다.
          </p>
        </Panel>
      </Section>

      {/* ── 04 금액 표기 ── */}
      <Section
        num="04 / MONEY"
        title="금액 표기 규칙"
        description={
          <>
            화면마다 제각각인 ₩ 표기를 막기 위해 금액은 반드시{" "}
            <code className="font-mono text-xs">MoneyText</code> 또는{" "}
            <code className="font-mono text-xs">lib/format.ts</code>를 거칩니다.
          </>
        }
      >
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Cell name="formatWon()" caption="기본 표기 — 리스트 · 카드 · 합계">
            <div className="num flex flex-col gap-1 text-body">
              <span>{formatWon(220_000)}</span>
              <span>{formatWon(13_380_000)}</span>
              <span>{formatWon(0)}</span>
            </div>
          </Cell>
          <Cell name="formatCompactWon()" caption="차트 축 · 좁은 칩 전용">
            <div className="num flex flex-col gap-1 text-body">
              <span>{formatCompactWon(220_000)}</span>
              <span>{formatCompactWon(13_380_000)}</span>
              <span>{formatCompactWon(126_000_000)}</span>
            </div>
          </Cell>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-3">
          <Cell name="size=display" caption="홈 총예산 · 최종 손익">
            <MoneyText value={26_000_000} size="display" />
          </Cell>
          <Cell name="size=lg / md / sm" caption="카드 · 리스트 행 · 보조">
            <div className="flex flex-col gap-1">
              <MoneyText value={3_744_000} size="lg" />
              <MoneyText value={1_840_000} size="md" />
              <MoneyText value={220_000} size="sm" />
            </div>
          </Cell>
          <Cell name="signed / muted" caption="손익 부호 · 예상 지출">
            <div className="flex flex-col gap-1">
              <MoneyText value={3_180_000} size="md" signed className="text-success-strong" />
              <MoneyText value={550_000} size="md" muted />
            </div>
          </Cell>
        </div>
      </Section>

      {/* ── 05 컴포넌트 ── */}
      <Section
        num="05 / PARTS"
        title="컴포넌트 갤러리"
        description={
          <>
            진행률 바·게이지·소진율은 전부 <code className="font-mono text-xs">div + role=&quot;progressbar&quot;</code>
            로 만듭니다 — Recharts보다 가볍고, 스크린리더가 값을 읽고, 다크 대응이 자동입니다.
            Recharts는 월별 타임라인 하나에만 씁니다.
          </>
        }
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Cell name="money/payer-chip" caption="색 + 텍스트 라벨 병기">
            <PayerChip payer="groom" />
            <PayerChip payer="bride" />
            <PayerChip payer="joint" />
            <PayerChip payer="other" />
          </Cell>

          <Cell name="money/stage-badge" caption="잔금만 앰버로 승격">
            {STAGES.map((stage) => (
              <StageBadge key={stage} stage={stage} />
            ))}
          </Cell>

          <Cell name="money/estimate-badge" caption="점선 = 예상. 색 없이도 구분">
            <EstimateBadge />
            <EstimateBadge label="예상 지출로 저장됩니다" />
          </Cell>

          <Cell name="ui/button" caption="44 / 48 / 36px 스케일">
            <Button>저장</Button>
            <Button variant="secondary">취소</Button>
            <Button size="sm" variant="outline">
              필터
            </Button>
          </Cell>

          <Cell name="data/progress-bar" caption="단일 진행률 (role=progressbar)">
            <div className="flex w-full flex-col gap-2">
              <ProgressBar value={220_000} total={710_000} label="스튜디오 스냅 진행률" />
              <ProgressBar
                thin
                value={384_000}
                total={400_000}
                color="var(--warning)"
                label="상견례 식사 진행률"
              />
            </div>
          </Cell>

          <Cell name="data/dual-progress-bar" caption="확정(채움) + 예상(사선)">
            <DualProgressBar
              confirmed={3_744_000}
              estimated={5_000_000}
              total={26_000_000}
              label="총 예산 소진율"
            />
          </Cell>

          <Cell name="data/gauge" caption="예상 참석 vs 최소보증 갭">
            <div className="w-full">
              <Gauge
                value={207}
                max={251}
                marker={220}
                label="예상 참석 207명, 최소보증 220명"
                caption="207 / 최소보증 220"
              />
            </div>
          </Cell>

          <Cell name="layout/segmented-control" caption="38px + 패딩 3px = 44px">
            <div className="w-full">
              <SegmentedControlDemo />
            </div>
          </Cell>

          <Cell name="money/amount-input" caption="numeric 키패드 · 콤마 · 퀵버튼">
            <div className="w-full">
              <AmountInputDemo />
            </div>
          </Cell>

          <Cell name="money/amount-input" caption='steps="budget" — 총예산 · 저축 목표'>
            <div className="w-full">
              <AmountInputBudgetDemo />
            </div>
          </Cell>

          <Cell name="data/warning-banner" caption="면 D97706 / 글자 B45309">
            <div className="flex w-full flex-col gap-2.5">
              <WarningBanner
                title="배분액을 ₩380,000 초과"
                description="배분을 늘리거나 세부 항목을 줄이세요"
              />
              <WarningBanner
                tone="info"
                title="월별 예상 금액에 반영됩니다"
                description="확정 지출 합계에는 포함되지 않습니다"
              />
            </div>
          </Cell>

          <Cell name="data/list-row" caption="최소 56px · 예상은 사선 배경">
            <ul className="w-full overflow-hidden rounded-xl border border-border bg-card">
              <ListRow
                leading={<CategoryMark label="스드" color="var(--chart-1)" />}
                title="스튜디오 스냅"
                meta={<PayerChip payer="bride" />}
                trailing={<MoneyText value={220_000} />}
                trailingCaption="07.27"
              />
              <ListRow
                estimated
                leading={<CategoryMark label="예식" color="var(--chart-1)" />}
                title="청첩장"
                meta={<EstimateBadge />}
                trailing={<MoneyText value={250_000} muted />}
                trailingCaption="날짜 미정"
              />
            </ul>
          </Cell>

          <Cell name="layout/bottom-sheet" caption="Radix Dialog 기반 · 85dvh">
            <BottomSheetDemo />
          </Cell>

          <Cell name="data/copy-field" caption="폴백의 본체는 버튼이 아니라 값이다(D-062)">
            <div className="w-full">
              <CopyFieldDemo />
            </div>
          </Cell>

          <Cell name="layout/confirm-sheet" caption="잃는 것을 구체적으로 · 제출 중엔 안 닫힘">
            <ConfirmSheetDemo />
          </Cell>

          <Cell name="data/list-row" caption="href/onClick — 행 전체가 터치 타깃">
            <ul className="w-full overflow-hidden rounded-xl border border-border bg-card">
              <ListRow
                href="/design"
                title="카테고리 관리"
                meta={
                  <span className="text-body-sm text-muted-foreground">대분류 · 중분류 · 소분류</span>
                }
              />
              <ListRow
                href="/design"
                title="예식 정보"
                meta={
                  <span className="text-body-sm text-muted-foreground">
                    예식일 · 최소보증인원 · 평균 축의금
                  </span>
                }
              />
            </ul>
          </Cell>

          <Cell
            name="data/list-row — titleBadge · 카테고리 트리"
            caption="행 = › · 그룹 헤더 = ⋯ · 순서는 별도 시트 (D-075 · D-076)"
          >
            <CategoryRowsDemo />
          </Cell>

          <Cell name="data/section-header" caption="위 20px / 아래 8px로 스스로 당겨 붙는다">
            <div className="flex w-full flex-col gap-4">
              <SectionHeader
                title="최근 지출"
                meta="12건"
                action={
                  <a className="text-body-sm font-semibold text-primary" href="/design">
                    전체 보기
                  </a>
                }
              />
              <Panel flush>
                <ul>
                  <ListRow title="스튜디오 스냅" trailing={<MoneyText value={220_000} />} />
                </ul>
              </Panel>
              <SectionHeader level="sub" title="2026년 7월" meta={formatWon(1_240_000)} />
            </div>
          </Cell>

          <Cell name="data/data-row" caption="라벨 — 값. 화면이 손으로 짜던 조립">
            <Panel className="w-full">
              <MoneyText size="lg" value={4_320_000} />
              <DataRowGroup divided>
                <DataRow label="예상 축의금" value={9_660_000} />
                <DataRow label="결혼식 예산 합계" minus value={5_340_000} />
                <DataRow
                  hint="예상 참석 207명 · 최소보증 220명"
                  label="보증인원 부족 추가분"
                  minus
                  tone="warning"
                  value={585_000}
                />
              </DataRowGroup>
            </Panel>
          </Cell>

          <Cell name="layout/chip" caption="36px + 8px 간격 = 44px 터치(D-031)">
            <div className="w-full overflow-hidden">
              <ChipRow label="결제자 필터">
                <Chip selected>결제자 전체</Chip>
                <Chip>예랑</Chip>
                <Chip>예신</Chip>
                <ChipDivider />
                <Chip variant="solid" selected>
                  스드메 › 드레스
                </Chip>
              </ChipRow>
            </div>
          </Cell>

          <Cell name="data/panel" caption="tone — 강조 면을 화면이 손으로 안 적게">
            <div className="grid w-full gap-2">
              {(["default", "accent", "success", "warning", "muted"] as const).map((tone) => (
                <Panel className="p-3" key={tone} tone={tone}>
                  <span className="font-mono text-[11px]">tone=&quot;{tone}&quot;</span>
                </Panel>
              ))}
            </div>
          </Cell>

          <Cell name="data/empty-state" caption="?fixture=empty에서 전 탭 확인">
            <div className="w-full">
              <EmptyState
                icon={Receipt}
                title="아직 기록한 지출이 없어요"
                description="오른쪽 아래 + 버튼으로 첫 지출을 남겨보세요"
                action={<Button size="sm">지출 추가</Button>}
              />
            </div>
          </Cell>

          <Cell name="data/empty-state" caption="bordered — 점선. 비어 있음의 그릇">
            <div className="w-full">
              <EmptyState
                bordered
                icon={Receipt}
                title="조건에 맞는 지출이 없어요"
                description="필터를 지우면 12건이 모두 보입니다"
                action={
                  <Button size="sm" variant="secondary">
                    필터 지우기
                  </Button>
                }
              />
            </div>
          </Cell>
        </div>
      </Section>

      {/* ── 08 상태 ── */}
      <Section
        num="06 / STATES"
        title="빈 상태 · 로딩 · 에러 — 화면마다 다시 만들지 않는다"
        description={
          <>
            기본 상태만 그린 화면은 미완성입니다. 로딩 골격은{" "}
            <b className="font-semibold text-foreground">높이를 실제 컴포넌트에서 따와</b> 데이터가
            도착할 때 레이아웃이 튀지 않게 하고, 에러 문구는 무엇이 잘못됐는지가 아니라{" "}
            <b className="font-semibold text-foreground">어떻게 고치는지</b>를 씁니다. 부분 실패는
            화면 전체를 갈아엎지 않고 <code className="font-mono text-xs">InlineError</code>로 그
            자리에만 놓습니다.
          </>
        }
      >
        <div className="grid gap-2.5 lg:grid-cols-2">
          <Cell name="data/skeletons" caption="탭 전환 골격 — (app)/loading.tsx가 쓴다">
            <div className="w-full max-w-[420px]">
              <div className="flex flex-col gap-4">
                <HeroPanelSkeleton />
                <StatGridSkeleton />
                <SectionHeaderSkeleton />
                <ListSkeleton rows={3} />
              </div>
            </div>
          </Cell>

          <div className="flex flex-col gap-2.5">
            <Cell name="data/error-state" caption="화면 단위 실패 — (app)/error.tsx가 쓴다">
              <div className="w-full">
                <ErrorStateDemo />
              </div>
            </Cell>

            <Cell name="data/error-state" caption="InlineError — 부분 실패. 나머지는 살아 있다">
              <div className="w-full">
                <InlineError message="이번 달 합계를 불러오지 못했어요. 아래 목록은 정상입니다." />
              </div>
            </Cell>

            <Cell name="layout/screen" caption="블록 리듬 — 16px 기본, 섹션 헤더만 20/8">
              <ul className="flex w-full flex-col gap-1.5 text-body-sm text-muted-foreground">
                <li>
                  본문 직계 자식 간격 <b className="font-semibold text-foreground">16px</b> — Screen이
                  단독으로 정한다
                </li>
                <li>
                  섹션 헤더 위 <b className="font-semibold text-foreground">20px</b> / 아래{" "}
                  <b className="font-semibold text-foreground">8px</b> — 헤더가 자기 블록에 붙는다
                </li>
                <li>패널 내부 12px · 패널 패딩 16px</li>
                <li>
                  화면에서 <code className="font-mono text-xs">mt-*</code>로 간격을 덧대지 않는다
                </li>
              </ul>
            </Cell>
          </div>
        </div>
      </Section>

      {/* ── 06 폼 프리미티브 ── */}
      <Section
        num="07 / FORM"
        title="폼 — 조립 컴포넌트와 44px 프리미티브"
        description={
          <>
            두 층입니다. <code className="font-mono text-xs">components/form/*</code>는{" "}
            <b className="font-semibold text-foreground">의미론</b>(라벨 규격 · 도움말 · 에러 ·
            <code className="font-mono text-xs">aria-describedby</code>)을,{" "}
            <code className="font-mono text-xs">ui/*</code>는{" "}
            <b className="font-semibold text-foreground">밀도만</b> 책임집니다(D-032). 아래
            프리미티브 7종은 radix-nova의 데스크톱 밀도(h-8 = 32px)라 받은 직후 48px/16px로
            손봤고, 각 파일 상단에 덮어쓰기 경고 주석을 남겼습니다.{" "}
            <code className="font-mono text-xs">npx shadcn add</code>를 다시 돌리면 이 규격이
            사라지므로 주석의 표대로 되돌려야 합니다.
          </>
        }
      >
        <div className="grid gap-2.5 lg:grid-cols-2">
          <Cell name="form/text-field" caption="Field + Input. 라벨·도움말·에러 한 벌">
            <div className="flex w-full flex-col gap-4">
              <TextField
                defaultValue="김서연"
                help="청첩장에 들어갈 이름이 아니라 앱에서 서로를 부르는 이름이에요"
                id="demo-tf-name"
                label="이름"
                placeholder="이름"
              />
              <TextField
                defaultValue="김"
                error="이름이 한 글자예요. 서로를 알아볼 수 있게 두 글자 이상으로 적어 주세요."
                id="demo-tf-error"
                label="이름 — 에러"
              />
            </div>
          </Cell>

          <Cell name="layout/segmented-control" caption="미선택(value=null) + invalid 링">
            <SegmentedControlEmptyDemo />
          </Cell>

          <Cell name="form/date-field" caption="네이티브 date · 요일 리드아웃 · D-day">
            <DateFieldDemo />
          </Cell>

          <Cell name="form/code-input" caption="6자리 한 칸 · 58px(AmountInput과 동일)">
            <CodeInputDemo />
          </Cell>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Cell name="ui/input" caption="h-8 → h-12 (48px) · 16px">
            <div className="flex w-full flex-col gap-2">
              <Input placeholder="you@example.com" type="email" />
              <Input aria-invalid defaultValue="잘못된 값" />
              <Input disabled placeholder="비활성" />
            </div>
          </Cell>

          <Cell name="ui/label + input" caption="Field가 얹을 라벨 규격 미리보기">
            <div className="flex w-full flex-col gap-1.5">
              <Label className="min-h-0 text-caption text-muted-foreground" htmlFor="demo-email">
                이메일
              </Label>
              <Input id="demo-email" placeholder="you@example.com" type="email" />
              <p className="text-body-sm text-muted-foreground">
                로그인 링크를 이 주소로 보냅니다
              </p>
            </div>
          </Cell>

          <Cell name="ui/input (에러)" caption="--destructive = --primary라 규격 일치">
            <div className="flex w-full flex-col gap-1.5">
              <Input aria-invalid defaultValue="AB12" />
              <p className="text-body-sm text-primary">
                초대 코드를 찾을 수 없어요. 6자리를 다시 확인해 주세요.
              </p>
            </div>
          </Cell>

          <Cell name="ui/select" caption="트리거 48px · 항목 최소 44px">
            <div className="w-full">
              <Select defaultValue="bride">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="결제자" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>결제자</SelectLabel>
                    {PAYERS.map((payer) => (
                      <SelectItem key={payer} value={payer}>
                        {PAYER_LABEL[payer]}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </Cell>

          <Cell name="ui/checkbox" caption="상자 20px · 히트 영역 44px">
            <div className="flex w-full flex-col gap-1">
              {[
                { id: "sig-1", label: "과거 경조사 참석" },
                { id: "sig-2", label: "청첩장 모임" },
                { id: "sig-3", label: "친분" },
              ].map((item, index) => (
                <div key={item.id} className="flex items-center gap-3">
                  <Checkbox id={item.id} defaultChecked={index === 0} />
                  <Label htmlFor={item.id}>{item.label}</Label>
                </div>
              ))}
            </div>
          </Cell>

          <Cell name="ui/switch" caption="트랙 40×24 · 히트 영역 44px">
            <div className="flex w-full flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="pm-1">예신 현금</Label>
                <Switch id="pm-1" defaultChecked />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="pm-2">예랑 상품권</Label>
                <Switch id="pm-2" />
              </div>
            </div>
          </Cell>

          <Cell name="ui/separator" caption="규격 변경 없음 — 덮어써도 무해">
            <div className="flex w-full flex-col gap-3">
              <span className="text-body-sm text-muted-foreground">결혼식</span>
              <Separator />
              <span className="text-body-sm text-muted-foreground">신혼여행</span>
            </div>
          </Cell>

          <Cell name="ui/skeleton" caption="규격 변경 없음 — 크기는 호출부가 정한다">
            <div className="flex w-full flex-col gap-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-12 w-full" />
            </div>
          </Cell>

          <Cell name="규격 대조" caption="nova 기본값 → 이 저장소">
            <dl className="flex w-full flex-col gap-1.5 font-mono text-[11.5px]">
              {[
                ["input", "h-8 · 32px", "h-12 · 48px"],
                ["select trigger", "h-8 · 32px", "h-12 · 48px"],
                ["select item", "py-1 · 26px", "min-h-11 · 44px"],
                ["checkbox 히트", "40×32px", "44×44px"],
                ["switch 히트", "56×36px", "64×44px"],
              ].map(([name, before, after]) => (
                <div key={name} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground">{name}</dt>
                  <dd className="flex items-baseline gap-1.5">
                    <span className="text-muted-foreground line-through">{before}</span>
                    <span className="text-foreground">{after}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </Cell>
        </div>
      </Section>

      {/* ── 07 브랜드 ── */}
      <Section
        num="08 / BRAND"
        title="WedMate 마크와 로크업"
        description={
          <>
            마크는 <b className="font-semibold text-foreground">진행률 링</b>입니다 — 결혼반지이면서
            동시에 이 앱의 예산 소진율 게이지입니다. 앱 전체가 진행률 바·게이지로 말하므로 아이콘과
            제품이 같은 시각 언어를 씁니다. 같은 기하가{" "}
            <code className="font-mono text-xs">brand-mark.tsx</code> ·{" "}
            <code className="font-mono text-xs">lib/brand/app-icon.tsx</code> ·{" "}
            <code className="font-mono text-xs">app/icon.svg</code> 세 곳에 있고(색 모델이 달라 코드
            공유 불가) <b className="font-semibold text-foreground">한 곳을 고치면 셋 다 고칩니다.</b>
          </>
        }
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <Cell name="brand/brand-mark" caption="progress 0 / .35 / .7 / 1">
            <div className="flex w-full items-center justify-around">
              {[0, 0.35, 0.7, 1].map((p) => (
                <BrandMark className="size-10" key={p} progress={p} />
              ))}
            </div>
          </Cell>

          <Cell name="brand/brand-mark" caption="16px에서도 형태가 남는가">
            <div className="flex w-full items-end justify-around">
              {["size-4", "size-6", "size-9", "size-14"].map((size) => (
                <BrandMark className={size} key={size} />
              ))}
            </div>
          </Cell>

          {/* 근사치가 아니라 **실제 배포되는 파일**을 그대로 띄운다.
              /icon.svg는 파비콘, /brand/mark-*.png는 매니페스트가 참조하는 바로 그 자산이다. */}
          <Cell name="app/icon.svg" caption="실제 파비콘 파일 · 16 / 32 / 56px">
            <div className="flex w-full items-end justify-around">
              {[16, 32, 56].map((px) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  alt={`WedMate 아이콘 ${px}px`}
                  height={px}
                  key={px}
                  src="/icon.svg"
                  width={px}
                />
              ))}
            </div>
          </Cell>

          <Cell name="brand/mark-*.png" caption="ImageResponse가 빌드 때 만든 래스터">
            <div className="flex w-full items-end justify-around">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="WedMate 192px 아이콘" height={48} src="/brand/mark-192.png" width={48} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="WedMate 512px 아이콘 (iOS 마스크 미리보기)"
                className="rounded-[22%]"
                height={48}
                src="/brand/mark-512.png"
                width={48}
              />
            </div>
          </Cell>

          <Cell name="brand/brand-lockup" caption="stacked — 로그인·온보딩 첫 화면">
            <div className="w-full">
              <BrandLockup as="p" tagline="둘이 함께 쓰는 결혼 준비 가계부" />
            </div>
          </Cell>

          <Cell name="brand/brand-lockup" caption="inline — 온보딩 2단계 상단">
            <div className="w-full">
              <BrandLockup as="p" layout="inline" />
            </div>
          </Cell>

          <Cell name="form/form-alert" caption="폼 단위 에러 · role=alert">
            <div className="w-full">
              <FormAlert>이메일 또는 비밀번호가 맞지 않아요. 다시 확인해 주세요.</FormAlert>
            </div>
          </Cell>

          <Cell name="auth-wash" caption="불투명 토큰 2정지점 — color-mix 없음">
            <div className="auth-wash h-24 w-full rounded-xl border border-border" />
          </Cell>
        </div>
      </Section>
    </div>
  );
}
