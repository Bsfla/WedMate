import type { ReactNode } from "react";

import { BrandMark } from "@/components/brand/brand-mark";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  /** stacked = 로그인·온보딩 첫 화면 / inline = 온보딩 2단계 상단 */
  layout?: "stacked" | "inline";
  /** 로그인만 `h1`. 온보딩은 스텝 제목이 h1이라 기본 `p`. */
  as?: "h1" | "p";
  tagline?: ReactNode;
  className?: string;
};

/**
 * 마크 + 워드마크 + 보조 문구. 로그인과 온보딩(P1-3)이 같이 쓴다.
 *
 * **좌측 정렬을 유지한다.** 한글 태그라인이 `word-break: keep-all`로 2줄이 되면 중앙 정렬은
 * 래그가 깨져 보이고, 마크 좌변과 입력 좌변이 만드는 수직선도 사라진다.
 *
 * **워드마크는 SVG가 아니라 텍스트다.** 전용 서체가 없고 타입 스케일이 고정이라
 * `text-display`(32/700/-0.02em Pretendard)를 그대로 쓴다.
 *
 * 카드 플레이트는 장식이 아니라 **기능**이다 — 웨시 위에 마크를 직접 얹으면
 * `--muted` 트랙이 배경과 붙어 링이 사라진다. `bg-card`가 트랙 대비를 보장한다.
 */
export function BrandLockup({
  layout = "stacked",
  as: Wordmark = "h1",
  tagline,
  className,
}: BrandLockupProps) {
  if (layout === "inline") {
    return (
      <header className={cn("flex items-center gap-2.5", className)}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-card">
          <BrandMark className="size-5" />
        </span>
        {/* lang="en" — 문서가 lang="ko"라 한국어 TTS가 "웨드마테"로 읽는 것을 막는다. */}
        <Wordmark className="text-title" lang="en">
          WedMate
        </Wordmark>
      </header>
    );
  }

  return (
    <header className={cn("flex flex-col gap-4", className)}>
      {/* 그림자 값은 SegmentedControl이 이미 쓰는 것을 그대로 재사용한다 —
          새 그림자를 시스템에 들이지 않는다. */}
      <span className="grid size-16 place-items-center rounded-2xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.09)]">
        <BrandMark className="size-9" />
      </span>
      <div className="flex flex-col gap-1.5">
        <Wordmark className="text-display" lang="en">
          WedMate
        </Wordmark>
        {tagline && <p className="text-body text-muted-foreground">{tagline}</p>}
      </div>
    </header>
  );
}
