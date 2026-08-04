import { test as base } from "@playwright/test";

/**
 * 다크 모드를 실제로 켜는 fixture.
 *
 * 🔴 **`use: { colorScheme: "dark" }`만으로는 이 앱이 다크로 안 바뀐다.**
 * `globals.css:8`이 `@custom-variant dark (&:is(.dark *))`라 다크는 **`.dark` 클래스**로
 * 켜지지, `prefers-color-scheme` 미디어 쿼리로 켜지지 않는다.
 *
 * 이걸 모르고 두면 dark 프로젝트가 **라이트를 한 번 더 돌린다** — 테스트 수는 두 배인데
 * 실제로 보는 것은 절반이다. 처음 짰을 때 정확히 그 상태였고, 대비 검사가 다크에서도
 * 라이트 색(`rgb(113,113,122) on rgb(244,244,245)`)을 보고해서 들켰다.
 * **초록 불이 늘어나는 것과 검증이 늘어나는 것은 다르다.**
 *
 * P6에서 `next-themes` 토글이 붙으면 그 토글을 쓰도록 바꾼다. 그때까지는 클래스를 직접 심는다.
 */
export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    if (testInfo.project.name === "dark") {
      await page.addInitScript(() => {
        const apply = () => document.documentElement?.classList.add("dark");
        apply();
        document.addEventListener("DOMContentLoaded", apply);
      });
    }
    await use(page);
  },
});

export { expect } from "@playwright/test";
