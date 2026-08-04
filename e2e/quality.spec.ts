import { type Page } from "@playwright/test";

import { expect, test } from "./fixtures";

/**
 * 화면 품질 — **사람 눈으로는 놓치는 것**만 본다.
 *
 * 자동화가 판단할 수 없는 것(⋯가 눈에 띄는가, 엄지로 잘 눌리는가)은 여기 없다.
 * 대신 계산으로 확정되는 것을 본다: 대비비 · 실측 높이 · 가로 스크롤 · 콘솔 에러.
 *
 * 🔴 대비 검사가 이 파일의 핵심이다. 중분류 헤더가 라이트에서 4.40:1(AA 미달)이었는데
 * 72장을 육안으로 넘겨보고도 못 봤다. 사람 눈이 못 하는 일이라 도구가 해야 한다. (→ D-075)
 */

const ROUTES = [
  { path: "/", name: "홈" },
  { path: "/budget", name: "예산" },
  { path: "/expenses", name: "지출" },
  { path: "/report", name: "결산" },
  { path: "/guests", name: "하객" },
  { path: "/settings", name: "설정" },
  { path: "/settings/categories", name: "카테고리 관리" },
  { path: "/settings/wedding", name: "예식 정보" },
  { path: "/settings/invite", name: "커플 초대" },
];

/** WCAG 상대 휘도. */
function luminance([r, g, b]: number[]): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(fg: number[], bg: number[]): number {
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function parseRgb(value: string): number[] | null {
  const m = value.match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((p) => Number.parseFloat(p.trim()));
  // 알파가 1이 아니면 합성 결과를 알 수 없다 — 그런 자리는 애초에 쓰지 않는 게 규칙이다(D-075).
  if (parts.length === 4 && parts[3] !== 1) return null;
  return parts.slice(0, 3);
}

/** 요소의 실제 색과, 뒤에서 처음 만나는 불투명 배경색. */
async function colorsOf(page: Page, selector: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const color = getComputedStyle(el).color;
    let node: Element | null = el;
    let background = "rgba(0, 0, 0, 0)";
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      if (bg && !/rgba\(0, 0, 0, 0\)|transparent/.test(bg)) {
        background = bg;
        break;
      }
      node = node.parentElement;
    }
    return { color, background };
  }, selector);
}

for (const route of ROUTES) {
  test(`${route.name} — 가로 스크롤 0 · 콘솔 에러 0`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(String(err)));

    await page.goto(route.path);
    await page.waitForLoadState("networkidle");

    /* 375px에서 가로로 밀리면 한 손 조작이 무너진다. `documentElement`의 스크롤 폭이
       클라이언트 폭보다 크면 어딘가가 뷰포트를 넘긴 것이다. */
    const overflow = await page.evaluate(() => {
      const el = document.documentElement;
      return el.scrollWidth - el.clientWidth;
    });
    expect(overflow, `${route.path} 가로 넘침 ${overflow}px`).toBeLessThanOrEqual(0);

    expect(errors, `${route.path} 콘솔 에러:\n${errors.join("\n")}`).toHaveLength(0);
  });
}

test("터치 타깃이 44px 이상이다", async ({ page }) => {
  await page.goto("/settings/categories");
  await page.waitForLoadState("networkidle");

  const { small, examined } = await page.evaluate(() => {
    const bad: string[] = [];
    let seen = 0;
    const targets = document.querySelectorAll(
      'button:not([disabled]), a[href], [role="radio"], [role="switch"]',
    );
    for (const el of targets) {
      const rect = el.getBoundingClientRect();
      // 화면 밖(닫힌 시트 안 등)은 세지 않는다.
      if (rect.width === 0 || rect.height === 0) continue;
      seen += 1;
      if (rect.height < 44) {
        bad.push(
          `${el.tagName.toLowerCase()}[${el.getAttribute("aria-label") ?? el.textContent?.trim().slice(0, 16) ?? ""}] = ${Math.round(rect.height)}px`,
        );
      }
    }
    return { small: bad, examined: seen };
  });

  /* 🔴 **아무것도 못 찾아도 통과하는 검사**를 막는다. 셀렉터가 바뀌거나 화면이 안 그려지면
     `small`이 빈 배열이라 초록 불이 뜨는데, 실제로는 한 개도 안 재본 것이다.
     카테고리 화면은 하단 탭 5개 + 행·추가버튼이라 최소 20개는 나온다. */
  expect(examined, "터치 타깃을 하나도 못 찾았다 — 셀렉터나 렌더를 확인해라").toBeGreaterThan(20);

  expect(small, `44px 미만:\n${small.join("\n")}`).toHaveLength(0);
});

test("중분류 그룹 헤더가 AA(4.5:1)를 넘는다", async ({ page }, testInfo) => {
  await page.goto("/settings/categories");
  await page.waitForLoadState("networkidle");

  /* 🔴 이 검사가 잡으려는 것: `--muted-foreground`(#71717a)는 **흰 카드 위에서 4.83:1**이라
     토큰 주석에 그렇게 적혀 있었는데, `bg-muted`(#f4f4f5) 위로 옮기면 4.40:1로 내려앉는다.
     배경을 안 밝힌 주석 하나가 D-007과 같은 종류의 실수를 무채색 축에서 재발시켰다. */
  const header = page.locator("[data-testid='mid-group-title']").first();
  const hasTestId = (await header.count()) > 0;
  const selector = hasTestId
    ? "[data-testid='mid-group-title']"
    : // 아직 testid가 없으면 구조로 잡는다 — 그룹 헤더는 bg-muted 면 위의 첫 굵은 라벨이다.
      ".bg-muted .truncate";

  const colors = await colorsOf(page, selector);
  expect(colors, "그룹 헤더를 찾지 못했다").not.toBeNull();

  const fg = parseRgb(colors!.color);
  const bg = parseRgb(colors!.background);
  expect(fg && bg, `색을 읽지 못했다: ${JSON.stringify(colors)}`).toBeTruthy();

  const ratio = contrast(fg!, bg!);
  testInfo.annotations.push({
    type: "contrast",
    description: `${colors!.color} on ${colors!.background} = ${ratio.toFixed(2)}:1`,
  });

  expect(
    ratio,
    `중분류 헤더 대비 ${ratio.toFixed(2)}:1 (${colors!.color} on ${colors!.background})`,
  ).toBeGreaterThanOrEqual(4.5);
});
