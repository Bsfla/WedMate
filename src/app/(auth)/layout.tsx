import type { ReactNode } from "react";

import { AuthShell } from "@/components/layout/auth-shell";

/** 셸의 실체와 그 이유는 `components/layout/auth-shell.tsx`에 있다 — 온보딩과 공유한다. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
