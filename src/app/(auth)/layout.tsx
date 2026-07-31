import type { ReactNode } from "react";

/**
 * 인증·온보딩 셸. 5탭 셸(`(app)/layout.tsx`)과 달리 **하단 탭이 없다** —
 * 아직 스페이스가 없어 갈 곳이 없기 때문이다.
 *
 * 세로 중앙 정렬이 아니라 상단에서 시작한다. 키보드가 올라올 때 필드가 가려지지 않게 하려는 것이다.
 * 좌우 패딩은 탭 화면(16px)보다 넓은 24px — 폼 한 벌만 놓이는 화면이라서다. (design-system.md 6-b)
 *
 * 웨시를 `body`가 아니라 이 컨테이너 안에 두는 이유: `body`는 5탭 셸과 공유된다.
 * 여기 두면 넓은 화면에서 `sm:border-x`와 함께 "로즈 톤 폰 프레임"으로 읽힌다.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative isolate mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 sm:border-x">
      {/* isolate 덕에 -z-10이 형제 콘텐츠 뒤 · 컨테이너 테두리 앞에 그려진다.
          inset-x-0은 패딩 박스 기준이라 sm:border-x를 덮지 않는다. */}
      <div
        aria-hidden
        className="auth-wash pointer-events-none absolute inset-x-0 top-0 -z-10 h-[340px]"
      />
      {children}
    </div>
  );
}
