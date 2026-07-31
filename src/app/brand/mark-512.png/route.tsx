import { ImageResponse } from "next/og";

import { AppIconFrame } from "@/lib/brand/app-icon";

/**
 * 매니페스트가 참조하는 512 PNG. 고정 URL이 필요해 라우트 핸들러로 만든다
 * (`apple-icon.tsx` 같은 메타데이터 라우트는 URL에 해시가 붙어 매니페스트에서 못 가리킨다).
 *
 * `force-static`이라 빌드 시점에 한 번 렌더되고 그 결과가 그대로 서빙된다 — 요청마다 돌지 않는다.
 *
 * 경로를 `icon-512.png`가 아니라 `brand/mark-512.png`로 둔 이유: `icon-*`은 Next의
 * 메타데이터 라우트 매처와 가까워 오인될 여지가 있다.
 */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<AppIconFrame />, { width: 512, height: 512 });
}
