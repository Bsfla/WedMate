import Link from "next/link";
import { Settings } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 헤더 우측 아이콘 버튼. 44px 터치 타깃을 고정으로 갖는다. */
export function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "-mr-2.5 grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground",
        "transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * 화면 제목 + 보조 정보 + 우측 액션.
 *
 * 제목을 pathname에서 유추하지 않고 각 화면이 직접 넘긴다 —
 * 5탭 모두 부제(이번 달 합계, 팀 수 등)가 화면마다 다르기 때문이다.
 */
export function AppHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  /** 생략하면 설정 링크가 들어간다. */
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 pt-1.5 pb-3">
      <div className="min-w-0">
        <h1 className="truncate text-title">{title}</h1>
        {subtitle && (
          <p className="num truncate text-caption font-medium text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {action ?? (
        <HeaderIconLink href="/settings" label="설정">
          <Settings aria-hidden className="size-[21px]" strokeWidth={1.8} />
        </HeaderIconLink>
      )}
    </header>
  );
}
