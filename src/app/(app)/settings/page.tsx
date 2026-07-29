import { ChevronRight, Palette } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/data/panel";
import { SectionHeader } from "@/components/data/section-header";
import { AppHeader } from "@/components/layout/app-header";
import { Screen } from "@/components/layout/screen";

/** P1에서 실제 CRUD가 붙는다. 지금은 진입점만 놓아 정보 구조를 확인한다. */
const MENU = [
  { label: "카테고리 관리", caption: "대분류 · 중분류 · 소분류" },
  { label: "결제수단 관리", caption: "결제자 × 현금 · 카드 · 상품권 · 계좌" },
  { label: "커플 초대", caption: "초대 코드로 배우자를 같은 스페이스에 연결" },
  { label: "저축 목표", caption: "목표액 · 월 납입액 · 계좌" },
  { label: "예식 정보", caption: "예식일 · 최소보증인원 · 평균 축의금" },
];

export default function SettingsPage() {
  return (
    <Screen header={<AppHeader title="설정" action={<span />} />}>
      <Panel flush>
        <ul>
          {MENU.map((item) => (
            <li
              key={item.label}
              className="flex min-h-14 items-center gap-3 border-b border-border/60 px-4 py-2.5 last:border-b-0"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-body font-medium">{item.label}</span>
                <span className="truncate text-body-sm text-muted-foreground">{item.caption}</span>
              </div>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </Panel>

      <SectionHeader title="개발용" />
      <Panel flush>
        <Link
          href="/design"
          className="flex min-h-14 items-center gap-3 px-4 py-2.5 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Palette aria-hidden className="size-5 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-body font-medium">스타일 가이드</span>
            <span className="truncate text-body-sm text-muted-foreground">
              토큰 · 타입 스케일 · 밀도 규칙 · 컴포넌트 갤러리
            </span>
          </div>
          <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        </Link>
      </Panel>

      <p className="px-0.5 text-body-sm text-muted-foreground">
        각 항목의 실제 편집 기능은 P1(인증 · 커플 스페이스)에서 붙습니다.
      </p>
    </Screen>
  );
}
