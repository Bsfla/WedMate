import { cn } from "@/lib/utils";

const TOTAL = 2;

/**
 * 온보딩 2단계 진행 표시.
 *
 * **색으로만 말하지 않는다**(D-006). 지난 단계·현재 단계는 채운 점, 남은 단계는 회색 점인데
 * 그것만으로는 그레이스케일에서 "지난 것"과 "지금"이 붙어 보인다 — 그래서 현재 단계만
 * **가로로 길다**(w-5). 색이 없어도 폭으로 위치를 읽는다.
 *
 * 점 자체는 `aria-hidden`이고, 같은 뜻을 `sr-only` 한 줄이 그대로 말한다.
 *
 * `role="progressbar"`를 쓰지 않았다. 이건 연속량이 아니라 **2칸짜리 위치**고,
 * 진행률 규격(`data/progress-bar`)은 금액 소진율용이라 여기 붙이면 의미가 어긋난다.
 */
export function StepDots({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="sr-only">{`${TOTAL}단계 중 ${current}단계`}</span>
      {Array.from({ length: TOTAL }, (_, index) => {
        const step = index + 1;
        return (
          <span
            aria-hidden
            /* 트랜지션을 걸지 않는다. 두 단계는 서로 다른 라우트라 점이 애니메이션될 일이 없고,
               모션을 넣으면 `motion-reduce` 처리를 하나 더 지고 가게 된다. */
            className={cn(
              "h-1.5 rounded-full",
              step === current
                ? "w-5 bg-primary"
                : step < current
                  ? "w-1.5 bg-primary"
                  : "w-1.5 bg-border",
            )}
            key={step}
          />
        );
      })}
    </div>
  );
}
