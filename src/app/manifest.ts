import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "WedMate",
    short_name: "WedMate",
    description: "예비부부 둘이 함께 쓰는, 결혼 준비 예산 전용 모바일 가계부",
    lang: "ko",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // 앱의 첫 페인트 색과 정확히 맞춘다. #ffffff였을 때는 실행 시 흰색→크림 플래시가 있었다.
    // 로즈로 두지 않는 이유: theme_color는 상태바·작업 전환기 카드 같은 **큰 크롬 면**을 칠하는
    // 값이라, 크림색 앱 위의 진한 로즈 바는 렌더링 버그처럼 보인다. 로즈는 마크에만 둔다.
    background_color: "#f6f5f6",
    theme_color: "#f6f5f6",
    icons: [
      // SVG를 먼저 둔다 — 지원하는 브라우저는 이걸 골라 어떤 크기에서도 선명하다.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      // PNG 폴백. Chrome의 설치 가능 판정이 192·512 래스터를 원하고,
      // SVG + sizes:"any" 조합이 Android 설치를 막는다는 크로미움 이슈(40925759)도 있어
      // 래스터를 반드시 함께 싣는다.
      { src: "/brand/mark-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/mark-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // 마크가 maskable 안전영역(반지름 204.8) 안에 들어오도록 그려져 있어 같은 파일을 쓴다.
      // purpose를 "any maskable"로 합치지 않고 항목을 나누는 건 Lighthouse의 maskable 감사가
      // 그렇게 읽고, 나중에 아트워크를 갈라야 할 때 매니페스트를 다시 쓰지 않아도 되기 때문이다.
      { src: "/brand/mark-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
