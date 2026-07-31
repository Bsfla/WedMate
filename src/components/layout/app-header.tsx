import Link from "next/link";
import { ChevronLeft, Settings } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** 헤더 좌우 아이콘 버튼. 44px 터치 타깃을 고정으로 갖는다. */
export function HeaderIconLink({
  href,
  label,
  children,
  className,
}: {
  href: string;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "-mr-2.5 grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground",
        "transition-colors hover:text-foreground active:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
        className,
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
 *
 * `back`을 주면 좌측에 44px 뒤로가기가 붙는다(`/settings/*` 하위 화면).
 * 브라우저 history가 아니라 **경로**를 받는다 — 딥링크로 바로 들어온 사용자에게도
 * 올라갈 곳이 있어야 하고, `router.back()`은 그 경우 앱 밖으로 나가 버린다.
 */
export function AppHeader({
  title,
  subtitle,
  back,
  backLabel = "뒤로",
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  /** 상위 화면 경로. 넘기면 좌측 뒤로가기가 생긴다. */
  back?: string;
  backLabel?: string;
  /** 생략하면 설정 링크가 들어간다. `null`을 주면 우측을 비운다. */
  action?: ReactNode | null;
}) {
  return (
    <header className="sticky top-0 z-30 flex min-h-[52px] shrink-0 items-center gap-2 border-b border-border bg-card px-4 pt-1.5 pb-3">
      {/* `mr-0`으로 기본 `-mr-2.5`를 지운다 — 좌측에 놓이는 유일한 경우라
          오른쪽으로 당기면 제목이 10px 왼쪽으로 밀린다. */}
      {back && (
        <HeaderIconLink className="-ml-2.5 mr-0 text-foreground" href={back} label={backLabel}>
          <ChevronLeft aria-hidden className="size-6" strokeWidth={2} />
        </HeaderIconLink>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-title">{title}</h1>
        {subtitle && (
          <p className="num truncate text-body-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {action === undefined ? (
        <HeaderIconLink href="/settings" label="설정">
          <Settings aria-hidden className="size-[21px]" strokeWidth={1.8} />
        </HeaderIconLink>
      ) : (
        action
      )}
    </header>
  );
}
