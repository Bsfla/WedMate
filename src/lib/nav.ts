import { ChartPie, House, Receipt, Users, Wallet, type LucideIcon } from "lucide-react";

export type NavTab = {
  href: string;
  /** 하단 탭에 노출되는 짧은 이름 */
  label: string;
  /** 상단 헤더에 노출되는 화면 제목 */
  title: string;
  icon: LucideIcon;
};

/** 하단 탭 5개. 순서가 곧 화면 순서다. */
export const NAV_TABS: readonly NavTab[] = [
  { href: "/", label: "홈", title: "웨딩 가계부", icon: House },
  { href: "/budget", label: "예산", title: "예산", icon: Wallet },
  { href: "/expenses", label: "지출", title: "지출", icon: Receipt },
  { href: "/report", label: "결산", title: "결산", icon: ChartPie },
  { href: "/guests", label: "하객", title: "하객 · 축의금", icon: Users },
] as const;

/** 탭에 속하지 않는 화면들의 제목 */
const EXTRA_TITLES: Record<string, string> = {
  "/settings": "설정",
};

export function isActiveTab(tabHref: string, pathname: string): boolean {
  // "/"는 완전 일치일 때만 활성. 그렇지 않으면 모든 경로에서 홈이 켜진다.
  if (tabHref === "/") return pathname === "/";
  return pathname === tabHref || pathname.startsWith(`${tabHref}/`);
}

export function resolveTitle(pathname: string): string {
  const tab = NAV_TABS.find((candidate) => isActiveTab(candidate.href, pathname));
  if (tab) return tab.title;

  const extra = Object.entries(EXTRA_TITLES).find(
    ([href]) => pathname === href || pathname.startsWith(`${href}/`),
  );
  return extra?.[1] ?? "웨딩 가계부";
}
