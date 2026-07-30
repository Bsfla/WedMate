import { Receipt } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DualProgressBar } from "@/components/data/dual-progress-bar";
import { EmptyState } from "@/components/data/empty-state";
import { Gauge } from "@/components/data/gauge";
import { CategoryMark, ListRow } from "@/components/data/list-row";
import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { WarningBanner } from "@/components/data/warning-banner";
import { EstimateBadge } from "@/components/money/estimate-badge";
import { MoneyText } from "@/components/money/money-text";
import { PayerChip } from "@/components/money/payer-chip";
import { StageBadge } from "@/components/money/stage-badge";
import { Button } from "@/components/ui/button";
import { MAJORS, STAGES } from "@/lib/domain";
import { formatCompactWon, formatWon } from "@/lib/format";

import { AmountInputDemo, BottomSheetDemo, SegmentedControlDemo } from "./gallery-demos";

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
          웨딩 가계부 디자인 시스템
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
        </div>
      </Section>
    </div>
  );
}
