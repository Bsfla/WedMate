import { cn } from "@/lib/utils";

/**
 * WedMate 마크 — 진행률 링.
 *
 * 결혼반지이면서 동시에 이 앱의 예산 소진율 게이지다. 앱 전체가 진행률 바·게이지로 말하므로
 * 아이콘과 제품이 같은 시각 언어를 쓴다.
 *
 * ⚠️ **기하를 세 곳에서 같이 유지한다.** 색 모델이 달라 코드를 공유할 수 없다:
 *   - `src/components/brand/brand-mark.tsx`  이 파일. 앱 내부용, 토큰 색
 *   - `src/lib/brand/app-icon.tsx`           래스터 생성용(ImageResponse), 로즈 배경 + 흰 링
 *   - `src/app/icon.svg`                     정적 파비콘, 같은 기하
 * 비율(반지름 : 선굵기 = 150 : 64)과 소진율 0.7을 셋이 공유한다.
 */

const R = 14;
const STROKE = 6;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** 앱 아이콘과 같은 기본 소진율. "준비 중"으로 읽히도록 링을 닫지 않는다. */
export const BRAND_PROGRESS = 0.7;

/**
 * round cap은 dash 양 끝에 각각 STROKE/2씩 **더** 그린다.
 * 그래서 dash 길이에서 STROKE를 빼야 화면에 보이는 호가 실제 비율이 된다.
 * 이 보정을 빼먹으면 0.70이 0.77로 보인다.
 */
function dashArray(progress: number): string {
  const visible = CIRCUMFERENCE * progress;
  const dash = Math.max(0, visible - STROKE);
  return `${dash} ${CIRCUMFERENCE - dash}`;
}

type BrandMarkProps = {
  /** 크기는 여기서 준다. lucide 아이콘과 같은 관례: `className="size-9"` */
  className?: string;
  /** 채워진 호의 비율 0~1. */
  progress?: number;
  /** 주면 `role="img"` + 접근 가능한 이름이 붙고, 없으면 `aria-hidden`. */
  label?: string;
};

export function BrandMark({
  className,
  progress = BRAND_PROGRESS,
  label,
}: BrandMarkProps) {
  const clamped = Math.min(Math.max(progress, 0), 1);

  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      className={cn("size-10", className)}
      fill="none"
      role={label ? "img" : undefined}
      viewBox="0 0 40 40"
    >
      <circle className="stroke-muted" cx="20" cy="20" r={R} strokeWidth={STROKE} />
      {/* progress가 0이면 아예 그리지 않는다 — round cap이 점 하나를 남긴다. */}
      {clamped > 0 && (
        <circle
          className="stroke-primary"
          cx="20"
          cy="20"
          r={R}
          strokeDasharray={dashArray(clamped)}
          strokeLinecap="round"
          strokeWidth={STROKE}
          // CSS transform-origin이 아니라 SVG 속성 형태로 원점을 명시한다.
          // Satori가 transformOrigin을 지원하지 않아 app-icon 쪽과 표기를 맞춰 둔다.
          transform="rotate(-90 20 20)"
        />
      )}
    </svg>
  );
}
