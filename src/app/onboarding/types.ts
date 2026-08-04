/**
 * 온보딩 폼의 상태 타입 + **사용자에게 보이는 문구 전부**.
 *
 * `actions.ts`가 아니라 여기 있는 이유: `"use server"` 파일은 **async 함수만** export할 수 있다.
 * 상수 하나라도 같이 내보내면 빌드가 `invalid-use-server-value`로 실패한다.
 * (로그인의 `(auth)/login/types.ts`와 같은 이유·같은 구조다.)
 *
 * 문구를 한 곳에 모은 이유는 다른 데 있다 — 같은 실패를 **클라이언트가 먼저 잡는 경우**(형식·필수값)와
 * **서버 RPC가 잡는 경우**가 둘 다 있어서, 문구를 각자 적으면 같은 실수에 두 가지 말이 나간다.
 */

/** 에러를 특정 입력에 귀속시킬 수 있을 때의 그 입력. 값이 곧 DOM의 `id`다. */
export type OnboardingField = "code" | "displayName" | "side" | "weddingDate" | "totalBudget";

export type OnboardingState = {
  status: "idle" | "error";
  /**
   * 폼 상단 `FormAlert`에 뜨는 문구. **어느 입력을 고쳐야 할지 말할 수 없을 때**만 채운다
   * (이미 참여함, 스페이스가 꽉 참, 매핑 안 된 서버 오류). → D-037
   */
  alert?: string;
  /** 에러가 귀속되는 입력. 채우면 그 컨트롤 밑에 `fieldMessage`가 뜨고 포커스도 그리로 간다. */
  field?: OnboardingField;
  fieldMessage?: string;
  /** `alert` 아래에 [홈으로 가기]를 붙인다. 이미 스페이스가 있는 경우뿐이다. */
  offerHome?: boolean;
  /**
   * `INVALID_CODE` **연속** 실패 횟수. 2회째부터 상단에 만료·재사용 안내를 덧붙인다.
   * 첫 실패에 바로 "만료됐을 수 있어요"라고 하면 단순 오타인 사람을 헛걸음시킨다.
   */
  invalidCodeStreak?: number;
  /**
   * 코드 입력을 **비우기 위한** 토큰. 값이 바뀌면 화면이 코드 필드를 리마운트한다.
   *
   * `useEffect` 안에서 `setState`로 비우지 않는 이유: `react-hooks/set-state-in-effect`가
   * 이 저장소에서 error로 켜져 있다(연쇄 렌더 방지). 리마운트는 같은 결과를 내면서
   * "언제 비우는가"를 서버 응답 하나로 못 박는다.
   */
  codeResetToken?: number;
};

export const ONBOARDING_IDLE: OnboardingState = { status: "idle" };

/**
 * 표시 이름 상한. DB에는 길이 제약이 없다 — 1단계→2단계를 쿼리 파라미터로 넘기므로
 * 여기서 자르지 않으면 URL이 무한정 길어지고, 확인 화면의 `DataRow` 값 칸도 넘친다.
 */
export const MAX_DISPLAY_NAME = 20;

/* `MAX_TOTAL_BUDGET`은 `@/lib/couple-limits`로 옮겼다 — 설정 › 예식 정보가 같은 상한을 쓴다. */

/** 화면 문구. "올바르지 않습니다" 류를 쓰지 않는다 — 무엇이 잘못됐고 어떻게 고치는지 쓴다. */
export const ONBOARDING_COPY = {
  nameRequired: "이름을 입력해 주세요. 상대 화면에 이렇게 표시돼요.",
  sideRequired: "예랑 또는 예신을 골라 주세요.",
  weddingDateRequired: "예식일을 골라 주세요. 홈의 D-day가 이 날짜로 계산돼요.",
  /** 오타·만료·사용됨을 구분하지 않는 것은 RPC의 의도다(0007 주석). 첫 실패에는 짧게만 말한다. */
  codeNotFound: "코드를 찾을 수 없어요. 6자리를 다시 확인해 주세요.",
  codeStale: "코드가 만료됐거나 이미 사용됐을 수 있어요. 상대에게 새 코드를 받아 주세요.",
  coupleFull:
    "이 스페이스에는 이미 두 사람이 있어요. 코드를 보낸 분에게 확인해 주세요. 다른 코드가 있다면 위에 다시 입력할 수 있어요.",
  alreadyInCoupleJoin: "이미 스페이스에 참여해 있어요. 홈에서 바로 시작할 수 있어요.",
  alreadyInCoupleCreate: "이미 스페이스가 있어요. 홈에서 이어서 쓸 수 있어요.",
  budgetTooLarge: "총 예산이 너무 커요. 1조 원 미만으로 입력해 주세요.",
} as const;

/* `unexpectedMessage`는 `@/lib/rpc-error`로 옮겼다 — 초대·스페이스 관리도 같은 문장을 쓴다. */
