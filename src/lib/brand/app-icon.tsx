/**
 * 앱 아이콘 아트워크 — `ImageResponse`(next/og)가 PNG로 래스터화하는 원본.
 *
 * ⚠️ **기하를 `src/components/brand/brand-mark.tsx` · `src/app/icon.svg`와 같이 유지한다.**
 * 색 모델이 달라(토큰 vs 고정 hex) 코드를 공유할 수 없고 비율만 공유한다.
 *
 * Satori는 인라인 `<svg>`를 data-URI로 직렬화해 resvg로 래스터화하므로
 * `<circle stroke-dasharray>`가 그대로 동작한다 — div/border-radius로 호를 흉내 낼 필요가 없다.
 * 다만 두 가지 제약이 있다:
 *   - `<text>`는 던진다. 이 마크에는 글자가 없다.
 *   - `transformOrigin`(CSS)은 지원하지 않는다. `transform="rotate(-90 256 256)"` 속성 형태를 쓴다.
 */

/** 브랜드 로즈. `--primary`의 라이트 값과 같다. 아이콘은 테마를 따르지 않으므로 고정한다. */
export const BRAND_ROSE = "#e11d48";

const R = 150;
const STROKE = 64;
const CIRCUMFERENCE = 2 * Math.PI * R; // 942.478

/**
 * round cap 보정 — 양 끝에 STROKE/2씩 더 그리므로 dash에서 STROKE를 뺀다.
 * 0.7 기준 dash = 942.478 × 0.7 − 64 = 595.73.
 */
const DASH = CIRCUMFERENCE * 0.7 - STROKE;

/**
 * 링 바깥 반지름 = 150 + 32 = 182 ≤ 204.8.
 * 204.8은 maskable 안전영역 반지름(512 × 80% ÷ 2)이다. 안전영역 안에 들어오므로
 * 원형·둥근사각 어떤 마스크로 잘려도 링이 살아남고, `any`/`maskable`을 한 파일로 겸한다.
 */
export function AppIcon() {
  return (
    <svg fill="none" height="100%" viewBox="0 0 512 512" width="100%">
      <rect fill={BRAND_ROSE} height="512" width="512" />
      <g fill="none" stroke="#ffffff" strokeWidth={STROKE}>
        <circle cx="256" cy="256" r={R} strokeOpacity=".32" />
        <circle
          cx="256"
          cy="256"
          r={R}
          strokeDasharray={`${DASH} ${CIRCUMFERENCE - DASH}`}
          strokeLinecap="round"
          transform="rotate(-90 256 256)"
        />
      </g>
    </svg>
  );
}

/** Satori는 자식이 여럿인 div에 명시적 flex를 요구한다. 루트를 한 겹 감싸 두는 헬퍼. */
export function AppIconFrame() {
  return (
    <div style={{ display: "flex", width: "100%", height: "100%" }}>
      <AppIcon />
    </div>
  );
}
