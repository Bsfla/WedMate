import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * 🔴 이 프로젝트의 타입 스케일 9단을 tailwind-merge에 **등록해야 한다.**
 *
 * 등록하지 않으면 `text-body-sm` 같은 미등록 `text-*`를 tailwind-merge가 **색 클래스로
 * 오인**한다. 그러면 같은 `cn()` 안에 크기와 색이 같이 들어갈 때 뒤에 오는 색이
 * 크기를 밀어내고, **크기가 조용히 사라진다.**
 *
 *   cn("text-body-sm", "text-muted-foreground")  →  "text-muted-foreground"  ← 13px 소실
 *
 * 실제로 `WarningBanner` 제목(13→15px) · `StageBadge`(12→15px) · `MoneyText muted` ·
 * `DataRow` 값 등 8곳이 이 방식으로 깨져 있었다. 화면마다 글자 크기가 반칸씩 다르게
 * 보이던 원인이 화면 코드가 아니라 여기였다. (→ D-044)
 *
 * `globals.css`의 `@theme`에 `--text-*`를 추가하면 **이 목록에도 같이 추가한다.**
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "display",
            "title",
            "section",
            "body",
            "body-sm",
            "caption",
            "money-lg",
            "money-md",
            "money-sm",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
