"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* 자간. `form/code-input.tsx`와 **같은 값이다** — 같은 6자리 코드를 한쪽은 입력받고
   한쪽은 보여준다. 마지막 글자 뒤에도 붙어 text-center를 왼쪽으로 밀기 때문에
   같은 값을 padding-left로 되돌려 광학적 중앙을 맞춘다. (보정량은 실물 확인 필요) */
const CODE_TRACKING = "0.28em";

/** 능력 감지는 구독할 대상이 없다. 등록/해제 모두 아무 일도 하지 않는다. */
const emptySubscribe = () => () => {};

type CopyFieldProps = {
  /** 실제로 복사·공유되는 문자열. 화면에 그려지는 것과 같다. */
  value: string;
  /** 값 위 작은 라벨 ("초대 코드"). */
  label: string;
  /** 라벨 우측 슬롯 (역할 배지 등). */
  badge?: ReactNode;
  /** 값 아래 한 줄 (만료 시각 등). 색을 바꿔야 하면 호출부가 노드로 준다. */
  caption?: ReactNode;
  /** 버튼 아래 상시 안내. 이 값이 남에게 넘어갔을 때의 결과를 쓴다. */
  hint?: ReactNode;
  /** 넘기면 공유 버튼이 생긴다(단, `navigator.share`가 있을 때만). */
  shareText?: string;
  copyLabel?: string;
  copiedLabel?: string;
  shareLabel?: string;
  copyFailedMessage?: string;
  className?: string;
};

/**
 * 값 하나를 **크게 보여주고 복사·공유**시키는 블록. 초대 코드가 첫 소비자다.
 *
 * 🔴 **복사도 공유도 없을 수 있다** — 비-HTTPS · 데스크톱 브라우저 · 권한 거부에서
 * `navigator.clipboard`와 `navigator.share`는 통째로 없거나 예외를 던진다.
 * 그래서 이 컴포넌트의 폴백 본체는 버튼이 아니라 **값 자체다**: 타입 스케일 최대치인
 * `text-display`(32px)로 띄우고 `select-all`을 걸어, 전부 실패해도 사람이 읽거나
 * 한 번 눌러 선택해 옮길 수 있게 한다. (→ D-062)
 *
 * - 공유는 **지원될 때만** 렌더한다. 미지원이면 복사가 전폭이 되는데, 둘 다 한 줄
 *   `size="lg"`(48px)라 **세로 높이는 변하지 않는다** — 하이드레이션 뒤 버튼이 생겨도 점프가 없다.
 * - `navigator.share`의 `AbortError`(사용자가 공유 시트를 닫음)는 실패로 취급하지 않는다.
 *   그 밖의 공유 실패는 조용히 복사로 대체한다.
 * - 능력 감지에 `useEffect` + `setState`를 쓰지 않는다 — 이 저장소는
 *   `react-hooks/set-state-in-effect`가 error다. `useSyncExternalStore`가 서버 스냅샷(false)과
 *   클라이언트 스냅샷을 나눠 주므로 하이드레이션도 어긋나지 않는다.
 */
export function CopyField({
  value,
  label,
  badge,
  caption,
  hint,
  shareText,
  copyLabel = "복사",
  copiedLabel = "복사됨",
  shareLabel = "공유",
  copyFailedMessage = "복사가 안 됐어요. 위 값을 길게 눌러 직접 복사해 주세요.",
  className,
}: CopyFieldProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const resetTimer = useRef<number | null>(null);

  const canShare = useSyncExternalStore(
    emptySubscribe,
    () => typeof navigator !== "undefined" && typeof navigator.share === "function",
    () => false,
  );

  async function copy(): Promise<boolean> {
    try {
      // 옵셔널 체이닝으로 넘기지 않는다 — 클립보드가 없는데 성공한 척하면 안 된다.
      if (!navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(value);

      setFailed(false);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      setCopied(false);
      setFailed(true);
      return false;
    }
  }

  async function share(): Promise<void> {
    if (!shareText) return;
    try {
      await navigator.share({ text: shareText });
      setFailed(false);
    } catch (error) {
      // 사용자가 공유 시트를 닫은 것은 실패가 아니다. 여기서 문구를 띄우면 거짓말이 된다.
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  }

  const showShare = canShare && Boolean(shareText);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-caption text-muted-foreground">{label}</span>
        {badge}
      </div>

      {/* 화면에서 유일한 로즈 면이다. 패널을 accent로 칠하고 여기를 bg-card로 두면
          #fff1f3 위 #ffffff(다크는 #2a1319 위 #1a181b)가 되어 면 대비가 사라진다. */}
      <div className="flex min-h-[58px] items-center justify-center rounded-xl border border-primary/25 bg-primary-soft px-3.5">
        <span
          className="num text-display uppercase select-all"
          style={{ letterSpacing: CODE_TRACKING, paddingLeft: CODE_TRACKING }}
        >
          {value}
        </span>
      </div>

      {caption}

      <div className={cn("grid gap-2", showShare ? "grid-cols-2" : "grid-cols-1")}>
        <Button
          onClick={() => {
            void copy();
          }}
          size="lg"
          type="button"
        >
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? copiedLabel : copyLabel}
        </Button>

        {showShare && (
          <Button
            onClick={() => {
              void share();
            }}
            size="lg"
            type="button"
            variant="secondary"
          >
            <Share2 aria-hidden />
            {shareLabel}
          </Button>
        )}
      </div>

      {failed && (
        <p className="text-body-sm text-warning-strong" role="status">
          {copyFailedMessage}
        </p>
      )}

      {hint && <p className="text-body-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}
