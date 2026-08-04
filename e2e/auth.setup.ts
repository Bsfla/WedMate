import { expect, test as setup } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

import { E2E_MARK, cleanupE2E, localStack } from "./local-stack";

/**
 * 계정 하나를 만들고 **화면을 통해** 로그인·온보딩을 끝낸 뒤 세션을 저장한다.
 *
 * 🔴 세션을 API로 주입하지 않고 `/login` 폼을 실제로 채우는 이유 — 그 흐름 자체가
 * 검증 대상이기 때문이다. 주입하면 로그인 화면이 깨져도 나머지 테스트가 전부 통과한다.
 *
 * 온보딩도 같은 이유로 화면을 거친다. `create_couple()` RPC는 `verify:p1`이 이미 직접
 * 두드리고 있어, 여기서 확인하려는 것은 **폼이 그 RPC에 올바른 값을 넘기는가**다.
 */

const STATE_PATH = "e2e/.auth/user.json";
const FIXTURE_PATH = "e2e/.auth/fixture.json";

/** 홈의 D-day를 검증하려면 "오늘로부터 며칠 뒤"인지 아는 예식일이 필요하다. */
const DAYS_UNTIL_WEDDING = 120;

function seoulDatePlus(days: number): string {
  // Asia/Seoul 기준으로 날짜를 만든다 — 앱이 `referenceDay(true)`로 서울 오늘을 쓴다.
  const seoulNow = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
  );
  seoulNow.setDate(seoulNow.getDate() + days);
  const y = seoulNow.getFullYear();
  const m = String(seoulNow.getMonth() + 1).padStart(2, "0");
  const d = String(seoulNow.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

setup("계정 생성 · 로그인 · 온보딩", async ({ page }) => {
  const stack = localStack();
  cleanupE2E();

  const email = `owner.${E2E_MARK.toLowerCase()}@example.test`;
  const password = "e2e-password";
  const weddingDate = seoulDatePlus(DAYS_UNTIL_WEDDING);
  const spaceName = `우리 결혼 준비 ${E2E_MARK}`;

  // 계정만 API로 만든다 — 메일 확인 단계를 건너뛰기 위해서다(`email_confirm: true`).
  // 그 뒤 로그인은 반드시 화면으로 한다.
  const created = await fetch(`${stack.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: stack.serviceKey,
      Authorization: `Bearer ${stack.serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  expect(created.ok, `계정 생성 실패: ${await created.text()}`).toBeTruthy();

  /* ── 로그인 ── */
  await page.goto("/login");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill(password);
  await page.getByRole("button", { name: "로그인" }).click();

  // 스페이스가 없으면 `(app)/layout.tsx` 가드가 온보딩으로 보낸다 (→ D-034).
  await page.waitForURL(/\/onboarding/, { timeout: 30_000 });

  /* ── 온보딩 1단계: 스페이스 만들기 ──
     역할은 기본값이 없다. 안 고르면 `sideRequired`로 막힌다. */
  await page.getByLabel("내 이름").fill("예랑");
  await page.getByRole("radio", { name: "예랑", exact: true }).click();
  await page.getByRole("button", { name: "다음 — 예식 정보 입력" }).click();

  /* ── 온보딩 2단계: 예식일 · 총예산 ── */
  await page.waitForURL(/\/onboarding\/wedding/, { timeout: 30_000 });
  await page.getByLabel("예식일").fill(weddingDate);
  await page.getByRole("button", { name: "스페이스 만들고 시작하기" }).click();

  // 온보딩이 끝나면 홈이다.
  await page.waitForURL((url) => new URL(url).pathname === "/", { timeout: 30_000 });

  const stateCookies = await page.context().cookies();
  expect(stateCookies.length, "세션 쿠키가 없다").toBeGreaterThan(0);

  await page.context().storageState({ path: STATE_PATH });

  mkdirSync("e2e/.auth", { recursive: true });
  writeFileSync(
    FIXTURE_PATH,
    JSON.stringify({ email, password, weddingDate, spaceName, daysUntil: DAYS_UNTIL_WEDDING }, null, 2),
  );
});
