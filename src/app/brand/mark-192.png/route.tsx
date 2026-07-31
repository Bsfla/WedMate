import { ImageResponse } from "next/og";

import { AppIconFrame } from "@/lib/brand/app-icon";

/** 매니페스트가 참조하는 192 PNG. 설명은 `../mark-512.png/route.tsx` 참조. */
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(<AppIconFrame />, { width: 192, height: 192 });
}
