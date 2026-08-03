import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BrandLockup } from "@/components/brand/brand-lockup";
import type { Side } from "@/lib/domain";
import { getSpaceContext } from "@/lib/supabase/space";

import { OnboardingForm } from "./onboarding-form";
import { StepDots } from "./step-dots";
import { MAX_DISPLAY_NAME } from "./types";

// 접미사를 붙이지 않는다. 루트 layout의 `template: "%s · WedMate"`가 붙여 준다.
export const metadata: Metadata = {
  title: "스페이스 만들기",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** 쿼리 파라미터는 배열로도 온다(`?side=a&side=b`). 첫 값만 본다. */
function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function OnboardingPage({ searchParams }: { searchParams: SearchParams }) {
  const context = await getSpaceContext();

  if (context.status === "anonymous") redirect("/login");
  // 이미 스페이스가 있으면 여기 있을 이유가 없다. `unavailable`은 보내지 않는다 —
  // "없다"와 "확인할 수 없다"는 다른 행동을 부른다(D-034). 조회가 흔들릴 때 온보딩에 가두지 않는다.
  if (context.status === "ok") redirect("/");

  // 2단계에서 "고치기"로 돌아온 경우의 복원값.
  const params = await searchParams;
  const rawSide = first(params.side);
  const initialSide: Side | null = rawSide === "groom" || rawSide === "bride" ? rawSide : null;
  const initialName = first(params.name).slice(0, MAX_DISPLAY_NAME);

  return (
    <main className="flex flex-col gap-6 pt-10 pb-8">
      <div className="flex flex-col gap-5">
        {/* 로그인에서 32px 워드마크를 본 직후다. 같은 크기로 반복하면 처음부터 다시 시작하는
            화면으로 읽힌다 — inline은 "같은 흐름의 다음 장"이라는 신호다. */}
        <BrandLockup as="p" layout="inline" />

        <div className="flex flex-col gap-2">
          <StepDots current={1} />
          {/* 탭을 바꿔도 제목은 고정한다. 제목까지 갈아 끼우면 세그먼트가 "탭"이 아니라
              "화면 전환"으로 읽혀서, 방금 친 이름이 남아 있다는 사실이 안 보인다. */}
          <h1 className="text-display">둘이 함께 쓸 스페이스</h1>
        </div>
      </div>

      <OnboardingForm initialName={initialName} initialSide={initialSide} />
    </main>
  );
}
