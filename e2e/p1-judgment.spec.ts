import { expect, test } from "./fixtures";
import { readFileSync } from "node:fs";

/**
 * P1 완료 판정 중 **브라우저로만 확인되는 것들.**
 *
 * `npm run verify:p1`이 "저장 요청이 통하는가"까지 봤다면, 여기는 그 값이 **화면에
 * 나타나는가**를 본다. 둘은 겹치지 않는다 — D-078이 정확히 그 사이에서 났다.
 * 요청은 나갔고(빌드도 통과했고) 저장만 안 됐다.
 */

const fixture = JSON.parse(readFileSync("e2e/.auth/fixture.json", "utf8")) as {
  weddingDate: string;
  daysUntil: number;
};

test("홈에서 내가 넣은 예식일로 D-day가 뜬다", async ({ page }) => {
  await page.goto("/");

  /* 온보딩에서 오늘+120일을 넣었다. 홈은 그 날짜로 D-day를 계산해야 한다.
     `aria-label`이 "결혼식까지 D-120" 형태다 — 눈에 보이는 텍스트가 아니라 이걸 잡는 이유는
     화면 텍스트가 축약·줄바꿈될 수 있어서다. */
  const dday = page.getByLabel(/결혼식까지 D-/);
  await expect(dday).toBeVisible();

  const label = (await dday.getAttribute("aria-label")) ?? "";
  const days = Number(label.match(/D-(\d+)/)?.[1]);

  /* ±1을 허용한다 — 테스트가 자정을 걸쳐 돌면 서울 기준 '오늘'이 바뀐다.
     그 하루 때문에 붉은 불이 뜨면 사람이 테스트를 안 믿게 된다. */
  expect(Math.abs(days - fixture.daysUntil), `받은 라벨: ${label}`).toBeLessThanOrEqual(1);
});

test("예식 정보를 고치면 저장되고, 다시 열어도 그 값이다 (D-078 회귀)", async ({ page }) => {
  /* 🔴 이 테스트가 존재하는 이유 — 이 화면의 저장은 만들어진 날부터 한 번도 동작하지
     않았다. PostgREST가 필터 없는 UPDATE를 21000으로 거부하는데, lint·build·타입 검사
     어느 것도 그걸 볼 수 없었다. 사람이 눌러봐서 잡혔다. 이제 이 테스트가 대신 누른다. */
  await page.goto("/settings/wedding");

  const guarantee = page.getByLabel("최소보증인원");
  await expect(guarantee).toBeVisible();

  // 기존 값과 다른 값을 넣는다 — 같으면 "저장됐다"와 "아무 일도 없었다"를 구분 못 한다.
  const before = await guarantee.inputValue();
  const next = String(Number(before || "0") === 250 ? 240 : 250);
  await guarantee.fill(next);

  await page.getByRole("button", { name: /저장/ }).click();

  // 성공 블록은 제출 버튼 **아래**에 뜨고 포커스를 받는다 (→ D-065).
  await expect(page.getByRole("status")).toBeVisible();

  /* 실패했다면 "…하지 못했어요 (21000)"이 알림으로 뜬다. 그 경로를 명시적으로 막는다.
     🔴 `getByRole("alert")`를 그냥 세면 안 된다 — **Next가 라우트 어나운서를
     `role="alert"`로 항상 심어 둔다.** 빈 알림 하나가 늘 잡혀서 0이 될 수 없다. */
  await expect(page.getByRole("alert").filter({ hasText: /못했어요/ })).toHaveCount(0);

  // 새로고침해도 남아 있어야 진짜 저장이다.
  await page.reload();
  await expect(page.getByLabel("최소보증인원")).toHaveValue(next);
});

test("설정에서 카테고리 관리로 들어갈 수 있다", async ({ page }) => {
  await page.goto("/settings");

  const row = page.getByRole("link", { name: /카테고리 관리/ });
  await expect(row).toBeVisible();
  await row.click();

  await page.waitForURL(/\/settings\/categories/);
  await expect(page.getByRole("heading", { name: "카테고리 관리" })).toBeVisible();
});
