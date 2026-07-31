import { ImageResponse } from "next/og";

import { AppIconFrame } from "@/lib/brand/app-icon";

/**
 * iOS 홈 화면 아이콘. **Safari는 `apple-touch-icon`에 SVG를 받지 않아** 래스터가 필요하다.
 *
 * `next/og`는 Next에 이미 들어 있다(@vercel/og + resvg.wasm 번들) — 새 의존성이 없다.
 * `fonts` 옵션도 필요 없다: 기본 폰트가 무조건 로드되고, 이 마크에는 글자가 없다.
 *
 * **모서리를 미리 둥글리지 않는다.** iOS가 자체 스퀘어클 마스크를 씌우므로
 * 여기서 라운딩하면 이중으로 깎여 노치가 보인다.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<AppIconFrame />, size);
}
