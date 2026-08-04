import { defineConfig } from "@playwright/test";

import { localStack } from "./e2e/local-stack";

/**
 * e2e — 브라우저에서만 확인되는 것들.
 *
 * `npm run verify:p1`이 HTTP 층(스키마·RLS·RPC)을 본다면 여기는 **렌더된 화면**을 본다.
 * 둘이 겹치지 않는다: verify:p1은 "저장 요청이 통하는가", 여기는 "그 값이 홈의 D-day로
 * 나타나는가"다. D-078은 전자가 통과해도 후자가 깨질 수 있음을 보여준 사건이었다.
 *
 * 뷰포트는 **375×812 하나뿐이다.** 이 앱은 모바일 전용이고, design-system.md의 모든 규격이
 * 그 폭 기준이다. 데스크톱 프로젝트를 추가하면 통과시킬 수 없는 검사가 생긴다.
 *
 * 라이트·다크를 프로젝트로 나눈다 — 중분류 헤더 대비(4.40:1)가 **라이트에서만** 깨졌던
 * 것처럼, 한쪽만 돌리면 못 보는 결함이 있다. (→ D-075)
 */

const stack = localStack();
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  // 로그인·온보딩을 거치는 흐름이라 기본값(30초)으로는 첫 컴파일에서 아슬아슬하다.
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  // 계정과 커플을 공유하는 시나리오라 워커를 늘리면 서로의 상태를 밟는다.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    /* 🔴 `devices["iPhone 12"]`를 쓰지 않는다 — 그 프리셋은 **WebKit**을 끌고 오는데,
       `npx playwright install chromium`만 받은 환경에서 "실행 파일이 없다"로 죽는다.
       iOS Safari 고유 동작(시트 위 키보드 등)을 봐야 할 때 webkit을 따로 받고
       프로젝트를 추가한다 — 지금은 크로미움 하나로 375px 규격만 지킨다. */
    browserName: "chromium",
    viewport: { width: 375, height: 812 },
    // 실기기와 같은 배율로 잡아야 44px 터치 타깃 실측이 의미를 갖는다.
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },

  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "light",
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
      use: { colorScheme: "light", storageState: "e2e/.auth/user.json" },
    },
    {
      name: "dark",
      dependencies: ["setup"],
      testIgnore: /.*\.setup\.ts/,
      use: { colorScheme: "dark", storageState: "e2e/.auth/user.json" },
    },
  ],

  webServer: {
    /* 🔴 `next dev`를 쓰지 않는다. Next 16은 **프로젝트 디렉터리당 dev 서버 하나**만
       허용해서, 개발 중인 `npm run dev`가 떠 있으면 포트를 달리해도 기동이 거부된다.
       테스트가 개발을 방해하면 안 돌리게 된다.

       프로덕션 빌드가 더 맞기도 하다 — `NEXT_PUBLIC_*`는 프로덕션에서 **빌드 시점에
       코드로 박히므로**, 아래 env 주입이 dev보다 확실하게 먹는다. */
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://127.0.0.1:${PORT}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    stdout: "ignore",
    stderr: "pipe",
    /* `.env.local`은 호스팅 프로젝트를 가리킨다. 여기서 넘긴 값이 이긴다 —
       Next는 이미 정의된 process.env를 .env 파일로 덮지 않는다.
       이게 없으면 테스트가 **실제 사용자 데이터에 계정을 만들고 지운다.** */
    env: {
      NEXT_PUBLIC_SUPABASE_URL: stack.apiUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: stack.anonKey,
    },
  },
});
