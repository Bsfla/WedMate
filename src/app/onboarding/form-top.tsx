"use client";

import Link from "next/link";
import type { Ref } from "react";

import { FormAlert } from "@/components/form/form-alert";
import { Button } from "@/components/ui/button";

import type { OnboardingState } from "./types";

/**
 * 폼 상단 알림. **어느 입력을 고쳐야 할지 말할 수 없는 실패**만 여기로 온다 (→ D-037).
 * 입력에 귀속되는 실패는 `Field`의 `error`로 내려가 그 밑에 뜬다 — 같은 문구를 두 곳에 쓰지 않는다.
 *
 * `offerHome`은 "이미 스페이스가 있다"는 응답 하나에만 붙는다. 그 사람에게 이 폼은
 * 막다른 길이라, 문구만 주고 끝내면 홈으로 갈 방법이 화면에 없다(온보딩엔 하단 탭이 없다).
 *
 * 버튼을 `FormAlert` **밖에** 둔다. 안에 넣으면 `<p>` 안의 버튼이 되어 문장과 액션이
 * 같은 줄 흐름에 섞인다 — 읽고 나서 누르는 순서가 시각적으로 보이지 않는다.
 */
export function FormTop({
  state,
  alertRef,
}: {
  state: OnboardingState;
  /** 제출 실패 시 포커스를 옮기기 위한 참조. 필드 귀속이 아닐 때의 착지점이다. */
  alertRef: Ref<HTMLDivElement>;
}) {
  if (!state.alert) return null;

  return (
    <div className="flex flex-col gap-2">
      <FormAlert ref={alertRef}>{state.alert}</FormAlert>
      {state.offerHome && (
        <Button asChild className="self-start" size="sm" variant="secondary">
          <Link href="/">홈으로 가기</Link>
        </Button>
      )}
    </div>
  );
}
