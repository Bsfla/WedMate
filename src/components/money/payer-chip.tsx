import { PAYER_LABEL, PAYER_TOKEN, type Payer } from "@/lib/domain";
import { cn } from "@/lib/utils";

/**
 * 결제자 표식. **색 점 + 텍스트 라벨을 항상 함께** 낸다 —
 * 이 앱은 구분 축이 세 개(확정/예상 · 결제자 · 대분류)라 색에만 기대면
 * 색각 이상 사용자에게 무너진다.
 */
export function PayerChip({ payer, className }: { payer: Payer; className?: string }) {
  const token = PAYER_TOKEN[payer];

  return (
    <span
      className={cn(
        "inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-md pr-2 pl-1.5 text-caption font-semibold",
        token.soft,
        token.text,
        className,
      )}
    >
      <i
        aria-hidden
        className="size-[7px] shrink-0 rounded-[2px]"
        style={{ backgroundColor: token.dot }}
      />
      {PAYER_LABEL[payer]}
    </span>
  );
}
