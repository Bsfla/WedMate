/**
 * 제출 실패 시 **고쳐야 할 컨트롤로 포커스를 옮긴다.**
 * 온보딩 2폼(1단계·2단계)과 설정 › 예식 정보가 같이 쓴다.
 *
 * 이게 접근성의 핵심이다 — `Field`가 붙여 둔 `aria-describedby`는 **포커스 시점에** 낭독되므로,
 * 포커스를 옮기면 라이브 리전 없이도 에러가 확실히 읽힌다. (`aria-live`를 쓰지 않는 이유 → D-037)
 *
 * `form.elements.namedItem(name)`을 쓰지 않는다. 컨트롤 중 둘은 `name`으로 찾을 수 없다:
 * `AmountInput`은 값이 별도 hidden 입력에 실리고(보이는 입력에는 `name`이 없다),
 * `SegmentedControl`은 아예 `<div role="radiogroup">`이다. 그래서 `id`로 찾는다 —
 * 상태 타입의 `field` 값이 곧 그 `id`다.
 *
 * **브라우저에서만 부른다.** `"use client"`를 붙이지 않은 순수 DOM 함수라
 * 서버에서 부르면 `document is not defined`로 죽는다. (경계를 `"use client"`로 긋지 않는 이유 → D-054)
 */

/** `select()`는 텍스트 계열에서만 허용된다. `type="date"`에 부르면 InvalidStateError가 난다. */
const SELECTABLE = new Set(["text", "email", "password", "search", "tel", "url"]);

export function focusFieldControl(id: string): boolean {
  const element = document.getElementById(id);
  if (!element) return false;

  if (element instanceof HTMLInputElement) {
    element.focus();
    // 이미 친 값을 지우고 다시 치기 쉽게 통째로 선택한다.
    if (SELECTABLE.has(element.type)) element.select();
    return true;
  }

  // radiogroup은 div라 포커스를 받지 못한다. 첫 라디오로 옮기면 그룹의 이름·설명이 함께 읽힌다.
  // (실물 확인 필요 — 그룹 설명 낭독 여부는 스크린리더 조합마다 다르다.)
  const radio = element.querySelector<HTMLElement>('[role="radio"]');
  if (!radio) return false;
  radio.focus();
  return true;
}
