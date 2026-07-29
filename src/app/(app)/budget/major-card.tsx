"use client";

import { ChevronDown, ExternalLink } from "lucide-react";
import { useState } from "react";

import { Panel } from "@/components/data/panel";
import { ProgressBar } from "@/components/data/progress-bar";
import { MoneyText } from "@/components/money/money-text";
import { formatWon } from "@/lib/format";
import type { BudgetMajorView } from "@/lib/mock/fixtures";
import { cn } from "@/lib/utils";

/**
 * 대분류 배분 카드. 탭하면 소분류 예산(업체·후기링크·메모)이 펼쳐진다.
 * 세부 합이 배분액을 넘으면 카드 테두리부터 앰버로 바뀐다.
 */
export function MajorCard({
  major,
  defaultOpen = false,
}: {
  major: BudgetMajorView;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const over = major.overBy > 0;
  const panelId = `budget-major-${major.key}`;

  return (
    <Panel className={cn("gap-0 p-0", over && "border-warning/40")}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 flex-col gap-2.5 p-4 text-left focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <i
              aria-hidden
              className="size-[9px] shrink-0 rounded-[3px]"
              style={{ backgroundColor: major.color }}
            />
            <span className="text-money-md">{major.label}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="num text-money-sm text-muted-foreground">{major.percent}%</span>
            <ChevronDown
              aria-hidden
              strokeWidth={2.2}
              className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
            />
          </span>
        </div>

        <ProgressBar
          thin
          value={major.spent}
          total={major.allocation}
          color={major.color}
          label={`${major.label} 소진율`}
        />

        <div className="flex justify-between gap-2">
          <span className="text-body-sm text-muted-foreground">
            배분 <b className="num font-semibold text-foreground">{formatWon(major.allocation)}</b>
          </span>
          <span className="text-body-sm text-muted-foreground">
            세부 합{" "}
            <b className={cn("num font-semibold", over ? "text-warning-strong" : "text-foreground")}>
              {formatWon(major.budgetSum)}
            </b>
          </span>
        </div>
      </button>

      {open && (
        <ul id={panelId} className="border-t border-border">
          {major.lines.map((line) => (
            <li
              key={line.minor}
              className="flex min-h-14 items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="truncate text-body font-medium">{line.minor}</p>
                <p className="truncate text-body-sm text-muted-foreground">
                  {[line.vendor, line.note].filter(Boolean).join(" · ") || line.mid}
                </p>
              </div>

              {line.referenceUrl && (
                <a
                  href={line.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${line.minor} 후기 링크 열기`}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <ExternalLink aria-hidden className="size-4" strokeWidth={1.9} />
                </a>
              )}

              <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                <MoneyText value={line.amount} size="md" />
                <span
                  className={cn(
                    "num text-body-sm",
                    line.percent >= 90 ? "text-warning-strong" : "text-muted-foreground",
                  )}
                >
                  {line.spent > 0 ? `잔액 ${formatWon(line.remaining)}` : "미집행"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
