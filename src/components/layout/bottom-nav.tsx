"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_TABS, isActiveTab } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 화면"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-[480px]">
        {NAV_TABS.map(({ href, label, icon: Icon }) => {
          const active = isActiveTab(href, pathname);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                // 최소 터치 타깃 52px — 44px 기준을 넘긴다.
                className={cn(
                  "flex min-h-13 flex-col items-center justify-center gap-[3px] pt-2 pb-1 transition-colors",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                  active ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-[22px]" strokeWidth={active ? 2.3 : 1.9} />
                <span className="text-[11px] leading-none font-semibold tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
