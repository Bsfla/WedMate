"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  type TooltipContentProps,
} from "recharts";

import { formatWon } from "@/lib/format";

export type TimelinePoint = {
  label: string;
  confirmed: number;
  estimated: number;
};

/** 예상 계열 막대를 채우는 45° 사선 패턴의 id. 차트 내부에서만 쓴다. */
const HATCH_ID = "timeline-estimate-hatch";

// 제네릭 인자를 명시하지 않는다 — 기본값(ValueType, NameType)이 곧 Tooltip content가
// 요구하는 시그니처라, 좁히면 반공변 위치에서 대입이 깨진다.
function TimelineTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  const confirmed = Number(payload.find((item) => item.dataKey === "confirmed")?.value ?? 0);
  const estimated = Number(payload.find((item) => item.dataKey === "estimated")?.value ?? 0);

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="num text-body-sm font-semibold">확정 {formatWon(confirmed)}</p>
      {estimated > 0 && (
        <p className="num text-body-sm font-semibold text-muted-foreground">
          예상 {formatWon(estimated)}
        </p>
      )}
    </div>
  );
}

/**
 * 월별 확정/예상 2계열 막대.
 *
 * 이 앱에서 **Recharts를 쓰는 유일한 자리**다. 소진율 바·게이지·진행률은
 * 전부 div + role="progressbar"로 만든다 — 더 가볍고, 스크린리더가 값을 읽고,
 * 다크 모드 대응이 자동이다.
 *
 * 예상 계열은 색이 아니라 사선 패턴 + 점선 테두리로 구분한다.
 */
export function MonthlyTimeline({ data }: { data: TimelinePoint[] }) {
  return (
    <div className="h-[168px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={4} margin={{ top: 8, right: 4, bottom: 0, left: 4 }}>
          <defs>
            <pattern
              id={HATCH_ID}
              width={7}
              height={7}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <line
                x1={0}
                y1={0}
                x2={0}
                y2={7}
                stroke="var(--primary)"
                strokeWidth={3}
                strokeOpacity={0.34}
              />
            </pattern>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fontSize: 11.5, fontWeight: 600, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={TimelineTooltip} cursor={{ fill: "var(--muted)", opacity: 0.6 }} />

          <Bar dataKey="confirmed" name="확정" fill="var(--primary)" radius={[5, 5, 0, 0]} />
          <Bar
            dataKey="estimated"
            name="예상"
            fill={`url(#${HATCH_ID})`}
            stroke="var(--primary)"
            strokeOpacity={0.55}
            strokeDasharray="3 3"
            radius={[5, 5, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
